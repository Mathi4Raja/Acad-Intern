'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Settings, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationItem } from './NotificationItem'
import type { Notification } from './NotificationItem'
import Link from 'next/link'

interface NotificationDropdownProps {
    notifications: Notification[]
    onMarkAsRead?: (id: string) => void
    onMarkAllAsRead?: () => void
    notificationsHref?: string
    className?: string
}

export function NotificationDropdown({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    notificationsHref = '/notifications',
    className
}: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const unreadCount = notifications.filter(n => !n.read).length

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={dropdownRef} className={cn('relative', className)}>
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkAllAsRead}
                                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.slice(0, 5).map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={onMarkAsRead}
                                    onClick={() => {
                                        onMarkAsRead?.(notification.id)
                                        setIsOpen(false)
                                    }}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 bg-gray-50">
                            <Link
                                href={notificationsHref}
                                className="block text-center text-sm text-primary hover:text-primary/80 font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                View All Notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
