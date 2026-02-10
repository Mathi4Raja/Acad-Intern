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
        minlength: 6,
        select: false
        // Not required - Google OAuth users won't have passwords
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
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpires: {
        type: Date,
        select: false
    },
    loginAttempts: {
        type: Number,
        required: true,
        default: 0
    },
    lockUntil: {
        type: Date,
        select: false
    }
});

// Hash password before saving (only if password exists and is modified)
userSchema.pre('save', async function (next) {
    if (!this.password_hash || !this.isModified('password_hash')) {
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
userSchema.methods.generateAuthToken = function (expiresIn: string = process.env.JWT_EXPIRE || '7d', authStartedAt: number = Date.now()): string {
    const payload = {
        id: this._id,
        role: this.role,
        email: this.email,
        authStartedAt // Track initial login for absolute timeout
    };
    const secret = process.env.JWT_SECRET as string;
    const options: SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, secret, options);
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
