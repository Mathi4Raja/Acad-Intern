import React, { memo } from 'react'
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { ApplicationStatus } from '@/types'

interface StatusBadgeProps {
    status: ApplicationStatus | string
    className?: string
    showIcon?: boolean
}

const StatusBadge = memo(({ status, className = '', showIcon = true }: StatusBadgeProps) => {
    const normalizedStatus = status.toLowerCase()

    const config = {
        pending: {
            icon: Clock,
            style: 'bg-yellow-50 text-yellow-700 border-yellow-200',
            label: 'Pending'
        },
        shortlisted: {
            icon: CheckCircle,
            style: 'bg-green-50 text-green-700 border-green-200',
            label: 'Shortlisted'
        },
        assessment_completed: {
            icon: CheckCircle,
            style: 'bg-purple-50 text-purple-700 border-purple-200',
            label: 'Assessment Done'
        },
        accepted: {
            icon: CheckCircle, // Or a Trophy icon specifically for accepted?
            style: 'bg-blue-50 text-blue-700 border-blue-200',
            label: 'Accepted'
        },
        rejected: {
            icon: XCircle,
            style: 'bg-red-50 text-red-700 border-red-200',
            label: 'Rejected'
        },
        unknown: {
            icon: AlertCircle,
            style: 'bg-gray-50 text-gray-700 border-gray-200',
            label: status
        }
    }

    const currentConfig = config[normalizedStatus as keyof typeof config] || config.unknown
    const Icon = currentConfig.icon

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 
        px-2.5 py-1 rounded-full text-xs font-semibold 
        border ${currentConfig.style} 
        ${className}
      `}
        >
            {showIcon && <Icon size={14} strokeWidth={2.5} />}
            {currentConfig.label}
        </span>
    )
})

StatusBadge.displayName = 'StatusBadge'

export default StatusBadge
