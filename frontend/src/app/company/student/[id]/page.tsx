'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, MapPin, Linkedin, Github, FileText, Mail, GraduationCap, Award, BookOpen, ExternalLink, Loader2, Briefcase, Calendar, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

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
                    <div className="mb-6">
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
                                    <span className="text-gray-400">📞</span>
                                    {profile.phone}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {profile.linkedIn && (
                            <a
                                href={profile.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0077b5]/10 text-[#0077b5] rounded-lg hover:bg-[#0077b5]/20 transition-colors font-medium text-sm"
                            >
                                <Linkedin size={16} /> LinkedIn
                                <ExternalLink size={12} className="opacity-50" />
                            </a>
                        )}
                        {profile.github && (
                            <a
                                href={profile.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                            >
                                <Github size={16} /> GitHub
                                <ExternalLink size={12} className="opacity-50" />
                            </a>
                        )}
                        {profile.resumeUrl && (
                            <a
                                href={profile.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium border border-orange-200 text-sm"
                            >
                                <FileText size={16} /> View Resume
                                <ExternalLink size={12} className="opacity-50" />
                            </a>
                        )}
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h3>
                            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                        </div>
                    )}

                    {/* Academic & Requirements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
                                <GraduationCap className="text-primary" size={20} />
                                Academic Details
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                {profile.department && (
                                    <p><span className="font-medium text-gray-700">Department:</span> {profile.department}</p>
                                )}
                                {profile.semester && (
                                    <p><span className="font-medium text-gray-700">Semester:</span> {profile.semester}th</p>
                                )}
                                {profile.cgpa && (
                                    <p><span className="font-medium text-gray-700">CGPA:</span> {profile.cgpa} / 10</p>
                                )}
                                {!profile.department && !profile.semester && !profile.cgpa && (
                                    <p className="text-gray-400 italic">No academic details provided</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
                                <Award className="text-blue-600" size={20} />
                                Internship Requirements
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                {profile.hoursRequired ? (
                                    <p><span className="font-medium text-gray-700">Hours Required:</span> {profile.hoursRequired} hours</p>
                                ) : (
                                    <p className="text-gray-400 italic">No requirements specified</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <BookOpen size={16} />
                                Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Applications History (if available) */}
                    {applications.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Briefcase size={16} />
                                Application History
                            </h3>
                            <div className="space-y-2">
                                {applications.map((app) => (
                                    <div
                                        key={app._id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{app.internshipId?.title || 'Unknown Position'}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(app.appliedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase border ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
