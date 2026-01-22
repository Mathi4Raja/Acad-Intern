import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStatus extends Document {
    userId: mongoose.Types.ObjectId;
    isOnline: boolean;
    lastSeen: Date;
    socketId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserStatusSchema = new Schema<IUserStatus>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        isOnline: {
            type: Boolean,
            default: false
        },
        lastSeen: {
            type: Date,
            default: Date.now
        },
        socketId: {
            type: String
        }
    },
    { timestamps: true }
);

// Index for efficient lookups
// Keep only the composite index; the unique constraint on `userId`
// already creates a unique index, so avoid duplicating it.
UserStatusSchema.index({ isOnline: 1, lastSeen: -1 });

export default mongoose.model<IUserStatus>('UserStatus', UserStatusSchema);