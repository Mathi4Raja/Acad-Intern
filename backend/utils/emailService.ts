import crypto from 'crypto';
import nodemailer from 'nodemailer';
import SystemSetting from '../models/SystemSetting';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
    type?: 'password_reset' | 'general' | 'welcome' | 'shortlisted' | 'rejected' | 'accepted' | 'email_verification' | 'interview_scheduled' | 'message_alert';
}

/**
 * Send email using Resend or SMTP (Gmail)
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
    const type = options.type || 'general';
    const isTest = process.env.NODE_ENV === 'test';

    // 0. Mock Mode (Strictly for automated tests)
    if (isTest) {
        console.log(`[TEST MODE] Mocking email dispatch to: ${options.to}`);
        return;
    }

    // Fetch settings from DB
    const settings = await SystemSetting.find({
        key: {
            $in: [
                'emailFrom', 'emailFromName', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass',
                'emailNotifications', 'welcomeEmail', 'applicationStatusEmail',
                'messageAlertEmail', 'reminderEmail',
                'siteName'
            ]
        }
    });

    const settingsMap: Record<string, any> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    const siteName = settingsMap.siteName || 'AcadIntern';
    const currentYear = new Date().getFullYear().toString();

    // Replace placeholders in HTML and Text
    let finalHtml = options.html
        .replace(/{{SITE_NAME}}/g, siteName)
        .replace(/{{CURRENT_YEAR}}/g, currentYear)
        .replace(/AcadIntern/gi, siteName); // Case-insensitive fallback

    let finalText = options.text
        .replace(/{{SITE_NAME}}/g, siteName)
        .replace(/{{CURRENT_YEAR}}/g, currentYear)
        .replace(/AcadIntern/gi, siteName);

    let finalSubject = options.subject
        .replace(/{{SITE_NAME}}/g, siteName)
        .replace(/{{CURRENT_YEAR}}/g, currentYear)
        .replace(/AcadIntern/gi, siteName);

    // Granular Type-based Checks
    const typeConfigs: Record<string, string> = {
        'welcome': 'welcomeEmail',
        'shortlisted': 'applicationStatusEmail',
        'rejected': 'applicationStatusEmail',
        'accepted': 'applicationStatusEmail',
        'interview_scheduled': 'applicationStatusEmail',
        'message_alert': 'messageAlertEmail',
        'general': 'reminderEmail' // Used for stale app & closing soon
    };

    const settingKey = typeConfigs[type];
    if (settingKey && settingsMap[settingKey] === false) {
        console.log(`[SUBSYSTEM] ${type} email suppressed by granular setting: ${settingKey} (To: ${options.to})`);
        return;
    }

    const fromAddress = settingsMap.emailFrom || process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = settingsMap.emailFromName || '';
    const fromEmail = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

    const smtpConfig = {
        host: settingsMap.smtpHost,
        port: parseInt(settingsMap.smtpPort),
        user: settingsMap.smtpUser,
        pass: settingsMap.smtpPass
    };

    let success = false;
    let lastError: any = null;

    // 1. Try Resend (Primary for all emails)
    if (process.env.RESEND_API_KEY) {
        try {
            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);
            const resendResult = await resend.emails.send({
                from: fromEmail,
                to: options.to,
                subject: finalSubject,
                text: finalText,
                html: finalHtml
            });

            if (resendResult.error) {
                console.error('Resend error, attempting SMTP fallback:', resendResult.error);
                lastError = resendResult.error;
            } else {
                console.log(`Email sent via Resend to ${options.to} (${type})`);
                success = true;
            }
        } catch (error: any) {
            lastError = error;
            console.error('Resend service failure, attempting SMTP fallback:', error.message || error);
        }
    }

    // 2. Try SMTP (Gmail) - Final Global Fallback
    if (!success && smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
        try {
            const transporter = nodemailer.createTransport({
                host: smtpConfig.host,
                port: smtpConfig.port,
                secure: smtpConfig.port === 465,
                auth: {
                    user: smtpConfig.user,
                    pass: smtpConfig.pass
                }
            });

            await transporter.sendMail({
                from: fromEmail,
                to: options.to,
                subject: finalSubject,
                text: finalText,
                html: finalHtml
            });
            console.log(`Email sent via SMTP (Fallback) to ${options.to} (${type})`);
            success = true;
        } catch (error: any) {
            lastError = error;
            console.error('SMTP (Fallback) failure:', error.message || error);
        }
    }

    // 3. Status Handling (Non-test environments)
    if (!success) {
        const errorMsg = lastError?.message || lastError || 'Email failed to send through all available providers';
        console.error(`CRITICAL: ${errorMsg}`);
        throw new Error(errorMsg);
    }
};

/**
 * Generate password reset token
 */
export const generateResetToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash password reset token for storage
 */
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
