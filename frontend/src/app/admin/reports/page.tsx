'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, AlertCircle, CheckCircle, XCircle, Eye, Clock, User, Briefcase, MessageSquare, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAdminStats } from '@/lib/AdminStatsContext'
import ChatInterface from '@/components/messages/ChatInterface'
import { useAlert } from '@/components/ui/AlertProvider'

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
  applicationId?: string
}

export default function ManageReports() {
  const { showAlert, showConfirm } = useAlert()
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [activeChatName, setActiveChatName] = useState<string>('')

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

  const { refreshStats } = useAdminStats()

  const handleAction = async (id: string, action: 'under_review' | 'resolved' | 'dismissed') => {
    showConfirm({
      title: 'Update Report Status',
      message: `Are you sure you want to mark this report as ${action.replace('_', ' ')}?`,
      type: action === 'dismissed' ? 'danger' : 'warning',
      confirmText: 'Confirm',
      onConfirm: async () => {
        try {
          const updates: any = { status: action }
          if (action === 'resolved') updates.resolution = 'Resolved by admin'
          if (action === 'dismissed') updates.resolution = 'Dismissed by admin'

          await api.put(`/admin/reports/${id}`, updates)
          showAlert(`Report ${action.replace('_', ' ')} successfully`, 'success')
          fetchData()
          refreshStats()
        } catch (error) {
          console.error(`Error updating report status to ${action}:`, error)
          showAlert('Failed to update report status', 'error')
        }
      }
    })
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
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight mb-1">Reports & Moderation</h1>
          <p className="text-xs text-gray-600 font-medium">Review and handle reported content and user complaints</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by reason, reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>


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
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4">
        {[
          { label: 'Total Reports', value: stats.total, color: 'text-gray-900' },
          { label: 'Open', value: stats.open, color: 'text-red-600' },
          { label: 'Under Review', value: stats.underReview, color: 'text-yellow-600' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-600' },
          { label: 'High Priority', value: stats.highPriority, color: 'text-red-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2.5 flex flex-col justify-center h-16">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>


      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center flex justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-2.5 sm:p-3 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full">

              <div className="flex gap-2.5 sm:gap-3 flex-1">
                {/* Column 1: Side Column (Type Icon & Actions) */}
                <div className="flex flex-col items-center gap-2 shrink-0 py-0.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                    {getTypeIcon(report.type)}
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      report.priority === 'high' ? "bg-red-500 animate-pulse" :
                        report.priority === 'medium' ? "bg-yellow-500" : "bg-blue-500"
                    )} title={`${report.priority} priority`} />
                  </div>
                </div>

                {/* Column 2: Main Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Status & Priority Badges */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider h-fit border transition-all",
                      getStatusColor(report.status),
                      report.status === 'open' ? "border-red-200" :
                        report.status === 'under_review' ? "border-yellow-200" :
                          report.status === 'resolved' ? "border-green-200" : "border-gray-200"
                    )}>
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider h-fit border transition-all",
                      getPriorityColor(report.priority),
                      report.priority === 'high' ? "border-red-200" :
                        report.priority === 'medium' ? "border-yellow-200" : "border-blue-200"
                    )}>
                      {report.priority}
                    </span>
                  </div>

                  {/* Reason & Date */}
                  <div className="mb-2">
                    <h3 className="text-[14px] sm:text-[15px] font-black text-gray-900 leading-tight group-hover:text-primary transition-colors flex items-start gap-1.5 mb-1">
                      {report.reason}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(report.reportedDate)}
                    </p>
                  </div>

                  {/* Context Info */}
                  <div className="space-y-1.5 mb-3">
                    {report.internshipTitle && (
                      <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600">
                        <Briefcase size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate" title={report.internshipTitle}>{report.internshipTitle}</span>
                      </div>
                    )}
                    {report.companyName && (
                      <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600">
                        <AlertCircle size={12} className="text-gray-400 shrink-0" />
                        <span className="truncate" title={report.companyName}>{report.companyName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600">
                      <User size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate font-bold text-gray-700">By {report.reportedBy}</span>
                    </div>
                  </div>

                  {/* Resolution Snippet */}
                  {report.resolution && (
                    <div className="mt-auto pt-2 border-t border-gray-50">
                      <div className="bg-green-50/50 border border-green-100 rounded-lg p-1.5 flex items-start gap-1.5">
                        <CheckCircle size={12} className="text-green-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-green-700 leading-tight font-medium italic">
                          "{report.resolution}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {report.applicationId && (
                    <button
                      onClick={() => {
                        setActiveChatId(report.applicationId || null)
                        setActiveChatName(report.reportedBy || 'Reported Chat')
                      }}
                      className="p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-all"
                      title="View Chat Context"
                    >
                      <MessageSquare size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Detailed View"
                  >
                    <Eye size={16} />
                  </button>
                </div>

                {(report.status !== 'resolved' && report.status !== 'dismissed') && (
                  <div className="flex items-center gap-1">
                    {report.status !== 'under_review' && (
                      <button
                        onClick={() => handleAction(report.id, 'under_review')}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                        title="Mark Under Review"
                      >
                        <Clock size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(report.id, 'resolved')}
                      className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-[10px] font-black transition-all border border-green-100"
                    >
                      RESOLVE
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'dismissed')}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Dismiss Report"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <p className="text-gray-900 font-bold text-lg mb-1">All Clear!</p>
            <p className="text-sm text-gray-500">No reports matching your current filters were found.</p>
          </div>
        )}
      </div>
      {/* Chat History Modal */}
      {activeChatId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Chat History Context</h2>
                  <p className="text-xs text-gray-500">Read-only view for investigation</p>
                </div>
              </div>
              <button
                onClick={() => setActiveChatId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 min-h-0 bg-white">
              <ChatInterface
                applicationId={activeChatId}
                currentUserId="admin" // Passed to satisfy prop, but readOnly mode avoids owner checks for sending
                otherPartyName={activeChatName}
                readOnly={true}
              />
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 italic">Admin Review Mode • All actions recorded • Read Only</p>
            </div>
          </div>
        </div>
      )}
    </div >
  )
}
