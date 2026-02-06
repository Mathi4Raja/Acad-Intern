import { request, app } from './helpers';
import SystemSetting from '../models/SystemSetting';

describe('Settings API', () => {
    describe('GET /api/settings/public', () => {
        it('should return public settings', async () => {
            const res = await request(app)
                .get('/api/settings/public');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        it('should include default values for missing settings', async () => {
            const res = await request(app)
                .get('/api/settings/public');

            expect(res.status).toBe(200);
            // Default values should be present
            expect(res.body.data.maxFileSize).toBeDefined();
            expect(res.body.data.allowResumeUpload).toBeDefined();
            expect(res.body.data.siteName).toBeDefined();
        });

        it('should convert numeric values correctly', async () => {
            // Create a numeric setting
            await SystemSetting.findOneAndUpdate(
                { key: 'maxFileSize' },
                { key: 'maxFileSize', value: '10' },
                { upsert: true }
            );

            const res = await request(app)
                .get('/api/settings/public');

            expect(res.status).toBe(200);
            expect(typeof res.body.data.maxFileSize).toBe('number');
        });

        it('should convert boolean values correctly', async () => {
            // Create a boolean setting
            await SystemSetting.findOneAndUpdate(
                { key: 'allowResumeUpload' },
                { key: 'allowResumeUpload', value: 'true' },
                { upsert: true }
            );

            const res = await request(app)
                .get('/api/settings/public');

            expect(res.status).toBe(200);
            expect(typeof res.body.data.allowResumeUpload).toBe('boolean');
        });
    });
});
