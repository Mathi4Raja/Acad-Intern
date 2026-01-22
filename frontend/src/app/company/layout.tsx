'use client'

import { DashboardLayout } from '@/components/dashboard'
import { Home, Briefcase, FileText, PlusCircle, Building, MessageSquare, BarChart3 } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useNotifications } from '@/lib/useNotifications'

const navigation = [
  { name: 'Dashboard', href: '/company/dashboard', icon: Home },
  { name: 'Post Internship', href: '/company/post-internship', icon: PlusCircle },
  { name: 'My Internships', href: '/company/internships', icon: Briefcase },
  { name: 'Applications', href: '/company/applications', icon: FileText },
  { name: 'Messages', href: '/company/messages', icon: MessageSquare },
  { name: 'Analytics', href: '/company/analytics', icon: BarChart3 },
  { name: 'Company Profile', href: '/company/profile', icon: Building },
]

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { notifications, markAsRead, markAllAsRead } = useNotifications()

  return (
    <DashboardLayout
      variant="company"
      navigation={navigation}
      userName={user?.name || 'Company'}
      userEmail={user?.email}
      userIcon={Building}
      notificationHref="/company/notifications"
      notifications={notifications}
      onMarkNotificationAsRead={markAsRead}
      onMarkAllNotificationsAsRead={markAllAsRead}
      onLogout={logout}
    >
      {children}
    </DashboardLayout>
  )
}
