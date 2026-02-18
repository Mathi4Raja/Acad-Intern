'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Search, MapPin, Clock, Building2, Filter, X, Menu } from 'lucide-react'
import { INTERNSHIP_MODES, getLabel } from '@/lib/constants'

// Helper to format "x days ago"
const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

interface Internship {
    id: string;
    title: string;
    company: string;
    logo?: string;
    location: string;
    mode: string;
    duration: string;
    stipend: number;
    description: string;
    skills: string[];
    openings: number;
    postedAt: string;
    createdAt: string; // Keep original for calculations if needed
    updatedAt: string;
}

interface InternshipsClientProps {
    initialInternships: Internship[];
}

export default function InternshipsClient({ initialInternships }: InternshipsClientProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        mode: 'all',
        duration: 'all',
        stipend: 'all',
        skills: [] as string[]
    })

    // Initialize with passed props
    const [allInternships] = useState<Internship[]>(initialInternships)
    const [filteredInternships, setFilteredInternships] = useState<Internship[]>(initialInternships)
    const [sortBy, setSortBy] = useState('recent')

    // Filtering Effect
    useEffect(() => {
        const result = allInternships.filter(internship => {
            const matchesSearch =
                internship.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                internship.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                internship.skills?.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesMode = filters.mode === 'all' || internship.mode === filters.mode;

            let matchesDuration = true;
            if (filters.duration !== 'all') {
                const weeks = parseInt(internship.duration.split(' ')[0]) || 0;
                if (filters.duration === 'short') matchesDuration = weeks < 8;
                else if (filters.duration === 'medium') matchesDuration = weeks >= 8 && weeks <= 12;
                else if (filters.duration === 'long') matchesDuration = weeks > 12;
            }

            let matchesStipend = true;
            if (filters.stipend !== 'all') {
                const amount = internship.stipend;
                if (filters.stipend === '0-10000') matchesStipend = amount <= 10000;
                else if (filters.stipend === '10000-15000') matchesStipend = amount > 10000 && amount <= 15000;
                else if (filters.stipend === '15000+') matchesStipend = amount > 15000;
            }

            return matchesSearch && matchesMode && matchesDuration && matchesStipend;
        });

        // Apply sorting
        const sorted = [...result].sort((a, b) => {
            if (sortBy === 'stipend') {
                return b.stipend - a.stipend; // Highest first
            } else if (sortBy === 'duration') {
                const weeksA = parseInt(a.duration.split(' ')[0]) || 0;
                const weeksB = parseInt(b.duration.split(' ')[0]) || 0;
                return weeksA - weeksB; // Shortest first
            }
            // Default: recent (relying on initial order from server or client sort)
            // Since we don't have exact Date objects easily without reparsing, we assume initialData is sorted by date desc
            return 0;
        });

        setFilteredInternships(sorted);
    }, [searchQuery, filters, allInternships, sortBy]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-xl sm:text-2xl font-bold text-primary hover:scale-110 transition-transform">
                            AcadIntern
                        </Link>
                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/internships" className="text-primary font-medium">
                                Internships
                            </Link>
                            <Link href="/about" className="text-gray-700 hover:text-primary transition-colors">
                                About
                            </Link>
                            <Link href="/login" className="text-gray-700 hover:text-primary transition-colors">
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base shadow-lg shadow-primary/20"
                            >
                                Get Started Free
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                        <div className="px-4 py-3 space-y-3">
                            <Link
                                href="/internships"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium"
                            >
                                Internships
                            </Link>
                            <Link
                                href="/about"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                            >
                                About
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/signup"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
                            >
                                Get Started Free
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-accent">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center text-white mb-5">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Find Your Dream Internship</h1>
                        <p className="text-sm sm:text-base text-white/80">
                            Explore {allInternships.length}+ opportunities from top companies
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg flex items-center gap-2 px-3 py-2">
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search by title, company, or skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 py-1 focus:outline-none text-sm bg-transparent"
                            />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${showFilters ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filters */}
            {showFilters && (
                <section className="bg-white border-b border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Work Mode</label>
                                <select
                                    value={filters.mode}
                                    onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="all">All Modes</option>
                                    {INTERNSHIP_MODES.map(mode => (
                                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                                <select
                                    value={filters.duration}
                                    onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="all">All Durations</option>
                                    <option value="short">Less than 8 weeks</option>
                                    <option value="medium">8-12 weeks</option>
                                    <option value="long">More than 12 weeks</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Stipend</label>
                                <select
                                    value={filters.stipend}
                                    onChange={(e) => setFilters({ ...filters, stipend: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="all">All Ranges</option>
                                    <option value="0-10000">₹0 - ₹10,000</option>
                                    <option value="10000-15000">₹10,000 - ₹15,000</option>
                                    <option value="15000+">₹15,000+</option>
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({ mode: 'all', duration: 'all', stipend: 'all', skills: [] })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Results */}
            <section className="py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-gray-600">
                            <span className="font-bold text-gray-900">{filteredInternships.length}</span> internships found
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border-0 bg-transparent font-medium text-gray-700 focus:ring-0 cursor-pointer pr-6"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="stipend">Highest Stipend</option>
                                <option value="duration">Shortest Duration</option>
                            </select>
                        </div>
                    </div>

                    {/* Internship Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredInternships.map((internship) => (
                            <div
                                key={internship.id}
                                className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-200 flex flex-col"
                            >
                                {/* Header Row */}
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Company Icon (Logo hidden for public) */}
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center text-xl shadow-sm overflow-hidden border border-gray-100">
                                            <Building2 className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors truncate mb-1">
                                                {internship.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span className="truncate font-medium">{internship.company}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-base font-bold text-primary">
                                            ₹{internship.stipend.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-400">/month</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-[11px] font-bold border border-gray-100 transition-colors group-hover:bg-gray-100/80">
                                        <MapPin className="w-3 h-3" />{getLabel(INTERNSHIP_MODES, internship.mode)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-[11px] font-bold border border-gray-100 transition-colors group-hover:bg-gray-100/80">
                                        <Clock className="w-3 h-3" />{internship.duration}
                                    </span>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-black border border-emerald-100/50 uppercase tracking-wider">
                                        {internship.openings} opening{internship.openings > 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Skills Tags */}
                                <div className="flex flex-wrap gap-1.5 mb-4 items-start">
                                    {
                                        internship.skills.slice(0, 3).map((skill: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-2.5 py-1 bg-blue-50 text-primary rounded-full text-[11px] font-bold border border-primary/10 transition-all group-hover:bg-blue-100/50"
                                            >
                                                {skill}
                                            </span>
                                        ))
                                    }
                                    {
                                        internship.skills.length > 3 && (
                                            <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-full text-[11px] font-bold border border-gray-100">
                                                +{internship.skills.length - 3}
                                            </span>
                                        )
                                    }
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <span className="text-xs text-gray-400">{internship.postedAt}</span>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/internships/${internship.id}`}
                                            className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors font-medium"
                                        >
                                            Details
                                        </Link>
                                        <Link
                                            href={`/login?redirect=/internships/${internship.id}`}
                                            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                        >
                                            Apply
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* No Results */}
                    {
                        filteredInternships.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No internships found</h3>
                                <p className="text-gray-500 text-sm mb-4">Try adjusting your search or filters</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('')
                                        setFilters({ mode: 'all', duration: 'all', stipend: 'all', skills: [] })
                                    }}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                >
                                    Clear Search
                                </button>
                            </div>
                        )
                    }
                </div >
            </section >

            {/* Footer */}
            < footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8" >
                <div className="max-w-7xl mx-auto text-center">
                    <Link href="/" className="text-xl font-bold text-white hover:text-primary/80 transition-colors">
                        AcadIntern
                    </Link>
                    <p className="mt-2 text-gray-400 text-sm">
                        © 2026 AcadIntern. All rights reserved.
                    </p>
                    <div className="mt-4 flex justify-center gap-6 text-sm">
                        <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                            Terms
                        </Link>
                        <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                            Privacy
                        </Link>
                        <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                            About
                        </Link>
                    </div>
                </div>
            </footer >
        </div >
    )
}
