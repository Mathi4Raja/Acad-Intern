'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Search, MapPin, Clock, DollarSign, Briefcase, Building2, Filter, X, ChevronDown, Menu } from 'lucide-react'
import api from '@/lib/api'

// Helper to format "x days ago"
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} days ago`;
}

export default function InternshipsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    mode: 'all',
    duration: 'all',
    stipend: 'all',
    skills: [] as string[]
  })

  const [allInternships, setAllInternships] = useState<any[]>([])
  const [filteredInternships, setFilteredInternships] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const res = await api.get('/internships'); // Public endpoint
        const data = res.data.data;

        const mapped = data.map((item: any) => ({
          id: item._id,
          title: item.title,
          company: item.companyId?.companyName || 'Unknown Company',
          location: item.mode === 'onsite' ? 'In-Office' : (item.mode.charAt(0).toUpperCase() + item.mode.slice(1)),
          mode: item.mode === 'onsite' ? 'In-Office' : (item.mode.charAt(0).toUpperCase() + item.mode.slice(1)),
          duration: `${item.durationWeeks} weeks`,
          stipend: item.stipend,
          description: item.description,
          skills: item.skillsRequired || [],
          openings: item.openings,
          postedAt: formatTimeAgo(item.createdAt)
        }));

        setAllInternships(mapped);
        setFilteredInternships(mapped);
      } catch (error) {
        console.error("Failed to fetch internships", error);
        setAllInternships([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternships();
  }, []);

  // Filtering Effect
  useEffect(() => {
    if (isLoading) return;

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

    setFilteredInternships(result);
  }, [searchQuery, filters, allInternships, isLoading]);

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
      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-white mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Find Your Dream Internship</h1>
            <p className="text-base sm:text-xl text-white/80">
              Explore {allInternships.length}+ opportunities from top companies
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Search className="hidden sm:block w-5 h-5 text-gray-400 ml-2" />
              <input
                type="text"
                placeholder="Search by title, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-2 py-2 sm:py-3 focus:outline-none text-sm sm:text-base"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm sm:text-base"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button className="bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base">
                Search
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
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="In-Office">In-Office</option>
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
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredInternships.length}</span> internships
            </p>
          </div>

          {/* Internship Cards */}
          <div className="space-y-6">
            {filteredInternships.map((internship) => (
              <div
                key={internship.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{internship.title}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{internship.company}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ₹{internship.stipend.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{internship.description}</p>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{internship.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{internship.mode}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{internship.duration}</span>
                  </div>
                  <div className="text-green-600 font-medium">
                    {internship.openings} opening{internship.openings > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {internship.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Posted {internship.postedAt}</span>
                  <div className="flex gap-3">
                    <Link
                      href={`/login?redirect=/internships/${internship.id}`}
                      className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium"
                    >
                      View Details
                    </Link>
                    <Link
                      href="/signup"
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredInternships.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No internships found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilters({ mode: 'all', duration: 'all', stipend: 'all', skills: [] })
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Apply?</h2>
          <p className="text-xl text-white/80 mb-8">
            Create your account to start applying to internships with one click
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-white/90 transition-all shadow-xl hover:-translate-y-1"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Link href="/" className="text-2xl font-bold text-white hover:text-primary/80 transition-colors">
            AcadIntern
          </Link>
          <p className="mt-4 text-gray-400">
            © 2026 AcadIntern. All rights reserved.
          </p>
          <div className="mt-6 flex justify-center gap-6">
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
      </footer>
    </div>
  )
}
