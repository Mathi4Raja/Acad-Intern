import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Message from '../models/Message';
import Application from '../models/Application';
import Notification from '../models/Notification';
import { createNotification } from '../utils/notificationService';
import SystemSetting from '../models/SystemSetting';
import ConversationPreference from '../models/ConversationPreference';
import { AuthRequest } from '../types';
import { uploadToR2 } from '../utils/r2Storage';
import { activeUsers } from '../utils/socketHandler';
import User from '../models/User';
import { sendEmail } from '../utils/emailService';

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

        // Filter out deleted conversations
        const preferences = await ConversationPreference.find({
            userId,
            applicationId: { $in: applications.map((a: any) => a._id) }
        });

        const deletedMap = new Map();
        preferences.forEach(p => {
            if (p.deletedAt) deletedMap.set(p.applicationId.toString(), p.deletedAt);
        });

        const visibleConversations = conversations.filter(c => {
            if (!c.lastMessage) return false; // Hide empty conversations too
            const deletedAt = deletedMap.get(c.application._id.toString());
            // If deletedAt exists and is newer than last message, hide it
            if (deletedAt && new Date(deletedAt) > new Date(c.lastMessage.createdAt)) {
                return false;
            }
            return true;
        });

        // Sort by last message time
        visibleConversations.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt?.getTime() || 0;
            const timeB = b.lastMessage?.createdAt?.getTime() || 0;
            return timeB - timeA;
        });

        // Check for reports for admin visibility unmasking
        const Report = require('../models/Report').default;
        const processedConversations = await Promise.all(visibleConversations.map(async (conv: any) => {
            if (conv.lastMessage?.isDeleted) {
                const hasActiveReport = req.user?.role === 'admin' && await Report.exists({
                    applicationId: conv.application._id,
                    status: { $in: ['open', 'under_review'] }
                });

                if (!(req.user?.role === 'admin' && hasActiveReport)) {
                    conv.lastMessage.content = 'This message was deleted';
                    conv.lastMessage.attachments = [];
                }
            }
            return conv;
        }));

        res.status(200).json({
            success: true,
            data: processedConversations
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

        if (!isStudent && !isCompany && req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Not authorized to access these messages'
            });
            return;
        }

        // Get messages
        let messages = await Message.find({ applicationId })
            .populate('senderId', 'name email role')
            .sort({ createdAt: 1 });

        // Admin Visibility Logic: Check for active reports if admin
        const Report = require('../models/Report').default;
        const hasActiveReport = req.user?.role === 'admin' && await Report.exists({
            applicationId,
            status: { $in: ['open', 'under_review'] }
        });

        // Mask deleted messages for non-authorized users
        messages = messages.map(msg => {
            const msgObj = msg.toObject() as any;
            if (msgObj.isDeleted) {
                if (req.user?.role === 'admin' && hasActiveReport) {
                    // Admin can see it, but mark it clearly
                    msgObj.wasDeleted = true;
                } else {
                    // Standard masking
                    msgObj.content = 'This message was deleted';
                    msgObj.attachments = [];
                }
            }
            return msgObj;
        });

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

        // MODERATION: Scan for keywords
        if (content) {
            const { scanContent, createAutomatedFlag } = require('../utils/moderationService');
            const contentScan = scanContent(content);
            if (contentScan.flagged) {
                await createAutomatedFlag({
                    reportedUserId: userId,
                    applicationId: applicationId as any,
                    category: 'spam',
                    subject: 'Potentially Prohibited Message Content',
                    body: `Message in application context triggered automated flag.`,
                    metadata: { matches: contentScan.matches, sample: content.substring(0, 100) }
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
            // Determine display name for notification
            const senderName = (isCompany && companyDoc?.companyName) ? companyDoc.companyName : req.user?.name;

            // Create notification for receiver
            await createNotification({
                userId: receiverId,
                type: 'general',
                title: 'New Message',
                message: `You have a new message from ${senderName}`,
                payload: {
                    applicationId,
                    messageId: message._id,
                    senderName,
                    route: `/messages?applicationId=${applicationId}`
                }
            });
        }

        // Message Count Alert (Send email when they reach the unread message threshold)
        const countSetting = await SystemSetting.findOne({ key: 'unreadMessageAlertCount' });
        const alertThreshold = Number(countSetting?.value) || 3;

        const unreadCount = await Message.countDocuments({
            receiverId: receiverId,
            status: { $ne: 'seen' }
        });

        if (unreadCount === alertThreshold) {
            const receiver = await User.findById(receiverId);
            if (receiver && receiver.email) {
                const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
                const rolePath = receiver.role === 'company' ? 'company' : 'student';
                const messagesUrl = `${frontendUrl}/${rolePath}/messages`;

                // Get site name for email
                const siteNameSetting = await SystemSetting.findOne({ key: 'siteName' });
                const siteName = siteNameSetting?.value || 'AcadIntern';

                const alertHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; overflow: hidden; margin-top: 20px; }
        .header { background: #ffffff; padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid #f3f4f6; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .content p { font-size: 15px; color: #4b5563; margin: 0 0 20px; }
        .alert-box { background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #dbeafe; }
        .alert-text { color: #1e40af; font-weight: 700; font-size: 18px; }
        .button-wrapper { text-align: center; margin: 32px 0 8px; }
        .button { display: inline-block; padding: 14px 32px; background-color: #111827; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Unread Messages</h1>
            </div>
            <div class="content">
                <p>Hi ${receiver.name},</p>
                <p>You have new messages waiting for you on ${siteName}.</p>
                
                <div class="alert-box">
                    <div class="alert-text">${alertThreshold}+ New Messages</div>
                </div>
 
                <p>Don't miss out on important updates or questions from your connections.</p>
                
                <div class="button-wrapper">
                    <a href="${messagesUrl}" class="button">View Messages</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
                `;

                try {
                    await sendEmail({
                        to: receiver.email,
                        subject: `You have new unread messages on ${siteName}`,
                        text: `Hi ${receiver.name}, you have ${alertThreshold} unread messages on ${siteName}. Visit ${messagesUrl} to view them.`,
                        html: alertHtml,
                        type: 'message_alert'
                    });
                } catch (emailError) {
                    console.error('Message alert email failed to send:', emailError);
                }
            }
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

        if (!isStudent && !isCompany && req.user?.role !== 'admin') {
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

// @desc    Delete conversation (soft delete for user, hard delete if both deleted)
// @route   DELETE /api/messages/application/:applicationId
// @access  Private
export const deleteConversation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { applicationId } = req.params;
        const userId = req.user?._id;

        // 1. Soft delete for current user
        await ConversationPreference.findOneAndUpdate(
            { userId, applicationId },
            {
                deletedAt: new Date()
            },
            { upsert: true, new: true }
        );

        // 2. Check if other party has also deleted
        // First get the application to know who the other party is
        const application = await Application.findById(applicationId);
        if (application) {
            let otherPartyId;
            if (req.user?.role === 'student') {
                const Company = require('../models/Company').default;
                // Need to get company userId
                // Using any cast to access internshipId logic
                const internshipId: any = application.internshipId;
                // Since we didn't populate, internshipId is an ID string or ObjectId
                // We need to fetch the internship first to get companyId
                const Internship = require('../models/Internship').default;
                const internship = await Internship.findById(internshipId);

                if (internship) {
                    const company = await Company.findById(internship.companyId);
                    otherPartyId = company?.userId;
                }
            } else {
                otherPartyId = application.studentId;
            }

            if (otherPartyId) {
                const otherPreference = await ConversationPreference.findOne({
                    userId: otherPartyId,
                    applicationId
                });

                if (otherPreference && otherPreference.deletedAt) {
                    // Both have deleted. Check if there are any messages sent AFTER the other party deleted.
                    const lastMessage = await Message.findOne({ applicationId })
                        .sort({ createdAt: -1 });

                    if (!lastMessage || new Date(lastMessage.createdAt) < new Date(otherPreference.deletedAt)) {
                        // Safe to hard delete!
                        await Message.deleteMany({ applicationId });
                        console.log(`[HARD DELETE] Messages for application ${applicationId} permanently deleted.`);
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Conversation deleted'
        });
    } catch (error) {
        next(error);
    }
};
