import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Application from '../models/Application';
import Internship from '../models/Internship';
import Company from '../models/Company';
import Notification from '../models/Notification';
import ProfileView from '../models/ProfileView';
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
    status: z.enum(['shortlisted', 'rejected', 'accepted', 'assessment_completed', 'interview_scheduled']),
    interviewDetails: z.object({
        date: z.string().transform(str => new Date(str)),
        time: z.string(),
        meetingLink: z.string().url('Invalid meeting link URL')
    }).optional()
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

        // MODERATION: Check activity limits
        const { checkActivityLimits, createAutomatedFlag } = require('../utils/moderationService');
        const activityCheck = await checkActivityLimits(studentId, 'application');
        if (activityCheck.flagged) {
            await createAutomatedFlag({
                reportedUserId: studentId,
                category: 'suspicious_activity',
                subject: 'Excessive Application Volume',
                body: activityCheck.reason,
                metadata: { count: dailyAppCount }
            });
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
                    studentName: req.user?.name,
                    route: '/applications'
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
                    select: 'companyName userId logo'
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
                    skills: profile?.skills || [],
                    profilePicture: profile?.profilePicture
                }
            };
        });

        // Record search appearances for all students in the list (once per viewer per student per day)
        const viewerId = req.user!._id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const viewerRole = req.user!.role;
        Promise.all(
            studentIds.map(async (sid) => {
                const alreadyToday = await ProfileView.findOne({
                    viewerId,
                    profileOwnerId: sid,
                    viewType: 'search_appearance',
                    viewedAt: { $gte: todayStart }
                }).lean();
                if (!alreadyToday) {
                    return ProfileView.create({
                        viewerId,
                        profileOwnerId: sid,
                        viewerRole,
                        viewType: 'search_appearance'
                    });
                }
            })
        ).catch((err: Error) => console.error('Failed to record search appearances:', err));

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
        const { status, interviewDetails } = statusUpdateSchema.parse(req.body);
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
        if (status === 'interview_scheduled' && interviewDetails) {
            application.interviewDetails = interviewDetails;
        }
        await application.save();

        await createNotification({
            userId: application.studentId,
            type: 'status_update',
            title: 'Application Status Updated',
            message: `Your application status for ${internship.title} was updated to ${status} by ${company.companyName}`,
            payload: {
                applicationId: application._id,
                internshipId: internship._id,
                status: status,
                companyName: company.companyName,
                interviewDetails: status === 'interview_scheduled' ? application.interviewDetails : undefined,
                route: '/applications'
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f8fafc; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .container { width: 92%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 56px 40px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 48px 40px; }
        .status-badge { display: inline-block; padding: 8px 16px; background: #eff6ff; color: #2563eb; border-radius: 99px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; border: 1px solid #dbeafe; }
        .greeting { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px; }
        .message { font-size: 16px; color: #4b5563; margin-bottom: 32px; }
        .card { background: #f9fbfc; border-radius: 16px; padding: 24px; margin: 32px 0; border: 1px solid #f1f5f9; }
        .item { margin-bottom: 16px; }
        .item:last-child { margin-bottom: 0; }
        .label { color: #94a3b8; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; margin-bottom: 4px; }
        .value { color: #1e293b; font-weight: 700; font-size: 15px; }
        .button-wrapper { text-align: center; margin-top: 40px; }
        .button { display: inline-block; padding: 16px 36px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
        .footer { padding: 40px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Great News!</h1>
            </div>
            <div class="content">
                <div style="text-align: center;"><div class="status-badge">Shortlisted</div></div>
                <p class="greeting">Hi ${student.name},</p>
                <p class="message">You’ve been shortlisted for the internship at <strong>${companyName}</strong>! The hiring team was impressed with your profile and wants to move forward with your application.</p>
                
                <div class="card">
                    <div class="item">
                        <div class="label">Internship</div>
                        <div class="value">${internship.title}</div>
                    </div>
                    <div class="item">
                        <div class="label">Company</div>
                        <div class="value">${companyName}</div>
                    </div>
                </div>

                <p class="message" style="margin-bottom: 0;">Keep an eye on your messages for next steps and interview details. Good luck!</p>
                
                <div class="button-wrapper">
                    <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/student/applications" class="button">View Application Status</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
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
            const details = application.interviewDetails;

            // Format for Calendar Link (basic Google Calendar URL format)
            // https://www.google.com/calendar/render?action=TEMPLATE&text=Interview&dates=20231231T120000Z/20231231T130000Z&details=Link&location=Meet
            const dateStr = details?.date ? new Date(details.date).toISOString().replace(/-|:|\.\d+/g, '') : '';
            const calendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Interview: ' + internship.title)}&dates=${dateStr}/${dateStr}&details=${encodeURIComponent('Interview for ' + internship.title + ' at ' + companyName + '\n\nMeeting Link: ' + (details?.meetingLink || ''))}&location=${encodeURIComponent(details?.meetingLink || 'Google Meet')}`;

            const interviewHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f8fafc; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .container { width: 92%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 56px 40px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 48px 40px; }
        .status-badge { display: inline-block; padding: 8px 16px; background: #ecfdf5; color: #059669; border-radius: 99px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; border: 1px solid #a7f3d0; }
        .greeting { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px; }
        .message { font-size: 16px; color: #4b5563; margin-bottom: 32px; }
        .card { background: #f9fbfc; border-radius: 16px; padding: 24px; margin: 32px 0; border: 1px solid #f1f5f9; }
        .item { margin-bottom: 16px; }
        .item:last-child { margin-bottom: 0; }
        .label { color: #94a3b8; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; margin-bottom: 4px; }
        .value { color: #1e293b; font-weight: 700; font-size: 15px; }
        .button-wrapper { text-align: center; margin-top: 40px; }
        .button { display: inline-block; padding: 16px 36px; background-color: #059669; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2); }
        .secondary-link { display: block; margin-top: 16px; color: #059669; font-size: 14px; font-weight: 600; text-decoration: underline; }
        .footer { padding: 40px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Interview Scheduled!</h1>
            </div>
            <div class="content">
                <div style="text-align: center;"><div class="status-badge">Action Required</div></div>
                <p class="greeting">Hi ${student.name},</p>
                <p class="message">Exciting news! Your interview for the <strong>${internship.title}</strong> role at <strong>${companyName}</strong> has been scheduled.</p>
                
                <div class="card">
                    <div class="item">
                        <div class="label">Date</div>
                        <div class="value">${details?.date ? new Date(details.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'TBD'}</div>
                    </div>
                    <div class="item">
                        <div class="label">Time</div>
                        <div class="value">${details?.time || 'TBD'}</div>
                    </div>
                    <div class="item">
                        <div class="label">Meeting Link</div>
                        <div class="value"><a href="${details?.meetingLink || '#'}" style="color: #059669; text-decoration: underline;">Join Interview</a></div>
                    </div>
                </div>

                <p class="message" style="margin-bottom: 0;">Please ensure you're on time. You can join directly using the button below or add the event to your calendar.</p>
                
                <div class="button-wrapper">
                    <a href="${details?.meetingLink || '#'}" class="button">Join Interview</a>
                    <a href="${calendarLink}" class="secondary-link">Add to Calendar</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
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
                    text: `Great news! Your interview for ${internship.title} at ${companyName} is on ${details?.date ? new Date(details.date).toLocaleDateString() : 'TBD'} at ${details?.time || 'TBD'}. Meeting Link: ${details?.meetingLink || 'N/A'}.`,
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f8fafc; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .container { width: 92%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #64748b 0%, #1e293b 100%); padding: 56px 40px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 48px 40px; }
        .status-badge { display: inline-block; padding: 8px 16px; background: #f1f5f9; color: #64748b; border-radius: 99px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; border: 1px solid #e2e8f0; }
        .greeting { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px; }
        .message { font-size: 16px; color: #4b5563; margin-bottom: 32px; }
        .card { background: #f9fbfc; border-radius: 16px; padding: 24px; margin: 32px 0; border: 1px solid #f1f5f9; }
        .item { margin-bottom: 16px; }
        .item:last-child { margin-bottom: 0; }
        .label { color: #94a3b8; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; margin-bottom: 4px; }
        .value { color: #1e293b; font-weight: 700; font-size: 15px; }
        .button-wrapper { text-align: center; margin-top: 40px; }
        .button { display: inline-block; padding: 16px 36px; background-color: #ffffff; color: #334155 !important; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .footer { padding: 40px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Application Update</h1>
            </div>
            <div class="content">
                <div style="text-align: center;"><div class="status-badge">Update Received</div></div>
                <p class="greeting">Hi ${student.name},</p>
                <p class="message">Thank you for giving us the opportunity to review your application for the <strong>${internship.title}</strong> role at <strong>${companyName}</strong>.</p>
                
                <div class="card">
                    <div class="item">
                        <div class="label">Role</div>
                        <div class="value">${internship.title}</div>
                    </div>
                    <div class="item">
                        <div class="label">Company</div>
                        <div class="value">${companyName}</div>
                    </div>
                </div>

                <p class="message">After careful consideration, the team has decided to move forward with other candidates who more closely match our current requirements for this specific role.</p>
                <p class="message" style="margin-bottom: 0;">We appreciate the time and effort you invested. We encourage you to explore other opportunities on our platform that align with your skills.</p>
                
                <div class="button-wrapper">
                    <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/student/internships" class="button">Explore Other Roles</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
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

        // Send Accepted Email
        if (status === 'accepted' && (application.studentId as any).email) {
            const student = application.studentId as any;
            const companyName = company.companyName;

            const acceptedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f8fafc; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .container { width: 92%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 56px 40px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 48px 40px; }
        .status-badge { display: inline-block; padding: 8px 16px; background: #ecfdf5; color: #059669; border-radius: 99px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; border: 1px solid #a7f3d0; }
        .greeting { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 24px; }
        .message { font-size: 16px; color: #4b5563; margin-bottom: 32px; }
        .card { background: #f9fbfc; border-radius: 16px; padding: 24px; margin: 32px 0; border: 1px solid #f1f5f9; }
        .item { margin-bottom: 16px; }
        .item:last-child { margin-bottom: 0; }
        .label { color: #94a3b8; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; margin-bottom: 4px; }
        .value { color: #1e293b; font-weight: 700; font-size: 15px; }
        .button-wrapper { text-align: center; margin-top: 40px; }
        .button { display: inline-block; padding: 16px 36px; background-color: #059669; color: #ffffff !important; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2); }
        .footer { padding: 40px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Congratulations!</h1>
            </div>
            <div class="content">
                <div style="text-align: center;"><div class="status-badge">Selected</div></div>
                <p class="greeting">Hi ${student.name},</p>
                <p class="message">We are thrilled to inform you that you have been <strong>selected</strong> for the <strong>${internship.title}</strong> role at <strong>${companyName}</strong>!</p>
                
                <div class="card">
                    <div class="item">
                        <div class="label">Role</div>
                        <div class="value">${internship.title}</div>
                    </div>
                    <div class="item">
                        <div class="label">Company</div>
                        <div class="value">${companyName}</div>
                    </div>
                    <div class="item">
                        <div class="label">Status</div>
                        <div class="value" style="color: #059669;">Offer Extended</div>
                    </div>
                </div>

                <p class="message" style="margin-bottom: 0;">The company will be in touch shortly with the onboarding details. Keep an eye on your messages for the next steps.</p>
                
                <div class="button-wrapper">
                    <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/student/applications" class="button">View Dashboard</a>
                </div>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
            `;

            try {
                await sendEmail({
                    to: student.email,
                    subject: `You've been selected! ${internship.title} at ${companyName}`,
                    text: `Congratulations! You have been selected for the ${internship.title} role at ${companyName}. The company will be in touch shortly.`,
                    html: acceptedHtml,
                    type: 'accepted'
                });
            } catch (emailError) {
                console.error('Accepted email failed to send:', emailError);
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
                    select: 'companyName userId website logo banner'
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
