"use client";

import { useState } from "react";
import { TopNavbar, NavbarVariant } from "./TopNavbar";
import { Sidebar, NavigationItem, SidebarVariant } from "./Sidebar";
import { LucideIcon, LogOut } from "lucide-react";
import type { Notification } from "@/components/notifications/NotificationItem";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DashboardLayoutProps {
    children: React.ReactNode;
    variant?: NavbarVariant & SidebarVariant;
    navigation: NavigationItem[];
    logoIcon?: LucideIcon;
    logoIconColor?: string;
    userName?: string;
    userEmail?: string;
    userIcon?: LucideIcon;
    userAvatar?: string;
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
    userAvatar,
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
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    const handleLogoutClick = () => {
        if (onLogout) {
            setShowLogoutConfirm(true);
        }
    };

    const handleConfirmLogout = () => {
        setShowLogoutConfirm(false);
        if (onLogout) {
            onLogout();
        }
    };

    return (
        <div className={disableContentPadding ? "fixed inset-0 overflow-hidden bg-gray-50 flex flex-col" : "min-h-screen bg-gray-50"}>
            {/* Top Navigation */}
            <TopNavbar
                variant={variant}
                portalLabel={portalLabel}
                logoIcon={logoIcon}
                logoIconColor={logoIconColor}
                userName={userName}
                userEmail={userEmail}
                userIcon={userIcon}
                userAvatar={userAvatar}
                notificationHref={notificationHref}
                isSidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                notifications={notifications}
                onMarkNotificationAsRead={onMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={onMarkAllNotificationsAsRead}
                onLogout={handleLogoutClick}
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
                        onLogout={handleLogoutClick}
                    />

                    {/* Overlay for mobile */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden top-14 sm:top-16"
                            onClick={closeSidebar}
                        />
                    )}

                    {/* Main Content */}
                    <main className={`lg:ml-56 pt-16 sm:pt-20 min-h-screen ${disableContentPadding ? '' : ''}`}>
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
                        onLogout={handleLogoutClick}
                    />

                    {/* Overlay for mobile */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-[45] lg:hidden mt-14 sm:mt-16"
                            onClick={closeSidebar}
                        />
                    )}

                    {/* Main Content */}
                    <main className={disableContentPadding
                        ? "absolute inset-0 top-14 sm:top-16 lg:left-64 overflow-hidden flex flex-col bg-white"
                        : "pt-16 sm:pt-20 lg:ml-64 min-h-screen"
                    }>
                        {children}
                    </main>
                </>
            )}

            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleConfirmLogout}
                title="Confirm Logout"
                message="Are you sure you want to log out of your account? Any unsaved changes may be lost."
                confirmLabel="Log Out"
                cancelLabel="Stay Logged In"
                type="danger"
            />
        </div>
    );
}
