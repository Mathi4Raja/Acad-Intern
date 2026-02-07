'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Briefcase, Mail, Calendar, CheckCircle, XCircle, Loader2, MessageSquare, Clock, Star, FileText, ExternalLink, Building } from 'lucide-react'
import api from '@/lib/api'
import { useAlert } from '@/components/ui/AlertProvider'

interface Application {
    _id: string
    studentId: {
        _id: string
        name: string
        email: string
        skills?: string[]
    }
    internshipId: {
        _id: string
        title: string
        mode: string
        stipend: number
        durationWeeks: number
        location?: string
        companyId: {
            _id: string
            companyName: string
        }
    }
    status: string
    appliedAt: string
    notes?: string
}

export default function ApplicationDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { showAlert } = useAlert()
    const applicationId = params.id as string

    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [application, setApplication] = useState<Application | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (applicationId) {
            fetchApplication()
        }
    }, [applicationId])

    const fetchApplication = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get(`/applications/${applicationId}`)
            setApplication(res.data.data)
        } catch (err) {
            console.error('Failed to fetch application:', err)
            setError('Failed to load application details')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (status: string) => {
        try {
            setActionLoading(true)
            await api.patch(`/applications/${applicationId}/status`, { status })
            setApplication(prev => prev ? { ...prev, status } : null)
            showAlert(`Application ${status}!`, 'success')
        } catch (err) {
            console.error('Failed to update status:', err)
            showAlert('Failed to update application status', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'shortlisted': return 'bg-green-100 text-green-700 border-green-200'
            case 'assessment_completed': return 'bg-purple-100 text-purple-700 border-purple-200'
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

    if (error || !application) {
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
                    {error || 'Application not found'}
                </div>
            </div>
        )
    }

    const { studentId: student, internshipId: internship } = application

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

            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-secondary/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 mb-1">Application Details</h1>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Calendar size={14} />
                                Applied on {new Date(application.appliedAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase border ${getStatusColor(application.status)}`}>
                            {application.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Student Section */}
                    <div className="bg-gray-50 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={16} />
                            Applicant
                        </h3>
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <User size={24} className="text-primary" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900">{student.name}</h4>
                                <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-3">
                                    <Mail size={14} />
                                    <a href={`mailto:${student.email}`} className="hover:text-primary transition-colors">
                                        {student.email}
                                    </a>
                                </p>

                                {student.skills && student.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {student.skills.slice(0, 5).map((skill, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-white text-gray-600 rounded text-xs font-medium border border-gray-200">
                                                {skill}
                                            </span>
                                        ))}
                                        {student.skills.length > 5 && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                                +{student.skills.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => router.push(`/company/student/${student._id}`)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                <ExternalLink size={14} />
                                View Profile
                            </button>
                        </div>
                    </div>

                    {/* Internship Section */}
                    <div className="bg-blue-50/50 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Briefcase size={16} />
                            Position Applied For
                        </h3>
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Briefcase size={24} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900">{internship.title}</h4>
                                <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-2">
                                    <Building size={14} />
                                    {internship.companyId?.companyName || 'Your Company'}
                                </p>
                                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                    <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-100">
                                        <Clock size={12} />
                                        {internship.durationWeeks} weeks
                                    </span>
                                    <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-100">
                                        ₹{internship.stipend}/month
                                    </span>
                                    <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-100">
                                        {internship.mode}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {application.notes && (
                        <div className="bg-gray-50 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText size={16} />
                                Application Note
                            </h3>
                            <p className="text-gray-700 leading-relaxed">{application.notes}</p>
                        </div>
                    )}

                    {/* Actions Section */}
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            {application.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleUpdateStatus('shortlisted')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
                                    >
                                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        Shortlist
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus('rejected')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
                                    >
                                        <XCircle size={16} />
                                        Reject
                                    </button>
                                </>
                            )}
                            {application.status === 'shortlisted' && (
                                <button
                                    onClick={() => handleUpdateStatus('assessment_completed')}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
                                >
                                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    Mark Assessment Done
                                </button>
                            )}
                            {application.status === 'assessment_completed' && (
                                <button
                                    onClick={() => handleUpdateStatus('accepted')}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
                                >
                                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                    Accept
                                </button>
                            )}

                            <button
                                onClick={() => router.push(`/company/messages?applicationId=${applicationId}`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                <MessageSquare size={16} />
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
