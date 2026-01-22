import mongoose, { Schema, Model } from 'mongoose';
import { ICompany } from '../types';

const companySchema = new Schema<ICompany>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    companyName: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true
    },
    website: {
        type: String,
        trim: true,
        default: null
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    verified: {
        type: Boolean,
        default: false
    },
    logo: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: ''
    },
    industry: {
        type: String,
        default: ''
    },
    companySize: {
        type: String,
        default: ''
    },
    founded: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    socialLinks: {
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' }
    },
    about: {
        type: String,
        default: ''
    },
    benefits: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Company: Model<ICompany> = mongoose.model<ICompany>('Company', companySchema);

export default Company;
