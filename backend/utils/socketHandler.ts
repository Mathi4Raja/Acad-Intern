import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';
import Application from '../models/Application';
import Notification from '../models/Notification';
import { createNotification } from './notificationService';
import User from '../models/User';
import Company from '../models/Company';

interface AuthSocket extends Socket {
    userId?: string;
    userRole?: string;
}

interface JwtPayload {
    id: string;
    role: string;
    email: string;
}

// Store active connections: userId -> socketId
const activeUsers = new Map<string, string>();

export const initializeSocket = (server: HTTPServer): SocketIOServer => {
    const io = new SocketIOServer(server, {
        cors: {
            // Allow all origins in development/test, or specific origins in production
            origin: process.env.NODE_ENV === 'production'
                ? (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(url => url.trim())
                : '*',
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Authentication middleware
    io.use(async (socket: AuthSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

            // Verify user exists
            const user = await User.findById(decoded.id);
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', async (socket: AuthSocket) => {
        // Get user details for logging
        const user = await User.findById(socket.userId);
        console.log(`✅ Socket.io User Connected: ${user?.name || 'Unknown'} (${socket.userRole}) - ${socket.id}`);
        console.log(`🔍 [DEBUG] User ID: ${socket.userId}, Role: ${socket.userRole}`);

        // Store active user
        if (socket.userId) {
            activeUsers.set(socket.userId, socket.id);
        }

        // Join application-specific rooms
        // Process pending messages (mark as delivered)
        const processPendingMessages = async () => {
            try {
                const pendingMessages = await Message.find({
                    receiverId: socket.userId,
                    status: 'sent'
                });

                if (pendingMessages.length > 0) {
                    console.log(`📦 [DELIVERY] Found ${pendingMessages.length} pending messages for ${user?.name}`);

                    // Group updates by application to avoid spamming events
                    const appIdsToNotify = new Set<string>();

                    for (const msg of pendingMessages) {
                        msg.status = 'delivered';
                        msg.deliveredAt = new Date();
                        await msg.save();
                        appIdsToNotify.add(msg.applicationId.toString());
                    }

                    // Notify relevant rooms
                    for (const appId of Array.from(appIdsToNotify)) {
                        io.to(`application:${appId}`).emit('messages-delivered', {
                            applicationId: appId,
                            userId: socket.userId
                        });
                        console.log(`   ✅ Notified app ${appId} of delivery`);
                    }
                }
            } catch (error) {
                console.error('Error processing pending messages:', error);
            }
        };
        processPendingMessages();

        socket.on('join-application', async (applicationId: string) => {
            console.log(`🔍 [DEBUG] ${user?.name} (${socket.userRole}) attempting to join application ${applicationId}`);
            try {
                // Verify user has access to this application
                const application = await Application.findById(applicationId)
                    .populate('internshipId');

                if (!application) {
                    socket.emit('error', { message: 'Application not found' });
                    return;
                }

                // Check if user is student or company owner
                const isStudent = application.studentId.toString() === socket.userId;
                console.log(`🔍 [DEBUG] User ${socket.userId} checking access to application ${applicationId}`);
                console.log(`🔍 [DEBUG] Application studentId: ${application.studentId}`);
                console.log(`🔍 [DEBUG] Is student: ${isStudent}`);

                // For company, check if the internship's company has this user
                let isCompany = false;
                if (socket.userRole === 'company' && application.internshipId) {
                    // Removed dynamic require
                    const internship = application.internshipId as any;

                    // console.log(`🔍 [DEBUG] Checking company access for internship: ${internship._id}`);

                    if (internship.companyId) {
                        const company = await Company.findOne({
                            _id: internship.companyId,
                            userId: socket.userId
                        });

                        // console.log(`🔍 [DEBUG] Company found: ${!!company}`);
                        if (company) {
                            // console.log(`🔍 [DEBUG] Company userId: ${company.userId}, Socket userId: ${socket.userId}`);
                            isCompany = true;
                        }
                    }
                }

                console.log(`🔍 [DEBUG] Final authorization - isStudent: ${isStudent}, isCompany: ${isCompany}`);

                if (!isStudent && !isCompany && socket.userRole !== 'admin') {
                    console.log(`❌ [DEBUG] Authorization failed for user ${socket.userId}`);
                    socket.emit('error', { message: 'Not authorized to access this conversation' });
                    return;
                }

                socket.join(`application:${applicationId}`);
                const user = await User.findById(socket.userId);
                console.log(`📨 [JOIN] ${user?.name} (${socket.userRole}) joined conversation for application ${applicationId}`);

                // Mark messages as delivered for this user
                const updateResult = await Message.updateMany(
                    {
                        applicationId,
                        receiverId: socket.userId,
                        status: 'sent'
                    },
                    {
                        status: 'delivered',
                        deliveredAt: new Date()
                    }
                );

                if (updateResult.modifiedCount > 0) {
                    // Notify sender about delivery
                    io.to(`application:${applicationId}`).emit('messages-delivered', {
                        applicationId,
                        userId: socket.userId
                    });
                }

                // Determine other party ID to check online status
                let otherPartyId: string | undefined;
                if (isStudent) {
                    // If current user is student, other party is company
                    // removed dynamic require
                    const company = await Company.findById((application.internshipId as any).companyId);
                    otherPartyId = company?.userId.toString();
                } else {
                    // If current user is company, other party is student
                    otherPartyId = application.studentId.toString();
                }

                // Check online status of other party
                let isOtherPartyOnline = false;
                if (otherPartyId) {
                    isOtherPartyOnline = activeUsers.has(otherPartyId);
                }

                // Emit joined event with status info
                socket.emit('joined-conversation', {
                    applicationId,
                    otherPartyId,
                    isOnline: isOtherPartyOnline
                });

                // Notify room that this user is online
                socket.to(`application:${applicationId}`).emit('user-status', {
                    userId: socket.userId,
                    isOnline: true,
                    applicationId
                });
            } catch (error) {
                console.error('Error joining application:', error);
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        // Leave application room
        socket.on('leave-application', async (applicationId: string) => {
            socket.leave(`application:${applicationId}`);
            const user = await User.findById(socket.userId);
            console.log(`🚪 [LEAVE] ${user?.name} left conversation for application ${applicationId}`);
        });

        // Send message
        socket.on('send-message', async (data: {
            applicationId: string;
            content: string;
            tempId?: string;
        }) => {
            try {
                const { applicationId, content, tempId } = data;
                const sender = await User.findById(socket.userId);
                console.log(`💬 [MESSAGE] ${sender?.name} sending: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);

                // Verify application and access
                const application = await Application.findById(applicationId)
                    .populate('internshipId')
                    .populate('studentId', 'name');

                if (!application) {
                    socket.emit('error', { message: 'Application not found', tempId });
                    return;
                }

                // Check if user is student or company owner
                const isStudent = application.studentId._id.toString() === socket.userId;

                // For company, check if the internship's company has this user
                let isCompany = false;
                let companyUserId = null;
                let companyDoc: any = null;
                if (socket.userRole === 'company' && application.internshipId) {
                    // Removed dynamic require
                    const company = await Company.findOne({
                        _id: (application.internshipId as any).companyId,
                        userId: socket.userId
                    });
                    isCompany = !!company;
                    if (company) {
                        companyUserId = company.userId;
                        companyDoc = company;
                    }
                }

                if (!isStudent && !isCompany) {
                    socket.emit('error', { message: 'Not authorized', tempId });
                    return;
                }

                // Determine receiver
                let receiverId;
                if (isStudent) {
                    // Student is sending to company - need to get company's userId
                    // Removed dynamic require
                    const company = await Company.findById((application.internshipId as any).companyId);
                    receiverId = company?.userId;
                } else {
                    // Company is sending to student
                    receiverId = application.studentId._id;
                }

                if (!receiverId) {
                    socket.emit('error', { message: 'Receiver not found', tempId });
                    return;
                }

                // Create message
                const message = await Message.create({
                    applicationId,
                    senderId: socket.userId,
                    receiverId: receiverId.toString(),
                    content,
                    attachments: [],
                    status: 'sent'
                });

                // Populate sender info
                await message.populate('senderId', 'name email role');

                // Check if receiver is online
                const receiverSocketId = activeUsers.get(receiverId.toString());

                let messageStatus = 'sent';

                if (receiverSocketId) {
                    // Receiver is online, mark as delivered
                    message.status = 'delivered';
                    message.deliveredAt = new Date();
                    await message.save();
                    messageStatus = 'delivered';
                }

                // Send message to all users in the room
                io.to(`application:${applicationId}`).emit('new-message', {
                    message,
                    tempId
                });

                const receiver = await User.findById(receiverId);
                console.log(`   ✅ Delivered to room | Status: ${message.status} | Receiver: ${receiver?.name || 'Unknown'}`);

                // Create notification for receiver
                const user = await User.findById(socket.userId);
                const senderDisplayName = (isCompany && companyDoc?.companyName)
                    ? companyDoc.companyName
                    : user?.name;
                await createNotification({
                    userId: receiverId,
                    type: 'general',
                    title: 'New Message',
                    message: `You have a new message from ${senderDisplayName}`,
                    payload: {
                        applicationId,
                        messageId: message._id
                    }
                });

                // Emit notification to receiver if online
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('new-notification', {
                        type: 'general',
                        applicationId
                    });

                    // Also emit conversation update for the list
                    io.to(receiverSocketId).emit('conversation-updated', {
                        applicationId,
                        message,
                        unreadCountIncrement: 1
                    });
                }
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message', tempId: data.tempId });
            }
        });

        // Mark messages as seen
        socket.on('mark-seen', async (data: { applicationId: string }) => {
            try {
                const { applicationId } = data;
                const user = await User.findById(socket.userId);
                console.log(`👁️  [SEEN] ${user?.name} marked messages as seen in application ${applicationId}`);

                // Verify access
                const application = await Application.findById(applicationId)
                    .populate('internshipId');

                if (!application) {
                    return;
                }

                // Check if user is student or company owner
                const isStudent = application.studentId.toString() === socket.userId;

                // For company, check if the internship's company has this user
                let isCompany = false;
                if (socket.userRole === 'company' && application.internshipId) {
                    // Removed dynamic require
                    const company = await Company.findOne({
                        _id: (application.internshipId as any).companyId,
                        userId: socket.userId
                    });
                    isCompany = !!company;
                }

                if (!isStudent && !isCompany && socket.userRole !== 'admin') {
                    return;
                }

                // Update messages
                await Message.updateMany(
                    {
                        applicationId,
                        receiverId: socket.userId,
                        status: { $in: ['sent', 'delivered'] }
                    },
                    {
                        status: 'seen',
                        seenAt: new Date()
                    }
                );

                // Notify sender about seen status
                io.to(`application:${applicationId}`).emit('messages-seen', {
                    applicationId,
                    userId: socket.userId
                });
            } catch (error) {
                console.error('Error marking messages as seen:', error);
            }
        });

        // Typing indicator
        socket.on('typing', async (data: { applicationId: string; isTyping: boolean }) => {
            const user = await User.findById(socket.userId);
            if (data.isTyping) {
                console.log(`✏️  [TYPING] ${user?.name} is typing...`);
            }
            socket.to(`application:${data.applicationId}`).emit('user-typing', {
                userId: socket.userId,
                isTyping: data.isTyping
            });
        });

        // Delete message
        socket.on('delete-message', async (data: { messageId: string; applicationId: string }) => {
            try {
                const { messageId, applicationId } = data;
                const message = await Message.findById(messageId);

                if (!message) return;

                // Only sender can delete
                if (message.senderId.toString() !== socket.userId) {
                    socket.emit('error', { message: 'Not authorized to delete this message' });
                    return;
                }

                // Soft delete: Preserve content for admin review (only unmasked if reported)
                message.isDeleted = true;
                message.deletedAt = new Date();
                await message.save();

                // Notify room
                io.to(`application:${applicationId}`).emit('message-deleted', {
                    messageId,
                    applicationId
                });
                console.log(`🗑️  [DELETE] Message ${messageId} deleted by ${socket.userId}`);

            } catch (error) {
                console.error('Error deleting message:', error);
                socket.emit('error', { message: 'Failed to delete message' });
            }
        });

        // Disconnect
        socket.on('disconnecting', () => {
            // Notify rooms that user is going offline
            for (const room of socket.rooms) {
                if (room.startsWith('application:')) {
                    const applicationId = room.split(':')[1];
                    socket.to(room).emit('user-status', {
                        userId: socket.userId,
                        isOnline: false,
                        applicationId
                    });
                }
            }
        });

        socket.on('disconnect', async () => {
            const user = await User.findById(socket.userId);
            if (socket.userId) {
                activeUsers.delete(socket.userId);
            }
            console.log(`❌ Socket.io User Disconnected: ${user?.name || 'Unknown'} (${socket.userRole}) - ${socket.id}`);
        });
    });

    return io;
};

export { activeUsers };
