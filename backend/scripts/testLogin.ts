import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import connectDB from '../config/db';
import bcrypt from 'bcryptjs';

const testLogin = async () => {
    console.log('🔧 Testing Login Logic directly...');

    await connectDB();

    const email = 'login_test@example.com';
    const password = 'password123';

    try {
        // 1. Cleanup
        await User.deleteOne({ email });

        // 2. Create User
        console.log('👤 Creating Test User...');
        // Manually hash password if the model doesn't do it automatically, 
        // OR rely on model middleware. I'll rely on model middleware first (common pattern).
        const user = await User.create({
            name: 'Login Tester',
            email,
            password_hash: password, // Assuming this triggers pre-save hash, or logic handles it
            role: 'student',
            isVerified: true
        });

        console.log(`✅ User created: ${user._id}`);
        console.log(`   Stored Hash: ${user.password_hash}`);

        // 3. Simulate Login (Check Password)
        console.log('🔑 Attempting Login...');

        const foundUser = await User.findOne({ email }).select('+password_hash');
        if (!foundUser) {
            console.error('❌ User not found after creation!');
            return;
        }

        console.log(`   Found User: ${foundUser._id}`);
        console.log(`   Input Password: ${password}`);
        console.log(`   Db Password Hash: ${foundUser.password_hash}`);

        // Compare
        const isMatch = await bcrypt.compare(password, foundUser.password_hash);
        console.log(`   Bcrypt Compare Result: ${isMatch}`);

        if (isMatch) {
            console.log('✅ Login Successful (Password Match)');
        } else {
            console.error('❌ Login Failed (Password Mismatch)');

            // Debugging: Try hashing the input password to see if it looks remotely similar structure (it won't match hash but good to see bcrypt is working)
            const testHash = await bcrypt.hash(password, 10);
            console.log(`   Test Hash of input: ${testHash}`);
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await User.deleteOne({ email });
        await mongoose.connection.close();
    }
};

testLogin();
