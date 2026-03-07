import { request, app, createTestUser } from './helpers';
import SystemSetting from '../models/SystemSetting';
import MobileDevice from '../models/MobileDevice';

describe('Mobile API', () => {
    describe('Bearer token session refresh', () => {
        it('returns X-Auth-Token for bearer-authenticated requests when sliding session is enabled', async () => {
            const user = await createTestUser('student', 'mobile-refresh');

            await SystemSetting.create({
                key: 'sessionTimeout',
                value: 60,
                group: 'security'
            });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${user.token}`);

            expect(res.status).toBe(200);
            expect(res.headers['x-auth-token']).toBeDefined();
            expect(typeof res.headers['x-auth-token']).toBe('string');
        });
    });

    describe('Device registration', () => {
        it('registers and deactivates a mobile device for the current user', async () => {
            const user = await createTestUser('student', 'device');
            const fcmToken = 'test-fcm-token-12345678901234567890';

            const registerRes = await request(app)
                .post('/api/mobile/devices')
                .set('Authorization', `Bearer ${user.token}`)
                .send({
                    fcmToken,
                    platform: 'android',
                    deviceName: 'Pixel Test',
                    appVersion: '1.0.0'
                });

            expect(registerRes.status).toBe(200);
            expect(registerRes.body.success).toBe(true);

            const storedDevice = await MobileDevice.findOne({ userId: user.id, fcmToken });
            expect(storedDevice).not.toBeNull();
            expect(storedDevice?.isActive).toBe(true);

            const unregisterRes = await request(app)
                .delete('/api/mobile/devices')
                .set('Authorization', `Bearer ${user.token}`)
                .send({ fcmToken });

            expect(unregisterRes.status).toBe(200);

            const deactivatedDevice = await MobileDevice.findOne({ userId: user.id, fcmToken });
            expect(deactivatedDevice?.isActive).toBe(false);
        });
    });
});
