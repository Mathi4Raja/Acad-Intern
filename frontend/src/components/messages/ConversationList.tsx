'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Loader2, Search } from 'lucide-react';
import { Conversation } from '@/types';
import { messageApi } from '@/lib/api';
import { useSocket } from '@/lib/SocketContext';

interface ConversationListProps {
    selectedApplicationId: string | null;
    onSelectConversation: (applicationId: string) => void;
    currentUserRole: 'student' | 'company';
}

export default function ConversationList({
    selectedApplicationId,
    onSelectConversation,
    currentUserRole
}: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { socket } = useSocket();

    useEffect(() => {
        loadConversations();
    }, [selectedApplicationId]); // Reload when selection changes to ensure read status is up to date

    // Listen for real-time conversation updates
    useEffect(() => {
        if (!socket) return;

        const handleConversationUpdate = (data: { applicationId: string; message: any; unreadCountIncrement: number }) => {
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.application._id === data.applicationId);

                if (existingIndex === -1) {
                    // New conversation or not in list - reload to be safe
                    loadConversations();
                    return prev;
                }

                // Create new array to trigger re-render
                const newConversations = [...prev];
                const updatedConv = { ...newConversations[existingIndex] };

                // Update details
                updatedConv.lastMessage = data.message;

                // Only increment unread if not currently selected
                if (selectedApplicationId !== data.applicationId) {
                    updatedConv.unreadCount += data.unreadCountIncrement;
                }

                // Move to top
                newConversations.splice(existingIndex, 1);
                newConversations.unshift(updatedConv);

                return newConversations;
            });
        };

        socket.on('conversation-updated', handleConversationUpdate);

        return () => {
            socket.off('conversation-updated', handleConversationUpdate);
        };
    }, [socket, selectedApplicationId]);

    const loadConversations = async () => {
        try {
            const response = await messageApi.getConversations();
            if (response.data.success) {
                setConversations(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery) return true;

        const searchLower = searchQuery.toLowerCase();
        const title = conv.application.internshipId.title.toLowerCase();
        const companyName = conv.application.internshipId.companyId.companyName.toLowerCase();
        const studentName = conv.application.studentId.name.toLowerCase();

        return title.includes(searchLower) ||
            companyName.includes(searchLower) ||
            studentName.includes(searchLower);
    });

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Search Header */}
            <div className="p-3 md:p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2.5 md:py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 md:p-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {searchQuery ? 'No conversations found' : 'No messages yet'}
                        </h3>
                        {!searchQuery && currentUserRole === 'student' && (
                            <p className="text-sm text-gray-500 max-w-xs">
                                Apply to internships to start conversations with companies
                            </p>
                        )}
                        {!searchQuery && currentUserRole === 'company' && (
                            <p className="text-sm text-gray-500 max-w-xs">
                                Messages from applicants will appear here
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conv, index) => {
                            const isSelected = selectedApplicationId === conv.application._id;
                            const otherParty = currentUserRole === 'student'
                                ? conv.application.internshipId.companyId.companyName
                                : conv.application.studentId.name;

                            return (
                                <button
                                    key={conv.application._id}
                                    onClick={() => onSelectConversation(conv.application._id)}
                                    className={`w-full text-left conversation-item hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 relative animate-fade-in ${isSelected ? 'bg-primary/10 border-l-4 border-l-primary shadow-sm ring-1 ring-primary/5 z-10' : 'border-l-4 border-l-transparent'
                                        }`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={`flex items-start gap-3 p-3 md:p-4 ${isSelected ? 'pl-2 md:pl-3' : ''}`}>
                                        {/* Avatar */}
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold shadow-inner message-avatar">
                                            {otherParty.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                        {otherParty}
                                                    </h3>
                                                    <p className="text-xs text-gray-600 truncate">
                                                        {conv.application.internshipId.title}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end ml-2 flex-shrink-0">
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(conv.lastMessage?.createdAt)}
                                                    </span>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="mt-1 px-2 py-0.5 bg-primary text-white text-xs font-medium rounded-full min-w-[20px] text-center animate-bounce-in">
                                                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {conv.lastMessage && (
                                                <p className="text-xs text-gray-500 truncate mb-2">
                                                    {conv.lastMessage.senderId._id === conv.application.studentId._id && currentUserRole === 'student' && 'You: '}
                                                    {conv.lastMessage.senderId._id !== conv.application.studentId._id && currentUserRole === 'company' && 'You: '}
                                                    {conv.lastMessage.content || '📎 Attachment'}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${conv.application.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                    conv.application.status === 'shortlisted' ? 'bg-blue-100 text-blue-700' :
                                                        conv.application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {conv.application.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
