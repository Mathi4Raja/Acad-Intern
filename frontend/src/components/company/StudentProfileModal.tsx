import { useState, useEffect } from 'react'
import { X, User, MapPin, Linkedin, Github, FileText, Mail, GraduationCap, Award, BookOpen, ExternalLink, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { StudentAvatar } from '../common'

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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-xl my-auto">
                {/* Header */}
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 flex-shrink-0">
                    <h2 className="text-base font-bold text-gray-900">Student Profile</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                            <p className="text-sm">Loading profile...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-sm">
                            {error}
                        </div>
                    ) : profile ? (
                        <div className="space-y-3">
                            {/* Profile Header */}
                            <div className="flex gap-3 items-start">
                                <StudentAvatar
                                    name={profile.name}
                                    logoUrl={profile.profilePicture}
                                    size="lg"
                                />

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 truncate">{profile.name}</h3>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                                        <div className="flex items-center gap-1 min-w-0">
                                            <Mail size={12} className="flex-shrink-0" />
                                            <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors truncate">
                                                {profile.email}
                                            </a>
                                        </div>
                                        {profile.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} className="flex-shrink-0" />
                                                <span>{profile.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="flex flex-wrap gap-1.5">
                                {profile.linkedIn && (
                                    <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-[#0077b5]/10 text-[#0077b5] rounded-full hover:bg-[#0077b5]/20 transition-colors font-medium text-xs">
                                        <Linkedin size={12} /> LinkedIn
                                    </a>
                                )}
                                {profile.github && (
                                    <a href={profile.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-900 rounded-full hover:bg-gray-200 transition-colors font-medium text-xs">
                                        <Github size={12} /> GitHub
                                    </a>
                                )}
                                {profile.resumeUrl && (
                                    <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 transition-colors font-medium border border-orange-200 text-xs">
                                        <FileText size={12} /> Resume
                                        <ExternalLink size={10} className="opacity-50" />
                                    </a>
                                )}
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <div className="pt-2 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">About</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">{profile.bio}</p>
                                </div>
                            )}

                            {/* Academic Info */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 rounded-lg p-2.5">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-gray-900 font-semibold text-xs">
                                        <GraduationCap className="text-primary" size={14} />
                                        Academic Details
                                    </div>
                                    <div className="space-y-0.5 text-xs text-gray-600">
                                        {profile.department && <p><span className="font-medium">Dept:</span> {profile.department}</p>}
                                        {profile.semester && <p><span className="font-medium">Sem:</span> {profile.semester}th</p>}
                                        {profile.cgpa && <p><span className="font-medium">CGPA:</span> {profile.cgpa}</p>}
                                    </div>
                                </div>

                                {(profile.hoursRequired) && (
                                    <div className="bg-blue-50 rounded-lg p-2.5">
                                        <div className="flex items-center gap-1.5 mb-1.5 text-gray-900 font-semibold text-xs">
                                            <Award className="text-blue-600" size={14} />
                                            Requirements
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            <p><span className="font-medium">Hours:</span> {profile.hoursRequired}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Skills */}
                            {profile.skills && profile.skills.length > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <BookOpen size={12} />
                                        Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {profile.skills.map((skill, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">Student profile not found</div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
