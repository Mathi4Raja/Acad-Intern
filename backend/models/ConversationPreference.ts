import mongoose, { Schema, Model } from 'mongoose';
import { IConversationPreference } from '../types';

const conversationPreferenceSchema = new Schema<IConversationPreference>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applicationId: {
        type: Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    mutedUntil: {
        type: Date,
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for quick lookups
conversationPreferenceSchema.index({ userId: 1, applicationId: 1 }, { unique: true });

const ConversationPreference: Model<IConversationPreference> = mongoose.model<IConversationPreference>('ConversationPreference', conversationPreferenceSchema);

export default ConversationPreference;
