import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Company from '../models/Company';
import { AuthRequest } from '../types';
import { verifyCin as verifyCompanyCin } from '../utils/mcaVerificationService';

// Schema for profile update
const companySchema = z.object({
    companyName: z.string().min(2).optional(),
    website: z.string().url().optional().or(z.literal('')),
    description: z.string().optional(),
    cin: z.string().optional().or(z.literal('')),
    location: z.string().optional(),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    founded: z.string().optional(),
    phone: z.string().optional(),
    about: z.string().optional(),
    benefits: z.string().optional(),
    socialLinks: z.object({
        linkedin: z.string().optional(),
        twitter: z.string().optional(),
        instagram: z.string().optional()
    }).optional()
});

// Schema for CIN verification
const verifyCinSchema = z.object({
    cin: z.string().min(21).max(21)
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

        // Update basic fields
        if (validatedData.companyName) profile.companyName = validatedData.companyName;
        if (validatedData.website !== undefined) profile.website = validatedData.website || undefined;
        if (validatedData.description !== undefined) profile.description = validatedData.description;

        // Update CIN (only store it, verification is separate)
        if (validatedData.cin !== undefined) {
            profile.cin = validatedData.cin.toUpperCase().trim() || undefined;
            // If CIN is removed/changed, reset verified status
            if (!validatedData.cin) {
                profile.verified = false;
            }
        }

        // Update additional fields
        if (validatedData.location !== undefined) profile.location = validatedData.location;
        if (validatedData.industry !== undefined) profile.industry = validatedData.industry;
        if (validatedData.companySize !== undefined) profile.companySize = validatedData.companySize;
        if (validatedData.founded !== undefined) profile.founded = validatedData.founded;
        if (validatedData.phone !== undefined) profile.phone = validatedData.phone;
        if (validatedData.about !== undefined) profile.about = validatedData.about;
        if (validatedData.benefits !== undefined) profile.benefits = validatedData.benefits;
        if (validatedData.socialLinks) profile.socialLinks = validatedData.socialLinks;

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

// @desc    Verify company CIN via MCA API
// @route   POST /api/companies/verify-cin
// @access  Private (Company)
export const verifyCin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = verifyCinSchema.parse(req.body);
        const cin = validatedData.cin.toUpperCase().trim();

        // Find company profile
        const profile = await Company.findOne({ userId: req.user?._id });

        if (!profile) {
            res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
            return;
        }

        // Call MCA verification service
        const verificationResult = await verifyCompanyCin(cin);

        if (!verificationResult.success) {
            res.status(400).json({
                success: false,
                message: 'CIN verification failed',
                error: verificationResult.error
            });
            return;
        }

        // Update company profile with CIN and set verified
        profile.cin = cin;
        profile.verified = true;
        await profile.save();

        res.status(200).json({
            success: true,
            message: 'Company CIN verified successfully',
            data: {
                profile,
                mcaDetails: verificationResult.data
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
    }
};

// @desc    Get company profile by ID
// @route   GET /api/companies/:id
// @access  Private (Authenticated)
export const getProfileById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const profile = await Company.findById(req.params.id);

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
