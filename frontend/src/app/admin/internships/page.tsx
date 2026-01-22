'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MapPin, Clock, IndianRupee, Users, Eye, CheckCircle, XCircle, Trash2, AlertCircle, Building, Loader2, Calendar } from 'lucide-react'
import api from '@/lib/api'

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
  isActive: boolean
  applicants: number
  createdAt: string
  deadline: string
  skills: string[]
  status: 'active' | 'inactive'
}

export default function ManageInternships() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedInternships, setSelectedInternships] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0, // treating as pending/inactive
    pendingReports: 0
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch stats and internships
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Stats
      const statsRes = await api.get('/admin/stats')
      const s = statsRes.data.data.stats
      setStats({
        total: s.totalInternships,
        active: s.activeInternships,
        inactive: s.totalInternships - s.activeInternships,
        pendingReports: s.pendingReports
      })

      // Fetch Internships
      const params: any = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (filterStatus !== 'all') params.status = filterStatus

      const internshipsRes = await api.get('/admin/internships', { params })
      setInternships(internshipsRes.data.data)
    } catch (error) {
      console.error('Error fetching internships:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [debouncedSearch, filterStatus])

  const handleAction = async (id: string, action: 'activate' | 'deactivate' | 'delete') => {
    if (!confirm(`Are you sure you want to ${action} this internship?`)) return

    try {
      if (action === 'delete') {
        await api.delete(`/admin/internships/${id}`)
      } else {
        const isActive = action === 'activate'
        await api.put(`/admin/internships/${id}`, { isActive })
      }

      fetchData()
      setSelectedInternships(prev => prev.filter(iid => iid !== id))
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      alert(`Failed to ${action} internship`)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedInternships.length === 0) return
    if (!confirm(`Are you sure you want to ${action} ${selectedInternships.length} internships?`)) return

    try {
      if (action === 'deleted') {
        await Promise.all(selectedInternships.map(id => api.delete(`/admin/internships/${id}`)))
      } else {
        const isActive = action === 'activated'
        await Promise.all(selectedInternships.map(id => api.put(`/admin/internships/${id}`, { isActive })))
      }

      alert(`Internships ${action} successfully`)
      setSelectedInternships([])
      fetchData()
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('Some operations failed')
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Manage Internships</h1>
          <p className="text-xs text-gray-600">Review, approve, and moderate internship postings</p>
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
                  placeholder="Search by title or company..."
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Total</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Active</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Inactive</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-gray-600">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Reports Pending</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-red-600">{stats.pendingReports}</p>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between rounded-b-xl">
              <button onClick={() => { setFilterStatus('all') }} className="text-sm font-medium text-gray-600">Clear All</button>
              <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedInternships.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">{selectedInternships.length} selected</span>
          <button onClick={() => handleBulkAction('activated')} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold">Activate All</button>
          <button onClick={() => handleBulkAction('deactivated')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-semibold">Deactivate All</button>
          <button onClick={() => handleBulkAction('deleted')} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold">Delete All</button>
          <button onClick={() => setSelectedInternships([])} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold">Clear</button>
        </div>
      )}

      {/* Select All */}
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
      <div className="space-y-2">
        {loading ? (
          <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : internships.length > 0 ? (
          internships.map((internship) => (
            <div key={internship._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2.5 hover:shadow-md transition-shadow">
              <div className="flex gap-2">
                {/* Checkbox */}
                <div className="flex items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedInternships.includes(internship._id)}
                    onChange={() => handleSelectInternship(internship._id)}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Internship Info */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{internship.title}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                        <Building size={12} />
                        {internship.company}
                      </p>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${getStatusColor(internship.isActive)}`}>
                          {internship.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">{internship.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="flex-shrink-0" />
                      {internship.duration} months
                    </div>
                    <div className="flex items-center gap-1">
                      <IndianRupee size={12} className="flex-shrink-0" />
                      ₹{internship.stipend.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="flex-shrink-0" />
                      {internship.positions} positions
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                        {internship.mode}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2 pb-2 border-b border-gray-100">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      <span className="font-medium text-gray-700">{internship.applicants || 0}</span> applicants
                    </span>
                    <span>Posted: {formatDate(internship.createdAt)}</span>
                    <span>Deadline: {formatDate(internship.deadline)}</span>
                  </div>
                </div>

                {/* Action Buttons - Right Side */}
                <div className="flex flex-col gap-1.5 ml-2">
                  <button
                    onClick={() => alert(`View details (This is a demo)`)}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  {!internship.isActive ? (
                    <button
                      onClick={() => handleAction(internship._id, 'activate')}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Activate"
                    >
                      <CheckCircle size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(internship._id, 'deactivate')}
                      className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      title="Deactivate"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(internship._id, 'delete')}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg">No internships found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
