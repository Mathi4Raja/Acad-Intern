import mongoose, { Schema, Model } from 'mongoose';

// Message status enum
export type MessageStatus = 'sent' | 'delivered' | 'seen';

// Message attachment interface
export interface IMessageAttachment {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

// Message document interface
export interface IMessage extends mongoose.Document {
    applicationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    content?: string;
    attachments: IMessageAttachment[];
    status: MessageStatus;
    createdAt: Date;
    updatedAt: Date;
    deliveredAt?: Date;
    seenAt?: Date;
    isDeleted?: boolean;
    deletedAt?: Date;
}

const messageSchema = new Schema<IMessage>({
    applicationId: {
        type: Schema.Types.ObjectId,
        ref: 'Application',
        required: true,
        index: true
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        trim: true,
        default: ''
    },
    attachments: [{
        fileUrl: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'],
        default: 'sent'
    },
    deliveredAt: {
        type: Date
    },
    seenAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
messageSchema.index({ applicationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);

export default Message;
