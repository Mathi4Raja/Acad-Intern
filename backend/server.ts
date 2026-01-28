import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';
import { isR2Configured } from './utils/r2Storage';
import axios from 'axios';

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
import { initializeSocket } from './utils/socketHandler';

// Initialize Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);
console.log('✅ Socket.io Server Initialized');
app.set('io', io);

// Connect to MongoDB (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

// Validate Cloudflare R2 configuration
if (process.env.NODE_ENV !== 'test' && !isR2Configured()) {
    console.warn('⚠️  Cloudflare R2 is not properly configured. File uploads will fail.');
    console.warn('   Required env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL');
}

// Rate limiting - higher limit for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 100000, // 100k for dev
    message: 'Too many requests from this IP, please try again later',
    validate: { xForwardedForHeader: false } // Disable validation for proxies
});

// Trust proxy for rate limiting when behind a proxy (nginx, load balancers, etc.)
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

        // Keep Render backend active (only in production)
        if (process.env.NODE_ENV === 'production') {
            const url = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SOCKET_URL;

            if (url) {
                const interval = 14 * 60 * 1000; // 14 minutes

                console.log(`🔄 Setting up keep-alive ping for ${url}`);

                // Initial ping
                setTimeout(() => {
                    axios.get(`${url}/health`)
                        .then(() => console.log('✅ Self-ping successful'))
                        .catch((err: any) => console.error('❌ Self-ping failed:', err.message));
                }, 5000);

                setInterval(() => {
                    axios.get(`${url}/health`)
                        .then(() => console.log('🔄 Reloaded backend to keep it alive'))
                        .catch((err: any) => console.error('❌ Keep-alive ping failed:', err.message));
                }, interval);
            } else {
                console.warn('⚠️ Keep-alive ping skipped: RENDER_EXTERNAL_URL, BACKEND_URL, or NEXT_PUBLIC_SOCKET_URL not set');
            }
        }
    });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    process.exit(1);
});

export { app, server, io };
