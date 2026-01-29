
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
}

const createUser = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'mathi.raja.333@gmail.com';
        const password = 'TestPassword123!';
        const name = 'Mathi Raja Test';

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            console.log(`⚠️ User ${email} already exists.`);
            // Update password just in case
            user.password_hash = password;
            await user.save();
            console.log('✅ Password updated to: ' + password);
        } else {
            console.log(`Creating new user: ${email}...`);
            user = await User.create({
                name,
                email,
                password_hash: password,
                role: 'student',
                status: 'active'
            });

            // Create profile
            await StudentProfile.create({ userId: user._id });
            console.log('✅ User and StudentProfile created successfully');
        }

        console.log('\nUser Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating user:', error);
        process.exit(1);
    }
};

createUser();
