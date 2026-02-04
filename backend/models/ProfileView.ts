import mongoose, { Schema, Document } from 'mongoose';

export interface IProfileView extends Document {
    viewerId: mongoose.Types.ObjectId;
    profileOwnerId: mongoose.Types.ObjectId;
    viewerRole: 'company' | 'student' | 'admin';
    viewType: 'profile_view' | 'search_appearance';
    viewedAt: Date;
}

const ProfileViewSchema: Schema = new Schema({
    viewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    profileOwnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewerRole: { type: String, enum: ['company', 'student', 'admin'], required: true },
    viewType: { type: String, enum: ['profile_view', 'search_appearance'], default: 'profile_view' },
    viewedAt: { type: Date, default: Date.now }
});

// Index for efficient querying of stats
ProfileViewSchema.index({ profileOwnerId: 1, viewedAt: -1 });
ProfileViewSchema.index({ profileOwnerId: 1, viewType: 1 });

export default mongoose.model<IProfileView>('ProfileView', ProfileViewSchema);
