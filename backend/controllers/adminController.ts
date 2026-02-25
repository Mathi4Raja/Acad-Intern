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
import { restartScheduler } from '../utils/scheduler';
import { sendEmail } from '../utils/emailService';
import { getReportResolvedTemplate } from '../utils/reportEmailTemplates';

// Validation schemas
const updateUserStatusSchema = z.object({
    status: z.enum(['active', 'pending', 'suspended'])
});

const updateCompanySchema = z.object({
    status: z.enum(['active', 'pending', 'suspended']).optional(),
    verified: z.boolean().optional()
});

const updateInternshipStatusSchema = z.object({
    status: z.enum(['active', 'inactive', 'completed', 'in_progress', 'rejected'])
});

const updateReportStatusSchema = z.object({
    status: z.enum(['open', 'under_review', 'resolved', 'dismissed']),
    resolution: z.string().optional()
});

interface UserQuery {
    _id?: any;
    role?: string;
    status?: string;
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

interface CompanyQuery {
    _id?: any;
    status?: string;
    verified?: boolean;
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

interface InternshipQuery {
    _id?: any;
    status?: string;
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
            User.countDocuments({ role: 'company', status: 'active' }),
            User.countDocuments({ role: 'company', status: 'pending' }),
            User.countDocuments({ role: 'company', status: 'suspended' }),
            Internship.countDocuments(),
            Internship.countDocuments({ status: 'active' }),
            Report.countDocuments({ status: 'open' }),
            Report.countDocuments(),
            Report.countDocuments({ status: 'under_review' }),
            Report.countDocuments({ status: 'resolved' }),
            Report.countDocuments({ priority: 'high' }),
            User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt status'),
            Internship.find().sort({ createdAt: -1 }).limit(5).populate('companyId', 'companyName').select('title companyId createdAt status'),
            Report.find({ status: { $in: ['open', 'under_review'] } }).sort({ createdAt: -1 }).limit(5).populate('internshipId', 'title').populate('applicationId').populate('reporterId', 'name')
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
                    postedDate: int.createdAt, status: int.status
                })),
                pendingReports: pendingReportsList.map((report: any) => ({
                    id: report._id, internshipTitle: report.internshipId?.title || 'Unknown',
                    reportedBy: report.reporterId?.name || 'Unknown',
                    subject: report.subject,
                    body: report.body,
                    reason: report.subject || report.reason || 'No Subject',
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
        const { id, role, status, search, page = '1', limit = '20' } = req.query;
        const query: UserQuery = {};

        if (id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
            query._id = id;
        } else if (id) {
            // If ID is provided but invalid, return empty or error?
            // Let's return empty to avoid crash but indicate something was wrong if needed.
            // Actually, if we are specifically looking for an ID and it's invalid, it won't find anything.
            // But if we set it as _id: id, Mongoose will throw CastError.
            // Let's just ignore the invalid ID and let it proceed to other filters if any, 
            // OR return empty if ID was explicitly intended.
            res.status(400).json({ success: false, message: 'Invalid User ID format' });
            return;
        } else {
            if (role && role !== 'all' && typeof role === 'string') query.role = role;
            if (status && status !== 'all' && typeof status === 'string') query.status = status;
        }

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
                userObj.phone = profile?.phone || null;
                userObj.applications = applications;
            } else if (user.role === 'company') {
                const company = await Company.findOne({ userId: user._id });
                const internships = await Internship.countDocuments({ companyId: company?._id });
                userObj.companyName = company?.companyName || null;
                userObj.verified = company?.verified || false;
                userObj.phone = company?.phone || null;
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

        // If an admin manually activates a user, we assume their identity is verified
        if (status === 'active') {
            user.isEmailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
        }

        await user.save();

        res.status(200).json({ success: true, message: `User ${status === 'active' ? 'activated and verified' : 'updated'}`, data: user });
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
                // Find all internships and delete their applications first
                const internships = await Internship.find({ companyId: company._id });
                const internshipIds = internships.map(i => i._id);
                await Application.deleteMany({ internshipId: { $in: internshipIds } });

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

        const pipeline: any[] = [];

        // Lookup User details
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        });
        pipeline.push({ $unwind: '$user' });

        // Match Logic
        const match: any = {};

        if (status && status !== 'all') {
            match['user.status'] = status;
        }

        if (verified !== undefined && verified !== 'all') {
            match['verified'] = verified === 'true';
        }

        if (search) {
            match['companyName'] = { $regex: search, $options: 'i' };
        }

        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }

        pipeline.push({ $sort: { createdAt: -1 } });

        const companies = await Company.aggregate(pipeline);

        const companiesWithStats = await Promise.all(companies.map(async (company) => {
            const internships = await Internship.countDocuments({ companyId: company._id });
            const activeInternships = await Internship.countDocuments({ companyId: company._id, status: 'active' });
            // Retrieve distinct internship IDs for application count
            const companyInternships = await Internship.find({ companyId: company._id }).distinct('_id');
            const applications = await Application.countDocuments({
                internshipId: { $in: companyInternships }
            });

            return {
                ...company,
                userId: company.user, // Re-attach user object from lookup
                email: company.user?.email,
                joinedDate: company.user?.createdAt,
                phone: company.phone || company.user?.phone || null,
                internshipsPosted: internships,
                activeInternships,
                totalApplications: applications
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

        if (validatedData.status !== undefined) {
            company.set('status', validatedData.status);
            if (company.userId) {
                await User.findByIdAndUpdate(company.userId, { status: validatedData.status });
            }
        }
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

// @desc    Delete company
// @route   DELETE /api/admin/companies/:id
// @access  Private (Admin)
export const deleteCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            res.status(404).json({ success: false, message: 'Company not found' });
            return;
        }

        // Find all internships posted by this company
        const internships = await Internship.find({ companyId: company._id });
        const internshipIds = internships.map(i => i._id);

        // Delete all applications for these internships
        await Application.deleteMany({ internshipId: { $in: internshipIds } });

        // Delete all internships
        await Internship.deleteMany({ companyId: company._id });

        // Delete the company user account if it exists
        if (company.userId) {
            await User.deleteOne({ _id: company.userId });
        }

        // Delete the company profile
        await company.deleteOne();

        res.status(200).json({ success: true, message: 'Company and all associated data (internships, applications, user account) deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all internships (for admin)
// @route   GET /api/admin/internships
// @access  Private (Admin)
export const getAllInternships = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status, search, id } = req.query;
        const query: InternshipQuery = {};

        if (id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
            query._id = id;
        }

        if (status && status !== 'all' && typeof status === 'string') query.status = status;

        if (search && typeof search === 'string') {
            query.$or = [{ title: { $regex: search, $options: 'i' } }];
        }

        const internships = await Internship.find(query).populate('companyId', 'companyName verified').sort({ createdAt: -1 });

        const internshipsWithStats = await Promise.all(internships.map(async (internship) => {
            const intObj = internship.toObject() as any;
            const applicants = await Application.countDocuments({ internshipId: internship._id });
            return { ...intObj, company: intObj.companyId?.companyName || 'Unknown', applicants, status: intObj.status };
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
        const { status } = updateInternshipStatusSchema.parse(req.body);
        const internship = await Internship.findById(req.params.id);

        if (!internship) {
            res.status(404).json({ success: false, message: 'Internship not found' });
            return;
        }

        internship.status = status;
        await internship.save();

        res.status(200).json({ success: true, message: `Internship ${status}`, data: internship });
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
            .populate({
                path: 'internshipId',
                select: 'title companyId',
                populate: { path: 'companyId', select: 'companyName' }
            })
            .populate({
                path: 'applicationId',
                populate: {
                    path: 'internshipId',
                    select: 'title companyId',
                    populate: { path: 'companyId', select: 'companyName' }
                }
            })
            .populate('reporterId', 'name email')
            .populate('reportedUserId', 'name email role isShadowBanned')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true, count: reports.length,
            data: reports.map((report: any) => {
                const internship = report.internshipId || report.applicationId?.internshipId;
                const company = internship?.companyId;

                return {
                    id: report._id,
                    type: report.applicationId ? 'chat' : 'internship',
                    internshipTitle: internship?.title,
                    internshipId: internship?._id || report.internshipId,
                    applicationId: report.applicationId?._id || report.applicationId,
                    companyName: company?.companyName,
                    reportedBy: report.reporterId?.name || 'Unknown',
                    reporterEmail: report.reporterId?.email,
                    reporterId: report.reporterId?._id,
                    subject: report.subject,
                    body: report.body,
                    reason: report.subject || report.reason || 'No Subject',
                    status: report.status,
                    priority: report.priority || 'medium',
                    resolution: report.resolution,
                    reportedDate: report.createdAt,
                    reviewedAt: report.reviewedAt,
                    reportedUserId: report.reportedUserId?._id || report.reportedUserId,
                    reportedUserName: report.reportedUserId?.name,
                    reportedUserEmail: report.reportedUserId?.email,
                    reportedUserRole: report.reportedUserId?.role,
                    reportedUserShadowBanned: report.reportedUserId?.isShadowBanned || false,
                    origin: report.context?.sourcePath ||
                        (report.context?.sourceUrl ? new URL(report.context.sourceUrl).pathname : undefined) ||
                        (report.applicationId ? "/messages (Chat)" :
                            report.internshipId ? "/internships/details" :
                                report.subject?.includes("Report Student:") ? "/company/student/profile" : "Legacy Report")
                };
            })
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

        const oldStatus = report.status;
        report.status = status as any;
        if (resolution) report.adminNotes = resolution;

        if (status === 'resolved' || status === 'dismissed') {
            report.reviewedAt = new Date();
            report.reviewedBy = req.user?._id;

            // CLEANUP: Delete screenshots from R2 when resolved/dismissed to save space
            if (report.screenshots && report.screenshots.length > 0) {
                const { deleteFromR2, getKeyFromUrl } = require('../utils/r2Storage');
                for (const url of report.screenshots) {
                    const key = getKeyFromUrl(url);
                    if (key) {
                        try {
                            await deleteFromR2(key);
                        } catch (err) {
                            console.error(`Failed to delete report screenshot ${key}:`, err);
                        }
                    }
                }
                report.screenshots = []; // Clear URLs after deletion
            }

            // EMAIL NOTIFICATION: Notify reporter when resolved
            if (status === 'resolved') {
                const emailSetting = await SystemSetting.findOne({ key: 'reportStatusEmail' });
                const shouldSendEmail = emailSetting ? (emailSetting.value === true || emailSetting.value === 'true') : true;

                if (shouldSendEmail) {
                    await report.populate('reporterId', 'name email');
                    const reporter = report.reporterId as any;

                    if (reporter?.email) {
                        try {
                            await sendEmail({
                                to: reporter.email,
                                subject: `Update on your report: ${report.subject}`,
                                text: `Your report regarding "${report.subject}" has been resolved. Resolution: ${resolution || 'Appropriate action has been taken.'}`,
                                html: getReportResolvedTemplate(reporter.name || 'User', report.subject, resolution || '')
                            });
                        } catch (emailErr) {
                            console.error('Failed to send report resolution email:', emailErr);
                            // Non-blocking
                        }
                    }
                }
            }
        }

        await report.save();
        res.status(200).json({ success: true, message: `Report ${status}`, data: report });
    } catch (error) {
        next(error);
    }
};

// @desc    Temporarily suspend user
// @route   POST /api/admin/users/:id/suspend
// @access  Private (Admin)
export const tempSuspendUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { durationDays, reason } = z.object({
            durationDays: z.number().min(1),
            reason: z.string().min(5)
        }).parse(req.body);

        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + durationDays);

        user.status = 'suspended';
        user.suspendedUntil = suspendUntil;
        if (reason) {
            if (!user.moderatorNotes) user.moderatorNotes = [];
            user.moderatorNotes.push(`[SUSPENSION] ${reason} (Days: ${durationDays}, By: ${req.user?.name})`);
        }

        await user.save();
        res.status(200).json({ success: true, message: `User suspended for ${durationDays} days`, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle shadow ban (set state)
// @route   POST /api/admin/users/:id/shadow-ban
// @access  Private (Admin)
export const toggleShadowBan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { shadowBanned } = z.object({
            shadowBanned: z.boolean()
        }).parse(req.body);

        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        user.isShadowBanned = shadowBanned;
        if (!user.moderatorNotes) user.moderatorNotes = [];
        user.moderatorNotes.push(`[SHADOW_BAN] ${shadowBanned ? 'Enabled' : 'Disabled'} by ${req.user?.name}`);

        await user.save();
        res.status(200).json({ success: true, message: `Shadow ban ${shadowBanned ? 'enabled' : 'disabled'}`, data: user });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
            return;
        }
        next(error);
    }
};

// @desc    Suspend user temporarily
// @route   POST /api/admin/users/:id/suspend
// @access  Private (Admin)
export const suspendUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { durationDays, reason } = z.object({
            durationDays: z.number().min(1),
            reason: z.string().min(5)
        }).parse(req.body);

        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);

        user.status = 'suspended';
        user.suspendedUntil = suspendedUntil;
        if (!user.moderatorNotes) user.moderatorNotes = [];
        user.moderatorNotes.push(`[SUSPENSION] Suspended for ${durationDays} days by ${req.user?.name}. Reason: ${reason}`);

        await user.save();
        res.status(200).json({
            success: true,
            message: `User suspended until ${suspendedUntil.toLocaleDateString()}`,
            data: user
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: 'Validation error', errors: error.errors });
            return;
        }
        next(error);
    }
};

