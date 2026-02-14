'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Loader2, Search, Trash2 } from 'lucide-react';
import { Conversation } from '@/types';
import { messageApi } from '@/lib/api';
import { useSocket } from '@/lib/SocketContext';

interface ConversationListProps {
    selectedApplicationId: string | null;
    onSelectConversation: (applicationId: string, otherPartyName: string) => void;
    currentUserRole: 'student' | 'company';
    currentUserId: string;
    onDelete?: (applicationId: string) => void;
}

export default function ConversationList({
    selectedApplicationId,
    onSelectConversation,
    currentUserRole,
    currentUserId,
    onDelete
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

        const handleMessagesSeen = (data: { applicationId: string; userId: string }) => {
            // If the current user marked messages as seen, clear unread count
            if (data.userId === currentUserId) {
                setConversations(prev => {
                    return prev.map(conv => {
                        if (conv.application._id === data.applicationId) {
                            return {
                                ...conv,
                                unreadCount: 0
                            };
                        }
                        return conv;
                    });
                });
            }
        };

        socket.on('conversation-updated', handleConversationUpdate);
        socket.on('messages-seen', handleMessagesSeen);

        return () => {
            socket.off('conversation-updated', handleConversationUpdate);
            socket.off('messages-seen', handleMessagesSeen);
        };
    }, [socket, selectedApplicationId, currentUserId]);

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

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; applicationId: string | null }>({
        isOpen: false,
        applicationId: null
    });

    const handleDeleteConversation = async (applicationId: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevent selecting the conversation
        setDeleteConfirmation({ isOpen: true, applicationId });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.applicationId) return;

        try {
            await messageApi.deleteConversation(deleteConfirmation.applicationId);
            setConversations(prev => prev.filter(c => c.application._id !== deleteConfirmation.applicationId));

            // Notify parent about deletion
            if (onDelete) onDelete(deleteConfirmation.applicationId);

            // If the deleted conversation was selected, deselect it
            if (selectedApplicationId === deleteConfirmation.applicationId) {
                // UI update is handled via parent callback and prop update
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        } finally {
            setDeleteConfirmation({ isOpen: false, applicationId: null });
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
            <div className="px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100/50 border border-transparent rounded-2xl text-sm 
                        focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 focus:shadow-sm
                        placeholder:text-gray-400 text-gray-900 transition-all duration-200 outline-none"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center mt-10">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">
                            {searchQuery ? 'No results found' : 'No messages'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {searchQuery ? 'Try a different search term' : 'Your conversations will appear here'}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conv, index) => {
                        const isSelected = selectedApplicationId === conv.application._id;
                        const otherParty = currentUserRole === 'student'
                            ? conv.application.internshipId.companyId.companyName
                            : conv.application.studentId.name;

                        // Determine status color
                        const statusColors = {
                            accepted: 'bg-green-100 text-green-700 border-green-200',
                            shortlisted: 'bg-blue-100 text-blue-700 border-blue-200',
                            rejected: 'bg-red-100 text-red-700 border-red-200',
                            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        };
                        const statusStyle = statusColors[conv.application.status as keyof typeof statusColors] || statusColors.pending;

                        return (
                            <div key={conv.application._id} className="relative group/item">
                                <button
                                    onClick={() => onSelectConversation(conv.application._id, otherParty)}
                                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative
                                    ${isSelected
                                            ? 'bg-primary/5 ring-1 ring-primary/20 shadow-sm'
                                            : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'
                                        }`}
                                    style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s backwards` }}
                                >
                                    <div className="flex gap-3">
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            {(() => {
                                                // Determine which profile picture to show based on current user role
                                                const profilePicture = currentUserRole === 'student'
                                                    ? (conv as any).companyLogo
                                                    : (conv as any).studentProfilePicture;

                                                return profilePicture ? (
                                                    <img
                                                        src={profilePicture}
                                                        alt={otherParty}
                                                        className={`w-12 h-12 rounded-full object-cover shadow-sm transition-transform group-active:scale-95 ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                                                            }`}
                                                        onError={(e) => {
                                                            // Fallback to initial on error
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            target.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null;
                                            })()}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm transition-transform group-active:scale-95 ${(currentUserRole === 'student' ? (conv as any).companyLogo : (conv as any).studentProfilePicture) ? 'hidden' : ''
                                                } ${isSelected
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                                                }`}>
                                                {otherParty.charAt(0).toUpperCase()}
                                            </div>
                                            {/* Unread indicator (dot) */}
                                            {conv.unreadCount > 0 && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                                                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <h3 className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-primary' : 'text-gray-900 group-hover:text-gray-900'}`}>
                                                    {otherParty}
                                                </h3>
                                                <span className={`text-[10px] whitespace-nowrap ${conv.unreadCount > 0 ? 'text-primary font-bold' : 'text-gray-400'}`}>
                                                    {formatTime(conv.lastMessage?.createdAt)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-500 truncate mb-1.5 opacity-80">
                                                {conv.application.internshipId.title}
                                            </p>

                                            <div className="flex items-center justify-between gap-4">
                                                <p className={`text-xs truncate max-w-[140px] sm:max-w-[180px] ${conv.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                                                    {conv.lastMessage?.senderId._id === currentUserId && 'You: '}
                                                    {conv.lastMessage?.content || '📎 Attachment'}
                                                </p>

                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${statusStyle}`}>
                                                    {conv.application.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Delete Button - visible on hover */}
                                <button
                                    onClick={(e) => handleDeleteConversation(conv.application._id, e)}
                                    className="absolute right-2 bottom-2 p-1.5 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-100 opacity-0 group-hover/item:opacity-100 transition-all duration-200 z-10"
                                    title="Delete conversation"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Conversation?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            This will hide the conversation from your list until a new message is sent.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmation({ isOpen: false, applicationId: null })}
                                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
