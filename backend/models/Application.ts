import mongoose, { Schema, Model } from 'mongoose';
import { IApplication } from '../types';

const applicationSchema = new Schema<IApplication>({
    internshipId: {
        type: Schema.Types.ObjectId,
        ref: 'Internship',
        required: true
    },
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'rejected', 'accepted'],
        default: 'pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    coverLetter: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ internshipId: 1, studentId: 1 }, { unique: true });

const Application: Model<IApplication> = mongoose.model<IApplication>('Application', applicationSchema);

export default Application;
