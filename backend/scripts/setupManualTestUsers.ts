import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import Company from '../models/Company';
import StudentProfile from '../models/StudentProfile';
import connectDB from '../config/db';
import bcrypt from 'bcryptjs';

const setupUsers = async () => {
    console.log('🔧 Setting up Manual Test Users...');
    await connectDB();

    const password = 'password123';

    // 1. Student
    const studentEmail = 'student@test.com';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
        student = await User.create({
            name: 'Test Student',
            email: studentEmail,
            password_hash: password,
            role: 'student',
            isVerified: true
        });
        await StudentProfile.create({ userId: student._id });
        console.log(`✅ Created Student: ${studentEmail}`);
    } else {
        student.password_hash = password;
        await student.save();
        console.log(`♻️  Reset Student Password: ${studentEmail}`);
    }

    // 2. Company
    const companyEmail = 'company@test.com';
    let companyUser = await User.findOne({ email: companyEmail });
    if (!companyUser) {
        companyUser = await User.create({
            name: 'Test Company',
            email: companyEmail,
            password_hash: password,
            role: 'company',
            isVerified: true
        });
        await Company.create({
            userId: companyUser._id,
            companyName: 'Test Company Inc.',
            description: 'A test company for manual verification.'
        });
        console.log(`✅ Created Company: ${companyEmail}`);
    } else {
        companyUser.password_hash = password;
        await companyUser.save();
        console.log(`♻️  Reset Company Password: ${companyEmail}`);
    }

    console.log('\n🎉 Users are ready for manual testing!');
    process.exit(0);
};

setupUsers();
