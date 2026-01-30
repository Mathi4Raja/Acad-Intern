import { Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Company from '../models/Company';
import StudentProfile from '../models/StudentProfile';
import Internship from '../models/Internship';
import Application from '../models/Application';
import Report from '../models/Report';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest, IUser, ICompany, IInternship, IReport } from '../types';

// Validation schemas
const updateUserStatusSchema = z.object({
    status: z.enum(['active', 'pending', 'suspended'])
});

const updateCompanySchema = z.object({
    status: z.enum(['active', 'pending', 'suspended']).optional(),
    verified: z.boolean().optional()
});

const updateInternshipStatusSchema = z.object({
    isActive: z.boolean()
});

const updateReportStatusSchema = z.object({
    status: z.enum(['open', 'under_review', 'resolved', 'dismissed']),
    resolution: z.string().optional()
});

interface UserQuery {
    role?: string;
    status?: string;
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

interface CompanyQuery {
    status?: string;
    verified?: boolean;
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

interface InternshipQuery {
    isActive?: boolean;
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

interface ReportQuery {
    status?: string;
    priority?: string;
}

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const [
            totalUsers,
            totalStudents,
            totalCompanies,
            activeUsers,
            pendingUsers,
            suspendedUsers,
            verifiedCompanies,
            unverifiedCompanies,
            activeCompanies,
            pendingCompanies,
            suspendedCompanies,
            totalInternships,
            activeInternships,
            pendingReports,
            totalReports,
            underReviewReports,
            resolvedReports,
            highPriorityReports,
            recentUsers,
            recentInternships,
            pendingReportsList
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'company' }),
            User.countDocuments({ status: 'active' }),
            User.countDocuments({ status: 'pending' }),
            User.countDocuments({ status: 'suspended' }),
            Company.countDocuments({ verified: true }),
            Company.countDocuments({ verified: false }),
            Company.countDocuments({ status: 'active' }),
            Company.countDocuments({ status: 'pending' }),
            Company.countDocuments({ status: 'suspended' }),
            Internship.countDocuments(),
            Internship.countDocuments({ isActive: true }),
            Report.countDocuments({ status: 'open' }),
            Report.countDocuments(),
            Report.countDocuments({ status: 'under_review' }),
            Report.countDocuments({ status: 'resolved' }),
            Report.countDocuments({ priority: 'high' }),
            User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt status'),
            Internship.find().sort({ createdAt: -1 }).limit(5).populate('companyId', 'companyName').select('title companyId createdAt isActive'),
            Report.find({ status: { $in: ['open', 'under_review'] } }).sort({ createdAt: -1 }).limit(5).populate('internshipId', 'title').populate('reporterId', 'name')
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers, totalStudents, totalCompanies, activeUsers, pendingUsers, suspendedUsers,
                    verifiedCompanies, unverifiedCompanies, activeCompanies, pendingCompanies, suspendedCompanies,
                    totalInternships, activeInternships, pendingReports, totalReports, underReviewReports,
                    resolvedReports, highPriorityReports
                },
                recentUsers: recentUsers.map((user: IUser) => ({
                    id: user._id, name: user.name, email: user.email, role: user.role,
                    status: user.status || 'active', joinedDate: user.createdAt
                })),
                recentInternships: recentInternships.map((int: any) => ({
                    id: int._id, title: int.title, company: int.companyId?.companyName || 'Unknown',
                    postedDate: int.createdAt, status: int.isActive ? 'active' : 'inactive'
                })),
                pendingReports: pendingReportsList.map((report: any) => ({
                    id: report._id, internshipTitle: report.internshipId?.title || 'Unknown',
                    reportedBy: report.reporterId?.name || 'Unknown', reason: report.reason,
                    reportedDate: report.createdAt, priority: report.priority || 'medium', status: report.status
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { role, status, search, page = '1', limit = '20' } = req.query;
        const query: UserQuery = {};

        if (role && role !== 'all' && typeof role === 'string') query.role = role;
        if (status && status !== 'all' && typeof status === 'string') query.status = status;
        if (search && typeof search === 'string') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit as string)).select('-password_hash'),
            User.countDocuments(query)
        ]);

        const usersWithDetails = await Promise.all(users.map(async (user) => {
            const userObj = user.toObject() as any;
            if (user.role === 'student') {
                const profile = await StudentProfile.findOne({ userId: user._id });
                const applications = await Application.countDocuments({ studentId: user._id });
                userObj.department = profile?.department || null;
                userObj.applications = applications;
            } else if (user.role === 'company') {
                const company = await Company.findOne({ userId: user._id });
                const internships = await Internship.countDocuments({ companyId: company?._id });
                userObj.companyName = company?.companyName || null;
                userObj.verified = company?.verified || false;
                userObj.internshipsPosted = internships;
            }
            return userObj;
        }));

        res.status(200).json({
            success: true, count: users.length, total, page: parseInt(page as string),
            pages: Math.ceil(total / parseInt(limit as string)), data: usersWithDetails
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status } = updateUserStatusSchema.parse(req.body);
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (user.role === 'admin' && req.user?._id.toString() !== user._id.toString()) {
            res.status(403).json({ success: false, message: 'Cannot modify other admin users' });
            return;
        }

        user.status = status;
        await user.save();

        res.status(200).json({ success: true, message: `User ${status === 'active' ? 'activated' : 'updated'}`, data: user });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
            return;
        }
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (user.role === 'admin') {
            res.status(403).json({ success: false, message: 'Cannot delete admin users' });
            return;
        }

        if (user.role === 'student') {
            await StudentProfile.deleteOne({ userId: user._id });
            await Application.deleteMany({ studentId: user._id });
        } else if (user.role === 'company') {
            const company = await Company.findOne({ userId: user._id });
            if (company) {
                await Internship.deleteMany({ companyId: company._id });
                await company.deleteOne();
            }
        }

        await user.deleteOne();
        res.status(200).json({ success: true, message: 'User and related data deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all companies (for admin)
// @route   GET /api/admin/companies
// @access  Private (Admin)
export const getAllCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status, verified, search } = req.query;
        const query: CompanyQuery = {};

        if (status && status !== 'all' && typeof status === 'string') query.status = status;
        if (verified !== undefined && verified !== 'all') query.verified = verified === 'true';
        if (search && typeof search === 'string') {
            query.$or = [{ companyName: { $regex: search, $options: 'i' } }];
        }

        const companies = await Company.find(query).populate('userId', 'name email createdAt status').sort({ createdAt: -1 });

        const companiesWithStats = await Promise.all(companies.map(async (company) => {
            const companyObj = company.toObject() as any;
            const internships = await Internship.countDocuments({ companyId: company._id });
            const activeInternships = await Internship.countDocuments({ companyId: company._id, isActive: true });
            const applications = await Application.countDocuments({
                internshipId: { $in: await Internship.find({ companyId: company._id }).distinct('_id') }
            });

            return {
                ...companyObj, email: companyObj.userId?.email, joinedDate: companyObj.userId?.createdAt,
                internshipsPosted: internships, activeInternships, totalApplications: applications
            };
        }));

        res.status(200).json({ success: true, count: companies.length, data: companiesWithStats });
    } catch (error) {
        next(error);
    }
};

