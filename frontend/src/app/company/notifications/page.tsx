'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Loader2, Users, Briefcase, MessageSquare, AlertCircle, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAlert } from '@/components/ui/AlertProvider'

interface Notification {
    _id: string
    type: 'application' | 'status_update' | 'admin' | 'general'
    title: string
    message: string
    read: boolean
    createdAt: string
    payload?: any
}

export default function CompanyNotificationsPage() {
    const [filterType, setFilterType] = useState('all')
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { showAlert } = useAlert()
    const router = useRouter()

    useEffect(() => {
        fetchNotifications()
    }, [])

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already read
        if (!notification.read) {
            handleMarkAsRead(notification._id)
        }

        // Navigate based on type and payload
        if (notification.type === 'application') {
            router.push('/company/applications')
        } else if (notification.type === 'general') {
            if (notification.title === 'New Message' && notification.payload?.applicationId) {
                router.push(`/company/messages?applicationId=${notification.payload.applicationId}`)
            } else {
                router.push('/company/dashboard')
            }
        }
    }

    const fetchNotifications = async () => {
        try {
            setIsLoading(true)
            const res = await api.get('/notifications')
            setNotifications(res.data.data.items || [])
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        try {
            await api.patch(`/notifications/${id}/read`)
            setNotifications(notifications.map(notif =>
                notif._id === id ? { ...notif, read: true } : notif
            ))
        } catch (error) {
            console.error('Failed to mark as read:', error)
            showAlert('Failed to mark as read', 'error')
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all')
            setNotifications(notifications.map(notif => ({ ...notif, read: true })))
            showAlert('All notifications marked as read', 'success')
        } catch (error) {
            console.error('Failed to mark all as read:', error)
            showAlert('Failed to mark all as read', 'error')
        }
    }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        // For now, just remove from local state (no delete API exists yet)
        setNotifications(notifications.filter(notif => notif._id !== id))
    }

    const getRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'application': return <Users className="text-blue-600" size={18} />
            case 'status_update': return <Briefcase className="text-purple-600" size={18} />
            case 'admin': return <AlertCircle className="text-orange-600" size={18} />
            default: return <Info className="text-gray-600" size={18} />
        }
    }

    const filteredNotifications = filterType === 'all'
        ? notifications
        : filterType === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.read)

    const unreadCount = notifications.filter(n => !n.read).length

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Bell className="text-primary" size={28} />
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-2.5 py-0.5 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center justify-center gap-2 text-primary hover:underline font-medium text-xs sm:text-sm"
                        >
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>
                <p className="text-sm sm:text-base text-gray-600">Keep track of applications and updates for your company</p>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 sm:p-2 mb-4 sm:mb-6 flex gap-1.5 sm:gap-2">
                <button
                    onClick={() => setFilterType('all')}
                    className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterType === 'all'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilterType('unread')}
                    className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterType === 'unread'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Unread ({unreadCount})
                </button>
                <button
                    onClick={() => setFilterType('read')}
                    className={`flex-1 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filterType === 'read'
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Read ({notifications.length - unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                        <Bell className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                        <p className="text-sm sm:text-base text-gray-600">
                            {filterType === 'unread'
                                ? "You're all caught up! No unread notifications."
                                : "Your notification history is empty."}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] ${notification.read ? 'border-gray-100 opacity-80' : 'border-primary/30 bg-primary/5'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">{notification.title}</h3>
                                        {!notification.read && (
                                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm mb-3 leading-relaxed">{notification.message}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-gray-500">
                                            {getRelativeTime(notification.createdAt)}
                                        </span>
                                        <div className="flex gap-2">
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notification._id, e)}
                                                    className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleDelete(notification._id, e)}
                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Clear All */}
            {notifications.length > 0 && filterType === 'all' && (
                <div className="mt-8 text-center">
                    <button
                        onClick={() => setNotifications([])}
                        className="text-red-600 hover:text-red-700 font-medium text-sm inline-flex items-center gap-2 border border-red-100 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={16} />
                        Clear all notifications
                    </button>
                </div>
            )}
        </div>
    )
}
