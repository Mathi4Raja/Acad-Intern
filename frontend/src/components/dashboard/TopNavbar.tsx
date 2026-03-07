"use client";

import Link from "next/link";
import { Bell, Menu, X, LogOut, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/notifications";
import type { Notification } from "@/components/notifications/NotificationItem";
import { useSettings } from "@/lib/SettingsContext";

export type NavbarVariant = "admin" | "student" | "company";

interface TopNavbarProps {
    variant?: NavbarVariant;
    portalLabel?: string;
    logoIcon?: LucideIcon;
    logoIconColor?: string;
    userName?: string;
    userEmail?: string;
    userIcon?: LucideIcon;
    userAvatar?: string;
    notificationHref?: string;
    isSidebarOpen: boolean;
    onToggleSidebar: () => void;
    className?: string;
    // Notification props
    notifications?: Notification[];
    onMarkNotificationAsRead?: (id: string) => void;
    onMarkAllNotificationsAsRead?: () => void;
    onLogout?: () => void;
}

const variantConfig: Record<NavbarVariant, { gradient: string; label: string; labelColor: string }> = {
    admin: {
        gradient: "from-red-500 to-red-700",
        label: "Admin",
        labelColor: "text-red-600",
    },
    student: {
        gradient: "from-primary to-primary/80",
        label: "Student Portal",
        labelColor: "text-gray-500",
    },
    company: {
        gradient: "from-primary to-primary/80",
        label: "Company Portal",
        labelColor: "text-gray-500",
    },
};

export function TopNavbar({
    variant = "student",
    portalLabel,
    logoIcon: LogoIcon,
    logoIconColor,
    userName = "User",
    userEmail,
    userIcon: UserIcon,
    userAvatar,
    notificationHref,
    isSidebarOpen,
    onToggleSidebar,
    className,
    notifications = [],
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead,
    onLogout,
}: TopNavbarProps) {
    const { settings } = useSettings();
    const config = variantConfig[variant];
    const displayLabel = portalLabel ?? config.label;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <nav className={cn("bg-white/80 backdrop-blur-md border-b border-gray-100 fixed w-full top-0 z-[60] shadow-sm shadow-gray-200/20", className)}>
            <div className="px-3 sm:px-6">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Left Side: Menu + Logo */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <button
                            onClick={onToggleSidebar}
                            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
                            aria-label="Toggle menu"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        <Link
                            href={variant === "admin" ? "/admin/dashboard" : "/"}
                            className="flex items-center gap-2.5 min-w-0 group/logo"
                        >
                            {LogoIcon && (
                                <LogoIcon
                                    className={cn("flex-shrink-0 transition-transform group-hover/logo:scale-110", logoIconColor ?? config.labelColor)}
                                    size={20}
                                />
                            )}
                            <div className="flex items-baseline gap-1 min-w-0">
                                <span className="text-base sm:text-lg font-black text-gray-900 truncate tracking-tight">
                                    {settings?.siteName || "AcadIntern"}
                                </span>
                                {variant === "admin" ? (
                                    <span className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest flex-shrink-0 opacity-80", config.labelColor)}>
                                        {displayLabel}
                                    </span>
                                ) : (
                                    <span className={cn("hidden md:inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wide ml-1.5 text-gray-400", config.labelColor)}>
                                        {displayLabel}
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* Right Side: Notifications + User */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        {/* Notifications */}
                        {notifications.length > 0 ? (
                            <NotificationDropdown
                                notifications={notifications}
                                onMarkAsRead={onMarkNotificationAsRead}
                                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                                notificationsHref={notificationHref}
                            />
                        ) : notificationHref ? (
                            <Link
                                href={notificationHref}
                                className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative"
                            >
                                <Bell size={20} className="text-gray-500" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                                )}
                            </Link>
                        ) : (
                            <button
                                className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative"
                                aria-label="Notifications"
                            >
                                <Bell size={20} className="text-gray-500" />
                            </button>
                        )}

                        {/* User Info */}
                        <div className="hidden md:flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-100">
                            <div
                                className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-black text-xs bg-gradient-to-br shadow-sm transform transition-transform hover:scale-105",
                                    config.gradient
                                )}
                            >
                                {userAvatar ? (
                                    <img
                                        src={userAvatar}
                                        alt={userName}
                                        className="w-full h-full object-cover rounded-full"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    userName.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-[12px] font-black text-gray-900 leading-none">{userName}</p>
                                {userEmail && <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">{userEmail}</p>}
                            </div>
                        </div>

                        {/* Mobile User Avatar */}
                        {UserIcon && (
                            <button className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                <UserIcon size={18} />
                            </button>
                        )}

                        {/* Logout Button */}
                        {(variant === "admin" || onLogout) && (
                            <button
                                onClick={onLogout}
                                className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                                aria-label="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
