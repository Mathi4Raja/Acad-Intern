import mongoose, { Schema, Model } from 'mongoose';
import { IStudentProfile } from '../types';

interface IStudentProfileWithMethods extends IStudentProfile {
    calculateCompleteness(): number;
}

const studentProfileSchema = new Schema<IStudentProfileWithMethods>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    department: {
        type: String,
        trim: true,
        default: ''
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
        default: null
    },
    resumeUrl: {
        type: String,
        default: null
    },
    skills: {
        type: [String],
        default: []
    },
    hoursRequired: {
        type: Number,
        default: 0,
        min: 0
    },
    completenessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    phone: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        trim: true,
        default: ''
    },
    cgpa: {
        type: Number,
        min: 0,
        max: 10,
        default: null
    },
    linkedIn: {
        type: String,
        trim: true,
        default: ''
    },
    github: {
        type: String,
        trim: true,
        default: ''
    },
    profilePicture: {
        type: String,
        default: null
    },
    bannerImage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Create unique index on userId
studentProfileSchema.index({ userId: 1 }, { unique: true });

// Calculate completeness score
studentProfileSchema.methods.calculateCompleteness = function (): number {
    let score = 0;

    if (this.department) score += 20;
    if (this.semester) score += 20;
    if (this.resumeUrl) score += 30;
    if (this.skills && this.skills.length > 0) score += 20;
    if (this.hoursRequired && this.hoursRequired > 0) score += 10;

    this.completenessScore = score;
    return score;
};

const StudentProfile: Model<IStudentProfileWithMethods> = mongoose.model<IStudentProfileWithMethods>('StudentProfile', studentProfileSchema);

export default StudentProfile;
