'use client'

import { useState, useEffect, Suspense } from 'react'
import { Search, Filter, Mail, Phone, Globe, MapPin, Calendar, CheckCircle, XCircle, Shield, Building, Briefcase, Eye, Ban, Trash2, Loader2, Building2 } from 'lucide-react'
import api from '@/lib/api'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'react-hot-toast'
import { useSearchParams, useRouter } from 'next/navigation'

interface Company {
  _id: string
  companyName: string
  userId: {
    _id: string
    name: string
    email: string
  }
  website?: string
  description?: string
  cin?: string
  verified: boolean
  status: 'active' | 'pending' | 'suspended'
  createdAt: string
}

function ManageCompaniesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all')
  const [filterVerified, setFilterVerified] = useState(searchParams.get('verified') || 'all')

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
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
    verified: 0,
    unverified: 0,
    active: 0,
    pending: 0,
    suspended: 0
  })

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
  useEffect(() => { updateUrlParams('verified', filterVerified) }, [filterVerified])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Stats
      const statsRes = await api.get('/admin/stats')
      const s = statsRes.data.data.stats
      setStats({
        total: s.totalCompanies,
        verified: s.verifiedCompanies || 0,
        unverified: s.unverifiedCompanies || 0,
        active: s.activeCompanies || 0,
        pending: s.pendingCompanies || 0,
        suspended: s.suspendedCompanies || 0
      })

      // Fetch Companies
      const params: any = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterVerified !== 'all') params.verified = filterVerified === 'verified'

      const companiesRes = await api.get('/admin/companies', { params })
      setCompanies(companiesRes.data.data)
    } catch (error) {
      console.error('Error fetching companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [debouncedSearch, filterStatus, filterVerified])

  const handleAction = (id: string, action: 'verify' | 'unverify' | 'activate' | 'suspend' | 'delete') => {
    const title = action === 'delete' ? 'Delete Company' : `${action.charAt(0).toUpperCase() + action.slice(1)} Company`
    const message = `Are you sure you want to ${action} this company?`

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type: action === 'delete' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          if (action === 'delete') {
            await api.delete(`/admin/companies/${id}`)
            toast.success('Company deleted')
          } else {
            const updates: any = {}
            if (action === 'verify') updates.verified = true
            if (action === 'unverify') updates.verified = false
            if (action === 'activate') updates.status = 'active'
            if (action === 'suspend') updates.status = 'suspended'
            await api.put(`/admin/companies/${id}`, updates)
            toast.success(`Company ${action}ed`)
          }
          fetchData()
          setSelectedCompanies(prev => prev.filter(cid => cid !== id))
        } catch (error) {
          console.error(`Error performing ${action}:`, error)
          toast.error(`Failed to ${action} company`)
        }
      }
    })
  }

  const handleBulkAction = (action: string) => {
    if (selectedCompanies.length === 0) return

    setConfirmDialog({
      isOpen: true,
      title: `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Are you sure you want to ${action} ${selectedCompanies.length} companies?`,
      type: action === 'deleted' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          if (action === 'deleted') {
            await Promise.all(selectedCompanies.map(id => api.delete(`/admin/companies/${id}`)))
          } else {
            const updates: any = {}
            if (action === 'verified') updates.verified = true
            if (action === 'suspended') updates.status = 'suspended'
            await Promise.all(selectedCompanies.map(id => api.put(`/admin/companies/${id}`, updates)))
          }
          toast.success(`Companies ${action} successfully`)
          setSelectedCompanies([])
          fetchData()
        } catch (error) {
          console.error('Bulk action error:', error)
          toast.error('Some operations failed')
        }
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'suspended': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([])
    } else {
      setSelectedCompanies(companies.map(c => c._id))
    }
  }

  const handleSelectCompany = (id: string) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id])
  }

  return (
    <div className="p-3 sm:p-4 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Manage Companies</h1>
          <p className="text-xs text-gray-600">Verify and manage company accounts on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-primary/20 text-primary' : 'bg-white text-gray-600 hover:bg-gray-100'} border border-gray-200 shadow-sm`}><Search size={20} /></button>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-primary/20 text-primary' : 'bg-white text-gray-600 hover:bg-gray-100'} border border-gray-200 shadow-sm`}><Filter size={20} /></button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Verified', value: stats.verified, color: 'text-green-600' },
          { label: 'Unverified', value: stats.unverified, color: 'text-yellow-600' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Suspended', value: stats.suspended, color: 'text-red-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
            <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">{stat.label}</p>
            <p className={`text-base sm:text-xl lg:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search... (Keeping existing modals logic but skipping verbosity in artifact for brevity if I could, but wait, I need full file) */}
      {/* ... keeping Search Modal & Filter Modal similar to before ... */}
      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email..."
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
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between rounded-b-xl border-t border-gray-100">
              <button onClick={() => { setFilterStatus('all'); setFilterVerified('all') }} className="text-sm font-medium text-gray-600">Reset</button>
              <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCompanies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3 flex flex-wrap gap-2 items-center animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-gray-600 mr-2">{selectedCompanies.length} selected</span>
          <button onClick={() => handleBulkAction('verified')} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700">Verify All</button>
          <button onClick={() => handleBulkAction('suspended')} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700">Suspend All</button>
          <button onClick={() => handleBulkAction('deleted')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700">Delete All</button>
          <button onClick={() => setSelectedCompanies([])} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50">Clear</button>
        </div>
      )}

      {/* Select All */}
      {companies.length > 0 && (
        <div className="mb-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedCompanies.length === companies.length && companies.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
            />
            <span className="font-medium">Select All ({companies.length})</span>
          </label>
        </div>
      )}

      {/* Companies List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : companies.length > 0 ? (
          companies.map((company) => (
            <div key={company._id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-3 hover:shadow-md transition-shadow">
              <div className="flex gap-3">
                <div className="flex items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company._id)}
                    onChange={() => handleSelectCompany(company._id)}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 truncate">{company.companyName}</h3>
                        {company.verified && <Shield className="text-blue-600 fill-blue-100" size={16} />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                          {(company.status)}
                        </span>
                        {!company.verified && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Unverified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={14} className="text-gray-400" />
                      {company.userId?.email}
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Calendar size={14} className="text-gray-400" />
                      Joined {formatDate(company.createdAt)}
                    </div>
                    {company.website && (
                      <div className="flex items-center gap-2 truncate">
                        <Globe size={14} className="text-gray-400" />
                        <a href={company.website} target="_blank" className="text-primary hover:underline">{company.website}</a>
                      </div>
                    )}
                    {company.cin && (
                      <div className="flex items-center gap-2 truncate">
                        <Building size={14} className="text-gray-400" />
                        <span className="font-mono">{company.cin}</span>
                        <a href="https://www.mca.gov.in/mcafoportal/companyLLPMasterData.do" target="_blank" className="text-xs text-primary hover:underline ml-1">(Verify)</a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-l border-gray-100 pl-3 ml-1">
                  {!company.verified && (
                    <button onClick={() => handleAction(company._id, 'verify')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Verify Company">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {company.verified && (
                    <button onClick={() => handleAction(company._id, 'unverify')} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Revoke Verification">
                      <XCircle size={18} />
                    </button>
                  )}
                  {company.status !== 'suspended' ? (
                    <button onClick={() => handleAction(company._id, 'suspend')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Suspend Account">
                      <Ban size={18} />
                    </button>
                  ) : (
                    <button onClick={() => handleAction(company._id, 'activate')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Activate Account">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => handleAction(company._id, 'delete')} className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Delete Company">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Building2}
            title="No companies found"
            description="Try adjusting your filters or search query"
            actionLabel="Reset Filters"
            onAction={() => { setFilterStatus('all'); setFilterVerified('all'); setSearchQuery(''); }}
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

export default function ManageCompanies() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}>
      <ManageCompaniesContent />
    </Suspense>
  )
}
