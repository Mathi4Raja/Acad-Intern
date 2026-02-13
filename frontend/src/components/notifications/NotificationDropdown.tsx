'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Settings, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationItem } from './NotificationItem'
import type { Notification } from './NotificationItem'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

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
    const router = useRouter()
    const { user } = useAuth()

    const unreadCount = notifications.filter(n => !n.read).length

    const handleNotificationClick = (notification: Notification) => {
        onMarkAsRead?.(notification.id)
        setIsOpen(false)

        const role = user?.role || 'student'
        const payload = notification.payload

        if (notification.type === 'application' || notification.type === 'status_update') {
            router.push(`/${role}/applications`)
        } else if (notification.type === 'general') {
            if (notification.title === 'New Message' && payload?.applicationId) {
                router.push(`/${role}/messages?applicationId=${payload.applicationId}`)
            } else {
                router.push(`/${role}/dashboard`)
            }
        }
    }

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
                <div className="fixed top-[65px] right-4 left-4 w-auto sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:left-auto sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100/50 ring-1 ring-black/5 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 sm:origin-top-right">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 bg-white/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="text-[10px] text-primary hover:text-primary/70 font-medium flex items-center gap-1 transition-colors bg-primary/5 hover:bg-primary/10 px-1.5 py-0.5 rounded-md"
                            >
                                <Check size={10} strokeWidth={2.5} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[12rem] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                    <Bell className="w-5 h-5 text-gray-300" />
                                </div>
                                <p className="font-medium text-gray-900 text-xs">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.slice(0, 5).map((notification, idx) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={onMarkAsRead}
                                        onClick={() => handleNotificationClick(notification)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <Link
                            href={notificationsHref}
                            className="block p-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-primary hover:bg-gray-50 transition-all border-t border-gray-50"
                            onClick={() => setIsOpen(false)}
                        >
                            View All Notifications
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
