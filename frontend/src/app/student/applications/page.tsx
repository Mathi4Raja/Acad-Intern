'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Filter, Search, Calendar, Building, MessageCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

// Utility function to format dates consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

interface Application {
  id: string
  internshipId: string
  internshipTitle: string
  company: string
  companyUserId: string
  logo: string
  status: string
  appliedDate: string
  lastUpdate: string
  location: string
  stipend: string
  duration: string
  notes: string | null
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messagingCompanyId, setMessagingCompanyId] = useState<string | null>(null)

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
            logo: getCompanyEmoji(app.internshipId?.companyId?.companyName || ''),
            status: app.status,
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

  // Generate emoji based on company name
  const getCompanyEmoji = (name: string) => {
    const emojis = ['🏢', '🏛️', '🏗️', '💼', '📊', '🔧', '💡', '🚀', '🌐', '⚡']
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return emojis[Math.abs(hash) % emojis.length]
  }

  const handleMessageCompany = async (companyUserId: string) => {
    if (!companyUserId) {
      alert('Company information not available')
      return
    }

    try {
      setMessagingCompanyId(companyUserId)

      // Create or get existing conversation
      const response = await api.post('/messages/conversations', {
        participantId: companyUserId
      })

      if (response.data.success) {
        // Navigate to messages page
        router.push('/student/messages')
      }
    } catch (err: any) {
      console.error('Failed to start conversation:', err)
      alert('Failed to start conversation. Please try again.')
    } finally {
      setMessagingCompanyId(null)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Pending Review'
        }
      case 'shortlisted':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Shortlisted'
        }
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Not Selected'
        }
      case 'accepted':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Accepted'
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Unknown'
        }
    }
  }

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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">My Applications</h1>
        <p className="text-sm sm:text-base text-gray-600">Track and manage your internship applications</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`bg-white rounded-xl shadow-sm border p-4 text-left hover:shadow-md transition-all ${filterStatus === 'all' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'
            }`}
        >
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{statusCounts.all}</div>
          <div className="text-xs sm:text-sm text-gray-600">Total Applications</div>
        </button>

        <button
          onClick={() => setFilterStatus('pending')}
          className={`bg-white rounded-xl shadow-sm border p-3 sm:p-4 text-left hover:shadow-md transition-all ${filterStatus === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-100' : 'border-gray-100'
            }`}
        >
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-xs sm:text-sm text-gray-600">Pending</div>
        </button>

        <button
          onClick={() => setFilterStatus('shortlisted')}
          className={`bg-white rounded-xl shadow-sm border p-3 sm:p-4 text-left hover:shadow-md transition-all ${filterStatus === 'shortlisted' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-100'
            }`}
        >
          <div className="text-xl sm:text-2xl font-bold text-green-600">{statusCounts.shortlisted}</div>
          <div className="text-xs sm:text-sm text-gray-600">Shortlisted</div>
        </button>

        <button
          onClick={() => setFilterStatus('accepted')}
          className={`bg-white rounded-xl shadow-sm border p-3 sm:p-4 text-left hover:shadow-md transition-all ${filterStatus === 'accepted' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'
            }`}
        >
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{statusCounts.accepted}</div>
          <div className="text-xs sm:text-sm text-gray-600">Accepted</div>
        </button>

        <button
          onClick={() => setFilterStatus('rejected')}
          className={`bg-white rounded-xl shadow-sm border p-3 sm:p-4 text-left hover:shadow-md transition-all ${filterStatus === 'rejected' ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-100'
            }`}
        >
          <div className="text-xl sm:text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
          <div className="text-xs sm:text-sm text-gray-600">Rejected</div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company or position..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Internships
            </Link>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const statusInfo = getStatusInfo(app.status)
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3 sm:mb-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="text-3xl sm:text-5xl flex-shrink-0">{app.logo}</div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-1">{app.internshipTitle}</h3>
                        <p className="text-sm sm:text-base text-gray-600 font-medium flex items-center gap-1.5 sm:gap-2">
                          <Building size={16} />
                          {app.company}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.color} self-start`}>
                    <StatusIcon size={16} />
                    {statusInfo.label}
                  </span>
                </div>
                <div className="space-y-3 sm:space-y-0">

                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    <span className="flex items-center gap-1">
                      📍 {app.location}
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱️ {app.duration}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-green-600">
                      💰 {app.stipend}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:gap-6 gap-1.5 text-xs text-gray-500 mb-3 sm:mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Applied: {formatDate(app.appliedDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Last Update: {formatDate(app.lastUpdate)}
                    </span>
                  </div>

                  {app.notes && (
                    <div className={`p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm ${app.status === 'shortlisted' || app.status === 'accepted'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : app.status === 'rejected'
                          ? 'bg-red-50 border border-red-200 text-red-800'
                          : 'bg-blue-50 border border-blue-200 text-blue-800'
                      }`}>
                      <p className="font-medium mb-1">📝 Note:</p>
                      <p>{app.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 sm:pt-4 border-t border-gray-100">
                  <Link
                    href={`/internships`}
                    className="flex-1 text-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium"
                  >
                    View Internship
                  </Link>

                  {/* Message Company Button */}
                  <button
                    onClick={() => handleMessageCompany(app.companyUserId)}
                    disabled={!app.companyUserId || messagingCompanyId === app.companyUserId}
                    className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {messagingCompanyId === app.companyUserId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <MessageCircle size={16} />
                    )}
                    Message Company
                  </button>

                  {app.status === 'shortlisted' && (
                    <button className="flex-1 text-center px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs sm:text-sm font-medium">
                      Complete Assessment
                    </button>
                  )}
                  {app.status === 'accepted' && (
                    <button className="flex-1 text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      Accept Offer
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
