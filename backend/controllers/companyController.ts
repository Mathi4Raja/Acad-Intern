import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Company from '../models/Company';
import { AuthRequest } from '../types';

// Schema
const companySchema = z.object({
    companyName: z.string().min(2).optional(),
    website: z.string().url().optional().or(z.literal('')),
    description: z.string().optional()
});

// @desc    Get current company profile
// @route   GET /api/companies/me
// @access  Private (Company)
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const profile = await Company.findOne({ userId: req.user?._id });

        if (!profile) {
            res.status(404).json({
                success: false,
                message: 'Company profile not found'
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

// @desc    Update company profile
// @route   POST /api/companies
// @access  Private (Company)
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = companySchema.parse(req.body);

        let profile = await Company.findOne({ userId: req.user?._id });

        if (!profile) {
            profile = new Company({ userId: req.user?._id, companyName: 'Company' });
        }

        if (validatedData.companyName) profile.companyName = validatedData.companyName;
        if (validatedData.website) profile.website = validatedData.website;
        if (validatedData.description) profile.description = validatedData.description;

        await profile.save();

        res.status(200).json({
            success: true,
            data: profile
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
