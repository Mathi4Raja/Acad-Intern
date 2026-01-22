'use client'
import { Building2, Users, Briefcase, TrendingUp, Plus, Search, Calendar, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

// Utility function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CompanyDashboard() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    activeInternships: 0,
    totalApplications: 0,
    shortlisted: 0,
    hired: 0
  })
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [postedInternships, setPostedInternships] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!profile || !('_id' in profile)) return; // Ensure we have company profile

        // 1. Fetch Company's Internships
        const internshipsRes = await api.get(`/internships?companyId=${(profile as any)._id}`); // content is under data.data
        const internships = internshipsRes.data.data;

        setPostedInternships(internships.slice(0, 3).map((intern: any) => ({
          id: intern._id,
          title: intern.title,
          applicants: 0, // Placeholder
          status: intern.isActive ? 'Active' : 'Closed',
          postedDate: intern.createdAt,
          type: intern.mode
        })));

        setStats(prev => ({ ...prev, activeInternships: internships.filter((i: any) => i.isActive).length }));

        // 2. Fetch Applications for Internships (Client-side aggregation for MVP)
        // We limit to first 3 internships to avoid N+1 explosion
        let allApps: any[] = [];
        let totalAppCount = 0;
        let shortlistedCount = 0;

        // Fetch apps for all active/recent internships (limit to a few for performance)
        const internshipsToFetch = internships.slice(0, 5);
        const appPromises = internshipsToFetch.map(async (intern: any) => {
          try {
            const res = await api.get(`/applications/internship/${intern._id}`);
            const apps = res.data.data;
            totalAppCount += apps.length;
            shortlistedCount += apps.filter((a: any) => a.status === 'shortlisted').length;
            // Add title for context
            return apps.map((a: any) => ({ ...a, internshipTitle: intern.title }));
          } catch (e) {
            return [];
          }
        });

        const results = await Promise.all(appPromises);
        allApps = results.flat();

        // Sort by date desc
        allApps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

        setRecentApplications(allApps.slice(0, 5).map((app: any) => ({
          id: app._id,
          applicantName: app.studentId?.name || 'Unknown',
          role: app.internshipTitle,
          status: app.status,
          appliedDate: app.appliedAt,
          match: 85 // Mock match
        })));

        setStats(prev => ({
          ...prev,
          totalApplications: totalAppCount,
          shortlisted: shortlistedCount
        }));

      } catch (error) {
        console.error("Error fetching company dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user && profile) {
      fetchData();
    }
  }, [profile, user, authLoading]);

  if (authLoading || (isLoading && user)) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'hired': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Welcome back, {user?.name || 'Recruiter'}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Overview of your hiring pipeline</p>
        </div>
        <Link
          href="/company/internships/new"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={20} />
          Post New Internship
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Briefcase className="text-primary" size={24} />
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.activeInternships}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Active Jobs</h3>
          <p className="text-xs text-gray-500 mt-2">Currently hiring</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalApplications}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Applicants</h3>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> +12% this week
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Search className="text-purple-600" size={24} />
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.shortlisted}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Shortlisted</h3>
          <p className="text-xs text-gray-500 mt-2">Ready for interview</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Building2 className="text-green-600" size={24} />
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.hired}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Hired</h3>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
              <Link href="/company/applications" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All
              </Link>
            </div>
            {recentApplications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentApplications.map((app) => (
                  <div key={app.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                          {app.applicantName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{app.applicantName}</h3>
                          <p className="text-sm text-gray-600">{app.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Applied {formatDate(app.appliedDate)}</p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <ChevronRight className="text-gray-400" size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No applications received yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Postings */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Postings</h2>
              <Link href="/company/internships" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All
              </Link>
            </div>
            {postedInternships.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {postedInternships.map((internship) => (
                  <div key={internship.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{internship.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        Posted {formatDate(internship.postedDate)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium`}>
                        {internship.status}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {internship.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No internships posted.
              </div>
            )}
            <div className="p-4 border-t border-gray-100">
              <Link
                href="/company/internships/new"
                className="w-full flex items-center justify-center gap-2 text-primary border border-primary/20 bg-primary/5 py-2 rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                <Plus size={16} />
                Create New Posting
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
