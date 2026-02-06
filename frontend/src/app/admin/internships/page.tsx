'use client'

import { useState, useEffect, Suspense } from 'react'
import { Search, Filter, MapPin, Clock, IndianRupee, Users, Eye, CheckCircle, XCircle, Trash2, AlertCircle, Building, Loader2, Calendar, Briefcase } from 'lucide-react'
import api from '@/lib/api'
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
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

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
      <div className="mb-4 sm:mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Manage Internships</h1>
          <p className="text-xs text-gray-600">Review, approve, and moderate internship postings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-primary/20 text-primary' : 'bg-white text-gray-600 hover:bg-gray-100'} border border-gray-200 shadow-sm`}><Search size={20} /></button>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-primary/20 text-primary' : 'bg-white text-gray-600 hover:bg-gray-100'} border border-gray-200 shadow-sm`}><Filter size={20} /></button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by title or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-xl border-t border-gray-100">
              <button onClick={() => setShowSearch(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats and stats grid... (kept brief for artifact but assumes full implementation in real file) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Inactive', value: stats.inactive, color: 'text-gray-600' },
          { label: 'Reports Pending', value: stats.pendingReports, color: 'text-red-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">{stat.label}</p>
            <p className={`text-base sm:text-xl lg:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between rounded-b-xl border-t border-gray-100">
              <button onClick={() => { setFilterStatus('all') }} className="text-sm font-medium text-gray-600">Reset</button>
              <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions & Selection */}
      {selectedInternships.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3 flex flex-wrap gap-2 items-center animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-gray-600 mr-2">{selectedInternships.length} selected</span>
          <button onClick={() => handleBulkAction('activated')} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700">Activate All</button>
          <button onClick={() => handleBulkAction('deactivated')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700">Deactivate All</button>
          <button onClick={() => handleBulkAction('deleted')} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700">Delete All</button>
          <button onClick={() => setSelectedInternships([])} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50">Clear</button>
        </div>
      )}

      {internships.length > 0 && (
        <div className="mb-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedInternships.length === internships.length && internships.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
            />
            <span className="font-medium">Select All ({internships.length})</span>
          </label>
        </div>
      )}

      {/* Internships List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : internships.length > 0 ? (
          internships.map((internship) => (
            <div key={internship._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-3 hover:shadow-md transition-shadow">
              <div className="flex gap-3">
                <div className="flex items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedInternships.includes(internship._id)}
                    onChange={() => handleSelectInternship(internship._id)}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className="text-base font-bold text-gray-900 truncate">{internship.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${getStatusColor(internship.status)}`}>
                      {internship.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <Building size={14} className="text-gray-400" />
                    {internship.company}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1"><MapPin size={12} /> {internship.location}</div>
                    <div className="flex items-center gap-1"><Clock size={12} /> {internship.duration} m</div>
                    <div className="flex items-center gap-1"><IndianRupee size={12} /> {internship.stipend.toLocaleString()}</div>
                    <div className="flex items-center gap-1"><Users size={12} /> {internship.positions} pos</div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-2 border-t border-gray-50">
                    <span>Applicants: <strong>{internship.applicants || 0}</strong></span>
                    <span>Posted: {formatDate(internship.createdAt)}</span>
                    <span>Deadline: {formatDate(internship.deadline)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-l border-gray-100 pl-3 ml-1">
                  {/* Actions */}
                  <button onClick={() => toast('View Details Demo - Coming Soon', { icon: '👀' })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details"><Eye size={18} /></button>
                  {internship.status !== 'active' ? (
                    <button onClick={() => handleAction(internship._id, 'activate')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Activate"><CheckCircle size={18} /></button>
                  ) : (
                    <button onClick={() => handleAction(internship._id, 'deactivate')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Deactivate"><XCircle size={18} /></button>
                  )}
                  <button onClick={() => handleAction(internship._id, 'delete')} className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No internships found"
            description="Try adjusting your filters or search query"
            actionLabel="Reset Filters"
            onAction={() => { setFilterStatus('all'); setSearchQuery(''); }}
          />
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
