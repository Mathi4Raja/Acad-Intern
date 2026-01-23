'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Trash2, Ban, CheckCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'

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

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [debouncedSearch, filterRole, filterStatus])

  const handleAction = async (id: string, action: 'activate' | 'suspend' | 'delete') => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      if (action === 'delete') {
        await api.delete(`/admin/users/${id}`)
      } else {
        const status = action === 'activate' ? 'active' : 'suspended'
        await api.put(`/admin/users/${id}/status`, { status })
      }

      // Refresh data
      fetchData()
      setSelectedUsers(prev => prev.filter(userId => userId !== id))
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      alert(`Failed to ${action} user`)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return
    if (!confirm(`Are you sure you want to ${action} ${selectedUsers.length} users?`)) return

    try {
      // Execute sequentially to avoid overloading
      if (action === 'deleted') {
        await Promise.all(selectedUsers.map(id => api.delete(`/admin/users/${id}`)))
      } else {
        const status = action === 'activated' ? 'active' : 'suspended'
        await Promise.all(selectedUsers.map(id => api.put(`/admin/users/${id}/status`, { status })))
      }

      alert(`Users ${action} successfully`)
      setSelectedUsers([])
      fetchData()
    } catch (error) {
      console.error('Bulk action error:', error)
      alert(`Some operations failed`)
    }
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

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-6 flex items-start justify-between">
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

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
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
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Total Users</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Students</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.students}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Companies</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-purple-600">{stats.companies}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Active</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Pending</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Suspended</p>
          <p className="text-base sm:text-xl lg:text-2xl font-bold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="company">Companies</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-between rounded-b-xl">
              <button onClick={() => { setFilterRole('all'); setFilterStatus('all') }} className="text-sm font-medium text-gray-600">Clear All</button>
              <button onClick={() => setShowFilters(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">{selectedUsers.length} selected</span>
          <button onClick={() => handleBulkAction('activated')} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold">Activate</button>
          <button onClick={() => handleBulkAction('suspended')} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold">Suspend</button>
          <button onClick={() => handleBulkAction('deleted')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-semibold">Delete</button>
          <button onClick={() => setSelectedUsers([])} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold">Clear</button>
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
                  <th className="p-3 w-10">
                    <input type="checkbox" checked={selectedUsers.length === users.length && users.length > 0} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  </th>
                  <th className="p-3 text-xs font-bold text-gray-700 uppercase">User</th>
                  <th className="p-3 text-xs font-bold text-gray-700 uppercase">Role</th>
                  <th className="p-3 text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="p-3 text-xs font-bold text-gray-700 uppercase">Info</th>
                  <th className="p-3 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedUsers.includes(user._id)} onChange={() => handleSelectUser(user._id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        {user.role === 'company' && user.verified && (
                          <span className="flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold">
                            <CheckCircle size={10} /> Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-600">
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
                          <button onClick={() => handleAction(user._id, 'suspend')} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Suspend"><Ban size={16} /></button>
                        ) : (
                          <button onClick={() => handleAction(user._id, 'activate')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Activate"><CheckCircle size={16} /></button>
                        )}
                        <button onClick={() => handleAction(user._id, 'delete')} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={16} /></button>
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
    </div>
  )
}
