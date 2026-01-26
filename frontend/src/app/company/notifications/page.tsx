'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter, Users, Briefcase, MessageSquare, AlertCircle } from 'lucide-react'

export default function CompanyNotificationsPage() {
    const [filterType, setFilterType] = useState('all')

    // Mock data - will be replaced with API
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        setNotifications([
            {
                id: 1,
                type: 'new_application',
                title: 'New Application Received',
                message: 'Alex Johnson has applied for the Software Engineering Intern position.',
                timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
                read: false,
                icon: <Users className="text-blue-600" />,
                color: 'text-blue-600'
            },
            {
                id: 2,
                type: 'message_received',
                title: 'New Message',
                message: 'Sarah Williams sent you a message regarding the UI/UX Design internship.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
                read: false,
                icon: <MessageSquare className="text-green-600" />,
                color: 'text-green-600'
            },
            {
                id: 3,
                type: 'internship_approved',
                title: 'Internship Post Approved',
                message: 'Your post for "Data Science Intern" has been approved and is now live.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
                read: true,
                icon: <Briefcase className="text-purple-600" />,
                color: 'text-purple-600'
            },
            {
                id: 4,
                type: 'urgent_review',
                title: 'Action Required',
                message: '3 applications for "Social Media Intern" are awaiting your review for over 5 days.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2d ago
                read: false,
                icon: <AlertCircle className="text-orange-600" />,
                color: 'text-orange-600'
            }
        ]);
    }, []);

    const handleMarkAsRead = (id: number) => {
        setNotifications(notifications.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
        ))
    }

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, read: true })))
    }

    const handleDelete = (id: number) => {
        setNotifications(notifications.filter(notif => notif.id !== id))
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

    const filteredNotifications = filterType === 'all'
        ? notifications
        : filterType === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.read)

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
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
                            key={notification.id}
                            className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-all ${notification.read ? 'border-gray-100' : 'border-primary/30 bg-primary/5'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                                    {notification.icon}
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
                                            {getRelativeTime(notification.timestamp)}
                                        </span>
                                        <div className="flex gap-2">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(notification.id)}
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
