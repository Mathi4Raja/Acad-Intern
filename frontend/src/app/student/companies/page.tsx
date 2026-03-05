'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, Loader2, Building2, MapPin, Briefcase, Sparkles, ChevronRight, Globe, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { companyApi } from '@/lib/api'
import Link from 'next/link'
import CompanyLogo from '@/components/common/CompanyLogo'

interface Company {
    _id: string
    companyName: string
    industry?: string
    location?: string
    logo?: string
    verified: boolean
    description?: string
    companySize?: string
}

export default function CompaniesPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        industry: '',
        location: '',
    })
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCompanies = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const params: any = {}
            if (searchQuery) params.search = searchQuery
            if (filters.industry) params.industry = filters.industry
            if (filters.location) params.location = filters.location

            const response = await companyApi.getCompanies(params)

            if (response.data.success) {
                setCompanies(response.data.data || [])
            }
        } catch (err: any) {
            console.error('Failed to fetch companies:', err)
            setError('Failed to load companies')
        } finally {
            setLoading(false)
        }
    }, [searchQuery, filters])

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCompanies()
        }, 300)
        return () => clearTimeout(timeout)
    }, [fetchCompanies])

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-5">
            {/* Header and Search */}
            <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl shadow-sm border border-indigo-100/50 p-3 sm:px-4 sm:py-3 w-full sm:w-auto overflow-hidden relative group">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Building2 size={20} className="fill-indigo-400/20" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                                Partner Companies
                            </h1>
                            <p className="text-xs text-gray-600 font-medium">
                                Connect with leading organizations
                            </p>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-100/50 rounded-full blur-2xl group-hover:bg-indigo-100/80 transition-colors" />
                    <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-purple-100/50 rounded-full blur-2xl group-hover:bg-purple-100/80 transition-colors" />
                </div>

                <div className="relative w-full md:w-96 group z-40">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search company names..."
                        className="w-full h-10 pl-10 pr-4 text-xs font-bold bg-white border border-gray-100 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white/70 backdrop-blur-md px-4 py-4 sm:py-2.5 rounded-2xl border border-gray-100/50 shadow-sm relative z-20">
                <div className="flex items-center gap-3">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 text-lg sm:text-sm">{companies.length}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Companies active</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center justify-center gap-2 h-9 sm:h-8 px-4 sm:px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 w-full sm:w-auto",
                            showFilters
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 border-primary'
                                : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-200'
                        )}
                    >
                        <SlidersHorizontal size={14} />
                        <span className="font-black">Advanced Search</span>
                    </button>

                    {showFilters && (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-top-2 duration-300 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100/50 relative z-20">
                            <div className="relative flex-1 min-w-[140px]">
                                <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                <input
                                    type="text"
                                    value={filters.industry}
                                    onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                                    placeholder="Industry..."
                                    className="h-8 w-full pl-8 pr-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div className="relative flex-1 min-w-[140px]">
                                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                <input
                                    type="text"
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    placeholder="Location..."
                                    className="h-8 w-full pl-8 pr-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            {loading && companies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 animate-pulse">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-gray-500 font-medium">Loading partner network...</p>
                </div>
            ) : error ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-red-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
                    <p className="text-red-500 mb-6">{error}</p>
                    <button onClick={fetchCompanies} className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                        Try Again
                    </button>
                </div>
            ) : companies.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No companies found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
                    {companies.map((company) => (
                        <Link
                            key={company._id}
                            href={`/student/companies/${company._id}`}
                            className="group bg-white rounded-[24px] border border-gray-100 p-5 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-primary/20 transition-all flex flex-col h-full relative overflow-hidden"
                        >
                            {/* Card Decoration */}
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl group-hover:bg-indigo-100/50 transition-colors" />

                            <div className="flex items-start gap-4 mb-4 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-50 p-1.5 shrink-0 group-hover:scale-105 transition-transform duration-300">
                                    <CompanyLogo
                                        name={company.companyName}
                                        logoUrl={company.logo}
                                        size="lg"
                                        className="!w-full !h-full !rounded-xl"
                                    />
                                </div>
                                <div className="pt-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <h3 className="text-base font-black text-gray-900 leading-tight group-hover:text-primary transition-colors">
                                            {company.companyName}
                                        </h3>
                                        {company.verified && (
                                            <CheckCircle size={14} className="text-blue-600 fill-blue-50" />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {company.industry && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                {company.industry}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 font-semibold line-clamp-2 mb-4 leading-relaxed flex-grow">
                                {company.description || "Discover opportunities at this organization."}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3">
                                    {company.location && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                            <MapPin size={12} className="text-gray-300" />
                                            {company.location}
                                        </div>
                                    )}
                                    {company.companySize && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                                            <Globe size={12} className="text-gray-300" />
                                            {company.companySize}
                                        </div>
                                    )}
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
