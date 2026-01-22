'use client'

import { TrendingUp, Briefcase, FileText, CheckCircle, Clock, ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

// Utility function to format dates consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function StudentDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    profileCompletion: 0,
    applicationsSubmitted: 0,
    shortlisted: 0,
    activeInternships: 0
  })
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [recommendedInternships, setRecommendedInternships] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Applications
        const appsRes = await api.get('/applications/my');
        const applications = appsRes.data.data;

        // 2. Fetch Recommended Match
        const matchRes = await api.get('/internships/match');
        const matches = matchRes.data.data;

        // 3. Fetch student profile for completion calculation
        let studentProfile = null;
        try {
          const profileRes = await api.get('/students/profile/me');
          if (profileRes.data.success && profileRes.data.data) {
            studentProfile = profileRes.data.data;
          }
        } catch (profileErr) {
          console.error("Could not fetch student profile:", profileErr);
        }

        // 4. Fetch active internships count
        const allInternshipsRes = await api.get('/internships?limit=1');
        const activeCount = allInternshipsRes.data.count || 0;

        setRecentApplications(applications.slice(0, 3).map((app: any) => ({
          id: app._id,
          title: app.internshipId?.title || 'Unknown Title',
          company: app.internshipId?.companyId?.companyName || 'Unknown Company',
          status: app.status,
          appliedDate: app.appliedAt,
          stipend: `₹${app.internshipId?.stipend || 0}/mo`
        })));

        setRecommendedInternships(matches.slice(0, 3).map((internship: any) => ({
          id: internship._id,
          title: internship.title,
          company: internship.companyId?.companyName,
          skills: internship.skillsRequired,
          duration: `${internship.durationWeeks} weeks`,
          stipend: `₹${internship.stipend}/mo`,
          mode: internship.mode,
          match: internship.matchScore
        })));

        // Calculate profile completion using same logic as profile page
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

        const completionPercentage = Math.round((completeness / total) * 100);

        setStats({
          profileCompletion: completionPercentage,
          applicationsSubmitted: applications.length,
          shortlisted: applications.filter((app: any) => app.status === 'shortlisted' || app.status === 'accepted').length,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'accepted': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (authLoading || (isLoading && user)) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome back, {user?.name || 'Student'}! 👋</h1>
        <p className="text-sm sm:text-base text-gray-600">Here&apos;s what&apos;s happening with your internship search</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-orange-50 rounded-lg">
              <Clock className="text-orange-600" size={18} />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">0</span>
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600">Interviews Scheduled</h3>
          <p className="text-xs text-gray-500 mt-1.5">None yet</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-blue-50 rounded-lg">
              <FileText className="text-blue-600" size={18} />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.applicationsSubmitted}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600">Applications Submitted</h3>
          <Link href="/student/applications" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={18} />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.shortlisted}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600">Shortlisted</h3>
          <p className="text-xs text-gray-500 mt-1.5">Great progress!</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <div className="p-2 sm:p-2.5 bg-purple-50 rounded-lg">
              <Briefcase className="text-purple-600" size={18} />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeInternships}</span>
          </div>
          <h3 className="text-xs sm:text-sm font-semibold text-gray-600">Active Internships</h3>
          <Link href="/student/internships" className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-1.5 inline-block">
            Browse all →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-md border-2 border-gray-200">
            <div className="p-4 sm:p-5 border-b-2 border-gray-200 flex items-center justify-between bg-white rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Applications</h2>
              <Link href="/student/applications" className="text-xs sm:text-sm text-primary hover:text-primary font-medium">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {recentApplications.map((app) => (
                <div key={app.id} className="p-4 sm:p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top rounded-r"></div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0 sm:mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{app.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{app.company}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          Applied {formatDate(app.appliedDate)}
                        </span>
                        <span className="font-semibold text-green-600">{app.stipend}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
              {recentApplications.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  You haven't applied to any internships yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Internships */}
        <div>
          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-md border-2 border-gray-200">
            <div className="p-4 sm:p-5 border-b-2 border-gray-200 flex items-center justify-between bg-white rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Recommended</h2>
              <Search className="text-gray-400" size={18} />
            </div>
            <div className="divide-y divide-gray-200">
              {recommendedInternships.map((internship) => (
                <div key={internship.id} className="p-4 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-white transition-all duration-200 relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top rounded-r"></div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-gray-900">{internship.title}</h3>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                          {internship.match}% match
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{internship.company}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {internship.skills.slice(0, 2).map((skill: string) => (
                          <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                        {internship.skills.length > 2 && (
                          <span className="text-xs text-gray-500">+{internship.skills.length - 2}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{internship.duration}</span>
                        <span>•</span>
                        <span className="font-semibold text-green-600">{internship.stipend}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/student/internships/${internship.id}`}
                    className="mt-2 w-full flex items-center justify-center gap-1 bg-primary text-white text-xs font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    View Details
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
              {recommendedInternships.length === 0 && (
                <div className="p-6 text-center text-gray-500 text-sm">
                  Add skills to your profile to get recommendations.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <Link
                href="/student/internships"
                className="w-full flex items-center justify-center gap-1 text-primary text-sm font-medium hover:text-primary transition-colors"
              >
                Browse All Internships
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Prompt */}
      {stats.profileCompletion < 100 && (
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-primary/10 to-blue-50 rounded-xl p-4 sm:p-6 border border-primary/20">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex items-center gap-3 sm:block">
              <div className="flex-shrink-0 p-2.5 sm:p-3 bg-white rounded-lg shadow-sm">
                <TrendingUp className="text-primary" size={20} />
              </div>
              <div className="sm:hidden">
                <span className="text-2xl font-bold text-primary">{stats.profileCompletion}%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Complete your profile</h3>
                <span className="hidden sm:block text-xl font-bold text-primary">{stats.profileCompletion}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-2 mb-3">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.profileCompletion}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Complete your profile to increase your chances of getting noticed by companies.
              </p>
              <Link
                href="/student/profile"
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Complete Profile
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
