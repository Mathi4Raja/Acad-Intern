import { request, app, createTestUser, createTestStudentWithProfile } from './helpers';
import SystemSetting from '../models/SystemSetting';

describe('Upload API', () => {
    describe('POST /api/upload/validate', () => {
        it('should validate existing URL', async () => {
            const student = await createTestStudentWithProfile('validate');

            const res = await request(app)
                .post('/api/upload/validate')
                .set('Cookie', student.cookie)
                .send({ url: 'https://www.google.com' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.exists).toBe(true);
        });

        it('should return false for non-existent URL', async () => {
            const student = await createTestStudentWithProfile('noexist');

            const res = await request(app)
                .post('/api/upload/validate')
                .set('Cookie', student.cookie)
                .send({ url: 'https://nonexistent-domain-12345xyz.com/file.pdf' });

            expect(res.status).toBe(200);
            expect(res.body.data.exists).toBe(false);
        });

        it('should reject missing URL', async () => {
            const student = await createTestStudentWithProfile('nourl');

            const res = await request(app)
                .post('/api/upload/validate')
                .set('Cookie', student.cookie)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('URL is required');
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .post('/api/upload/validate')
                .send({ url: 'https://example.com' });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/upload', () => {
        it('should reject request without file', async () => {
            const student = await createTestStudentWithProfile('nofile');

            const res = await request(app)
                .post('/api/upload')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('No file uploaded');
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .post('/api/upload');

            expect(res.status).toBe(401);
        });

        it('should respect resume upload disabled setting', async () => {
            const student = await createTestStudentWithProfile('disabled');

            // Disable resume uploads
            await SystemSetting.findOneAndUpdate(
                { key: 'allowResumeUpload' },
                { key: 'allowResumeUpload', value: 'false' },
                { upsert: true }
            );

            // Create a small test buffer as file
            const testBuffer = Buffer.from('test file content');

            const res = await request(app)
                .post('/api/upload')
                .set('Cookie', student.cookie)
                .attach('file', testBuffer, 'test.pdf')
                .field('type', 'resume');

            // Re-enable for other tests
            await SystemSetting.findOneAndUpdate(
                { key: 'allowResumeUpload' },
                { key: 'allowResumeUpload', value: 'true' },
                { upsert: true }
            );

            expect(res.status).toBe(403);
            expect(res.body.message).toContain('disabled');
        });
    });

    describe('GET /api/upload/proxy-download', () => {
        it('should reject missing URL parameter', async () => {
            const student = await createTestStudentWithProfile('proxy');

            const res = await request(app)
                .get('/api/upload/proxy-download')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(400);
        });

        it('should reject invalid URL', async () => {
            const student = await createTestStudentWithProfile('badproxy');

            const res = await request(app)
                .get('/api/upload/proxy-download')
                .query({ url: 'not-a-valid-url' })
                .set('Cookie', student.cookie);

            expect(res.status).toBe(400);
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .get('/api/upload/proxy-download')
                .query({ url: 'https://example.com/file.pdf' });

            expect(res.status).toBe(401);
        });
    });
});
