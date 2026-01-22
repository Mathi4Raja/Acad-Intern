import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password_hash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['student', 'company', 'admin'],
        required: [true, 'Role is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'suspended'],
        default: 'active'
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function (): string {
    const payload = {
        id: this._id,
        role: this.role,
        email: this.email
    };
    const secret = process.env.JWT_SECRET as string;
    const options: SignOptions = { expiresIn: '7d' };
    return jwt.sign(payload, secret, options);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
