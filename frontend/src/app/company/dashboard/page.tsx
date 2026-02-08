'use client'
import { Building2, Users, Briefcase, TrendingUp, Plus, Search, Calendar, ChevronRight, CheckCircle, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
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
        const internshipsRes = await api.get('/internships/company/my'); // content is under data.data
        const internships = internshipsRes.data.data;

        // Create a map to store applicant counts per internship
        const applicantCounts: Record<string, number> = {};

        setStats(prev => ({ ...prev, activeInternships: internships.filter((i: any) => i.status === 'active').length }));

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
            return apps.map((a: any) => ({
              ...a,
              internshipTitle: intern.title,
              internshipSkills: intern.skillsRequired || []
            }));
          } catch (e) {
            return [];
          }
        });

        const results = await Promise.all(appPromises);
        allApps = results.flat();

        // Count applicants per internship
        allApps.forEach((app: any) => {
          const internshipId = app.internshipId?._id || app.internshipId;
          if (internshipId) {
            applicantCounts[internshipId] = (applicantCounts[internshipId] || 0) + 1;
          }
        });

        // Now update posted internships with real applicant counts
        setPostedInternships(internships.slice(0, 3).map((intern: any) => ({
          id: intern._id,
          title: intern.title,
          applicants: applicantCounts[intern._id] || 0,
          status: intern.status === 'active' ? 'Active' : 'Closed',
          postedDate: intern.createdAt,
          type: intern.mode
        })));

        // Sort by date desc
        allApps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

        setRecentApplications(allApps.slice(0, 5).map((app: any) => {
          // Calculate real match score
          const studentSkills = (app.studentId?.skills || []).map((s: string) => s.toLowerCase());
          const internshipSkills = (app.internshipSkills || []).map((s: string) => s.toLowerCase());
          let matchScore = 0;
          if (internshipSkills.length > 0 && studentSkills.length > 0) {
            const matched = internshipSkills.filter((s: string) => studentSkills.includes(s));
            matchScore = Math.round((matched.length / internshipSkills.length) * 100);
          }
          return {
            id: app._id,
            applicantName: app.studentId?.name || 'Unknown',
            role: app.internshipTitle,
            status: app.status,
            appliedDate: app.appliedAt,
            match: matchScore
          };
        }));

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
    <div className="max-w-7xl mx-auto p-3 sm:p-5">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center sm:flex-row justify-between gap-4">
        <div className="bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl shadow-sm border border-indigo-100/50 p-3 sm:px-4 sm:py-3 w-full sm:w-auto overflow-hidden relative group">
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Link href="/company/dashboard"> <LayoutDashboard size={20} className="fill-indigo-400/20" /> </Link>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                Welcome back, {user?.name || 'Recruiter'}! 👋
              </h1>
              <p className="text-xs text-gray-600 font-medium">
                Overview of your hiring pipeline and active internships.
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-100/50 rounded-full blur-2xl group-hover:bg-indigo-100/80 transition-colors" />
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-purple-100/50 rounded-full blur-2xl group-hover:bg-purple-100/80 transition-colors" />
        </div>

        <Link
          href="/company/post-internship"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Post Internship
        </Link>
      </div>

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
                  <div key={app.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold border border-gray-200 text-xs">
                          {app.applicantName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{app.applicantName}</h3>
                          <p className="text-xs text-gray-500 line-clamp-1">{app.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <div className="text-right min-w-[80px]">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide border ${getStatusColor(app.status)} bg-opacity-50 border-opacity-20`}>
                            {app.status}
                          </span>
                          <p className="text-[9px] text-gray-400 mt-0.5">Applied {formatDate(app.appliedDate)}</p>
                        </div>
                        <Link href={`/company/applications/${app.id}`} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                          <ChevronRight className="text-gray-400" size={14} />
                        </Link>
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
                  <Link key={internship.id} href={`/company/edit-internship/${internship.id}`} className="block p-3 hover:bg-gray-50 transition-colors group">
                    <div className="mb-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-primary transition-colors">{internship.title}</h3>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide ${internship.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {internship.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <Calendar size={10} />
                        Posted {formatDate(internship.postedDate)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 uppercase tracking-wide font-medium">
                        {internship.type}
                      </span>
                    </div>
                  </Link>
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
