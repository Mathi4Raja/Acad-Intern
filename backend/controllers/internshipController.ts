import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Internship from '../models/Internship';
import Company from '../models/Company';
import StudentProfile from '../models/StudentProfile';
import { AuthRequest } from '../types';

// Validation schemas
const internshipSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    skillsRequired: z.array(z.string()).min(1, 'At least one skill is required'),
    durationWeeks: z.number().min(1, 'Duration must be at least 1 week'),
    stipend: z.number().min(0, 'Stipend cannot be negative'),
    mode: z.enum(['remote', 'onsite', 'hybrid']),
    openings: z.number().min(1, 'Must have at least 1 opening'),
    location: z.string().optional(),
    deadline: z.string().or(z.date()).optional()
});

interface InternshipQuery {
    isActive: boolean;
    $text?: { $search: string };
    mode?: string;
    stipend?: { $gte: number };
    durationWeeks?: { $lte: number };
    skillsRequired?: { $in: string[] };
}

// @desc    Get internships sorted by skill match for student
// @route   GET /api/internships/match
// @access  Private (Student)
export const matchInternships = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.user?._id });

        const studentSkills = (profile?.skills || []).map(s => s.toLowerCase());

        const internships = await Internship.find({ isActive: true })
            .populate('companyId', 'companyName website verified')
            .lean();

        const matches = internships.map(internship => {
            if (!internship.skillsRequired || internship.skillsRequired.length === 0) {
                return { ...internship, matchScore: 0 };
            }

            const jobSkills = internship.skillsRequired.map(s => s.toLowerCase());
            const intersection = jobSkills.filter(skill => studentSkills.includes(skill));
            const matchScore = Math.round((intersection.length / jobSkills.length) * 100);

            return { ...internship, matchScore };
        });

        const sortedMatches = matches
            .sort((a, b) => {
                // First sort by match score
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }
                // Then by creation date (newest first)
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

        res.status(200).json({
            success: true,
            count: sortedMatches.length,
            data: sortedMatches
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all internships with filtering and search
// @route   GET /api/internships
// @access  Public
export const getInternships = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { search, mode, minStipend, duration, skills } = req.query;

        const query: InternshipQuery = { isActive: true };

        if (search && typeof search === 'string') {
            query.$text = { $search: search };
        }

        if (mode && typeof mode === 'string') {
            query.mode = mode;
        }

        if (minStipend && typeof minStipend === 'string') {
            query.stipend = { $gte: parseInt(minStipend) };
        }

        if (duration && typeof duration === 'string') {
            query.durationWeeks = { $lte: parseInt(duration) };
        }

        if (skills && typeof skills === 'string') {
            const skillsArray = skills.split(',').map(s => s.trim());
            query.skillsRequired = { $in: skillsArray };
        }

        const internships = await Internship.find(query)
            .populate('companyId', 'companyName website verified')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: internships.length,
            data: internships
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single internship
// @route   GET /api/internships/:id
// @access  Public
export const getInternship = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const internship = await Internship.findById(req.params.id)
            .populate('companyId', 'companyName website description verified userId');

        if (!internship) {
            res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: internship
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new internship
// @route   POST /api/internships
// @access  Private (Company)
export const createInternship = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = internshipSchema.parse(req.body);

        const company = await Company.findOne({ userId: req.user?._id });

        if (!company) {
            res.status(404).json({
                success: false,
                message: 'Company profile not found. Please complete your profile first.'
            });
            return;
        }

        const internship = await Internship.create({
            ...validatedData,
            companyId: company._id
        });

        res.status(201).json({
            success: true,
            data: internship
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

// @desc    Update internship
// @route   PUT /api/internships/:id
// @access  Private (Company)
export const updateInternship = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let internship = await Internship.findById(req.params.id);

        if (!internship) {
            res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
            return;
        }

        const company = await Company.findOne({ userId: req.user?._id });
        if (!company || internship.companyId.toString() !== company._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to update this internship'
            });
            return;
        }

        internship = await Internship.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: internship
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete internship
// @route   DELETE /api/internships/:id
// @access  Private (Company/Admin)
export const deleteInternship = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
            return;
        }

        if (req.user?.role !== 'admin') {
            const company = await Company.findOne({ userId: req.user?._id });
            if (!company || internship.companyId.toString() !== company._id.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this internship'
                });
                return;
            }
        }

        await internship.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Internship deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get company's internships
// @route   GET /api/internships/company/my
// @access  Private (Company)
export const getMyInternships = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const company = await Company.findOne({ userId: req.user?._id });

        if (!company) {
            res.status(404).json({
                success: false,
                message: 'Company profile not found'
            });
            return;
        }

        const internships = await Internship.find({ companyId: company._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: internships.length,
            data: internships
        });
    } catch (error) {
        next(error);
    }
};
