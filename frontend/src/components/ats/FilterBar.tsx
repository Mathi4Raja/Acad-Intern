'use client'

import { useState } from 'react'
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'

interface FilterBarProps {
    onSearch: (query: string) => void
    onFilterChange: (filters: FilterState) => void
    className?: string
}

export interface FilterState {
    status: string
    minMatchScore: number
    skills: string[]
    dateRange: string
}

const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interviewed', label: 'Interviewed' },
    { value: 'offered', label: 'Offered' },
    { value: 'rejected', label: 'Rejected' }
]

const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
]

export function FilterBar({ onSearch, onFilterChange, className }: FilterBarProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        status: 'all',
        minMatchScore: 0,
        skills: [],
        dateRange: 'all'
    })

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        onSearch(value)
    }

    const handleFilterUpdate = (key: keyof FilterState, value: string | number | string[]) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    const clearFilters = () => {
        const defaultFilters: FilterState = {
            status: 'all',
            minMatchScore: 0,
            skills: [],
            dateRange: 'all'
        }
        setFilters(defaultFilters)
        onFilterChange(defaultFilters)
    }

    const hasActiveFilters = filters.status !== 'all' || filters.minMatchScore > 0 || filters.dateRange !== 'all'

    return (
        <div className={cn('space-y-3', className)}>
            {/* Search and Toggle */}
            <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or skills..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors',
                        showFilters || hasActiveFilters
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    )}
                >
                    <SlidersHorizontal size={16} />
                    Filters
                    {hasActiveFilters && (
                        <span className="w-2 h-2 bg-white rounded-full" />
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Filters</h4>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                            >
                                <X size={14} />
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                            <Select
                                value={filters.status}
                                onChange={(val) => handleFilterUpdate('status', val)}
                                options={statusOptions}
                                className="!bg-gray-50 border-gray-200"
                                isFullWidth
                            />
                        </div>

                        {/* Match Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Min Match Score: {filters.minMatchScore}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="10"
                                value={filters.minMatchScore}
                                onChange={(e) => handleFilterUpdate('minMatchScore', parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Applied Date</label>
                            <Select
                                value={filters.dateRange}
                                onChange={(val) => handleFilterUpdate('dateRange', val)}
                                options={dateRangeOptions}
                                className="!bg-gray-50 border-gray-200"
                                isFullWidth
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
