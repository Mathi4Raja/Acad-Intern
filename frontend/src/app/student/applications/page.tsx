'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Filter, Search, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { Application, ApplicationStatus } from '@/types'
import ApplicationCard from '@/components/applications/ApplicationCard'
import { PageHeader } from '@/components/common'

// Utility function to format dates consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function ApplicationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setError(null)
        const response = await api.get('/applications/my')
        if (response.data.success) {
          const formatted: Application[] = response.data.data.map((app: any) => ({
            id: app._id,
            internshipId: app.internshipId?._id,
            internshipTitle: app.internshipId?.title || 'Unknown Position',
            company: app.internshipId?.companyId?.companyName || 'Unknown Company',
            companyUserId: app.internshipId?.companyId?.userId,
            // logo logic moved to CompanyLogo component
            logo: '',
            status: app.status as ApplicationStatus,
            appliedDate: app.appliedAt,
            lastUpdate: app.updatedAt,
            location: app.internshipId?.location || 'Remote',
            stipend: `₹${app.internshipId?.stipend || 0}/mo`,
            duration: `${app.internshipId?.durationWeeks || 0} weeks`,
            notes: app.notes || null
          }))
          setApplications(formatted)
        }
      } catch (err: any) {
        console.error('Failed to fetch applications:', err)
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    shortlisted: applications.filter(app => app.status === 'shortlisted').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus
    const matchesSearch = searchQuery === '' ||
      app.internshipTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Stable handler for filter change
  const handleFilterChange = useCallback((status: string) => {
    setFilterStatus(status)
  }, [])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <PageHeader
        title="My Applications"
        subtitle="Track and manage all your internship applications in one place."
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Stats Cards / Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { id: 'all', label: 'Total Applications', count: statusCounts.all, color: 'text-gray-900', border: 'border-primary', ring: 'ring-primary/20' },
          { id: 'pending', label: 'Pending', count: statusCounts.pending, color: 'text-yellow-600', border: 'border-yellow-500', ring: 'ring-yellow-100' },
          { id: 'shortlisted', label: 'Shortlisted', count: statusCounts.shortlisted, color: 'text-green-600', border: 'border-green-500', ring: 'ring-green-100' },
          { id: 'accepted', label: 'Accepted', count: statusCounts.accepted, color: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-100' },
          { id: 'rejected', label: 'Rejected', count: statusCounts.rejected, color: 'text-red-600', border: 'border-red-500', ring: 'ring-red-100' },
        ].map((stat) => (
          <button
            key={stat.id}
            onClick={() => handleFilterChange(stat.id)}
            className={`
              relative overflow-hidden rounded-xl p-3 text-left transition-all duration-200 group
              ${filterStatus === stat.id
                ? 'bg-white shadow-md ring-1 ring-primary border-primary'
                : 'bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200'}
            `}
          >
            <div className={`mb-0.5 text-xl font-bold ${stat.color} leading-tight`}>{stat.count}</div>
            <div className="text-xs font-medium text-gray-500 group-hover:text-gray-700">{stat.label}</div>

            {/* Active Indicator */}
            {filterStatus === stat.id && (
              <div className="absolute right-0 top-0 h-full w-1 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company or position..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Filter className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">
              {filterStatus === 'all'
                ? "You haven't applied to any internships yet."
                : `No applications with status "${filterStatus}".`}
            </p>
            <Link
              href="/student/internships"
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Browse Internships
            </Link>
          </div>
        ) : (
          filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  )
}
