import crypto from 'crypto';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

/**
 * Send email using nodemailer or external service
 * For production, replace this with Resend, SendGrid, or other email service
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
    // If Resend API Key is present, prioritize sending real email
    if (process.env.RESEND_API_KEY) {
        try {
            const { Resend } = require('resend');
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
                from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html
            });
            console.log(`Email sent successfully via Resend to ${options.to}`);
            return;
        } catch (error) {
            console.error('Error sending email via Resend:', error);
            // If sending fails, fall back to console logging below
        }
    }

    // For development/testing (or fallback) - log the email
    if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
        console.log('\n=================================');
        console.log('📧 EMAIL SIMULATION (DEV MODE)');
        console.log('=================================');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`\nText Content:\n${options.text}`);
        console.log('\n=================================\n');

        if (process.env.NODE_ENV !== 'development') {
            console.log('Email simulated (no API key configured or sending failed)');
        }
        return;
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
