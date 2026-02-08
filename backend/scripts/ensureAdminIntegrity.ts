import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import connectDB from '../config/db';
import bcrypt from 'bcryptjs';

const ensureAdmin = async () => {
    console.log('🔧 Ensuring Admin User...');
    await connectDB();

    const email = 'admin@acadintern.com';
    const password = 'Password123';

    try {
        let user = await User.findOne({ email });

        if (user) {
            console.log(`👤 Admin found: ${user._id}`);
            // Force values and bypass type issues with cast
            (user as any).password_hash = password;
            (user as any).role = 'admin';
            (user as any).isVerified = true;
            (user as any).status = 'active';
            await user.save();
            console.log('✅ Admin updated/restored.');
        } else {
            console.log('👤 Admin not found. Creating...');
            user = await User.create({
                name: 'System Admin',
                email,
                password_hash: password,
                role: 'admin',
                isVerified: true,
                status: 'active'
            });
            console.log(`✅ Created admin: ${user._id}`);
        }

        const updatedUser = await User.findOne({ email }).select('+password_hash');
        if (updatedUser) {
            const isMatch = await bcrypt.compare(password, (updatedUser as any).password_hash);
            console.log(`🔍 Verification Match: ${isMatch}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

ensureAdmin();
