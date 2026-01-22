'use client'

import { useRef, useEffect } from 'react'
import { ChatBubble } from './ChatBubble'

export interface Message {
    id: string
    senderId: string
    senderName: string
    message: string
    messageType: 'text' | 'file'
    fileUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
    status: 'sent' | 'delivered' | 'read'
    readBy?: Array<{ id: string; name: string }>
    timestamp: string
    isOwn: boolean
}

interface MessageListProps {
    messages: Message[]
    isLoading?: boolean
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Loading messages...</span>
                </div>
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">No messages yet</h3>
                    <p className="text-xs sm:text-sm text-gray-500">Start the conversation!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.map((msg) => (
                <ChatBubble
                    key={msg.id}
                    message={msg.message}
                    messageType={msg.messageType}
                    fileUrl={msg.fileUrl}
                    fileName={msg.fileName}
                    fileSize={msg.fileSize}
                    fileType={msg.fileType}
                    status={msg.status}
                    timestamp={msg.timestamp}
                    isOwn={msg.isOwn}
                    senderName={msg.isOwn ? undefined : msg.senderName}
                />
            ))}
            <div ref={bottomRef} />
        </div>
    )
}
