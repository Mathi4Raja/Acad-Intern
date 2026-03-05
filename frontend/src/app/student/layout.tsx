'use client'

import { DashboardLayout } from '@/components/dashboard'
import { Home, Briefcase, FileText, User, BarChart3, MessageCircle, Building } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useNotifications } from '@/lib/useNotifications'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/student/dashboard', icon: Home },
  { name: 'Browse Internships', href: '/student/internships', icon: Briefcase },
  { name: 'Companies', href: '/student/companies', icon: Building },
  { name: 'My Applications', href: '/student/applications', icon: FileText },
  { name: 'Messages', href: '/student/messages', icon: MessageCircle },
  { name: 'Analytics', href: '/student/analytics', icon: BarChart3 },
  { name: 'Profile', href: '/student/profile', icon: User },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, logout, isLoading: authLoading } = useAuth()
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const pathname = usePathname()
  const router = useRouter()
  const isMessagesPage = pathname === '/student/messages'

  // Redirect to login if not authenticated or wrong role
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Show loading state while checking auth
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // Don't render content if not authenticated
  if (!user || user.role !== 'student') {
    return null
  }

  return (
    <DashboardLayout
      variant="student"
      navigation={navigation}
      userName={user?.name || 'Student'}
      userEmail={user?.email}
      userAvatar={(profile as any)?.profilePicture}
      notificationHref="/student/notifications"
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

