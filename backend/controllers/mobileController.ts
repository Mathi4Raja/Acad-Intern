import { Response, NextFunction } from 'express';
import { z } from 'zod';
import MobileDevice from '../models/MobileDevice';
import { AuthRequest } from '../types';

const registerDeviceSchema = z.object({
    fcmToken: z.string().min(20, 'FCM token is required'),
    platform: z.enum(['android', 'ios']),
    deviceName: z.string().max(120).optional(),
    appVersion: z.string().max(40).optional()
});

const unregisterDeviceSchema = z.object({
    fcmToken: z.string().min(20, 'FCM token is required')
});

export const registerMobileDevice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const payload = registerDeviceSchema.parse(req.body);

        const device = await MobileDevice.findOneAndUpdate(
            {
                userId: req.user?._id,
                fcmToken: payload.fcmToken
            },
            {
                $set: {
                    platform: payload.platform,
                    deviceName: payload.deviceName,
                    appVersion: payload.appVersion,
                    isActive: true,
                    lastSeenAt: new Date()
                }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({
            success: true,
            data: device
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

export const unregisterMobileDevice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const payload = unregisterDeviceSchema.parse(req.body);

        await MobileDevice.findOneAndUpdate(
            {
                userId: req.user?._id,
                fcmToken: payload.fcmToken
            },
            {
                $set: {
                    isActive: false,
                    lastSeenAt: new Date()
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Device unregistered'
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
