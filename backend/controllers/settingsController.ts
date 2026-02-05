
import { Request, Response, NextFunction } from 'express';
import SystemSetting from '../models/SystemSetting';

// @desc    Get public system settings
// @route   GET /api/settings/public
// @access  Public
export const getPublicSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Fetch specific public settings
        const publicKeys = [
            'siteName',
            'siteDescription',
            'allowRegistration',
            'maxFileSize',
            'maxMessageSize',
            'allowResumeUpload',
            'supportEmail'
        ];

        const settings = await SystemSetting.find({ key: { $in: publicKeys } });

        const settingsMap: Record<string, any> = {};

        // Defaults
        const defaults: Record<string, any> = {
            maxFileSize: 5,
            allowResumeUpload: true,
            siteName: 'AcadIntern'
        };

        // Populate map
        settings.forEach(setting => {
            // Convert numeric values
            if (setting.key === 'maxFileSize' || setting.key === 'maxMessageSize') {
                settingsMap[setting.key] = Number(setting.value);
            } else if (setting.key === 'allowRegistration' || setting.key === 'allowResumeUpload') {
                settingsMap[setting.key] = setting.value === true || setting.value === 'true';
            } else {
                settingsMap[setting.key] = setting.value;
            }
        });

        // Merge with defaults for missing keys
        const finalSettings = { ...defaults, ...settingsMap };

        res.status(200).json({
            success: true,
            data: finalSettings
        });
    } catch (error) {
        next(error);
    }
};
