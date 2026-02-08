'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, Loader2, Briefcase, Sparkles } from 'lucide-react'
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
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`

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
    <div className="max-w-7xl mx-auto p-3 sm:p-5">
      {/* Header with Search Actions */}
      <div className="mb-6 flex flex-col items-center sm:flex-row justify-between gap-4">
        <div className="bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl shadow-sm border border-indigo-100/50 p-3 sm:px-4 sm:py-3 w-full sm:w-auto overflow-hidden relative group">
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles size={20} className="fill-indigo-400/20" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                Browse Internships
              </h1>
              <p className="text-xs text-gray-600 font-medium">
                Discover opportunities that match your skills
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-100/50 rounded-full blur-2xl group-hover:bg-indigo-100/80 transition-colors" />
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-purple-100/50 rounded-full blur-2xl group-hover:bg-purple-100/80 transition-colors" />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72 md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search internships..."
              className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm placeholder:text-gray-400 hover:border-gray-300"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 border rounded-xl transition-all duration-200 text-sm font-semibold shadow-sm active:scale-95 ${showFilters
              ? 'border-primary bg-primary text-white shadow-primary/25 shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Filters Panel (Collapsible) */}

      {/* Filters Panel */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid items-end md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Work Mode</label>
            <select
              value={filters.mode}
              onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer bg-white hover:border-gray-300"
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
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all cursor-pointer bg-white hover:border-gray-300"
            >
              <option value="">Any Duration</option>
              <option value="8">≤ 8 weeks</option>
              <option value="12">≤ 12 weeks</option>
              <option value="16">≤ 16 weeks</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Min. Stipend</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium group-focus-within:text-primary transition-colors">₹</span>
              <input
                type="number"
                value={filters.minStipend}
                onChange={(e) => setFilters({ ...filters, minStipend: e.target.value })}
                placeholder="e.g. 10000"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm hover:border-gray-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Count and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2">
        <p className="text-gray-600 font-medium">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching opportunities...
            </span>
          ) : (
            <span className="text-gray-600">
              <span className="font-bold text-gray-900">{internships.length}</span>
              <span className="ml-1">internships found</span>
            </span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Sort by</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'recent' | 'stipend')}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none bg-white font-semibold text-gray-700 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all shadow-sm"
            >
              <option value="match">Best Match</option>
              <option value="recent">Most Recent</option>
              <option value="stipend">Highest Stipend</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {
        loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-gray-500 font-medium">Finding best matches for you...</p>
          </div>
        )
      }

      {/* Error State */}
      {
        error && !loading && (
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
        )
      }

      {/* Empty State */}
      {
        !loading && !error && internships.length === 0 && (
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
        )
      }

      {/* Internships Grid */}
      {
        !loading && !error && internships.length > 0 && (
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
        )
      }
    </div >
  )
}
