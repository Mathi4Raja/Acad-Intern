import React, { memo } from 'react'
import { MapPin, Clock, IndianRupee, TrendingUp, ExternalLink, Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Internship } from '@/types'
import { useState } from 'react'
import api from '@/lib/api'
import { Loader2, CheckCircle } from 'lucide-react'
import { useAlert } from '@/components/ui/AlertProvider'

interface InternshipCardProps {
    internship: Internship
    isSaved: boolean
    onToggleSave: (id: string) => void
    getCompanyIcon: (name: string) => React.ReactNode
    formatStipend: (amount: number) => string
    formatDate: (date: string) => string
    getModeLabel: (mode: string) => string
}

const InternshipCard = memo(({
    internship,
    isSaved,
    onToggleSave,
    getCompanyIcon,
    formatStipend,
    formatDate,
    getModeLabel
}: InternshipCardProps) => {
    const { showAlert } = useAlert()
    const [applying, setApplying] = useState(false)
    const [hasApplied, setHasApplied] = useState(internship.hasApplied || false)

    const handleApply = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation to details
        e.stopPropagation()

        try {
            setApplying(true)
            const response = await api.post(`/applications/internships/${internship._id}/apply`, { notes: '' })
            if (response.data.success) {
                setHasApplied(true)
                // Optional: Show a toast or notification
            }
        } catch (error: any) {
            console.error('Application failed:', error)
            const msg = error.response?.data?.message || 'Failed to submit application'
            showAlert(msg, 'error')
        } finally {
            setApplying(false)
        }
    }

    return (
        <div className="group relative bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
            {/* Background Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Smaller Logo */}
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center text-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
                            {getCompanyIcon(internship.companyId?.companyName || '')}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors truncate mb-0.5">
                                {internship.title}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <p className="text-xs font-medium text-gray-500 truncate">
                                    {internship.companyId?.companyName || 'Company'}
                                </p>
                                {/* Match Badge */}
                                {(internship.matchScore || 0) >= 70 && (
                                    <div className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-100 w-fit">
                                        <TrendingUp size={10} />
                                        {internship.matchScore}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Save Button aligned better */}
                    <button
                        onClick={() => onToggleSave(internship._id)}
                        className="p-1.5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all duration-200 -mt-1 -mr-1"
                        aria-label={isSaved ? "Unsave internship" : "Save internship"}
                    >
                        <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'text-red-500' : ''} />
                    </button>
                </div>

                {/* Key Details Row */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600 mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <span className="flex items-center gap-1.5 font-medium">
                        <MapPin size={14} className="text-gray-400" />
                        {getModeLabel(internship.mode)}
                    </span>
                    <div className="w-px h-4 bg-gray-300 self-center hidden sm:block" />
                    <span className="flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="text-gray-400" />
                        {internship.durationWeeks} weeks
                    </span>
                    <div className="w-px h-4 bg-gray-300 self-center hidden sm:block" />
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                        <IndianRupee size={14} className="text-green-600" />
                        {formatStipend(internship.stipend)}
                    </span>
                </div>

                {/* Description */}
                {/* <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {internship.description}
        </p> */}

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-auto">
                    {internship.skillsRequired.slice(0, 3).map((skill) => (
                        <span
                            key={skill}
                            className="bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium group-hover:border-primary/20 group-hover:text-primary transition-colors"
                        >
                            {skill}
                        </span>
                    ))}
                    {internship.skillsRequired.length > 3 && (
                        <span className="bg-gray-50 text-gray-500 px-2.5 py-1 rounded-md text-xs font-medium">
                            +{internship.skillsRequired.length - 3}
                        </span>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 font-medium">
                        {internship.updatedAt && new Date(internship.updatedAt).getTime() - new Date(internship.createdAt).getTime() > 60000
                            ? `Edited ${formatDate(internship.updatedAt)}`
                            : `Posted ${formatDate(internship.createdAt)}`
                        }
                    </span>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Link
                            href={`/student/internships/${internship._id}`}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            Details
                        </Link>
                        <button
                            onClick={handleApply}
                            disabled={applying || hasApplied}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 text-sm font-bold shadow-md hover:shadow-lg group/btn disabled:opacity-70 disabled:cursor-not-allowed ${hasApplied ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-900 hover:bg-primary'
                                }`}
                        >
                            {applying ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : hasApplied ? (
                                <>
                                    Applied
                                    <CheckCircle size={16} />
                                </>
                            ) : (
                                <>
                                    Apply
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
})

InternshipCard.displayName = 'InternshipCard'

export default InternshipCard
