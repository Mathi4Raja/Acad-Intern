import mongoose, { Schema, Model } from 'mongoose';
import { IReport } from '../types';

const reportSchema = new Schema<IReport>({
    internshipId: {
        type: Schema.Types.ObjectId,
        ref: 'Internship',
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
    reason: {
        type: String,
        required: [true, 'Reason for reporting is required'],
        trim: true
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

const Report: Model<IReport> = mongoose.model<IReport>('Report', reportSchema);

export default Report;
