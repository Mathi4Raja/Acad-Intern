import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import connectDB from '../config/db';
import bcrypt from 'bcryptjs';

const fixUser = async () => {
    console.log('🔧 Fixing Login for student@test.com...');
    await connectDB();

    const email = 'student@test.com';
    const password = 'password123';

    try {
        let user = await User.findOne({ email });

        if (user) {
            console.log(`👤 User found: ${user._id}`);
            // Force reset password
            user.password_hash = password;
            // The pre-save hook will hash this
            await user.save();
            console.log('✅ Password reset to "password123"');
        } else {
            console.log('👤 User not found. Creating...');
            user = await User.create({
                name: 'Test Student',
                email,
                password_hash: password,
                role: 'student',
                isVerified: true
            });
            console.log(`✅ Created user: ${user._id} with password "password123"`);
        }

        // Verify immediately
        const updatedUser = await User.findOne({ email }).select('+password_hash');
        const isMatch = await bcrypt.compare(password, updatedUser!.password_hash);
        console.log(`🔍 Verification Match: ${isMatch}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

fixUser();
