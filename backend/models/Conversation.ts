import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[];
    lastMessage?: mongoose.Types.ObjectId;
    lastMessageAt?: Date;
    unreadCounts: Map<string, number>;
    typingUsers: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message'
        },
        lastMessageAt: {
            type: Date
        },
        unreadCounts: {
            type: Map,
            of: Number,
            default: new Map()
        },
        typingUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }]
    },
    { timestamps: true }
);

// Compound index for finding conversations by participant pairs (sorted to ensure consistency)
ConversationSchema.index({ participants: 1 });

// Index for efficient conversation queries
ConversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
