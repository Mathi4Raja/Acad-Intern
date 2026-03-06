'use client'

import { X, Mail, Phone, MapPin, Calendar, Star, FileText, Download, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Applicant } from './ApplicationCard'

interface ApplicantDetailModalProps {
    applicant: Applicant | null
    isOpen: boolean
    onClose: () => void
    onStatusChange?: (status: Applicant['status']) => void
}

const statusActions: { status: Applicant['status']; label: string; icon: typeof CheckCircle; color: string }[] = [
    { status: 'shortlisted', label: 'Shortlist', icon: Star, color: 'bg-blue-600 hover:bg-blue-700' },
    { status: 'assessment_completed', label: 'Mark Assessment Done', icon: Calendar, color: 'bg-purple-600 hover:bg-purple-700' },
    { status: 'accepted', label: 'Accept', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
    { status: 'rejected', label: 'Reject', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' }
]

export function ApplicantDetailModal({ applicant, isOpen, onClose, onStatusChange }: ApplicantDetailModalProps) {
    if (!isOpen || !applicant) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] mx-4 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-primary to-purple-600 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {applicant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{applicant.name}</h2>
                            <p className="text-white/80">{applicant.position}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-0.5 rounded-full">
                                    <Star size={14} />
                                    {applicant.matchScore}% Match
                                </span>
                                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full capitalize">
                                    {applicant.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Mail className="text-gray-400" size={18} />
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900">{applicant.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="text-gray-400" size={18} />
                            <div>
                                <p className="text-xs text-gray-500">Applied</p>
                                <p className="text-sm font-medium text-gray-900">{applicant.appliedDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {applicant.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Resume Section */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Resume</h3>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                                <FileText className="text-primary" size={24} />
                                <div>
                                    <p className="font-medium text-gray-900">resume_{applicant.name.toLowerCase().replace(' ', '_')}.pdf</p>
                                    <p className="text-xs text-gray-500">PDF • 245 KB</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="View">
                                    <ExternalLink size={18} className="text-gray-600" />
                                </button>
                                <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title="Download">
                                    <Download size={18} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Notes */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                        <textarea
                            placeholder="Add notes about this applicant..."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/20"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Action Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500 order-2 sm:order-1">
                            <Clock size={14} className="inline mr-1" />
                            Applied {applicant.appliedDate}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 order-1 sm:order-2">
                            {statusActions.filter(a => a.status !== applicant.status).slice(0, 3).map(action => (
                                <button
                                    key={action.status}
                                    onClick={() => onStatusChange?.(action.status)}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-2 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                                        action.color
                                    )}
                                >
                                    <action.icon size={16} />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
