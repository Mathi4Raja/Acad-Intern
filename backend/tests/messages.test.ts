import { request, app, createTestCompanyWithProfile, createTestStudentWithProfile } from './helpers';
import Message from '../models/Message';
import Application from '../models/Application';

// Helper constant for valid descriptions
const DESC = 'This is a valid test description that meets the minimum length requirement';

describe('Messages API', () => {
    // Helper to create an application for messaging
    async function createApplicationForMessaging(suffix: string) {
        const company = await createTestCompanyWithProfile(`msg${suffix}`);
        const student = await createTestStudentWithProfile(`msg${suffix}`);

        // Create internship
        const internshipRes = await request(app)
            .post('/api/internships')
            .set('Cookie', company.cookie)
            .send({
                title: `Messaging Test ${suffix}`,
                description: DESC,
                skillsRequired: ['JavaScript'],
                durationWeeks: 8,
                stipend: 10000,
                mode: 'remote',
                openings: 1
            });

        // Apply for internship
        const applyRes = await request(app)
            .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
            .set('Cookie', student.cookie)
            .send({});

        return {
            company,
            student,
            applicationId: applyRes.body.data._id
        };
    }

    describe('GET /api/messages/conversations', () => {
        it('should return user conversations', async () => {
            const { student } = await createApplicationForMessaging('conv');

            const res = await request(app)
                .get('/api/messages/conversations')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject unauthenticated access', async () => {
            const res = await request(app)
                .get('/api/messages/conversations');

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/messages/unread-count', () => {
        it('should return unread message count', async () => {
            const { student } = await createApplicationForMessaging('unread');

            const res = await request(app)
                .get('/api/messages/unread-count')
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
        });
    });

    describe('GET /api/messages/application/:applicationId', () => {
        it('should return messages for application', async () => {
            const { company, applicationId } = await createApplicationForMessaging('getmsg');

            const res = await request(app)
                .get(`/api/messages/application/${applicationId}`)
                .set('Cookie', company.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject unauthorized user access', async () => {
            const { applicationId } = await createApplicationForMessaging('unauthorized');
            const otherStudent = await createTestStudentWithProfile('other');

            const res = await request(app)
                .get(`/api/messages/application/${applicationId}`)
                .set('Cookie', otherStudent.cookie);

            expect(res.status).toBe(403);
        });
    });

    describe('POST /api/messages/application/:applicationId', () => {
        it('should send text message', async () => {
            const { company, applicationId } = await createApplicationForMessaging('sendmsg');

            const res = await request(app)
                .post(`/api/messages/application/${applicationId}`)
                .set('Cookie', company.cookie)
                .send({ content: 'Hello, this is a test message!' });

            expect(res.status).toBe(201);
            expect(res.body.data.content).toBe('Hello, this is a test message!');
        });

        it('should allow student to reply', async () => {
            const { student, applicationId } = await createApplicationForMessaging('reply');

            const res = await request(app)
                .post(`/api/messages/application/${applicationId}`)
                .set('Cookie', student.cookie)
                .send({ content: 'Thank you for considering my application!' });

            expect(res.status).toBe(201);
        });

        it('should reject empty message without attachments', async () => {
            const { company, applicationId } = await createApplicationForMessaging('empty');

            const res = await request(app)
                .post(`/api/messages/application/${applicationId}`)
                .set('Cookie', company.cookie)
                .send({ content: '' });

            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/messages/application/:applicationId/seen', () => {
        it('should mark messages as seen', async () => {
            const { company, student, applicationId } = await createApplicationForMessaging('seen');

            // Company sends a message
            await request(app)
                .post(`/api/messages/application/${applicationId}`)
                .set('Cookie', company.cookie)
                .send({ content: 'Please check your email.' });

            // Student marks as seen
            const res = await request(app)
                .patch(`/api/messages/application/${applicationId}/seen`)
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/messages/application/:applicationId/mute', () => {
        it('should mute conversation', async () => {
            const { student, applicationId } = await createApplicationForMessaging('mute');

            // Set mute until 1 hour from now
            const mutedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();

            const res = await request(app)
                .post(`/api/messages/application/${applicationId}/mute`)
                .set('Cookie', student.cookie)
                .send({ mutedUntil });

            expect(res.status).toBe(200);
        });

        it('should unmute conversation', async () => {
            const { student, applicationId } = await createApplicationForMessaging('unmute');

            const res = await request(app)
                .post(`/api/messages/application/${applicationId}/mute`)
                .set('Cookie', student.cookie)
                .send({ mutedUntil: null });

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/messages/application/:applicationId/preferences', () => {
        it('should return conversation preferences', async () => {
            const { student, applicationId } = await createApplicationForMessaging('prefs');

            const res = await request(app)
                .get(`/api/messages/application/${applicationId}/preferences`)
                .set('Cookie', student.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
