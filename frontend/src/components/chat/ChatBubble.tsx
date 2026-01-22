'use client'

import { cn } from '@/lib/utils'
import { FileText, Download, Image, File } from 'lucide-react'

interface ChatBubbleProps {
    message: string
    messageType: 'text' | 'file'
    fileUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
    status?: 'sent' | 'delivered' | 'read'
    timestamp: string
    isOwn: boolean
    senderName?: string
}

export function ChatBubble({
    message,
    messageType,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    status,
    timestamp,
    isOwn,
    senderName
}: ChatBubbleProps) {
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileIcon = (type?: string) => {
        if (!type) return <File size={16} />;
        if (type.startsWith('image/')) return <Image size={16} />;
        return <FileText size={16} />;
    };

    const handleFileDownload = () => {
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <div className={cn('flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%]', isOwn ? 'ml-auto flex-row-reverse' : '')}>
            {/* Avatar - hidden on very small screens for own messages */}
            <div
                className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0',
                    isOwn ? 'bg-primary hidden sm:flex' : 'bg-purple-500'
                )}
            >
                {senderName?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* Message Content */}
            <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                {senderName && (
                    <span className="text-xs text-gray-500 mb-0.5 sm:mb-1">{senderName}</span>
                )}

                {messageType === 'file' && fileUrl ? (
                    <div
                        className={cn(
                            'px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm max-w-xs cursor-pointer hover:opacity-90 transition-opacity',
                            isOwn
                                ? 'bg-primary text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                        )}
                        onClick={handleFileDownload}
                    >
                        <div className="flex items-center gap-2">
                            {getFileIcon(fileType)}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{fileName}</p>
                                <p className="text-xs opacity-75">{formatFileSize(fileSize)}</p>
                            </div>
                            <Download size={14} />
                        </div>
                        {message && (
                            <p className="mt-2 text-xs opacity-90">{message}</p>
                        )}
                    </div>
                ) : (
                    <div
                        className={cn(
                            'px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm',
                            isOwn
                                ? 'bg-primary text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                        )}
                    >
                        {message}
                    </div>
                )}

                <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                    <span className="text-[10px] sm:text-xs text-gray-400">{timestamp}</span>
                    {isOwn && status && (
                        <span className="text-[10px] sm:text-xs text-gray-400">
                            {status === 'sent' && '✓'}
                            {status === 'delivered' && '✓✓'}
                            {status === 'read' && '✓✓'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
