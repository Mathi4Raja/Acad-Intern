import { Response, NextFunction } from 'express';
import { z } from 'zod';
import StudentProfile from '../models/StudentProfile';
import { AuthRequest } from '../types';

// Schema
const profileSchema = z.object({
    department: z.string().optional(),
    semester: z.number().min(1).max(8).optional(),
    skills: z.array(z.string()).optional(),
    resumeUrl: z.string().url().optional().or(z.literal('')),
    bio: z.string().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    hoursRequired: z.number().min(0).optional(),
    linkedIn: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal(''))
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
        console.log('updateProfile called with body:', req.body);
        console.log('req.user:', req.user);

        const validatedData = profileSchema.parse(req.body);
        console.log('validatedData:', validatedData);

        let profile = await StudentProfile.findOne({ userId: req.user?._id });
        console.log('existing profile:', profile);

        if (!profile) {
            profile = new StudentProfile({ userId: req.user?._id });
        }

        if (validatedData.department) profile.department = validatedData.department;
        if (validatedData.semester) profile.semester = validatedData.semester;
        if (validatedData.skills) profile.skills = validatedData.skills;
        if (validatedData.resumeUrl) profile.resumeUrl = validatedData.resumeUrl;
        if (validatedData.bio) profile.bio = validatedData.bio;
        if (validatedData.cgpa !== undefined) profile.cgpa = validatedData.cgpa;
        if (validatedData.hoursRequired !== undefined) profile.hoursRequired = validatedData.hoursRequired;
        if (validatedData.linkedIn) profile.linkedIn = validatedData.linkedIn;
        if (validatedData.github) profile.github = validatedData.github;

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
