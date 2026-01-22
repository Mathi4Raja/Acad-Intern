import { Request, Response, NextFunction } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import UserStatus from '../models/UserStatus';
import mongoose from 'mongoose';
import multer from 'multer';
import { uploadToR2 } from '../utils/r2Storage';

// @desc    Get all conversations for the current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;

        const conversations = await Conversation.find({
            participants: userId
        })
            .populate('participants', 'name email role')
            .populate('lastMessage', 'content messageType fileName createdAt senderId')
            .populate('typingUsers', 'name')
            .sort({ lastMessageAt: -1 });

        // Format conversations for frontend
        const formatted = await Promise.all(conversations.map(async (conv) => {
            // Get the other participant
            const otherParticipant = conv.participants.find(
                (p: any) => p._id.toString() !== userId
            ) as any;

            // Get unread count for current user
            const unreadCount = conv.unreadCounts?.get(userId.toString()) || 0;

            // Get online status
            const userStatus = await UserStatus.findOne({ userId: otherParticipant?._id });
            const isOnline = userStatus?.isOnline || false;

            // Get participant role (for display)
            let participantRole = 'User';
            if (otherParticipant?.role === 'student') {
                participantRole = 'Student';
            } else if (otherParticipant?.role === 'company') {
                participantRole = 'Company';
            }

            // Get typing users (excluding current user)
            const typingUsers = conv.typingUsers?.filter((u: any) => u._id.toString() !== userId) || [];

            return {
                id: conv._id,
                participantId: otherParticipant?._id,
                participantName: otherParticipant?.name || 'Unknown User',
                participantEmail: otherParticipant?.email,
                participantRole,
                lastMessage: (conv.lastMessage as any)?.content ||
                    (conv.lastMessage && (conv.lastMessage as any).messageType === 'file' ?
                        `📎 ${(conv.lastMessage as any).fileName}` : ''),
                lastMessageTime: conv.lastMessageAt,
                unreadCount,
                isOnline,
                typingUsers: typingUsers.map((u: any) => ({ id: u._id, name: u.name }))
            };
        }));

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get or create a conversation with a user
// @route   POST /api/messages/conversations
// @access  Private
export const getOrCreateConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { participantId } = req.body;

        if (!participantId) {
            return res.status(400).json({
                success: false,
                message: 'Participant ID is required'
            });
        }

        if (participantId === userId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create conversation with yourself'
            });
        }

        // Check if participant exists
        const participant = await User.findById(participantId);
        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find existing conversation or create new one
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, participantId], $size: 2 }
        }).populate('participants', 'name email role');

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, participantId]
            });
            conversation = await conversation.populate('participants', 'name email role');
        }

        const otherParticipant = conversation.participants.find(
            (p: any) => p._id.toString() !== userId
        ) as any;

        res.status(200).json({
            success: true,
            data: {
                id: conversation._id,
                participantId: otherParticipant?._id,
                participantName: otherParticipant?.name || 'Unknown User',
                participantEmail: otherParticipant?.email,
                participantRole: otherParticipant?.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/conversations/:conversationId
// @access  Private
export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { conversationId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        // Verify user is part of this conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        const messages = await Message.find({ conversationId })
            .populate('senderId', 'name')
            .populate('readBy', 'name')
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Format for frontend
        const formatted = messages.map((msg) => ({
            id: msg._id,
            senderId: (msg.senderId as any)?._id,
            senderName: (msg.senderId as any)?.name || 'Unknown',
            message: msg.content,
            messageType: msg.messageType,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            fileType: msg.fileType,
            status: msg.status,
            readBy: msg.readBy?.map((u: any) => ({ id: u._id, name: u.name })) || [],
            timestamp: msg.createdAt,
            isOwn: (msg.senderId as any)?._id?.toString() === userId
        }));

        res.status(200).json({
            success: true,
            count: formatted.length,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Send a message
// @route   POST /api/messages/conversations/:conversationId
// @access  Private
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { conversationId } = req.params;
        const { content, messageType = 'text', fileData } = req.body;
        const io = req.app.get('io');

        if (messageType === 'text' && (!content || !content.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        if (messageType === 'file' && !fileData) {
            return res.status(400).json({
                success: false,
                message: 'File data is required for file messages'
            });
        }

        // Verify user is part of this conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        // Create message
        let messageData: any = {
            conversationId,
            senderId: userId,
            messageType,
            status: 'sent'
        };

        if (messageType === 'text') {
            messageData.content = content.trim();
        } else if (messageType === 'file') {
            messageData.content = fileData.caption || '';
            messageData.fileUrl = fileData.url;
            messageData.fileName = fileData.name;
            messageData.fileSize = fileData.size;
            messageData.fileType = fileData.type;
        }

        const message = await Message.create(messageData);

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
            $inc: { [`unreadCounts.${userId}`]: 0 } // Reset sender's unread count
        });

        // Increment unread counts for other participants
        const otherParticipants = conversation.participants.filter((p: any) => !p.equals(userId));
        for (const participantId of otherParticipants) {
            await Conversation.findByIdAndUpdate(conversationId, {
                $inc: { [`unreadCounts.${participantId}`]: 1 }
            });
        }

        // Populate sender info
        await message.populate('senderId', 'name');

        const messageResponse = {
            id: message._id,
            senderId: (message.senderId as any)?._id,
            senderName: (message.senderId as any)?.name,
            message: message.content,
            messageType: message.messageType,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileSize: message.fileSize,
            fileType: message.fileType,
            status: message.status,
            timestamp: message.createdAt,
            isOwn: false
        };

        // Emit to socket room if IO is available
        if (io) {
            io.to(`conversation_${conversationId}`).emit('new_message', messageResponse);

            // Mark Delivery if recipient is online
            for (const participantId of otherParticipants) {
                const participantStatus = await UserStatus.findOne({ userId: participantId });
                if (participantStatus?.isOnline) {
                    await Message.findByIdAndUpdate(message._id, {
                        status: 'delivered',
                        $addToSet: { readBy: participantId }
                    });

                    io.to(`conversation_${conversationId}`).emit('message_delivered', {
                        messageId: message._id,
                        userId: participantId
                    });
                }
            }
        }

        res.status(201).json({
            success: true,
            data: {
                ...messageResponse,
                isOwn: true
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload a file for messaging
// @route   POST /api/messages/upload
// @access  Private
export const uploadMessageFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.file;

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 10MB.'
            });
        }

        // Validate file type
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
            // Archives
            'application/zip',
            'application/x-rar-compressed'
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'File type not allowed. Supported types: images, PDF, Word, Excel, text files, and archives.'
            });
        }

        // Upload to R2
        const uploadResult = await uploadToR2(
            file.buffer,
            file.originalname,
            file.mimetype
        );

        res.status(200).json({
            success: true,
            data: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                name: file.originalname,
                size: file.size,
                type: file.mimetype,
                format: uploadResult.format
            }
        });

    } catch (error) {
        console.error('File upload error:', error);
        next(error);
    }
};

// @desc    Start a conversation with a company (for students)
// @route   POST /api/messages/start-with-company/:companyUserId
// @access  Private (Students only)
export const startConversationWithCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { companyUserId } = req.params;
        const { initialMessage } = req.body;

        // Verify company user exists and is a company
        const companyUser = await User.findOne({ _id: companyUserId, role: 'company' });
        if (!companyUser) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [userId, companyUserId], $size: 2 }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [userId, companyUserId]
            });
        }

        // Send initial message if provided
        if (initialMessage && initialMessage.trim()) {
            const message = await Message.create({
                conversationId: conversation._id,
                senderId: userId,
                content: initialMessage.trim()
            });

            await Conversation.findByIdAndUpdate(conversation._id, {
                lastMessage: message._id,
                lastMessageAt: new Date()
            });
        }

        res.status(200).json({
            success: true,
            data: {
                conversationId: conversation._id
            }
        });
    } catch (error) {
        next(error);
    }
};
