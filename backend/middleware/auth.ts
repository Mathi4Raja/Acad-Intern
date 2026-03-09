import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest, IUser } from '../types';

interface JwtPayload {
    id: string;
    role: string;
    email: string;
    authStartedAt: number;
}

const isMobileClient = (req: AuthRequest): boolean => {
    const clientPlatform = req.headers['x-client-platform'];
    const value = Array.isArray(clientPlatform) ? clientPlatform[0] : clientPlatform;
    return String(value || '').toLowerCase() === 'mobile';
};

// Protect routes - authentication middleware
const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token: string | undefined;
        let isBearerAuth = false;

        // Check for token in cookies (preferred)
        if (req.cookies.token) {
            token = req.cookies.token;
        }
        // Check for token in Authorization header (Bearer token)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            isBearerAuth = true;
        }

        // Check if token exists
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
            return;
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            const skipSessionTimeoutForMobile = isBearerAuth && isMobileClient(req);

            // 1. ENFORCE ABSOLUTE TIMEOUT (Hardcoded 7d from .env or fallback)
            const absoluteExpireStr = process.env.JWT_EXPIRE || '7d';
            // Parse '7d' logic (simple fallback for now)
            const absoluteLimitMs = 7 * 24 * 60 * 60 * 1000;

            if (!skipSessionTimeoutForMobile && Date.now() - decoded.authStartedAt > absoluteLimitMs) {
                res.status(401).json({
                    success: false,
                    message: 'Your session has reached the absolute 7-day limit. Please log in again.'
                });
                return;
            }

            // Fetch user
            const user = await User.findById(decoded.id).select('-password_hash');

            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // 1.5 ENFORCE ACCOUNT STATUS (Active/Suspended/Pending)
            if (user.status !== 'active' && user.role !== 'admin') {
                // Check if suspension has expired
                if (user.status === 'suspended' && user.suspendedUntil && new Date() > user.suspendedUntil) {
                    user.status = 'active';
                    user.suspendedUntil = undefined;
                    await user.save();
                } else {
                    const statusMessages: Record<string, string> = {
                        'suspended': `Your account is suspended ${user.suspendedUntil ? 'until ' + user.suspendedUntil.toLocaleDateString() : 'permanently'}.`,
                        'pending': 'Your account is currently pending approval.'
                    };

                    res.status(403).json({
                        success: false,
                        message: statusMessages[user.status] || 'Your account is not active.'
                    });
                    return;
                }
            }

            // 2. IMPLEMENT SLIDING SESSION (Dynamic Soft Limit)
            try {
                const requireVerificationSetting = await SystemSetting.findOne({ key: 'requireEmailVerification' });
                const sessionSetting = await SystemSetting.findOne({ key: 'sessionTimeout' });

                // Block if verification is now mandatory and user isn't verified (excluding admins)
                const isMandatory = requireVerificationSetting ? (requireVerificationSetting.value === true || requireVerificationSetting.value === 'true') : false;
                if (isMandatory && !user.isEmailVerified && user.role !== 'admin') {
                    res.status(403).json({
                        success: false,
                        message: 'Email verification is required. Please verify your email to continue.'
                    });
                    return;
                }

                // Slide if sessionTimeout is configured (in minutes)
                if (!skipSessionTimeoutForMobile && sessionSetting && sessionSetting.value) {
                    const sessionMinutes = Number(sessionSetting.value);
                    const newToken = user.generateAuthToken(`${sessionMinutes}m`, decoded.authStartedAt);

                    const cookieMaxAge = sessionMinutes * 60 * 1000;
                    const isSecureContext = (req.headers.origin?.startsWith('https://')) || process.env.NODE_ENV === 'production';

                    res.cookie('token', newToken, {
                        httpOnly: true,
                        secure: isSecureContext,
                        sameSite: isSecureContext ? 'none' : 'strict',
                        maxAge: cookieMaxAge
                    });

                    res.cookie('socket_token', newToken, {
                        httpOnly: false,
                        secure: isSecureContext,
                        sameSite: isSecureContext ? 'none' : 'strict',
                        maxAge: cookieMaxAge
                    });

                    // Mobile clients authenticate with bearer tokens and need
                    // the rotated token reflected in the response.
                    if (isBearerAuth) {
                        res.setHeader('X-Auth-Token', newToken);
                        res.setHeader('Access-Control-Expose-Headers', 'X-Auth-Token');
                    }
                }
            } catch (err) {
                console.error('Sliding session check failed:', err);
                // Non-blocking for the request, but log it
            }

            req.user = user as IUser;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Token is invalid or expired'
            });
            return;
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `User role ${req.user?.role || 'unknown'} is not authorized to access this route`
            });
            return;
        }
        next();
    };
};

// Optional authentication middleware - attempts to auth but doesn't block if fails
const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token: string | undefined;

        if (req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            const user = await User.findById(decoded.id).select('-password_hash');
            if (user) {
                req.user = user as IUser;
            }
            next();
        } catch (error) {
            // Token invalid or expired - just proceed as unauthenticated
            next();
        }
    } catch (error) {
        next();
    }
};

export { auth as protect, authorize, optionalAuth };
