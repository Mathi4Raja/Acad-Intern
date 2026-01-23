'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, Loader2, Briefcase } from 'lucide-react'
import api from '@/lib/api'
import InternshipCard from '@/components/internships/InternshipCard'
import { Internship } from '@/types'
import { PageHeader } from '@/components/common'

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
        // Fallback to regular list if not logged in or match endpoint fails
        response = await api.get(`/internships?${params.toString()}`)
      }

      if (response.data.success) {
        let data = response.data.data || []

        // Sort based on selection
        if (sortBy === 'match') {
          // Sort handling for match score (safely handle undefined)
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

  const handleToggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const formatStipend = useCallback((stipend: number) => {
    if (stipend >= 1000) {
      return `₹${(stipend / 1000).toFixed(0)}K/month`
    }
    return `₹${stipend}/month`
  }, [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }, [])

  const getModeLabel = useCallback((mode: string) => {
    const labels: Record<string, string> = {
      remote: 'Remote',
      onsite: 'On-site',
      hybrid: 'Hybrid'
    }
    return labels[mode] || mode
  }, [])

  const getCompanyIcon = useCallback((companyName: string) => {
    // Generate consistent emoji based on company name
    const icons = ['🏢', '🚀', '💡', '⚡', '🔷', '🌟', '💼', '🎯']
    const index = companyName.length % icons.length
    return icons[index]
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Header */}
      <PageHeader
        title="Browse Internships"
        subtitle="Discover opportunities that match your skills and interests"
      />

      {/* Search and Filter Bar */}
      <div className="mb-4">
        <div className="flex gap-2 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, skills, company..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 border rounded-lg transition-all duration-200 text-sm font-medium w-full md:w-auto ${showFilters
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid items-end md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Work Mode</label>
              <select
                value={filters.mode}
                onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                {modeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Duration</label>
              <select
                value={filters.maxDuration}
                onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="">Any Duration</option>
                <option value="8">≤ 8 weeks</option>
                <option value="12">≤ 12 weeks</option>
                <option value="16">≤ 16 weeks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Min. Stipend</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  value={filters.minStipend}
                  onChange={(e) => setFilters({ ...filters, minStipend: e.target.value })}
                  placeholder="e.g. 10000"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <p className="text-gray-600 font-medium">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching opportunities...
            </span>
          ) : (
            `${internships.length} internships found`
          )}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'match' | 'recent' | 'stipend')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white font-medium text-gray-700"
          >
            <option value="match">Best Match</option>
            <option value="recent">Most Recent</option>
            <option value="stipend">Highest Stipend</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-gray-500 font-medium">Finding best matches for you...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-24 bg-white rounded-xl border border-red-100">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-red-500 mb-6">{error}</p>
          <button
            onClick={fetchInternships}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && internships.length === 0 && (
        <div className="text-center py-24 bg-white rounded-xl border border-gray-200">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No internships found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            We couldn't find any internships matching your current filters. Try adjusting your search criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setFilters({ mode: '', maxDuration: '', minStipend: '' })
            }}
            className="mt-6 text-primary font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Internships Grid */}
      {!loading && !error && internships.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {internships.map((internship) => (
            <InternshipCard
              key={internship._id}
              internship={internship}
              isSaved={savedIds.has(internship._id)}
              onToggleSave={handleToggleSave}
              getCompanyIcon={getCompanyIcon}
              formatStipend={formatStipend}
              formatDate={formatDate}
              getModeLabel={getModeLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
