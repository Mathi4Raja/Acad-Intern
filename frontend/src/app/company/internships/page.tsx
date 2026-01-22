'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, MapPin, Clock, IndianRupee, Users, Eye, Edit, Trash2, ToggleLeft, ToggleRight, PlusCircle } from 'lucide-react'

export default function ManageInternships() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const internships = [
    {
      id: 1,
      title: 'Frontend Developer Intern',
      location: 'Bangalore, Karnataka',
      mode: 'Remote',
      duration: 3,
      stipend: 15000,
      positions: 2,
      applicants: 45,
      views: 234,
      postedDate: '2025-12-01',
      deadline: '2025-12-31',
      status: 'active',
      skills: ['React', 'JavaScript', 'CSS']
    },
    {
      id: 2,
      title: 'Backend Developer Intern',
      location: 'Hyderabad, Telangana',
      mode: 'Hybrid',
      duration: 6,
      stipend: 18000,
      positions: 3,
      applicants: 38,
      views: 189,
      postedDate: '2025-12-05',
      deadline: '2025-12-28',
      status: 'active',
      skills: ['Node.js', 'MongoDB', 'Express']
    },
    {
      id: 3,
      title: 'Data Science Intern',
      location: 'Mumbai, Maharashtra',
      mode: 'On-site',
      duration: 4,
      stipend: 20000,
      positions: 1,
      applicants: 32,
      views: 156,
      postedDate: '2025-12-08',
      deadline: '2025-12-25',
      status: 'active',
      skills: ['Python', 'Machine Learning', 'Data Analysis']
    },
    {
      id: 4,
      title: 'UI/UX Design Intern',
      location: 'Pune, Maharashtra',
      mode: 'Remote',
      duration: 3,
      stipend: 12000,
      positions: 2,
      applicants: 28,
      views: 142,
      postedDate: '2025-11-20',
      deadline: '2025-12-10',
      status: 'expired',
      skills: ['Figma', 'Adobe XD', 'Prototyping']
    },
    {
      id: 5,
      title: 'DevOps Intern',
      location: 'Delhi, NCR',
      mode: 'Hybrid',
      duration: 6,
      stipend: 16000,
      positions: 1,
      applicants: 15,
      views: 98,
      postedDate: '2025-11-15',
      deadline: '2025-12-05',
      status: 'inactive',
      skills: ['Docker', 'AWS', 'CI/CD']
    }
  ]

  const filteredInternships = internships.filter(internship => {
    const matchesSearch = internship.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || internship.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-700'
      case 'expired':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleToggleStatus = (id: number, currentStatus: string) => {
    console.log(`Toggle status for internship ${id} from ${currentStatus}`)
    alert('Status toggled! (This is a demo)')
  }

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      console.log(`Delete internship ${id}`)
      alert('Internship deleted! (This is a demo)')
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">My Internships</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your internship postings</p>
        </div>
        <Link
          href="/company/post-internship"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-primary/90 hover:scale-105 transition-all duration-300 font-semibold text-sm sm:text-base shadow-lg w-full sm:w-auto justify-center"
        >
          <PlusCircle size={20} />
          Post New Internship
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search internships..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-8 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Postings</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{internships.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">
            {internships.filter(i => i.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Applications</p>
          <p className="text-xl sm:text-2xl font-bold text-primary">
            {internships.reduce((sum, i) => sum + i.applicants, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Views</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {internships.reduce((sum, i) => sum + i.views, 0)}
          </p>
        </div>
      </div>

      {/* Internships List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredInternships.length > 0 ? (
          filteredInternships.map((internship) => (
            <div key={internship.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
              {/* Mobile: Stacked Layout, Desktop: Horizontal Layout */}
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Title and Status Row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex-1">{internship.title}</h3>
                  <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(internship.status)}`}>
                    {internship.status.charAt(0).toUpperCase() + internship.status.slice(1)}
                  </span>
                </div>

                {/* Info Grid - Optimized for Mobile */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span className="truncate">{internship.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="flex-shrink-0" />
                    {internship.duration} months
                  </span>
                  <span className="flex items-center gap-1">
                    <IndianRupee size={14} className="flex-shrink-0" />
                    ₹{internship.stipend.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} className="flex-shrink-0" />
                    {internship.positions} pos
                  </span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {internship.skills.map((skill) => (
                    <span key={skill} className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {internship.mode}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 lg:gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Users size={12} className="flex-shrink-0" />
                    <span className="font-medium text-gray-700">{internship.applicants}</span> applicants
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} className="flex-shrink-0" />
                    <span className="font-medium text-gray-700">{internship.views}</span> views
                  </span>
                  <span className="hidden sm:inline">Posted: {internship.postedDate}</span>
                  <span className="col-span-2 sm:col-span-1">Deadline: {internship.deadline}</span>
                </div>

                {/* Action Buttons - Improved Mobile Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <Link
                    href={`/company/applications?internship=${internship.id}`}
                    className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-xs sm:text-sm font-semibold"
                  >
                    <Users size={14} />
                    <span className="hidden xs:inline">View </span>Applications
                  </Link>
                  <button
                    onClick={() => alert(`Edit ${internship.title} (This is a demo)`)}
                    className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors text-xs sm:text-sm font-semibold"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(internship.id, internship.status)}
                    className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-semibold"
                  >
                    {internship.status === 'active' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    <span className="hidden sm:inline">{internship.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                    <span className="sm:hidden">{internship.status === 'active' ? 'Off' : 'On'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(internship.id, internship.title)}
                    className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs sm:text-sm font-semibold"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg mb-4">No internships found</p>
            <Link
              href="/company/post-internship"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              <PlusCircle size={20} />
              Post Your First Internship
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
