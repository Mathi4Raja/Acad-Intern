'use client'

import { useState, useEffect, Suspense } from 'react'
import { cn } from '@/lib/utils'
import { Search, Filter, MapPin, Clock, IndianRupee, Users, Eye, CheckCircle, XCircle, Trash2, AlertCircle, Building, Loader2, Calendar, Briefcase, X } from 'lucide-react'
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
  }
  location: string
  mode: string
  duration: number
  stipend: number
  positions: number
  status: 'active' | 'inactive' | 'completed' | 'in_progress' | 'rejected'
  applicants: number
  createdAt: string
  deadline: string
  skills: string[]

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
    <div className="p-3 sm:p-4 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight mb-1">Manage Internships</h1>
          <p className="text-xs text-gray-600 font-medium">Review, approve, and moderate internship postings</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by title or company..."
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


      {/* Stats and stats grid... (kept brief for artifact but assumes full implementation in real file) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
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
            <span className="font-bold text-gray-600 group-hover:text-primary transition-colors">Select All ({internships.length})</span>
          </label>
        </div>
      )}

      {/* Internships List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center flex justify-center items-center flex-col gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-gray-500 font-medium">Loading internships...</p>
          </div>
        ) : internships.length > 0 ? (
          internships.map((internship) => (
            <div key={internship._id} className={cn(
              "group bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full",
              selectedInternships.includes(internship._id) && "ring-2 ring-primary/20 border-primary/30"
            )}>
              <div className="flex gap-3 h-full">
                {/* Column 1: Checkbox & Company Icon */}
                <div className="flex flex-col items-center gap-3 pt-0.5 shrink-0 w-6">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedInternships.includes(internship._id)}
                      onChange={() => handleSelectInternship(internship._id)}
                      className="peer absolute opacity-0 w-5 h-5 cursor-pointer z-10"
                    />
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-md transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center shadow-sm">
                      <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 opacity-0 peer-checked:opacity-100 mb-0.5"></div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300">
                    <Building size={16} />
                  </div>
                </div>

                {/* Column 2: Main Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[15px] font-black text-gray-900 leading-tight group-hover:text-primary transition-colors truncate" title={internship.title}>
                          {internship.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-[11px] font-bold text-gray-500 truncate">
                          {internship.company}
                        </p>
                        {internship.companyId?.verified && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-tight bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                            <CheckCircle size={8} fill="currentColor" className="text-white" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 h-fit",
                      internship.status === 'active'
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-orange-100 text-orange-700 border border-orange-200"
                    )}>
                      {internship.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 mt-1">
                    <div className="flex items-center gap-2 min-w-0 bg-gray-50/50 rounded-lg p-1.5 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-all">
                      <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <MapPin size={12} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 truncate">{internship.location}</span>
                    </div>
                    <div className="flex items-center gap-2 min-0 bg-gray-50/50 rounded-lg p-1.5 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-all">
                      <div className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                        <Clock size={12} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 truncate">{internship.duration} Months</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 bg-gray-50/50 rounded-lg p-1.5 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-all">
                      <div className="w-6 h-6 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <IndianRupee size={12} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 truncate">₹{internship.stipend.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 bg-gray-50/50 rounded-lg p-1.5 border border-transparent group-hover:bg-white group-hover:border-gray-100 transition-all">
                      <div className="w-6 h-6 rounded bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                        <Users size={12} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 truncate">{internship.positions} Openings</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2.5 border-t border-gray-100 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-gray-400">
                      <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/10">
                        <Users size={10} />
                        Applicants: <span className="text-gray-900">{internship.applicants || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        <span>Ends {formatDate(internship.deadline)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 border-t border-gray-50 pt-1 -mx-1">
                      <button
                        onClick={() => toast('View Details Demo - Coming Soon', { icon: '👀' })}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {internship.status !== 'active' ? (
                        <button
                          onClick={() => handleAction(internship._id, 'activate')}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110"
                          title="Activate"
                        >
                          <CheckCircle size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(internship._id, 'deactivate')}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all hover:scale-110"
                          title="Deactivate"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(internship._id, 'delete')}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
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
    </div >
  )
}

export default function ManageInternships() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}>
      <ManageInternshipsContent />
    </Suspense>
  )
}
