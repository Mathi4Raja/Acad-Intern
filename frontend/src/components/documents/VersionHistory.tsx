'use client'

import { Clock, FileText, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Document } from './DocumentCard'

interface VersionHistoryProps {
    documents: Document[]
    activeId?: string
    onSelectVersion?: (id: string) => void
    className?: string
}

export function VersionHistory({ documents, activeId, onSelectVersion, className }: VersionHistoryProps) {
    if (documents.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No version history available</p>
            </div>
        )
    }

    return (
        <div className={cn('space-y-0', className)}>
            {documents.map((doc, index) => (
                <div key={doc.id} className="relative">
                    {/* Timeline line */}
                    {index < documents.length - 1 && (
                        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
                    )}

                    <div
                        className={cn(
                            'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50',
                            activeId === doc.id && 'bg-primary/5 hover:bg-primary/5'
                        )}
                        onClick={() => onSelectVersion?.(doc.id)}
                    >
                        {/* Timeline dot */}
                        <div
                            className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                                activeId === doc.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                            )}
                        >
                            {index === 0 ? (
                                <ArrowUpRight size={16} />
                            ) : (
                                <Clock size={14} />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                    Version {doc.version || documents.length - index}
                                </span>
                                {index === 0 && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        Latest
                                    </span>
                                )}
                                {activeId === doc.id && (
                                    <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {doc.uploadedAt} • {doc.size}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
