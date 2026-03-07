import Notification from '../models/Notification';
import SystemSetting from '../models/SystemSetting';
import { INotification } from '../types';
import { sendPushNotificationToUser } from './pushNotificationService';

interface NotificationOptions {
    userId: any;
    type: 'application' | 'status_update' | 'admin' | 'general';
    title: string;
    message: string;
    payload?: any;
}

/**
 * Central service to create notifications with global settings enforcement
 */
export const createNotification = async (options: NotificationOptions): Promise<INotification | null> => {
    try {
        // Fetch relevant toggle from system settings
        let settingKey: string | null = null;
        
        if (options.type === 'status_update' || options.type === 'application') {
            settingKey = 'applicationNotifications';
        } else if (options.type === 'general') {
            settingKey = 'emailNotifications';
        }

        if (settingKey) {
            const setting = await SystemSetting.findOne({ key: settingKey });
            if (setting && setting.value === false) {
                console.log(`[SUBSYSTEM] Notification suppressed by granular setting: ${settingKey}`);
                return null;
            }
        }

        const notification = await Notification.create({
            userId: options.userId,
            type: options.type,
            title: options.title,
            message: options.message,
            payload: options.payload || {},
            read: false
        });

        const route = typeof options.payload?.route === 'string'
            ? options.payload.route
            : '/notifications';

        await sendPushNotificationToUser(String(options.userId), {
            title: options.title,
            body: options.message,
            data: {
                notificationId: String(notification._id),
                type: options.type,
                route
            }
        });

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        // We don't throw here to prevent blocking the main business flow if notifications fail
        return null;
    }
};
