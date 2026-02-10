import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Application from '../models/Application';
import Internship from '../models/Internship';
import Company from '../models/Company';
import Notification from '../models/Notification';
import { createNotification } from '../utils/notificationService';
import { sendEmail } from '../utils/emailService';
import StudentProfile from '../models/StudentProfile';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest, IInternship } from '../types';

// Validation schemas
const applicationSchema = z.object({
    notes: z.string().max(500, 'Notes cannot be longer than 500 characters').optional()
});

const statusUpdateSchema = z.object({
    status: z.enum(['shortlisted', 'rejected', 'accepted', 'assessment_completed', 'interview_scheduled'])
});

// @desc    Apply to an internship
// @route   POST /api/internships/:id/apply
// @access  Private (Student)
export const applyForInternship = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = applicationSchema.parse(req.body);

        const internshipId = req.params.id;
        const studentId = req.user?._id;

        // DYNAMIC SETTINGS: Application Volume Cap (Per Day)
        const limitSetting = await SystemSetting.findOne({ key: 'maxApplicationsPerDay' });
        const maxAppsPerDay = limitSetting?.value ? Number(limitSetting.value) : Infinity;

        // DYNAMIC TIMEZONE: Get Start of Day
        const timezoneSetting = await SystemSetting.findOne({ key: 'timezone' });
        const timezone = timezoneSetting?.value || 'Asia/Kolkata';

        // Use MongoDB to calculate start of day in the target timezone
        // This avoids complex JS timezone math without libraries
        const dateResult = await Application.aggregate([
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

        // Fallback if aggregation returns empty (e.g. no applications yet)
        let startOfDay;
        if (dateResult.length > 0) {
            startOfDay = dateResult[0].startOfDay;
        } else {
            // Fallback to basic UTC/IST logic if collection empty
            const now = new Date();
            const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
            const offset = timezone === 'Asia/Kolkata' ? 5.5 : 0; // Simple fallback
            const localTime = new Date(utcTime + (offset * 3600000));
            localTime.setHours(0, 0, 0, 0);
            startOfDay = new Date(localTime.getTime() - (offset * 3600000));
        }

        const dailyAppCount = await Application.countDocuments({
            studentId,
            createdAt: { $gte: startOfDay }
        });

        if (dailyAppCount >= maxAppsPerDay) {
            res.status(403).json({
                success: false,
                message: `You have reached your daily application limit (${maxAppsPerDay}). Please try again tomorrow.`
            });
            return;
        }

        const internship = await Internship.findById(internshipId);
        if (!internship) {
            res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
            return;
        }

        if (internship.status !== 'active') {
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
            await createNotification({
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

        // Fetch student profiles to get skills
        const studentIds = applications.map(app => (app.studentId as any)?._id || app.studentId);
        const profiles = await StudentProfile.find({ userId: { $in: studentIds } }).lean();
        const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

        // Enhance applications with skills from profiles
        const enhancedApplications = applications.map(app => {
            const studentUserId = (app.studentId as any)?._id?.toString() || app.studentId?.toString();
            const profile = profileMap.get(studentUserId);
            return {
                ...app.toObject(),
                studentId: {
                    ...(app.studentId as any)?.toObject?.() || { _id: app.studentId },
                    skills: profile?.skills || []
                }
            };
        });

        res.status(200).json({
            success: true,
            count: enhancedApplications.length,
            data: enhancedApplications
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
            .populate('internshipId')
            .populate('studentId', 'name email');

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

        await createNotification({
            userId: application.studentId,
            type: 'status_update',
            title: 'Application Status Updated',
            message: `Your application status for ${internship.title} was updated to ${status}`,
            payload: {
                internshipId: internship._id,
                status: status
            }
        });

        // Send Shortlisted Email
        if (status === 'shortlisted' && (application.studentId as any).email) {
            const student = application.studentId as any;
            const companyName = company.companyName;

            const shortlistedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; overflow: hidden; margin-top: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 48px 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .badge { display: inline-block; padding: 6px 14px; background: #dbeafe; color: #1e40af; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
        .content p { font-size: 15px; color: #4b5563; margin: 0 0 20px; }
        .details-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #f3f4f6; }
        .detail-row { margin-bottom: 8px; font-size: 14px; }
        .detail-label { color: #9ca3af; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
        .detail-value { color: #111827; font-weight: 700; }
        .button-wrapper { text-align: center; margin: 32px 0 8px; }
        .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Great News!</h1>
            </div>
            <div class="content">
                <div class="badge">Shortlisted</div>
                <p>Hi ${student.name},</p>
                <p>You've been shortlisted for the internship at <strong>${companyName}</strong>. The hiring team was impressed with your application and wants to move forward.</p>
                
                <div class="details-card">
                    <div class="detail-row">
                        <div class="detail-label">Internship</div>
                        <div class="detail-value">${internship.title}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Company</div>
                        <div class="detail-value">${companyName}</div>
                    </div>
                </div>

                <p>Keep an eye on your messages for next steps and interview details.</p>
                
                <div class="button-wrapper">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/applications" class="button">View Application Status</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2026 AcadIntern. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
            `;

            try {
                await sendEmail({
                    to: student.email,
                    subject: `Update on your application for ${internship.title}`,
                    text: `Congratulations! You've been shortlisted for ${internship.title} at ${companyName}. Visit the platform for next steps.`,
                    html: shortlistedHtml,
                    type: 'shortlisted'
                });
            } catch (emailError) {
                console.error('Shortlisted email failed to send:', emailError);
                // Non-blocking
            }
        }

        // Send Interview Scheduled Email
        if (status === 'interview_scheduled' && (application.studentId as any).email) {
            const student = application.studentId as any;
            const companyName = company.companyName;

            const interviewHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; overflow: hidden; margin-top: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 48px 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .badge { display: inline-block; padding: 6px 14px; background: #dcfce7; color: #166534; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
        .content p { font-size: 15px; color: #4b5563; margin: 0 0 20px; }
        .details-card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #f3f4f6; }
        .detail-row { margin-bottom: 8px; font-size: 14px; }
        .detail-label { color: #9ca3af; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
        .detail-value { color: #111827; font-weight: 700; }
        .button-wrapper { text-align: center; margin: 32px 0 8px; }
        .button { display: inline-block; padding: 14px 32px; background-color: #059669; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Interview Scheduled!</h1>
            </div>
            <div class="content">
                <div class="badge">Interview</div>
                <p>Hi ${student.name},</p>
                <p>Exciting news! Your interview for the <strong>${internship.title}</strong> role at <strong>${companyName}</strong> has been scheduled.</p>
                
                <div class="details-card">
                    <div class="detail-row">
                        <div class="detail-label">Position</div>
                        <div class="detail-value">${internship.title}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Host Company</div>
                        <div class="detail-value">${companyName}</div>
                    </div>
                </div>

                <p>Please check your messages on the AcadIntern platform for the specific date, time, and meeting link.</p>
                
                <div class="button-wrapper">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/applications" class="button">Go to Messages</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2026 AcadIntern. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
            `;

            try {
                await sendEmail({
                    to: student.email,
                    subject: `Interview Scheduled: ${internship.title} at ${companyName}`,
                    text: `Great news! Your interview for ${internship.title} at ${companyName} has been scheduled. Please visit the platform to view details.`,
                    html: interviewHtml,
                    type: 'interview_scheduled'
                });
            } catch (emailError) {
                console.error('Interview email failed to send:', emailError);
            }
        }

        // Send Rejected Email
        if (status === 'rejected' && (application.studentId as any).email) {
            const student = application.studentId as any;
            const companyName = company.companyName;

            const rejectedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f9fafb; padding-bottom: 40px; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 16px; overflow: hidden; margin-top: 20px; }
        .header { background: #ffffff; padding: 48px 32px 32px; text-align: center; border-bottom: 1px solid #f3f4f6; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.025em; }
        .content { padding: 40px 32px; }
        .badge { display: inline-block; padding: 6px 14px; background: #f3f4f6; color: #6b7280; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
        .content p { font-size: 15px; color: #4b5563; margin: 0 0 20px; }
        .button-wrapper { text-align: center; margin: 32px 0 8px; }
        .button { display: inline-block; padding: 14px 32px; border: 2px solid #e5e7eb; color: #374151 !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Application Update</h1>
            </div>
            <div class="content">
                <div class="badge">Update</div>
                <p>Hi ${student.name},</p>
                <p>Thank you for your interest in the <strong>${internship.title}</strong> role at <strong>${companyName}</strong>.</p>
                <p>The team has decided to move forward with other candidates at this time. We appreciate the effort you put into your application and wish you the best in your search.</p>
                <div class="button-wrapper">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/dashboard" class="button">Explore Other Roles</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; 2026 AcadIntern. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
            `;

            try {
                await sendEmail({
                    to: student.email,
                    subject: `Update on your application for ${internship.title}`,
                    text: `Thank you for your interest in ${internship.title} at ${companyName}. The team has decided to move forward with other candidates. Visit the platform to explore other opportunities.`,
                    html: rejectedHtml,
                    type: 'rejected'
                });
            } catch (emailError) {
                console.error('Rejection email failed to send:', emailError);
                // Non-blocking
            }
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single application details
// @route   GET /api/applications/:id
// @access  Private (Student/Company)
export const getApplication = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const application = await Application.findById(req.params.id)
            .populate({
                path: 'internshipId',
                populate: {
                    path: 'companyId',
                    select: 'companyName userId website logo'
                }
            })
            .populate('studentId', 'name email');

        if (!application) {
            res.status(404).json({
                success: false,
                message: 'Application not found'
            });
            return;
        }

        // Check if user is authorized to view this application
        const isStudent = req.user?.role === 'student' && application.studentId._id.toString() === req.user._id.toString();
        const internship = application.internshipId as any;
        const isCompany = req.user?.role === 'company' && internship?.companyId?.userId?.toString() === req.user?._id?.toString();

        if (!isStudent && !isCompany && req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Not authorized to view this application'
            });
            return;
        }

        // Fetch student profile picture
        const StudentProfile = require('../models/StudentProfile').default;
        const studentProfile = await StudentProfile.findOne({ userId: application.studentId._id })
            .select('profilePicture');

        res.status(200).json({
            success: true,
            data: application,
            studentProfilePicture: studentProfile?.profilePicture || null,
            companyLogo: internship?.companyId?.logo || null
        });
    } catch (error) {
        next(error);
    }
};
