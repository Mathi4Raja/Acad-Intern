import mongoose, { Schema, Model } from 'mongoose';
import { IInternship } from '../types';

const internshipSchema = new Schema<IInternship>({
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Internship title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    skillsRequired: {
        type: [String],
        default: []
    },
    durationWeeks: {
        type: Number,
        required: [true, 'Duration is required'],
        min: 1
    },
    stipend: {
        type: Number,
        default: 0,
        min: 0
    },
    mode: {
        type: String,
        enum: ['remote', 'onsite', 'hybrid'],
        default: 'remote'
    },
    openings: {
        type: Number,
        default: 1,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    location: {
        type: String,
        default: ''
    },
    deadline: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Create text indexes for search
internshipSchema.index({
    title: 'text',
    description: 'text',
    skillsRequired: 'text'
});

const Internship: Model<IInternship> = mongoose.model<IInternship>('Internship', internshipSchema);

export default Internship;
