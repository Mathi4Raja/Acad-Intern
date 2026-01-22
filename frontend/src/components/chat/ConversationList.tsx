'use client'

import { cn } from '@/lib/utils'

export interface Conversation {
    id: string
    participantId?: string
    participantName: string
    participantRole: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    avatar?: string
    isOnline?: boolean
    typingUsers?: Array<{ id: string; name: string }>
}

interface ConversationListProps {
    conversations: Conversation[]
    selectedId: string | null
    onSelectConversation: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelectConversation }: ConversationListProps) {
    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">No conversations yet</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
                <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={cn(
                        'w-full p-3 sm:p-4 flex items-start gap-2 sm:gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left active:bg-gray-100',
                        selectedId === conv.id && 'bg-primary/5 hover:bg-primary/5 border-l-2 border-l-primary'
                    )}
                >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                            {conv.participantName.charAt(0).toUpperCase()}
                        </div>
                        {conv.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                            <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{conv.participantName}</h3>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{conv.lastMessageTime}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-0.5 sm:mb-1 truncate">{conv.participantRole}</p>
                        {conv.typingUsers && conv.typingUsers.length > 0 ? (
                            <p className="text-xs sm:text-sm text-primary italic">
                                {conv.typingUsers.length === 1
                                    ? `${conv.typingUsers[0].name} is typing...`
                                    : `${conv.typingUsers.length} people typing...`
                                }
                            </p>
                        ) : (
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        )}
                    </div>

                    {/* Unread Badge */}
                    {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                    )}
                </button>
            ))}
        </div>
    )
}
