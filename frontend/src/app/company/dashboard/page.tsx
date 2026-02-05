'use client'
import { Building2, Users, Briefcase, TrendingUp, Plus, Search, Calendar, ChevronRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { PageHeader } from '@/components/common'
import { StatCard } from '@/components/analytics/StatCard'

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
        let hiredCount = 0;

        // Fetch apps for all active/recent internships (limit to a few for performance)
        const internshipsToFetch = internships.slice(0, 5);
        const appPromises = internshipsToFetch.map(async (intern: any) => {
          try {
            const res = await api.get(`/applications/internship/${intern._id}`);
            const apps = res.data.data;
            totalAppCount += apps.length;
            shortlistedCount += apps.filter((a: any) => a.status === 'shortlisted' || a.status === 'assessment_completed').length;
            hiredCount += apps.filter((a: any) => a.status === 'accepted' || a.status === 'hired').length;
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
          shortlisted: shortlistedCount,
          hired: hiredCount
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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading dashboard...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-100 text-green-700'
      case 'assessment_completed': return 'bg-purple-100 text-purple-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'accepted':
      case 'hired': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4">
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${user?.name || 'Recruiter'}! 👋`}
        subtitle="Overview of your hiring pipeline and active internships."
        action={
          <Link
            href="/company/internships/new"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={18} />
            Post Internship
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard
          title="Active Jobs"
          value={stats.activeInternships}
          icon={Briefcase}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          description="Currently hiring"
        />
        <StatCard
          title="Total Applicants"
          value={stats.totalApplications}
          change={{ value: 12, type: 'increase' }}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          description="Across all roles"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted}
          icon={Search}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          description="Ready for interview"
        />
        <StatCard
          title="Hired"
          value={stats.hired}
          icon={Building2}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          description="Accepted offers"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Recent Applications</h2>
              <Link href="/company/applications" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All
              </Link>
            </div>
            {recentApplications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentApplications.map((app) => (
                  <div key={app.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                          {app.applicantName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{app.applicantName}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{app.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <div className="text-right min-w-[100px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border ${getStatusColor(app.status)} bg-opacity-50 border-opacity-20`}>
                            {app.status}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1">Applied {formatDate(app.appliedDate)}</p>
                        </div>
                        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                          <ChevronRight className="text-gray-400" size={16} />
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Recent Postings</h2>
              <Link href="/company/internships" className="text-primary hover:text-primary/80 text-sm font-medium">
                View All
              </Link>
            </div>
            {postedInternships.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {postedInternships.map((internship) => (
                  <div key={internship.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="mb-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{internship.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${internship.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {internship.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar size={12} />
                        Posted {formatDate(internship.postedDate)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 uppercase tracking-wide font-medium">
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
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <Link
                href="/company/internships/new"
                className="w-full flex items-center justify-center gap-2 text-primary border border-primary/20 bg-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary/5 transition-colors shadow-sm"
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