// @desc    Add moderator note to user
// @route   POST /api/admin/users/:id/notes
// @access  Private (Admin)
export const addModeratorNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { note } = z.object({ note: z.string().min(1) }).parse(req.body);
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        if (!user.moderatorNotes) user.moderatorNotes = [];
        user.moderatorNotes.push(`[NOTE] ${note} (By: ${req.user?.name}, Date: ${new Date().toLocaleDateString()})`);

        await user.save();
        res.status(200).json({ success: true, message: 'Note added', data: user.moderatorNotes });
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
            let value = setting.value;

            // Type casting logic
            if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            } else if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)) &&
                (setting.group !== 'general' || setting.key.includes('Count') || setting.key.includes('Limit') || setting.key.includes('Day') || setting.key.includes('Size') || setting.key.includes('Attempts') || setting.key.includes('Expiry') || setting.key.includes('Timeout') || setting.key.includes('Port'))) {
                // Only cast to number if it's explicitly a numeric field to avoid casting site names etc.
                value = Number(value);
            }

            settingsMap[setting.key] = value;
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
        let shouldRestartScheduler = false;

        const updates = [];
        for (const [key, value] of Object.entries(settings)) {
            if (
                key === 'timezone' ||
                key === 'autoBackup' ||
                key === 'backupFrequency' ||
                key === 'expiredApplicationCleanupDays' ||
                key === 'staleApplicationReminderDays' ||
                key === 'internshipClosingSoonDays' ||
                key === 'assessmentExpiryDays'
            ) {
                shouldRestartScheduler = true;
            }
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

        if (shouldRestartScheduler) {
            await restartScheduler();
        }

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get comprehensive analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin)
export const getAnalyticsStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { range } = req.query;
        let startDate = new Date();

        // Calculate start date based on range
        switch (range) {
            case '7days': startDate.setDate(startDate.getDate() - 7); break;
            case '30days': startDate.setDate(startDate.getDate() - 30); break;
            case '3months': startDate.setMonth(startDate.getMonth() - 3); break;
            case '6months': startDate.setMonth(startDate.getMonth() - 6); break;
            case '1year': startDate.setFullYear(startDate.getFullYear() - 1); break;
            default: startDate.setDate(startDate.getDate() - 30); // Default 30 days
        }

        // 1. User Growth (Group by Month for trend)
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                        role: "$role"
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Process user growth for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const userGrowthMap = new Map();

        userGrowth.forEach((item: any) => {
            const key = `${months[item._id.month - 1]}`;
            if (!userGrowthMap.has(key)) {
                userGrowthMap.set(key, { month: key, students: 0, companies: 0 });
            }
            if (item._id.role === 'student') userGrowthMap.get(key).students += item.count;
            if (item._id.role === 'company') userGrowthMap.get(key).companies += item.count;
        });
        const userGrowthData = Array.from(userGrowthMap.values());

        // 2. Internship Statistics
        const internshipStats = await Internship.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalInternships = internshipStats.reduce((acc: number, curr: any) => acc + curr.count, 0);
        // Map backend statuses to frontend chart labels/colors
        const internshipData = [
            { label: 'Active', value: internshipStats.find((i: any) => i._id === 'active')?.count || 0, color: '#10b981' }, // green-500
            { label: 'Completed', value: internshipStats.find((i: any) => i._id === 'completed')?.count || 0, color: '#8b5cf6' }, // violet-500
            { label: 'In Progress', value: internshipStats.find((i: any) => i._id === 'in_progress')?.count || 0, color: '#f59e0b' }, // amber-500
            { label: 'Rejected', value: internshipStats.find((i: any) => i._id === 'rejected')?.count || 0, color: '#ef4444' } // red-500
        ].map(item => ({ ...item, percentage: totalInternships ? ((item.value / totalInternships) * 100).toFixed(1) : 0 }));

        // Add total posted for reference in the UI list if needed, but the main bars are statuses
        internshipData.unshift({
            label: 'Total Posted',
            value: totalInternships,
            color: '#3b82f6', // blue-500
            percentage: '100.0'
        });

        // 3. Application Funnel
        const appStats = await Application.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalApps = appStats.reduce((acc: number, curr: any) => acc + curr.count, 0);
        const funnelOrder = ['pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'accepted'];
        const funnelLabels: Record<string, string> = {
            'pending': 'Under Review', // Or 'Pending Review'
            'reviewed': 'Reviewed',
            'shortlisted': 'Shortlisted',
            'interview_scheduled': 'Interview Scheduled',
            'accepted': 'Accepted'
        };

        const funnelData = funnelOrder.map(status => {
            const count = appStats.find((a: any) => a._id === status)?.count || 0;
            return {
                stage: funnelLabels[status] || status,
                count,
                percentage: totalApps ? ((count / totalApps) * 100).toFixed(1) : 0
            };
        });

        if (totalApps > 0) {
            funnelData.unshift({ stage: 'Total Applications', count: totalApps, percentage: '100' });
        }

        // 4. Top Companies
        const topCompanies = await Application.aggregate([
            {
                $lookup: {
                    from: "internships",
                    localField: "internshipId",
                    foreignField: "_id",
                    as: "internship"
                }
            },
            { $unwind: "$internship" },
            {
                $lookup: {
                    from: "companies",
                    localField: "internship.companyId",
                    foreignField: "_id",
                    as: "company"
                }
            },
            { $unwind: "$company" },
            {
                $group: {
                    _id: "$company._id",
                    name: { $first: "$company.companyName" },
                    applications: { $sum: 1 },
                    internships: { $addToSet: "$internship._id" }
                }
            },
            { $sort: { applications: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: 1,
                    applications: 1,
                    internships: { $size: "$internships" },
                    hiringRate: { $literal: Math.floor(Math.random() * 15) + 5 } // Simulation for now
                }
            }
        ]);

        // 5. Geo Distribution
        const geoDist = await StudentProfile.aggregate([
            { $match: { location: { $exists: true, $ne: "" } } },
            {
                $group: {
                    _id: "$location",
                    users: { $sum: 1 }
                }
            },
            { $sort: { users: -1 } },
            { $limit: 5 }
        ]);

        const totalGeoUsers = geoDist.reduce((acc: number, curr: any) => acc + curr.users, 0);
        const geoData = geoDist.map((g: any) => ({
            location: g._id,
            users: g.users,
            percentage: totalGeoUsers ? ((g.users / totalGeoUsers) * 100).toFixed(1) : 0
        }));

        // 6. Most In-Demand Skills
        const skillStats = await Internship.aggregate([
            { $match: { status: 'active' } },
            { $unwind: "$skillsRequired" },
            {
                $group: {
                    _id: "$skillsRequired",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const skillsData = skillStats.map((s: any) => ({
            skill: s._id,
            count: s.count
        }));

        // 7. Activity by Day of Week
        const timezoneSetting = await SystemSetting.findOne({ key: 'timezone' });
        const timezone = timezoneSetting?.value || 'Asia/Kolkata';

        const activityStats = await Application.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dayOfWeek: { date: "$createdAt", timezone: timezone } }, // Dynamic Timezone
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Reorder to start with Monday as per user reference
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const activityData = days.map((day, index) => {
            // MongoDB $dayOfWeek: 1=Sun, 2=Mon, ..., 7=Sat
            // We want Mon(2) -> index 0, Tue(3) -> index 1, ..., Sat(7) -> index 5, Sun(1) -> index 6
            let dayId;
            if (day === 'Sun') dayId = 1;
            else dayId = index + 2; // Mon is index 0 + 2 = 2, etc.

            const found = activityStats.find((a: any) => a._id === dayId);
            return {
                day: day,
                applications: found ? found.count : 0
            };
        });

        // Helper to calculate percentage growth
        const calculateGrowth = async (Model: any, currentStart: Date, previousStart: Date) => {
            const currentCount = await Model.countDocuments({ createdAt: { $gte: currentStart } });
            const previousCount = await Model.countDocuments({ createdAt: { $gte: previousStart, $lt: currentStart } });

            if (previousCount === 0) return currentCount > 0 ? 100 : 0;
            return ((currentCount - previousCount) / previousCount) * 100;
        };

        // Determine previous period start date
        const duration = new Date().getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - duration);

        // Calculate trends
        const userGrowthPct = await calculateGrowth(User, startDate, previousStartDate);
        const internshipGrowthPct = await calculateGrowth(Internship, startDate, previousStartDate);
        const appGrowthPct = await calculateGrowth(Application, startDate, previousStartDate);
        const companyGrowthPct = await calculateGrowth(Company, startDate, previousStartDate);

        // 8. Key Insights & Hiring Rate
        // Real Average Hiring Rate: (Total Accepted Applications / Total Applications) * 100
        const totalApplicationsCount = await Application.countDocuments();
        const acceptedApplicationsCount = await Application.countDocuments({ status: 'accepted' });
        const realAvgHiringRate = totalApplicationsCount > 0
            ? ((acceptedApplicationsCount / totalApplicationsCount) * 100).toFixed(1)
            : "0.0";

        // Peak Activity Day
        const peakDay = activityData.reduce((prev, current) => (prev.applications > current.applications) ? prev : current, { day: 'N/A', applications: 0 });

        // Most Popular Location
        const topLocation = geoData.length > 0 ? geoData[0] : { location: 'N/A', percentage: 0 };

        // Top Skill
        const topSkill = skillsData.length > 0 ? skillsData[0] : { skill: 'N/A', count: 0 };


        res.status(200).json({
            success: true,
            data: {
                userGrowth: userGrowthData,
                internshipStats: internshipData,
                applicationFunnel: funnelData,
                topCompanies,
                geographicData: geoData,
                skillsData,
                activityData,
                insights: {
                    peakDay: peakDay.day,
                    peakDayCount: peakDay.applications,
                    topLocation: topLocation.location,
                    topLocationPct: topLocation.percentage,
                    topSkill: topSkill.skill,
                    topSkillCount: topSkill.count,
                    avgHiringRate: `${realAvgHiringRate}%`
                },
                overview: {
                    totalUsers: await User.countDocuments(),
                    userGrowth: userGrowthPct.toFixed(1),
                    totalInternships: totalInternships,
                    internshipGrowth: internshipGrowthPct.toFixed(1),
                    totalApplications: await Application.countDocuments(),
                    applicationGrowth: appGrowthPct.toFixed(1),
                    activeCompanies: await Company.countDocuments({ status: 'active' }),
                    companyGrowth: companyGrowthPct.toFixed(1)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper to determine group based on key prefix or name
const getGroupForKey = (key: string): string => {
    if (key.startsWith('email') || key.includes('Email') || key.includes('smtp')) return 'email';
    if (key === 'timezone' || key.startsWith('security') || key.includes('Pass') || key.includes('login') || key.includes('Auth')) return 'security';
    if (key.startsWith('site') || key.includes('maintenance')) return 'general';
    if (key.startsWith('company') || key.includes('Internship') || key.includes('Approve')) return 'companies';
    if (key.startsWith('student') || key.includes('Application') || key.includes('assessment') || key.includes('Assessment')) return 'students';
    if (key.startsWith('maxFile') || key.startsWith('maxMessage') || key.includes('Upload')) return 'files';
    if (key.includes('Reminder') || key.includes('Alert') || key.includes('Notification')) return 'notifications';
    if (key.includes('Backup') || key.includes('retention') || key.includes('Cleanup')) return 'database';
    return 'other';
};
