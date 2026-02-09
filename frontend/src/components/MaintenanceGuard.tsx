'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSettings } from '@/lib/SettingsContext'
import { useAuth } from '@/lib/AuthContext'
import MaintenancePage from '@/app/maintenance/page'

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const { settings, isLoading: settingsLoading } = useSettings()
    const { user, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Handle redirect for maintenance page if mode is OFF
        if (!settingsLoading && !settings?.maintenanceMode && pathname === '/maintenance') {
            router.push('/')
        }
    }, [settings, settingsLoading, pathname, router])

    // Wait for everything to load to avoid flickering or data flashes
    if (settingsLoading || authLoading) return null

    // If maintenance mode is ON
    if (settings?.maintenanceMode) {
        // Skip check for specific routes or roles
        const isAdmin = user?.role === 'admin'
        const isAuthPage = pathname === '/login'
        const isMaintenancePage = pathname === '/maintenance'

        if (isAdmin || isAuthPage || isMaintenancePage) {
            return <>{children}</>
        }

        // For everyone else, show the maintenance page instead of the app content
        return <MaintenancePage />
    }

    return <>{children}</>
}
