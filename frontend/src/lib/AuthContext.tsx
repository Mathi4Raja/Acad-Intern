'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';
import { useRouter, usePathname } from 'next/navigation';
import { User, StudentProfile, CompanyProfile } from '@/types';

interface AuthContextType {
    user: User | null;
    profile: StudentProfile | CompanyProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    signup: (data: any) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<StudentProfile | CompanyProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            // Don't check auth on public pages if you want to save bandwidth, 
            // but checking essentially keeps session sync active.
            const res = await api.get('/auth/me');
            setUser(res.data.data.user);
            setProfile(res.data.data.profile);
        } catch (error) {
            // Not authenticated
            setUser(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to set cookie
    const setCookie = (name: string, value: string, days: number) => {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/`;
    };

    // Helper to clear cookie
    const clearCookie = (name: string) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    };

    const login = async (formData: any) => {
        try {
            const res = await api.post('/auth/login', formData);
            setUser(res.data.data.user);

            // Store token in an accessible cookie for Socket.IO
            // The backend also sets httpOnly cookie for API requests
            const token = res.data.data.token;
            if (token) {
                setCookie('socket_token', token, 7); // 7 days to match backend
            }

            // Fetch full profile
            await checkAuthStatus();

            // Redirect based on role
            const role = res.data.data.user.role;
            const searchParams = new URLSearchParams(window.location.search);
            const redirectUrl = searchParams.get('redirect');

            if (redirectUrl) {
                router.push(redirectUrl);
            } else if (role === 'admin') {
                router.push('/admin/dashboard');
            } else if (role === 'company') {
                router.push('/company/dashboard');
            } else {
                router.push('/student/dashboard');
            }

        } catch (error) {
            throw error;
        }
    };

    const signup = async (formData: any) => {
        try {
            const res = await api.post('/auth/signup', formData);
            setUser(res.data.data.user);

            // Store token in an accessible cookie for Socket.IO
            const token = res.data.data.token;
            if (token) {
                setCookie('socket_token', token, 7);
            }

            await checkAuthStatus();

            const role = res.data.data.user.role;
            const searchParams = new URLSearchParams(window.location.search);
            const redirectUrl = searchParams.get('redirect');

            if (redirectUrl) {
                router.push(redirectUrl);
            } else if (role === 'admin') {
                router.push('/admin/dashboard');
            } else if (role === 'company') {
                router.push('/company/dashboard');
            } else {
                router.push('/student/dashboard');
            }
        } catch (error) {
            throw error;
        }
    };

    const googleLogin = async (idToken: string) => {
        try {
            const res = await api.post('/auth/google', { idToken });
            setUser(res.data.data.user);

            // Store token in an accessible cookie for Socket.IO
            const token = res.data.data.token;
            if (token) {
                setCookie('socket_token', token, 7);
            }

            await checkAuthStatus();

            const searchParams = new URLSearchParams(window.location.search);
            const redirectUrl = searchParams.get('redirect');

            if (redirectUrl) {
                router.push(redirectUrl);
            } else {
                // Google OAuth is only for students
                router.push('/student/dashboard');
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error: any) {
            // 401 is expected if not logged in - silently ignore
            if (error?.response?.status !== 401) {
                console.error('Logout failed', error);
            }
        } finally {
            // Clear the accessible token cookie
            clearCookie('socket_token');
            // Always clear state and redirect
            setUser(null);
            setProfile(null);
            router.push('/login');
        }
    };

    const deleteAccount = async () => {
        try {
            await api.delete('/auth/account');
            // Clear the accessible token cookie
            clearCookie('socket_token');
            // Clear state and redirect
            setUser(null);
            setProfile(null);
            router.push('/');
        } catch (error) {
            throw error;
        }
    };

    const refreshUser = async () => {
        await checkAuthStatus();
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            isAuthenticated: !!user,
            isLoading,
            login,
            signup,
            googleLogin,
            logout,
            deleteAccount,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
