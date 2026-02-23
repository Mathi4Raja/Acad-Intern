import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Report from '../models/Report';
import Application from '../models/Application';
import Internship from '../models/Internship';
import User from '../models/User';
import { AuthRequest } from '../types';
import { uploadToR2 } from '../utils/r2Storage';
import { sendEmail } from '../utils/emailService';
import { getReportSubmissionTemplate } from '../utils/reportEmailTemplates';

// Updated Schema
const reportSchema = z.object({
    internshipId: z.string().optional(),
    applicationId: z.string().optional(),
    reportedUserId: z.string().optional(),
    subject: z.string().min(3, 'Subject must be at least 3 characters').optional().default('General Report'),
    body: z.string().min(5, 'Description must be at least 5 characters').optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters').optional(),
    category: z.string().default('other'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    context: z.string().optional() // JSON string of snapshot data
}).refine(data => data.body || data.reason, {
    message: "Either body or reason must be provided",
    path: ["body"]
});

// @desc    Create a report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = reportSchema.parse(req.body);

        // Use reason as body if body is empty
        const finalBody = validatedData.body || validatedData.reason || '';

        const screenshots: string[] = [];

        // Handle screenshot uploads
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (const file of req.files as any[]) {
                const result = await uploadToR2(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    `${req.user?._id}_${Date.now()}`,
                    undefined,
                    'report'
                );
                screenshots.push(result.secure_url);
            }
        }

        const report = await Report.create({
            ...validatedData,
            body: finalBody,
            context: validatedData.context ? JSON.parse(validatedData.context) : null,
            reporterId: req.user?._id,
            screenshots,
            status: 'open'
        });

        // Send confirmation email to reporter
        if (req.user?.email) {
            try {
                await sendEmail({
                    to: req.user.email,
                    subject: `Report Received: ${report.subject}`,
                    text: `We've received your report regarding "${report.subject}". Our team will review it shortly.`,
                    html: getReportSubmissionTemplate(req.user.name, report.subject, finalBody, report.screenshots)
                });
            } catch (emailErr) {
                console.error('Failed to send report confirmation email:', emailErr);
                // Non-blocking
            }
        }

        res.status(201).json({
            success: true,
            data: report
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, errors: error.errors });
            return;
        }
        next(error);
    }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports
// @access  Private (Admin)
export const getReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status, category, priority } = req.query;
        const query: any = {};

        if (status && status !== 'all') query.status = status;
        if (category && category !== 'all') query.category = category;
        if (priority && priority !== 'all') query.priority = priority;

        const reports = await Report.find(query)
            .populate('internshipId', 'title')
            .populate('reporterId', 'name email')
            .populate('reportedUserId', 'name email role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single report (Admin)
// @route   GET /api/reports/:id
// @access  Private (Admin)
export const getReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const report = await Report.findById(req.params.id)
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
            .populate('reportedUserId', 'name email role isShadowBanned');

        if (!report) {
            res.status(404).json({ success: false, message: 'Report not found' });
            return;
        }

        // Self-healing: Derive reportedUserId if missing but context exists
        if (!report.reportedUserId) {
            try {
                if (report.applicationId) {
                    const app = await Application.findById(report.applicationId)
                        .populate({ path: 'internshipId', populate: { path: 'companyId' } });

                    if (app) {
                        const reporterIdStr = report.reporterId ? (report.reporterId as any)._id?.toString() || report.reporterId.toString() : '';
                        const studentIdStr = app.studentId?.toString();

                        let targetUserId = null;
                        if (reporterIdStr === studentIdStr) {
                            // Reporter is student, reported is company owner
                            targetUserId = (app.internshipId as any)?.companyId?.userId;
                        } else {
                            // Reporter is likely company, reported is student
                            targetUserId = app.studentId;
                        }

                        if (targetUserId) {
                            (report as any).reportedUserId = await User.findById(targetUserId).select('name email role isShadowBanned');
                        }
                    }
                } else if (report.internshipId) {
                    const internship = await Internship.findById(report.internshipId).populate('companyId');
                    if (internship) {
                        const companyUserId = (internship.companyId as any)?.userId;
                        if (companyUserId) {
                            (report as any).reportedUserId = await User.findById(companyUserId).select('name email role isShadowBanned');
                        }
                    }
                }
            } catch (err) {
                console.error('Self-healing reportedUserId failed:', err);
                // Continue with missing ID
            }
        }

        const reportObj = report.toObject() as any;
        const internship = report.internshipId || (report.applicationId as any)?.internshipId;
        const company = internship?.companyId;

        res.status(200).json({
            success: true,
            data: {
                ...reportObj,
                id: report._id,
                type: report.applicationId ? 'chat' : 'internship',
                internshipTitle: internship?.title,
                internshipId: internship?._id || report.internshipId,
                applicationId: report.applicationId?._id || report.applicationId,
                companyName: company?.companyName,
                reportedBy: report.reporterId ? (report.reporterId as any).name : 'Unknown',
                reporterEmail: report.reporterId ? (report.reporterId as any).email : undefined,
                reportedUserId: report.reportedUserId ? (report.reportedUserId as any)._id : undefined,
                reportedUserName: report.reportedUserId ? (report.reportedUserId as any).name : undefined,
                reportedUserEmail: report.reportedUserId ? (report.reportedUserId as any).email : undefined,
                reportedUserRole: report.reportedUserId ? (report.reportedUserId as any).role : undefined,
                reportedUserShadowBanned: report.reportedUserId ? (report.reportedUserId as any).isShadowBanned : false,
                origin: report.context?.sourcePath ||
                    (report.context?.sourceUrl ? new URL(report.context.sourceUrl).pathname : undefined) ||
                    (report.applicationId ? "/messages (Chat)" :
                        report.internshipId ? "/internships/details" :
                            report.subject?.includes("Report Student:") ? "/company/student/profile" : "Legacy Report")
            }
        });
    } catch (error) {
        next(error);
    }
};
