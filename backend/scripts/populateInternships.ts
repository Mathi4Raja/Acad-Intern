import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Company from '../models/Company';
import Internship from '../models/Internship';
import Application from '../models/Application';
import connectDB from '../config/db';

const populateInternships = async () => {
    console.log('🌱 Populating Internships & Applications...');

    try {
        await connectDB();

        // Find Company
        const companyUser = await User.findOne({ email: 'company@test.com' });
        if (!companyUser) throw new Error('Company user not found. Run seedData.ts first.');

        const companyProfile = await Company.findOne({ userId: companyUser._id });
        if (!companyProfile) throw new Error('Company profile not found.');

        // Find Student
        const studentUser = await User.findOne({ email: 'student@test.com' });
        if (!studentUser) throw new Error('Student user not found.');

        // Create 3 Internships
        const internshipsData = [
            {
                title: 'Full Stack Developer Intern',
                description: 'Join our engineering team to build scalable web applications using MERN stack.',
                industry: 'Technology',
                skillsRequired: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
                durationWeeks: 12,
                stipend: 15000,
                location: 'Remote',
                mode: 'remote',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                isActive: true
            },
            {
                title: 'Data Science Intern',
                description: 'Work on analyzing large datasets and building predictive models.',
                industry: 'Data Science',
                skillsRequired: ['Python', 'Pandas', 'scikit-learn', 'SQL'],
                durationWeeks: 10,
                stipend: 20000,
                location: 'New York, NY',
                mode: 'onsite',
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                isActive: true
            },
            {
                title: 'UI/UX Designer Intern',
                description: 'Design intuitive and beautiful user interfaces for our products.',
                industry: 'Design',
                skillsRequired: ['Figma', 'Adobe XD', 'Prototyping'],
                durationWeeks: 8,
                stipend: 12000,
                location: 'San Francisco, CA',
                mode: 'hybrid',
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                isActive: true
            }
        ];

        console.log('📝 Creating Internships...');
        const createdInternships = [];

        for (const data of internshipsData) {
            const internship = await Internship.create({
                companyId: companyProfile._id,
                ...data,
                postedAt: new Date()
            });
            createdInternships.push(internship);
            console.log(`   + Created: ${internship.title}`);
        }

        // Apply as Student
        console.log('📝 Creating Applications...');

        for (const internship of createdInternships) {
            await Application.create({
                studentId: studentUser._id,
                internshipId: internship._id,
                status: 'pending', // Default status
                notes: 'I am very interested in this role!',
                appliedAt: new Date()
            });
            console.log(`   + Applied to: ${internship.title}`);
        }

        console.log('\n✨ Internships & Applications successfully populated!');

    } catch (error) {
        console.error('❌ Population failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

populateInternships();
