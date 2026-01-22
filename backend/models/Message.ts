import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: string;
    messageType: 'text' | 'file';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    status: 'sent' | 'delivered' | 'read';
    readBy: mongoose.Types.ObjectId[];
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: function(this: IMessage) {
                return this.messageType === 'text';
            },
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters']
        },
        messageType: {
            type: String,
            enum: ['text', 'file'],
            default: 'text'
        },
        fileUrl: {
            type: String
        },
        fileName: {
            type: String
        },
        fileSize: {
            type: Number
        },
        fileType: {
            type: String
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read'],
            default: 'sent'
        },
        readBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        readAt: {
            type: Date
        }
    },
    { timestamps: true }
);

// Index for fetching messages in a conversation
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Index for message status updates
MessageSchema.index({ conversationId: 1, status: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
