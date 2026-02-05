import React, { memo, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, MapPin, IndianRupee, Clock, Building2, MessageCircle } from 'lucide-react'
import { Application } from '@/types'
import { CompanyLogo, StatusBadge } from '@/components/common'

interface ApplicationCardProps {
    application: Application
    formatDate: (date: string) => string
    isHighlighted?: boolean
}

const ApplicationCard = memo(({ application, formatDate, isHighlighted = false }: ApplicationCardProps) => {
    // Timeline steps logic
    const timelineSteps = useMemo(() => {
        const s = application.status;
        const assessmentDone = s === 'assessment_completed' || s === 'accepted';
        const accepted = s === 'accepted';

        return [
            { id: 'applied', label: 'Applied', status: 'completed' },
            { id: 'review', label: 'In Review', status: s === 'pending' ? 'current' : 'completed' },
            { id: 'shortlisted', label: 'Shortlisted', status: s === 'shortlisted' ? 'current' : (assessmentDone || accepted) ? 'completed' : 'pending' },
            { id: 'assessment', label: 'Assessment', status: s === 'assessment_completed' ? 'current' : accepted ? 'completed' : 'pending' },
            { id: 'offer', label: 'Offer', status: accepted ? 'completed' : 'pending' }
        ];
    }, [application.status])

    // Explicitly handle rejected state for timeline
    const isRejected = application.status === 'rejected'

    return (
        <div
            id={`application-${application.id}`}
            className={`
                bg-white rounded-2xl border shadow-sm p-4 sm:p-5 
                transition-all duration-300 group
                ${isHighlighted
                    ? 'border-primary ring-2 ring-primary ring-offset-2 shadow-lg bg-blue-50/30'
                    : 'border-gray-100 hover:shadow-lg hover:border-primary/50 hover:bg-blue-50/10 hover:-translate-y-1'
                }
            `}
        >
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                {/* Logo Section */}
                <div className="flex-shrink-0">
                    <CompanyLogo name={application.company} />
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
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

                    {/* Metadata Row (Compact) */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-400" />
                            {application.location}
                        </span>

                        <span className="text-gray-300 hidden sm:inline">|</span>

                        <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-gray-400" />
                            {application.duration}
                        </span>

                        <span className="text-gray-300 hidden sm:inline">|</span>

                        <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                            <IndianRupee size={14} className="text-green-600" />
                            {application.stipend}
                        </span>

                        <span className="text-gray-300 hidden sm:inline">|</span>

                        <span className="flex items-center gap-1.5 text-gray-400">
                            <Calendar size={14} />
                            {formatDate(application.appliedDate)}
                        </span>
                    </div>

                    {/* Timeline Tracking (Hidden for rejected) */}
                    {!isRejected && (
                        <div className="mb-3 px-1">
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
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-3 pt-2">
                        <Link
                            href={`/student/messages?applicationId=${application.id}`}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50 bg-white border border-gray-200 sm:border-transparent sm:bg-transparent"
                        >
                            <MessageCircle size={18} />
                            <span className="sm:hidden">Message</span>
                            <span className="hidden sm:inline">Message</span>
                        </Link>
                        <Link
                            href={`/student/internships/${application.internshipId}`}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline px-2"
                        >
                            View Internship
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
})

ApplicationCard.displayName = 'ApplicationCard'

export default ApplicationCard
