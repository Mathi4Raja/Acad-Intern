
import request from 'supertest';
import { app } from '../server';
import mongoose from 'mongoose';
import SystemSetting from '../models/SystemSetting';
import User from '../models/User';
import jwt from 'jsonwebtoken';

describe('Maintenance Mode Integration', () => {
    let studentToken: string;
    let adminToken: string;

    beforeAll(async () => {
        // Create a student user
        const student = await User.create({
            name: 'Test Student',
            email: 'maintenance-test@example.com',
            password_hash: 'password123',
            role: 'student',
            status: 'active'
        });

        studentToken = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET || 'test_secret');

        // Create an admin user
        const admin = await User.create({
            name: 'Test Admin',
            email: 'admin-maintenance@example.com',
            password_hash: 'password123',
            role: 'admin',
            status: 'active'
        });

        adminToken = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'test_secret');
    });

    afterAll(async () => {
        await User.deleteMany({ email: { $in: ['maintenance-test@example.com', 'admin-maintenance@example.com'] } });
        // Reset maintenance mode
        await SystemSetting.findOneAndUpdate({ key: 'maintenanceMode' }, { value: false });
        await mongoose.connection.close();
    });

    it('should allow traffic when maintenance mode is OFF', async () => {
        // Ensure maintenance is off
        await SystemSetting.findOneAndUpdate({ key: 'maintenanceMode' }, { value: false }, { upsert: true });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).not.toBe(503);
    });

    it('should block non-admin traffic when maintenance mode is ON', async () => {
        // Turn maintenance ON
        await SystemSetting.findOneAndUpdate({ key: 'maintenanceMode' }, { value: true }, { upsert: true });

        const res = await request(app)
            .get('/api/internships')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('maintenance');
    });

    it('should allow admin traffic when maintenance mode is ON', async () => {
        // Ensure maintenance is ON
        await SystemSetting.findOneAndUpdate({ key: 'maintenanceMode' }, { value: true }, { upsert: true });

        // Access an admin route
        const res = await request(app)
            .get('/api/admin/stats')
            .set('Authorization', `Bearer ${adminToken}`);

        // Should not be 503 (might be 200 or 401/403 if other middleware blocks, but middleware should pass)
        // Since we are mocking everything, let's just check it's not 503
        expect(res.status).not.toBe(503);
    });

    it('should always allow public settings route', async () => {
        // Ensure maintenance is ON
        await SystemSetting.findOneAndUpdate({ key: 'maintenanceMode' }, { value: true }, { upsert: true });

        const res = await request(app).get('/api/settings/public');
        expect(res.status).toBe(200);
    });

    it('should allow login route when maintenance mode is ON', async () => {
        // Ensure maintenance is ON
        await SystemSetting.findOneAndUpdate({ key: 'maintenanceMode' }, { value: true }, { upsert: true });

        // Attempt to login (using student or admin credentials doesn't matter for the middleware check)
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin-maintenance@example.com',
                password: 'password123'
            });

        // Should be 200 (successful login) or at least NOT 503 (bypass worked)
        // We accept 401 too as it means it passed the maintenance check and hit the auth controller
        expect(res.status).not.toBe(503);
    });
});
