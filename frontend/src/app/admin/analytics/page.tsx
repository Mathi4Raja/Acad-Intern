'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Briefcase, Building2, FileText, Download, TrendingDown, Clock, Globe, Zap, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
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
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-5">
      {/* Header - Compact & Premium */}
      {/* Ultra-Compact Premium Header Card */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-3.5 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group/header mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 group-hover:scale-105 transition-all duration-500">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1 className="text-[17px] font-black text-gray-900 leading-none tracking-tight uppercase">
              Platform Intelligence
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Live Real-Time performance metrics & forecasting
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Engine Live" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-100">
            {['7days', '30days', '3months'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                  timeRange === range ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {range.replace('days', 'd').replace('months', 'm')}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200 hover:-translate-y-0.5 active:translate-y-0">
            <Download size={12} />
            Export
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

      {/* Primary Trend Chart - Large & Clean */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 transition-all hover:shadow-xl hover:shadow-gray-100/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[15px] font-black text-gray-900 leading-none">Entity Acquisition Curve</h2>
            <p className="text-[11px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Growth across stakeholders</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Students</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Companies</span>
            </div>
          </div>
        </div>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={userGrowth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', padding: '12px' }}
                itemStyle={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}
                labelStyle={{ fontSize: '12px', fontWeight: '900', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="students"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorStudents)"
                name="Students"
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="companies"
                stroke="#A855F7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCompanies)"
                name="Companies"
                animationDuration={1500}
                animationBegin={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Internship Lifecycle - High Density */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <h2 className="text-[15px] font-black text-gray-900 mb-6 flex items-center justify-between">
            Inventory Health
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Distribution</span>
          </h2>
          <div className="space-y-5">
            {internshipStats.length > 0 ? (
              <div className="flex flex-col gap-4">
                {internshipStats.map((stat: any, index: number) => (
                  <div key={index} className="space-y-1.5 group">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">{stat.label}</span>
                      <span className="text-[13px] font-black text-gray-900">{stat.value} <span className="text-[10px] text-gray-400 font-bold ml-1">{stat.percentage}%</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-1000 group-hover:brightness-110"
                        style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-gray-400 font-bold text-[11px] uppercase tracking-widest">No structural data available</div>
            )}
          </div>
        </div>

        {/* Application Velocity Funnel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <h2 className="text-[15px] font-black text-gray-900 mb-6 flex items-center justify-between">
            Conversion Pipeline
            <TrendingUp size={16} className="text-emerald-500" />
          </h2>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {applicationFunnel.map((stage: any, index: number) => (
              <div key={index} className="group cursor-default">
                <div
                  className="p-2.5 rounded-xl border flex justify-between items-center transition-all group-hover:shadow-md group-hover:-translate-x-1"
                  style={{
                    backgroundColor: stage.stage === 'Total Applications' ? 'rgba(0,0,0,0.02)' : 'white',
                    borderColor: stage.stage === 'Total Applications' ? '#f1f5f9' : '#f8fafc',
                    marginLeft: `${index * 8}px`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-gray-900/5 flex items-center justify-center text-[10px] font-black text-gray-500">
                      {index + 1}
                    </div>
                    <span className="text-[12px] font-black text-gray-700 uppercase tracking-tight">{stage.stage}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-black text-gray-900">{stage.count}</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">{stage.percentage}%</span>
                  </div>
                </div>
                {index < applicationFunnel.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <div className="w-px h-3 bg-gray-100" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Companies - High Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[15px] font-black text-gray-900 leading-none">Market Leaders</h2>
            <p className="text-[11px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Top conversion by company</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 text-left">
                <th className="pb-3 px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                <th className="pb-3 px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Enterprise Entity</th>
                <th className="pb-3 px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Postings</th>
                <th className="pb-3 px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Inflow</th>
                <th className="pb-3 px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acquisition %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topCompanies && topCompanies.length > 0 ? topCompanies.map((company: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-3 px-3">
                    <span className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black shadow-sm",
                      index === 0 ? 'bg-amber-100/50 text-amber-600 ring-1 ring-amber-100' :
                        index === 1 ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-100' :
                          index === 2 ? 'bg-orange-100/50 text-orange-600 ring-1 ring-orange-100' : 'bg-gray-50 text-gray-400'
                    )}>
                      #0{index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                        {company.name.charAt(0)}
                      </div>
                      <p className="text-[13px] font-black text-gray-800">{company.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[12px] font-bold text-gray-600 text-right">{company.internships}</td>
                  <td className="py-3 px-3 text-[12px] font-black text-gray-900 text-right">{company.applications}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[12px] font-black text-emerald-600 px-2 py-1 rounded-md bg-emerald-50/50 border border-emerald-100">
                      {company.hiringRate}%
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">No market data available yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most In-Demand Skills - Redesigned */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <h2 className="text-[15px] font-black text-gray-900 mb-6 flex items-center justify-between">
            Talent Demand
            <Target size={16} className="text-red-500" />
          </h2>
          <div className="space-y-4">
            {skillsData && skillsData.map((item: any, index: number) => (
              <div key={index} className="space-y-2 group">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <span className="group-hover:text-gray-900 transition-colors">{item.skill}</span>
                  <span className="text-gray-400">{item.count} Active Roles</span>
                </div>
                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all duration-1000 group-hover:brightness-110"
                    style={{ width: `${(item.count / Math.max(...skillsData.map((s: any) => s.count))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {(!skillsData || skillsData.length === 0) && (
              <div className="text-center text-[11px] font-black text-gray-400 uppercase tracking-widest py-10">Low signal data</div>
            )}
          </div>
        </div>

        {/* Geographic Distribution - Redesigned */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <h2 className="text-[15px] font-black text-gray-900 mb-6 flex items-center justify-between">
            Regional Density
            <Globe size={16} className="text-blue-500" />
          </h2>
          <div className="space-y-4">
            {geographicData && geographicData.map((item: any, index: number) => (
              <div key={index} className="space-y-2 group">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <span className="group-hover:text-gray-900 transition-colors">{item.location}</span>
                  <span className="text-gray-900">{item.users} <span className="text-gray-400 lowercase italic ml-1">users</span></span>
                </div>
                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-1000 group-hover:brightness-110"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {(!geographicData || geographicData.length === 0) && (
              <div className="text-center text-[11px] font-black text-gray-400 uppercase tracking-widest py-10">Awaiting location telemetry</div>
            )}
          </div>
        </div>
      </div>

      {/* Activity by Day - Redesigned */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[15px] font-black text-gray-900 uppercase">Weekly Frequency</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inflow Traffic</span>
          </div>
        </div>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1' }} />
              <Tooltip
                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: '800' }}
              />
              <Area type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorActivity)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insights - Premium Dark Mode Style */}
      <div className="bg-gray-950 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-red-600/20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full -ml-24 -mb-24" />

        <h2 className="text-[15px] font-black text-white mb-8 flex items-center gap-3 relative z-10">
          <Zap size={18} className="text-amber-400 fill-amber-400" />
          STRATEGIC INTELLIGENCE
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.08] group/card">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Velocity Peak</p>
            <div className="text-lg font-black text-white group-hover/card:text-amber-400 transition-colors">{insights?.peakDay || 'N/A'}</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <p className="text-[10px] font-bold text-emerald-500">{insights?.peakDayCount} New Filings</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.08] group/card">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Core Demographic</p>
            <div className="text-lg font-black text-white group-hover/card:text-blue-400 transition-colors truncate" title={insights?.topLocation}>{insights?.topLocation || 'Global'}</div>
            <div className="flex items-center gap-2 mt-1">
              <Globe size={12} className="text-blue-500" />
              <p className="text-[10px] font-bold text-blue-500">{insights?.topLocationPct}% Saturation</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.08] group/card">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Dominant Stack</p>
            <div className="text-lg font-black text-white group-hover/card:text-purple-400 transition-colors truncate" title={insights?.topSkill}>{insights?.topSkill || 'N/A'}</div>
            <div className="flex items-center gap-2 mt-1">
              <Target size={12} className="text-purple-500" />
              <p className="text-[10px] font-bold text-purple-500">{insights?.topSkillCount} Opportunities</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.08] group/card">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Acquisition KPI</p>
            <div className="text-lg font-black text-white group-hover/card:text-emerald-400 transition-colors">{insights?.avgHiringRate || '0%'} Success</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Enterprise Standard</p>
            </div>
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
