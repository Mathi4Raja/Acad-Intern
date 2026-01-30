import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSetting extends Document {
    key: string;
    value: any;
    group: string;
    description?: string;
    updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: Schema.Types.Mixed,
        required: true
    },
    group: {
        type: String,
        required: true,
        index: true
    },
    description: {
        type: String
    }
}, {
    timestamps: true
});

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
