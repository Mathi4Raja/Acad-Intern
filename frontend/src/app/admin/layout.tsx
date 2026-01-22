'use client'

import { DashboardLayout } from '@/components/dashboard'
import { Home, Users, Briefcase, Building, Flag, BarChart3, Settings, Shield } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'Manage Internships', href: '/admin/internships', icon: Briefcase },
    { name: 'Manage Companies', href: '/admin/companies', icon: Building },
    { name: 'Reports & Moderation', href: '/admin/reports', icon: Flag },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const [quickStats, setQuickStats] = useState([
        { label: 'Total Users', value: '-' },
        { label: 'Active Internships', value: '-' },
        { label: 'Pending Reports', value: '-', highlight: true },
    ])

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats')
                const stats = res.data.data.stats
                setQuickStats([
                    { label: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0' },
                    { label: 'Active Internships', value: stats.activeInternships?.toString() || '0' },
                    { label: 'Pending Reports', value: stats.pendingReports?.toString() || '0', highlight: stats.pendingReports > 0 },
                ])
            } catch (error) {
                console.error('Error fetching admin stats:', error)
            }
        }

        if (user?.role === 'admin') {
            fetchStats()
        }
    }, [user])

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <DashboardLayout
            variant="admin"
            navigation={navigation}
            logoIcon={Shield}
            logoIconColor="text-red-600"
            userName={user.name || 'Admin User'}
            userEmail={user.email || 'admin@acadintern.com'}
            quickStats={quickStats}
        >
            {children}
        </DashboardLayout>
    )
}
