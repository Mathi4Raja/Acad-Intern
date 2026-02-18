'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    MapPin,
    Clock,
    IndianRupee,
    Calendar,
    Building,
    CheckCircle,
    Loader2,
    Lock
} from 'lucide-react'
import api from '@/lib/api'

interface InternshipDetail {
    _id: string
    title: string
    description: string
    companyId: {
        _id: string
        companyName: string
        verified: boolean
        logo?: string
    }
    skillsRequired: string[]
    durationWeeks: number
    stipend: number
    mode: 'remote' | 'onsite' | 'hybrid'
    openings: number
    createdAt: string
    deadline?: string
}

export default function PublicInternshipDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const [internship, setInternship] = useState<InternshipDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const viewIncrementedRef = useRef(false)

    useEffect(() => {
        if (id) {
            fetchInternship()
            // Increment views only once (prevent double count from React Strict Mode)
            if (!viewIncrementedRef.current) {
                viewIncrementedRef.current = true
                incrementViews()
            }
        }
    }, [id])

    const fetchInternship = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/internships/${id}`)
            if (response.data.success) {
                setInternship(response.data.data)
            }
        } catch (err: any) {
            console.error('Failed to fetch internship:', err)
            setError('Failed to load internship details')
        } finally {
            setLoading(false)
        }
    }

    const incrementViews = async () => {
        try {
            await api.patch(`/internships/${id}/views`)
        } catch (err) {
            console.error('Failed to increment views:', err)
        }
    }

    const handleLoginToApply = () => {
        router.push(`/login?redirect=/student/internships/${id}`)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
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
                    href="/internships"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 inline-block"
                >
                    Back to Internships
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-24 pb-10">
            {/* Back Button */}
            <Link
                href="/internships"
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
                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl font-bold border border-gray-100 uppercase text-primary">
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
                                    <p className="font-medium text-gray-900 leading-tight">{getModeLabel(internship.mode)}</p>
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
                                    <p className="font-medium text-gray-900 leading-tight blur-sm select-none">₹15,000/month</p>
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
                        <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {internship.description}
                        </div>
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
                            <p className="text-xs text-gray-500 mt-1">Login to apply for this opportunity.</p>
                        </div>

                        <button
                            onClick={handleLoginToApply}
                            className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold shadow-md hover:bg-primary/90 shadow-primary/20 transition-all text-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Lock size={16} />
                            Login to Apply
                        </button>

                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Deadline</span>
                                <span className="font-medium text-gray-900 blur-sm select-none">12/12/2026</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Openings</span>
                                <span className="font-medium text-gray-900 blur-sm select-none">5 Openings</span>
                            </div>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">About Company</h3>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-lg font-bold border border-gray-100 uppercase text-gray-600">
                                {internship.companyId.companyName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm leading-tight">{internship.companyId.companyName}</p>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-400 italic">
                            Login to view contact details
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
