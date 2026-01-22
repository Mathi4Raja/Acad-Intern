import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Application from '../models/Application';
import Internship from '../models/Internship';
import Company from '../models/Company';
import Notification from '../models/Notification';
import { AuthRequest, IInternship } from '../types';

// Validation schemas
const applicationSchema = z.object({
    notes: z.string().max(500, 'Notes cannot be longer than 500 characters').optional()
});

const statusUpdateSchema = z.object({
    status: z.enum(['shortlisted', 'rejected', 'accepted'])
});

// @desc    Apply to an internship
// @route   POST /api/internships/:id/apply
// @access  Private (Student)
export const applyForInternship = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = applicationSchema.parse(req.body);

        const internshipId = req.params.id;
        const studentId = req.user?._id;

        const internship = await Internship.findById(internshipId);
        if (!internship) {
            res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
            return;
        }

        if (!internship.isActive) {
            res.status(400).json({
                success: false,
                message: 'This internship is no longer accepting applications'
            });
            return;
        }

        const existingApplication = await Application.findOne({
            internshipId,
            studentId
        });

        if (existingApplication) {
            res.status(400).json({
                success: false,
                message: 'You have already applied for this internship'
            });
            return;
        }

        const application = await Application.create({
            internshipId,
            studentId,
            notes: validatedData.notes
        });

        const company = await Company.findById(internship.companyId);
        if (company) {
            await Notification.create({
                userId: company.userId,
                type: 'application',
                title: 'New Application',
                message: `New application for ${internship.title}`,
                payload: {
                    applicationId: application._id,
                    internshipId: internship._id,
                    studentName: req.user?.name
                }
            });
        }

        res.status(201).json({
            success: true,
            data: application
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

// @desc    Get my applications
// @route   GET /api/applications/my
// @access  Private (Student)
export const getMyApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const applications = await Application.find({ studentId: req.user?._id })
            .populate({
                path: 'internshipId',
                select: 'title companyId mode stipend durationWeeks location',
                populate: {
                    path: 'companyId',
                    select: 'companyName userId'
                }
            })
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get applications for an internship
// @route   GET /api/applications/internship/:id
// @access  Private (Company)
export const getInternshipApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const internship = await Internship.findById(req.params.id);

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
                message: 'Not authorized to view applications for this internship'
            });
            return;
        }

        const applications = await Application.find({ internshipId: internship._id })
            .populate('studentId', 'name email')
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private (Company)
export const updateApplicationStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { status } = statusUpdateSchema.parse(req.body);
        const applicationId = req.params.id;

        const application = await Application.findById(applicationId)
            .populate('internshipId');

        if (!application) {
            res.status(404).json({
                success: false,
                message: 'Application not found'
            });
            return;
        }

        const internship = application.internshipId as unknown as IInternship;
        const company = await Company.findOne({ userId: req.user?._id });

        if (!company || internship.companyId.toString() !== company._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'Not authorized to update this application'
            });
            return;
        }

        application.status = status;
        await application.save();

        await Notification.create({
            userId: application.studentId,
            type: 'status_update',
            title: 'Application Status Updated',
            message: `Your application status for ${internship.title} was updated to ${status}`,
            payload: {
                internshipId: internship._id,
                status: status
            }
        });

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        next(error);
    }
};
