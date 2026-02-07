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
    requirements: {
        type: String,
        default: ''
    },
    responsibilities: {
        type: String,
        default: ''
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
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed', 'in_progress', 'rejected'],
        default: 'active'
    },
    location: {
        type: String,
        default: ''
    },
    deadline: {
        type: Date,
        default: null
    },
    views: {
        type: Number,
        default: 0
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
