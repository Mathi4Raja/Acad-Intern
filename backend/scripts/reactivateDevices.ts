import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import MobileDevice from '../models/MobileDevice';
import User from '../models/User';

async function reactivate() {
    const email = 'aientirely@gmail.com';
    try {
        await connectDB();
        const user = await User.findOne({ email });
        if (!user) {
            console.error('User not found');
            return;
        }
        const result = await MobileDevice.updateMany(
            { userId: user._id },
            { $set: { isActive: true } }
        );
        console.log(`✅ Reactivated ${result.modifiedCount} device(s) for ${email}`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

reactivate();
