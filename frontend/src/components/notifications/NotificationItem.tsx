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
                'flex items-start gap-2.5 p-2 cursor-pointer transition-all duration-200 hover:bg-gray-50/80 group',
                !notification.read ? 'bg-primary/[0.03]' : 'bg-transparent'
            )}
            onClick={onClick}
        >
            {/* Icon */}
            <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105',
                typeColors[notification.type] || typeColors.general
            )}>
                <Icon size={14} strokeWidth={2} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5 mb-0">
                    <p className={cn(
                        'text-xs font-bold truncate pr-1',
                        !notification.read ? 'text-gray-900' : 'text-gray-600'
                    )}>
                        {notification.title}
                    </p>
                    {!notification.read && (
                        <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1 ring-2 ring-white shadow-sm" />
                    )}
                </div>
                <p className={cn(
                    'text-[10px] line-clamp-2 leading-relaxed tracking-tight',
                    !notification.read ? 'text-gray-600' : 'text-gray-500'
                )}>
                    {notification.message}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5 font-medium">
                    {notification.time || formatTime(notification.createdAt)}
                </p>
            </div>
        </div>
    )
}
