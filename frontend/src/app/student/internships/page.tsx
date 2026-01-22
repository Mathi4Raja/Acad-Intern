'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, MapPin, Clock, IndianRupee, Briefcase, Heart, ExternalLink, TrendingUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'

interface Internship {
  _id: string
  title: string
  description: string
  companyId: {
    _id: string
    companyName: string
  }
  skillsRequired: string[]
  durationWeeks: number
  stipend: number
  mode: 'remote' | 'onsite' | 'hybrid'
  openings: number
  isActive: boolean
  createdAt: string
  matchScore?: number
}

export default function InternshipsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    mode: '',
    maxDuration: '',
    minStipend: '',
  })
  const [internships, setInternships] = useState<Internship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'stipend'>('match')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const modeOptions = [
    { value: '', label: 'All' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'On-site' }
  ]

  // Fetch internships with filters
  const fetchInternships = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filters.mode) params.append('mode', filters.mode)
      if (filters.minStipend) params.append('minStipend', filters.minStipend)
      if (filters.maxDuration) params.append('maxDuration', filters.maxDuration)

      // Try match endpoint first (for logged in students), fallback to public
      let response
      try {
        response = await api.get(`/internships/match?${params.toString()}`)
      } catch {
        response = await api.get(`/internships?${params.toString()}`)
      }

      if (response.data.success) {
        let data = response.data.data || []

        // Sort based on selection
        if (sortBy === 'match') {
          data = data.sort((a: Internship, b: Internship) => (b.matchScore || 0) - (a.matchScore || 0))
        } else if (sortBy === 'recent') {
          data = data.sort((a: Internship, b: Internship) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        } else if (sortBy === 'stipend') {
          data = data.sort((a: Internship, b: Internship) => b.stipend - a.stipend)
        }

        setInternships(data)
      }
    } catch (err: any) {
      console.error('Failed to fetch internships:', err)
      setError('Failed to load internships')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filters, sortBy])

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchInternships()
    }, 300)
    return () => clearTimeout(timeout)
  }, [fetchInternships])

  const handleToggleSave = (id: string) => {
    setSavedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const formatStipend = (stipend: number) => {
    if (stipend >= 1000) {
      return `₹${(stipend / 1000).toFixed(0)}K/month`
    }
    return `₹${stipend}/month`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      remote: 'Remote',
      onsite: 'On-site',
      hybrid: 'Hybrid'
    }
    return labels[mode] || mode
  }

  const getCompanyIcon = (companyName: string) => {
    // Generate consistent emoji based on company name
    const icons = ['🏢', '🚀', '💡', '⚡', '🔷', '🌟', '💼', '🎯']
    const index = companyName.length % icons.length
    return icons[index]
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Browse Internships</h1>
        <p className="text-sm sm:text-base text-gray-600">Discover opportunities that match your skills and interests</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, skills, company..."
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 border rounded-lg transition-colors text-sm sm:text-base font-medium w-full sm:w-auto ${showFilters ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 hover:bg-gray-50'
              }`}
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
              <select
                value={filters.mode}
                onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                {modeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Duration (weeks)</label>
              <select
                value={filters.maxDuration}
                onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Any</option>
                <option value="8">≤ 8 weeks</option>
                <option value="12">≤ 12 weeks</option>
                <option value="16">≤ 16 weeks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min. Stipend (₹/month)</label>
              <input
                type="number"
                value={filters.minStipend}
                onChange={(e) => setFilters({ ...filters, minStipend: e.target.value })}
                placeholder="e.g., 10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Count and Sort */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600">
          {loading ? 'Loading...' : `${internships.length} internships found`}
        </p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'match' | 'recent' | 'stipend')}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
        >
          <option value="match">Best Match</option>
          <option value="recent">Most Recent</option>
          <option value="stipend">Highest Stipend</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchInternships}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && internships.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No internships found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Internships Grid */}
      {!loading && !error && internships.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {internships.map((internship) => (
            <div
              key={internship._id}
              className="group relative bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-5 sm:p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10/0 via-primary-50/0 to-primary-50/0 group-hover:from-primary/10/30 group-hover:via-primary-50/10 group-hover:to-transparent transition-all duration-300 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1">
                    <div className="text-3xl sm:text-4xl">{getCompanyIcon(internship.companyId?.companyName || '')}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">{internship.title}</h3>
                        {internship.matchScore && internship.matchScore >= 70 && (
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <TrendingUp size={12} />
                            {internship.matchScore}% match
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 font-medium mb-2">
                        {internship.companyId?.companyName || 'Company'}
                      </p>
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {getModeLabel(internship.mode)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {internship.durationWeeks} weeks
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-green-600">
                          <IndianRupee size={14} />
                          {formatStipend(internship.stipend)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSave(internship._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Heart size={20} fill={savedIds.has(internship._id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{internship.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {internship.skillsRequired.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {internship.skillsRequired.length > 4 && (
                    <span className="text-xs text-gray-500">+{internship.skillsRequired.length - 4} more</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Briefcase size={14} />
                      {internship.openings} openings
                    </span>
                    <span>Posted {formatDate(internship.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link
                      href={`/student/internships/${internship._id}`}
                      className="flex items-center justify-center gap-1 px-3 sm:px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none"
                    >
                      View Details
                      <ExternalLink size={14} />
                    </Link>
                    <button className="px-3 sm:px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg hover:from-primary/90 hover:to-primary/80 hover:shadow-lg transition-all duration-200 text-xs sm:text-sm font-semibold flex-1 sm:flex-none">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
