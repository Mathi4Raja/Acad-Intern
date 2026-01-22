'use client'

import { cn } from '@/lib/utils'
import { Briefcase, CheckCircle, Bell, Shield, LucideIcon } from 'lucide-react'

export interface Notification {
    _id?: string
    id: string
    type: 'application' | 'status_update' | 'admin' | 'general'
    title: string
    message: string
    createdAt?: string
    time?: string
    read: boolean
    payload?: Record<string, any>
    actionUrl?: string
}

interface NotificationItemProps {
    notification: Notification
    onMarkAsRead?: (id: string) => void
    onClick?: () => void
}

const typeIcons: Record<Notification['type'], LucideIcon> = {
    application: Briefcase,
    status_update: CheckCircle,
    admin: Shield,
    general: Bell
}

const typeColors: Record<Notification['type'], string> = {
    application: 'bg-blue-100 text-blue-600',
    status_update: 'bg-green-100 text-green-600',
    admin: 'bg-red-100 text-red-600',
    general: 'bg-gray-100 text-gray-600'
}

function formatTime(dateString?: string): string {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
}

export function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
    const Icon = typeIcons[notification.type] || Bell

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50',
                !notification.read && 'bg-primary/5'
            )}
            onClick={onClick}
        >
            {/* Icon */}
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', typeColors[notification.type] || typeColors.general)}>
                <Icon size={18} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', notification.read ? 'text-gray-600' : 'text-gray-900 font-medium')}>
                        {notification.title}
                    </p>
                    {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                    )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                    {notification.time || formatTime(notification.createdAt)}
                </p>
            </div>
        </div>
    )
}
