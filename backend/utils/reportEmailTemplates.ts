/**
 * Generate HTML template for report submission confirmation
 */
export const getReportSubmissionTemplate = (name: string, subject: string, body: string, screenshots?: string[]): string => {
    let imagesHtml = '';
    if (screenshots && screenshots.length > 0) {
        imagesHtml = `
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed #fde68a;">
                <div class="label" style="margin-bottom: 12px;">Attached Evidence</div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                    ${screenshots.map(url => `<img src="${url}" alt="Report Screenshot" style="width: 100%; border-radius: 12px; border: 1px solid #fef3c7; margin-bottom: 8px;" />`).join('')}
                </div>
            </div>
        `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #fefce8; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #fefce8; padding: 40px 0; }
        .container { width: 92%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fef08a; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 48px 40px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 40px; }
        .status-badge { display: inline-block; padding: 6px 14px; background: #fef3c7; color: #92400e; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; border: 1px solid #fde68a; }
        .greeting { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 20px; }
        .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; }
        .card { background: #fffcf0; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #fef3c7; }
        .item { margin-bottom: 16px; }
        .item:last-child { margin-bottom: 0; }
        .label { color: #92400e; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; margin-bottom: 4px; opacity: 0.7; }
        .value { color: #1e293b; font-weight: 700; font-size: 14px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Report Received</h1>
            </div>
            <div class="content">
                <div style="text-align: center;"><div class="status-badge">Processing</div></div>
                <p class="greeting">Hi ${name},</p>
                <p class="message">Thank you for bringing this to our attention. We have received your report and want to acknowledge that it is currently being reviewed by our moderation team. Ensuring the safety and integrity of our platform is our highest priority.</p>
                
                <p style="font-size: 13px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Copy of your report</p>
                <div class="card">
                    <div class="item">
                        <div class="label">Reference Subject</div>
                        <div class="value">${subject}</div>
                    </div>
                    <div class="item">
                        <div class="label">Your Description</div>
                        <div class="value" style="font-weight: 500; color: #4b5563; white-space: pre-wrap;">${body}</div>
                    </div>
                    ${imagesHtml}
                </div>

                <p class="message">We appreciate your contribution to maintaining a professional community. Our team will take appropriate actions based on our community guidelines.</p>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;
};

/**
 * Generate HTML template for report resolution update
 */
export const getReportResolvedTemplate = (name: string, subject: string, resolution: string): string => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f0fdf4; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f0fdf4; padding: 40px 0; }
        .container { width: 92%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dcfce7; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 48px 40px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
        .content { padding: 40px; }
        .status-badge { display: inline-block; padding: 6px 14px; background: #ecfdf5; color: #065f46; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; border: 1px solid #d1fae5; }
        .greeting { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 20px; }
        .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; }
        .card { background: #f9fdfa; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #ecfdf5; }
        .item { margin-bottom: 16px; }
        .item:last-child { margin-bottom: 0; }
        .label { color: #065f46; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; margin-bottom: 4px; opacity: 0.7; }
        .value { color: #1e293b; font-weight: 700; font-size: 14px; }
        .footer { padding: 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Report Resolved</h1>
            </div>
            <div class="content">
                <div style="text-align: center;"><div class="status-badge">Resolved</div></div>
                <p class="greeting">Hi ${name},</p>
                <p class="message">Your recent report regarding <strong>"${subject}"</strong> has been reviewed and resolved by our moderation team.</p>
                
                <div class="card">
                    <div class="item">
                        <div class="label">Action Taken / Resolution</div>
                        <div class="value">${resolution || "Our team has taken appropriate action according to our community guidelines."}</div>
                    </div>
                </div>

                <p class="message">Thank you for your active participation in maintaining the quality and safety of {{SITE_NAME}}.</p>
            </div>
            <div class="footer">
                <p>&copy; {{CURRENT_YEAR}} {{SITE_NAME}}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;
