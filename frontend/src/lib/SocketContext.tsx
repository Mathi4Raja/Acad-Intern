'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/types';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinApplication: (applicationId: string) => void;
    leaveApplication: (applicationId: string) => void;
    sendMessage: (applicationId: string, content: string, tempId?: string) => void;
    markAsSeen: (applicationId: string) => void;
    setTyping: (applicationId: string, isTyping: boolean) => void;
    deleteMessage: (applicationId: string, messageId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Get token from cookies
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return null;
        };

        // Cleanup existing socket if user logs out
        if (!isAuthenticated) {
            if (socketRef.current) {
                console.log('🔌 User logged out, disconnecting Socket.io...');
                socketRef.current.close();
                socketRef.current = null;
                setTimeout(() => {
                    setSocket(null);
                    setIsConnected(false);
                }, 0);
            }
            return;
        }

        // Small delay to ensure cookie is set after login
        const initSocket = () => {
            const token = getCookie('socket_token');
            if (!token) {
                console.log('No token found, Socket.io not connecting');
                setIsConnected(false);
                return;
            }

            // Don't reconnect if already connected with same socket
            if (socketRef.current?.connected) {
                console.log('🔌 Socket already connected');
                return;
            }

            console.log('🔌 Initializing Socket.IO connection...');

            // Determine API URL
            const getSocketUrl = (): string => {
                return process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
            };

            // Close existing socket before creating new one
            if (socketRef.current) {
                socketRef.current.close();
            }

            // Initialize socket connection
            const newSocket = io(getSocketUrl(), {
                auth: { token },
                withCredentials: true,
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket.io connected:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Socket.io disconnected');
                setIsConnected(false);
            });

            newSocket.on('error', (error) => {
                console.error('Socket.io error:', error);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket.io connection error:', error.message);
                setIsConnected(false);
            });

            socketRef.current = newSocket;
            setSocket(newSocket);
        };

        // Small delay to ensure cookie is available after login redirect
        const timer = setTimeout(initSocket, 100);

        return () => {
            clearTimeout(timer);
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [isAuthenticated, user]);

    const joinApplication = useCallback((applicationId: string) => {
        if (socket) {
            socket.emit('join-application', applicationId);
        }
    }, [socket]);

    const leaveApplication = useCallback((applicationId: string) => {
        if (socket) {
            socket.emit('leave-application', applicationId);
        }
    }, [socket]);

    const sendMessage = useCallback((applicationId: string, content: string, tempId?: string) => {
        if (socket) {
            socket.emit('send-message', { applicationId, content, tempId });
        }
    }, [socket]);

    const markAsSeen = useCallback((applicationId: string) => {
        if (socket) {
            socket.emit('mark-seen', { applicationId });
        }
    }, [socket]);

    const setTyping = useCallback((applicationId: string, isTyping: boolean) => {
        if (socket) {
            socket.emit('typing', { applicationId, isTyping });
        }
    }, [socket]);

    const deleteMessage = useCallback((applicationId: string, messageId: string) => {
        if (socket) {
            socket.emit('delete-message', { applicationId, messageId });
        }
    }, [socket]);

    const value = {
        socket,
        isConnected,
        joinApplication,
        leaveApplication,
        sendMessage,
        markAsSeen,
        setTyping,
        deleteMessage
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
