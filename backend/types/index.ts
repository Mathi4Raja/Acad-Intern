import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User roles enum
export type UserRole = 'student' | 'company' | 'admin';

// Application status enum
export type ApplicationStatus = 'pending' | 'shortlisted' | 'rejected' | 'accepted';

// Report status enum
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

// User status enum
export type UserStatus = 'active' | 'pending' | 'suspended';

// Internship mode enum
export type InternshipMode = 'remote' | 'onsite' | 'hybrid';

// User document interface
export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password_hash: string;
    role: UserRole;
    name: string;
    createdAt: Date;
    status: UserStatus;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
}

// Student profile interface
export interface IStudentProfile extends Document {
    userId: Types.ObjectId;
    department?: string;
    semester?: number;
    resumeUrl?: string;
    skills: string[];
    hoursRequired?: number;
    completenessScore?: number;
    phone?: string;
    location?: string;
    bio?: string;
    cgpa?: number;
    linkedIn?: string;
    github?: string;
}

// Company interface
export interface ICompany extends Document {
    userId: Types.ObjectId;
    companyName: string;
    website?: string;
    description?: string;
    verified: boolean;
    cin?: string;
    logo?: string;
    location?: string;
    industry?: string;
    companySize?: string;
    founded?: string;
    phone?: string;
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
        instagram?: string;
    };
    about?: string;
    benefits?: string;
}

// Internship interface
export interface IInternship extends Document {
    companyId: Types.ObjectId;
    title: string;
    description: string;
    skillsRequired: string[];
    durationWeeks: number;
    stipend?: number;
    mode: InternshipMode;
    openings: number;
    createdAt: Date;
    isActive: boolean;
    location?: string;
    deadline?: Date;
}

// Application interface
export interface IApplication extends Document {
    internshipId: Types.ObjectId;
    studentId: Types.ObjectId;
    status: ApplicationStatus;
    appliedAt: Date;
    notes?: string;
    coverLetter?: string;
}

// Report interface
export interface IReport extends Document {
    internshipId?: Types.ObjectId;
    reporterId: Types.ObjectId;
    reportedUserId?: Types.ObjectId;
    reason: string;
    status: ReportStatus;
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId;
    adminNotes?: string;
}

// Notification interface
export interface INotification extends Document {
    userId: Types.ObjectId;
    type: string;
    title: string;
    message: string;
    payload?: Record<string, unknown>;
    read: boolean;
    createdAt: Date;
}

// Message status enum
export type MessageStatus = 'sent' | 'delivered' | 'seen';

// Message attachment interface
export interface IMessageAttachment {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

// Message interface
export interface IMessage extends Document {
    applicationId: Types.ObjectId;
    senderId: Types.ObjectId;
    receiverId: Types.ObjectId;
    content?: string;
    attachments: IMessageAttachment[];
    status: MessageStatus;
    createdAt: Date;
    updatedAt: Date;
    deliveredAt?: Date;
    seenAt?: Date;
}

// Extended Request with authenticated user
export interface AuthRequest extends Request {
    user?: IUser;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: unknown[];
}

// Pagination parameters
export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
}
