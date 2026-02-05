'use client'

import { useState } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react'

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState('all')

  // Mock data - will be replaced with API
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'application_update',
      title: 'Application Shortlisted',
      message: 'Your application for Frontend Developer Intern at Meta has been shortlisted!',
      timestamp: '2025-12-15T10:30:00',
      read: false,
      icon: '✅',
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'interview',
      title: 'Interview Scheduled',
      message: 'Interview for Data Science Intern at Google scheduled for Dec 18, 2025 at 2:00 PM.',
      timestamp: '2025-12-15T09:15:00',
      read: false,
      icon: '📅',
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'assessment',
      title: 'Assessment Due',
      message: 'Technical assessment for Machine Learning Intern at Tesla is due by Dec 20, 2025.',
      timestamp: '2025-12-14T16:45:00',
      read: true,
      icon: '📝',
      color: 'text-orange-600'
    },
    {
      id: 4,
      type: 'offer',
      title: 'Offer Received!',
      message: 'Congratulations! You have received an offer for DevOps Engineer Intern at Microsoft.',
      timestamp: '2025-12-14T14:20:00',
      read: false,
      icon: '🎉',
      color: 'text-purple-600'
    },
    {
      id: 5,
      type: 'application_update',
      title: 'Application Received',
      message: 'Your application for Backend Developer at Amazon has been received and is under review.',
      timestamp: '2025-12-13T11:00:00',
      read: true,
      icon: '📨',
      color: 'text-blue-600'
    },
    {
      id: 6,
      type: 'rejection',
      title: 'Application Update',
      message: 'Unfortunately, your application for Mobile App Developer at Apple was not selected.',
      timestamp: '2025-12-13T09:30:00',
      read: true,
      icon: '📋',
      color: 'text-gray-600'
    },
    {
      id: 7,
      type: 'profile',
      title: 'Complete Your Profile',
      message: 'Your profile is 85% complete. Add more details to increase your chances!',
      timestamp: '2025-12-12T08:00:00',
      read: true,
      icon: '👤',
      color: 'text-indigo-600'
    },
    {
      id: 8,
      type: 'new_internship',
      title: 'New Matching Internship',
      message: 'A new internship matching your skills (95% match) has been posted by Netflix.',
      timestamp: '2025-12-11T15:30:00',
      read: true,
      icon: '🆕',
      color: 'text-green-600'
    }
  ])

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

    // Format date consistently (DD/MM/YYYY)
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
    <div className="max-w-4xl mx-auto p-3 sm:p-4">
      {/* Header */}
      {/* Header */}
      <div className="mb-6 flex flex-col items-center sm:flex-row justify-center gap-4">
        <div className="bg-gradient-to-br from-white to-orange-50/50 rounded-2xl shadow-sm border border-orange-100/50 p-3 sm:px-4 sm:py-3 w-full sm:w-auto overflow-hidden relative group">
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
              <Bell size={20} className="fill-orange-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-red-200 shadow-sm align-middle">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Stay updated with your internship applications
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-orange-100/50 rounded-full blur-2xl group-hover:bg-orange-100/80 transition-colors" />
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-red-100/50 rounded-full blur-2xl group-hover:bg-red-100/80 transition-colors" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium text-sm w-full sm:w-auto shadow-sm"
            >
              <CheckCheck size={16} className="text-primary" />
              Mark all read
            </button>
          )}
        </div>
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
      <div className="space-y-2 sm:space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-sm sm:text-base text-gray-600">
              {filterType === 'unread'
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border p-3 sm:p-4 hover:shadow-md transition-all ${notification.read ? 'border-gray-100' : 'border-primary/30 bg-primary/10/30'
                }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-2xl sm:text-3xl flex-shrink-0">{notification.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">{notification.title}</h3>
                    {!notification.read && (
                      <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1"></span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2 leading-relaxed">{notification.message}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">
                      {getRelativeTime(notification.timestamp)}
                    </span>
                    <div className="flex gap-1 sm:gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-primary hover:text-primary p-1 hover:bg-primary/10 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
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
      {filteredNotifications.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setNotifications([])}
            className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2 mx-auto"
          >
            <Trash2 size={16} />
            Clear all notifications
          </button>
        </div>
      )}
    </div>
  )
}
