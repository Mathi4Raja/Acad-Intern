import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth';
import internshipRoutes from './routes/internships';
import applicationRoutes from './routes/applications';
import companyRoutes from './routes/companies';
import studentRoutes from './routes/students';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import messageRoutes from './routes/messages';

// Model imports for Socket.IO
import UserStatus from './models/UserStatus';
import Conversation from './models/Conversation';
import Message from './models/Message';
import User from './models/User';

// Initialize Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
    cors: {
        origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(url => url.trim()),
        credentials: true
    }
});

// Make io accessible to router
app.set('io', io);

// Connect to MongoDB (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Rate limiting - higher limit for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 100000, // 100k for dev
    message: 'Too many requests from this IP, please try again later',
    validate: { xForwardedForHeader: false } // Disable validation for devtunnels/proxies
});

// Trust proxy for rate limiting when behind a proxy (devtunnels, nginx, etc.)
app.set('trust proxy', 1);

// Apply middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(url => url.trim());

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked CORS Origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/', limiter);

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
    try {
        let token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token && socket.handshake.headers.cookie) {
            const cookies = socket.handshake.headers.cookie.split(';');
            const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
            if (tokenCookie) {
                token = tokenCookie.split('=')[1]?.trim();
            }
        }

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.data.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// Socket.IO connection handler
io.on('connection', async (socket) => {
    const user = socket.data.user;
    console.log(`User ${user.name} (${user._id}) connected with socket ${socket.id}`);

    try {
        // Update user status to online
        await UserStatus.findOneAndUpdate(
            { userId: user._id },
            {
                isOnline: true,
                socketId: socket.id,
                lastSeen: new Date()
            },
            { upsert: true, new: true }
        );

        // Join user's conversations
        const conversations = await Conversation.find({ participants: user._id });
        conversations.forEach(conv => {
            socket.join(`conversation_${conv._id}`);
        });

        // Notify other participants that user is online
        for (const conv of conversations) {
            const otherParticipants = conv.participants.filter((p: any) => !p.equals(user._id));
            for (const participantId of otherParticipants) {
                const participantStatus = await UserStatus.findOne({ userId: participantId });
                if (participantStatus?.socketId) {
                    io.to(participantStatus.socketId).emit('user_online', {
                        userId: user._id,
                        conversationId: conv._id
                    });
                }
            }
        }

        // Handle joining a conversation
        socket.on('join_conversation', async (conversationId) => {
            socket.join(`conversation_${conversationId}`);
        });

        // Handle leaving a conversation
        socket.on('leave_conversation', async (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
        });

        // Handle sending a message
        socket.on('send_message', async (data) => {
            try {
                const { conversationId, content, messageType = 'text', fileData } = data;

                // Verify user is part of conversation
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: user._id
                });

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
                    return;
                }

                let messageData: any = {
                    conversationId,
                    senderId: user._id,
                    messageType,
                    status: 'sent'
                };

                if (messageType === 'text') {
                    messageData.content = content?.trim();
                } else if (messageType === 'file' && fileData) {
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
                    $inc: { [`unreadCounts.${user._id}`]: 0 } // Reset sender's unread count
                });

                // Increment unread counts for other participants
                const otherParticipants = conversation.participants.filter((p: any) => !p.equals(user._id));
                for (const participantId of otherParticipants) {
                    await Conversation.findByIdAndUpdate(conversationId, {
                        $inc: { [`unreadCounts.${participantId}`]: 1 }
                    });
                }

                // Populate message data
                await message.populate('senderId', 'name');

                const messageResponse = {
                    id: message._id,
                    senderId: (message.senderId as any)._id,
                    senderName: (message.senderId as any).name,
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

                // Send to all participants in the conversation
                io.to(`conversation_${conversationId}`).emit('new_message', messageResponse);

                // Mark as delivered for online users
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

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', async (conversationId) => {
            try {
                // Add user to typing users
                await Conversation.findByIdAndUpdate(conversationId, {
                    $addToSet: { typingUsers: user._id }
                });

                // Notify other participants
                socket.to(`conversation_${conversationId}`).emit('user_typing', {
                    userId: user._id,
                    userName: user.name,
                    conversationId
                });
            } catch (error) {
                console.error('Error handling typing start:', error);
            }
        });

        socket.on('typing_stop', async (conversationId) => {
            try {
                // Remove user from typing users
                await Conversation.findByIdAndUpdate(conversationId, {
                    $pull: { typingUsers: user._id }
                });

                // Notify other participants
                socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
                    userId: user._id,
                    conversationId
                });
            } catch (error) {
                console.error('Error handling typing stop:', error);
            }
        });

        // Handle message read
        socket.on('mark_as_read', async (data) => {
            try {
                const { conversationId, messageIds } = data;

                await Message.updateMany(
                    {
                        _id: { $in: messageIds },
                        conversationId,
                        senderId: { $ne: user._id },
                        status: { $ne: 'read' }
                    },
                    {
                        status: 'read',
                        readAt: new Date(),
                        $addToSet: { readBy: user._id }
                    }
                );

                // Reset unread count for this user
                await Conversation.findByIdAndUpdate(conversationId, {
                    $set: { [`unreadCounts.${user._id}`]: 0 }
                });

                // Notify sender that messages were read
                socket.to(`conversation_${conversationId}`).emit('messages_read', {
                    messageIds,
                    userId: user._id,
                    conversationId
                });

            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`User ${user.name} (${user._id}) disconnected`);

            try {
                // Update user status to offline
                await UserStatus.findOneAndUpdate(
                    { userId: user._id },
                    {
                        isOnline: false,
                        lastSeen: new Date(),
                        $unset: { socketId: 1 }
                    }
                );

                // Notify conversations that user went offline
                const conversations = await Conversation.find({ participants: user._id });
                for (const conv of conversations) {
                    const otherParticipants = conv.participants.filter((p: any) => !p.equals(user._id));
                    for (const participantId of otherParticipants) {
                        const participantStatus = await UserStatus.findOne({ userId: participantId });
                        if (participantStatus?.socketId) {
                            io.to(participantStatus.socketId).emit('user_offline', {
                                userId: user._id,
                                conversationId: conv._id
                            });
                        }
                    }
                }

            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });

    } catch (error) {
        console.error('Error in socket connection:', error);
        socket.disconnect();
    }
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server (only if not in test mode)
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        console.log(`📡 Socket.IO enabled for real-time messaging`);
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    process.exit(1);
});

export { app, server, io };
