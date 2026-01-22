'use client'

import { cn } from '@/lib/utils'
import { LucideIcon, Clock, MapPin, Briefcase, Star } from 'lucide-react'

export interface Applicant {
    id: string
    name: string
    email: string
    position: string
    status: 'pending' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected'
    matchScore: number
    appliedDate: string
    skills: string[]
    avatar?: string
}

interface ApplicationCardProps {
    applicant: Applicant
    onView?: () => void
    onStatusChange?: (status: Applicant['status']) => void
    isDragging?: boolean
    className?: string
}

const statusColors: Record<Applicant['status'], string> = {
    pending: 'border-l-yellow-400',
    shortlisted: 'border-l-blue-400',
    interviewed: 'border-l-purple-400',
    offered: 'border-l-green-400',
    rejected: 'border-l-red-400'
}

export function ApplicationCard({ applicant, onView, isDragging = false, className }: ApplicationCardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-lg border-l-4 shadow-sm p-3 cursor-pointer hover:shadow-md transition-all',
                statusColors[applicant.status],
                isDragging && 'shadow-lg rotate-2 scale-105',
                className
            )}
            onClick={onView}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {applicant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{applicant.name}</h4>
                        <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <Star size={10} />
                            {applicant.matchScore}%
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-2">{applicant.position}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 mb-2">
                        {applicant.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {skill}
                            </span>
                        ))}
                        {applicant.skills.length > 3 && (
                            <span className="text-xs text-gray-400">+{applicant.skills.length - 3}</span>
                        )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {applicant.appliedDate}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
