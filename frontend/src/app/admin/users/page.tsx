'use client'

import { useState, useEffect, Suspense } from 'react'
import { Search, Filter, Mail, Phone, Calendar, Edit, Trash2, Ban, CheckCircle, XCircle, Eye, Download, Loader2, X, ChevronRight, Users as UsersIcon, Building, Briefcase } from 'lucide-react'
import api from '@/lib/api'
import { StatCard } from '@/components/analytics/StatCard'
import { useAdminStats } from '@/lib/AdminStatsContext'
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 20

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
    // Check if we actally need to update page in URL? Usually good practice but might be overkill for this task.
    // Keeping it simple and resetting to page 1 on filter change
    router.replace(`?${params.toString()}`)
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      updateUrlParams('search', searchQuery)
      setCurrentPage(1) // Reset to page 1 on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Update URL for filters immediately
  useEffect(() => {
    updateUrlParams('role', filterRole)
    setCurrentPage(1) // Reset to page 1 on filter
  }, [filterRole])

  useEffect(() => {
    updateUrlParams('status', filterStatus)
    setCurrentPage(1) // Reset to page 1 on filter
  }, [filterStatus])

  // Fetch stats and users
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Stats (only need to fetch once or occasionally, but fetching here for simplicity)
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
      const params: any = {
        page: currentPage,
        limit: ITEMS_PER_PAGE
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (filterRole !== 'all') params.role = filterRole
      if (filterStatus !== 'all') params.status = filterStatus

      const usersRes = await api.get('/admin/users', { params })
      setUsers(usersRes.data.data)
      setTotalPages(usersRes.data.pages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [debouncedSearch, filterRole, filterStatus, currentPage])

  const { refreshStats } = useAdminStats()

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
          refreshStats() // Refresh sidebar stats
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
          refreshStats() // Refresh sidebar stats
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
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight mb-1">Manage Users</h1>
          <p className="text-xs text-gray-600 font-medium">View and manage all registered users on the platform</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
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

      {/* Stats Grid */}
      {/* Stats Grid */}
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          icon={UsersIcon}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
          onClick={() => { setFilterRole('all'); setFilterStatus('all'); }}
          active={filterRole === 'all' && filterStatus === 'all'}
        />
        <StatCard
          title="Students"
          value={stats.students}
          icon={Briefcase}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          onClick={() => setFilterRole('student')}
          active={filterRole === 'student'}
        />
        <StatCard
          title="Companies"
          value={stats.companies}
          icon={Building}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          onClick={() => setFilterRole('company')}
          active={filterRole === 'company'}
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
          title="Pending"
          value={stats.pending}
          icon={Loader2}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
          onClick={() => setFilterStatus('pending')}
          active={filterStatus === 'pending'}
        />
        <StatCard
          title="Suspended"
          value={stats.suspended}
          icon={Ban}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          onClick={() => setFilterStatus('suspended')}
          active={filterStatus === 'suspended'}
        />
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



      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3 flex flex-wrap gap-2 items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-gray-600">{selectedUsers.length} selected</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => handleBulkAction('activated')} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors">Activate</button>
            <button onClick={() => handleBulkAction('suspended')} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors">Suspend</button>
            <button onClick={() => handleBulkAction('deleted')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700 transition-colors">Delete</button>
            <button onClick={() => setSelectedUsers([])} className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50 transition-colors">Clear</button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : users.length > 0 ? (
          <>
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
                          <button onClick={() => setSelectedUser(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details"><Eye size={16} /></button>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, stats.total)}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronRight className="h-5 w-5 rotate-180" aria-hidden="true" />
                      </button>
                      {/* Simple Page Numbers - can be robustified later */}
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-gray-500">No users found.</div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                      {selectedUser.role === 'company' && selectedUser.verified && <CheckCircle size={10} />}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Contact</label>
                  <p className="text-gray-900">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Joined Date</label>
                  <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
                {selectedUser.role === 'student' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Department</label>
                      <p className="text-gray-900">{selectedUser.department || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Applications</label>
                      <p className="text-gray-900 font-medium">{selectedUser.applications || 0}</p>
                    </div>
                  </>
                )}
                {selectedUser.role === 'company' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Company Name</label>
                      <p className="text-gray-900">{selectedUser.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Internships Posted</label>
                      <p className="text-gray-900 font-medium">{selectedUser.internshipsPosted || 0}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">User ID</label>
                <code className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 block w-full truncate">
                  {selectedUser._id}
                </code>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition-colors"
              >
                Close
              </button>
              {selectedUser.status === 'active' ? (
                <button
                  onClick={() => {
                    handleAction(selectedUser._id, 'suspend');
                    setSelectedUser(null); // Optional: close modal on action? Maybe keep open. Let's close for now.
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                >
                  Suspend User
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleAction(selectedUser._id, 'activate');
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Activate User
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