// @desc    Update company (verify/status)
// @route   PUT /api/admin/companies/:id
// @access  Private (Admin)
export const updateCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = updateCompanySchema.parse(req.body);
        const company = await Company.findById(req.params.id);

        if (!company) {
            res.status(404).json({ success: false, message: 'Company not found' });
            return;
        }

        if (validatedData.status !== undefined) company.set('status', validatedData.status);
        if (validatedData.verified !== undefined) company.verified = validatedData.verified;

        await company.save();
        res.status(200).json({ success: true, message: 'Company updated successfully', data: company });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
            return;
        }
        next(error);
    }
};

// @desc    Get all internships (for admin)
// @route   GET /api/admin/internships
// @access  Private (Admin)
export const getAllInternships = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status, search } = req.query;
        const query: InternshipQuery = {};

        if (status === 'active') query.isActive = true;
        else if (status === 'inactive' || status === 'pending' || status === 'rejected') query.isActive = false;

        if (search && typeof search === 'string') {
            query.$or = [{ title: { $regex: search, $options: 'i' } }];
        }

        const internships = await Internship.find(query).populate('companyId', 'companyName verified').sort({ createdAt: -1 });

        const internshipsWithStats = await Promise.all(internships.map(async (internship) => {
            const intObj = internship.toObject() as any;
            const applicants = await Application.countDocuments({ internshipId: internship._id });
            return { ...intObj, company: intObj.companyId?.companyName || 'Unknown', applicants, status: intObj.isActive ? 'active' : 'inactive' };
        }));

        res.status(200).json({ success: true, count: internships.length, data: internshipsWithStats });
    } catch (error) {
        next(error);
    }
};

