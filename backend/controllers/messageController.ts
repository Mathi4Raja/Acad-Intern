import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Message from '../models/Message';
import Application from '../models/Application';
import Notification from '../models/Notification';
import SystemSetting from '../models/SystemSetting';
import ConversationPreference from '../models/ConversationPreference';
import { AuthRequest } from '../types';
import { uploadToR2 } from '../utils/r2Storage';
import { activeUsers } from '../utils/socketHandler';

// @desc    Get all conversations for a user (grouped by application)
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?._id;
        const StudentProfile = require('../models/StudentProfile').default;

        // Get all applications where user is either student or company owner
        let applications;
        if (req.user?.role === 'student') {
            applications = await Application.find({ studentId: userId })
                .populate({
                    path: 'internshipId',
                    populate: {
                        path: 'companyId',
                        select: 'companyName logo userId',
                        populate: {
                            path: 'userId',
                            select: 'name email'
                        }
                    }
                })
                .populate('studentId', 'name email')
                .sort({ appliedAt: -1 });
        } else if (req.user?.role === 'company') {
            // First, find the company profile for this user
            const Company = require('../models/Company').default;
            const company = await Company.findOne({ userId });

            if (!company) {
                res.status(404).json({
                    success: false,
                    message: 'Company profile not found'
                });
                return;
            }

            // Find all internships by this company
            const Internship = require('../models/Internship').default;
            const internships = await Internship.find({ companyId: company._id });
            const internshipIds = internships.map((i: any) => i._id);

            // Find applications for these internships
            applications = await Application.find({ internshipId: { $in: internshipIds } })
                .populate({
                    path: 'internshipId',
                    populate: {
                        path: 'companyId',
                        select: 'companyName logo userId',
                        populate: {
                            path: 'userId',
                            select: 'name email'
                        }
                    }
                })
                .populate('studentId', 'name email')
                .sort({ appliedAt: -1 });
        } else {
            res.status(403).json({
                success: false,
                message: 'Only students and companies can access messages'
            });
            return;
        }

        // Get student profile pictures for all students in one query
        const studentIds = applications.map((app: any) => app.studentId?._id || app.studentId);
        const studentProfiles = await StudentProfile.find({ userId: { $in: studentIds } })
            .select('userId profilePicture');

        // Create a map of userId -> profilePicture
        const profilePictureMap = new Map();
        studentProfiles.forEach((profile: any) => {
            profilePictureMap.set(profile.userId.toString(), profile.profilePicture);
        });

        // Get last message and unread count for each application
        const conversations = await Promise.all(
            applications.map(async (app: any) => {
                const lastMessage = await Message.findOne({ applicationId: app._id })
                    .sort({ createdAt: -1 });

                const unreadCount = await Message.countDocuments({
                    applicationId: app._id,
                    receiverId: userId,
                    status: { $ne: 'seen' }
                });

                // Get the student's profile picture
                const studentId = app.studentId?._id?.toString() || app.studentId?.toString();
                const studentProfilePicture = profilePictureMap.get(studentId) || null;

                return {
                    application: app,
                    lastMessage,
                    unreadCount,
                    studentProfilePicture,
                    companyLogo: app.internshipId?.companyId?.logo || null
                };
            })
        );

        // Sort by last message time
        conversations.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt?.getTime() || 0;
            const timeB = b.lastMessage?.createdAt?.getTime() || 0;
            return timeB - timeA;
        });

        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error) {
        next(error);
    }
};


