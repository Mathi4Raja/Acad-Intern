export type UserRole = 'student' | 'company' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface StudentProfile {
    _id?: string
    userId: string;
    department?: string;
    semester?: number;
    skills: string[];
    cgpa?: number;
    hoursRequired?: number;
    bio?: string;
    resumeUrl?: string;
    linkedIn?: string;
    github?: string;
}

export interface CompanyProfile {
    userId: string;
    companyName: string;
    website?: string;
    description?: string;
    logoUrl?: string;
}

export interface Company {
    _id: string
    companyName: string
    logoUrl?: string
    userId?: string
}

export interface Internship {
    _id: string
    title: string
    description: string
    companyId: Company
    skillsRequired: string[]
    durationWeeks: number
    stipend: number
    mode: 'remote' | 'onsite' | 'hybrid'
    openings: number
    status: 'active' | 'inactive' | 'completed' | 'in_progress' | 'rejected'
    createdAt: string
    updatedAt?: string
    matchScore?: number
    location?: string
    hasApplied?: boolean
}

export type ApplicationStatus = 'pending' | 'shortlisted' | 'interview_scheduled' | 'assessment_completed' | 'accepted' | 'rejected' | 'expired';

export interface Application {
    id: string
    internshipId: string
    internshipTitle: string
    company: string
    companyUserId: string
    logo: string
    status: ApplicationStatus
    appliedDate: string
    lastUpdate: string
    location: string
    stipend: string
    duration: string
    notes: string | null
    interviewDetails?: {
        date: string;
        time: string;
        meetingLink: string;
    }
}

// Message types
export type MessageStatus = 'sent' | 'delivered' | 'seen';

export interface MessageAttachment {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

export interface Message {
    _id: string;
    applicationId: string;
    senderId: {
        _id: string;
        name: string;
        email: string;
        role: UserRole;
    };
    receiverId: string;
    content?: string;
    attachments: MessageAttachment[];
    status: MessageStatus;
    createdAt: string;
    updatedAt: string;
    deliveredAt?: string;
    seenAt?: string;
}

export interface Conversation {
    application: {
        _id: string;
        internshipId: {
            _id: string;
            title: string;
            companyId: {
                _id: string;
                companyName: string;
                logo?: string;
                userId: {
                    _id: string;
                    name: string;
                    email: string;
                };
            };
        };
        studentId: {
            _id: string;
            name: string;
            email: string;
        };
        status: ApplicationStatus;
        appliedAt: string;
    };
    lastMessage?: Message;
    unreadCount: number;
}

