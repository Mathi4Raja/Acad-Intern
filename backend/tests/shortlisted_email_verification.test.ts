import User from '../models/User';
import Company from '../models/Company';
import Internship from '../models/Internship';
import Application from '../models/Application';
import SystemSetting from '../models/SystemSetting';
import { updateApplicationStatus } from '../controllers/applicationController';
import { sendEmail } from '../utils/emailService';
import mongoose from 'mongoose';

// Mock the dependencies
jest.mock('../utils/emailService', () => ({
    sendEmail: jest.fn(),
    generateResetToken: jest.fn(),
    hashToken: jest.fn()
}));

jest.mock('../utils/notificationService', () => ({
    createNotification: jest.fn()
}));

describe('Shortlisted Email Verification', () => {
    let req: any;
    let res: any;
    let next: any;
    let companyUser: any;
    let studentUser: any;
    let company: any;
    let internship: any;
    let application: any;

    beforeEach(async () => {
        companyUser = await User.create({
            name: 'Company Admin',
            email: 'admin@company.com',
            password: 'password123',
            role: 'company'
        });

        studentUser = await User.create({
            name: 'John Student',
            email: 'john@student.com',
            password: 'password123',
            role: 'student'
        });

        company = await Company.create({
            userId: companyUser._id,
            companyName: 'Tech Corp',
            website: 'https://tech.corp'
        });

        internship = await Internship.create({
            title: 'Software Engineer Intern',
            companyId: company._id,
            description: 'A great internship opportunity',
            skillsRequired: ['React', 'Node'],
            durationWeeks: 12,
            stipend: 1000,
            mode: 'remote',
            openings: 2,
            status: 'active'
        });

        application = await Application.create({
            internshipId: internship._id,
            studentId: studentUser._id,
            status: 'assessment_completed'
        });

        req = {
            params: { id: application._id.toString() },
            body: { status: 'shortlisted' },
            user: { _id: companyUser._id, role: 'company' },
            app: { get: jest.fn() }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Company.deleteMany({});
        await Internship.deleteMany({});
        await Application.deleteMany({});
        await SystemSetting.deleteMany({});
    });

    test('should send shortlisted email when status is updated to shortlisted', async () => {
        await updateApplicationStatus(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: 'john@student.com',
            type: 'shortlisted',
            subject: expect.stringContaining('Software Engineer Intern')
        }));
    });

    test('should NOT send shortlisted email if status is updated to something else', async () => {
        req.body.status = 'accepted';  // Use a status that doesn't trigger shortlisted email
        await updateApplicationStatus(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        // Verify that shortlisted email was not sent (though other emails might be sent)
        const calls = (sendEmail as jest.Mock).mock.calls;
        const shortlistedEmailSent = calls.some(call => call[0]?.type === 'shortlisted');
        expect(shortlistedEmailSent).toBe(false);
    });
});
