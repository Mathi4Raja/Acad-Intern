'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

// Define User types based on backend models
export type UserRole = 'student' | 'company' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface StudentProfile {
    userId: string;
    department?: string;
    semester?: string;
    skills: string[];
    // ... add other fields as needed
}

export interface CompanyProfile {
    userId: string;
    companyName: string;
    website?: string;
    // ... add other fields as needed
}

interface AuthContextType {
    user: User | null;
    profile: StudentProfile | CompanyProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: Record<string, unknown>) => Promise<void>;
    signup: (data: Record<string, unknown>) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<StudentProfile | CompanyProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

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
        } catch {
            // Not authenticated
            setUser(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (formData: Record<string, unknown>) => {
        try {
            const res = await api.post('/auth/login', formData);
            setUser(res.data.data.user);
            // After login, we might want to fetch full profile or it might be returned
            // The backend login controller sends: data: { user: {...}, token }
            // It doesn't send the profile. We should probably fetch 'me' or update backend.
            // For now, let's trigger a refresh
            await checkAuthStatus();

            // Redirect based on role
            const role = res.data.data.user.role;
            if (role === 'admin') router.push('/admin/dashboard');
            else if (role === 'company') router.push('/company/dashboard');
            else router.push('/student/dashboard');

        } catch (error) {
            throw error;
        }
    };

    const signup = async (formData: Record<string, unknown>) => {
        try {
            const res = await api.post('/auth/signup', formData);
            setUser(res.data.data.user);
            await checkAuthStatus();

            const role = res.data.data.user.role;
            if (role === 'admin') router.push('/admin/dashboard');
            else if (role === 'company') router.push('/company/dashboard');
            else router.push('/student/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            const err = error as AxiosError;
            // 401 is expected if not logged in - silently ignore
            if (err.response?.status !== 401) {
                console.error('Logout failed', error);
            }
        } finally {
            // Always clear state and redirect
            setUser(null);
            setProfile(null);
            router.push('/login');
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
            logout,
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
