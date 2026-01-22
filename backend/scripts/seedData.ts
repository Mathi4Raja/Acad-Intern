import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load Models
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Company from '../models/Company';
import Internship from '../models/Internship';
import Application from '../models/Application';

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('MongoDB Connected for Seeding');
    } catch (err) {
        console.error('Error connecting to DB:', err);
        process.exit(1);
    }
};

const seedData = async (): Promise<void> => {
    await connectDB();

    try {
        console.log('Cleaning up database...');
        await User.deleteMany({});
        await StudentProfile.deleteMany({});
        await Company.deleteMany({});
        await Internship.deleteMany({});
        await Application.deleteMany({});

        console.log('Creating users...');
        const studentUser = await User.create({
            name: 'John Student',
            email: 'student@test.com',
            password_hash: 'password123',
            role: 'student'
        });

        const companyUser = await User.create({
            name: 'TechCorp Recruiter',
            email: 'company@test.com',
            password_hash: 'password123',
            role: 'company'
        });

        await User.create({
            name: 'System Admin',
            email: 'admin@test.com',
            password_hash: 'password123',
            role: 'admin'
        });

        console.log('Creating profiles...');
        await StudentProfile.create({
            userId: studentUser._id,
            department: 'CSE',
            semester: 6,
            skills: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
            completenessScore: 80
        });

        const companyProfile = await Company.create({
            userId: companyUser._id,
            companyName: 'TechCorp Solutions',
            website: 'https://techcorp.example.com',
            description: 'Leading provider of tech solutions.',
            verified: true
        });

        console.log('Creating internships...');
        const internships = await Internship.create([
            {
                companyId: companyProfile._id,
                title: 'Full Stack Developer Intern',
                description: 'Join our team to build scalable web apps. You will work with the MERN stack.',
                skillsRequired: ['React', 'Node.js', 'MongoDB'],
                durationWeeks: 12,
                stipend: 15000,
                mode: 'remote',
                openings: 3,
                isActive: true
            },
            {
                companyId: companyProfile._id,
                title: 'Backend Developer Intern',
                description: 'Focus on API development and database optimization.',
                skillsRequired: ['Node.js', 'Express', 'SQL'],
                durationWeeks: 10,
                stipend: 18000,
                mode: 'onsite',
                openings: 2,
                isActive: true
            }
        ]);

        console.log('Creating applications...');
        await Application.create({
            internshipId: internships[0]._id,
            studentId: studentUser._id,
            status: 'pending',
            appliedAt: new Date(),
            notes: 'I am very interested!'
        });

        console.log('✅ Data Seeding Completed!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
