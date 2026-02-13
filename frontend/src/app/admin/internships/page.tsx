'use client'

import { useState, useEffect, Suspense } from 'react'
import { cn } from '@/lib/utils'
import { Search, Filter, MapPin, Clock, IndianRupee, Users, Eye, CheckCircle, XCircle, Trash2, AlertCircle, Building, Loader2, Calendar, Briefcase, X, Shield, Activity, Ban } from 'lucide-react'
import api from '@/lib/api'
import { StatCard } from '@/components/analytics/StatCard'
import { useAdminStats } from '@/lib/AdminStatsContext'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'react-hot-toast'
import { useSearchParams, useRouter } from 'next/navigation'

interface Internship {
  _id: string
  title: string
  company: string
  companyId: {
    _id: string
    companyName: string
    verified: boolean
    logo?: string
  }
  location: string
  mode: string
  durationWeeks?: number // Backend field
  duration?: number // Mapping for potential legacy data
  stipend: number
  openings?: number // Backend field
  positions?: number // Mapping for potential legacy data
  status: 'active' | 'inactive' | 'completed' | 'in_progress' | 'rejected'
  applicants: number
  createdAt: string
  deadline: string
  skillsRequired?: string[]
  skills?: string[] // Legacy support
}

function ManageInternshipsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all')

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [selectedInternships, setSelectedInternships] = useState<string[]>([])
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger'
  })

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pendingReports: 0
  })

  // URL Sync
  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all' && value !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`?${params.toString()}`)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      updateUrlParams('search', searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => { updateUrlParams('status', filterStatus) }, [filterStatus])

  const fetchData = async () => {
    setLoading(true)
    try {
      const statsRes = await api.get('/admin/stats')
      const s = statsRes.data.data.stats
      setStats({
        total: s.totalInternships,
        active: s.activeInternships,
        inactive: s.totalInternships - s.activeInternships,
        pendingReports: s.pendingReports
      })

      const params: any = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (filterStatus !== 'all') params.status = filterStatus

      const internshipsRes = await api.get('/admin/internships', { params })
      setInternships(internshipsRes.data.data)
    } catch (error) {
      console.error('Error fetching internships:', error)
      toast.error('Failed to load internships')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [debouncedSearch, filterStatus])

  const { refreshStats } = useAdminStats()

  const handleAction = (id: string, action: 'activate' | 'deactivate' | 'delete') => {
    const title = action === 'delete' ? 'Delete Internship' : `${action.charAt(0).toUpperCase() + action.slice(1)} Internship`
    const message = `Are you sure you want to ${action} this internship?`

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type: action === 'delete' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          if (action === 'delete') {
            await api.delete(`/admin/internships/${id}`)
            toast.success('Internship deleted')
          } else {
            const status = action === 'activate' ? 'active' : 'inactive'
            await api.put(`/admin/internships/${id}`, { status })
            toast.success(`Internship ${status === 'active' ? 'activated' : 'deactivated'}`)
          }
          fetchData()
          refreshStats()
          setSelectedInternships(prev => prev.filter(iid => iid !== id))
        } catch (error) {
          console.error(`Error performing ${action}:`, error)
          toast.error(`Failed to ${action} internship`)
        }
      }
    })
  }

  const handleBulkAction = (action: string) => {
    if (selectedInternships.length === 0) return

    setConfirmDialog({
      isOpen: true,
      title: `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Are you sure you want to ${action} ${selectedInternships.length} internships?`,
      type: action === 'deleted' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          if (action === 'deleted') {
            await Promise.all(selectedInternships.map(id => api.delete(`/admin/internships/${id}`)))
          } else {
            const status = action === 'activated' ? 'active' : 'inactive'
            await Promise.all(selectedInternships.map(id => api.put(`/admin/internships/${id}`, { status })))
          }
          toast.success(`Internships ${action} successfully`)
          setSelectedInternships([])
          fetchData()
          refreshStats()
        } catch (error) {
          console.error('Bulk action error:', error)
          toast.error('Some operations failed')
        }
      }
    })
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleSelectAll = () => {
    if (selectedInternships.length === internships.length) {
      setSelectedInternships([])
    } else {
      setSelectedInternships(internships.map(i => i._id))
    }
  }

  const handleSelectInternship = (id: string) => {
    setSelectedInternships(prev => prev.includes(id) ? prev.filter(iid => iid !== id) : [...prev, id])
  }

  return (
    <div className="p-2 sm:p-3 max-w-7xl mx-auto space-y-4">
      {/* Ultra-Compact Premium Header Card */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-2.5 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group/header mb-2">
        {/* Background Glow Effect */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover/header:bg-primary/10 transition-colors duration-700" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover/header:bg-blue-500/10 transition-colors duration-700" />

        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover/header:scale-110 group-hover/header:rotate-6 transition-all duration-500 shadow-lg shadow-gray-200">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-green-500 border-2 border-white flex items-center justify-center animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <h1 className="text-[15px] font-black text-gray-900 leading-none tracking-tight uppercase">
              Internship Management
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Review and moderate internship postings
              </p>
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-orange-500" />
                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Live Updates</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search postings..."
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


      {/* Stats and stats grid... (kept brief for artifact but assumes full implementation in real file) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Briefcase}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
          onClick={() => setFilterStatus('all')}
          active={filterStatus === 'all'}
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          onClick={() => setFilterStatus('active')}
          active={filterStatus === 'active'}
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          icon={XCircle}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
          onClick={() => setFilterStatus('inactive')}
          active={filterStatus === 'inactive'}
        />
        <StatCard
          title="Reports Pending"
          value={stats.pendingReports}
          icon={AlertCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          href="/admin/reports"
          className={stats.pendingReports > 0 ? "border-red-200 bg-red-50/10" : ""}
        />
      </div>


      {/* Bulk Actions & Selection */}
      {selectedInternships.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-primary/20 p-3 mb-4 flex flex-wrap gap-2 items-center animate-in slide-in-from-top-2">
          <span className="text-sm font-bold text-primary mr-2 bg-primary/5 px-2 py-1 rounded-lg">{selectedInternships.length} selected</span>
          <button onClick={() => handleBulkAction('activated')} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm">Activate All</button>
          <button onClick={() => handleBulkAction('deactivated')} className="px-4 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors shadow-sm">Deactivate All</button>
          <button onClick={() => handleBulkAction('deleted')} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm">Delete All</button>
          <button onClick={() => setSelectedInternships([])} className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">Clear</button>
        </div>
      )}

      {internships.length > 0 && (
        <div className="mb-3 px-1">
          <label className="group flex items-center gap-3 text-sm text-gray-700 cursor-pointer w-fit">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedInternships.length === internships.length && internships.length > 0}
                onChange={handleSelectAll}
                className="peer absolute opacity-0 w-5 h-5 cursor-pointer"
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded-md transition-all group-hover:border-primary peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 opacity-0 peer-checked:opacity-100 mb-0.5"></div>
              </div>
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">Select All ({internships.length})</span>
          </label>
        </div>
      )}

      {/* Internships List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center flex justify-center items-center flex-col gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-gray-500 font-black uppercase tracking-widest">Scanning Postings...</p>
          </div>
        ) : internships.length > 0 ? (
          internships.map((internship) => {
            const deadlineDate = new Date(internship.deadline);
            const today = new Date();
            const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isClosingSoon = diffDays > 0 && diffDays <= 7;

            return (
              <div key={internship._id} className={cn(
                "group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full",
                selectedInternships.includes(internship._id) && "ring-2 ring-primary/20 border-primary/30"
              )}>
                {/* Header: Icon + Info + Actions */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Company Logo Area */}
                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 shadow-sm overflow-hidden p-1 shrink-0">
                    {internship.companyId?.logo ? (
                      <img src={internship.companyId.logo} alt="" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <Building size={22} />
                    )}
                  </div>

                  {/* Identity Area */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-[17px] font-black text-gray-900 leading-tight group-hover:text-primary transition-colors truncate" title={internship.title}>
                      {internship.title}
                    </h3>
                    <p className="text-[11px] font-bold text-gray-400 truncate mt-0.5 uppercase tracking-widest leading-none flex items-center gap-1.5">
                      {internship.company}
                      {internship.companyId?.verified && <CheckCircle size={10} className="text-blue-500" fill="currentColor" />}
                    </p>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedInternships.includes(internship._id)}
                        onChange={() => handleSelectInternship(internship._id)}
                        className="peer absolute opacity-0 w-6 h-6 cursor-pointer z-10"
                      />
                      <div className="w-5 h-5 border-2 border-gray-200 rounded-lg transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center shadow-sm">
                        <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 opacity-0 peer-checked:opacity-100 mb-0.5"></div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border h-fit",
                      internship.status === 'active' ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                    )}>
                      {internship.status}
                    </div>
                  </div>
                </div>

                {/* Body: Full Width Metrics */}
                <div className="space-y-4 flex-1">

                  {/* Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-100 shadow-sm flex items-center gap-1">
                      <MapPin size={10} />
                      {internship.location}
                    </span>
                    {isClosingSoon && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100 animate-pulse shadow-sm">
                        Closes in {diffDays}d
                      </span>
                    )}
                  </div>

                  {/* Info Grid - Rich Data */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Stipend</p>
                      <p className="text-[11px] font-black text-emerald-600 truncate flex items-center gap-1">
                        <IndianRupee size={10} />
                        {internship.stipend > 0 ? internship.stipend.toLocaleString() : 'Unpaid'}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Duration</p>
                      <p className="text-[11px] font-bold text-gray-700 truncate">{internship.durationWeeks || internship.duration || 0} Weeks</p>
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors col-span-2 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Applicant Activity</p>
                        <p className="text-[11px] font-black text-primary truncate flex items-center gap-1.5">
                          <Users size={12} />
                          {internship.applicants || 0} Submissions
                        </p>
                      </div>
                      <div className="bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                        <p className="text-[8px] font-black text-primary/60 uppercase tracking-tighter leading-none">Openings</p>
                        <p className="text-[13px] font-black text-primary leading-none mt-1">{internship.openings || internship.positions || 1}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedInternship(internship)}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                    >
                      <Eye size={12} /> View Details
                    </button>
                    <div className="flex items-center gap-1">
                      {internship.status !== 'active' ? (
                        <button
                          onClick={() => handleAction(internship._id, 'activate')}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all"
                          title="Activate"
                        >
                          <CheckCircle size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(internship._id, 'deactivate')}
                          className="p-1.5 text-orange-400 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all"
                          title="Deactivate"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(internship._id, 'delete')}
                        className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                        title="Delete Internship"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={Briefcase}
              title="No internships found"
              description="Try adjusting your filters or search query"
              actionLabel="Reset Filters"
              onAction={() => { setFilterStatus('all'); setSearchQuery(''); }}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        type={confirmDialog.type}
      />

      {/* Internship Details Modal */}
      {/* Internship Details Modal */}
      {
        selectedInternship && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-fit max-w-[95vw] sm:max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col h-auto max-h-[95vh]">
              {/* Premium Header Pattern */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 p-2 sm:px-3 sm:py-2.5 flex items-center justify-between overflow-hidden relative group/modal-header shrink-0">
                <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover/modal-header:bg-primary/10 transition-colors duration-700" />
                <div className="relative flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover/modal-header:scale-105 transition-all duration-500 shadow-md">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-black text-gray-900 leading-normal tracking-tight uppercase px-1">Internship Registry Detail</h2>
                    <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest px-1">Posting & Recruiter Overview</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInternship(null)}
                  className="relative z-10 text-gray-400 hover:text-gray-900 p-1.5 rounded-xl hover:bg-gray-100 transition-all active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-2.5 sm:p-3 overflow-y-visible space-y-2.5 scrollbar-hide bg-gray-50/20 flex-1">
                {/* Profile Header Block */}
                <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                  <div className="w-12 h-12 rounded-[14px] bg-gray-50 border-2 border-gray-100 flex items-center justify-center text-gray-300 font-black text-xl shrink-0 group hover:border-primary/20 transition-all duration-300 hover:shadow-inner">
                    <Building size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-black text-gray-900 mb-0.5 truncate tracking-tight">{selectedInternship?.title}</h3>
                    <p className="text-[11px] font-bold text-gray-400 mb-1.5 truncate flex items-center gap-1.5 leading-none">
                      <span className="text-gray-900">{selectedInternship?.company}</span>
                      {selectedInternship?.companyId?.verified && <CheckCircle size={10} className="text-blue-500" fill="currentColor" />}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5",
                        selectedInternship?.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", selectedInternship?.status === 'active' ? 'bg-green-500' : 'bg-orange-500')} />
                        {selectedInternship?.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1.5">
                        <MapPin size={10} />
                        {selectedInternship?.mode || 'On-site'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data Grid Section */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Stipend</span>
                    <p className="text-[13px] font-black text-emerald-600 flex items-center gap-1">
                      <IndianRupee size={12} />
                      {selectedInternship?.stipend?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</span>
                    <p className="text-[13px] font-black text-gray-900 leading-none">{selectedInternship?.durationWeeks || selectedInternship?.duration || 0} Weeks</p>
                  </div>
                  <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Applicants</span>
                    <p className="text-[13px] font-black text-primary leading-none">{selectedInternship?.applicants || 0}</p>
                  </div>
                  <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Openings</span>
                    <p className="text-[13px] font-black text-gray-900 leading-none">{selectedInternship?.openings || selectedInternship?.positions || 1}</p>
                  </div>
                </div>

                {/* Supplemental Info */}
                <div className="space-y-2.5">
                  <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm shadow-gray-100/30">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 px-0.5">Timeline & Reach</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 px-2.5 py-1.5 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Posted Date</span>
                        <span className="text-[10px] font-bold text-gray-700">{formatDate(selectedInternship?.createdAt)}</span>
                      </div>
                      <div className="flex flex-col gap-1 px-2.5 py-1.5 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Expiry Date</span>
                        <span className="text-[10px] font-bold text-gray-700">{formatDate(selectedInternship?.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm shadow-gray-100/30">
                    <h4 className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 px-0.5">Skills Required</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedInternship?.skillsRequired || selectedInternship?.skills || []).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-50/50 border border-gray-100 text-[9px] font-black text-gray-600 rounded-xl hover:bg-white transition-colors">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-3 shadow-xl shadow-gray-200/50 ring-1 ring-white/10 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-3 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                    <Briefcase size={48} className="text-white" />
                  </div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal System ID</span>
                  <code className="text-[12px] font-mono text-gray-300 break-all leading-relaxed relative z-10">
                    {selectedInternship?._id}
                  </code>
                </div>
              </div>

              <div className="px-4 py-1.5 bg-white border-t border-gray-100 flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => setSelectedInternship(null)}
                  className="px-5 py-1.5 bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-100"
                >
                  Close View
                </button>
                {selectedInternship?.status !== 'active' ? (
                  <button
                    onClick={() => {
                      if (selectedInternship?._id) {
                        handleAction(selectedInternship._id, 'activate');
                        setSelectedInternship(null);
                      }
                    }}
                    className="px-5 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle size={12} /> Activate Entry
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (selectedInternship?._id) {
                        handleAction(selectedInternship._id, 'deactivate');
                        setSelectedInternship(null);
                      }
                    }}
                    className="px-5 py-1.5 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-95 flex items-center gap-1.5"
                  >
                    <Ban size={12} /> Deactivate Entry
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default function ManageInternships() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}>
      <ManageInternshipsContent />
    </Suspense>
  )
}
