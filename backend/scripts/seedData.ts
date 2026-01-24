import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Company from '../models/Company';
import StudentProfile from '../models/StudentProfile';
import Internship from '../models/Internship';
import Application from '../models/Application';
import Message from '../models/Message';
import Notification from '../models/Notification';
import connectDB from '../config/db';

const seedData = async () => {
    console.log('🌱 Starting Database Seeding...');

    try {
        await connectDB();

        console.log('🧹 Clearing existing data...');
        // Clear all relevant collections
        await User.deleteMany({});
        await Company.deleteMany({});
        await StudentProfile.deleteMany({});
        await Internship.deleteMany({});
        await Application.deleteMany({});
        await Message.deleteMany({});
        await Notification.deleteMany({});

        console.log('👥 Creating Users...');

        const password = 'password123';

        // 1. Student
        const student = await User.create({
            name: 'Test Student',
            email: 'student@test.com',
            password_hash: password,
            role: 'student',
            isVerified: true,
            status: 'active'
        });

        await StudentProfile.create({
            userId: student._id,
            university: 'Tech University',
            course: 'Computer Science',
            graduationYear: 2026,
            skills: ['JavaScript', 'React', 'Node.js', 'Python'],
            bio: 'Aspiring Full Stack Developer passionate about building web applications.'
        });
        console.log('✅ Created Student: student@test.com');

        // 2. Company
        const companyUser = await User.create({
            name: 'TechCorp Recruiter',
            email: 'company@test.com',
            password_hash: password,
            role: 'company',
            isVerified: true,
            status: 'active'
        });

        await Company.create({
            userId: companyUser._id,
            companyName: 'TechCorp Solutions',
            industry: 'Technology',
            description: 'Leading provider of innovative software solutions for enterprise clients.',
            website: 'https://techcorp.example.com',
            location: 'San Francisco, CA',
            size: '50-200'
        });
        console.log('✅ Created Company: company@test.com (TechCorp Solutions)');

        // 3. Admin
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@test.com',
            password_hash: password,
            role: 'admin',
            isVerified: true,
            status: 'active'
        });
        console.log('✅ Created Admin: admin@test.com');

        console.log('\n✨ Database successfully seeded with base users!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

seedData();
