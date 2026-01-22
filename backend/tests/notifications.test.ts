import { request, app, createTestUser, createTestCompanyWithProfile, createTestStudentWithProfile } from './helpers';
import Notification from '../models/Notification';

// Helper constant for valid descriptions (20+ chars required by Zod)
const DESC = 'This is a valid test description that meets the minimum length requirement';

describe('Notifications API', () => {
    describe('GET /api/notifications', () => {
        it('should return user notifications', async () => {
            const user = await createTestUser('student', 'notif');

            // Create notifications with valid types (application, status_update, admin, general)
            await Notification.create([
                {
                    userId: user.id,
                    type: 'general',
                    title: 'Welcome',
                    message: 'Welcome to AcadIntern!',
                    read: false
                },
                {
                    userId: user.id,
                    type: 'general',
                    title: 'Profile Tip',
                    message: 'Complete your profile to get better matches.',
                    read: false
                }
            ]);

            const res = await request(app)
                .get('/api/notifications')
                .set('Cookie', user.cookie);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.items).toHaveLength(2);
            expect(res.body.data.unreadCount).toBe(2);
        });

        it('should return correct unread count', async () => {
            const user = await createTestUser('student', 'unread');

            await Notification.create([
                {
                    userId: user.id,
                    type: 'general',
                    title: 'Read',
                    message: 'This is read.',
                    read: true
                },
                {
                    userId: user.id,
                    type: 'general',
                    title: 'Unread',
                    message: 'This is unread.',
                    read: false
                }
            ]);

            const res = await request(app)
                .get('/api/notifications')
                .set('Cookie', user.cookie);

            expect(res.body.data.unreadCount).toBe(1);
        });

        it('should only return own notifications', async () => {
            const user1 = await createTestUser('student', 'own1');
            const user2 = await createTestUser('student', 'own2');

            await Notification.create([
                {
                    userId: user1.id,
                    type: 'general',
                    title: 'For User 1',
                    message: 'Message for user 1',
                    read: false
                },
                {
                    userId: user2.id,
                    type: 'general',
                    title: 'For User 2',
                    message: 'Message for user 2',
                    read: false
                }
            ]);

            const res = await request(app)
                .get('/api/notifications')
                .set('Cookie', user1.cookie);

            expect(res.body.data.items).toHaveLength(1);
            expect(res.body.data.items[0].title).toBe('For User 1');
        });
    });

    describe('PATCH /api/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const user = await createTestUser('student', 'markread');

            const notification = await Notification.create({
                userId: user.id,
                type: 'general',
                title: 'Mark Me Read',
                message: 'Please mark me as read.',
                read: false
            });

            const res = await request(app)
                .patch(`/api/notifications/${notification._id}/read`)
                .set('Cookie', user.cookie);

            expect(res.status).toBe(200);
            expect(res.body.data.read).toBe(true);

            // Verify in database
            const updated = await Notification.findById(notification._id);
            expect(updated?.read).toBe(true);
        });

        it('should reject marking other user notification', async () => {
            const user1 = await createTestUser('student', 'mark1');
            const user2 = await createTestUser('student', 'mark2');

            const notification = await Notification.create({
                userId: user1.id,
                type: 'general',
                title: 'Private',
                message: 'Private notification',
                read: false
            });

            const res = await request(app)
                .patch(`/api/notifications/${notification._id}/read`)
                .set('Cookie', user2.cookie);

            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /api/notifications/read-all', () => {
        it('should mark all notifications as read', async () => {
            const user = await createTestUser('student', 'readall');

            await Notification.create([
                {
                    userId: user.id,
                    type: 'general',
                    title: 'Unread 1',
                    message: 'Message 1',
                    read: false
                },
                {
                    userId: user.id,
                    type: 'general',
                    title: 'Unread 2',
                    message: 'Message 2',
                    read: false
                },
                {
                    userId: user.id,
                    type: 'general',
                    title: 'Unread 3',
                    message: 'Message 3',
                    read: false
                }
            ]);

            const res = await request(app)
                .patch('/api/notifications/read-all')
                .set('Cookie', user.cookie);

            expect(res.status).toBe(200);

            // Verify all are read
            const unreadCount = await Notification.countDocuments({
                userId: user.id,
                read: false
            });
            expect(unreadCount).toBe(0);
        });

        it('should only affect own notifications', async () => {
            const user1 = await createTestUser('student', 'all1');
            const user2 = await createTestUser('student', 'all2');

            await Notification.create([
                {
                    userId: user1.id,
                    type: 'general',
                    title: 'User1 Notif',
                    message: 'For user 1',
                    read: false
                },
                {
                    userId: user2.id,
                    type: 'general',
                    title: 'User2 Notif',
                    message: 'For user 2',
                    read: false
                }
            ]);

            await request(app)
                .patch('/api/notifications/read-all')
                .set('Cookie', user1.cookie);

            // User 2's notification should still be unread
            const user2Unread = await Notification.countDocuments({
                userId: user2.id,
                read: false
            });
            expect(user2Unread).toBe(1);
        });
    });

    describe('Application-triggered notifications', () => {
        it('should create notification when student applies', async () => {
            const company = await createTestCompanyWithProfile('appnotif');
            const student = await createTestStudentWithProfile('appnotif');

            const internshipRes = await request(app)
                .post('/api/internships')
                .set('Cookie', company.cookie)
                .send({
                    title: 'Application Notification Test',
                    description: DESC,
                    skillsRequired: ['JavaScript'],
                    durationWeeks: 8,
                    stipend: 10000,
                    mode: 'remote',
                    openings: 1
                });

            expect(internshipRes.status).toBe(201);

            await request(app)
                .post(`/api/applications/internships/${internshipRes.body.data._id}/apply`)
                .set('Cookie', student.cookie)
                .send({});

            // Company should have notification
            const companyNotifs = await request(app)
                .get('/api/notifications')
                .set('Cookie', company.cookie);

            expect(companyNotifs.body.data.items.length).toBeGreaterThan(0);
            const appNotif = companyNotifs.body.data.items.find(
                (n: any) => n.type === 'application'
            );
            expect(appNotif).toBeDefined();
        });
    });
});
