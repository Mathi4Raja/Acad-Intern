'use client'

import { TrendingUp, Users, Briefcase, Building, AlertCircle, CheckCircle, XCircle, Clock, ArrowUp, ArrowDown, Eye, ChevronRight, Home, Shield, Activity } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'
import { StatCard } from '@/components/analytics/StatCard'

interface DashboardStats {
    totalUsers: number
    totalStudents: number
    totalCompanies: number
    totalInternships: number
    activeInternships: number
    pendingReports: number
}

interface RecentUser {
    id: string
    name: string
    email: string
    role: string
    status: string
    joinedDate: string
}

interface RecentInternship {
    id: string
    title: string
    company: string
    postedDate: string
    status: string
}

interface PendingReport {
    id: string
    internshipTitle: string
    reportedBy: string
    reason: string
    reportedDate: string
    priority: string
    status: string
}

function AdminDashboardContent() {
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalStudents: 0,
        totalCompanies: 0,
        totalInternships: 0,
        activeInternships: 0,
        pendingReports: 0
    })
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
    const [recentInternships, setRecentInternships] = useState<RecentInternship[]>([])
    const [pendingReports, setPendingReports] = useState<PendingReport[]>([])

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/admin/stats')
                const data = res.data.data

                setStats(data.stats)
                setRecentUsers(data.recentUsers || [])
                setRecentInternships(data.recentInternships || [])
                setPendingReports(data.pendingReports || [])
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    const formatDate = (dateString: string) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'student': return 'bg-blue-100 text-blue-700'
            case 'company': return 'bg-purple-100 text-purple-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700'
            case 'pending': return 'bg-yellow-100 text-yellow-700'
            case 'inactive': return 'bg-gray-100 text-gray-700'
            case 'suspended': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700'
            case 'medium': return 'bg-yellow-100 text-yellow-700'
            case 'low': return 'bg-blue-100 text-blue-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    if (isLoading) {
        return (
            <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-96 lg:col-span-2 rounded-lg" />
                    <Skeleton className="h-96 rounded-lg" />
                </div>
            </div>
        )
    }

    return (
        <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-5">
            <div className="space-y-6">
                {/* Ultra-Compact Premium Header Card */}
                <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-2.5 sm:p-3 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group/header mb-2">
                    {/* Background Glow Effect */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover/header:bg-primary/10 transition-colors duration-700" />
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover/header:bg-blue-500/10 transition-colors duration-700" />

                    <div className="relative flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover/header:scale-110 group-hover/header:rotate-6 transition-all duration-500 shadow-lg shadow-gray-200">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-green-500 border-2 border-white flex items-center justify-center animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-[15px] font-black text-gray-900 leading-none tracking-tight uppercase">
                                Admin Dashboard
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                    System activity and overview
                                </p>
                                <div className="h-1 w-1 rounded-full bg-gray-300" />
                                <div className="flex items-center gap-1">
                                    <Activity className="w-3 h-3 text-green-500" />
                                    <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">System Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 relative z-10 w-full sm:w-auto">
                        <div className="flex flex-col items-end px-3 py-1.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Last Sync</span>
                            <span className="text-[10px] font-black text-gray-700 uppercase">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary transition-colors cursor-pointer shadow-sm">
                            <Shield size={16} />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 mt-2">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers.toLocaleString()}
                        change={{ value: 12, type: 'increase' }}
                        icon={Users}
                        iconColor="text-blue-600"
                        iconBg="bg-blue-50"
                        href="/admin/users"
                    />

                    <StatCard
                        title="Active Posts"
                        value={stats.activeInternships.toLocaleString()}
                        change={{ value: 5, type: 'increase' }}
                        icon={Briefcase}
                        iconColor="text-primary"
                        iconBg="bg-primary/5"
                        href="/admin/internships?status=active"
                    />

                    <StatCard
                        title="Verified Companies"
                        value={stats.totalCompanies.toLocaleString()}
                        icon={Building}
                        iconColor="text-purple-600"
                        iconBg="bg-purple-50"
                        href="/admin/companies"
                    />

                    <StatCard
                        title="Reports"
                        value={stats.pendingReports}
                        icon={AlertCircle}
                        iconColor="text-red-500"
                        iconBg="bg-red-50"
                        href="/admin/reports"
                        className={stats.pendingReports > 0 ? "border-red-100 bg-red-50/10" : ""}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Main Content Areas */}
                    <div className="lg:col-span-8 space-y-5">
                        {/* Recent Registrations - Side Column Pattern */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group/card transition-all hover:shadow-xl hover:shadow-gray-100/50">
                            <div className="px-4 py-4 border-b border-gray-50 flex items-center justify-between bg-white">
                                <div>
                                    <h2 className="text-[17px] font-black text-gray-900 leading-none">Recent Onboarding</h2>
                                    <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">New users in last 24h</p>
                                </div>
                                <Link href="/admin/users" className="text-[11px] font-black text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 border border-transparent hover:border-primary/10">
                                    EXPLORE <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {recentUsers.length > 0 ? recentUsers.map((user) => (
                                    <div key={user.id} className="p-3 sm:p-4 hover:bg-gray-50/30 transition-all group/item">
                                        <div className="flex gap-4">
                                            {/* Side Column Icon */}
                                            <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 font-black text-sm group-hover/item:bg-white group-hover/item:shadow-md group-hover/item:border-primary/20 transition-all shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <h3 className="text-[15px] font-black text-gray-900 truncate tracking-tight">{user.name}</h3>
                                                    <p className="text-[11px] font-bold text-gray-400 truncate uppercase mt-0.5 tracking-tighter">{user.email}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="flex items-center gap-2 justify-end mb-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                                                            user.role === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                                                        )}>
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{formatDate(user.joinedDate)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center text-gray-400 text-[11px] font-black uppercase tracking-widest italic opacity-50">No entry records</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Internships - Side Column Pattern */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group/card transition-all hover:shadow-xl hover:shadow-gray-100/50">
                            <div className="px-4 py-4 border-b border-gray-50 flex items-center justify-between bg-white">
                                <div>
                                    <h2 className="text-[17px] font-black text-gray-900 leading-none">Fresh Opportunities</h2>
                                    <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Active market listings</p>
                                </div>
                                <Link href="/admin/internships" className="text-[11px] font-black text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 border border-transparent hover:border-primary/10">
                                    MANAGE <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {recentInternships.length > 0 ? recentInternships.map((internship) => (
                                    <div key={internship.id} className="p-3 sm:p-4 hover:bg-gray-50/30 transition-all group/item">
                                        <div className="flex gap-4">
                                            {/* Side Column Icon */}
                                            <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 group-hover/item:bg-white group-hover/item:shadow-md group-hover/item:border-primary/20 transition-all shrink-0 shadow-sm">
                                                <Briefcase size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0 flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <h3 className="text-[15px] font-black text-gray-900 truncate tracking-tight mb-0.5" title={internship.title}>{internship.title}</h3>
                                                    <div className="flex items-center gap-1.5">
                                                        <Building size={10} className="text-gray-400" />
                                                        <p className="text-[11px] font-bold text-gray-500 truncate uppercase tracking-tighter">{internship.company}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="flex items-center gap-2 justify-end mb-1">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                                                            internship.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                                                        )}>
                                                            {internship.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{formatDate(internship.postedDate)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center text-gray-400 text-[11px] font-black uppercase tracking-widest italic opacity-50">No market activity</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Areas */}
                    <div className="lg:col-span-4 space-y-5">
                        {/* Pending Reports Widget - Enriched */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex transition-all hover:shadow-xl hover:shadow-red-900/[0.02]">
                            <div className="w-1 bg-red-500 shrink-0" />
                            <div className="flex-1">
                                <div className="px-4 py-4 border-b border-gray-50 flex items-center justify-between bg-white">
                                    <div>
                                        <h2 className="text-[17px] font-black text-gray-900 leading-none">Security Feed</h2>
                                        <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Awaiting moderation</p>
                                    </div>
                                    <div className="relative">
                                        <AlertCircle className="text-red-500/20" size={20} />
                                        {pendingReports.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-ping" />
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {pendingReports.length > 0 ? pendingReports.map((report) => (
                                        <div key={report.id} className="p-4 hover:bg-red-50/10 transition-colors group/report">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3 className="font-black text-[13px] text-gray-900 line-clamp-1 group-hover/report:text-red-600 transition-colors">{report.internshipTitle}</h3>
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0",
                                                    report.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100 shadow-sm' : 'bg-orange-50 text-orange-600 border-orange-100'
                                                )}>
                                                    {report.priority}
                                                </span>
                                            </div>
                                            <div className="text-[11px] font-bold text-gray-500 mb-3 line-clamp-2 italic leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 group-hover/report:bg-white group-hover/report:border-red-100 transition-all">
                                                "{report.reason}"
                                            </div>
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <Clock size={10} className="text-gray-400" />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{formatDate(report.reportedDate)}</span>
                                                </div>
                                                <Link href="/admin/reports" className="text-[11px] font-black text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg uppercase tracking-widest transition-all border border-transparent hover:border-red-100">
                                                    RESOLVE
                                                </Link>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-12 text-center">
                                            <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm shadow-emerald-100/50">
                                                <CheckCircle size={32} />
                                            </div>
                                            <p className="text-[13px] font-black text-gray-900 uppercase tracking-widest mb-1">Grid Secured</p>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">System health nominal</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Access Menu */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 min-h-[400px]">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Quick Access</h3>
                            <div className="grid grid-cols-1 gap-2.5">
                                <Link href="/admin/users" className="flex items-center gap-3 p-3 bg-blue-50/10 border border-blue-100/20 rounded-xl hover:bg-blue-50/30 transition-all group">
                                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <Users size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors">Users Registry</span>
                                        <span className="text-[10px] font-bold text-gray-400">Moderation & Approval</span>
                                    </div>
                                    <ChevronRight className="text-gray-300" size={14} />
                                </Link>

                                <Link href="/admin/companies" className="flex items-center gap-3 p-3 bg-purple-50/20 border border-purple-100/20 rounded-xl hover:bg-purple-50/40 transition-all group">
                                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <Building size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-xs font-black text-gray-900 group-hover:text-purple-600 transition-colors">Company Hub</span>
                                        <span className="text-[10px] font-bold text-gray-400">Verification Center</span>
                                    </div>
                                    <ChevronRight className="text-gray-300" size={14} />
                                </Link>

                                <Link href="/admin/settings" className="flex items-center gap-3 p-3 bg-emerald-50/20 border border-emerald-100/20 rounded-xl hover:bg-emerald-50/40 transition-all group">
                                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <Clock size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-xs font-black text-gray-900 group-hover:text-emerald-600 transition-colors">System Settings</span>
                                        <span className="text-[10px] font-bold text-gray-400">Config & Performance</span>
                                    </div>
                                    <ChevronRight className="text-gray-300" size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AdminDashboard() {
    return (
        <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}>
            <AdminDashboardContent />
        </Suspense>
    )
}
