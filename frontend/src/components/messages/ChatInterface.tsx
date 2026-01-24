'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, Check, CheckCheck, Loader2, FileText, Download, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Message, MessageStatus } from '@/types';
import { useSocket } from '@/lib/SocketContext';
import { messageApi } from '@/lib/api';

interface ChatInterfaceProps {
    applicationId: string;
    currentUserId: string;
    otherPartyName: string;
    onBack?: () => void;
}

export default function ChatInterface({ applicationId, currentUserId, otherPartyName, onBack }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { socket, joinApplication, leaveApplication, markAsSeen, setTyping, deleteMessage } = useSocket();

    // Fetch messages and join application room
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const response = await messageApi.getMessages(applicationId);
                if (response.data.success) {
                    setMessages(response.data.data);
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMessages();
        joinApplication(applicationId);

        return () => {
            leaveApplication(applicationId);
        };
    }, [applicationId, joinApplication, leaveApplication]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (data: { message: Message; tempId?: string }) => {
            setMessages((prev) => {
                // Remove temp message if it exists
                const filtered = data.tempId
                    ? prev.filter(m => (m as any).tempId !== data.tempId)
                    : prev;
                return [...filtered, data.message];
            });
            scrollToBottom();
        };

        const handleMessagesDelivered = (data: { applicationId: string; userId: string }) => {
            if (data.applicationId === applicationId && data.userId !== currentUserId) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        (typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId) === currentUserId && msg.status === 'sent'
                            ? { ...msg, status: 'delivered' as MessageStatus }
                            : msg
                    )
                );
            }
        };

        const handleMessagesSeen = (data: { applicationId: string; userId: string }) => {
            if (data.applicationId === applicationId && data.userId !== currentUserId) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.senderId._id === currentUserId && msg.status !== 'seen'
                            ? { ...msg, status: 'seen' as MessageStatus }
                            : msg
                    )
                );
            }
        };

        const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
            if (data.userId !== currentUserId) {
                setTypingUser(data.isTyping ? otherPartyName : null);
            }
        };

        const handleMessageDeleted = (data: { messageId: string; applicationId: string }) => {
            if (data.applicationId === applicationId) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === data.messageId
                            ? { ...msg, content: 'This message was deleted', attachments: [], isDeleted: true }
                            : msg
                    )
                );
            }
        };

        socket.on('new-message', handleNewMessage);
        socket.on('messages-delivered', handleMessagesDelivered);
        socket.on('messages-seen', handleMessagesSeen);
        socket.on('user-typing', handleUserTyping);
        socket.on('message-deleted', handleMessageDeleted);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('messages-delivered', handleMessagesDelivered);
            socket.off('messages-seen', handleMessagesSeen);
            socket.off('user-typing', handleUserTyping);
            socket.off('message-deleted', handleMessageDeleted);
        };
    }, [socket, applicationId, currentUserId, otherPartyName]);

    // Mark messages as seen when viewing
    useEffect(() => {
        const hasUnseenMessages = messages.some(
            (msg) => msg.receiverId === currentUserId && msg.status !== 'seen'
        );
        if (hasUnseenMessages) {
            markAsSeen(applicationId);
        }
    }, [messages, currentUserId, applicationId, markAsSeen]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle typing indicator
    const handleTyping = () => {
        setTyping(applicationId, true);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setTyping(applicationId, false);
        }, 1000);
    };

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => file.size <= 15 * 1024 * 1024);

        if (validFiles.length !== files.length) {
            alert('Some files were too large (max 15MB)');
        }

        setAttachments((prev) => [...prev, ...validFiles]);
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Remove attachment
    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    // Send message
    const handleSendMessage = async () => {
        if ((!newMessage.trim() && attachments.length === 0) || sending) return;

        setSending(true);
        const tempId = `temp-${Date.now()}`;

        try {
            if (attachments.length > 0) {
                // Send with files
                await messageApi.sendMessageWithFiles(applicationId, newMessage, attachments);
            } else {
                // Send text only via socket for instant delivery
                const tempMessage: any = {
                    _id: tempId,
                    tempId,
                    applicationId,
                    senderId: { _id: currentUserId, name: 'You', email: '', role: 'student' },
                    receiverId: '',
                    content: newMessage,
                    attachments: [],
                    status: 'sent',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                setMessages((prev) => [...prev, tempMessage]);

                // Send via socket
                if (socket) {
                    socket.emit('send-message', {
                        applicationId,
                        content: newMessage,
                        tempId
                    });
                }
            }

            setNewMessage('');
            setAttachments([]);
            setTyping(applicationId, false);
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Render status icon
    const renderStatusIcon = (status: MessageStatus) => {
        if (status === 'seen') {
            return <CheckCheck className="w-4 h-4 text-blue-500" />;
        } else if (status === 'delivered') {
            return <CheckCheck className="w-4 h-4 text-gray-400" />;
        } else {
            return <Check className="w-4 h-4 text-gray-400" />;
        }
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 bg-white sticky top-0 z-10 shadow-sm">
                {/* Back Button for Mobile */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                        aria-label="Go back to conversations"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                )}

                {/* User Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold shadow-inner flex-shrink-0">
                        {otherPartyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{otherPartyName}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            {typingUser ? (
                                <span className="text-primary animate-pulse">typing...</span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Online
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Options Menu (placeholder for future features) */}
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50/30 to-white messages-container hide-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">No messages yet</h3>
                        <p className="text-sm text-gray-500 max-w-xs">Start a conversation with {otherPartyName} by sending a message below.</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        // Handle different senderId formats (populated object vs raw ID)
                        const senderId = typeof message.senderId === 'object' && message.senderId !== null
                            ? (message.senderId._id || message.senderId)
                            : message.senderId;
                        const isOwn = String(senderId) === String(currentUserId);
                        return (
                            <div
                                key={message._id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isOwn ? 'animate-message-slide-in-right' : 'animate-message-slide-in-left'
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className={`flex flex-col message-bubble ${isOwn ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-2xl px-4 py-3 shadow-sm ${isOwn
                                            ? 'bg-gradient-to-br from-primary to-primary-dark text-white rounded-br-md message-bubble-own'
                                            : 'bg-white text-gray-800 rounded-bl-md message-bubble-other border border-gray-200'
                                            } group relative`}
                                    >
                                        {/* Delete Button (Only for own messages that aren't deleted) */}
                                        {isOwn && !(message as any).isDeleted && (
                                            <button
                                                onClick={() => deleteMessage(applicationId, message._id)}
                                                className="absolute -left-8 top-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                title="Delete message"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        {message.content && (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                {message.content}
                                            </p>
                                        )}

                                        {/* Attachments */}
                                        {message.attachments.length > 0 && (
                                            <div className={`mt-3 space-y-2`}>
                                                {message.attachments.map((attachment, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={attachment.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all attachment-preview ${isOwn
                                                            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                                                            }`}
                                                    >
                                                        <div className={`p-2 rounded-lg ${isOwn ? 'bg-white/20' : 'bg-gray-200'}`}>
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                                                            <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                                                {formatFileSize(attachment.fileSize)}
                                                            </p>
                                                        </div>
                                                        <Download className="w-4 h-4 opacity-70" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Timestamp and Status */}
                                    <div className={`flex items-center gap-1.5 mt-1.5 px-1 text-xs text-gray-400 font-medium ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <span>
                                            {new Date(message.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        {isOwn && renderStatusIcon(message.status)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUser && (
                    <div className="flex justify-start animate-message-slide-in-left">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                            <div className="flex space-x-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots"></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="px-3 md:px-4 py-3 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm animate-in slide-in-from-bottom-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                            <div
                                key={index}
                                className="group flex items-center gap-2 bg-white pl-3 pr-2 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all max-w-[200px]"
                            >
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-medium text-gray-700 truncate">
                                        {file.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {formatFileSize(file.size)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeAttachment(index)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t border-gray-200 bg-white safe-area-bottom">
                <div className="flex items-center gap-3 max-w-full">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 active:scale-95"
                        disabled={sending}
                        title="Attach files"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative min-w-0">
                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                                // Auto-resize textarea
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none max-h-[120px] min-h-[48px]"
                            rows={1}
                            disabled={sending}
                        />
                    </div>

                    <button
                        onClick={handleSendMessage}
                        disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                        className={`group relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 transform ${sending || (!newMessage.trim() && attachments.length === 0)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed scale-90'
                            : 'bg-primary text-white hover:bg-primary-dark hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-primary/40'
                            }`}
                    >
                        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${!(sending || (!newMessage.trim() && attachments.length === 0))
                            ? 'group-hover:bg-white/20 group-active:bg-white/30'
                            : ''
                            }`} />
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                        ) : (
                            <Send className={`w-4 h-4 relative z-10 transition-transform duration-200 ${!(sending || (!newMessage.trim() && attachments.length === 0))
                                ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                                : ''
                                }`} />
                        )}

                        {/* Ripple effect */}
                        {!(sending || (!newMessage.trim() && attachments.length === 0)) && (
                            <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-100 group-active:animate-ping bg-primary/30 transition-opacity duration-150" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
