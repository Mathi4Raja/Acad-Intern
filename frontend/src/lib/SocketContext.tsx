'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: Set<string>;
    connect: () => void;
    disconnect: () => void;
    connectError: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [connectError, setConnectError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();

    const connect = () => {
        if (!isAuthenticated || !user) return;

        // Get auth token from cookies or localStorage
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1] ||
            localStorage.getItem('token');

        // We don't block if token is missing here, as it might be in an HttpOnly cookie

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        // Connect to root if API is /api, handle trailing/no trailing
        const socketUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

        const socketInstance = io(socketUrl, {
            auth: {
                token
            },
            withCredentials: true,
            transports: ['websocket'] // Force websocket to avoid polling issues
        });

        socketInstance.on('connect', () => {
            console.log('Connected to Socket.IO server');
            setIsConnected(true);
            setConnectError(null);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setConnectError(err.message);
            setIsConnected(false);
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
            setIsConnected(false);
            setOnlineUsers(new Set());
        });

        socketInstance.on('user_online', (data: { userId: string }) => {
            setOnlineUsers(prev => new Set(prev).add(data.userId));
        });

        socketInstance.on('user_offline', (data: { userId: string }) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.userId);
                return newSet;
            });
        });

        setSocket(socketInstance);
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            setOnlineUsers(new Set());
            setConnectError(null);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [isAuthenticated, user]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            onlineUsers,
            connect,
            disconnect,
            connectError
        }}>
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