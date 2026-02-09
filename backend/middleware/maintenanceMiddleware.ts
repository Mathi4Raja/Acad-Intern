
import { Request, Response, NextFunction } from 'express';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest } from '../types';

/**
 * Middleware to check if the system is in maintenance mode.
 * Admins are allowed to bypass the check.
 */
const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

        // Skip check for health, public settings, and auth routes (to allow login/logout)
        // We check for /api/auth specifically to avoid accidental bypasses
        const isAuthRoute = req.originalUrl?.includes('/api/auth') || req.path?.includes('/api/auth') || req.url?.includes('/api/auth');

        if (isAuthRoute || ['/health', '/api/settings/public'].some(route => req.originalUrl?.includes(route))) {
            return next();
        }

        // Fetch maintenance mode setting
        const maintenanceSetting = await SystemSetting.findOne({ key: 'maintenanceMode' });
        const isMaintenance = maintenanceSetting ? (maintenanceSetting.value === true || maintenanceSetting.value === 'true') : false;

        if (isMaintenance) {
            // Check if user is an admin
            // (Note: req.user is populated by protect middleware, but we might want this BEFORE protect)
            // For now, we'll check if the path is an admin path or if they have an admin token
            const isAdminPath = req.path.startsWith('/api/admin');

            // If it's an admin path, we let the admin auth middleware handling it later
            if (isAdminPath) {
                return next();
            }

            // For all other requests, block with 503
            res.status(503).json({
                success: false,
                message: 'The system is currently undergoing maintenance. Please check back later.',
                maintenance: true
            });
            return;
        }

        next();
    } catch (error) {
        // If something fails, better to let traffic through than break the site
        console.error('Maintenance middleware error:', error);
        next();
    }
};

export default maintenanceMiddleware;
