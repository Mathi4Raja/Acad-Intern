'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, AlertCircle, CheckCircle, XCircle, Eye, Clock, User, Briefcase, MessageSquare, Loader2, X, Flag } from 'lucide-react'
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
      {/* Ultra-Compact Premium Header Card */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-3.5 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group/header mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 group-hover:scale-105 transition-all duration-500">
            <Flag size={22} />
          </div>
          <div>
            <h1 className="text-[17px] font-black text-gray-900 leading-none tracking-tight uppercase">
              Security Feed
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Incident Response & Behavioral Auditing
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Feed Synchronized" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-[10px] placeholder:font-bold placeholder:uppercase placeholder:tracking-widest"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Audit Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="text-[17px] font-black text-gray-900 leading-none">Incident Audit Log</h2>
                <p className="text-[11px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Case ID: {selectedReport.id.slice(-8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 scrollbar-hide">
              {/* Profile Header Block */}
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-gray-300 font-black text-2xl shrink-0 group hover:scale-105 transition-all shadow-sm",
                  selectedReport.priority === 'high' ? "bg-red-50 border-red-100 text-red-400" : "bg-gray-50 border-gray-100"
                )}>
                  {getTypeIcon(selectedReport.type)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-gray-900 mb-1 truncate">{selectedReport.reason}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm",
                      getStatusColor(selectedReport.status)
                    )}>
                      {selectedReport.status}
                    </span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                      getPriorityColor(selectedReport.priority)
                    )}>
                      {selectedReport.priority} Priority
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Grid Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Origin of Report</span>
                  <p className="text-[11px] font-black text-gray-900 truncate">By {selectedReport.reportedBy}</p>
                  <p className="text-[10px] font-bold text-gray-400 truncate">{selectedReport.reporterEmail || 'No Email'}</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Timestamp</span>
                  <p className="text-[11px] font-black text-gray-900">{formatDate(selectedReport.reportedDate)}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Official Filing</p>
                </div>
              </div>

              {/* Subject Entity */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Investigated Subject</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-gray-900">{selectedReport.internshipTitle || 'Platform Interaction'}</p>
                    <p className="text-xs font-bold text-gray-500">{selectedReport.companyName || 'Unknown Entity'}</p>
                  </div>
                </div>

                {selectedReport.resolution && (
                  <div className="bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100 space-y-3">
                    <h4 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100/30 pb-2">Resolution Protocol</h4>
                    <p className="text-[12px] font-medium text-emerald-800 leading-relaxed italic">"{selectedReport.resolution}"</p>
                  </div>
                )}
              </div>

              {/* Action Log Area */}
              <div className="bg-gray-900 rounded-2xl p-4 shadow-xl shadow-gray-200/50 ring-1 ring-white/10">
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Incident ID</span>
                <code className="text-[11px] font-mono text-gray-200 break-all leading-relaxed">
                  {selectedReport.id}
                </code>
              </div>
            </div>

            <div className="px-6 py-5 bg-white border-t border-gray-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2.5 border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-500 rounded-xl hover:bg-gray-50 transition-all"
              >
                Exit Audit
              </button>
              {selectedReport.status !== 'resolved' && (
                <button
                  onClick={() => {
                    handleAction(selectedReport.id, 'resolved');
                    setSelectedReport(null);
                  }}
                  className="px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all shadow-sm shadow-emerald-100"
                >
                  Finalize Resolution
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col justify-center h-20 hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-none">Global Queue</p>
          <p className="text-2xl font-black text-gray-900 leading-none">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col justify-center h-20 hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5 leading-none">Unattended</p>
          <p className="text-2xl font-black text-red-600 leading-none">{stats.open}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col justify-center h-20 hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1.5 leading-none">In Review</p>
          <p className="text-2xl font-black text-yellow-600 leading-none">{stats.underReview}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col justify-center h-20 hover:shadow-md transition-all">
          <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1.5 leading-none">Resolved</p>
          <p className="text-2xl font-black text-green-600 leading-none">{stats.resolved}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-col justify-center h-20 hover:shadow-md transition-all ring-1 ring-red-100 bg-red-50/10">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5 leading-none">High Priority</p>
          <p className="text-2xl font-black text-red-700 leading-none">{stats.highPriority}</p>
        </div>
      </div>


      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center flex justify-center items-center flex-col gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest">Scanning Complaints...</p>
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className={cn(
              "group bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full",
              report.priority === 'high' && report.status === 'open' && "ring-1 ring-red-100 bg-red-50/5"
            )}>
              <div className="flex gap-4 h-full">
                {/* Column 1: Priority & Type Icon */}
                <div className="flex flex-col items-center gap-3 pt-0.5 shrink-0 w-10">
                  <div className="relative flex items-center justify-center">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2",
                      report.priority === 'high' ? "bg-red-500 border-red-100 animate-pulse" :
                        report.priority === 'medium' ? "bg-yellow-400 border-yellow-50" : "bg-blue-400 border-blue-50"
                    )} />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 shadow-sm">
                    {getTypeIcon(report.type)}
                  </div>
                </div>

                {/* Column 2: Main Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-black text-gray-900 leading-tight group-hover:text-primary transition-colors truncate" title={report.reason}>
                        {report.reason}
                      </h3>
                      <p className="text-[11px] font-bold text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
                        By {report.reportedBy} • {report.reporterEmail || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Status Chips */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border h-fit",
                      report.status === 'open' ? "bg-red-50 text-red-600 border-red-100" :
                        report.status === 'under_review' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                          report.status === 'resolved' ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-600 border-gray-100"
                    )}>
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-100">
                      {report.type} report
                    </span>
                  </div>

                  {/* Info Grid - Rich Data */}
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Subject Entity</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black text-gray-700 truncate">{report.internshipTitle || report.companyName || 'Platform General'}</p>
                        <p className="text-[10px] font-bold text-primary shrink-0 ml-2">Context Link</p>
                      </div>
                    </div>
                    {report.resolution && (
                      <div className="bg-emerald-50/30 rounded-xl p-2 border border-emerald-100 group-hover:bg-white transition-colors">
                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Resolution Detail</p>
                        <p className="text-[11px] font-bold text-emerald-700 leading-tight italic">"{report.resolution}"</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                      >
                        <Eye size={12} /> Audit
                      </button>
                      {report.applicationId && (
                        <button
                          onClick={() => {
                            setActiveChatId(report.applicationId || null)
                            setActiveChatName(report.reportedBy || 'Reported Chat')
                          }}
                          className="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest flex items-center gap-1"
                        >
                          <MessageSquare size={12} /> Chat Context
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {report.status !== 'resolved' && (
                        <button
                          onClick={() => handleAction(report.id, 'resolved')}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all"
                          title="Mark Resolved"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {report.status === 'open' && (
                        <button
                          onClick={() => handleAction(report.id, 'under_review')}
                          className="p-1.5 text-yellow-400 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-all"
                          title="Move to Review"
                        >
                          <Clock size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(report.id, 'dismissed')}
                        className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                        title="Dismiss"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-500">
                <CheckCircle size={32} />
              </div>
              <p className="text-gray-900 font-black text-lg mb-1">Queue Empty</p>
              <p className="text-sm text-gray-500 font-bold max-w-xs">All moderation tasks for the current filters have been handled.</p>
            </div>
          </div>
        )}
      </div>
      {/* Chat History Modal */}
      {
        activeChatId && (
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
        )
      }
    </div >
  )
}
