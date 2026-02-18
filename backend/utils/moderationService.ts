import Report from '../models/Report';
import User from '../models/User';
import Application from '../models/Application';
import Internship from '../models/Internship';
import SystemSetting from '../models/SystemSetting';
import { Types } from 'mongoose';

// Configurable blacklisted keywords
const BLACKLISTED_KEYWORDS = [
    'payment outside',
    'pay upfront',
    'bank account details',
    'whatsapp only',
    'crypto payment',
    'investment required'
];

/**
 * Scan content for blacklisted keywords
 */
export const scanContent = (text: string): { flagged: boolean; matches: string[] } => {
    if (!text) return { flagged: false, matches: [] };

    const matches = BLACKLISTED_KEYWORDS.filter(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
    );

    return {
        flagged: matches.length > 0,
        matches
    };
};

/**
 * Check if a user is exceeding activity limits (Suspicious Activity)
 */
export const checkActivityLimits = async (userId: Types.ObjectId, action: 'application' | 'internship_post'): Promise<{ flagged: boolean; reason: string }> => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    if (action === 'application') {
        const count = await Application.countDocuments({
            studentId: userId,
            createdAt: { $gte: oneDayAgo }
        });

        const setting = await SystemSetting.findOne({ key: 'maxApplicationsPerDay' });
        const limit = setting?.value ? Number(setting.value) : 20;

        if (count >= limit) {
            return { flagged: true, reason: `User submitted ${count} applications in 24 hours (Limit: ${limit}).` };
        }
    }

    if (action === 'internship_post') {
        const count = await Internship.countDocuments({
            companyId: userId,
            createdAt: { $gte: oneDayAgo }
        });

        const setting = await SystemSetting.findOne({ key: 'maxInternshipPostsPerDay' });
        const limit = setting?.value ? Number(setting.value) : 5;

        if (count >= limit) {
            return { flagged: true, reason: `Company posted ${count} internships in 24 hours (Limit: ${limit}).` };
        }
    }

    return { flagged: false, reason: '' };
};

/**
 * Create an automated flag report
 */
export const createAutomatedFlag = async (params: {
    reportedUserId?: Types.ObjectId;
    internshipId?: Types.ObjectId;
    applicationId?: Types.ObjectId;
    category: string;
    subject: string;
    body: string;
    metadata: Record<string, any>;
}): Promise<void> => {
    // SYSTEM_USER_ID or similar placeholder for automated reports
    // For now, we'll use a specific indicator or leave reporterId as a dedicated system user
    const systemUser = await User.findOne({ role: 'admin' }); // Fallback to first admin

    await Report.create({
        ...params,
        reporterId: systemUser?._id,
        isAutomatedFlag: true,
        priority: 'high',
        status: 'open',
        flagMetadata: params.metadata
    });
};
