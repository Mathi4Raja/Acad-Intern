'use client'

import { TrendingUp, Users, Briefcase, Building, AlertCircle, CheckCircle, XCircle, Clock, ArrowUp, ArrowDown, Eye, ChevronRight } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import api from '@/lib/api'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

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
        <div className="p-3 sm:p-4 max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
                    <p className="text-sm text-gray-600">Overview of platform performance and activities</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md border border-gray-200">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <Link href="/admin/users?role=student" className="block group">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer h-full">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Users size={18} />
                            </div>
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <TrendingUp size={12} className="mr-1" /> +12%
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
                        <p className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{stats.totalUsers.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">{stats.totalStudents} students • {stats.totalCompanies} companies</p>
                    </div>
                </Link>

                <Link href="/admin/internships" className="block group">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer h-full">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Briefcase size={18} />
                            </div>
                            <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <TrendingUp size={12} className="mr-1" /> +5%
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Active Internships</h3>
                        <p className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{stats.activeInternships.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">out of {stats.totalInternships} total posted</p>
                    </div>
                </Link>

                <Link href="/admin/users?verified=false" className="block group">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 transition-all hover:shadow-md hover:border-primary/50 cursor-pointer h-full">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                                <Building size={18} />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Companies</h3>
                        <p className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{stats.totalCompanies.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">Partnered with AcadIntern</p>
                    </div>
                </Link>

                <Link href="/admin/reports" className="block group">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 transition-all hover:shadow-md hover:border-red-300 cursor-pointer h-full">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
                                <AlertCircle size={18} />
                            </div>
                            {stats.pendingReports > 0 && (
                                <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">
                                    Action Required
                                </span>
                            )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Reports</h3>
                        <p className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">{stats.pendingReports}</p>
                        <p className="text-xs text-gray-400 mt-1">Requires moderation</p>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Recent Users */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-base font-bold text-gray-900">Recent Registrations</h2>
                            <Link href="/admin/users" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                                View all <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentUsers.length > 0 ? recentUsers.map((user) => (
                                <div key={user.id} className="p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900">{user.name}</h3>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                            <span className="text-xs text-gray-400">{formatDate(user.joinedDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-gray-500 text-sm">No recent users</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Internships */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-base font-bold text-gray-900">Recently Posted Internships</h2>
                            <Link href="/admin/internships" className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                                View all <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentInternships.length > 0 ? recentInternships.map((internship) => (
                                <div key={internship.id} className="p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{internship.title}</h3>
                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                <Building size={12} /> {internship.company}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(internship.status)}`}>
                                                {internship.status}
                                            </span>
                                            <span className="text-xs text-gray-400">{formatDate(internship.postedDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-gray-500 text-sm">No recent internships</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Pending Reports & Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
                            <h2 className="text-base font-bold text-gray-900">Pending Reports</h2>
                            <AlertCircle className="text-red-500" size={18} />
                        </div>
                        <div className="divide-y divide-gray-100">
                            {pendingReports.length > 0 ? pendingReports.map((report) => (
                                <div key={report.id} className="p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mr-2">{report.internshipTitle}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(report.priority)}`}>
                                            {report.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2 bg-gray-50 p-2 rounded border border-gray-100 italic">"{report.reason}"</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{formatDate(report.reportedDate)}</span>
                                        <button className="text-primary hover:text-primary/80 font-medium text-xs">Review</button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center">
                                    <CheckCircle className="mx-auto text-green-500 mb-2 opacity-20" size={32} />
                                    <p className="text-sm text-gray-500">All caught up! No pending reports.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                        <h3 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link href="/admin/users" className="flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 group">
                                <div className="bg-white p-2 rounded-md shadow-sm text-blue-600 group-hover:text-blue-700">
                                    <Users size={18} />
                                </div>
                                <span className="font-medium text-sm">Manage Users</span>
                            </Link>
                            <Link href="/admin/companies" className="flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 group">
                                <div className="bg-white p-2 rounded-md shadow-sm text-purple-600 group-hover:text-purple-700">
                                    <Building size={18} />
                                </div>
                                <span className="font-medium text-sm">Verify Companies</span>
                            </Link>
                            <Link href="/admin/reports" className="flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 group">
                                <div className="bg-white p-2 rounded-md shadow-sm text-red-600 group-hover:text-red-700">
                                    <AlertCircle size={18} />
                                </div>
                                <span className="font-medium text-sm">Review Reports</span>
                            </Link>
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
