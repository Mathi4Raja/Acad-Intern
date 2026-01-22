'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { Send, Paperclip, Smile, X } from 'lucide-react'

interface ChatInputProps {
    onSendMessage: (message: string) => void
    onSendFile?: (file: File, caption?: string) => void
    placeholder?: string
    disabled?: boolean
}

export function ChatInput({ onSendMessage, onSendFile, placeholder = 'Type a message...', disabled = false }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [fileCaption, setFileCaption] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSend = () => {
        if (selectedFile && onSendFile) {
            onSendFile(selectedFile, fileCaption.trim() || undefined)
            setSelectedFile(null)
            setFileCaption('')
        } else if (message.trim() && !disabled) {
            onSendMessage(message.trim())
            setMessage('')
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 10MB')
                return
            }

            // Validate file type
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain', 'text/csv',
                'application/zip', 'application/x-rar-compressed'
            ]

            if (!allowedTypes.includes(file.type)) {
                alert('File type not supported. Please upload images, PDFs, documents, or archives.')
                return
            }

            setSelectedFile(file)
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        setFileCaption('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const formatFileSize = (bytes: number) => {
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    return (
        <div className="border-t border-gray-200 bg-white">
            {/* File Preview */}
            {selectedFile && (
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Add a caption (optional)..."
                        value={fileCaption}
                        onChange={(e) => setFileCaption(e.target.value)}
                        className="mt-2 w-full px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary"
                        maxLength={200}
                    />
                </div>
            )}

            <div className="p-2 sm:p-4">
                <div className="flex items-end gap-2 sm:gap-3">
                    {/* Attachment Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        title="Attach file"
                        disabled={disabled}
                    >
                        <Paperclip size={20} />
                    </button>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
                        className="hidden"
                    />

                    {/* Message Input */}
                    <div className="flex-1 relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedFile ? 'Add a message with your file...' : placeholder}
                            disabled={disabled}
                            rows={1}
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 border-0 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white resize-none text-sm placeholder:text-gray-400 disabled:opacity-50"
                            style={{ minHeight: '40px', maxHeight: '120px' }}
                        />
                    </div>

                    {/* Emoji Button - hidden on mobile */}
                    <button
                        type="button"
                        className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        title="Add emoji"
                        disabled={disabled}
                    >
                        <Smile size={20} />
                    </button>

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={(!message.trim() && !selectedFile) || disabled}
                        className="p-2 sm:p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        title="Send message"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
