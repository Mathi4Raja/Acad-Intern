'use client'

import { useState, useRef, DragEvent } from 'react'
import { Upload, X, File, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void
    accept?: string
    maxFiles?: number
    maxSizeMB?: number
    className?: string
}

export function FileUploader({
    onFilesSelected,
    accept = '.pdf,.doc,.docx',
    maxFiles = 5,
    maxSizeMB = 5,
    className
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const validateFiles = (files: File[]): File[] => {
        setError(null)
        const validFiles: File[] = []

        for (const file of files) {
            if (uploadedFiles.length + validFiles.length >= maxFiles) {
                setError(`Maximum ${maxFiles} files allowed`)
                break
            }
            if (file.size > maxSizeMB * 1024 * 1024) {
                setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`)
                continue
            }
            validFiles.push(file)
        }

        return validFiles
    }

    const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        const validFiles = validateFiles(files)

        if (validFiles.length > 0) {
            const newFiles = [...uploadedFiles, ...validFiles]
            setUploadedFiles(newFiles)
            onFilesSelected(newFiles)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return

        const files = Array.from(e.target.files)
        const validFiles = validateFiles(files)

        if (validFiles.length > 0) {
            const newFiles = [...uploadedFiles, ...validFiles]
            setUploadedFiles(newFiles)
            onFilesSelected(newFiles)
        }
    }

    const removeFile = (index: number) => {
        const newFiles = uploadedFiles.filter((_, i) => i !== index)
        setUploadedFiles(newFiles)
        onFilesSelected(newFiles)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <Upload className={cn('w-12 h-12 mx-auto mb-4', isDragging ? 'text-primary' : 'text-gray-400')} />
                <p className="text-sm font-medium text-gray-900 mb-1">
                    {isDragging ? 'Drop files here' : 'Drag and drop files here'}
                </p>
                <p className="text-xs text-gray-500 mb-3">or click to browse</p>
                <p className="text-xs text-gray-400">
                    Supports: PDF, DOC, DOCX • Max {maxSizeMB}MB per file • Up to {maxFiles} files
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
                    {uploadedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <File className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeFile(index)
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
