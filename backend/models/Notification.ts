import mongoose, { Schema, Model } from 'mongoose';
import { INotification } from '../types';

const notificationSchema = new Schema<INotification>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['application', 'status_update', 'admin', 'general'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    payload: {
        type: Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
