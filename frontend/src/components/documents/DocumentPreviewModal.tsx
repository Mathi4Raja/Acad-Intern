'use client'

import { X, Download, ExternalLink, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Document } from './DocumentCard'

interface DocumentPreviewModalProps {
    document: Document | null
    isOpen: boolean
    onClose: () => void
    onDownload?: () => void
}

export function DocumentPreviewModal({ document, isOpen, onClose, onDownload }: DocumentPreviewModalProps) {
    if (!isOpen || !document) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{document.name}</h3>
                            <p className="text-xs text-gray-500">{document.size} • {document.uploadedAt}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {document.url && (
                            <a
                                href={document.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink size={20} />
                            </a>
                        )}
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                                title="Download"
                            >
                                <Download size={20} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto bg-gray-100 p-4">
                    {document.url ? (
                        <iframe
                            src={document.url}
                            className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-sm"
                            title={document.name}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Preview Unavailable</h4>
                            <p className="text-gray-500 text-sm mb-4">
                                This document cannot be previewed in the browser.
                            </p>
                            {onDownload && (
                                <button
                                    onClick={onDownload}
                                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Download size={18} />
                                    Download to View
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
