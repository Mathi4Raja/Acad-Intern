import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Report from '../models/Report';
import { AuthRequest } from '../types';

// Schema
const reportSchema = z.object({
    internshipId: z.string().optional(),
    applicationId: z.string().optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters')
});

// @desc    Create a report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { internshipId, applicationId, reason } = reportSchema.parse(req.body);

        const report = await Report.create({
            internshipId,
            applicationId,
            reporterId: req.user?._id,
            reason
        });

        res.status(201).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports
// @access  Private (Admin)
export const getReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const reports = await Report.find()
            .populate('internshipId', 'title')
            .populate('reporterId', 'name email')
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
