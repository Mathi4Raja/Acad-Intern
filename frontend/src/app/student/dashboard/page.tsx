'use client'

import { TrendingUp, Briefcase, FileText, CheckCircle, Clock, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Application, Internship, ApplicationStatus } from '@/types'
import { StatCard } from '@/components/analytics/StatCard' // Reusing from analytics
import { PageHeader } from '@/components/common'
import RecentApplicationsWidget from '@/components/dashboard/RecentApplicationsWidget'
import { formatDate, formatStipend, getModeLabel } from '@/lib/formatters'

export default function StudentDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState({
    profileCompletion: 0,
    applicationsSubmitted: 0,
    interviews: 0,
    shortlisted: 0,
    activeInternships: 0
  })

  // Typed state
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [savedInternships, setSavedInternships] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetching
        const [appsRes, profileRes, allInternshipsRes] = await Promise.all([
          api.get('/applications/my'),
          api.get('/students/profile/me').catch(() => ({ data: { success: false, data: null } })),
          api.get('/internships?limit=1')
        ])

        const applications = appsRes.data.data;
        const activeCount = allInternshipsRes.data.count || 0;
        const studentProfile = profileRes.data.data;

        // Map applications to Application type
        const formattedApps: Application[] = applications.slice(0, 5).map((app: any) => ({
          id: app._id,
          internshipId: app.internshipId?._id,
          internshipTitle: app.internshipId?.title || 'Unknown Title',
          company: app.internshipId?.companyId?.companyName || 'Unknown Company',
          companyUserId: app.internshipId?.companyId?.userId,
          logo: '', // Handled by component
          status: app.status as ApplicationStatus,
          appliedDate: app.appliedAt,
          lastUpdate: app.updatedAt,
          location: app.internshipId?.location || 'Remote',
          stipend: `₹${app.internshipId?.stipend || 0}/mo`,
          duration: `${app.internshipId?.durationWeeks || 0} weeks`,
          notes: app.notes
        }));

        setRecentApplications(formattedApps);


        // Stats Calculation
        let completeness = 0;
        const total = 8;
        if (user?.name) completeness++;
        if (user?.email) completeness++;
        if (studentProfile?.department) completeness++;
        if (studentProfile?.semester) completeness++;
        if (studentProfile?.cgpa) completeness++;
        if (studentProfile?.bio) completeness++;
        if (studentProfile?.skills?.length > 0) completeness++;
        if (studentProfile?.resumeUrl) completeness++;

        setStats({
          profileCompletion: Math.round((completeness / total) * 100),
          applicationsSubmitted: applications.length,
          interviews: applications.filter((app: any) => app.status === 'interview_scheduled').length,
          shortlisted: applications.filter((app: any) => ['shortlisted', 'assessment_completed', 'accepted'].includes(app.status)).length,
          activeInternships: activeCount
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Handler for saving internships (Mock functionality here if backend doesn't persist properly on match endpoint yet, but logically same as browse)
  const handleToggleSave = useCallback((id: string) => {
    setSavedInternships(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }, [])

  if (authLoading || (isLoading && user)) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center sm:flex-row justify-between gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-sm border border-blue-100/50 p-3 sm:px-4 sm:py-3 w-full sm:w-auto overflow-hidden relative group">
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Link href="/student/dashboard"> <LayoutDashboard size={20} className="fill-blue-400/20" /> </Link>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                Welcome back, {user?.name || 'Student'}! 👋
              </h1>
              <p className="text-xs text-gray-600 font-medium">
                Here's what's happening with your internship search today.
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-100/50 rounded-full blur-2xl group-hover:bg-blue-100/80 transition-colors" />
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-indigo-100/50 rounded-full blur-2xl group-hover:bg-indigo-100/80 transition-colors" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard
          title="Interviews"
          value={stats.interviews}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          description="Scheduled"
        />
        <StatCard
          title="Applications"
          value={stats.applicationsSubmitted}
          change={{ value: 10, type: 'increase' }}
          icon={FileText}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          description="Total Sent"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          description="Active Processes"
        />
        <StatCard
          title="Active"
          value={stats.activeInternships}
          icon={Briefcase}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          description="Current Internships"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <RecentApplicationsWidget
            applications={recentApplications}
            formatDate={formatDate}
          />

        </div>

        {/* Right Column: Profile Completion & More */}
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Completion Widget */}
          <div className="bg-gradient-to-br from-primary to-purple-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base sm:text-lg">Profile Strength</h3>
                <span className="text-xl sm:text-2xl font-bold">{stats.profileCompletion}%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 mb-3">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.profileCompletion}%` }}
                />
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mb-5">
                Complete your profile to increase your chances of getting noticed by 3x.
              </p>
              <Link
                href="/student/profile"
                className="block w-full text-center bg-white text-primary py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          </div>

          {/* Quick Actions / Tips can go here */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-500" />
              Quick Tips
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                Upload a video resume to stand out.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                Verify your skills with assessments.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
