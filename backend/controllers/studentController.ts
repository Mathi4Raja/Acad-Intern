import { Response, NextFunction } from 'express';
import { z } from 'zod';
import StudentProfile from '../models/StudentProfile';
import { AuthRequest } from '../types';
import { getKeyFromUrl, hasFile } from '../utils/r2Storage';

// Schema
const profileSchema = z.object({
    department: z.string().optional(),
    semester: z.number().min(1).max(8).optional(),
    skills: z.array(z.string()).optional(),
    resumeUrl: z.string().url().optional().or(z.literal('')).nullable().transform(val => val || undefined),
    bio: z.string().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    hoursRequired: z.number().min(0).optional(),
    linkedIn: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
    profilePicture: z.string().url().optional().or(z.literal('')).nullable(),
    bannerImage: z.string().url().optional().or(z.literal('')).nullable()
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

        res.status(200).json({
            success: true,
            data: profileData
        });
    } catch (error) {
        next(error);
    }
};
