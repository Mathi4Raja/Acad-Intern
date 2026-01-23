'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, ArrowLeft, MoreVertical, Phone, Video, Loader2 } from 'lucide-react'
import { ConversationList, MessageList, ChatInput } from '@/components/chat'
import type { Conversation, Message } from '@/components/chat'
import api from '@/lib/api'
import { useSocket } from '@/lib/SocketContext'

// Format time for display
const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
}

function StudentMessagesPageContent() {
    const searchParams = useSearchParams()
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

    const { socket, isConnected, onlineUsers, connectError } = useSocket()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            setError(null)
            const response = await api.get('/messages/conversations')
            if (response.data.success) {
                const formatted: Conversation[] = response.data.data.map((conv: any) => ({
                    id: conv.id,
                    participantName: conv.participantName,
                    participantRole: conv.participantRole,
                    lastMessage: conv.lastMessage || 'No messages yet',
                    lastMessageTime: conv.lastMessageTime ? formatTime(conv.lastMessageTime) : '',
                    unreadCount: conv.unreadCount || 0,
                    isOnline: onlineUsers.has(conv.participantId),
                    typingUsers: conv.typingUsers || []
                }))
                setConversations(formatted)
            }
        } catch (err: any) {
            console.error('Failed to fetch conversations:', err)
            setError('Failed to load conversations')
        } finally {
            setLoading(false)
        }
    }, [onlineUsers])

    // Fetch messages for a conversation
    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            setMessagesLoading(true)
            const response = await api.get(`/messages/conversations/${conversationId}`)
            if (response.data.success) {
                const formatted: Message[] = response.data.data.map((msg: any) => ({
                    id: msg.id,
                    senderId: msg.senderId,
                    senderName: msg.senderName,
                    message: msg.message,
                    messageType: msg.messageType || 'text',
                    fileUrl: msg.fileUrl,
                    fileName: msg.fileName,
                    fileSize: msg.fileSize,
                    fileType: msg.fileType,
                    status: msg.status || 'sent',
                    readBy: msg.readBy || [],
                    timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    isOwn: msg.isOwn
                }))
                setMessages(formatted)
            }
        } catch (err: any) {
            console.error('Failed to fetch messages:', err)
        } finally {
            setMessagesLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        fetchConversations()
    }, [fetchConversations])

    // Auto-select conversation from URL
    useEffect(() => {
        const conversationId = searchParams.get('conversationId')
        if (conversationId && conversations.length > 0 && selectedConversation === null) {
            const exists = conversations.some(c => c.id === conversationId)
            if (exists) {
                setSelectedConversation(conversationId)
            }
        }
    }, [conversations, searchParams, selectedConversation])

    // Load messages when conversation is selected
    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation)
            // Join the conversation room
            if (socket && isConnected) {
                socket.emit('join_conversation', selectedConversation)
            }
        } else {
            setMessages([])
        }

        // Leave previous conversation
        return () => {
            if (selectedConversation && socket && isConnected) {
                socket.emit('leave_conversation', selectedConversation)
            }
        }
    }, [selectedConversation, socket, isConnected, fetchMessages])

    // Socket.IO event listeners
    useEffect(() => {
        if (!socket || !isConnected) return

        const handleNewMessage = (messageData: any) => {
            const formattedMessage: Message = {
                id: messageData.id,
                senderId: messageData.senderId,
                senderName: messageData.senderName,
                message: messageData.message,
                messageType: messageData.messageType || 'text',
                fileUrl: messageData.fileUrl,
                fileName: messageData.fileName,
                fileSize: messageData.fileSize,
                fileType: messageData.fileType,
                status: messageData.status || 'sent',
                readBy: messageData.readBy || [],
                timestamp: new Date(messageData.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                isOwn: messageData.isOwn
            }

            setMessages(prev => {
                if (prev.some(msg => msg.id === formattedMessage.id)) return prev
                return [...prev, formattedMessage]
            })

            // Update conversation last message
            setConversations(prev => prev.map(conv =>
                conv.id === messageData.conversationId
                    ? {
                        ...conv,
                        lastMessage: messageData.message,
                        lastMessageTime: formatTime(new Date().toISOString()),
                        unreadCount: messageData.isOwn ? conv.unreadCount : conv.unreadCount + 1
                    }
                    : conv
            ))

            // Mark as read if this conversation is active
            if (selectedConversation === messageData.conversationId && !messageData.isOwn) {
                socket.emit('mark_as_read', {
                    conversationId: selectedConversation,
                    messageIds: [messageData.id]
                })
            }
        }

        const handleMessageDelivered = (data: { messageId: string; userId: string }) => {
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId
                    ? { ...msg, status: 'delivered' as const }
                    : msg
            ))
        }

        const handleMessagesRead = (data: { messageIds: string[]; userId: string }) => {
            setMessages(prev => prev.map(msg =>
                data.messageIds.includes(msg.id)
                    ? { ...msg, status: 'read' as const }
                    : msg
            ))
        }

        const handleUserTyping = (data: { userId: string; userName: string; conversationId: string }) => {
            setConversations(prev => prev.map(conv =>
                conv.id === data.conversationId
                    ? {
                        ...conv,
                        typingUsers: [...(conv.typingUsers || []), { id: data.userId, name: data.userName }]
                    }
                    : conv
            ))
        }

        const handleUserStopTyping = (data: { userId: string; conversationId: string }) => {
            setConversations(prev => prev.map(conv =>
                conv.id === data.conversationId
                    ? {
                        ...conv,
                        typingUsers: (conv.typingUsers || []).filter(user => user.id !== data.userId)
                    }
                    : conv
            ))
        }

        const handleUserOnline = (data: { userId: string; conversationId: string }) => {
            setConversations(prev => prev.map(conv =>
                conv.id === data.conversationId
                    ? { ...conv, isOnline: true }
                    : conv
            ))
        }

        const handleUserOffline = (data: { userId: string; conversationId: string }) => {
            setConversations(prev => prev.map(conv =>
                conv.id === data.conversationId
                    ? { ...conv, isOnline: false }
                    : conv
            ))
        }

        // Register event listeners
        socket.on('new_message', handleNewMessage)
        socket.on('message_delivered', handleMessageDelivered)
        socket.on('messages_read', handleMessagesRead)
        socket.on('user_typing', handleUserTyping)
        socket.on('user_stopped_typing', handleUserStopTyping)
        socket.on('user_online', handleUserOnline)
        socket.on('user_offline', handleUserOffline)

        return () => {
            socket.off('new_message', handleNewMessage)
            socket.off('message_delivered', handleMessageDelivered)
            socket.off('messages_read', handleMessagesRead)
            socket.off('user_typing', handleUserTyping)
            socket.off('user_stopped_typing', handleUserStopTyping)
            socket.off('user_online', handleUserOnline)
            socket.off('user_offline', handleUserOffline)
        }
    }, [socket, isConnected, selectedConversation])

    // Update conversations when online users change
    useEffect(() => {
        setConversations(prev => prev.map(conv => ({
            ...conv,
            isOnline: conv.participantId ? onlineUsers.has(conv.participantId) : false
        })))
    }, [onlineUsers])

    const filteredConversations = conversations.filter(conv =>
        conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const currentConversation = conversations.find(c => c.id === selectedConversation)

    const handleSendMessage = async (text: string) => {
        if (!selectedConversation) return

        try {
            const response = await api.post(`/messages/conversations/${selectedConversation}`, {
                content: text
            })

            if (response.data.success) {
                const messageData = response.data.data

                const formattedMessage: Message = {
                    id: messageData.id,
                    senderId: user?._id || '',
                    senderName: user?.name || 'Me',
                    message: messageData.message,
                    messageType: messageData.messageType || 'text',
                    fileUrl: messageData.fileUrl,
                    fileName: messageData.fileName,
                    fileSize: messageData.fileSize,
                    fileType: messageData.fileType,
                    status: messageData.status || 'sent',
                    readBy: [],
                    timestamp: new Date(messageData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isOwn: true
                }

                setMessages(prev => {
                    if (prev.some(msg => msg.id === formattedMessage.id)) return prev
                    return [...prev, formattedMessage]
                })

                // Update conversation
                setConversations(prev => prev.map(conv =>
                    conv.id === selectedConversation
                        ? {
                            ...conv,
                            lastMessage: text,
                            lastMessageTime: 'Just now'
                        }
                        : conv
                ))
            }
        } catch (error) {
            console.error('Failed to send message:', error)
            alert('Failed to send message. Please check your connection and try again.')
        }
    }

    const handleSendFile = async (file: File, caption?: string) => {
        if (!selectedConversation) return

        if (!socket || !isConnected) {
            alert('Connection lost. Cannot send file.')
            return
        }

        try {
            // First upload the file
            const formData = new FormData()
            formData.append('file', file)

            const uploadResponse = await api.post('/messages/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (uploadResponse.data.success) {
                const fileData = uploadResponse.data.data

                // Then send the message with file
                socket.emit('send_message', {
                    conversationId: selectedConversation,
                    messageType: 'file',
                    content: caption || '',
                    fileData: {
                        url: fileData.url,
                        name: fileData.name,
                        size: fileData.size,
                        type: fileData.type
                    }
                })
            }
        } catch (error) {
            console.error('Failed to upload file:', error)
        }
    }

    // Handle typing indicators
    const handleTypingStart = () => {
        if (!selectedConversation || !socket || !isConnected) return

        socket.emit('typing_start', selectedConversation)

        // Clear existing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout)
        }

        // Set timeout to stop typing after 3 seconds
        const timeout = setTimeout(() => {
            handleTypingStop()
        }, 3000)

        setTypingTimeout(timeout)
    }

    const handleTypingStop = () => {
        if (!selectedConversation || !socket || !isConnected) return

        socket.emit('typing_stop', selectedConversation)

        if (typingTimeout) {
            clearTimeout(typingTimeout)
            setTypingTimeout(null)
        }
    }

    // Handle input changes for typing indicators
    const handleInputChange = (value: string) => {
        // This would be called from ChatInput component
        if (value.trim()) {
            handleTypingStart()
        } else {
            handleTypingStop()
        }
    }

    if (loading) {
        return (
            <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-gray-500">Loading conversations...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Full-bleed mobile layout */}
            <style jsx global>{`
                @media (max-width: 767px) {
                    .messages-fullbleed-container {
                        position: fixed !important;
                        top: 3.5rem !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        z-index: 40 !important;
                    }
                }
            `}</style>

            <div className="messages-fullbleed-container h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-8rem)] flex bg-white sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-100 overflow-hidden">
                {/* Sidebar - Conversation List */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h1 className="text-xl font-bold text-gray-900 mb-3">Messages</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    {error ? (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <p className="text-red-500 text-sm">{error}</p>
                        </div>
                    ) : (
                        <ConversationList
                            conversations={filteredConversations}
                            selectedId={selectedConversation}
                            onSelectConversation={setSelectedConversation}
                        />
                    )}
                </div>

                {/* Main Chat Area */}
                <div className={`flex-1 flex flex-col bg-gray-50 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversation && currentConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        className="md:hidden p-2 -ml-1 hover:bg-gray-100 rounded-lg flex-shrink-0"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                        {currentConversation.participantName.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="font-semibold text-gray-900 truncate">{currentConversation.participantName}</h2>
                                        <p className="text-xs text-gray-500">
                                            {currentConversation.isOnline ? (
                                                <span className="text-green-500">● Online</span>
                                            ) : (
                                                currentConversation.participantRole
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button className="hidden sm:flex p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Voice call">
                                        <Phone size={18} />
                                    </button>
                                    <button className="hidden sm:flex p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Video call">
                                        <Video size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="More options">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Warning Banner */}
                            {!isConnected && (
                                <div className={`text-xs py-2 px-4 text-center border-b ${connectError ? 'bg-red-50 text-red-800 border-red-100' : 'bg-yellow-50 text-yellow-800 border-yellow-100'}`}>
                                    {connectError ? `Connection Error: ${connectError}` : 'Reconnecting to chat server...'}
                                </div>
                            )}

                            {/* Messages */}
                            <MessageList messages={messages} isLoading={messagesLoading} />

                            {/* Input */}
                            <ChatInput
                                onSendMessage={handleSendMessage}
                                onSendFile={handleSendFile}
                                disabled={messagesLoading} // Only disable during initial load
                            />
                        </>
                    ) : (
                        /* Empty State */
                        <div className="flex-1 flex items-center justify-center p-4">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Messages</h3>
                                <p className="text-sm text-gray-500 max-w-sm">
                                    {conversations.length === 0
                                        ? "No conversations yet. Apply to internships to start chatting with companies!"
                                        : "Select a conversation to start messaging"
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default function StudentMessagesPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" size={24} /></div>}>
            <StudentMessagesPageContent />
        </Suspense>
    )
}
