/**
 * Seed Applications for Existing Company (TechCorp Solutions)
 * Run with: npx ts-node scripts/seedTechCorpApplications.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from '../models/User';
import Company from '../models/Company';
import Internship from '../models/Internship';
import Application from '../models/Application';
import Notification from '../models/Notification';

dotenv.config();

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedTechCorpApplications = async () => {
    try {
        console.log('🌱 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected.\n');

        // Find TechCorp Solutions company
        const techCorpUser = await User.findOne({ email: 'company@test.com' });
        if (!techCorpUser) {
            console.log('❌ TechCorp user not found');
            process.exit(1);
        }

        const techCorpCompany = await Company.findOne({ userId: techCorpUser._id });
        if (!techCorpCompany) {
            console.log('❌ TechCorp company profile not found');
            process.exit(1);
        }

        console.log(`📊 Found TechCorp: ${techCorpCompany.companyName}`);

        // Get TechCorp's internships
        const techCorpInternships = await Internship.find({ companyId: techCorpCompany._id });
        console.log(`💼 Found ${techCorpInternships.length} internships\n`);

        // Get all students
        const students = await User.find({ role: 'student' });
        console.log(`👤 Found ${students.length} students\n`);

        const statuses = ['pending', 'shortlisted', 'assessment_completed', 'accepted', 'rejected'];
        let applicationsCreated = 0;

        // Create applications for each TechCorp internship
        for (const internship of techCorpInternships) {
            const numApplicants = getRandomInt(3, 8);
            const selectedStudents = students.sort(() => 0.5 - Math.random()).slice(0, numApplicants);

            for (const student of selectedStudents) {
                // Check if application already exists
                const existing = await Application.findOne({
                    internshipId: internship._id,
                    studentId: student._id
                });

                if (!existing) {
                    await Application.create({
                        internshipId: internship._id,
                        studentId: student._id,
                        status: getRandomElement(statuses),
                        coverLetter: `I am very interested in the ${internship.title} position at ${techCorpCompany.companyName}. My skills and enthusiasm make me a great fit for this role.`,
                        appliedAt: new Date(Date.now() - getRandomInt(1, 14) * 24 * 60 * 60 * 1000)
                    });
                    applicationsCreated++;
                }
            }
            console.log(`  ✅ ${internship.title}: Added applications`);
        }

        // Create notification for TechCorp
        await Notification.create({
            userId: techCorpUser._id,
            title: 'New Applications Received',
            message: `You have ${applicationsCreated} new applications across your internships!`,
            type: 'application',
            read: false
        });

        console.log(`\n📊 Created ${applicationsCreated} applications for TechCorp`);
        console.log('✅ Done! Refresh the company dashboard to see applications.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
};

seedTechCorpApplications();