// @desc    Update internship status (approve/reject)
// @route   PUT /api/admin/internships/:id
// @access  Private (Admin)
export const updateInternshipStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { isActive } = updateInternshipStatusSchema.parse(req.body);
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            res.status(404).json({ success: false, message: 'Internship not found' });
            return;
        }

        internship.isActive = isActive;
        await internship.save();

        res.status(200).json({ success: true, message: `Internship ${isActive ? 'approved' : 'rejected'}`, data: internship });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
            return;
        }
        next(error);
    }
};

// @desc    Delete internship
// @route   DELETE /api/admin/internships/:id
// @access  Private (Admin)
export const deleteInternship = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            res.status(404).json({ success: false, message: 'Internship not found' });
            return;
        }

        await Application.deleteMany({ internshipId: internship._id });
        await internship.deleteOne();

        res.status(200).json({ success: true, message: 'Internship and related applications deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all reports (admin view with more details)
// @route   GET /api/admin/reports
// @access  Private (Admin)
export const getAllReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status, priority } = req.query;
        const query: ReportQuery = {};

        if (status && status !== 'all' && typeof status === 'string') query.status = status;
        if (priority && priority !== 'all' && typeof priority === 'string') query.priority = priority;

        const reports = await Report.find(query)
            .populate({ path: 'internshipId', select: 'title companyId', populate: { path: 'companyId', select: 'companyName' } })
            .populate('reporterId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true, count: reports.length,
            data: reports.map((report: any) => ({
                id: report._id, type: 'internship', internshipTitle: report.internshipId?.title || 'Unknown',
                internshipId: report.internshipId?._id, companyName: report.internshipId?.companyId?.companyName || 'Unknown',
                reportedBy: report.reporterId?.name || 'Unknown', reporterEmail: report.reporterId?.email,
                reporterId: report.reporterId?._id, reason: report.reason, status: report.status,
                priority: report.priority || 'medium', resolution: report.resolution,
                reportedDate: report.createdAt, reviewedAt: report.reviewedAt
            }))
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin)
export const updateReportStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status, resolution } = updateReportStatusSchema.parse(req.body);
        const report = await Report.findById(req.params.id);

        if (!report) {
            res.status(404).json({ success: false, message: 'Report not found' });
            return;
        }

        report.status = status as 'open' | 'under_review' | 'resolved' | 'dismissed';
        if (resolution) report.adminNotes = resolution;
        if (status === 'resolved' || status === 'dismissed') report.reviewedAt = new Date();

        await report.save();
        res.status(200).json({ success: true, message: `Report ${status}`, data: report });
    } catch (error) {
        next(error);
    }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
export const getSystemSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const settings = await SystemSetting.find({});

        // Convert array to object for easier frontend consumption
        const settingsMap: Record<string, any> = {};
        settings.forEach(setting => {
            if (setting.group === 'security' && (setting.key === 'passwordResetExpiry' || setting.key.includes('Expiry'))) {
                // Ensure numeric values are numbers
                settingsMap[setting.key] = Number(setting.value);
            } else {
                settingsMap[setting.key] = setting.value;
            }
        });

        res.status(200).json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
export const updateSystemSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const settings = req.body; // Expect key-value object

        const updates = [];
        for (const [key, value] of Object.entries(settings)) {
            updates.push(
                SystemSetting.findOneAndUpdate(
                    { key },
                    {
                        key,
                        value,
                        group: getGroupForKey(key),
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                )
            );
        }

        await Promise.all(updates);

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Helper to determine group based on key prefix or name
const getGroupForKey = (key: string): string => {
    if (key.startsWith('email') || key.includes('Email')) return 'email';
    if (key.startsWith('security') || key.includes('Password') || key.includes('login')) return 'security';
    if (key.startsWith('site') || key.includes('maintenance')) return 'general';
    if (key.startsWith('company')) return 'companies';
    if (key.startsWith('student')) return 'students';
    return 'other';
};
