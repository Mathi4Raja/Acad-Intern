'use client'

import { useState, useEffect } from 'react'
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
    Loader2
} from 'lucide-react'
import api from '@/lib/api'

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
    }
    skillsRequired: string[]
    durationWeeks: number
    stipend: number
    mode: 'remote' | 'onsite' | 'hybrid'
    openings: number
    isActive: boolean
    createdAt: string
    location?: string
    deadline?: string
}

export default function InternshipDetailPage() {
    const { id } = useParams()
    const [internship, setInternship] = useState<InternshipDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            fetchInternship()
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

    const handleApply = () => {
        // TODO: Implement application logic
        alert('Application feature coming soon!')
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
        <div className="max-w-5xl mx-auto pb-10">
            {/* Back Button */}
            <Link
                href="/student/internships"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Internships
            </Link>

            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                    {internship.title}
                                </h1>
                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                    <Building size={18} />
                                    {internship.companyId.companyName}
                                    {internship.companyId.verified && (
                                        <CheckCircle size={16} className="text-blue-500" />
                                    )}
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
                                    {internship.companyId.companyName.charAt(0)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-gray-600 border-t border-gray-100 pt-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Location</p>
                                    <p className="font-medium text-gray-900">{getModeLabel(internship.mode)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Duration</p>
                                    <p className="font-medium text-gray-900">{internship.durationWeeks} Weeks</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <IndianRupee size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Stipend</p>
                                    <p className="font-medium text-gray-900">{formatStipend(internship.stipend)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Posted on</p>
                                    <p className="font-medium text-gray-900">{formatDate(internship.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">About the internship</h2>
                        <div className="prose prose-sm sm:prose-base text-gray-600 max-w-none whitespace-pre-wrap">
                            {internship.description}
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Skills required</h2>
                        <div className="flex flex-wrap gap-2">
                            {internship.skillsRequired.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Action Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Interested?</h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleApply}
                                className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 font-semibold shadow-lg shadow-primary/25 transition-all text-sm sm:text-base"
                            >
                                Apply Now
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                <span>Application Deadline</span>
                                <span className="font-medium text-gray-900">
                                    {internship.deadline ? formatDate(internship.deadline) : 'ASAP'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Number of Openings</span>
                                <span className="font-medium text-gray-900">{internship.openings}</span>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-2 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <Share2 size={16} />
                            Share this Internship
                        </button>
                    </div>

                    {/* Company Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">About Company</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                                {internship.companyId.companyName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{internship.companyId.companyName}</p>
                                {internship.companyId.website && (
                                    <a
                                        href={internship.companyId.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Globe size={12} />
                                        Visit Website
                                    </a>
                                )}
                            </div>
                        </div>
                        {internship.companyId.description && (
                            <p className="text-sm text-gray-600 line-clamp-4">
                                {internship.companyId.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
