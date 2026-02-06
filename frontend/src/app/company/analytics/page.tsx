'use client'

import { Users, Briefcase, Eye, TrendingUp, Target, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react'
import { StatCard, BarChart, LineChart } from '@/components/analytics'

export default function CompanyAnalyticsPage() {
    // Mock analytics data
    const applicationTrend = [
        { label: 'Jan', value: 45 },
        { label: 'Feb', value: 62 },
        { label: 'Mar', value: 58 },
        { label: 'Apr', value: 85 },
        { label: 'May', value: 92 },
        { label: 'Jun', value: 78 }
    ]

    const viewsTrend = [
        { label: 'Week 1', value: 234 },
        { label: 'Week 2', value: 312 },
        { label: 'Week 3', value: 289 },
        { label: 'Week 4', value: 356 }
    ]

    const internshipPerformance = [
        { label: 'Frontend Developer', value: 45, color: 'bg-blue-500' },
        { label: 'Backend Developer', value: 38, color: 'bg-green-500' },
        { label: 'Data Science', value: 32, color: 'bg-purple-500' },
        { label: 'UI/UX Designer', value: 28, color: 'bg-pink-500' },
        { label: 'Mobile Dev', value: 22, color: 'bg-orange-500' }
    ]

    const conversionFunnel = [
        { stage: 'Views', count: 1250, percent: 100 },
        { stage: 'Applications', count: 128, percent: 10.2 },
        { stage: 'Shortlisted', count: 32, percent: 25 },
        { stage: 'Interviewed', count: 18, percent: 56.3 },
        { stage: 'Hired', count: 8, percent: 44.4 }
    ]

    const topSkillsApplied = [
        { skill: 'React', count: 45 },
        { skill: 'Python', count: 38 },
        { skill: 'Node.js', count: 32 },
        { skill: 'TypeScript', count: 28 },
        { skill: 'MongoDB', count: 22 }
    ]

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
                    title="Total Views"
                    value="1,250"
                    change={{ value: 18, type: 'increase' }}
                    icon={Eye}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                    description="Last 30 days"
                />
                <StatCard
                    title="Applications"
                    value="128"
                    change={{ value: 24, type: 'increase' }}
                    icon={Users}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-100"
                    description="Last 30 days"
                />
                <StatCard
                    title="Hired"
                    value="8"
                    change={{ value: 33, type: 'increase' }}
                    icon={CheckCircle}
                    iconColor="text-green-600"
                    iconBg="bg-green-100"
                    description="Last 30 days"
                />
                <StatCard
                    title="Avg. Time to Hire"
                    value="12 days"
                    change={{ value: 8, type: 'decrease' }}
                    icon={Clock}
                    iconColor="text-orange-600"
                    iconBg="bg-orange-100"
                    description="Getting faster!"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <LineChart
                    title="Applications Over Time"
                    data={applicationTrend}
                    height={180}
                />
                <LineChart
                    title="Listing Views (Last 4 Weeks)"
                    data={viewsTrend}
                    height={180}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Internship Performance */}
                <BarChart
                    title="Applications by Internship"
                    data={internshipPerformance}
                />

                {/* Conversion Funnel */}
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-900 mb-3">Hiring Funnel</h3>
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
                                        style={{ width: `${(item.count / conversionFunnel[0].count) * 100}%` }}
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
                </div>

                {/* Top Skills */}
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-900 mb-3">Top Skills in Applications</h3>
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
                            <h4 className="font-semibold text-gray-900 text-xs text-sm">High Demand</h4>
                        </div>
                        <p className="text-sm text-gray-600">Frontend Developer posts get 40% more applications than average</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="text-blue-500" size={18} />
                            <h4 className="font-semibold text-gray-900 text-xs text-sm">Best Posting Day</h4>
                        </div>
                        <p className="text-sm text-gray-600">Monday posts receive 25% more views in the first week</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="text-orange-500" size={18} />
                            <h4 className="font-semibold text-gray-900 text-xs text-sm">Response Time</h4>
                        </div>
                        <p className="text-sm text-gray-600">Responding within 48 hours increases acceptance rate by 60%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