// @desc    Get messages for a specific application
// @route   GET /api/messages/application/:applicationId
// @access  Private
export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const userId = req.user?._id;

        // Verify user has access to this application
        const application = await Application.findById(applicationId)
            .populate('internshipId');

        if (!application) {
            res.status(404).json({
                success: false,
                message: 'Application not found'
            });
            return;
        }

        // Check if user is student or company owner
        const isStudent = application.studentId.toString() === userId?.toString();

        // For company, check if the internship's company has this user
        let isCompany = false;
        if (req.user?.role === 'company' && application.internshipId) {
            const Company = require('../models/Company').default;
            const company = await Company.findOne({
                _id: (application.internshipId as any).companyId,
                userId: userId
            });
            isCompany = !!company;
        }

        if (!isStudent && !isCompany) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to access these messages'
            });
            return;
        }

        // Get messages
        const messages = await Message.find({ applicationId })
            .populate('senderId', 'name email role')
            .sort({ createdAt: 1 });

        // Mark messages as delivered if user is receiver
        await Message.updateMany(
            {
                applicationId,
                receiverId: userId,
                status: 'sent'
            },
            {
                status: 'delivered',
                deliveredAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send a message
// @route   POST /api/messages/application/:applicationId
// @access  Private
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const { content } = req.body;
        const userId = req.user?._id;

        // Verify application exists and user has access
        const application = await Application.findById(applicationId)
            .populate('internshipId')
            .populate('studentId', 'name');

        if (!application) {
            res.status(404).json({
                success: false,
                message: 'Application not found'
            });
            return;
        }

        // Check if user is student or company owner
        const isStudent = application.studentId._id.toString() === userId?.toString();

        // For company, check if the internship's company has this user
        let isCompany = false;
        let companyDoc = null;
        if (req.user?.role === 'company' && application.internshipId) {
            const Company = require('../models/Company').default;
            companyDoc = await Company.findOne({
                _id: (application.internshipId as any).companyId,
                userId: userId
            });
            isCompany = !!companyDoc;
        }

        if (!isStudent && !isCompany) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to send messages for this application'
            });
            return;
        }

        // Determine receiver
        let receiverId;
        if (isStudent) {
            // Student is sending to company - need to get company's userId
            const Company = require('../models/Company').default;
            const company = await Company.findById((application.internshipId as any).companyId);
            receiverId = company?.userId;
        } else {
            // Company is sending to student
            receiverId = application.studentId._id;
        }

        // Validate content or attachments
        if (!content && (!req.files || (req.files as any).length === 0)) {
            res.status(400).json({
                success: false,
                message: 'Message must have content or attachments'
            });
            return;
        }

        // Handle file attachments
        const attachments: any[] = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            // DYNAMIC SIZE CHECK
            const SystemSetting = require('../models/SystemSetting').default;
            const sizeSetting = await SystemSetting.findOne({ key: 'maxMessageSize' });
            // Default to 15MB if not set
            const maxSizeBytes = sizeSetting ? (Number(sizeSetting.value) * 1024 * 1024) : 15 * 1024 * 1024;

            for (const file of req.files) {
                if (file.size > maxSizeBytes) {
                    res.status(400).json({
                        success: false,
                        message: `File ${file.originalname} exceeds the limit of ${sizeSetting?.value || 15}MB`
                    });
                    return;
                }

                // Upload to R2
                const uploadResult = await uploadToR2(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    `${userId}_${Date.now()}`,
                    undefined,
                    'message'
                );

                attachments.push({
                    fileUrl: uploadResult.secure_url,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype
                });
            }
        }

        // Create message
        const message = await Message.create({
            applicationId,
            senderId: userId,
            receiverId,
            content: content || '',
            attachments,
            status: 'sent'
        });

        // Populate sender info
        await message.populate('senderId', 'name email role');

        // Socket.io integration
        const io = req.app.get('io');
        const receiverSocketId = activeUsers.get(receiverId.toString());

        if (receiverSocketId) {
            // Receiver is online, mark as delivered
            message.status = 'delivered';
            message.deliveredAt = new Date();
            await message.save();
        }

        if (io) {
            // Emit new message to room
            io.to(`application:${applicationId}`).emit('new-message', {
                message
            });

            // Emit notification if receiver is online
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('new-notification', {
                    type: 'general',
                    applicationId
                });

                io.to(receiverSocketId).emit('conversation-updated', {
                    applicationId,
                    message,
                    unreadCountIncrement: 1
                });
            }
        }

        // Check if receiver has muted this conversation
        const preferences = await ConversationPreference.findOne({
            userId: receiverId,
            applicationId: applicationId
        });

        const isMuted = preferences && preferences.mutedUntil && preferences.mutedUntil > new Date();

        if (!isMuted) {
            // Create notification for receiver
            await Notification.create({
                userId: receiverId,
                type: 'general',
                title: 'New Message',
                message: `You have a new message from ${req.user?.name}`,
                payload: {
                    applicationId,
                    messageId: message._id
                },
                read: false
            });
        }

        res.status(201).json({
            success: true,
            data: message
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark messages as seen
// @route   PATCH /api/messages/application/:applicationId/seen
// @access  Private
export const markAsSeen = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const userId = req.user?._id;

        // Verify access to application
        const application = await Application.findById(applicationId)
            .populate('internshipId');

        if (!application) {
            res.status(404).json({
                success: false,
                message: 'Application not found'
            });
            return;
        }

        // Check if user is student or company owner
        const isStudent = application.studentId.toString() === userId?.toString();

        // For company, check if the internship's company has this user
        let isCompany = false;
        if (req.user?.role === 'company' && application.internshipId) {
            const Company = require('../models/Company').default;
            const company = await Company.findOne({
                _id: (application.internshipId as any).companyId,
                userId: userId
            });
            isCompany = !!company;
        }

        if (!isStudent && !isCompany) {
            res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
            return;
        }

        // Update messages
        await Message.updateMany(
            {
                applicationId,
                receiverId: userId,
                status: { $in: ['sent', 'delivered'] }
            },
            {
                status: 'seen',
                seenAt: new Date()
            }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as seen'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?._id;

        const unreadCount = await Message.countDocuments({
            receiverId: userId,
            status: { $ne: 'seen' }
        });

        res.status(200).json({
            success: true,
            data: { unreadCount }
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Update conversation preferences (mute/unmute)
// @route   POST /api/messages/application/:applicationId/mute
// @access  Private
export const muteConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const { mutedUntil } = z.object({
            mutedUntil: z.string().datetime().nullable()
        }).parse(req.body);

        const userId = req.user?._id;

        const preferences = await ConversationPreference.findOneAndUpdate(
            { userId, applicationId },
            {
                mutedUntil: mutedUntil ? new Date(mutedUntil) : null
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            data: preferences
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
            return;
        }
        next(error);
    }
};

// @desc    Get conversation preferences
// @route   GET /api/messages/application/:applicationId/preferences
// @access  Private
export const getPreferences = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const userId = req.user?._id;

        const preferences = await ConversationPreference.findOne({ userId, applicationId });

        res.status(200).json({
            success: true,
            data: preferences || { mutedUntil: null }
        });
    } catch (error) {
        next(error);
    }
};
