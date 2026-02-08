'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

interface AdminStats {
    totalUsers: number
    activeInternships: number
    pendingReports: number
}

interface AdminStatsContextType {
    stats: AdminStats
    refreshStats: () => Promise<void>
    isLoading: boolean
}

const AdminStatsContext = createContext<AdminStatsContextType | undefined>(undefined)

export function AdminStatsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        activeInternships: 0,
        pendingReports: 0
    })
    const [isLoading, setIsLoading] = useState(false)

    const fetchStats = useCallback(async () => {
        if (!user || user.role !== 'admin') return

        setIsLoading(true)
        try {
            const res = await api.get('/admin/stats')
            const data = res.data.data.stats
            setStats({
                totalUsers: data.totalUsers || 0,
                activeInternships: data.activeInternships || 0,
                pendingReports: data.pendingReports || 0
            })
        } catch (error) {
            console.error('Error fetching admin stats:', error)
        } finally {
            setIsLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return (
        <AdminStatsContext.Provider value={{ stats, refreshStats: fetchStats, isLoading }}>
            {children}
        </AdminStatsContext.Provider>
    )
}

export function useAdminStats() {
    const context = useContext(AdminStatsContext)
    if (context === undefined) {
        throw new Error('useAdminStats must be used within an AdminStatsProvider')
    }
    return context
}
