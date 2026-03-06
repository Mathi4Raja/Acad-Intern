'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Globe,
    MapPin,
    Building,
    CheckCircle,
    Loader2,
    Users,
    Calendar,
    Linkedin,
    Twitter,
    Instagram,
    ExternalLink,
    Briefcase,
    Search,
    ChevronRight,
    Award,
    Flag
} from 'lucide-react'
import { companyApi } from '@/lib/api'
import api from '@/lib/api'
import { ReportModal } from '@/components/common/ReportModal'
import CompanyLogo from '@/components/common/CompanyLogo'

interface CompanyProfile {
    _id: string
    companyName: string
    website?: string
    description?: string
    location?: string
    industry?: string
    companySize?: string
    founded?: string
    about?: string
    benefits?: string
    verified: boolean
    logo?: string
    banner?: string
    socialLinks?: {
        linkedin?: string
        twitter?: string
        instagram?: string
    }
}

interface Internship {
    _id: string
    title: string
    mode: string
    stipend: number
    durationWeeks: number
    location?: string
}

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

export default function CompanyProfilePage() {
    const { id } = useParams()
    const router = useRouter()
    const [company, setCompany] = useState<CompanyProfile | null>(null)
    const [internships, setInternships] = useState<Internship[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)

    useEffect(() => {
        if (id) {
            fetchData()
        }
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [profileRes, internshipsRes] = await Promise.all([
                companyApi.getProfile(id as string),
                api.get(`/internships?companyId=${id}`)
            ])

            if (profileRes.data.success) {
                setCompany(profileRes.data.data)
            }
            if (internshipsRes.data.success) {
                setInternships(internshipsRes.data.data)
            }
        } catch (err: any) {
            console.error('Failed to fetch company data:', err)
            setError('Failed to load company profile')
        } finally {
            setTimeout(() => setLoading(false), 200)
        }
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-6 rounded-3xl inline-block mb-8 shadow-sm">
                    <p className="font-bold text-lg">{error}</p>
                </div>
                <br />
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md group mb-6"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="font-semibold text-sm">Go Back</span>
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 pb-24">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md group mb-4"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="font-semibold text-sm">Go Back</span>
                </button>

                <div className="grid lg:grid-cols-4 gap-4">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Profile Card */}
                        <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 overflow-hidden">
                            {/* Shortened Mesh Banner */}
                            <div className="h-24 sm:h-32 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 animate-gradient-x"></div>
                                {company?.banner && (
                                    <img
                                        src={company.banner}
                                        alt={`${company.companyName} banner`}
                                        className="absolute inset-0 w-full h-full object-cover z-10"
                                    />
                                )}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-20 pointer-events-none"></div>
                            </div>

                            {/* Info Area */}
                            <div className="px-5 sm:px-6 pb-6 relative z-30">
                                {/* Mobile-only top-right report button */}
                                <button
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="absolute top-4 right-4 flex sm:hidden items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 border border-gray-100 bg-white shadow-sm z-40"
                                    title="Report Company"
                                >
                                    <Flag size={12} />
                                </button>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 -mt-8 sm:-mt-10 mb-4">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] bg-white p-2 shadow-lg border border-gray-50 shrink-0">
                                        <div className="w-full h-full rounded-[16px] relative overflow-hidden">
                                            {loading ? (
                                                <Skeleton className="w-full h-full" />
                                            ) : (
                                                <CompanyLogo
                                                    name={company?.companyName || ''}
                                                    logoUrl={company?.logo}
                                                    size="xl"
                                                    className="!w-full !h-full !rounded-[16px] !shadow-none !border-none"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center sm:text-left pt-2.5">
                                        {loading ? (
                                            <div className="space-y-1.5">
                                                <Skeleton className="h-6 w-40 mx-auto sm:mx-0" />
                                                <Skeleton className="h-3 w-24 mx-auto sm:mx-0" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1.5">
                                                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                                                            {company?.companyName}
                                                        </h1>
                                                        {company?.verified && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[8px] font-black tracking-widest uppercase shadow-sm">
                                                                <CheckCircle size={7} fill="currentColor" />
                                                                Verified
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-[10px] font-black uppercase tracking-wider">
                                                        {company?.industry && (
                                                            <span className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-md">
                                                                <Briefcase size={10} />
                                                                {company.industry}
                                                            </span>
                                                        )}
                                                        {company?.location && (
                                                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50/70 px-2 py-0.5 rounded-md">
                                                                <MapPin size={10} />
                                                                {company.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {company?.website && (
                                                        <a
                                                            href={company.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-1.5 bg-gray-900 text-white rounded-xl font-black text-[10px] flex items-center gap-1.5 hover:bg-primary transition-all shadow-sm active:scale-95"
                                                        >
                                                            Visit Site
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => setIsReportModalOpen(true)}
                                                        className="hidden sm:flex items-center justify-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 border border-gray-100 bg-white shadow-sm"
                                                        title="Report Company"
                                                    >
                                                        <Flag size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* About - Ultra Condensed */}
                                <div className="space-y-2.5 pt-4 border-t border-gray-50/80">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <Building size={14} />
                                        <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-900">About</h2>
                                    </div>
                                    {loading ? (
                                        <div className="space-y-1.5">
                                            <Skeleton className="h-2.5 w-full" />
                                            <Skeleton className="h-2.5 w-[95%]" />
                                            <Skeleton className="h-2.5 w-[70%]" />
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 leading-relaxed text-xs font-semibold">
                                            {company?.description || company?.about || 'No description provided.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Openings Section */}
                        <div className="space-y-3">
                            <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2 px-1">
                                <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
                                Active Openings
                                {!loading && (
                                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black ml-1">
                                        {internships.length}
                                    </span>
                                )}
                            </h2>

                            {loading ? (
                                <div className="grid gap-2">
                                    {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                                </div>
                            ) : internships.length === 0 ? (
                                <div className="bg-white rounded-2xl py-8 text-center border border-gray-50">
                                    <p className="text-gray-400 text-[11px] font-bold">No current openings.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {internships.map((job) => (
                                        <Link
                                            key={job._id}
                                            href={`/student/internships/${job._id}`}
                                            className="group bg-white p-4 rounded-[20px] border border-gray-50 shadow-sm hover:shadow hover:border-primary/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[8px] font-black uppercase tracking-widest group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                    {job.mode}
                                                </div>
                                                <h3 className="text-sm font-black text-gray-900 tracking-tight group-hover:text-primary transition-colors">
                                                    {job.title}
                                                </h3>
                                                <div className="flex gap-3 text-[10px] text-gray-400 font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={10} className="opacity-70" />
                                                        {job.location || 'Remote'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={10} className="opacity-70" />
                                                        {job.durationWeeks}w
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:pl-4 border-t sm:border-t-0 sm:border-l border-gray-50 pt-3 sm:pt-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Stipend</p>
                                                    <p className="text-base font-black text-gray-900 leading-none">
                                                        ₹{job.stipend >= 1000 ? `${(job.stipend / 1000).toFixed(0)}k` : job.stipend}
                                                        <span className="text-[9px] text-gray-400 ml-0.5">/m</span>
                                                    </p>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - Compact Overview */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50 p-4 space-y-5 sticky top-4">
                            <h3 className="text-xs font-black text-gray-900 border-b border-gray-50 pb-3 tracking-tight">Overview</h3>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-2">
                                                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                                                <div className="space-y-1 flex-1 pt-1">
                                                    <Skeleton className="h-1.5 w-10" />
                                                    <Skeleton className="h-2.5 w-16" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {company?.industry && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                    <Briefcase size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">Industry</p>
                                                    <p className="font-black text-gray-900 text-xs leading-tight">{company.industry}</p>
                                                </div>
                                            </div>
                                        )}
                                        {company?.companySize && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                    <Users size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">Size</p>
                                                    <p className="font-black text-gray-900 text-xs leading-tight">{company.companySize}</p>
                                                </div>
                                            </div>
                                        )}
                                        {company?.location && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                                    <MapPin size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">HQ</p>
                                                    <p className="font-black text-gray-900 text-xs leading-tight">{company.location}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {!loading && (company?.socialLinks?.linkedin || company?.socialLinks?.twitter || company?.socialLinks?.instagram) && (
                                <div className="pt-4 border-t border-gray-50 flex justify-center gap-3">
                                    {company.socialLinks.linkedin && (
                                        <a href={company.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-7 h-7 bg-gray-50 text-gray-400 hover:text-white hover:bg-[#0077b5] rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5">
                                            <Linkedin size={14} />
                                        </a>
                                    )}
                                    {company.socialLinks.twitter && (
                                        <a href={company.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-7 h-7 bg-gray-50 text-gray-400 hover:text-white hover:bg-black rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5">
                                            <Twitter size={14} />
                                        </a>
                                    )}
                                    {company.socialLinks.instagram && (
                                        <a href={company.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-7 h-7 bg-gray-50 text-gray-400 hover:text-white hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5">
                                            <Instagram size={14} />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Trust Badge Ultra Compact */}
                            {company?.verified && (
                                <div className="bg-gradient-to-br from-primary/90 to-blue-700 rounded-xl p-3 text-white relative overflow-hidden shadow-md shadow-primary/10">
                                    <Building size={30} className="absolute -right-2 -bottom-2 opacity-5" />
                                    <div className="relative z-10 flex items-center gap-2.5">
                                        <Award size={16} className="text-primary-foreground/90 shrink-0" />
                                        <div>
                                            <h4 className="font-black text-[11px] uppercase tracking-widest leading-none mb-1">Verified Safe</h4>
                                            <p className="text-[10px] text-white/80 font-bold leading-tight">By Acad-Intern</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                reportedUserId={company?._id}
                subjectPrefix={`Report Company: ${company?.companyName}`}
                contextSnapshot={{
                    companyName: company?.companyName,
                    website: company?.website,
                    location: company?.location
                }}
            />

            <style jsx global>{`
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 15s ease infinite;
                }
            `}</style>
        </div>
    )
}
