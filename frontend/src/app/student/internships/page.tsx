'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, Loader2, Briefcase, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import InternshipCard from '@/components/internships/InternshipCard'
import { Internship } from '@/types'

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

      let response
      try {
        response = await api.get(`/internships/match?${params.toString()}`)
      } catch {
        response = await api.get(`/internships?${params.toString()}`)
      }

      if (response.data.success) {
        let data = response.data.data || []

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchInternships()
    }, 300)
    return () => clearTimeout(timeout)
  }, [fetchInternships])

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
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
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
    const icons = ['🏢', '🚀', '💡', '⚡', '🔷', '🌟', '💼', '🎯']
    const index = companyName.length % icons.length
    return icons[index]
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5">
      {/* Header and Search */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
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
                Find opportunities that match your skills
              </p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-100/50 rounded-full blur-2xl group-hover:bg-indigo-100/80 transition-colors" />
          <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-purple-100/50 rounded-full blur-2xl group-hover:bg-purple-100/80 transition-colors" />
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, companies..."
            className="w-full h-10 pl-10 pr-4 text-xs font-bold bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Results Header: Count | Filters | Sort */}
      <div className="flex items-center justify-between gap-4 mb-6 bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-100/50 shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
        <div className="flex items-center gap-4 flex-shrink-0">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest hidden sm:block">Results</p>
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : (
            <span className="font-black text-gray-900 text-sm">{internships.length}</span>
          )}

          <div className="h-4 w-[1px] bg-gray-200" />

          {/* Inline Filters */}
          {showFilters ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <select
                value={filters.mode}
                onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                className="h-8 px-3 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-gray-100"
              >
                <option value="">All Modes</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>

              <select
                value={filters.maxDuration}
                onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
                className="h-8 px-3 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-gray-100"
              >
                <option value="">Duration</option>
                <option value="8">≤ 8w</option>
                <option value="12">≤ 12w</option>
                <option value="16">≤ 16w</option>
              </select>

              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">₹</span>
                <input
                  type="number"
                  value={filters.minStipend}
                  onChange={(e) => setFilters({ ...filters, minStipend: e.target.value })}
                  placeholder="Min stipend"
                  className="h-8 w-24 pl-5 pr-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
          ) : (
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Filters inactive</p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 hidden lg:block">Sort By</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'match' | 'recent' | 'stipend')}
                className="appearance-none pl-3 pr-8 h-8 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-gray-100"
              >
                <option value="match">Match</option>
                <option value="recent">Recent</option>
                <option value="stipend">Stipend</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-gray-200 mr-1" />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center justify-center gap-2 h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
              showFilters
                ? 'bg-primary text-white shadow-lg shadow-primary/20 border-primary'
                : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-200'
            )}
          >
            <SlidersHorizontal size={12} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* States */}
      {loading && internships.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-gray-500 font-medium">Finding best matches for you...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-24 bg-white rounded-2xl border border-red-100">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-red-500 mb-6">{error}</p>
          <button onClick={fetchInternships} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && internships.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No internships found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your filters.</p>
          <button
            onClick={() => { setSearchQuery(''); setFilters({ mode: '', maxDuration: '', minStipend: '' }) }}
            className="mt-6 text-primary font-bold hover:underline py-2 px-4 rounded-lg hover:bg-primary/5 transition-all"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && internships.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in duration-500">
          {internships.map((internship) => (
            <InternshipCard
              key={internship._id}
              internship={internship}
              getCompanyIcon={getCompanyIcon}
              formatStipend={formatStipend}
              formatDate={formatDate}
              getModeLabel={getModeLabel}
              showLogo={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
