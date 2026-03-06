'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    MapPin,
    Clock,
    IndianRupee,
    Calendar,
    Globe,
    Share2,
    Building,
    CheckCircle,
    Loader2,
    Check,
    Briefcase,
    Users,
    Flag
} from 'lucide-react'
import api from '@/lib/api'
import { useAlert } from '@/components/ui/AlertProvider'
import { ReportModal } from '@/components/common/ReportModal'

interface InternshipDetail {
    _id: string
    title: string
    description: string
    companyId: {
        _id: string
        userId: string
        companyName: string
        website?: string
        description?: string
        verified: boolean
        industry?: string
        companySize?: string
        location?: string
        logo?: string
    }
    skillsRequired: string[]
    durationWeeks: number
    stipend: number
    mode: 'remote' | 'onsite' | 'hybrid'
    openings: number
    status: 'active' | 'inactive' | 'completed' | 'in_progress' | 'rejected'
    createdAt: string
    location?: string
    deadline?: string
    hasApplied?: boolean
    requirements?: string
    responsibilities?: string
}

export default function InternshipDetailPage() {
    const { id } = useParams()
    const { showAlert } = useAlert()
    const [internship, setInternship] = useState<InternshipDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const viewIncrementedRef = useRef(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)

    useEffect(() => {
        if (id) {
            fetchInternship()
        }
    }, [id])

    const fetchInternship = async () => {
        try {
            setLoading(true)
            // Increment views only once (prevent double count from React Strict Mode)
            if (!viewIncrementedRef.current) {
                viewIncrementedRef.current = true
                api.patch(`/internships/${id}/views`).catch(err => console.error('Failed to increment views:', err))
            }

            const response = await api.get(`/internships/${id}`)
            if (response.data.success) {
                const data = response.data.data
                setInternship(data)
                // Initialize hasApplied from the API response
                if (data.hasApplied) {
                    setHasApplied(true)
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch internship:', err)
            setError('Failed to load internship details')
        } finally {
            setLoading(false)
        }
    }

    const [applying, setApplying] = useState(false)
    const [hasApplied, setHasApplied] = useState(false)

    const handleApply = async () => {
        try {
            setApplying(true)
            const response = await api.post(`/applications/internships/${id}/apply`, { notes: '' })
            if (response.data.success) {
                setHasApplied(true)
                showAlert('Application submitted successfully!', 'success')
            }
        } catch (error: any) {
            console.error('Application failed:', error)
            const msg = error.response?.data?.message || 'Failed to submit application'
            showAlert(msg, 'error')
        } finally {
            setApplying(false)
        }
    }

    const formatStipend = (stipend: number) => {
        if (stipend >= 1000) {
            return `₹${(stipend / 1000).toFixed(0)}K/month`
        }
        return `₹${stipend}/month`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        try {
            const publicUrl = `${window.location.origin}/internships/${id}`
            await navigator.clipboard.writeText(publicUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const getModeLabel = (mode: string) => {
        const labels: Record<string, string> = {
            remote: 'Remote',
            onsite: 'On-site',
            hybrid: 'Hybrid'
        }
        return labels[mode] || mode
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !internship) {
        return (
            <div className="text-center py-16">
                <p className="text-red-500 mb-4">{error || 'Internship not found'}</p>
                <Link
                    href="/student/internships"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 inline-block"
                >
                    Back to Internships
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-10">
            {/* Back Button */}
            <div className="mb-6">
                <Link
                    href="/student/internships"
                    className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-100 text-gray-600 rounded-xl text-sm font-bold shadow-sm hover:border-primary/20 hover:text-primary hover:shadow-md transition-all group"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    Back to Internships
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                                    {internship.title}
                                </h1>
                                <div className="flex items-center gap-2 text-gray-600 font-medium text-xs sm:text-sm">
                                    <Building size={14} />
                                    {internship.companyId.companyName}
                                    {internship.companyId.verified && (
                                        <CheckCircle size={14} className="text-blue-500" />
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="hidden sm:block">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl font-bold border border-gray-100 overflow-hidden shadow-sm">
                                        {internship.companyId.logo ? (
                                            <img
                                                src={internship.companyId.logo}
                                                alt={internship.companyId.companyName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-primary">{internship.companyId.companyName.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95 border border-gray-100"
                                    title="Report Internship"
                                >
                                    <Flag size={12} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs sm:text-sm text-gray-600 border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-blue-50 text-blue-600 rounded-lg">
                                    <MapPin size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Location</p>
                                    <p className="font-medium text-gray-900 leading-tight">
                                        {getModeLabel(internship.mode)}
                                        {internship.mode !== 'remote' && internship.location && (
                                            <span className="text-gray-500 font-normal ml-1">({internship.location})</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-green-50 text-green-600 rounded-lg">
                                    <Clock size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Duration</p>
                                    <p className="font-medium text-gray-900 leading-tight">{internship.durationWeeks} Weeks</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-purple-50 text-purple-600 rounded-lg">
                                    <IndianRupee size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Stipend</p>
                                    <p className="font-medium text-gray-900 leading-tight">{formatStipend(internship.stipend)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-orange-50 text-orange-600 rounded-lg">
                                    <Calendar size={14} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Posted on</p>
                                    <p className="font-medium text-gray-900 leading-tight">{formatDate(internship.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="text-base font-bold text-gray-900 mb-2">About the internship</h2>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed mb-6">
                            {internship.description}
                        </div>

                        {internship.responsibilities && (
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Responsibilities</h3>
                                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                    {internship.responsibilities}
                                </div>
                            </div>
                        )}

                        {internship.requirements && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Requirements</h3>
                                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                    {internship.requirements}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="text-base font-bold text-gray-900 mb-3">Skills required</h2>
                        <div className="flex flex-wrap gap-2 items-start">
                            {internship.skillsRequired.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1.5 bg-blue-50 text-primary rounded-full text-[11px] font-bold border border-primary/10 transition-all hover:bg-blue-100/50"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Action Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
                        <div className="mb-4">
                            <h3 className="text-base font-bold text-gray-900">Interested?</h3>
                            <p className="text-xs text-gray-500 mt-1">Don't miss out on this opportunity.</p>
                        </div>

                        <button
                            onClick={handleApply}
                            disabled={applying || hasApplied || internship.status !== 'active'}
                            className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all mb-3 flex items-center justify-center gap-2 ${hasApplied
                                ? 'bg-emerald-500 text-white cursor-default'
                                : internship.status !== 'active'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/20'
                                }`}
                        >
                            {applying ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : hasApplied ? (
                                <Check size={16} />
                            ) : null}
                            {hasApplied ? 'Applied' : internship.status !== 'active' ? 'Internship Closed' : 'Apply Now'}
                        </button>

                        <button
                            onClick={handleShare}
                            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 border border-gray-100"
                        >
                            {copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                            {copied ? 'Link copied!' : 'Share this Internship'}
                        </button>

                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Deadline</span>
                                <span className="text-gray-900 font-bold">
                                    {internship.deadline ? formatDate(internship.deadline) : 'Not specified'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Openings</span>
                                <span className="text-gray-900 font-bold">{internship.openings}</span>
                            </div>
                        </div>
                    </div>

                    {/* Company Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <h2 className="text-sm font-bold text-gray-900 mb-3">About Company</h2>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-lg font-bold border border-gray-100 overflow-hidden">
                                {internship.companyId.logo ? (
                                    <img
                                        src={internship.companyId.logo}
                                        alt={internship.companyId.companyName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-primary">{internship.companyId.companyName.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">{internship.companyId.companyName}</h3>
                                {internship.companyId.website && (
                                    <a
                                        href={internship.companyId.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                                    >
                                        Visit Website <Globe size={10} />
                                    </a>
                                )}
                            </div>
                        </div>
                        {internship.companyId.industry && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Briefcase size={14} className="text-gray-400" />
                                    <span>{internship.companyId.industry}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Users size={14} className="text-gray-400" />
                                    <span>{internship.companyId.companySize || 'Unknown size'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <MapPin size={14} className="text-gray-400" />
                                    <span>{internship.companyId.location || 'Remote'}</span>
                                </div>
                            </div>
                        )}
                        {internship.companyId.description && (
                            <p className="mt-4 text-[11px] text-gray-500 leading-relaxed line-clamp-3">
                                {internship.companyId.description}
                            </p>
                        )}
                    </div>
                </div>
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    internshipId={internship._id}
                    reportedUserId={internship.companyId.userId}
                    subjectPrefix={`Report Internship: ${internship.title}`}
                    contextSnapshot={{
                        internshipTitle: internship.title,
                        companyName: internship.companyId.companyName,
                        location: internship.location
                    }}
                />
            </div>
            <StyleTag />
        </div>
    )
}

const styles = `
@keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
.animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 15s ease infinite;
}
`

function StyleTag() {
    return <style dangerouslySetInnerHTML={{ __html: styles }} />
}
