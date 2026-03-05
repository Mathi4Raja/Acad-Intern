import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Company from '../models/Company';
import { AuthRequest } from '../types';
import { verifyCin as verifyCompanyCin } from '../utils/mcaVerificationService';

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
        // This prevents "https://invalid" from passing, but allows "https://example.com"
        const parts = url.hostname.split('.');
        return parts.length >= 2 && parts[parts.length - 1].length >= 2;
    } catch {
        return false;
    }
}, { message: "URL must have a valid domain extension" }));

// Schema for profile update
const companySchema = z.object({
    name: z.string().min(2).optional(), // Contact Person Name
    companyName: z.string().min(2).optional(),
    website: flexibleUrl.optional().or(z.literal('')),
    description: z.string().optional(),
    cin: z.string().optional().or(z.literal('')),
    logo: z.string().url().optional().or(z.literal('')).nullable(),
    banner: z.string().url().optional().or(z.literal('')).nullable(),
    location: z.string().optional(),
    industry: z.string().optional(),
    companySize: z.string().optional(),
    founded: z.string().optional(),
    phone: z.string().optional(),
    about: z.string().optional(),
    benefits: z.string().optional(),
    socialLinks: z.object({
        linkedin: flexibleUrl.optional().or(z.literal('')),
        twitter: flexibleUrl.optional().or(z.literal('')),
        instagram: flexibleUrl.optional().or(z.literal(''))
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
        const profile = await Company.findOne({ userId: req.user?._id }).populate('userId', 'name email');

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
        if (validatedData.companyName) {
            // If company name changes on a verified company, reset verification
            // CIN is tied to the registered company name from MCA
            if (profile.verified && profile.companyName !== validatedData.companyName) {
                profile.verified = false;
            }
            profile.companyName = validatedData.companyName;
        }
        if (validatedData.website !== undefined) profile.website = validatedData.website || undefined;
        if (validatedData.description !== undefined) profile.description = validatedData.description;

        // Update CIN (only store it, verification is separate)
        if (validatedData.cin !== undefined) {
            const newCin = validatedData.cin.toUpperCase().trim() || undefined;
            const existingCin = profile.cin;

            // Only update if the CIN is actually changing
            if (newCin !== existingCin) {
                profile.cin = newCin;
                // If CIN is removed or changed, reset verified status
                if (!newCin || (existingCin && newCin !== existingCin)) {
                    profile.verified = false;
                }
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

        // Update logo and banner
        if (validatedData.logo !== undefined) profile.logo = validatedData.logo || undefined;
        if (validatedData.banner !== undefined) profile.banner = validatedData.banner || undefined;

        await profile.save();

        // Update User name if provided
        if (validatedData.name) {
            const User = require('../models/User').default;
            await User.findByIdAndUpdate(req.user?._id, { name: validatedData.name });
        }

        const updatedProfile = await Company.findById(profile._id).populate('userId', 'name email');

        res.status(200).json({
            success: true,
            data: updatedProfile
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

// @desc    Get all company profiles (with search and filters)
// @route   GET /api/companies
// @access  Private (Authenticated)
export const getCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { search, industry, location, verified } = req.query;
        let query: any = {};

        // Search by company name
        if (search) {
            query.companyName = { $regex: search, $options: 'i' };
        }

        // Filter by industry
        if (industry) {
            query.industry = { $regex: industry, $options: 'i' };
        }

        // Filter by location
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        // Filter by verified status
        if (verified === 'true') {
            query.verified = true;
        }

        // Find companies with pagination (limit 100 for now)
        const companies = await Company.find(query).limit(100).sort({ verified: -1, companyName: 1 });

        res.status(200).json({
            success: true,
            count: companies.length,
            data: companies
        });
    } catch (error) {
        next(error);
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
