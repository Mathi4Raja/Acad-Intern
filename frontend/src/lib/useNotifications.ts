'use client'

import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { AxiosError } from 'axios'

export interface Notification {
    _id: string
    id: string
    type: 'application' | 'status_update' | 'admin' | 'general'
    title: string
    message: string
    payload?: Record<string, unknown>
    read: boolean
    createdAt: string
}

interface NotificationsData {
    items: Notification[]
    unreadCount: number
}

interface UseNotificationsReturn {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
    error: string | null
    fetchNotifications: () => Promise<void>
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await api.get<{ success: boolean; data: NotificationsData }>('/notifications')

            if (response.data.success) {
                // Add 'id' field for compatibility with NotificationDropdown
                const items = response.data.data.items.map(item => ({
                    ...item,
                    id: item._id
                }))
                setNotifications(items)
                setUnreadCount(response.data.data.unreadCount)
            }
        } catch (err) {
            const error = err as AxiosError;
            console.error('Failed to fetch notifications:', error)
            // Don't set error for 401 (user just not logged in)
            if (error.response?.status !== 401) {
                setError('Failed to load notifications')
            }
        } finally {
            setLoading(false)
        }
    }, [])

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`)

            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (err) {
            console.error('Failed to mark notification as read:', err)
        }
    }, [])

    const markAllAsRead = useCallback(async () => {
        try {
            await api.patch('/notifications/read-all')

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err)
        }
    }, [])

    // Fetch on mount
    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    return {
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    }
}

export default useNotifications
