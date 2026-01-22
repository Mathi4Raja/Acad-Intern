'use client'

import { Eye, Search, TrendingUp, Users, Briefcase, Target } from 'lucide-react'
import { StatCard, BarChart, LineChart, SkillMatchRadar } from '@/components/analytics'
import Link from 'next/link'

export default function StudentAnalyticsPage() {
    // Mock analytics data
    const profileViews = [
        { label: 'Mon', value: 12 },
        { label: 'Tue', value: 18 },
        { label: 'Wed', value: 15 },
        { label: 'Thu', value: 25 },
        { label: 'Fri', value: 22 },
        { label: 'Sat', value: 8 },
        { label: 'Sun', value: 5 }
    ]

    const searchAppearances = [
        { label: 'Week 1', value: 45 },
        { label: 'Week 2', value: 62 },
        { label: 'Week 3', value: 78 },
        { label: 'Week 4', value: 95 }
    ]

    const topSkillsDemand = [
        { label: 'React', value: 89, color: 'bg-blue-500' },
        { label: 'TypeScript', value: 76, color: 'bg-purple-500' },
        { label: 'Node.js', value: 68, color: 'bg-green-500' },
        { label: 'Python', value: 54, color: 'bg-yellow-500' },
        { label: 'MongoDB', value: 42, color: 'bg-red-500' }
    ]

    const skillMatch = [
        { name: 'React', studentLevel: 85, requiredLevel: 80 },
        { name: 'TypeScript', studentLevel: 70, requiredLevel: 75 },
        { name: 'Node.js', studentLevel: 65, requiredLevel: 70 },
        { name: 'CSS', studentLevel: 90, requiredLevel: 60 },
        { name: 'SQL', studentLevel: 55, requiredLevel: 65 }
    ]

    const companiesViewed = [
        { name: 'TechCorp Solutions', views: 5, date: '2 hours ago' },
        { name: 'Digital Innovations', views: 3, date: '5 hours ago' },
        { name: 'CloudBase Systems', views: 2, date: 'Yesterday' },
        { name: 'Analytics Pro', views: 1, date: '2 days ago' }
    ]

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Profile Analytics</h1>
                <p className="text-sm sm:text-base text-gray-600">Track your visibility and optimize your profile for better matches</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Profile Views"
                    value="105"
                    change={{ value: 23, type: 'increase' }}
                    icon={Eye}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                    description="Last 30 days"
                />
                <StatCard
                    title="Search Appearances"
                    value="280"
                    change={{ value: 15, type: 'increase' }}
                    icon={Search}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-100"
                    description="Last 30 days"
                />
                <StatCard
                    title="Application Rate"
                    value="8.5%"
                    change={{ value: 5, type: 'increase' }}
                    icon={Target}
                    iconColor="text-green-600"
                    iconBg="bg-green-100"
                    description="Views to applications"
                />
                <StatCard
                    title="Profile Strength"
                    value="85%"
                    change={{ value: 10, type: 'increase' }}
                    icon={TrendingUp}
                    iconColor="text-orange-600"
                    iconBg="bg-orange-100"
                    description="Complete your profile"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <LineChart
                    title="Profile Views (Last 7 Days)"
                    data={profileViews}
                    height={180}
                />
                <LineChart
                    title="Search Appearances (Last 4 Weeks)"
                    data={searchAppearances}
                    height={180}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Skills in Demand */}
                <BarChart
                    title="Your Top Skills in Demand"
                    data={topSkillsDemand}
                />

                {/* Skill Match Radar */}
                <SkillMatchRadar
                    title="Skill Match Analysis"
                    skills={skillMatch}
                />

                {/* Companies That Viewed */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Companies That Viewed Your Profile</h3>
                    <div className="space-y-3">
                        {companiesViewed.map((company, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                                        {company.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{company.name}</p>
                                        <p className="text-xs text-gray-500">{company.date}</p>
                                    </div>
                                </div>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                                    {company.views} {company.views === 1 ? 'view' : 'views'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Optimization Tips */}
            <div className="bg-gradient-to-r from-primary/5 to-purple-100/50 rounded-xl p-6 border border-primary/10">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    Profile Optimization Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">Add More Skills</h4>
                        <p className="text-sm text-gray-600 mb-3">Profiles with 5+ skills get 40% more views</p>
                        <Link href="/student/profile" className="text-sm text-primary font-medium hover:underline">
                            Update Skills →
                        </Link>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">Upload Resume</h4>
                        <p className="text-sm text-gray-600 mb-3">Complete your profile with an updated resume</p>
                        <Link href="/student/profile" className="text-sm text-primary font-medium hover:underline">
                            Upload Resume →
                        </Link>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">Write a Bio</h4>
                        <p className="text-sm text-gray-600 mb-3">Tell companies about your interests and goals</p>
                        <Link href="/student/profile" className="text-sm text-primary font-medium hover:underline">
                            Add Bio →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
