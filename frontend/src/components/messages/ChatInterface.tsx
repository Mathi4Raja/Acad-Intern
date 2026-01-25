'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, Check, CheckCheck, Loader2, FileText, Download, Image as ImageIcon, Trash2, ArrowDown, AlertCircle } from 'lucide-react';
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
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTapRef = useRef<number>(0);
    const maxScrollTriggeredRef = useRef<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [downloadingFiles, setDownloadingFiles] = useState<Record<string, 'loading' | 'success' | 'error'>>({});

    const handleMessageTap = (e: React.MouseEvent, messageId: string, isOwnMessage: boolean, isDeleted: boolean) => {
        // We want to handle this layout-wide click to close menu, but we also check for double tap here
        // If it's a double tap on own message, we open the menu

        const now = Date.now();
        const DOUBLE_TAP_DELAY = 400;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Double tap detected
            e.stopPropagation(); // Prevent closing immediately
            if (isOwnMessage && !isDeleted) {
                setActiveMessageId(messageId);
                // Optional: Vibrate
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }

        lastTapRef.current = now;
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        setShowScrollButton(!isNearBottom);
    };

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
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom('smooth');
    }, [messages]);

    // Handle viewport resize (keyboard open/close)
    useEffect(() => {
        const handleResize = () => {
            // Instant scroll for resizing events to feel snappy
            setTimeout(() => scrollToBottom('auto'), 100);
        };

        window.addEventListener('resize', handleResize);

        // Also listen to visualViewport if available (better for mobile keyboards)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
        };
    }, []);

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

            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'; // Reset to default
            }
            maxScrollTriggeredRef.current = false;
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
        e.stopPropagation();

        // Start loading animation
        setDownloadingFiles(prev => ({ ...prev, [url]: 'loading' }));

        // Artifical delay for visual feedback (0.4s)
        await new Promise(resolve => setTimeout(resolve, 400));

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            // Show success tick
            setDownloadingFiles(prev => ({ ...prev, [url]: 'success' }));

            // Revert to normal after 2s
            setTimeout(() => {
                setDownloadingFiles(prev => {
                    const next = { ...prev };
                    delete next[url];
                    return next;
                });
            }, 2000);

        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank'); // Fallback

            // Show error state
            setDownloadingFiles(prev => ({ ...prev, [url]: 'error' }));

            // Revert state after 2s
            setTimeout(() => {
                setDownloadingFiles(prev => {
                    const next = { ...prev };
                    delete next[url];
                    return next;
                });
            }, 2000);
        }
    };


    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Send on Cmd+Enter or Ctrl+Enter (optional power user shortcut)
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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

    // Helper to format date for separators
    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full bg-white relative min-h-0"
            onClick={() => setActiveMessageId(null)}
        >
            {/* Header */}
            <div className="px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 flex items-center gap-2 md:gap-3 bg-white shadow-sm flex-shrink-0 z-10">
                {/* Back Button for Mobile */}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="md:hidden p-1.5 -ml-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                        aria-label="Go back to conversations"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                )}

                {/* User Info */}
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold shadow-inner flex-shrink-0 text-sm md:text-base">
                        {otherPartyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{otherPartyName}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                            {typingUser ? (
                                <span className="text-primary animate-pulse">typing...</span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500"></span>
                                    Online
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Options Menu (placeholder for future features) */}
                <button className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 md:px-4 py-4 space-y-1 bg-gradient-to-b from-gray-50/30 to-white messages-container hide-scrollbar min-h-0"
            >
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
                        const prevMessage = messages[index - 1];
                        const nextMessage = messages[index + 1];

                        // Handle different senderId formats
                        const getSenderId = (msg: any) => typeof msg.senderId === 'object' && msg.senderId !== null
                            ? (msg.senderId._id || msg.senderId)
                            : msg.senderId;

                        const senderId = getSenderId(message);
                        const prevSenderId = prevMessage ? getSenderId(prevMessage) : null;
                        const nextSenderId = nextMessage ? getSenderId(nextMessage) : null;

                        const isOwn = String(senderId) === String(currentUserId);

                        // Check if day changed
                        const isDateChanged = !prevMessage ||
                            new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

                        // Grouping logic
                        const isFirstInGroup = isDateChanged || String(senderId) !== String(prevSenderId);
                        const isLastInGroup = !nextMessage || String(senderId) !== String(nextSenderId) ||
                            new Date(nextMessage.createdAt).toDateString() !== new Date(message.createdAt).toDateString();

                        return (
                            <div key={message._id}>
                                {isDateChanged && (
                                    <div className="flex justify-center my-3 md:my-6 sticky top-2 z-10">
                                        <span className="px-2 py-0.5 md:px-3 md:py-1 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest shadow-sm">
                                            {formatDateSeparator(message.createdAt)}
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isOwn ? 'animate-message-slide-in-right' : 'animate-message-slide-in-left'} ${isFirstInGroup ? 'mt-2 md:mt-4' : 'mt-0.5'}`}
                                    style={{ animationDelay: isFirstInGroup ? `${index * 50}ms` : '0ms' }}
                                >
                                    <div
                                        className={`flex flex-col message-bubble ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%]`}
                                        onClick={(e) => handleMessageTap(e, message._id, isOwn, (message as any).isDeleted)}
                                    >
                                        <div
                                            className={`rounded-xl md:rounded-2xl px-3 py-1.5 md:px-4 md:py-2.5 shadow-sm relative group ${isOwn
                                                ? 'bg-gradient-to-br from-primary to-primary-dark text-white message-bubble-own'
                                                : 'bg-white text-gray-800 message-bubble-other border border-gray-200'
                                                } ${isOwn
                                                    ? (isFirstInGroup ? 'rounded-tr-none' : isLastInGroup ? 'rounded-br-xl md:rounded-br-2xl' : 'rounded-r-md')
                                                    : (isFirstInGroup ? 'rounded-tl-none' : isLastInGroup ? 'rounded-bl-xl md:rounded-bl-2xl' : 'rounded-l-md')
                                                }`}
                                        >
                                            {/* Delete Button (Only for own messages that aren't deleted) */}
                                            {isOwn && !(message as any).isDeleted && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteMessage(applicationId, message._id);
                                                        setActiveMessageId(null);
                                                    }}
                                                    className={`absolute -left-7 top-1 sm:top-2 p-1.5 text-red-500 md:text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 ${activeMessageId === message._id
                                                        ? 'opacity-100 scale-100'
                                                        : 'opacity-0 scale-90 md:opacity-0 md:group-hover:opacity-100 md:group-hover:scale-100'
                                                        }`}
                                                    title="Delete message"
                                                >
                                                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                                </button>
                                            )}
                                            {message.content && (
                                                <p className="text-sm leading-snug md:leading-relaxed whitespace-pre-wrap break-words">
                                                    {message.content}
                                                </p>
                                            )}

                                            {/* Attachments */}
                                            {message.attachments.length > 0 && (
                                                <div className={`mt-2 md:mt-3 space-y-1 md:space-y-2`}>
                                                    {message.attachments.map((attachment, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => window.open(attachment.fileUrl, '_blank')}
                                                            className={`flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all attachment-preview cursor-pointer ${isOwn
                                                                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                                                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                                                                }`}
                                                        >
                                                            <div className={`p-1.5 md:p-2 rounded-lg ${isOwn ? 'bg-white/20' : 'bg-gray-200'}`}>
                                                                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs md:text-sm font-medium truncate">{attachment.fileName}</p>
                                                                <p className={`text-[10px] md:text-xs ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
                                                                    {formatFileSize(attachment.fileSize)}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => handleDownload(e, attachment.fileUrl, attachment.fileName)}
                                                                className={`p-1.5 rounded-full transition-colors flex-shrink-0 ml-1 ${isOwn
                                                                    ? 'hover:bg-white/20 text-white/70 hover:text-white'
                                                                    : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'}`}
                                                            >
                                                                {downloadingFiles[attachment.fileUrl] === 'loading' ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : downloadingFiles[attachment.fileUrl] === 'success' ? (
                                                                    <Check className="w-4 h-4 text-green-500" />
                                                                ) : downloadingFiles[attachment.fileUrl] === 'error' ? (
                                                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                                                ) : (
                                                                    <Download className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Timestamp and Status */}
                                        <div className={`flex items-center gap-1 mt-1 px-1 text-[10px] md:text-xs text-gray-400 font-medium ${isOwn ? 'justify-end' : 'justify-start'}`}>
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
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUser && (
                    <div className="flex justify-start animate-message-slide-in-left">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 mt-2">
                            <div className="flex space-x-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            {
                showScrollButton && (
                    <button
                        onClick={() => scrollToBottom('smooth')}
                        className="absolute bottom-24 right-6 p-2.5 bg-white border border-gray-100 rounded-full shadow-xl text-primary hover:bg-gray-50 transition-all z-20 active:scale-95 animate-bounce-in"
                    >
                        <ArrowDown className="w-5 h-5" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                    </button>
                )
            }

            {/* Attachments Preview */}
            {
                attachments.length > 0 && (
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
                )
            }

            {/* Input Area */}
            <div className="p-2 md:p-4 border-t border-gray-200 bg-white safe-area-bottom">
                <div className="flex items-center gap-2 md:gap-3 max-w-full">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/5 active:bg-primary/10 transition-all duration-200 active:scale-95"
                        disabled={sending}
                        title="Attach files"
                    >
                        <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <div className="flex-1 relative min-w-0">
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                                const prevHeight = e.target.style.height;
                                const MAX_HEIGHT = 120;
                                const newHeightVal = Math.min(e.target.scrollHeight, MAX_HEIGHT);
                                const newHeight = newHeightVal + 'px';
                                e.target.style.height = newHeight;

                                // Reset max scroll trigger if we shrink below max
                                if (newHeightVal < MAX_HEIGHT) {
                                    maxScrollTriggeredRef.current = false;
                                }

                                // Scroll if height changed OR if we just hit the overflow for the first time
                                const shouldScroll = prevHeight !== newHeight ||
                                    (newHeightVal === MAX_HEIGHT && e.target.scrollHeight > MAX_HEIGHT && !maxScrollTriggeredRef.current);

                                if (shouldScroll) {
                                    if (prevHeight === newHeight) {
                                        maxScrollTriggeredRef.current = true;
                                    }

                                    setTimeout(() => {
                                        if (scrollContainerRef.current) {
                                            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                                        }
                                    }, 10);
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="w-full px-3 py-2 md:px-4 md:py-3 bg-gray-50 border border-gray-200 rounded-xl md:rounded-2xl resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-none max-h-[120px] min-h-[40px] md:min-h-[48px] text-sm md:text-base"
                            rows={1}
                            disabled={sending}
                        />
                    </div>

                    <button
                        onClick={handleSendMessage}
                        disabled={sending || (!newMessage.trim() && attachments.length === 0)}
                        className={`group relative flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 transform ${sending || (!newMessage.trim() && attachments.length === 0)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed scale-90'
                            : 'bg-primary text-white hover:bg-primary-dark hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-primary/40'
                            }`}
                    >
                        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${!(sending || (!newMessage.trim() && attachments.length === 0))
                            ? 'group-hover:bg-white/20 group-active:bg-white/30'
                            : ''
                            }`} />
                        {sending ? (
                            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin relative z-10" />
                        ) : (
                            <Send className={`w-3 h-3 md:w-4 md:h-4 relative z-10 transition-transform duration-200 ${!(sending || (!newMessage.trim() && attachments.length === 0))
                                ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                                : ''
                                }`} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

