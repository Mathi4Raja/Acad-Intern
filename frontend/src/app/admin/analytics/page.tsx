'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Briefcase, Building2, FileText, Download, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';
import { StatCard } from '@/components/analytics/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/analytics?range=${timeRange}`);
        setData(res.data.data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  if (loading || !data) {
    return <AnalyticsSkeleton />;
  }

  const { overview, userGrowth, internshipStats, applicationFunnel, topCompanies, geographicData, skillsData, activityData, insights } = data;

  const overviewIcons = {
    totalUsers: Users,
    totalInternships: Briefcase,
    totalApplications: FileText,
    activeCompanies: Building2
  };

  const overviewColors = {
    totalUsers: 'blue',
    totalInternships: 'purple',
    totalApplications: 'green',
    activeCompanies: 'orange'
  };

  return (
    <div className="p-2 sm:p-3 max-w-7xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight flex items-center gap-2">
            <BarChart3 className="text-red-600" size={24} />
            Analytics & Insights
          </h1>
          <p className="text-xs text-gray-600 font-medium mt-1">Platform performance and trends</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
            <Download size={16} />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatCard
          title="Total Users"
          value={overview.totalUsers?.toLocaleString() || 0}
          change={{ value: Math.abs(Number(overview.userGrowth)), type: Number(overview.userGrowth) >= 0 ? 'increase' : 'decrease' }}
          icon={Users}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Total Internships"
          value={overview.totalInternships?.toLocaleString() || 0}
          change={{ value: Math.abs(Number(overview.internshipGrowth)), type: Number(overview.internshipGrowth) >= 0 ? 'increase' : 'decrease' }}
          icon={Briefcase}
          iconColor="text-purple-500"
          iconBg="bg-purple-50"
        />
        <StatCard
          title="Total Applications"
          value={overview.totalApplications?.toLocaleString() || 0}
          change={{ value: Math.abs(Number(overview.applicationGrowth)), type: Number(overview.applicationGrowth) >= 0 ? 'increase' : 'decrease' }}
          icon={FileText}
          iconColor="text-green-500"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Active Companies"
          value={overview.activeCompanies?.toLocaleString() || 0}
          change={{ value: Math.abs(Number(overview.companyGrowth)), type: Number(overview.companyGrowth) >= 0 ? 'increase' : 'decrease' }}
          icon={Building2}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
        />
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <h2 className="text-base font-bold text-gray-900 mb-1">User Growth Trend</h2>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={userGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="students" stroke="#3B82F6" fillOpacity={1} fill="url(#colorStudents)" name="Students" />
              <Area type="monotone" dataKey="companies" stroke="#A855F7" fillOpacity={1} fill="url(#colorCompanies)" name="Companies" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Internship Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <h2 className="text-base font-bold text-gray-900 mb-1">Internship Statistics</h2>
          <div className="mt-2 text-xs">
            {internshipStats.length > 0 ? (
              <div className="flex flex-col space-y-3">
                {internshipStats.map((stat: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">{stat.label}</span>
                      <span className="text-gray-900 font-bold">{stat.value} ({stat.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 text-gray-400">No internship data available</div>
            )}
          </div>
        </div>

        {/* Application Funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <h2 className="text-base font-bold text-gray-900 mb-1">Application Funnel</h2>
          <div className="h-[200px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-2">
              {applicationFunnel.map((stage: any, index: number) => (
                <div key={index} className="relative">
                  <div
                    className={`p-2 rounded-lg text-white flex justify-between items-center transition-all hover:scale-[1.01]`}
                    style={{
                      backgroundColor: stage.stage === 'Total Applications' ? '#EF4444' : `rgba(239, 68, 68, ${Math.max(0.3, 1 - (index * 0.12))})`,
                      marginLeft: `${index * 6}px`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                      <span className="font-medium">{stage.stage}</span>
                    </div>
                    <span className="font-bold text-base">{stage.count} <span className="text-[10px] font-normal opacity-80">({stage.percentage}%)</span></span>
                  </div>
                  {index < applicationFunnel.length - 1 && (
                    <div className="text-xs text-center text-gray-400 py-1 pl-8">
                      ↓ {index === 0 ? '50.0% conversion' : `${(stage.percentage * 0.85).toFixed(1)}% conversion`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Companies Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <h2 className="text-base font-bold text-gray-900 mb-1">Top Performing Companies</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Internships</th>
                <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Applications</th>
                <th className="py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Hiring Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topCompanies && topCompanies.length > 0 ? topCompanies.map((company: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                      }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm font-medium text-gray-900">{company.name}</td>
                  <td className="py-2 px-3 text-sm text-gray-600 text-right">{company.internships}</td>
                  <td className="py-2 px-3 text-sm font-bold text-gray-900 text-right">{company.applications}</td>
                  <td className="py-2 px-3 text-sm text-green-600 font-medium text-right">{company.hiringRate}%</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most In-Demand Skills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <h2 className="text-base font-bold text-gray-900 mb-2">Most In-Demand Skills</h2>
          <div className="space-y-4">
            {skillsData && skillsData.map((item: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.skill}</span>
                  <span className="text-gray-500 text-xs">{item.count} internships</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-1000"
                    style={{ width: `${(item.count / Math.max(...skillsData.map((s: any) => s.count))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {(!skillsData || skillsData.length === 0) && (
              <div className="text-center text-gray-500 text-sm py-8">No skills data available</div>
            )}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <h2 className="text-base font-bold text-gray-900 mb-2">Geographic Distribution</h2>
          <div className="space-y-4">
            {geographicData && geographicData.map((item: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.location}</span>
                  <span className="text-gray-900 font-bold">{item.users} <span className="text-xs text-gray-500 font-normal">({item.percentage}%)</span></span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {(!geographicData || geographicData.length === 0) && (
              <div className="text-center text-gray-500 text-sm py-8">No location data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Activity by Day */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gray-900">Activity by Day of Week</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Applications</span>
          </div>
        </div>
        <div className="h-[150px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="applications" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insights Cards */}
      <div className="bg-red-50/50 rounded-xl border border-red-100 p-2">
        <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <TrendingUp size={18} className="text-red-500" /> Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-red-100">
            <div className="text-[10px] text-gray-500 mb-0.5">Peak Activity Day</div>
            <div className="text-base font-bold text-gray-900">{insights?.peakDay || 'N/A'}</div>
            <div className="text-[10px] text-green-600 mt-0.5">{insights?.peakDayCount} applications</div>
          </div>
          <div className="bg-white p-2 rounded-lg shadow-sm border border-red-100">
            <div className="text-[10px] text-gray-500 mb-0.5">Most Popular Location</div>
            <div className="text-base font-bold text-gray-900 truncate" title={insights?.topLocation}>{insights?.topLocation || 'N/A'}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">{insights?.topLocationPct}% users</div>
          </div>
          <div className="bg-white p-2 rounded-lg shadow-sm border border-red-100">
            <div className="text-[10px] text-gray-500 mb-0.5">Top Skill</div>
            <div className="text-base font-bold text-gray-900 truncate" title={insights?.topSkill}>{insights?.topSkill || 'N/A'}</div>
            <div className="text-[10px] text-purple-600 mt-0.5">{insights?.topSkillCount} internships</div>
          </div>
          <div className="bg-white p-2 rounded-lg shadow-sm border border-red-100">
            <div className="text-[10px] text-gray-500 mb-0.5">Avg Hiring Rate</div>
            <div className="text-base font-bold text-gray-900">{insights?.avgHiringRate || '0%'}</div>
            <div className="text-[10px] text-red-500 mt-0.5">Top 5 companies</div>
          </div>
        </div>
      </div>

    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-[350px] rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  );
}
