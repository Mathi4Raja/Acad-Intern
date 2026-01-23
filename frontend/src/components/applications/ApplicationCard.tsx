import React, { memo, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, IndianRupee, Clock, ArrowRight, Building2 } from 'lucide-react'
import { Application } from '@/types'
import { CompanyLogo, StatusBadge } from '@/components/common'

interface ApplicationCardProps {
    application: Application
    formatDate: (date: string) => string
}

const ApplicationCard = memo(({ application, formatDate }: ApplicationCardProps) => {
    // Timeline steps logic
    const timelineSteps = useMemo(() => [
        { id: 'applied', label: 'Applied', status: 'completed' },
        { id: 'review', label: 'In Review', status: application.status === 'pending' ? 'current' : 'completed' },
        { id: 'interview', label: 'Shortlisted', status: application.status === 'shortlisted' ? 'current' : application.status === 'accepted' ? 'completed' : 'pending' },
        { id: 'offer', label: 'Offer', status: application.status === 'accepted' ? 'completed' : 'pending' }
    ], [application.status])

    // Explicitly handle rejected state for timeline
    const isRejected = application.status === 'rejected'

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Logo Section */}
                <div className="flex-shrink-0">
                    <CompanyLogo name={application.company} />
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-primary transition-colors">
                                {application.internshipTitle}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <Building2 size={14} />
                                {application.company}
                            </p>
                        </div>
                        <StatusBadge status={application.status} className="self-start" />
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm text-gray-600 mb-5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-400" />
                            {application.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" />
                            {application.duration}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-gray-900 col-span-2 sm:col-span-1">
                            <IndianRupee size={14} className="text-green-600" />
                            {application.stipend}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-400">
                            <Calendar size={14} />
                            {formatDate(application.appliedDate)}
                        </span>
                    </div>

                    {/* Timeline Tracking (Hidden for rejected) */}
                    {!isRejected && (
                        <div className="mb-5 px-1">
                            <div className="flex items-center justify-between relative">
                                {/* Connecting Line */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 -z-10" />

                                {timelineSteps.map((step, index) => (
                                    <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-1">
                                        <div className={`
                      w-3 h-3 rounded-full border-2 
                      ${step.status === 'completed' || step.status === 'current'
                                                ? 'bg-primary border-primary'
                                                : 'bg-white border-gray-300'}
                      ${step.status === 'current' ? 'ring-4 ring-primary/10' : ''}
                      transition-all duration-300
                    `} />
                                        <span className={`text-[10px] font-medium ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Note / Feedback */}
                    {application.notes && (
                        <div className="mb-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800">
                            <span className="font-semibold block text-xs uppercase tracking-wide opacity-70 mb-1">Note from Company</span>
                            {/* Security: Render as regular text */}
                            {application.notes}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link
                            href={`/student/internships/${application.internshipId}`}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline px-2"
                        >
                            View Internship
                        </Link>
                        {application.status === 'shortlisted' && (
                            <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-transform active:scale-95 shadow-sm">
                                Complete Assessment <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
})

ApplicationCard.displayName = 'ApplicationCard'

export default ApplicationCard
