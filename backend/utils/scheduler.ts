import cron, { ScheduledTask } from 'node-cron';
import Application from '../models/Application';
import Internship from '../models/Internship';
import Company from '../models/Company';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import { sendEmail } from './emailService';
import { createNotification } from './notificationService';

import SystemSetting from '../models/SystemSetting';
import { performDatabaseBackup, cleanupOldBackups } from './backupService';

let scheduledTasks: ScheduledTask[] = [];

/**
 * Initialize all background scheduled tasks
 */
export const startScheduler = async () => {
    // Stop any existing tasks before restarting
    if (scheduledTasks.length > 0) {
        console.log('🔄 Restarting Scheduler with new configuration...');
        scheduledTasks.forEach(task => task.stop());
        scheduledTasks = [];
    }

    // Fetch dynamic timezone from DB
    const setting = await SystemSetting.findOne({ key: 'timezone' });
    const timezone = setting?.value || 'Asia/Kolkata';

    console.log(`📅 Background Scheduler Initialized (Timezone: ${timezone})`);

    // 1. Cleanup Expired Applications (Run every day at midnight)
    const cleanupTask = cron.schedule('0 0 * * *', async () => {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const result = await Application.deleteMany({
                status: 'expired',
                updatedAt: { $lt: sevenDaysAgo }
            });

            if (result.deletedCount > 0) {
                console.log(`[Scheduler] 🧹 Cleaned up ${result.deletedCount} expired applications.`);
            }
        } catch (error) {
            console.error('[Scheduler] ❌ Error in expired application cleanup:', error);
        }
    }, {
        timezone
    });
    scheduledTasks.push(cleanupTask);

    // 2. Stale Application Reminders (Run every day at 9 AM)
    const staleReminderTask = cron.schedule('0 9 * * *', async () => {
        try {
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

            const staleApplications = await Application.find({
                status: 'pending',
                createdAt: { $lt: fiveDaysAgo }
            }).populate('internshipId');

            if (staleApplications.length === 0) return;

            // Group by company to avoid spamming multiple emails to one company
            const companyAlerts = new Map<string, { count: number; companyId: any }>();

            for (const app of staleApplications) {
                const internship = app.internshipId as any;
                if (!internship || !internship.companyId) continue;

                const cId = internship.companyId.toString();
                if (!companyAlerts.has(cId)) {
                    companyAlerts.set(cId, { count: 0, companyId: internship.companyId });
                }
                companyAlerts.get(cId)!.count++;
            }

            for (const [_, data] of companyAlerts) {
                const company = await Company.findById(data.companyId);
                if (!company) continue;

                const user = await User.findById(company.userId);

                if (user && user.email) {
                    await sendEmail({
                        to: user.email,
                        subject: 'Action Required: You have pending applications',
                        text: `Hi ${company.companyName}, you have ${data.count} applications that have been pending for more than 5 days. Please review them on {{SITE_NAME}}.`,
                        html: `
<p>Hi ${company.companyName},</p>
<p>You have <strong>${data.count}</strong> applications that have been pending for more than 5 days. High-quality candidates appreciate timely feedback!</p>
<p>Promptly reviewing applications improves your company's visibility and candidate experience.</p>
<div style="margin: 24px 0;">
    <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/company/dashboard" 
       style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
       Review Applications
    </a>
</div>
                        `,
                        type: 'general'
                    });
                }
            }
        } catch (error) {
            console.error('[Scheduler] ❌ Error in stale application reminders:', error);
        }
    }, {
        timezone
    });
    scheduledTasks.push(staleReminderTask);

    // 3. Internship Closing Soon Reminder (Run every day at 10 AM)
    const closingReminderTask = cron.schedule('0 10 * * *', async () => {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const now = new Date();

            const closingSoon = await Internship.find({
                status: 'active',
                deadline: { $gt: now, $lte: tomorrow }
            }).populate('companyId');

            if (closingSoon.length === 0) return;

            // Get active students (completeness > 50%)
            const activeStudents = await StudentProfile.find({
                completenessScore: { $gt: 50 }
            }).limit(100); // Limit to avoid massive email bursts in one go

            for (const internship of closingSoon) {
                const company = internship.companyId as any;

                for (const profile of activeStudents) {
                    const user = await User.findById(profile.userId);
                    if (!user || !user.email) continue;

                    // Only send if they haven't applied yet
                    const alreadyApplied = await Application.findOne({
                        internshipId: internship._id,
                        studentId: user._id
                    });

                    if (alreadyApplied) continue;

                    await sendEmail({
                        to: user.email,
                        subject: `Closing Soon: ${internship.title} at ${company.companyName}`,
                        text: `The application deadline for ${internship.title} at ${company.companyName} is in less than 24 hours. Apply now!`,
                        html: `
<p>Hi ${user.name},</p>
<p>Clock is ticking! The application deadline for <strong>${internship.title}</strong> at <strong>${company.companyName}</strong> is approaching in less than 24 hours.</p>
<p>Don't miss this opportunity to accelerate your career.</p>
<div style="margin: 24px 0;">
    <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim()}/internships/${internship._id}" 
       style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
       Apply Now
    </a>
</div>
                        `,
                        type: 'general'
                    });
                }
            }
        } catch (error) {
            console.error('[Scheduler] ❌ Error in internship closing reminders:', error);
        }
    }, {
        timezone
    });
    scheduledTasks.push(closingReminderTask);

    // 4. Automated Database Backups
    try {
        const backupSettings = await SystemSetting.find({
            key: { $in: ['autoBackup', 'backupFrequency'] }
        });

        const isAutoBackup = backupSettings.find(s => s.key === 'autoBackup')?.value === 'true' || backupSettings.find(s => s.key === 'autoBackup')?.value === true;
        const frequency = backupSettings.find(s => s.key === 'backupFrequency')?.value || 'daily';

        if (isAutoBackup) {
            // Mapping frequency to cron expression
            const cronMap: Record<string, string> = {
                'daily': '0 2 * * *',      // 2 AM every day
                'weekly': '0 3 * * 0',     // 3 AM on Sunday
                'monthly': '0 4 1 * *'     // 4 AM on the 1st of every month
            };

            const cronExpression = cronMap[frequency] || '0 2 * * *';

            console.log(`[Scheduler] 🛡️ Database Backup scheduled: ${frequency} (${cronExpression})`);

            const backupTask = cron.schedule(cronExpression, async () => {
                await performDatabaseBackup();
                await cleanupOldBackups();
            }, {
                timezone
            });
            scheduledTasks.push(backupTask);
        }
    } catch (error) {
        console.error('[Scheduler] ❌ Error scheduling database backups:', error);
    }
};

export const restartScheduler = async () => {
    await startScheduler();
};
