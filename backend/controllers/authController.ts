import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Company from '../models/Company';
import Application from '../models/Application';
import Message from '../models/Message';
import Notification from '../models/Notification';
import { createNotification } from '../utils/notificationService';
import Internship from '../models/Internship';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest } from '../types';
import { sendEmail, generateResetToken, hashToken } from '../utils/emailService';
import { uploadToR2, isR2Configured, getKeyFromUrl, getFileStream, deleteFromR2 } from '../utils/r2Storage';
import crypto from 'crypto';

const getPrimaryFrontendUrl = (): string => {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
};

const buildMobileLink = (path: string, token: string): string | null => {
    const mobileBase = process.env.MOBILE_DEEP_LINK_BASE?.trim();
    if (!mobileBase) {
        return null;
    }

    const separator = mobileBase.includes('?') ? '&' : '?';
    return `${mobileBase}${separator}path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}`;
};

const buildVerificationLinks = (token: string) => {
    const webUrl = `${getPrimaryFrontendUrl()}/verify-email?token=${token}`;
    return {
        webUrl,
        mobileUrl: buildMobileLink('/verify-email', token)
    };
};

const buildResetLinks = (token: string) => {
    const webUrl = `${getPrimaryFrontendUrl()}/reset-password?token=${token}`;
    return {
        webUrl,
        mobileUrl: buildMobileLink('/reset-password', token)
    };
};


// Helper for URL validation that auto-prefixes https:// if missing
const flexibleUrl = z.string().trim().transform((val) => {
    if (!val) return val;
    // If it doesn't start with a protocol, prefix with https://
    if (!/^(https?:\/\/)/i.test(val)) {
        return `https://${val}`;
    }
    return val;
}).pipe(z.string().url('Invalid URL format'));

