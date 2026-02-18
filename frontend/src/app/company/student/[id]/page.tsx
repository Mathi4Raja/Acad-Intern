'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, MapPin, Linkedin, Github, FileText, Mail, GraduationCap, BookOpen, ExternalLink, Loader2, Briefcase, Calendar, CheckCircle, Flag } from 'lucide-react'
import api from '@/lib/api'
import { ReportModal } from '@/components/common/ReportModal'

interface StudentProfile {
    _id: string
    userId: string
    name: string
    email: string
    department?: string
    semester?: number
    skills: string[]
    cgpa?: number
    hoursRequired?: number
    bio?: string
    resumeUrl?: string
    linkedIn?: string
    github?: string
    location?: string
    profilePicture?: string
    phone?: string
}

interface Application {
    _id: string
    internshipId: {
        _id: string
        title: string
        companyId: {
            companyName: string
        }
    }
    status: string
    appliedAt: string
}

export default function StudentProfilePage() {
    const params = useParams()
    const router = useRouter()
    const studentId = params.id as string

    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<StudentProfile | null>(null)
    const [applications, setApplications] = useState<Application[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)

    useEffect(() => {
        if (studentId) {
            fetchProfile()
        }
    }, [studentId])

    const fetchProfile = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get(`/students/profile/${studentId}`)
            setProfile(res.data.data)

            // Fetch applications for this student (if available)
            try {
                const appsRes = await api.get(`/students/${studentId}/applications`)
                setApplications(appsRes.data.data || [])
            } catch {
                // Applications endpoint may not exist or student has no applications
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err)
            setError('Failed to load profile details')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'shortlisted': return 'bg-green-100 text-green-700 border-green-200'
            case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Go Back</span>
                </button>
                <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
                    {error || 'Student profile not found'}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Go Back</span>
            </button>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with gradient */}
                <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20" />

                {/* Profile Content */}
                <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="-mt-12 mb-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            {profile.profilePicture ? (
                                <img src={profile.profilePicture} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User size={40} className="text-primary" />
                            )}
                        </div>
                    </div>

                    {/* Name and Basic Info */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pt-2">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                    <Mail size={16} className="text-gray-400" />
                                    <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors">
                                        {profile.email}
                                    </a>
                                </div>
                                {profile.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={16} className="text-gray-400" />
                                        {profile.location}
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-400 group-hover:scale-110 transition-transform">📞</span>
                                        {profile.phone}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95 border border-gray-100"
                                title="Report Student"
                            >
                                <Flag size={18} />
                            </button>
                            {profile.linkedIn && (
                                <a
                                    href={profile.linkedIn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-[#0077b5]/10 text-[#0077b5] rounded-lg hover:bg-[#0077b5]/20 transition-all border border-[#0077b5]/20"
                                    title="LinkedIn Profile"
                                >
                                    <Linkedin size={18} />
                                </a>
                            )}
                            {profile.github && (
                                <a
                                    href={profile.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all border border-gray-200"
                                    title="GitHub Profile"
                                >
                                    <Github size={18} />
                                </a>
                            )}
                            {profile.resumeUrl && (
                                <a
                                    href={profile.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-all border border-orange-200 text-sm font-bold"
                                >
                                    <FileText size={16} /> View Resume
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Content Column */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Bio */}
                            {profile.bio && (
                                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileText size={14} />
                                        About
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed text-sm">{profile.bio}</p>
                                </div>
                            )}

                            {/* Skills */}
                            {profile.skills && profile.skills.length > 0 && (
                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <BookOpen size={14} />
                                        Technical Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.skills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 bg-primary/[0.03] text-primary rounded-md text-xs font-bold border border-primary/10 hover:bg-primary/[0.08] transition-colors"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Column */}
                        <div className="space-y-4">
                            {/* Academic Details - Card Version */}
                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <GraduationCap size={14} className="text-primary" />
                                    Education
                                </h3>
                                <div className="space-y-3">
                                    {profile.department && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Department</span>
                                            <span className="text-sm font-bold text-gray-800 leading-tight">{profile.department}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                                        {profile.semester && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Semester</span>
                                                <span className="text-sm font-bold text-gray-800">{profile.semester}th</span>
                                            </div>
                                        )}
                                        {profile.cgpa && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">CGPA</span>
                                                <span className="text-sm font-bold text-primary">{profile.cgpa} / 10</span>
                                            </div>
                                        )}
                                    </div>
                                    {!profile.department && !profile.semester && !profile.cgpa && (
                                        <p className="text-xs text-gray-400 italic">No details provided</p>
                                    )}
                                </div>
                            </div>

                            {/* Application History */}
                            {applications.length > 0 && (
                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Briefcase size={14} className="text-secondary" />
                                        Activity
                                    </h3>
                                    <div className="space-y-2">
                                        {applications.slice(0, 3).map((app) => (
                                            <div
                                                key={app._id}
                                                className="p-2 bg-gray-50/50 rounded-lg border border-gray-100 group hover:border-primary/20 transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-xs font-bold text-gray-900 truncate leading-tight group-hover:text-primary transition-colors">
                                                        {app.internshipId?.title || 'Unknown Position'}
                                                    </p>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase border shrink-0 ${getStatusColor(app.status)}`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                                    <Calendar size={10} />
                                                    {new Date(app.appliedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportedUserId={profile.userId}
                subjectPrefix={`Report Student: ${profile.name}`}
                contextSnapshot={{
                    studentName: profile.name,
                    department: profile.department,
                    email: profile.email
                }}
            />
        </div>
    )
}
