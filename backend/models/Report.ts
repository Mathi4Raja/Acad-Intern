import mongoose, { Schema, Model } from 'mongoose';
import { IReport } from '../types';

const reportSchema = new Schema<IReport>({
    internshipId: {
        type: Schema.Types.ObjectId,
        ref: 'Internship',
        default: null
    },
    applicationId: {
        type: Schema.Types.ObjectId,
        ref: 'Application',
        default: null
    },
    reporterId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    body: {
        type: String,
        required: [true, 'Body is required'],
        trim: true
    },
    context: {
        type: Schema.Types.Mixed,
        default: null
    },
    screenshots: [{
        type: String
    }],
    isAutomatedFlag: {
        type: Boolean,
        default: false
    },
    flagMetadata: {
        type: Schema.Types.Mixed,
        default: null
    },
    category: {
        type: String,
        default: 'other'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'under_review', 'resolved', 'dismissed'],
        default: 'open'
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    adminNotes: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Index for admin queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedUserId: 1 });

const Report: Model<IReport> = mongoose.model<IReport>('Report', reportSchema);

export default Report;
