import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Report from '../models/Report';
import { AuthRequest } from '../types';
import { uploadToR2 } from '../utils/r2Storage';
import { sendEmail } from '../utils/emailService';
import { getReportSubmissionTemplate } from '../utils/reportEmailTemplates';

// Updated Schema
const reportSchema = z.object({
    internshipId: z.string().optional(),
    applicationId: z.string().optional(),
    reportedUserId: z.string().optional(),
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    body: z.string().min(5, 'Description must be at least 5 characters'),
    category: z.string().default('other'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    context: z.string().optional() // JSON string of snapshot data
});

// @desc    Create a report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = reportSchema.parse(req.body);
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
                    html: getReportSubmissionTemplate(req.user.name, report.subject, report.body, report.screenshots)
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
            .populate('internshipId')
            .populate('applicationId')
            .populate('reporterId', 'name email')
            .populate('reportedUserId', 'name email role');

        if (!report) {
            res.status(404).json({ success: false, message: 'Report not found' });
            return;
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};
