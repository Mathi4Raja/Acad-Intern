import React, { memo } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Internship } from '@/types'
import InternshipCard from '@/components/internships/InternshipCard'

interface RecommendedWidgetProps {
    internships: Internship[]
    // These props are needed for InternshipCard
    isSaved: (id: string) => boolean
    onToggleSave: (id: string) => void
    formatStipend: (amount: number) => string
    formatDate: (date: string) => string
    getModeLabel: (mode: string) => string
}

import { CompanyLogo } from '@/components/common'

// ... existing imports

const RecommendedWidget = memo(({
    internships,
    isSaved, // Required prop now
    onToggleSave,
    formatStipend,
    formatDate,
    getModeLabel
}: RecommendedWidgetProps) => {
    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-yellow-500 w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="currentColor" />
                    Recommended for you
                </h2>
                <Link
                    href="/student/internships"
                    className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                    See All <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </Link>
            </div>

            {internships.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 text-center">
                    <p className="text-gray-500 text-xs sm:text-sm">Update your skills to get recommendations.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-6">
                    {internships.slice(0, 4).map(internship => (
                        <div key={internship._id} className="h-full">
                            <InternshipCard
                                internship={internship}
                                isSaved={isSaved(internship._id)}
                                onToggleSave={onToggleSave}
                                getCompanyIcon={(name) => <CompanyLogo name={name} size="sm" />}
                                formatStipend={formatStipend}
                                formatDate={formatDate}
                                getModeLabel={getModeLabel}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
})

RecommendedWidget.displayName = 'RecommendedWidget'

export default RecommendedWidget
