'use client'

import { DashboardLayout } from '@/components/dashboard'
import { Home, Briefcase, FileText, PlusCircle, Building, BarChart3, MessageCircle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useNotifications } from '@/lib/useNotifications'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/company/dashboard', icon: Home },
  { name: 'Post Internship', href: '/company/post-internship', icon: PlusCircle },
  { name: 'My Internships', href: '/company/internships', icon: Briefcase },
  { name: 'Applications', href: '/company/applications', icon: FileText },
  { name: 'Messages', href: '/company/messages', icon: MessageCircle },
  { name: 'Analytics', href: '/company/analytics', icon: BarChart3 },
  { name: 'Company Profile', href: '/company/profile', icon: Building },
]

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, logout, isLoading: authLoading } = useAuth()
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const pathname = usePathname()
  const router = useRouter()
  const isMessagesPage = pathname === '/company/messages'
  const companyName = (profile as any)?.companyName || user?.name || 'Company';

  // Redirect to login if not authenticated or wrong role
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'company')) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Show loading state while checking auth
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // Don't render content if not authenticated
  if (!user || user.role !== 'company') {
    return null
  }

  return (
    <DashboardLayout
      variant="company"
      navigation={navigation}
      userName={companyName}
      userEmail={user?.email}
      userAvatar={(profile as any)?.logo}
      notificationHref="/company/notifications"
      notifications={notifications}
      onMarkNotificationAsRead={markAsRead}
      onMarkAllNotificationsAsRead={markAllAsRead}
      onLogout={logout}
      disableContentPadding={isMessagesPage}
    >
      {children}
    </DashboardLayout>
  )
}

