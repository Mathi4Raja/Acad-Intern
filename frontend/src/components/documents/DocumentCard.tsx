'use client'

import { FileText, Download, Trash2, Eye, MoreVertical, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Document {
    id: string
    name: string
    type: 'resume' | 'cover_letter' | 'certificate' | 'portfolio' | 'other'
    size: string
    uploadedAt: string
    url?: string
    version?: number
}

interface DocumentCardProps {
    document: Document
    onView?: () => void
    onDownload?: () => void
    onDelete?: () => void
    isActive?: boolean
    className?: string
}

const typeLabels: Record<Document['type'], string> = {
    resume: 'Resume',
    cover_letter: 'Cover Letter',
    certificate: 'Certificate',
    portfolio: 'Portfolio',
    other: 'Document'
}

const typeColors: Record<Document['type'], string> = {
    resume: 'bg-blue-100 text-blue-700',
    cover_letter: 'bg-purple-100 text-purple-700',
    certificate: 'bg-green-100 text-green-700',
    portfolio: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-700'
}

export function DocumentCard({
    document,
    onView,
    onDownload,
    onDelete,
    isActive = false,
    className
}: DocumentCardProps) {
    return (
        <div
            className={cn(
                'bg-white border rounded-xl p-4 hover:shadow-md transition-all',
                isActive ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200',
                className
            )}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{document.name}</h4>
                        {isActive && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Active</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', typeColors[document.type])}>
                            {typeLabels[document.type]}
                        </span>
                        {document.version && (
                            <span className="text-xs text-gray-500">v{document.version}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{document.size}</span>
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {document.uploadedAt}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                {onView && (
                    <button
                        onClick={onView}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
                    >
                        <Eye size={14} />
                        View
                    </button>
                )}
                {onDownload && (
                    <button
                        onClick={onDownload}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100"
                    >
                        <Download size={14} />
                        Download
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 ml-auto"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                )}
            </div>
        </div>
    )
}
