'use client'

import { TrendingUp, Users, Briefcase, Building, AlertCircle, CheckCircle, XCircle, Clock, ArrowUp, ArrowDown, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

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

export default function AdminDashboard() {
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
        const date = new Date(dateString)
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'student':
                return 'bg-blue-100 text-blue-700'
            case 'company':
                return 'bg-purple-100 text-purple-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700'
            case 'pending':
                return 'bg-yellow-100 text-yellow-700'
            case 'inactive':
                return 'bg-gray-100 text-gray-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700'
            case 'medium':
                return 'bg-yellow-100 text-yellow-700'
            case 'low':
                return 'bg-blue-100 text-blue-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-3 sm:mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
                <p className="text-xs text-gray-600">Monitor and manage the AcadIntern platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                            <Users className="text-blue-600" size={14} />
                        </div>
                    </div>
                    <h3 className="text-[10px] font-medium text-gray-600 mb-0.5">Total Users</h3>
                    <p className="text-base sm:text-xl font-bold text-gray-900">{isLoading ? '-' : stats.totalUsers.toLocaleString()}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Briefcase className="text-primary" size={14} />
                        </div>
                    </div>
                    <h3 className="text-[10px] font-medium text-gray-600 mb-0.5">Active Internships</h3>
                    <p className="text-base sm:text-xl font-bold text-gray-900">{isLoading ? '-' : stats.activeInternships}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                        <div className="p-1.5 bg-purple-50 rounded-lg">
                            <Building className="text-purple-600" size={14} />
                        </div>
                    </div>
                    <h3 className="text-[10px] font-medium text-gray-600 mb-0.5">Companies</h3>
                    <p className="text-base sm:text-xl font-bold text-gray-900">{isLoading ? '-' : stats.totalCompanies}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                        <div className="p-1.5 bg-red-50 rounded-lg">
                            <AlertCircle className="text-red-600" size={14} />
                        </div>
                    </div>
                    <h3 className="text-[10px] font-medium text-gray-600 mb-0.5">Pending Reports</h3>
                    <p className="text-base sm:text-xl font-bold text-gray-900">{isLoading ? '-' : stats.pendingReports}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                {/* Recent Users */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="p-3 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Recent Users</h2>
                            <button className="text-xs sm:text-sm text-primary hover:text-primary font-medium">
                                View all
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentUsers.map((user) => (
                                <div key={user.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-0">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-0.5 truncate">{user.name}</h3>
                                            <p className="text-xs text-gray-600 mb-1.5 truncate">{user.email}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                <span className={`px-2 py-0.5 rounded-full font-semibold ${getRoleColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full font-semibold ${getStatusColor(user.status)}`}>
                                                    {user.status}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {user.joinedDate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Internships */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-3 sm:mt-6">
                        <div className="p-3 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Recent Internships</h2>
                            <button className="text-xs sm:text-sm text-primary hover:text-primary font-medium">
                                View all
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentInternships.map((internship) => (
                                <div key={internship.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">{internship.title}</h3>
                                            <p className="text-xs sm:text-sm text-gray-600 mb-2">{internship.company}</p>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                <span className={`px-2 py-0.5 rounded-full font-semibold ${getStatusColor(internship.status)}`}>
                                                    {internship.status}
                                                </span>
                                                <span>{formatDate(internship.postedDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pending Reports */}
                <div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="p-3 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">Pending Reports</h2>
                            <AlertCircle className="text-red-600" size={16} />
                        </div>
                        <div className="divide-y divide-gray-100">
                            {pendingReports.map((report) => (
                                <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-sm text-gray-900 flex-1 mr-2">{report.internshipTitle}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getPriorityColor(report.priority)}`}>
                                            {report.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{report.reason}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{report.reportedDate}</span>
                                        <button className="text-primary hover:text-primary font-medium">
                                            Review →
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendingReports.length === 0 && (
                                <div className="p-8 text-center">
                                    <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                                    <p className="text-sm text-gray-500">No pending reports</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-3 sm:mt-6 p-3 sm:p-5">
                        <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-3">Quick Actions</h3>
                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold">
                                <Users size={16} />
                                Manage Users
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-semibold">
                                <Building size={16} />
                                Verify Companies
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold">
                                <AlertCircle size={16} />
                                Review Reports
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
