'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, User, Briefcase, Star, Mail, Calendar, CheckCircle, XCircle, Clock, Loader2, Users, FileText, MessageCircle } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { StatCard } from '@/components/analytics/StatCard'
import { useAlert } from '@/components/ui/AlertProvider'

interface Application {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  position: string
  internshipId: string
  appliedDate: string
  status: string
  matchScore: number
  skills: string[]
  cgpa?: number
}

interface Internship {
  id: string
  title: string
  skillsRequired: string[]
}

export default function Applications() {
  const { showAlert } = useAlert()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterInternship, setFilterInternship] = useState(searchParams.get('internship') || 'all')
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [selectedAppForInterview, setSelectedAppForInterview] = useState<string | null>(null)
  const [interviewForm, setInterviewForm] = useState({
    date: '',
    time: '',
    meetingLink: `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
  })
  const router = useRouter()

  const handleViewProfile = (studentId: string) => {
    router.push(`/company/student/${studentId}`)
  }

  // Fetch internships and their applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)

        // Fetch company's internships
        const internshipsRes = await api.get('/internships/company/my')
        const myInternships = internshipsRes.data.data || []

        setInternships(myInternships.map((i: any) => ({
          id: i._id,
          title: i.title,
          skillsRequired: i.skillsRequired || []
        })))

        // Fetch applications for each internship
        const allApplications: Application[] = []
        for (const internship of myInternships) {
          try {
            const appsRes = await api.get(`/applications/internship/${internship._id}`)
            const apps = appsRes.data.data || []
            const internshipSkills = (internship.skillsRequired || []).map((s: string) => s.toLowerCase())

            apps.forEach((app: any) => {
              // Calculate match score based on student skills vs internship requirements
              const studentSkills = (app.studentId?.skills || []).map((s: string) => s.toLowerCase())
              let matchScore = 0

              if (internshipSkills.length > 0 && studentSkills.length > 0) {
                const matchedSkills = internshipSkills.filter((skill: string) => studentSkills.includes(skill))
                matchScore = Math.round((matchedSkills.length / internshipSkills.length) * 100)
              }

              allApplications.push({
                id: app._id,
                studentId: app.studentId?._id || app.studentId,
                studentName: app.studentId?.name || 'Unknown Student',
                studentEmail: app.studentId?.email || '',
                position: internship.title,
                internshipId: internship._id,
                appliedDate: app.appliedAt,
                status: app.status,
                matchScore,
                skills: app.studentId?.skills || [],
                cgpa: app.studentId?.cgpa
              })
            })
          } catch (err) {
            console.error(`Failed to fetch applications for internship ${internship._id}:`, err)
          }
        }

        setApplications(allApplications)
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUpdateStatus = async (applicationId: string, status: string, interviewDetails?: any) => {
    try {
      setActionLoading(applicationId)
      await api.patch(`/applications/${applicationId}/status`, {
        status,
        ...(interviewDetails && { interviewDetails })
      })

      // Update local state
      setApplications(prev => prev.map(app =>
        app.id === applicationId ? { ...app, status } : app
      ))
      if (status === 'interview_scheduled') {
        showAlert('Interview scheduled successfully!', 'success')
        setShowInterviewModal(false)
      }
    } catch (err: any) {
      console.error('Failed to update status:', err)
      showAlert(err.response?.data?.message || 'Failed to update application status', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const openInterviewModal = (appId: string) => {
    setSelectedAppForInterview(appId)
    setShowInterviewModal(true)
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus
    const matchesInternship = filterInternship === 'all' || app.internshipId === filterInternship
    return matchesSearch && matchesStatus && matchesInternship
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'shortlisted':
        return 'bg-green-100 text-green-700'
      case 'assessment_completed':
        return 'bg-purple-100 text-purple-700'
      case 'accepted':
        return 'bg-blue-100 text-blue-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleSelectApplication = (id: string) => {
    setSelectedApplications(prev =>
      prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(filteredApplications.map(app => app.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedApplications.length === 0) {
      showAlert('Please select at least one application', 'warning')
      return
    }

    try {
      for (const appId of selectedApplications) {
        await api.patch(`/applications/${appId}/status`, { status: action })
      }

      // Update local state
      setApplications(prev => prev.map(app =>
        selectedApplications.includes(app.id) ? { ...app, status: action } : app
      ))

      showAlert(`${selectedApplications.length} application(s) ${action}!`, 'success')
      setSelectedApplications([])
    } catch (err) {
      console.error('Bulk action failed:', err)
      showAlert('Some applications failed to update', 'error')
    }
  }

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center sm:flex-row justify-between gap-4">
        <div className="bg-gradient-to-br from-white to-green-50/50 rounded-2xl shadow-sm border border-green-100/50 p-3 sm:px-4 sm:py-3 w-full sm:w-auto overflow-hidden relative group">
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg text-white shadow-lg shadow-green-500/20 group-hover:scale-105 transition-transform duration-300">
              <FileText size={20} className="fill-green-400/20" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                Applications
              </h1>
              <p className="text-xs text-gray-600 font-medium">
                Review and manage student applications across all your internships.
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-green-100/50 rounded-full blur-2xl group-hover:bg-green-100/80 transition-colors" />
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-emerald-100/50 rounded-full blur-2xl group-hover:bg-emerald-100/80 transition-colors" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Users}
          iconColor="text-gray-600"
          iconBg="bg-gray-100"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-50"
        />
        <StatCard
          title="Shortlisted"
          value={stats.shortlisted}
          icon={Star}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          icon={CheckCircle}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterInternship}
              onChange={(e) => setFilterInternship(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Internships</option>
              {internships.map(internship => (
                <option key={internship.id} value={internship.id}>
                  {internship.title}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="assessment_completed">Assessment Done</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              {selectedApplications.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('shortlisted')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm"
            >
              Shortlist All
            </button>
            <button
              onClick={() => handleBulkAction('rejected')}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm"
            >
              Reject All
            </button>
            <button
              onClick={() => setSelectedApplications([])}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-semibold"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Select All */}
      {filteredApplications.length > 0 && (
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900 selection:bg-transparent">
            <input
              type="checkbox"
              checked={selectedApplications.length === filteredApplications.length && filteredApplications.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="font-medium">Select All ({filteredApplications.length})</span>
          </label>
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Checkbox */}
                <div className="flex items-start pt-1">
                  <input
                    type="checkbox"
                    checked={selectedApplications.includes(app.id)}
                    onChange={() => handleSelectApplication(app.id)}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                  />
                </div>

                {/* Student Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 flex items-center gap-2">
                        <User size={18} className="text-gray-600" />
                        {app.studentName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 flex items-center gap-2">
                        <Briefcase size={16} />
                        Applied for: {app.position}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border bg-opacity-50 border-opacity-20 ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      <span className="px-2.5 sm:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold flex items-center gap-1 border border-primary/20">
                        <Star size={14} />
                        {app.matchScore}% match
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Mail size={14} className="text-gray-400" />
                      {app.studentEmail}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      Applied: {formatDate(app.appliedDate)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                    {/* Primary Actions Based on Status */}
                    {app.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                        disabled={actionLoading === app.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold disabled:opacity-50 shadow-sm"
                      >
                        {actionLoading === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Shortlist
                      </button>
                    )}

                    {app.status === 'assessment_completed' && (
                      <button
                        onClick={() => openInterviewModal(app.id)}
                        disabled={actionLoading === app.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-semibold disabled:opacity-50 shadow-sm"
                      >
                        <Calendar size={14} />
                        Schedule Interview
                      </button>
                    )}

                    {app.status === 'shortlisted' && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'assessment_completed')}
                        disabled={actionLoading === app.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-semibold disabled:opacity-50 shadow-sm"
                      >
                        {actionLoading === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Mark Assessment Done
                      </button>
                    )}

                    {(app.status === 'assessment_completed' || app.status === 'interview_scheduled') && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'accepted')}
                        disabled={actionLoading === app.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold disabled:opacity-50 shadow-sm"
                      >
                        {actionLoading === app.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Accept
                      </button>
                    )}
                    {/* Reject Button - Available at most stages */}
                    {['pending', 'shortlisted', 'assessment_completed', 'interview_scheduled'].includes(app.status) && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                        disabled={actionLoading === app.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors text-xs font-semibold disabled:opacity-50 shadow-sm rounded-lg"
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => router.push(`/company/messages?applicationId=${app.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors text-xs font-bold rounded-lg ml-auto"
                    >
                      <MessageCircle size={14} />
                      Message
                    </button>

                    <button
                      onClick={() => handleViewProfile(app.studentId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50/50 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                    >
                      <User size={14} />
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-500 text-base sm:text-lg">
              {applications.length === 0
                ? "No applications yet. Post internships to receive applications from students!"
                : "No applications found matching your filters"
              }
            </p>
          </div>
        )}
      </div>
      {/* Interview Scheduling Modal */}
      {
        showInterviewModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Calendar className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                        Schedule Interview
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Interview Date</label>
                          <input
                            type="date"
                            value={interviewForm.date}
                            onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Interview Time</label>
                          <input
                            type="time"
                            value={interviewForm.time}
                            onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Google Meet Link</label>
                          <input
                            type="url"
                            placeholder="https://meet.google.com/..."
                            value={interviewForm.meetingLink}
                            onChange={(e) => setInterviewForm({ ...interviewForm, meetingLink: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-bold"
                          />
                          <p className="mt-1 text-[10px] text-gray-500 font-medium italic">* A random Meet link has been generated for your convenience.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedAppForInterview!, 'interview_scheduled', interviewForm)}
                    disabled={!interviewForm.date || !interviewForm.time || !interviewForm.meetingLink || actionLoading === selectedAppForInterview}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-all shadow-indigo-200"
                  >
                    {actionLoading === selectedAppForInterview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Schedule & Notify Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInterviewModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-bold text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}