// Validation schemas
const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(4, 'Password must be at least 4 characters'),
    role: z.enum(['student', 'company', 'admin']),
    // Company specific fields
    companyName: z.string().optional(),
    website: flexibleUrl.optional().or(z.literal('')),
    cin: z.string().optional(),
    description: z.string().optional(),
    // Student specific fields
    department: z.string().optional(),
    semester: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined)
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
    password: z.string().min(4, 'Password must be at least 4 characters')
});

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Check if registration is allowed
        const registrationSetting = await SystemSetting.findOne({ key: 'allowRegistration' });
        const isRegistrationAllowed = registrationSetting ? (registrationSetting.value === true || registrationSetting.value === 'true') : true;

        if (!isRegistrationAllowed) {
            res.status(403).json({
                success: false,
                message: 'New user registration is currently closed by the administrator.'
            });
            return;
        }

        const validatedData = signupSchema.parse(req.body);
        const { name, email, password, role, companyName, website, cin, description, department, semester } = validatedData;

        // DYNAMIC SETTINGS: Password Complexity
        const passwordMinSetting = await SystemSetting.findOne({ key: 'passwordMinLength' });
        const minLength = passwordMinSetting ? Number(passwordMinSetting.value) : 8; // Default 8 as per UI

        if (password.length < minLength) {
            res.status(400).json({
                success: false,
                message: `Password is too short. It must be at least ${minLength} characters long to meet platform security standards.`
            });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
            return;
        }

        // DYNAMIC SETTINGS: Email Verification & Expiry
        const verificationSetting = await SystemSetting.findOne({ key: 'requireEmailVerification' });
        const requireVerification = verificationSetting ? (verificationSetting.value === true || verificationSetting.value === 'true') : true;

        const expirySetting = await SystemSetting.findOne({ key: 'passwordResetExpiry' });
        const expiryMinutes = expirySetting ? Number(expirySetting.value) : 60;

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // DYNAMIC SETTINGS: Auto-Approve Companies
        const autoApproveSetting = await SystemSetting.findOne({ key: 'autoApproveCompanies' });
        const isAutoApprove = autoApproveSetting ? (autoApproveSetting.value === true || autoApproveSetting.value === 'true') : true;

        const user = await User.create({
            name,
            email,
            password_hash: password,
            role,
            status: (role === 'company' && !isAutoApprove) ? 'pending' : 'active',
            emailVerificationToken: requireVerification ? verificationToken : undefined,
            emailVerificationExpires: requireVerification ? verificationExpires : undefined,
            isEmailVerified: !requireVerification
        });

        if (role === 'student') {
            await StudentProfile.create({
                userId: user._id,
                department: department || '',
                semester: semester || null
            });
        } else if (role === 'company') {
            // Check for mandatory fields if role is company
            if (!companyName || companyName.trim() === '') {
                await User.findByIdAndDelete(user._id);
                res.status(400).json({
                    success: false,
                    message: 'Company name is required'
                });
                return;
            }

            if (!website || website.trim() === '') {
                await User.findByIdAndDelete(user._id);
                res.status(400).json({
                    success: false,
                    message: 'Website is required for company registration'
                });
                return;
            }

            try {
                await Company.create({
                    userId: user._id,
                    companyName: companyName,
                    website: website,
                    cin: cin || null,
                    description: description || ''
                });
            } catch (error) {
                // If company profile creation fails, delete user to maintain consistency
                await User.findByIdAndDelete(user._id);
                throw error;
            }
        }

        // DYNAMIC SETTINGS: Session Duration (Minutes)
        const sessionSetting = await SystemSetting.findOne({ key: 'sessionTimeout' });
        const sessionMinutes = Number(sessionSetting?.value || 10080); // Default 7 days (10080 min)
        const cookieMaxAge = sessionMinutes * 60 * 1000;

        const authStartedAt = Date.now();
        const token = user.generateAuthToken(`${sessionMinutes}m`, authStartedAt);

        // Detect if request is from dev tunnels (HTTPS origin)
        const origin = req.headers.origin || '';
        const isSecureContext = origin.startsWith('https://') || process.env.NODE_ENV === 'production';

        // HttpOnly cookie for secure API authentication
        res.cookie('token', token, {
            httpOnly: true,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: cookieMaxAge
        });

        // Accessible cookie for Socket.io client-side authentication
        res.cookie('socket_token', token, {
            httpOnly: false,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: cookieMaxAge
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

        // Create welcome notification for user
        const siteNameSetting = await SystemSetting.findOne({ key: 'siteName' });
        const siteName = siteNameSetting ? String(siteNameSetting.value) : 'AcadIntern';

        await createNotification({
            userId: user._id,
            type: 'general',
            title: `Welcome to ${siteName}`,
            message: `Hi ${user.name}, welcome to the platform!`
        });

        // Send Verification or Welcome Email
        if (requireVerification) {
            const { webUrl: verificationUrl, mobileUrl: mobileVerificationUrl } = buildVerificationLinks(verificationToken);

            // Template Selection based on Role
            const isCompany = user.role === 'company';
            const verificationHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; overflow: hidden; margin-top: 20px; }
        .header { background: ${isCompany ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'}; padding: 48px 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .content p { font-size: 15px; color: #4b5563; margin: 0 0 20px; }
        .button-wrapper { text-align: center; margin: 32px 0 8px; }
        .button { display: inline-block; padding: 14px 32px; background-color: ${isCompany ? '#059669' : '#4f46e5'}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>${isCompany ? 'Partner Verification' : 'Welcome to {{SITE_NAME}}'}</h1>
            </div>
            <div class="content">
                <p>Hi ${user.name},</p>
                ${isCompany
                    ? `<p>We're excited to partner with you! {{SITE_NAME}} provides you with a direct line to top-tier student talent. To start posting internships and managing applications, please verify your corporate account.</p>`
                    : `<p>We're thrilled to have you! {{SITE_NAME}} is designed to connect you with high-impact internships and accelerate your career journey.</p>`
                }
                <p>Please click the button below to verify your email address and get started.</p>
                <div class="button-wrapper">
                    <a href="${verificationUrl}" class="button">${isCompany ? 'Verify Corporate Account' : 'Verify Email & Get Started'}</a>
                </div>
                ${mobileVerificationUrl ? `
                <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 12px;">
                    Prefer mobile? Open directly in the app:<br>
                    <a href="${mobileVerificationUrl}" style="color: ${isCompany ? '#059669' : '#4f46e5'}; word-break: break-all;">${mobileVerificationUrl}</a>
                </p>` : ''}
                <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: ${isCompany ? '#059669' : '#4f46e5'}; word-break: break-all;">${verificationUrl}</a>
                </p>
                <p style="margin-top: 24px;">This link will expire in ${expiryMinutes} minutes. If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

            try {
                await sendEmail({
                    to: user.email,
                    subject: `Welcome to {{SITE_NAME}}! Confirm your email address`,
                    text: `Welcome to {{SITE_NAME}}, ${user.name}! Please verify your email to get started: ${verificationUrl}${mobileVerificationUrl ? `\n\nMobile app link: ${mobileVerificationUrl}` : ''}`,
                    html: verificationHtml,
                    type: 'email_verification'
                });
            } catch (emailError) {
                console.error('Verification email failed to send:', emailError);
            }
        } else {
            // Send standard welcome email without verification link
            const isCompany = user.role === 'company';
            const dashboardUrl = getPrimaryFrontendUrl();
            const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; overflow: hidden; margin-top: 20px; }
        .header { background: ${isCompany ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'}; padding: 48px 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .content p { font-size: 16px; color: #4b5563; margin: 0 0 24px; line-height: 1.6; }
        .button-wrapper { text-align: center; margin: 32px 0; }
        .button { display: inline-block; padding: 14px 36px; background-color: ${isCompany ? '#059669' : '#4f46e5'}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(${isCompany ? '5,150,105,0.2' : '79,70,229,0.2'}); }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; background-color: #fafafa; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>${isCompany ? 'Welcome, Partner!' : 'Welcome to {{SITE_NAME}}!'}</h1>
            </div>
            <div class="content">
                <p>Hi ${user.name},</p>
                ${isCompany
                    ? `<p>Your partner account is now active. {{SITE_NAME}} is the leading platform for connecting industry leaders with high-potential students. You're now ready to start building your talent pipeline.</p>
                       <p>Post your first internship opportunity today to reach thousands of qualified candidates.</p>`
                    : `<p>We're thrilled to have you! Your account is now active and ready to use. {{SITE_NAME}} is built to connect you with high-impact internships and accelerate your professional journey.</p>
                       <p>You can start exploring curated opportunities and building your profile immediately.</p>`
                }
                <div class="button-wrapper">
                    <a href="${dashboardUrl}${isCompany ? '/company/post-internship' : '/student/dashboard'}" class="button">${isCompany ? 'Post an Internship' : 'Explore Opportunities'}</a>
                </div>
                <p>If you have any questions, our team is here to help you every step of the way.</p>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
                <p>${isCompany ? 'Empowering future industry leaders.' : 'Connecting talent with opportunity.'}</p>
            </div>
        </div>
    </div>
</body>
</html>
            `;

            try {
                await sendEmail({
                    to: user.email,
                    subject: `Welcome to {{SITE_NAME}}!`,
                    text: `Welcome to {{SITE_NAME}}, ${user.name}! Your account is now active and ready to use. Log in at ${dashboardUrl} to get started.`,
                    html: welcomeHtml,
                    type: 'welcome'
                });
            } catch (emailError) {
                console.error('Welcome email failed to send:', emailError);
            }
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

// @desc    Verify email address
// @route   GET /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.query;

        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
            return;
        }

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        }).select('+emailVerificationToken +emailVerificationExpires');

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
            return;
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.status = 'active';
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully. Your account is now active.'
        });
    } catch (error) {
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
        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired Google token'
            });
            return;
        }

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
            // Check if registration is allowed for new users
            const registrationSetting = await SystemSetting.findOne({ key: 'allowRegistration' });
            const isRegistrationAllowed = registrationSetting ? (registrationSetting.value === true || registrationSetting.value === 'true') : true;

            if (!isRegistrationAllowed) {
                res.status(403).json({
                    success: false,
                    message: 'New user registration is currently closed by the administrator.'
                });
                return;
            }

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

        // DYNAMIC SETTINGS: Session Duration (Minutes)
        const sessionSetting = await SystemSetting.findOne({ key: 'sessionTimeout' });
        const sessionMinutes = Number(sessionSetting?.value || 10080); // Default 7 days (10080 min)
        const cookieMaxAge = sessionMinutes * 60 * 1000;

        const authStartedAt = Date.now();
        const token = user.generateAuthToken(`${sessionMinutes}m`, authStartedAt);

        // Detect secure context
        const origin = req.headers.origin || '';
        const isSecureContext = origin.startsWith('https://') || process.env.NODE_ENV === 'production';

        // HttpOnly cookie for secure API authentication
        res.cookie('token', token, {
            httpOnly: true,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: cookieMaxAge
        });

        // Accessible cookie for Socket.io client-side authentication
        res.cookie('socket_token', token, {
            httpOnly: false,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: cookieMaxAge
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

        // FETCH DYNAMIC SECURITY SETTINGS
        const settings = await SystemSetting.find({
            key: { $in: ['requireEmailVerification', 'maxLoginAttempts', 'sessionTimeout'] }
        });

        const requireVerification = settings.find(s => s.key === 'requireEmailVerification')?.value === true || settings.find(s => s.key === 'requireEmailVerification')?.value === 'true';
        const maxAttempts = Number(settings.find(s => s.key === 'maxLoginAttempts')?.value || 5);
        const sessionMinutes = Number(settings.find(s => s.key === 'sessionTimeout')?.value || 10080); // Default 7 days in minutes
        const cookieMaxAge = sessionMinutes * 60 * 1000;

        const user = await User.findOne({ email }).select('+password_hash +loginAttempts +lockUntil');
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        // 1. CHECK ACCOUNT LOCK STATUS
        if (user.lockUntil && user.lockUntil > new Date()) {
            const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
            res.status(423).json({
                success: false,
                message: `Account is temporarily locked due to repeated failed attempts. Try again in ${remainingMinutes} minutes.`
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

        // 2. HANDLE INCORRECT PASSWORD (Account Locking Logic)
        if (!isMatch) {
            user.loginAttempts += 1;

            if (user.loginAttempts >= maxAttempts) {
                user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
                user.loginAttempts = 0; // Reset attempts after locking
                await user.save();
                res.status(423).json({
                    success: false,
                    message: `Account locked due to ${maxAttempts} failed attempts. Please try again in 30 minutes.`
                });
                return;
            }

            await user.save();
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }

        // 3. ENFORCE ACCOUNT STATUS (Active/Suspended/Pending)
        if (user.status !== 'active' && user.role !== 'admin') {
            const statusMessages: Record<string, string> = {
                'suspended': 'Your account has been suspended by the administrator. Please contact support.',
                'pending': 'Your account is currently pending approval. You will receive an email once it is activated.'
            };

            res.status(403).json({
                success: false,
                message: statusMessages[user.status] || 'Your account is not active. Please contact support.'
            });
            return;
        }

        // 4. ENFORCE EMAIL VERIFICATION
        if (requireVerification && !user.isEmailVerified && user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Email verification is required to access the platform. Please check your inbox for the verification link.',
                requiresVerification: true,
                email: user.email // Provide email for resend functionality
            });
            return;
        }

        // SUCCESSFUL LOGIN - RESET ATTEMPTS
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        const authStartedAt = Date.now();
        const token = user.generateAuthToken(`${sessionMinutes}m`, authStartedAt);

        // Detect if request is from dev tunnels (HTTPS origin)
        const origin = req.headers.origin || '';
        const isSecureContext = origin.startsWith('https://') || process.env.NODE_ENV === 'production';

        // HttpOnly cookie for secure API authentication
        res.cookie('token', token, {
            httpOnly: true,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: cookieMaxAge
        });

        // Accessible cookie for Socket.io client-side authentication
        res.cookie('socket_token', token, {
            httpOnly: false,
            secure: isSecureContext,
            sameSite: isSecureContext ? 'none' : 'strict',
            maxAge: cookieMaxAge
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
        const { webUrl: resetUrl, mobileUrl: mobileResetUrl } = buildResetLinks(resetToken);

        // Get dynamic expiration from settings (default 60 minutes)
        let expiryMinutes = 60;
        try {
            const expirySetting = await SystemSetting.findOne({ key: 'passwordResetExpiry' });
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; overflow: hidden; margin-top: 20px; }
        .header { background: #ffffff; padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid #f3f4f6; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .content p { font-size: 15px; color: #4b5563; margin: 0 0 20px; }
        .button-wrapper { text-align: center; margin: 32px 0 32px; }
        .button { display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Password Reset</h1>
            </div>
            <div class="content">
                <p>We received a request to reset the password for your {{SITE_NAME}} account.</p>
                <div class="button-wrapper">
                    <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                ${mobileResetUrl ? `
                <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 12px;">
                    Open in the mobile app:<br>
                    <a href="${mobileResetUrl}" style="color: #4f46e5; word-break: break-all;">${mobileResetUrl}</a>
                </p>` : ''}
                <p>This link will expire in ${expiryMinutes} minutes. If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        // Create notification for user (Password Reset Request)
        await createNotification({
            userId: user._id,
            type: 'general',
            title: 'Security Alert',
            message: 'A password reset was requested for your account.'
        });
        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request - {{SITE_NAME}}',
                text: `${message}${mobileResetUrl ? `\nMobile app link:\n\n${mobileResetUrl}\n` : ''}`,
                html: html,
                type: 'password_reset'
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

        // DYNAMIC SETTINGS: Password Complexity
        const passwordMinSetting = await SystemSetting.findOne({ key: 'passwordMinLength' });
        const minLength = passwordMinSetting ? Number(passwordMinSetting.value) : 6;

        if (password.length < minLength) {
            res.status(400).json({
                success: false,
                message: `Password must be at least ${minLength} characters long as per company security policy.`
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
This is a confirmation that the password for your {{SITE_NAME}} account (${user.email}) has just been changed.

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
        <p>This is a confirmation that the password for your {{SITE_NAME}} account (<strong>${user.email}</strong>) has just been changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <div class="footer">
            <p>This is an automated email from {{SITE_NAME}}. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Changed Successfully - {{SITE_NAME}}',
                text: message,
                html: html,
                type: 'password_reset'
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
            const studentProfile = await StudentProfile.findOne({ userId });
            if (studentProfile) {
                // Delete files from R2
                const filesToDelete = [
                    studentProfile.resumeUrl,
                    studentProfile.profilePicture,
                    studentProfile.bannerImage
                ].filter(Boolean) as string[];

                for (const url of filesToDelete) {
                    const key = getKeyFromUrl(url);
                    if (key) {
                        try {
                            await deleteFromR2(key);
                        } catch (err) {
                            console.error(`Failed to delete file from R2: ${key}`, err);
                        }
                    }
                }

                // Delete student profile
                await StudentProfile.deleteOne({ userId });
            }
            // Delete student's applications
            await Application.deleteMany({ studentId: userId });
        } else if (user.role === 'company') {
            // Get company to find internships
            const company = await Company.findOne({ userId });
            if (company) {
                // Delete files from R2
                const filesToDelete = [
                    company.logo,
                    company.banner
                ].filter(Boolean) as string[];

                for (const url of filesToDelete) {
                    const key = getKeyFromUrl(url);
                    if (key) {
                        try {
                            await deleteFromR2(key);
                        } catch (err) {
                            console.error(`Failed to delete file from R2: ${key}`, err);
                        }
                    }
                }

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

        // Conditional Message Deletion
        // 1. Find all messages involving this user
        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        });

        // 2. Group by conversation partner
        const partners = new Set<string>();
        messages.forEach(msg => {
            const partnerId = msg.senderId.toString() === userId.toString() ? msg.receiverId.toString() : msg.senderId.toString();
            partners.add(partnerId);
        });

        // 3. Process each conversation
        for (const partnerId of partners) {
            // Check if partner still exists
            const partnerExists = await User.exists({ _id: partnerId });

            if (!partnerExists) {
                // Partner deleted -> Delete messages & attachments
                const conversationMessages = messages.filter(msg =>
                    (msg.senderId.toString() === userId.toString() && msg.receiverId.toString() === partnerId) ||
                    (msg.senderId.toString() === partnerId && msg.receiverId.toString() === userId.toString())
                );

                // Delete attachments from R2
                for (const msg of conversationMessages) {
                    if (msg.attachments && msg.attachments.length > 0) {
                        for (const attachment of msg.attachments) {
                            const key = getKeyFromUrl(attachment.fileUrl);
                            if (key) {
                                try {
                                    await deleteFromR2(key);
                                } catch (err) {
                                    console.error(`Failed to delete message attachment from R2: ${key}`, err);
                                }
                            }
                        }
                    }
                }

                // Delete messages from DB
                await Message.deleteMany({
                    $or: [
                        { senderId: userId, receiverId: partnerId },
                        { senderId: partnerId, receiverId: userId }
                    ]
                });
            }
            // If partner exists, do nothing (retain messages)
        }

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
// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Privacy: Don't reveal if user doesn't exist, but we can be helpful for unverified users
            res.status(200).json({ success: true, message: 'If an account exists with that email and requires verification, a new link has been sent.' });
            return;
        }

        if (user.isEmailVerified) {
            res.status(400).json({ success: false, message: 'Email is already verified. Please login.' });
            return;
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiryMinutes = 60; // 1 hour for resend
        const verificationExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);

        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();

        const { webUrl: verificationUrl, mobileUrl: mobileVerificationUrl } = buildVerificationLinks(verificationToken);

        // Reuse the premium template from signup (simplified for resend)
        const verificationHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; overflow: hidden; margin-top: 20px; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 48px 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .content p { font-size: 15px; color: #4b5563; margin: 0 0 20px; }
        .button-wrapper { text-align: center; margin: 32px 0 8px; }
        .button { display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Email Verification</h1>
            </div>
            <div class="content">
                <p>Hi ${user.name},</p>
                <p>You requested a new verification link for your {{SITE_NAME}} account. Please click the button below to confirm your identity and activate all features of your profile.</p>
                <div class="button-wrapper">
                    <a href="${verificationUrl}" class="button">Verify My Email</a>
                </div>
                ${mobileVerificationUrl ? `
                <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 12px;">
                    Open in the mobile app:<br>
                    <a href="${mobileVerificationUrl}" style="color: #4f46e5; word-break: break-all;">${mobileVerificationUrl}</a>
                </p>` : ''}
                <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
                </p>
                <p style="margin-top: 24px;">This link will expire in ${expiryMinutes} minutes. If you didn't request this, you can ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        await sendEmail({
            to: user.email,
            subject: `Action Required: Verify your email address`,
            text: `Please verify your email to access your account: ${verificationUrl}${mobileVerificationUrl ? `\n\nMobile app link: ${mobileVerificationUrl}` : ''}`,
            html: verificationHtml,
            type: 'email_verification'
        });

        res.status(200).json({ success: true, message: 'Verification link has been sent to your email.' });
    } catch (error) {
        next(error);
    }
};
