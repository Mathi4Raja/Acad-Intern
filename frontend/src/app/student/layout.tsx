'use client'

import { DashboardLayout } from '@/components/dashboard'
import { Home, Briefcase, FileText, User, MessageSquare, BarChart3 } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { useNotifications } from '@/lib/useNotifications'

const navigation = [
  { name: 'Dashboard', href: '/student/dashboard', icon: Home },
  { name: 'Browse Internships', href: '/student/internships', icon: Briefcase },
  { name: 'My Applications', href: '/student/applications', icon: FileText },
  { name: 'Messages', href: '/student/messages', icon: MessageSquare },
  { name: 'Analytics', href: '/student/analytics', icon: BarChart3 },
  { name: 'Profile', href: '/student/profile', icon: User },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { notifications, markAsRead, markAllAsRead } = useNotifications()

  return (
    <DashboardLayout
      variant="student"
      navigation={navigation}
      userName={user?.name || 'Student'}
      userEmail={user?.email}
      userIcon={User}
      notificationHref="/student/notifications"
      notifications={notifications}
      onMarkNotificationAsRead={markAsRead}
      onMarkAllNotificationsAsRead={markAllAsRead}
      onLogout={logout}
    >
      {children}
    </DashboardLayout>
  )
}
