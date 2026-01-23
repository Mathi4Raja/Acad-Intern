'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: Set<string>;
    connectError: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [connectError, setConnectError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            return;
        }

        // Get auth token from cookies or localStorage
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1] ||
            localStorage.getItem('token');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const socketUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

        const socketInstance = io(socketUrl, {
            auth: {
                token
            },
            withCredentials: true,
            transports: ['websocket']
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

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
            setOnlineUsers(new Set());
            setConnectError(null);
        };
    }, [isAuthenticated, user]);

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            onlineUsers,
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
