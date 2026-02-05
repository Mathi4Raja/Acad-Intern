import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest, IUser } from '../types';

interface JwtPayload {
    id: string;
    role: string;
    email: string;
}

// Protect routes - authentication middleware
const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token: string | undefined;

        // Check for token in cookies (preferred)
        if (req.cookies.token) {
            token = req.cookies.token;
        }
        // Check for token in Authorization header (Bearer token)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
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

            // Attach user to request
            const user = await User.findById(decoded.id).select('-password_hash');

            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
                return;
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
