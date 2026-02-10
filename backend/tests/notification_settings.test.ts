import Notification from '../models/Notification';
import SystemSetting from '../models/SystemSetting';
import { createNotification } from '../utils/notificationService';
import mongoose from 'mongoose';

describe('Notification Settings Enforcement', () => {
    beforeAll(async () => {
        // Mock DB connection if needed or assume test environment setup
        // For this test, we assume a connected DB as per standard Acad-Intern test patterns
    });

    afterEach(async () => {
        await Notification.deleteMany({});
        await SystemSetting.deleteMany({});
    });

    const mockUserId = new mongoose.Types.ObjectId();

    test('should create notification when setting is ON (default)', async () => {
        const notification = await createNotification({
            userId: mockUserId,
            type: 'status_update',
            title: 'Test Title',
            message: 'Test Message'
        });

        expect(notification).not.toBeNull();
        const found = await Notification.findById(notification?._id);
        expect(found).not.toBeNull();
    });

    test('should NOT create notification when setting is OFF', async () => {
        // Explicitly turn off application notifications
        await SystemSetting.create({
            key: 'applicationNotifications',
            value: false,
            group: 'other'
        });

        const notification = await createNotification({
            userId: mockUserId,
            type: 'status_update',
            title: 'Test Title',
            message: 'Test Message'
        });

        expect(notification).toBeNull();
        const count = await Notification.countDocuments({});
        expect(count).toBe(0);
    });

    test('general notifications should follow emailNotifications toggle', async () => {
        await SystemSetting.create({
            key: 'emailNotifications',
            value: false,
            group: 'email'
        });

        const notification = await createNotification({
            userId: mockUserId,
            type: 'general',
            title: 'Test News',
            message: 'Test Message'
        });

        expect(notification).toBeNull();
    });
});
