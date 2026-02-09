'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { settingsApi } from '@/lib/api'

interface PublicSettings {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    allowRegistration: boolean;
    maxFileSize: number;
    maxMessageSize: number;
    allowResumeUpload: boolean;
    maintenanceMode: boolean;
}

interface SettingsContextType {
    settings: PublicSettings | null;
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<PublicSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await settingsApi.getPublic();
            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch public settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (settings?.siteName) {
            document.title = `${settings.siteName} | Launch Your Career with Top Internships`;
        }
    }, [settings]);

    const refreshSettings = async () => {
        setIsLoading(true);
        await fetchSettings();
    };

    return (
        <SettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
