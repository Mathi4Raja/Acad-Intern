'use client'

import { useState, useEffect } from 'react'
import { Users, Briefcase, CheckCircle, Clock, Target, TrendingUp, BarChart3, Loader2 } from 'lucide-react'
import { StatCard, BarChart, LineChart } from '@/components/analytics'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

export default function CompanyAnalyticsPage() {
    const { user, profile, isLoading: authLoading } = useAuth()
    const [isLoading, setIsLoading] = useState(true)

    const [stats, setStats] = useState({
        totalApplications: 0,
        totalViews: 0,
        hired: 0,
        activeInternships: 0
    })

    const [internships, setInternships] = useState<any[]>([])

    const [internshipPerformance, setInternshipPerformance] = useState<{ label: string; value: number; color: string }[]>([])
    const [conversionFunnel, setConversionFunnel] = useState<{ stage: string; count: number; percent: number }[]>([])
    const [topSkillsApplied, setTopSkillsApplied] = useState<{ skill: string; count: number }[]>([])
    const [applicationTrend, setApplicationTrend] = useState<{ label: string; value: number }[]>([])

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                if (!profile || !('_id' in profile)) return

                // Fetch internships
                const internshipsRes = await api.get('/internships/company/my')
                const internshipsData = internshipsRes.data.data
                setInternships(internshipsData)

                // Fetch applications for each internship
                let allApps: any[] = []
                const skillCounts: Record<string, number> = {}
                const internshipAppCounts: { title: string; count: number }[] = []

                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-cyan-500']

                for (const intern of internshipsData.slice(0, 10)) {
                    try {
                        const res = await api.get(`/applications/internship/${intern._id}`)
                        const apps = res.data.data
                        allApps.push(...apps)

                        internshipAppCounts.push({
                            title: intern.title.length > 20 ? intern.title.slice(0, 20) + '...' : intern.title,
                            count: apps.length
                        })

                        // Count skills
                        apps.forEach((app: any) => {
                            const skills = app.studentId?.skills || []
                            skills.forEach((skill: string) => {
                                skillCounts[skill] = (skillCounts[skill] || 0) + 1
                            })
                        })
                    } catch (e) { }
                }

                // Calculate stats
                const shortlisted = allApps.filter(a => a.status === 'shortlisted' || a.status === 'assessment_completed').length
                const hired = allApps.filter(a => a.status === 'accepted' || a.status === 'hired').length
                const pending = allApps.filter(a => a.status === 'pending').length
                const rejected = allApps.filter(a => a.status === 'rejected').length

                setStats({
                    totalApplications: allApps.length,
                    totalViews: internshipsData.reduce((sum: number, i: any) => sum + (i.views || 0), 0),
                    hired,
                    activeInternships: internshipsData.filter((i: any) => i.status === 'active').length
                })

                // Internship performance chart
                setInternshipPerformance(
                    internshipAppCounts
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5)
                        .map((item, idx) => ({
                            label: item.title,
                            value: item.count,
                            color: colors[idx % colors.length]
                        }))
                )

                // Conversion funnel
                setConversionFunnel([
                    { stage: 'Total Applications', count: allApps.length, percent: 100 },
                    { stage: 'Shortlisted', count: shortlisted, percent: allApps.length ? Math.round((shortlisted / allApps.length) * 100) : 0 },
                    { stage: 'Hired', count: hired, percent: shortlisted ? Math.round((hired / shortlisted) * 100) : 0 }
                ])

                // Top skills
                setTopSkillsApplied(
                    Object.entries(skillCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([skill, count]) => ({ skill, count }))
                )

                // Application trend (group by month)
                const monthCounts: Record<string, number> = {}
                allApps.forEach(app => {
                    const date = new Date(app.appliedAt)
                    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
                })

                const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
                    const dateA = new Date(a)
                    const dateB = new Date(b)
                    return dateA.getTime() - dateB.getTime()
                })

                setApplicationTrend(
                    sortedMonths.slice(-6).map(month => ({
                        label: month,
                        value: monthCounts[month]
                    }))
                )

            } catch (error) {
                console.error('Error fetching analytics:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (!authLoading && user && profile) {
            fetchAnalytics()
        }
    }, [profile, user, authLoading])

    if (authLoading || (isLoading && user)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto p-2 sm:p-3">
            {/* Header */}
            <div className="mb-6 flex flex-col items-center sm:flex-row justify-between gap-4">
                <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-2xl shadow-sm border border-purple-100/50 p-3 sm:px-4 sm:py-3 w-full sm:w-auto overflow-hidden relative group">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                            <BarChart3 size={20} className="fill-purple-400/20" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                                Analytics
                            </h1>
                            <p className="text-xs text-gray-600 font-medium">
                                Track your hiring performance and optimize your internship postings.
                            </p>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-100/50 rounded-full blur-2xl group-hover:bg-purple-100/80 transition-colors" />
                    <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-pink-100/50 rounded-full blur-2xl group-hover:bg-pink-100/80 transition-colors" />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <StatCard
                    title="Active Internships"
                    value={stats.activeInternships}
                    icon={Briefcase}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                    description="Currently hiring"
                />
                <StatCard
                    title="Applications"
                    value={stats.totalApplications}
                    icon={Users}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-100"
                    description="Total received"
                />
                <StatCard
                    title="Total Views"
                    value={stats.totalViews}
                    icon={Target}
                    iconColor="text-orange-600"
                    iconBg="bg-orange-100"
                    description="Across all internships"
                />
                <StatCard
                    title="Hired"
                    value={stats.hired}
                    icon={CheckCircle}
                    iconColor="text-green-600"
                    iconBg="bg-green-100"
                    description="Offers accepted"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {applicationTrend.length > 0 && (
                    <LineChart
                        title="Applications Over Time"
                        data={applicationTrend}
                        height={180}
                    />
                )}

                {/* Most Viewed Internships */}
                {internships.length > 0 ? (
                    <BarChart
                        title="Most Viewed Internships"
                        data={internships
                            .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
                            .slice(0, 5)
                            .map((intern: any, idx: number) => ({
                                label: intern.title.length > 20 ? intern.title.slice(0, 20) + '...' : intern.title,
                                value: intern.views || 0,
                                color: ['bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'][idx % 5]
                            }))}
                    />
                ) : (
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-center">
                        <p className="text-sm text-gray-500">No view data available</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Internship Performance */}
                {internshipPerformance.length > 0 ? (
                    <BarChart
                        title="Applications by Internship"
                        data={internshipPerformance}
                    />
                ) : (
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-semibold text-gray-900 mb-3">Applications by Internship</h3>
                        <p className="text-sm text-gray-500 text-center py-8">No data yet</p>
                    </div>
                )}

                {/* Conversion Funnel */}
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-900 mb-3">Hiring Funnel</h3>
                    {conversionFunnel.length > 0 && conversionFunnel[0].count > 0 ? (
                        <div className="space-y-3">
                            {conversionFunnel.map((item, index) => (
                                <div key={index} className="relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                                        <span className="text-sm text-gray-900 font-semibold">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                                            style={{ width: `${conversionFunnel[0].count > 0 ? (item.count / conversionFunnel[0].count) * 100 : 0}%` }}
                                        />
                                    </div>
                                    {index > 0 && (
                                        <span className="text-xs text-gray-500 mt-0.5 block">
                                            {item.percent}% conversion
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">No applications yet</p>
                    )}
                </div>

                {/* Top Skills */}
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-900 mb-3">Top Skills in Applications</h3>
                    {topSkillsApplied.length > 0 ? (
                        <div className="space-y-3">
                            {topSkillsApplied.map((item, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">{item.skill}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{item.count} applicants</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">No skills data yet</p>
                    )}
                </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <TrendingUp className="text-green-600" size={20} />
                    Quick Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="text-green-500" size={18} />
                            <h4 className="font-semibold text-gray-900 text-xs text-sm">Conversion Rate</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            {stats.totalApplications > 0
                                ? `${Math.round((stats.hired / stats.totalApplications) * 100)}% of applications converted to hires`
                                : 'Start receiving applications to see conversion rate'}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="text-blue-500" size={18} />
                            <h4 className="font-semibold text-gray-900 text-xs text-sm">Top Performing</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            {internshipPerformance.length > 0
                                ? `"${internshipPerformance[0].label}" has the most applications`
                                : 'Post internships to see performance data'}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="text-orange-500" size={18} />
                            <h4 className="font-semibold text-gray-900 text-xs text-sm">Tip</h4>
                        </div>
                        <p className="text-sm text-gray-600">Responding within 48 hours increases acceptance rate by 60%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
