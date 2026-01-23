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
    isActive: boolean
    createdAt: string
    matchScore?: number
    location?: string
}

export type ApplicationStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected';

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
}
