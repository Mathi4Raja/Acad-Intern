import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Internship from '../models/Internship';
import Company from '../models/Company';
import StudentProfile from '../models/StudentProfile';
import Application from '../models/Application';
import User from '../models/User';
import SystemSetting from '../models/SystemSetting';
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
    deadline: z.string().or(z.date()).optional().refine((val) => {
        if (!val) return true;
        const deadline = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadline >= today;
    }, { message: 'Deadline cannot be in the past' }),
    requirements: z.string().optional(),
    responsibilities: z.string().optional(),
    status: z.enum(['active', 'inactive', 'completed', 'in_progress', 'rejected', 'expired']).optional()
});

interface InternshipQuery {
    status?: string;
    $or?: any[];
    mode?: string;
    stipend?: { $gte: number };
    durationWeeks?: { $lte: number };
    skillsRequired?: { $in: string[] };
    companyId?: string | { $nin: any[] };
    deadline?: { $gt: Date };
}

// @desc    Get internships sorted by skill match for student
// @route   GET /api/internships/match
// @access  Private (Student)
export const matchInternships = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.user?._id });

        // Get user's applications to mark applied internships
        const applications = await Application.find({ studentId: req.user?._id }).select('internshipId');
        const appliedInternshipIds = new Set(applications.map(app => app.internshipId.toString()));

        const studentSkills = (profile?.skills || []).map(s => s.toLowerCase());

        const { search, mode, minStipend, duration, skills } = req.query;

        // Find companies that are NOT shadow-banned
        const shadowBannedCompanies = await User.find({ role: 'company', isShadowBanned: true }).distinct('_id');
        const shadowBannedProfileIds = await Company.find({ userId: { $in: shadowBannedCompanies } }).distinct('_id');

        const query: any = {
            status: 'active',
            companyId: { $nin: shadowBannedProfileIds }
        };

        // Use regex for partial matching (e.g., "nihi" matches "nihilist")
        if (search && typeof search === 'string') {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { skillsRequired: searchRegex }
            ];
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
            .populate('companyId', 'companyName website verified logo')
            .lean();

        const matches = internships.map(internship => {
            if (!internship.skillsRequired || internship.skillsRequired.length === 0) {
                return { ...internship, matchScore: 0 };
            }

            const jobSkills = internship.skillsRequired.map((s: string) => s.toLowerCase());
            const intersection = jobSkills.filter((skill: string) => studentSkills.includes(skill));
            const matchScore = Math.round((intersection.length / jobSkills.length) * 100);

            return {
                ...internship,
                matchScore,
                hasApplied: appliedInternshipIds.has(internship._id.toString())
            };
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

// @desc    Get all internships for students
// @route   GET /api/internships
// @access  Private (Student)
export const getInternships = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { search, mode, minStipend, duration, skills, companyId, page = '1', limit = '10' } = req.query;

        // Find companies that are NOT shadow-banned
        const shadowBannedCompanies = await User.find({ role: 'company', isShadowBanned: true }).distinct('_id');
        const shadowBannedProfileIds = await Company.find({ userId: { $in: shadowBannedCompanies } }).distinct('_id');

        const query: any = {
            status: 'active',
            companyId: { $nin: shadowBannedProfileIds }
        };

        // Use regex for partial matching (e.g., "nihi" matches "nihilist")
        if (search && typeof search === 'string') {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { skillsRequired: searchRegex }
            ];
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

        if (companyId && typeof companyId === 'string') {
            query.companyId = companyId;
        }

        const internships = await Internship.find(query)
            .populate('companyId', 'companyName website verified logo')
            .sort({ createdAt: -1 })
            .lean();

        // Check for applications if user is logged in
        let internshipsWithStatus = internships;
        if (req.user) {
            const applications = await Application.find({ studentId: req.user._id }).select('internshipId');
            const appliedInternshipIds = new Set(applications.map(app => app.internshipId.toString()));

            internshipsWithStatus = internships.map(internship => ({
                ...internship,
                hasApplied: appliedInternshipIds.has(internship._id.toString())
            }));
        }

        res.status(200).json({
            success: true,
            count: internshipsWithStatus.length,
            data: internshipsWithStatus
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
            .populate('companyId', 'companyName website description verified userId industry companySize location logo banner');

        if (!internship) {
            res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
            return;
        }

        let internshipData = internship.toObject();

        if (req.user) {
            const application = await Application.findOne({
                internshipId: internship._id,
                studentId: req.user._id
            });
            res.status(200).json({
                success: true,
                data: {
                    ...internshipData,
                    hasApplied: !!application
                }
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

        // DYNAMIC SETTINGS: Require Company Verification
        const verificationSetting = await SystemSetting.findOne({ key: 'requireCompanyVerification' });
        const requireVerification = verificationSetting?.value === true || verificationSetting?.value === 'true';

        if (requireVerification && !company.verified) {
            res.status(403).json({
                success: false,
                message: 'Your company account must be verified by an administrator before you can post internships.'
            });
            return;
        }

        // DYNAMIC SETTINGS: Daily Internship Post Limit
        const limitSetting = await SystemSetting.findOne({ key: 'maxInternshipPostsPerDay' });
        const maxPostsPerDay = limitSetting?.value ? Number(limitSetting.value) : 10;

        // DYNAMIC TIMEZONE: Get Start of Day
        const timezoneSetting = await SystemSetting.findOne({ key: 'timezone' });
        const timezone = timezoneSetting?.value || 'Asia/Kolkata';

        // Use MongoDB to calculate start of day
        const dateResult = await Internship.aggregate([
            {
                $project: {
                    startOfDay: {
                        $dateTrunc: {
                            date: new Date(),
                            unit: "day",
                            timezone: timezone
                        }
                    }
                }
            },
            { $limit: 1 }
        ]);

        let startOfDay;
        if (dateResult.length > 0) {
            startOfDay = dateResult[0].startOfDay;
        } else {
            const now = new Date();
            const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
            const offset = timezone === 'Asia/Kolkata' ? 5.5 : 0;
            const localTime = new Date(utcTime + (offset * 3600000));
            localTime.setHours(0, 0, 0, 0);
            startOfDay = new Date(localTime.getTime() - (offset * 3600000));
        }

        const dailyCount = await Internship.countDocuments({
            companyId: company._id,
            createdAt: { $gte: startOfDay }
        });

        if (dailyCount >= maxPostsPerDay) {
            res.status(403).json({
                success: false,
                message: `You have reached your daily internship posting limit (${maxPostsPerDay}). Please try again tomorrow.`
            });
            return;
        }

        // MODERATION: Scan for keywords
        const { scanContent, createAutomatedFlag } = require('../utils/moderationService');
        const titleScan = scanContent(validatedData.title);
        const descScan = scanContent(validatedData.description);

        if (titleScan.flagged || descScan.flagged) {
            await createAutomatedFlag({
                reportedUserId: req.user?._id,
                category: 'spam',
                subject: 'Potential Spam Internship',
                body: `Internship "${validatedData.title}" triggered automated flag.`,
                metadata: {
                    titleMatches: titleScan.matches,
                    descMatches: descScan.matches
                }
            });
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

        const validatedData = internshipSchema.partial().parse(req.body);

        // If deadline is being updated, check if we should reset 'expired' status to 'active'
        if (validatedData.deadline) {
            const newDeadline = new Date(validatedData.deadline);
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            if (newDeadline >= now && internship.status === 'expired') {
                validatedData.status = 'active';
            }
        }

        // Block manual activation if the effective deadline is in the past
        if (validatedData.status === 'active') {
            const effectiveDeadline = validatedData.deadline ? new Date(validatedData.deadline) : internship.deadline;
            if (effectiveDeadline) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (new Date(effectiveDeadline) < now) {
                    res.status(400).json({
                        success: false,
                        message: 'Cannot activate an internship with a past deadline'
                    });
                    return;
                }
            }
        }

        internship = await Internship.findByIdAndUpdate(req.params.id, validatedData, {
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

// @desc    Increment internship views
// @route   PATCH /api/internships/:id/views
// @access  Public
export const incrementViews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const internship = await Internship.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true, timestamps: false }
        );

        if (!internship) {
            res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { views: internship.views }
        });
    } catch (error) {
        next(error);
    }
};
