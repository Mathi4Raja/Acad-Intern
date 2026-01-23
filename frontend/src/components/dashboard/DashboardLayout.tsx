"use client";

import { useState } from "react";
import { TopNavbar, NavbarVariant } from "./TopNavbar";
import { Sidebar, NavigationItem, SidebarVariant } from "./Sidebar";
import { LucideIcon } from "lucide-react";
import type { Notification } from "@/components/notifications/NotificationItem";

interface DashboardLayoutProps {
    children: React.ReactNode;
    variant?: NavbarVariant & SidebarVariant;
    navigation: NavigationItem[];
    logoIcon?: LucideIcon;
    logoIconColor?: string;
    userName?: string;
    userEmail?: string;
    userIcon?: LucideIcon;
    notificationHref?: string;
    portalLabel?: string;
    quickStats?: {
        label: string;
        value: string | number;
        highlight?: boolean;
    }[];
    // Notification props
    notifications?: Notification[];
    onMarkNotificationAsRead?: (id: string) => void;
    onMarkAllNotificationsAsRead?: () => void;
    onLogout?: () => void;
    disableContentPadding?: boolean;
}

export function DashboardLayout({
    children,
    variant = "student",
    navigation,
    logoIcon,
    logoIconColor,
    userName,
    userEmail,
    userIcon,
    notificationHref,
    portalLabel,
    quickStats,
    notifications = [],
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead,
    onLogout,
    disableContentPadding = false,
}: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <TopNavbar
                variant={variant}
                portalLabel={portalLabel}
                logoIcon={logoIcon}
                logoIconColor={logoIconColor}
                userName={userName}
                userEmail={userEmail}
                userIcon={userIcon}
                notificationHref={notificationHref}
                isSidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                notifications={notifications}
                onMarkNotificationAsRead={onMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
                onLogout={onLogout}
            />

            {variant === "admin" ? (
                // Admin layout: sidebar is fixed, main has left margin
                <>
                    <Sidebar
                        navigation={navigation}
                        variant={variant}
                        isOpen={sidebarOpen}
                        onClose={closeSidebar}
                        quickStats={quickStats}
                        onLogout={onLogout}
                    />

                    {/* Overlay for mobile */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden top-16"
                            onClick={closeSidebar}
                        />
                    )}

                    {/* Main Content */}
                    <main className={`lg:ml-64 pt-16 ${disableContentPadding ? '' : ''}`}>
                        {children}
                    </main>
                </>
            ) : (
                // Student/Company layout: fixed sidebar with scrollable content
                <>
                    <Sidebar
                        navigation={navigation}
                        variant={variant}
                        isOpen={sidebarOpen}
                        onClose={closeSidebar}
                        quickStats={quickStats}
                        onLogout={onLogout}
                    />

                    {/* Overlay for mobile */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-[45] lg:hidden mt-14 sm:mt-16"
                            onClick={closeSidebar}
                        />
                    )}

                    {/* Main Content */}
                    <main className={`mt-14 sm:mt-16 lg:ml-64 ${disableContentPadding ? 'p-0' : 'p-3 sm:p-6 lg:p-8'}`}>
                        {children}
                    </main>
                </>
            )}
        </div>
    );
}
