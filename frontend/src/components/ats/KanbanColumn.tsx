'use client'

import { cn } from '@/lib/utils'
import { ApplicationCard } from './ApplicationCard'
import type { Applicant } from './ApplicationCard'

interface KanbanColumnProps {
    title: string
    status: Applicant['status']
    applicants: Applicant[]
    onApplicantClick?: (applicant: Applicant) => void
    color: string
    className?: string
}

export function KanbanColumn({ title, status, applicants, onApplicantClick, color, className }: KanbanColumnProps) {
    return (
        <div className={cn('flex flex-col min-w-[280px] max-w-[320px]', className)}>
            {/* Header */}
            <div className={cn('rounded-t-xl px-4 py-3 flex items-center justify-between', color)}>
                <h3 className="font-semibold text-sm">{title}</h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                    {applicants.length}
                </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 bg-gray-50 rounded-b-xl p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
                {applicants.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        No applicants
                    </div>
                ) : (
                    applicants.map(applicant => (
                        <ApplicationCard
                            key={applicant.id}
                            applicant={applicant}
                            onView={() => onApplicantClick?.(applicant)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
