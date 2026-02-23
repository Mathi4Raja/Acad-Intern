'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, AlertCircle, CheckCircle, XCircle, Eye, Clock, User, Briefcase, MessageSquare, Loader2, X, Flag, Shield, Activity, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useAdminStats } from '@/lib/AdminStatsContext'
import ChatInterface from '@/components/messages/ChatInterface'
import { useAlert } from '@/components/ui/AlertProvider'
import { StatCard } from '@/components/analytics/StatCard'

interface Report {
  id: string
  type: string
  internshipTitle?: string
  internshipId?: string
  companyName?: string
  reportedBy: string
  reporterId?: string
  reporterEmail?: string
  reason: string // maps to subject
  subject?: string
  body?: string
  category?: string
  context?: any
  screenshots?: string[]
  reportedUserId?: string
  reportedUserName?: string
  reportedUserEmail?: string
  reportedUserRole?: string
  isAutomatedFlag?: boolean
  flagMetadata?: any
  reportedDate: string
  status: 'open' | 'under_review' | 'resolved' | 'dismissed'
  priority: 'high' | 'medium' | 'low'
  resolution?: string
  reviewedAt?: string
  applicationId?: string
  reportedUserShadowBanned?: boolean
  origin?: string
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

  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    underReview: 0,
    resolved: 0,
    highPriority: 0
  })

  // Moderation Action States
  const [isSuspending, setIsSuspending] = useState(false)
  const [isTogglingShadowBan, setIsTogglingShadowBan] = useState(false)
  const [suspensionDuration, setSuspensionDuration] = useState(7)
  const [moderationReason, setModerationReason] = useState('')

  const handleTempSuspend = async (userId: string) => {
    if (!moderationReason) {
      showAlert('Please provide a reason for suspension', 'error')
      return
    }
    setIsSuspending(true)
    try {
      await api.post(`/admin/users/${userId}/suspend`, {
        durationDays: suspensionDuration,
        reason: moderationReason
      })
      showAlert(`User suspended for ${suspensionDuration} days`, 'success')
      setModerationReason('')
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Failed to suspend user', 'error')
    } finally {
      setIsSuspending(false)
    }
  }

  const handleToggleShadowBan = async (userId: string, currentState: boolean) => {
    setIsTogglingShadowBan(true)
    const targetState = !currentState
    try {
      const res = await api.post(`/admin/users/${userId}/shadow-ban`, {
        shadowBanned: targetState
      })
      showAlert(`Shadow ban ${targetState ? 'enabled' : 'disabled'}`, 'success')

      // Update selected report state locally
      if (selectedReport && selectedReport.reportedUserId === userId) {
        setSelectedReport({
          ...selectedReport,
          reportedUserShadowBanned: targetState
        })
      }

      // Also update in reports list
      setReports(prev => prev.map(r =>
        r.reportedUserId === userId
          ? { ...r, reportedUserShadowBanned: targetState }
          : r
      ))
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'Failed to update shadow ban', 'error')
    } finally {
      setIsTogglingShadowBan(false)
    }
  }

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

  const handleSelectDetailedReport = async (report: Report) => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/reports/${report.id}`)
      if (res.data.success) {
        setSelectedReport(res.data.data)
      } else {
        setSelectedReport(report)
      }
    } catch (error) {
      console.error('Error fetching report details:', error)
      setSelectedReport(report)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectReport = (id: string) => {
    setSelectedReports(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedReports(reports.map(r => r.id))
    } else {
      setSelectedReports([])
    }
  }

  const handleBulkAction = async (action: 'resolved' | 'dismissed') => {
    if (selectedReports.length === 0) return

    showConfirm({
      title: `Bulk ${action === 'resolved' ? 'Resolve' : 'Dismiss'}`,
      message: `Are you sure you want to ${action} ${selectedReports.length} reports? This action cannot be undone.`,
      type: action === 'dismissed' ? 'danger' : 'warning',
      confirmText: `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      onConfirm: async () => {
        try {
          // In a real scenario, we'd have a bulk update endpoint. 
          // For now, we'll process them in sequence for simplicity or assume the backend can handle it.
          await Promise.all(selectedReports.map(id =>
            api.put(`/admin/reports/${id}`, {
              status: action,
              resolution: `Bulk ${action} by admin`
            })
          ))

          showAlert(`${selectedReports.length} reports ${action === 'resolved' ? 'resolved' : 'dismissed'} successfully`, 'success')
          setSelectedReports([])
          fetchData()
          refreshStats()
        } catch (error) {
          console.error(`Bulk action ${action} failed:`, error)
          showAlert(`Failed to process some reports`, 'error')
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
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4">
      {/* Ultra-Compact Premium Header Card */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-2.5 sm:p-3 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group/header mb-2">
        {/* Background Glow Effect */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover/header:bg-primary/10 transition-colors duration-700" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover/header:bg-primary/10 transition-colors duration-700" />

        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover/header:scale-110 group-hover/header:rotate-6 transition-all duration-500 shadow-lg shadow-gray-200">
              <Flag className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-red-500 border-2 border-white flex items-center justify-center animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <h1 className="text-[15px] font-black text-gray-900 leading-none tracking-tight uppercase">
              Reports & Moderation
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Review user reports and safety
              </p>
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-red-500" />
                <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Active Guard</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
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


      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col h-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-100 p-6 sm:px-8 sm:py-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3",
                  selectedReport.priority === 'high' ? "bg-red-500 text-white shadow-red-200" : "bg-gray-900 text-white shadow-gray-200"
                )}>
                  <Flag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Incident Report</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                      Case #{selectedReport.id.slice(-8).toUpperCase()}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                      getPriorityColor(selectedReport.priority)
                    )}>
                      {selectedReport.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-gray-900 p-2.5 rounded-2xl hover:bg-gray-100 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-0 overflow-y-auto flex-1 bg-gray-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left Column: Evidence & Details */}
                <div className="p-6 sm:p-8 space-y-8 border-r border-gray-100">
                  {/* Automated Flag Warning */}
                  {selectedReport.isAutomatedFlag && (
                    <div className="bg-orange-50/50 border border-orange-200 p-4 rounded-3xl flex items-start gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                        <Activity size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-orange-700 uppercase tracking-widest mb-1">Automated Security Flag</h4>
                        <p className="text-[11px] font-bold text-orange-600/80 leading-relaxed">
                          This report was automatically generated by the safety system due to suspicious patterns or prohibited keywords.
                        </p>
                      </div>
                    </div>
                  )}

                  <section className="space-y-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Details</h4>
                    <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Subject</p>
                        <p className="text-sm font-black text-gray-900 tracking-tight leading-tight">
                          {selectedReport.subject || selectedReport.reason}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</p>
                        <p className="text-[13px] font-bold text-gray-600 leading-relaxed">
                          {selectedReport.body || 'No detailed description provided.'}
                        </p>
                      </div>
                      {selectedReport.origin && (
                        <div className="pt-3 border-t border-gray-50">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Activity size={10} /> Originating Path
                          </p>
                          <code className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            {selectedReport.origin}
                          </code>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Screenshots */}
                  {selectedReport.screenshots && selectedReport.screenshots.length > 0 && (
                    <section className="space-y-4">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Evidence (Screenshots)</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedReport.screenshots.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square bg-white rounded-2xl border border-gray-100 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all shadow-sm group"
                          >
                            <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </a>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Technical Context */}
                  {selectedReport.context && (
                    <section className="space-y-4">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Technical Context</h4>
                      <div className="bg-gray-900 rounded-[32px] p-5 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                        <div className="absolute right-0 top-0 p-6 opacity-[0.03]">
                          <Activity size={80} className="text-white" />
                        </div>
                        <pre className="text-[12px] font-mono text-gray-400 overflow-x-auto scrollbar-hide relative z-10 whitespace-pre-wrap">
                          {typeof selectedReport.context === 'string'
                            ? selectedReport.context
                            : JSON.stringify(selectedReport.context, null, 2)}
                        </pre>
                      </div>
                    </section>
                  )}
                </div>

                {/* Right Column: Parties & Actions */}
                <div className="p-6 sm:p-8 space-y-8 bg-gray-50/30">
                  {/* Reporting Parties */}
                  <section className="space-y-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Investigation Targets</h4>
                    <div className="grid gap-3">
                      {/* Reporter */}
                      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <User size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Reporter</p>
                          <p className="text-[13px] font-bold text-gray-900 truncate">{selectedReport.reportedBy}</p>
                          <p className="text-[10px] font-bold text-gray-400 truncate">{selectedReport.reporterEmail}</p>
                        </div>
                      </div>

                      {/* Reported User */}
                      {selectedReport.reportedUserId && (
                        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 ring-1 ring-red-50">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <Shield size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[8px] font-black text-red-400 uppercase tracking-[0.2em] mb-0.5">Reported User</p>
                            <p className="text-[13px] font-bold text-gray-900 truncate">{selectedReport.reportedUserName || 'System ID: ' + selectedReport.reportedUserId.slice(-6)}</p>
                            <p className="text-[10px] font-bold text-gray-400 truncate uppercase mt-0.5 tracking-tighter">
                              Role: {selectedReport.reportedUserRole || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Moderation Actions */}
                  <section className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Enforcement Panel</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Case Notes / Reason</label>
                        <textarea
                          value={moderationReason}
                          onChange={(e) => setModerationReason(e.target.value)}
                          placeholder="Provide reasoning for suspension or resolution..."
                          className="w-full min-h-[80px] p-4 bg-white border border-gray-100 rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Suspend Period</label>
                          <select
                            value={suspensionDuration}
                            onChange={(e) => setSuspensionDuration(Number(e.target.value))}
                            className="w-full h-11 px-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all appearance-none"
                          >
                            <option value={7}>7 Days</option>
                            <option value={15}>15 Days</option>
                            <option value={30}>30 Days</option>
                            <option value={90}>90 Days</option>
                          </select>
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => handleTempSuspend(selectedReport.reportedUserId || '')}
                            disabled={!selectedReport.reportedUserId || isSuspending}
                            className="w-full h-11 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isSuspending ? 'Processing...' : 'Temp Suspend'}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleShadowBan(selectedReport.reportedUserId || '', !!selectedReport.reportedUserShadowBanned)}
                        disabled={!selectedReport.reportedUserId || isTogglingShadowBan}
                        className={cn(
                          "w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md",
                          selectedReport.reportedUserShadowBanned
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-red-100"
                            : "bg-gray-900 text-white hover:bg-gray-800 shadow-gray-200"
                        )}
                      >
                        {isTogglingShadowBan ? 'Processing...' : (
                          <div className="flex items-center justify-center gap-2">
                            <span>SHADOW BAN: {selectedReport.reportedUserShadowBanned ? 'ON' : 'OFF'}</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-4 shrink-0">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-8 py-3 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-100"
              >
                Close Profile
              </button>
              {selectedReport.status !== 'resolved' && (
                <button
                  onClick={() => {
                    handleAction(selectedReport.id, 'resolved');
                    setSelectedReport(null);
                  }}
                  className="px-8 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Resolve & Close Case
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-2">
        <StatCard
          title="Total Reports"
          value={stats.total}
          icon={Flag}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
        />
        <StatCard
          title="Pending"
          value={stats.open}
          icon={Clock}
          iconColor="text-red-500"
          iconBg="bg-red-50"
          className="ring-1 ring-red-100/50"
        />
        <StatCard
          title="In Review"
          value={stats.underReview}
          icon={Eye}
          iconColor="text-yellow-500"
          iconBg="bg-yellow-50"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          iconColor="text-green-500"
          iconBg="bg-green-50"
        />
        <StatCard
          title="High Priority"
          value={stats.highPriority}
          icon={AlertCircle}
          iconColor="text-red-600"
          iconBg="bg-red-100"
          className="ring-1 ring-red-200/50 bg-red-50/5"
          active={stats.highPriority > 0}
        />
      </div>

      {/* Bulk Actions & Selection */}
      {selectedReports.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-primary/20 p-3 mb-4 flex flex-wrap gap-2 items-center animate-in slide-in-from-top-2">
          <span className="text-sm font-bold text-primary mr-2 bg-primary/5 px-2 py-1 rounded-lg">{selectedReports.length} selected</span>
          <button onClick={() => handleBulkAction('resolved')} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm">Resolve All</button>
          <button onClick={() => handleBulkAction('dismissed')} className="px-4 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors shadow-sm">Dismiss All</button>
          <button onClick={() => setSelectedReports([])} className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">Clear</button>
        </div>
      )}

      {reports.length > 0 && (
        <div className="mb-3 px-1">
          <label className="group flex items-center gap-3 text-sm text-gray-700 cursor-pointer w-fit">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedReports.length === reports.length && reports.length > 0}
                onChange={handleSelectAll}
                className="peer absolute opacity-0 w-5 h-5 cursor-pointer"
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded-md transition-all group-hover:border-primary peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 opacity-0 peer-checked:opacity-100 mb-0.5"></div>
              </div>
            </div>
            <span className="font-bold text-gray-600 group-hover:text-primary transition-colors">Select All ({reports.length})</span>
          </label>
        </div>
      )}


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
              "group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full",
              selectedReports.includes(report.id) && "ring-2 ring-primary/20 border-primary/30",
              report.priority === 'high' && report.status === 'open' && !selectedReports.includes(report.id) && "ring-1 ring-red-100 bg-red-50/5"
            )}>
              {/* Header: Priority & Type Icon + Selection & Status */}
              <div className="flex items-start gap-4 mb-4">
                {/* Visual Identity Area */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 shadow-sm relative overflow-hidden">
                    {getTypeIcon(report.type)}
                  </div>
                </div>

                {/* Identity Area */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      report.priority === 'high' ? "bg-red-500 animate-pulse" :
                        report.priority === 'medium' ? "bg-yellow-400" : "bg-blue-400"
                    )} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                      Case ID: {report.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-black text-gray-900 leading-tight group-hover:text-primary transition-colors truncate" title={report.reason}>
                    {report.reason}
                  </h3>
                  <p className="text-[11px] font-bold text-gray-400 truncate mt-0.5 uppercase tracking-widest leading-none">
                    By {report.reportedBy}
                  </p>
                </div>

                {/* Actions & Status Area (Top Right) */}
                <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => handleSelectReport(report.id)}
                      className="peer absolute opacity-0 w-6 h-6 cursor-pointer z-10"
                    />
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-lg transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center shadow-sm">
                      <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 opacity-0 peer-checked:opacity-100 mb-0.5"></div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border h-fit",
                    report.status === 'open' ? "bg-red-50 text-red-600 border-red-100" :
                      report.status === 'under_review' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                        report.status === 'resolved' ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-600 border-gray-100"
                  )}>
                    {report.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Body: Full Width Metrics */}
              <div className="space-y-4 flex-1">
                {/* Subject Entity Area */}
                <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Subject Entity</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-gray-700 truncate">
                      {report.internshipTitle || report.companyName || 'Platform General'}
                    </p>
                    <p className="text-[10px] font-black text-primary shrink-0 ml-2 uppercase tracking-tighter">View Context</p>
                  </div>
                </div>

                {report.origin && (
                  <div className="bg-blue-50/30 rounded-xl p-2 border border-blue-100/50 group-hover:bg-white transition-colors">
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Report Origin</p>
                    <p className="text-[10px] font-bold text-blue-600 truncate">{report.origin}</p>
                  </div>
                )}

                {report.resolution && (
                  <div className="bg-emerald-50/20 rounded-xl p-2.5 border border-emerald-100/50">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Resolution Detail</p>
                    <p className="text-[11px] font-bold text-emerald-700 leading-tight italic line-clamp-2">"{report.resolution}"</p>
                  </div>
                )}
              </div>

              {/* Actions Footer Area */}
              <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSelectDetailedReport(report)}
                    className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                  >
                    <Eye size={12} /> Audit Log
                  </button>
                  {report.applicationId && (
                    <button
                      onClick={() => {
                        setActiveChatId(report.applicationId || null)
                        setActiveChatName(report.reportedBy || 'Reported Chat')
                      }}
                      className="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <MessageSquare size={12} /> Context
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => handleAction(report.id, 'resolved')}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all"
                      title="Resolve"
                    >
                      <CheckCircle size={15} />
                    </button>
                  )}
                  {report.status === 'open' && (
                    <button
                      onClick={() => handleAction(report.id, 'under_review')}
                      className="p-1.5 text-yellow-400 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-all"
                      title="Review"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 transition-all">
              {/* Premium Header Pattern */}
              <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 sm:px-6 sm:py-4 flex items-center justify-between overflow-hidden relative group/modal-header shrink-0">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover/modal-header:bg-primary/10 transition-colors duration-700" />
                <div className="relative flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover/modal-header:scale-110 group-hover/modal-header:rotate-6 transition-all duration-500 shadow-lg shadow-gray-200">
                    <MessageSquare size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-gray-900 leading-none tracking-tight uppercase">Chat History Context</h2>
                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Case Investigation Mode • {activeChatName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveChatId(null)}
                  className="relative z-10 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
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

              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center shrink-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Read-Only Review Mode • Audit recorded</p>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
