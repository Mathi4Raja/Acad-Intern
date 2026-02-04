'use client'

import { Eye, Search, TrendingUp, Users, Briefcase, Target } from 'lucide-react'
import { StatCard, BarChart, LineChart, SkillMatchRadar } from '@/components/analytics'
import { PageHeader } from '@/components/common'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface AnalyticsData {
    profileViews: {
        total: number;
        trend: number;
        history: { label: string; value: number }[];
    };
    searchAppearances: {
        total: number;
        trend: number;
        history: { label: string; value: number }[];
    };
    applicationRate: {
        value: string;
        trend: number;
    };
    profileStrength: {
        value: string;
        trend: number;
    };
    topSkillsDemand: { label: string; value: number; color: string }[];
    skillMatch: { name: string; studentLevel: number; requiredLevel: number }[];
    companiesViewed: { name: string; views: number; date: string }[];
}

export default function StudentAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics/student');
                setData(res.data.data);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center py-10">No data available</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4">
            {/* Header */}
            <PageHeader
                title="Profile Analytics"
                subtitle="Track your visibility and optimize your profile for better matches"
            />

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <StatCard
                    title="Profile Views"
                    value={data.profileViews.total.toString()}
                    change={{
                        value: Math.abs(data.profileViews.trend),
                        type: data.profileViews.trend >= 0 ? 'increase' : 'decrease'
                    }}
                    icon={Eye}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                    description="Last 30 days"
                />
                <StatCard
                    title="Search Appearances"
                    value={data.searchAppearances.total.toString()}
                    change={{
                        value: Math.abs(data.searchAppearances.trend),
                        type: data.searchAppearances.trend >= 0 ? 'increase' : 'decrease'
                    }}
                    icon={Search}
                    iconColor="text-purple-600"
                    iconBg="bg-purple-100"
                    description="Last 30 days"
                />
                <StatCard
                    title="Application Rate"
                    value={data.applicationRate.value}
                    change={{
                        value: Math.abs(data.applicationRate.trend),
                        type: data.applicationRate.trend >= 0 ? 'increase' : 'decrease'
                    }}
                    icon={Target}
                    iconColor="text-green-600"
                    iconBg="bg-green-100"
                    description="Views to applications"
                />
                <StatCard
                    title="Profile Strength"
                    value={data.profileStrength.value}
                    change={{
                        value: Math.abs(data.profileStrength.trend),
                        type: data.profileStrength.trend >= 0 ? 'increase' : 'decrease'
                    }}
                    icon={TrendingUp}
                    iconColor="text-orange-600"
                    iconBg="bg-orange-100"
                    description="Profile completeness"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <LineChart
                    title="Profile Views (Last 7 Days)"
                    data={data.profileViews.history}
                    height={180}
                />
                <LineChart
                    title="Search Appearances (Last 4 Weeks)"
                    data={data.searchAppearances.history}
                    height={180}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Skills in Demand */}
                <BarChart
                    title="Your Top Skills in Demand"
                    data={data.topSkillsDemand}
                />

                {/* Skill Match Radar */}
                <SkillMatchRadar
                    title="Skill Match Analysis"
                    skills={data.skillMatch}
                />

                {/* Companies That Viewed */}
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Companies That Viewed Your Profile</h3>
                    <div className="space-y-3">
                        {data.companiesViewed.length > 0 ? (
                            data.companiesViewed.map((company, index) => (
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
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No views yet</p>
                        )}
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
