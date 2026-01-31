import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Company from '../models/Company';
import Application from '../models/Application';
import Message from '../models/Message';
import Notification from '../models/Notification';
import Internship from '../models/Internship';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest } from '../types';
import { sendEmail, generateResetToken, hashToken } from '../utils/emailService';


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

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters')
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

        // Detect if request is from dev tunnels (HTTPS origin)
        const origin = req.headers.origin || '';
        const isSecureContext = origin.startsWith('https://') || process.env.NODE_ENV === 'production';

        // HttpOnly cookie for secure API authentication
        res.cookie('token', token, {
            httpOnly: true,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Accessible cookie for Socket.io client-side authentication
        res.cookie('socket_token', token, {
            httpOnly: false,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
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

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            res.status(400).json({
                success: false,
                message: 'ID token is required'
            });
            return;
        }

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload) {
            res.status(401).json({
                success: false,
                message: 'Invalid Google token'
            });
            return;
        }

        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email not provided by Google'
            });
            return;
        }

        // Check if user exists by googleId or email
        let user = await User.findOne({
            $or: [{ googleId }, { email }]
        });

        let isNewUser = false;

        if (!user) {
            // Create new student user (Google OAuth is only for students)
            isNewUser = true;
            user = await User.create({
                email,
                name: name || email.split('@')[0],
                googleId,
                role: 'student',
                status: 'active'
                // No password_hash for OAuth users
            });

            // Create student profile
            await StudentProfile.create({ userId: user._id });
        } else if (!user.googleId) {
            // User exists with same email but no googleId - link the accounts
            user.googleId = googleId;
            await user.save();
        }

        const token = user.generateAuthToken();

        // Detect secure context
        const origin = req.headers.origin || '';
        const isSecureContext = origin.startsWith('https://') || process.env.NODE_ENV === 'production';

        // HttpOnly cookie for secure API authentication
        res.cookie('token', token, {
            httpOnly: true,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Accessible cookie for Socket.io client-side authentication
        res.cookie('socket_token', token, {
            httpOnly: false,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(isNewUser ? 201 : 200).json({
            success: true,
            message: isNewUser ? 'Account created successfully' : 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token,
                isNewUser
            }
        });
    } catch (error: any) {
        if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired Google token'
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

        // Check if user signed up with Google OAuth only (no password)
        if (!user.password_hash && user.googleId) {
            res.status(401).json({
                success: false,
                message: 'This account uses Google Sign-In. Please click "Continue with Google" to login.'
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

        // Detect if request is from dev tunnels (HTTPS origin)
        const origin = req.headers.origin || '';
        const isSecureContext = origin.startsWith('https://') || process.env.NODE_ENV === 'production';

        // HttpOnly cookie for secure API authentication
        res.cookie('token', token, {
            httpOnly: true,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Accessible cookie for Socket.io client-side authentication
        res.cookie('socket_token', token, {
            httpOnly: false,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
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
                user: user ? {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                } : null,
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

        // Clear the socket token as well
        res.cookie('socket_token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: false
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = forgotPasswordSchema.parse(req.body);
        const { email } = validatedData;

        const user = await User.findOne({ email });

        // Always return success message to prevent email enumeration
        if (!user) {
            res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link'
            });
            return;
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const hashedToken = hashToken(resetToken);

        // Save hashed token to user with expiry (1 hour)
        // Create reset URL
        const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
        const frontendUrl = frontendUrls[0].trim();
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        // Get dynamic expiration from settings (default 60 minutes)
        let expiryMinutes = 60;
        try {
            const expirySetting = await SystemSetting.findOne({ key: 'security.passwordResetExpiry' });
            if (expirySetting && expirySetting.value) {
                expiryMinutes = Number(expirySetting.value);
            }
        } catch (err) {
            console.error('Failed to fetch password reset expiry setting:', err);
        }

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
        await user.save();

        // Email content
        const message = `
You are receiving this email because you (or someone else) has requested to reset your password.

Please click on the following link, or paste it into your browser to complete the process:

${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.

This link will expire in ${expiryMinutes} minutes.
        `;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4F46E5; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
        }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
        <p>Please click on the button below to reset your password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p><strong>This link will expire in ${expiryMinutes} minutes.</strong></p>
        <div class="footer">
            <p>This is an automated email from AcadIntern. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request - AcadIntern',
                text: message,
                html: html
            });

            res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link'
            });
        } catch (emailError) {
            // If email fails, remove token from database
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.status(500).json({
                success: false,
                message: 'Email could not be sent. Please try again later.'
            });
            return;
        }
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

// @desc    Verify reset token
// @route   GET /api/auth/reset-password/:token
// @access  Public
export const verifyResetToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.params;

        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Invalid or missing token'
            });
            return;
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Token is valid',
            data: {
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.params;
        const validatedData = resetPasswordSchema.parse(req.body);
        const { password } = validatedData;

        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Invalid or missing token'
            });
            return;
        }

        const hashedToken = hashToken(token);

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+resetPasswordToken +resetPasswordExpires');

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
            return;
        }

        // Set new password (will be hashed by pre-save hook)
        user.password_hash = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Send confirmation email
        const message = `
This is a confirmation that the password for your AcadIntern account (${user.email}) has just been changed.

If you did not make this change, please contact our support team immediately.
        `;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 12px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Changed Successfully</h2>
        <div class="alert">
            <p><strong>Your password has been changed.</strong></p>
        </div>
        <p>This is a confirmation that the password for your AcadIntern account (<strong>${user.email}</strong>) has just been changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <div class="footer">
            <p>This is an automated email from AcadIntern. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Changed Successfully - AcadIntern',
                text: message,
                html: html
            });
        } catch (emailError) {
            // Don't fail the password reset if confirmation email fails
            console.error('Failed to send confirmation email:', emailError);
        }

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
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

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
            return;
        }

        const user = await User.findById(userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Block admin users from deleting their account
        if (user.role === 'admin') {
            res.status(403).json({
                success: false,
                message: 'Admin accounts cannot be deleted through this endpoint'
            });
            return;
        }

        // Delete related data based on user role
        if (user.role === 'student') {
            // Delete student's applications
            await Application.deleteMany({ studentId: userId });
            // Delete student profile
            await StudentProfile.deleteOne({ userId });
        } else if (user.role === 'company') {
            // Get company to find internships
            const company = await Company.findOne({ userId });
            if (company) {
                // Delete all applications to company's internships
                const internships = await Internship.find({ companyId: company._id });
                const internshipIds = internships.map(i => i._id);
                await Application.deleteMany({ internshipId: { $in: internshipIds } });
                // Delete company's internships
                await Internship.deleteMany({ companyId: company._id });
                // Delete company profile
                await Company.deleteOne({ userId });
            }
        }

        // Delete user's messages (sent and received)
        await Message.deleteMany({
            $or: [{ senderId: userId }, { receiverId: userId }]
        });

        // Delete user's notifications
        await Notification.deleteMany({ userId });

        // Delete the user account
        await User.deleteOne({ _id: userId });

        // Clear authentication cookies
        res.clearCookie('token');
        res.clearCookie('socket_token');

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
