import { useState, useEffect } from 'react'
import { X, User, MapPin, Linkedin, Github, FileText, Mail, GraduationCap, Award, BookOpen, ExternalLink, Calendar, Loader2 } from 'lucide-react'
import api from '@/lib/api'

interface StudentProfileModalProps {
    studentId: string | null
    isOpen: boolean
    onClose: () => void
}

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
}

export function StudentProfileModal({ studentId, isOpen, onClose }: StudentProfileModalProps) {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<StudentProfile | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && studentId) {
            fetchProfile()
        } else {
            setProfile(null)
        }
    }, [isOpen, studentId])

    const fetchProfile = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get(`/students/profile/${studentId}`)
            setProfile(res.data.data)
        } catch (err) {
            console.error('Failed to fetch profile:', err)
            setError('Failed to load profile details')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Student Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                            <p>Loading profile...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                            {error}
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center border-4 border-white shadow-sm flex-shrink-0">
                                    {profile.profilePicture ? (
                                        <img src={profile.profilePicture} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-primary" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{profile.name}</h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Mail size={16} />
                                            <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors">{profile.email}</a>
                                        </div>
                                        {profile.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={16} />
                                                {profile.location}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-sm">
                                        {profile.linkedIn && (
                                            <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5]/10 text-[#0077b5] rounded-full hover:bg-[#0077b5]/20 transition-colors font-medium">
                                                <Linkedin size={16} /> LinkedIn
                                            </a>
                                        )}
                                        {profile.github && (
                                            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-900 rounded-full hover:bg-gray-200 transition-colors font-medium">
                                                <Github size={16} /> GitHub
                                            </a>
                                        )}
                                        {profile.resumeUrl && (
                                            <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 transition-colors font-medium border border-orange-200">
                                                <FileText size={16} /> Resume
                                                <ExternalLink size={12} className="opacity-50" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Bio */}
                            {profile.bio && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">About</h4>
                                    <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                                </div>
                            )}

                            {/* Academic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                                        <GraduationCap className="text-primary" size={20} />
                                        Academic Details
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        {profile.department && <p><span className="font-medium text-gray-700">Department:</span> {profile.department}</p>}
                                        {profile.semester && <p><span className="font-medium text-gray-700">Semester:</span> {profile.semester}th</p>}
                                        {profile.cgpa && <p><span className="font-medium text-gray-700">CGPA:</span> {profile.cgpa} / 10</p>}
                                    </div>
                                </div>

                                {(profile.hoursRequired) && (
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                                            <Award className="text-blue-600" size={20} />
                                            Internship Requirements
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <p><span className="font-medium text-gray-700">Hours Required:</span> {profile.hoursRequired} hrs</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            {profile.skills && profile.skills.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <BookOpen size={16} />
                                        Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map((skill, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">Student profile not found</div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
