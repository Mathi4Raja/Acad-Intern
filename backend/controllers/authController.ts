import { Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Company from '../models/Company';
import { AuthRequest } from '../types';

// Validation schemas
const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'company', 'admin'])
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = signupSchema.parse(req.body);
        const { name, email, password, role } = validatedData;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
            return;
        }

        const user = await User.create({
            name,
            email,
            password_hash: password,
            role
        });

        if (role === 'student') {
            await StudentProfile.create({ userId: user._id });
        } else if (role === 'company') {
            await Company.create({
                userId: user._id,
                companyName: name
            });
        }

        const token = user.generateAuthToken();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
            return;
        }
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const { email, password } = validatedData;

        const user = await User.findOne({ email }).select('+password_hash');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }

        const token = user.generateAuthToken();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
            return;
        }
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user;

        let profile = null;
        if (user?.role === 'student') {
            profile = await StudentProfile.findOne({ userId: user._id });
        } else if (user?.role === 'company') {
            profile = await Company.findOne({ userId: user._id });
        }

        res.status(200).json({
            success: true,
            data: {
                user,
                profile
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};
