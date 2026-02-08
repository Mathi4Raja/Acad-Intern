'use client'

import { DashboardLayout } from '@/components/dashboard'
import { Home, Users, Briefcase, Building, Flag, BarChart3, Settings, Shield } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminStatsProvider, useAdminStats } from '@/lib/AdminStatsContext'

const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'Manage Internships', href: '/admin/internships', icon: Briefcase },
    { name: 'Manage Companies', href: '/admin/companies', icon: Building },
    { name: 'Reports & Moderation', href: '/admin/reports', icon: Flag },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const { stats, isLoading: statsLoading } = useAdminStats()

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    const quickStats = [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString() },
        { label: 'Active Internships', value: stats.activeInternships.toString() },
        { label: 'Pending Reports', value: stats.pendingReports.toString(), highlight: stats.pendingReports > 0 },
    ]

    return (
        <DashboardLayout
            variant="admin"
            navigation={navigation}
            logoIcon={Shield}
            logoIconColor="text-red-600"
            userName={user.name || 'Admin User'}
            userEmail={user.email || 'admin@acadintern.com'}
            quickStats={quickStats}
            onLogout={logout}
        >
            {children}
        </DashboardLayout>
    )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminStatsProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AdminStatsProvider>
    )
}
