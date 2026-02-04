'use client'

import { useState, useEffect, Suspense } from 'react'
import { Search, Filter, Mail, Phone, Calendar, Edit, Trash2, Ban, CheckCircle, XCircle, Eye, Download, Loader2, X } from 'lucide-react'
import api from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'react-hot-toast'

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  status: 'active' | 'pending' | 'suspended'
  joinedDate?: string
  createdAt?: string
  department?: string
  applications?: number
  companyName?: string
  internshipsPosted?: number
  verified?: boolean
}

function ManageUsersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || 'all')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    companies: 0,
    active: 0,
    pending: 0,
    suspended: 0
  })

  // Confirmation Dialog State
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

  // Sync URL on filter change
  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all' && value !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`?${params.toString()}`)
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      updateUrlParams('search', searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update URL for filters immediately
  useEffect(() => {
    updateUrlParams('role', filterRole)
  }, [filterRole])

  useEffect(() => {
    updateUrlParams('status', filterStatus)
  }, [filterStatus])

  // Fetch stats and users
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Stats
      const statsRes = await api.get('/admin/stats')
      const s = statsRes.data.data.stats
      setStats({
        total: s.totalUsers,
        students: s.totalStudents,
        companies: s.totalCompanies,
        active: s.activeUsers || 0,
        pending: s.pendingUsers || 0,
        suspended: s.suspendedUsers || 0
      })

      // Fetch Users
      const params: any = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (filterRole !== 'all') params.role = filterRole
      if (filterStatus !== 'all') params.status = filterStatus

      const usersRes = await api.get('/admin/users', { params })
      setUsers(usersRes.data.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [debouncedSearch, filterRole, filterStatus])

  const handleAction = (id: string, action: 'activate' | 'suspend' | 'delete') => {
    const title = action === 'delete' ? 'Delete User' : `${action.charAt(0).toUpperCase() + action.slice(1)} User`
    const message = `Are you sure you want to ${action} this user? This action cannot be undone.`

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type: action === 'delete' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          if (action === 'delete') {
            await api.delete(`/admin/users/${id}`)
            toast.success('User deleted successfully')
          } else {
            const status = action === 'activate' ? 'active' : 'suspended'
            await api.put(`/admin/users/${id}/status`, { status })
            toast.success(`User ${status === 'active' ? 'activated' : 'suspended'} successfully`)
          }
          fetchData()
          setSelectedUsers(prev => prev.filter(userId => userId !== id))
        } catch (error) {
          console.error(`Error performing ${action}:`, error)
          toast.error(`Failed to ${action} user`)
        }
      }
    })
  }

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) return

    setConfirmDialog({
      isOpen: true,
      title: `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Are you sure you want to ${action} ${selectedUsers.length} users?`,
      type: action === 'deleted' ? 'danger' : 'warning',
      onConfirm: async () => {
        try {
          if (action === 'deleted') {
            await Promise.all(selectedUsers.map(id => api.delete(`/admin/users/${id}`)))
          } else {
            const status = action === 'activated' ? 'active' : 'suspended'
            await Promise.all(selectedUsers.map(id => api.put(`/admin/users/${id}/status`, { status })))
          }
          toast.success(`Users ${action} successfully`)
          setSelectedUsers([])
          fetchData()
        } catch (error) {
          console.error(`Error performing bulk ${action}:`, error)
          toast.error(`Some bulk actions failed`)
        }
      }
    })
  }

  const getRoleColor = (role: string) => {
    return role === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
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
    // Using date-fns would be better but keeping native for now as requested or minimal dep
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u._id))
    }
  }

  const handleSelectUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id])
  }

  const clearFilter = (type: 'role' | 'status') => {
    if (type === 'role') setFilterRole('all')
    if (type === 'status') setFilterStatus('all')
  }

  return (
    <div className="p-3 sm:p-4 max-w-7xl mx-auto">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Manage Users</h1>
          <p className="text-xs text-gray-600">View and manage all registered users on the platform</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Total Users</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        {[
          { label: 'Students', value: stats.students, color: 'text-blue-600' },
          { label: 'Companies', value: stats.companies, color: 'text-purple-600' },
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

      {/* Filter Chips */}
      {(filterRole !== 'all' || filterStatus !== 'all') && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterRole !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              Role: {filterRole}
              <button onClick={() => clearFilter('role')} className="hover:text-blue-900"><X size={14} /></button>
            </span>
          )}
          {filterStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
              Status: {filterStatus}
              <button onClick={() => clearFilter('status')} className="hover:text-green-900"><X size={14} /></button>
            </span>
          )}
          <button
            onClick={() => { setFilterRole('all'); setFilterStatus('all'); }}
            className="text-xs text-gray-500 hover:text-gray-900 underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="company">Companies</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between rounded-b-xl border-t border-gray-100">
              <button onClick={() => { setFilterRole('all'); setFilterStatus('all') }} className="text-sm font-medium text-gray-600">Reset</button>
              <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3 flex flex-wrap gap-2 items-center animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-gray-600 mr-2">{selectedUsers.length} selected</span>
          <button onClick={() => handleBulkAction('activated')} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors">Activate</button>
          <button onClick={() => handleBulkAction('suspended')} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors">Suspend</button>
          <button onClick={() => handleBulkAction('deleted')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700 transition-colors">Delete</button>
          <button onClick={() => setSelectedUsers([])} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 transition-colors">Clear</button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-2 w-10">
                    <input type="checkbox" checked={selectedUsers.length === users.length && users.length > 0} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  </th>
                  <th className="p-2 text-xs font-bold text-gray-700 uppercase">User</th>
                  <th className="p-2 text-xs font-bold text-gray-700 uppercase">Role</th>
                  <th className="p-2 text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="p-2 text-xs font-bold text-gray-700 uppercase hidden sm:table-cell">Info</th>
                  <th className="p-2 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedUsers.includes(user._id)} onChange={() => handleSelectUser(user._id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${getRoleColor(user.role)}`}>
                        {user.role}
                        {user.role === 'company' && user.verified && <CheckCircle size={10} />}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-600 hidden sm:table-cell">
                      {user.role === 'student' && (
                        <>
                          <p>Dept: {user.department || '-'}</p>
                          <p>{user.applications || 0} applications</p>
                        </>
                      )}
                      {user.role === 'company' && (
                        <p>{user.internshipsPosted || 0} posts</p>
                      )}
                      <p className="text-gray-400 mt-0.5">{formatDate(user.createdAt)}</p>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.status === 'active' ? (
                          <button onClick={() => handleAction(user._id, 'suspend')} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Suspend"><Ban size={16} /></button>
                        ) : (
                          <button onClick={() => handleAction(user._id, 'activate')} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Activate"><CheckCircle size={16} /></button>
                        )}
                        <button onClick={() => handleAction(user._id, 'delete')} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">No users found.</div>
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

export default function ManageUsers() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}>
      <ManageUsersContent />
    </Suspense>
  )
}
