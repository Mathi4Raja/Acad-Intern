'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, AlertCircle, CheckCircle, XCircle, Eye, Clock, User, Briefcase, MessageSquare, Loader2 } from 'lucide-react'
import api from '@/lib/api'

interface Report {
  id: string
  type: string
  internshipTitle?: string
  internshipId?: string
  companyName?: string
  reportedBy: string
  reporterId?: string
  reporterEmail?: string
  reason: string
  reportedDate: string
  status: 'open' | 'under_review' | 'resolved' | 'dismissed'
  priority: 'high' | 'medium' | 'low'
  resolution?: string
  reviewedAt?: string
}

export default function ManageReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    underReview: 0,
    resolved: 0,
    highPriority: 0
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch stats and reports
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Stats
      const statsRes = await api.get('/admin/stats')
      const s = statsRes.data.data.stats
      // Note: Backend stats might not have breakdown for reports yet, so we might need to calculate from reports list or rely on what's available
      // The viewed adminController doesn't explicitly show report breakdown in getDashboardStats, only totalReports and pendingReports.
      // So we will estimate or use what we have.

      const reportsParams: any = {}
      if (debouncedSearch) reportsParams.search = debouncedSearch // Backend might not support search on reports yet, but passing it anyway
      if (filterStatus !== 'all') reportsParams.status = filterStatus
      if (filterPriority !== 'all') reportsParams.priority = filterPriority

      const reportsRes = await api.get('/admin/reports', { params: reportsParams })
      const data = reportsRes.data.data
      setReports(data)

      // Calculate stats from data if backend stats are insufficient, or use backend stats if available.
      // For now, let's derive from the fetched data for the current view, but for "total" counts we should use the stats API if possible.
      // Actually, relying on the filtered list for "Top Stats" is confusing if filters are applied.
      // Let's rely on the list length for now or keep it static/derived. 
      // Better: Use `s.pendingReports` and `s.totalReports` from API for the relevant cards, and calculate others from full list if needed (but we don't fetch full list if paginated? we assume no pagination for now).

      setStats({
        total: s.totalReports || 0,
        open: s.pendingReports || 0,
        underReview: s.underReviewReports || 0,
        resolved: s.resolvedReports || 0,
        highPriority: s.highPriorityReports || 0
      })

    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [debouncedSearch, filterStatus, filterPriority])

  const handleAction = async (id: string, action: 'under_review' | 'resolved' | 'dismissed') => {
    if (!confirm(`Are you sure you want to mark this report as ${action.replace('_', ' ')}?`)) return

    try {
      const updates: any = { status: action }
      if (action === 'resolved') updates.resolution = 'Resolved by admin' // Simple default
      if (action === 'dismissed') updates.resolution = 'Dismissed by admin'

      await api.put(`/admin/reports/${id}`, updates)
      fetchData()
    } catch (error) {
      console.error(`Error updating report status to ${action}:`, error)
      alert(`Failed to update report status`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-700'
      case 'under_review': return 'bg-yellow-100 text-yellow-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'dismissed': return 'bg-gray-100 text-gray-700'
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'internship': return <Briefcase size={16} />
      case 'company': return <Briefcase size={16} />
      case 'user': return <User size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="p-3 sm:p-4 max-w-7xl mx-auto">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Reports & Moderation</h1>
          <p className="text-xs text-gray-600">Review and handle reported content and user complaints</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-primary/20 text-primary' : 'bg-white text-gray-600 hover:bg-gray-100'} border border-gray-200 shadow-sm`}
            title="Search"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-primary/20 text-primary' : 'bg-white text-gray-600 hover:bg-gray-100'} border border-gray-200 shadow-sm`}
            title="Filter"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by reason, reporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-xl">
              <button onClick={() => setShowSearch(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status & Priority</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status.replace('_', ' ').charAt(0).toUpperCase() + selectedReport.status.replace('_', ' ').slice(1)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedReport.priority)}`}>
                      <AlertCircle size={12} />
                      {selectedReport.priority.charAt(0).toUpperCase() + selectedReport.priority.slice(1)} Priority
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</label>
                  <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedReport.reason}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reporter</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">
                        {selectedReport.reportedBy.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedReport.reportedBy}</p>
                        {selectedReport.reporterEmail && <p className="text-xs text-gray-500 truncate">{selectedReport.reporterEmail}</p>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported Item</label>
                    <div className="mt-1">
                      <p className="text-sm font-medium text-gray-900">{selectedReport.internshipTitle || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{selectedReport.companyName || 'Unknown Company'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported Date</label>
                    <p className="mt-1 text-sm text-gray-700">{formatDate(selectedReport.reportedDate)}</p>
                  </div>
                  {selectedReport.reviewedAt && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reviewed Date</label>
                      <p className="mt-1 text-sm text-gray-700">{formatDate(selectedReport.reviewedAt)}</p>
                    </div>
                  )}
                </div>

                {selectedReport.resolution && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolution</label>
                    <div className="mt-1 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">{selectedReport.resolution}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
              {selectedReport.status !== 'resolved' && selectedReport.status !== 'dismissed' && (
                <button
                  onClick={() => {
                    handleAction(selectedReport.id, 'resolved');
                    setSelectedReport(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Resolve Report
                </button>
              )}
            </div>
          </div>
        </div>
      )
      }

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Total Reports</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Open</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-red-600">{stats.open}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Under Review</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-yellow-600">{stats.underReview}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Resolved</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-green-600">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">High Priority</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-red-600">{stats.highPriority}</p>
        </div>
      </div>

      {/* Filter Modal */}
      {
        showFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                    <option value="all">All Priority</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-between rounded-b-xl">
                <button onClick={() => { setFilterStatus('all'); setFilterPriority('all') }} className="text-sm font-medium text-gray-600">Clear All</button>
                <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Apply</button>
              </div>
            </div>
          </div>
        )
      }

      {/* Reports List */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 hover:shadow-md transition-all duration-200 hover:border-gray-300">
              <div className="flex gap-3">
                {/* Report Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Header */}
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.replace('_', ' ').charAt(0).toUpperCase() + report.status.replace('_', ' ').slice(1)}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                        <AlertCircle size={12} />
                        {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)} Priority
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {getTypeIcon(report.type)}
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5">{report.reason}</h3>
                    {report.internshipTitle && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Reported Internship: <span className="font-medium">{report.internshipTitle}</span></p>
                    )}
                    {report.companyName && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Company: <span className="font-medium">{report.companyName}</span></p>
                    )}
                  </div>

                  {/* Description (Empty for now as API doesn't return it) */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      Reported by: <span className="font-medium">{report.reportedBy}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(report.reportedDate)}
                    </span>
                  </div>

                  {/* Resolution (if resolved) */}
                  {report.resolution && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-green-900 mb-1">Resolution</p>
                          <p className="text-xs sm:text-sm text-green-700">{report.resolution}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Right Side */}
                {(report.status !== 'resolved' && report.status !== 'dismissed') && (
                  <div className="flex flex-col gap-1.5 ml-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {report.status !== 'under_review' && (
                      <button
                        onClick={() => handleAction(report.id, 'under_review')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Mark Under Review"
                      >
                        <Clock size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(report.id, 'resolved')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Resolve"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'dismissed')}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Dismiss"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <p className="text-gray-500 text-base sm:text-lg mb-2">No reports found</p>
            <p className="text-sm text-gray-400">All clear! No reports matching your filters.</p>
          </div>
        )}
      </div>
    </div >
  )
}
