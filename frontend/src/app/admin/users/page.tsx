'use client'

import { useState, useEffect, Suspense } from 'react'
import { Search, Filter, Mail, Phone, Calendar, Edit, Trash2, Ban, CheckCircle, XCircle, Eye, Download, Loader2, X, ChevronRight, Shield, Activity, Users as UsersIcon, Building, Briefcase, User as UserIcon } from 'lucide-react'
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

      // Fetch User as UserIcon,
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

  // Handle deep-linking to specific user via ID
  useEffect(() => {
    const userId = searchParams.get('id');
    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      const fetchSpecificUser = async () => {
        try {
          const res = await api.get('/admin/users', { params: { id: userId } });
          if (res.data.success && res.data.data.length > 0) {
            setSelectedUser(res.data.data[0]);
          }
        } catch (error) {
          console.error('Error fetching deep-linked user:', error);
        }
      };
      fetchSpecificUser();
    }
  }, [searchParams]);

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
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4">
      {/* Ultra-Compact Premium Header Card */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-2.5 sm:p-3 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group/header mb-2">
        {/* Background Glow Effect */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover/header:bg-primary/10 transition-colors duration-700" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover/header:bg-blue-500/10 transition-colors duration-700" />

        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover/header:scale-110 group-hover/header:rotate-6 transition-all duration-500 shadow-lg shadow-gray-200">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-green-500 border-2 border-white flex items-center justify-center animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <h1 className="text-[15px] font-black text-gray-900 leading-none tracking-tight uppercase">
              User Management
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Manage user accounts and permissions
              </p>
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-red-500" />
                <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Admin Access</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-2">
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

      {/* Select All UI */}
      {users.length > 0 && (
        <div className="mb-3 px-1">
          <label className="group flex items-center gap-3 text-sm text-gray-700 cursor-pointer w-fit">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={handleSelectAll}
                className="peer absolute opacity-0 w-5 h-5 cursor-pointer"
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded-md transition-all group-hover:border-primary peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 opacity-0 peer-checked:opacity-100 mb-0.5"></div>
              </div>
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">Select All ({users.length})</span>
          </label>
        </div>
      )}



      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-primary/20 p-3 mb-4 flex flex-wrap gap-2 items-center animate-in slide-in-from-top-2">
          <span className="text-sm font-bold text-primary mr-2 bg-primary/5 px-2 py-1 rounded-lg">{selectedUsers.length} selected</span>
          <button onClick={() => handleBulkAction('activated')} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm">Activate All</button>
          <button onClick={() => handleBulkAction('suspended')} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm">Suspend All</button>
          <button onClick={() => handleBulkAction('deleted')} className="px-4 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-colors shadow-sm">Delete All</button>
          <button onClick={() => setSelectedUsers([])} className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">Clear</button>
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
              "group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative flex flex-col h-full",
              selectedUsers.includes(user._id) && "ring-2 ring-primary/20 border-primary/30"
            )}>
              {/* Header: Icon + Info + Actions */}
              <div className="flex items-center gap-3 mb-4">
                {/* Avatar/Icon Area */}
                <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-300 shadow-sm overflow-hidden shrink-0">
                  {user.role === 'company' ? <Building size={22} /> : <UsersIcon size={22} />}
                </div>

                {/* Identity Area */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-black text-gray-900 leading-tight group-hover:text-primary transition-colors truncate" title={user.role === 'company' ? user.companyName : user.name}>
                    {user.role === 'company' ? (user.companyName || user.name) : user.name}
                  </h3>
                  <div className="flex flex-col mt-0.5 gap-0.5">
                    {user.role === 'company' && (
                      <p className="text-[10px] font-bold text-gray-500 truncate flex items-center gap-1.5">
                        <UserIcon size={10} strokeWidth={2.5} /> {user.name}
                      </p>
                    )}
                    <p className="text-[11px] font-bold text-gray-400 truncate flex items-center gap-1.5">
                      <Mail size={10} strokeWidth={2.5} /> {user.email}
                    </p>
                  </div>
                </div>

                {/* Control Cluster */}
                <div className="flex flex-col items-end gap-2 shrink-0">
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
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border h-fit",
                    getStatusColor(user.status).includes('green')
                      ? "bg-green-50 text-green-700 border-green-100"
                      : user.status === 'suspended'
                        ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-yellow-50 text-yellow-700 border-yellow-100"
                  )}>
                    {user.status}
                  </div>
                </div>
              </div>

              {/* Body: Full Width Content */}
              <div className="space-y-3 flex-1 flex flex-col">
                {/* Role & Verification Badge */}
                <div className="flex items-center gap-2">
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
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold text-gray-700 truncate flex items-center gap-1.5">
                        <Phone size={10} className="text-gray-400" /> {user.phone || 'N/A'}
                      </p>
                      <p className="text-[10px] font-bold text-gray-700 truncate flex items-center gap-1.5">
                        <Mail size={10} className="text-gray-400" /> {user.email}
                      </p>
                    </div>
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
      {
        totalPages > 1 && !loading && (
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
        )
      }

      {/* User Details Modal */}
      {
        selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-fit max-w-[95vw] sm:max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col h-auto max-h-[95vh]">
              {/* Premium Header Pattern */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 p-2 sm:px-3 sm:py-2.5 flex items-center justify-between overflow-hidden relative group/modal-header shrink-0">
                <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover/modal-header:bg-primary/10 transition-colors duration-700" />
                <div className="relative flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover/modal-header:scale-105 transition-all duration-500 shadow-md">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-black text-gray-900 leading-normal tracking-tight uppercase px-1">User Registry Detail</h2>
                    <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest px-1">Profile & Activity Overview</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="relative z-10 text-gray-400 hover:text-gray-900 p-1.5 rounded-xl hover:bg-gray-100 transition-all active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-2.5 sm:p-3 overflow-y-visible space-y-2.5 scrollbar-hide bg-gray-50/20 flex-1">
                {/* Profile Header Block */}
                <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                  <div className="w-12 h-12 rounded-[14px] bg-gray-50 border-2 border-gray-100 flex items-center justify-center text-gray-300 font-black text-xl shrink-0 group hover:border-primary/20 transition-all duration-300 hover:shadow-inner">
                    <UserIcon size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-black text-gray-900 mb-0.5 truncate tracking-tight">{selectedUser?.name}</h3>
                    <p className="text-[11px] font-bold text-gray-400 mb-1.5 truncate flex items-center gap-1.5 leading-none">
                      <Mail size={12} className="shrink-0" /> {selectedUser?.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5",
                        selectedUser?.role === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                      )}>
                        {selectedUser?.role}
                        {selectedUser?.role === 'company' && selectedUser?.verified && <CheckCircle size={10} fill="currentColor" className="text-white" />}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5",
                        selectedUser?.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", selectedUser?.status === 'active' ? 'bg-green-500' : 'bg-red-500')} />
                        {selectedUser?.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data Grid Section */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Primary Contact</span>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-gray-400" />
                      <p className="text-[12px] font-black text-gray-900 leading-none">{selectedUser?.phone || 'Registry Missing'}</p>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Registry Entry</span>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-gray-400" />
                      <p className="text-[12px] font-black text-gray-900 leading-none">{formatDate(selectedUser?.createdAt)}</p>
                    </div>
                  </div>

                  {selectedUser?.role === 'student' ? (
                    <>
                      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Academic Dept</span>
                        <p className="text-[12px] font-black text-gray-900 truncate tracking-tight">{selectedUser?.department || 'General'}</p>
                      </div>
                      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30">
                        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">App Count</span>
                        <p className="text-[12px] font-black text-primary tracking-tight">{selectedUser?.applications || 0} Submissions</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30 col-span-2">
                        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Company Affiliation</span>
                        <div className="flex items-center gap-2">
                          <Building size={12} className="text-gray-400" />
                          <p className="text-[12px] font-black text-gray-900 truncate tracking-tight">{selectedUser?.companyName || 'Corporate Entity'}</p>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/30 col-span-2">
                        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Posting History</span>
                        <div className="flex items-center gap-2">
                          <Briefcase size={12} className="text-primary/60" />
                          <p className="text-[12px] font-black text-primary tracking-tight">{selectedUser?.internshipsPosted || 0} Active Internships</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Unique Identifier Area */}
                <div className="bg-gray-900 rounded-2xl p-3 shadow-xl shadow-gray-200/50 ring-1 ring-white/10 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-3 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                    <Shield size={48} className="text-white" />
                  </div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Registry ID</span>
                  <code className="text-[12px] font-mono text-gray-300 break-all leading-relaxed relative z-10">
                    {selectedUser?._id}
                  </code>
                </div>
              </div>

              <div className="px-4 py-1.5 bg-white border-t border-gray-100 flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-5 py-1.5 bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-100"
                >
                  Close View
                </button>
                {selectedUser?.status === 'active' ? (
                  <button
                    onClick={() => {
                      if (selectedUser?._id) {
                        handleAction(selectedUser._id, 'suspend');
                        setSelectedUser(null);
                      }
                    }}
                    className="px-5 py-1.5 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-95"
                  >
                    Suspend Entry
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (selectedUser?._id) {
                        handleAction(selectedUser._id, 'activate');
                        setSelectedUser(null);
                      }
                    }}
                    className="px-5 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                  >
                    Activate Entry
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

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

export default function ManageUsers() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>}>
      <ManageUsersContent />
    </Suspense>
  )
}
