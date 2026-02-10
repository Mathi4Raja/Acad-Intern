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
    Users
} from 'lucide-react'
import api from '@/lib/api'
import { useAlert } from '@/components/ui/AlertProvider'

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
            await navigator.clipboard.writeText(window.location.href)
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
            <Link
                href="/student/internships"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-4 transition-colors text-sm"
            >
                <ArrowLeft size={18} />
                Back to Internships
            </Link>

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
                            <div className="hidden sm:block">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                                    {internship.companyId.companyName.charAt(0)}
                                </div>
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

                    {/* Skills */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                        <h2 className="text-base font-bold text-gray-900 mb-3">Skills required</h2>
                        <div className="flex flex-wrap gap-2">
                            {internship.skillsRequired.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200"
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
                            disabled={applying || hasApplied}
                            className={`w-full py-2.5 text-white rounded-xl font-semibold shadow-md transition-all text-sm flex items-center justify-center gap-2 active:scale-95 ${hasApplied
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                                : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                                } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {applying ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Applying...
                                </>
                            ) : hasApplied ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Applied
                                </>
                            ) : (
                                'Apply Now'
                            )}
                        </button>

                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Deadline</span>
                                <span className="font-medium text-gray-900">
                                    {internship.deadline ? formatDate(internship.deadline) : 'ASAP'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Openings</span>
                                <span className="font-medium text-gray-900">{internship.openings}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleShare}
                            className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-900 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95"
                        >
                            {copied ? (
                                <>
                                    <Check size={14} className="text-green-600" />
                                    <span className="text-green-600">Link Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 size={14} />
                                    Share this Internship
                                </>
                            )}
                        </button>
                    </div>

                    {/* Company Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">About Company</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600">
                                {internship.companyId.companyName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm leading-tight">{internship.companyId.companyName}</p>
                                {internship.companyId.website && (
                                    <a
                                        href={internship.companyId.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                        <Globe size={10} />
                                        Visit Website
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 mb-4 border-y border-gray-50 py-3">
                            {internship.companyId.industry && (
                                <div className="flex items-center gap-2 text-[11px]">
                                    <Briefcase size={12} className="text-gray-400" />
                                    <span className="text-gray-500 font-medium">Industry:</span>
                                    <span className="text-gray-900 font-semibold">{internship.companyId.industry}</span>
                                </div>
                            )}
                            {internship.companyId.companySize && (
                                <div className="flex items-center gap-2 text-[11px]">
                                    <Users size={12} className="text-gray-400" />
                                    <span className="text-gray-500 font-medium">Size:</span>
                                    <span className="text-gray-900 font-semibold">{internship.companyId.companySize} employees</span>
                                </div>
                            )}
                            {internship.companyId.location && (
                                <div className="flex items-center gap-2 text-[11px]">
                                    <MapPin size={12} className="text-gray-400" />
                                    <span className="text-gray-500 font-medium">Headquarters:</span>
                                    <span className="text-gray-900 font-semibold">{internship.companyId.location}</span>
                                </div>
                            )}
                        </div>

                        {internship.companyId.description && (
                            <p className="text-xs text-gray-500 line-clamp-4 leading-relaxed">
                                {internship.companyId.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
