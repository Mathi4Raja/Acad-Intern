"use client";

import Link from "next/link";
import { Bell, Menu, X, LogOut, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/notifications";
import type { Notification } from "@/components/notifications/NotificationItem";

export type NavbarVariant = "admin" | "student" | "company";

interface TopNavbarProps {
    variant?: NavbarVariant;
    portalLabel?: string;
    logoIcon?: LucideIcon;
    logoIconColor?: string;
    userName?: string;
    userEmail?: string;
    userIcon?: LucideIcon;
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
    notificationHref,
    isSidebarOpen,
    onToggleSidebar,
    className,
    notifications = [],
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead,
    onLogout,
}: TopNavbarProps) {
    const config = variantConfig[variant];
    const displayLabel = portalLabel ?? config.label;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <nav className={cn("bg-white border-b border-gray-200 fixed w-full top-0 z-[60]", className)}>
            <div className="px-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Left Side: Menu + Logo */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        <button
                            onClick={onToggleSidebar}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                            aria-label="Toggle menu"
                        >
                            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <Link
                            href={variant === "admin" ? "/admin/dashboard" : "/"}
                            className="flex items-center gap-1.5 sm:gap-2 min-w-0"
                        >
                            {LogoIcon && (
                                <LogoIcon
                                    className={cn("flex-shrink-0", logoIconColor ?? config.labelColor)}
                                    size={20}
                                />
                            )}
                            <div className="flex items-baseline gap-1 min-w-0">
                                <span className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                                    AcadIntern
                                </span>
                                {variant === "admin" ? (
                                    <span className={cn("text-xs sm:text-sm lg:text-base font-bold flex-shrink-0", config.labelColor)}>
                                        {displayLabel}
                                    </span>
                                ) : (
                                    <span className={cn("hidden md:inline-block text-xs sm:text-sm ml-2", config.labelColor)}>
                                        {displayLabel}
                                    </span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* Right Side: Notifications + User */}
                    <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                        {/* Notifications - Use dropdown if we have data, otherwise link */}
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
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                            >
                                <Bell size={18} className="sm:w-5 sm:h-5 text-gray-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                            </Link>
                        ) : (
                            <button
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                                aria-label="Notifications"
                            >
                                <Bell size={18} className="sm:w-5 sm:h-5 text-gray-600" />
                            </button>
                        )}

                        {/* User Info */}
                        <div className="hidden md:flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-gray-200">
                            <div
                                className={cn(
                                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br",
                                    config.gradient
                                )}
                            >
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                                {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
                            </div>
                        </div>

                        {/* Mobile User Avatar */}
                        {UserIcon && (
                            <button className="md:hidden p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                <UserIcon size={20} />
                            </button>
                        )}

                        {/* Logout Button (Admin or when callback provided) */}
                        {(variant === "admin" || onLogout) && (
                            <button
                                onClick={onLogout}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                aria-label="Logout"
                            >
                                <LogOut size={18} className="sm:w-5 sm:h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
