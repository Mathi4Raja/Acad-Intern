import mongoose, { Schema, Model } from 'mongoose';
import { IMobileDevice } from '../types';

const mobileDeviceSchema = new Schema<IMobileDevice>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        fcmToken: {
            type: String,
            required: true,
            trim: true
        },
        platform: {
            type: String,
            enum: ['android', 'ios'],
            required: true
        },
        deviceName: {
            type: String,
            trim: true
        },
        appVersion: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastSeenAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

mobileDeviceSchema.index({ userId: 1, fcmToken: 1 }, { unique: true });

const MobileDevice: Model<IMobileDevice> = mongoose.model<IMobileDevice>('MobileDevice', mobileDeviceSchema);

export default MobileDevice;
