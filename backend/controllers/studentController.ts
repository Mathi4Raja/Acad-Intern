import { Response, NextFunction } from 'express';
import { z } from 'zod';
import StudentProfile from '../models/StudentProfile';
import ProfileView from '../models/ProfileView';
import { AuthRequest } from '../types';
import { getKeyFromUrl, hasFile } from '../utils/r2Storage';

// Helper for URL validation that auto-prefixes https:// if missing
const flexibleUrl = z.string().trim().transform((val) => {
    if (!val) return val;
    // If it doesn't start with a protocol, prefix with https://
    if (!/^(https?:\/\/)/i.test(val)) {
        return `https://${val}`;
    }
    return val;
}).pipe(z.string().url('Invalid URL format').refine((val) => {
    try {
        const url = new URL(val);
        // Check if hostname has at least one dot and the last part is at least 2 chars
        const parts = url.hostname.split('.');
        return parts.length >= 2 && parts[parts.length - 1].length >= 2;
    } catch {
        return false;
    }
}, { message: "URL must have a valid domain extension" }));

// Schema
const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    department: z.string().optional(),
    semester: z.number().min(1).max(8).optional(),
    skills: z.array(z.string()).optional(),
    resumeUrl: z.string().url().optional().or(z.literal('')).nullable().transform(val => val || undefined),
    bio: z.string().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    hoursRequired: z.number().min(0).optional(),
    linkedIn: flexibleUrl.optional().or(z.literal('')),
    github: flexibleUrl.optional().or(z.literal('')),
    profilePicture: z.string().url().optional().or(z.literal('')).nullable(),
    bannerImage: z.string().url().optional().or(z.literal('')).nullable(),
    phone: z.string().optional(),
    location: z.string().optional()
});

// @desc    Get current student profile
// @route   GET /api/students/profile/me
// @access  Private (Student)
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.user?._id });

        if (!profile) {
            res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
            return;
        }

        // Check if resume file actually exists in R2
        if (profile.resumeUrl) {
            const key = getKeyFromUrl(profile.resumeUrl);
            if (key) {
                const exists = await hasFile(key);
                if (!exists) {
                    console.log(`Resume file missing in R2 for user ${req.user?._id}, removing reference.`);
                    profile.resumeUrl = undefined;
                    await profile.save();
                }
            }
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update student profile
// @route   POST /api/students/profile
// @access  Private (Student)
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = profileSchema.parse(req.body);

        // Update the user's name if provided
        if (validatedData.name) {
            const User = require('../models/User').default;
            await User.findByIdAndUpdate(req.user?._id, { name: validatedData.name });
        }

        let profile = await StudentProfile.findOne({ userId: req.user?._id });

        if (!profile) {
            profile = new StudentProfile({ userId: req.user?._id });
        }

        if (validatedData.department) profile.department = validatedData.department;
        if (validatedData.semester) profile.semester = validatedData.semester;
        if (validatedData.skills) profile.skills = validatedData.skills;
        if (validatedData.resumeUrl !== undefined) profile.resumeUrl = validatedData.resumeUrl || undefined;
        if (validatedData.bio) profile.bio = validatedData.bio;
        if (validatedData.cgpa !== undefined) profile.cgpa = validatedData.cgpa;
        if (validatedData.hoursRequired !== undefined) profile.hoursRequired = validatedData.hoursRequired;
        if (validatedData.linkedIn) profile.linkedIn = validatedData.linkedIn;
        if (validatedData.github) profile.github = validatedData.github;
        if (validatedData.profilePicture !== undefined) profile.profilePicture = validatedData.profilePicture || undefined;
        if (validatedData.bannerImage !== undefined) profile.bannerImage = validatedData.bannerImage || undefined;
        if (validatedData.phone) profile.phone = validatedData.phone;
        if (validatedData.location !== undefined) profile.location = validatedData.location;

        profile.calculateCompleteness();
        await profile.save();

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('updateProfile error:', error);
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
// @desc    Get student profile by ID (for companies/admins)
// @route   GET /api/students/profile/:id
// @access  Private (Company/Admin)
export const getStudentProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        // Find user first to ensure they are a student
        const User = require('../models/User').default;
        const studentUser = await User.findById(id);

        if (!studentUser || studentUser.role !== 'student') {
            res.status(404).json({
                success: false,
                message: 'Student not found'
            });
            return;
        }

        const profile = await StudentProfile.findOne({ userId: id });

        if (!profile) {
            res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
            return;
        }

        // Add basic user info to the profile response
        const profileData = profile.toObject();
        (profileData as any).name = studentUser.name;
        (profileData as any).email = studentUser.email;

        // Record the profile view (fire-and-forget; never block the response)
        ProfileView.create({
            viewerId: req.user!._id,
            profileOwnerId: studentUser._id,
            viewerRole: req.user!.role,
            viewType: 'profile_view'
        }).catch((err: Error) => console.error('Failed to record profile view:', err));

        res.status(200).json({
            success: true,
            data: profileData
        });
    } catch (error) {
        next(error);
    }
};
