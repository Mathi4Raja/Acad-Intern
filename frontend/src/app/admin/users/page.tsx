'use client'

import { useState, useEffect, Suspense } from 'react'
import { Search, Filter, Mail, Phone, Calendar, Edit, Trash2, Ban, CheckCircle, XCircle, Eye, Download, Loader2, X, ChevronRight, Users as UsersIcon, Building, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      {/* Ultra-Compact Premium Header Card */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-3.5 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group/header mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 group-hover:scale-105 transition-all duration-500">
            <UsersIcon size={22} />
          </div>
          <div>
            <h1 className="text-[17px] font-black text-gray-900 leading-none tracking-tight uppercase">
              User Registry
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                System Directory & Authentication Audit
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Security Grid Active" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search registry..."
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

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center flex justify-center items-center flex-col gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Loading registry...</p>
          </div>
        ) : users.length > 0 ? (
          users.map((user) => (
            <div key={user._id} className={cn(
              "group bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full",
              selectedUsers.includes(user._id) && "ring-2 ring-primary/20 border-primary/30"
            )}>
              <div className="flex gap-4 h-full">
                {/* Column 1: Checkbox & Avatar */}
                <div className="flex flex-col items-center gap-3 pt-0.5 shrink-0 w-10">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleSelectUser(user._id)}
                      className="peer absolute opacity-0 w-6 h-6 cursor-pointer z-10"
                    />
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-lg transition-all peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center shadow-sm">
                      <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 opacity-0 peer-checked:opacity-100 mb-0.5"></div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 shadow-sm overflow-hidden">
                    {user.role === 'company' ? <Building size={20} /> : <UsersIcon size={20} />}
                  </div>
                </div>

                {/* Column 2: Main Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-black text-gray-900 leading-tight group-hover:text-primary transition-colors truncate" title={user.name}>
                        {user.name}
                      </h3>
                      <p className="text-[11px] font-bold text-gray-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border h-fit mt-0.5",
                      getStatusColor(user.status).replace('bg-', 'bg-').replace('text-', 'text-').includes('green')
                        ? "bg-green-50 text-green-700 border-green-100"
                        : user.status === 'suspended'
                          ? "bg-red-50 text-red-700 border-red-100"
                          : "bg-yellow-50 text-yellow-700 border-yellow-100"
                    )}>
                      {user.status}
                    </div>
                  </div>

                  {/* Role & Verification Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-sm",
                      user.role === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                    )}>
                      {user.role === 'student' ? <Briefcase size={10} /> : <Building size={10} />}
                      {user.role}
                    </span>
                    {user.role === 'company' && user.verified && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1 shadow-sm">
                        <CheckCircle size={10} fill="currentColor" className="text-white" />
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Info Grid - Rich Data */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact</p>
                      <p className="text-[11px] font-bold text-gray-700 truncate">{user.phone || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Joined</p>
                      <p className="text-[11px] font-bold text-gray-700 truncate">{formatDate(user.createdAt)}</p>
                    </div>
                    {user.role === 'student' ? (
                      <>
                        <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Dept</p>
                          <p className="text-[11px] font-bold text-gray-700 truncate">{user.department || '-'}</p>
                        </div>
                        <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Apps</p>
                          <p className="text-[11px] font-black text-primary truncate">{user.applications || 0}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100 group-hover:bg-white transition-colors col-span-2">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Posts Activity</p>
                          <p className="text-[11px] font-black text-gray-700 flex items-center gap-2">
                            <span className="text-primary font-black uppercase text-[10px] bg-primary/5 px-1.5 py-0.5 rounded-md border border-primary/10">
                              {user.internshipsPosted || 0} Total Listings
                            </span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                    >
                      <Eye size={12} /> View Registry
                    </button>
                    <div className="flex items-center gap-1">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleAction(user._id, 'suspend')}
                          className="p-1.5 text-orange-400 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all"
                          title="Suspend"
                        >
                          <Ban size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user._id, 'activate')}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all"
                          title="Activate"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(user._id, 'delete')}
                        className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                        title="Delete Permanently"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )).concat(totalPages > 1 ? [] : []) // Ghost cards or spacer could go here
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 text-gray-300 flex items-center justify-center mx-auto">
              <UsersIcon size={32} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Registry Empty</p>
              <p className="text-xs text-gray-400 font-bold mt-2">No users found matching your search parameters.</p>
            </div>
            <button
              onClick={() => { setFilterRole('all'); setFilterStatus('all'); setSearchQuery(''); }}
              className="text-[10px] font-black text-primary border border-primary/20 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-primary/5 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && (
        <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} className="rotate-180" />
            Previous
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-black text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {currentPage} / {totalPages}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 border border-blue-100 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="text-[17px] font-black text-gray-900 leading-none">User Registry Detail</h2>
                <p className="text-[11px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Profile & Activity Overview</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 scrollbar-hide">
              {/* Profile Header Block */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center text-gray-300 font-black text-3xl shrink-0 group hover:border-primary/20 transition-colors">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-gray-900 mb-1 truncate">{selectedUser.name}</h3>
                  <p className="text-xs font-bold text-gray-500 mb-3 truncate">{selectedUser.email}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5",
                      selectedUser.role === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                    )}>
                      {selectedUser.role}
                      {selectedUser.role === 'company' && selectedUser.verified && <CheckCircle size={10} fill="currentColor" className="text-white" />}
                    </span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm",
                      selectedUser.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                    )}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Grid Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Primary Contact</span>
                  <p className="text-sm font-black text-gray-900">{selectedUser.phone || 'Registry Missing'}</p>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Registry Entry</span>
                  <p className="text-sm font-black text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>

                {selectedUser.role === 'student' ? (
                  <>
                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Academic Dept</span>
                      <p className="text-sm font-black text-gray-900 truncate">{selectedUser.department || 'General'}</p>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">App Count</span>
                      <p className="text-sm font-black text-primary">{selectedUser.applications || 0} Submissions</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 col-span-2">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Company Affiliation</span>
                      <p className="text-sm font-black text-gray-900">{selectedUser.companyName || 'Corporate Entity'}</p>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 col-span-2">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Posting History</span>
                      <p className="text-sm font-black text-primary">{selectedUser.internshipsPosted || 0} Active Internships</p>
                    </div>
                  </>
                )}
              </div>

              {/* Unique Identifier Area */}
              <div className="bg-gray-900 rounded-2xl p-4 shadow-xl shadow-gray-200/50 ring-1 ring-white/10">
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Registry ID</span>
                <code className="text-[11px] font-mono text-gray-200 break-all leading-relaxed">
                  {selectedUser._id}
                </code>
              </div>
            </div>

            <div className="px-6 py-5 bg-white border-t border-gray-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2.5 border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-500 rounded-xl hover:bg-gray-50 transition-all"
              >
                Close View
              </button>
              {selectedUser.status === 'active' ? (
                <button
                  onClick={() => {
                    handleAction(selectedUser._id, 'suspend');
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2.5 bg-orange-50 text-orange-600 border border-orange-100 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-100 transition-all shadow-sm shadow-orange-100"
                >
                  Suspend Entry
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleAction(selectedUser._id, 'activate');
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all shadow-sm shadow-emerald-100"
                >
                  Activate Entry
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
