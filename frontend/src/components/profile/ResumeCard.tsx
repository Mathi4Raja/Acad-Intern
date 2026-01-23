import React, { memo } from 'react'
import { FileText, Upload, X, ExternalLink, Download, Loader2, Image as ImageIcon, File } from 'lucide-react'
import { StudentProfile } from '@/types'
import { ProfileSection } from './ProfileSection'

interface ResumeCardProps {
    profile: StudentProfile
    isEditing: boolean
    pendingFile: File | null
    previewUrl: string | null
    isResumeValid: boolean
    validatingResume: boolean
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemovePending: () => void
    onDownload: () => void
}

export const ResumeCard = memo(({
    profile,
    isEditing,
    pendingFile,
    previewUrl,
    isResumeValid,
    validatingResume,
    onFileSelect,
    onRemovePending,
    onDownload
}: ResumeCardProps) => {

    const getResumeFileName = (url?: string) => {
        if (!url) return 'resume.pdf'
        try {
            const fileName = url.split('/').pop() || 'resume.pdf'
            if (fileName.length > 25) {
                const ext = fileName.split('.').pop() || 'pdf'
                const name = fileName.substring(0, 20)
                return `${name}...${ext}` // fixed interpolation
            }
            return fileName
        } catch {
            return 'resume.pdf'
        }
    }

    const getFileIcon = (file: File | null, url?: string) => {
        const type = file?.type || ''
        const fileUrl = url || ''

        if (type.startsWith('image/') || fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return <ImageIcon className="text-green-600" size={16} />
        }
        if (type.includes('pdf') || fileUrl.endsWith('.pdf')) {
            return <FileText className="text-red-600" size={16} /> // fixed icon
        }
        if (type.includes('word') || fileUrl.match(/\.(doc|docx)$/i)) {
            return <File className="text-blue-600" size={16} />
        }
        return <FileText className="text-gray-600" size={16} />
    }

    return (
        <ProfileSection title="Resume" icon={FileText}>
            {/* Pending File Preview */}
            {pendingFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {getFileIcon(pendingFile)}
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                {pendingFile.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                ({(pendingFile.size / 1024).toFixed(1)} KB)
                            </span>
                        </div>
                        {isEditing && (
                            <button
                                onClick={onRemovePending}
                                className="text-gray-500 hover:text-red-600 p-1"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Image Preview */}
                    {previewUrl && (
                        <div className="mt-2">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-full max-h-48 rounded-lg border border-gray-200 object-contain"
                            />
                        </div>
                    )}

                    <p className="text-xs text-blue-600 mt-2">
                        📋 This file will be uploaded when you click Save
                    </p>
                </div>
            )}

            {/* Existing Resume */}
            {validatingResume ? (
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <Loader2 className="mx-auto text-gray-400 mb-2 animate-spin" size={24} />
                    <p className="text-gray-500 text-xs">Checking resume...</p>
                </div>
            ) : profile.resumeUrl && isResumeValid && !pendingFile ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-center gap-2 mb-2">
                        {getFileIcon(null, profile.resumeUrl)}
                        <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[180px] sm:max-w-none">
                            {getResumeFileName(profile.resumeUrl)}
                        </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <a
                            href={profile.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 text-primary text-xs px-2 py-1.5 border border-primary/30 rounded-lg hover:bg-primary/5"
                        >
                            <ExternalLink size={12} />
                            View
                        </a>
                        {!isEditing && (
                            <button
                                onClick={onDownload}
                                className="flex-1 flex items-center justify-center gap-1 text-green-600 text-xs px-2 py-1.5 border border-green-300 rounded-lg hover:bg-green-50"
                            >
                                <Download size={12} />
                                Download
                            </button>
                        )}
                        {isEditing && (
                            <label className="flex-1 bg-primary text-white px-2 py-1.5 rounded-lg hover:bg-primary/90 cursor-pointer text-xs flex items-center justify-center gap-1">
                                Replace
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={onFileSelect}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>
            ) : !pendingFile && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600 mb-2 text-xs sm:text-sm">
                        Upload resume (PDF, JPG, PNG, DOC, DOCX - max 5MB)
                    </p>
                    {isEditing && (
                        <label className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg cursor-pointer text-xs sm:text-sm shadow-sm hover:shadow">
                            Choose File
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={onFileSelect}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>
            )}
        </ProfileSection>
    )
})
