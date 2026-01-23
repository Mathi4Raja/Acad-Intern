"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavigationItem {
    name: string;
    href: string;
    icon: LucideIcon;
}

export type SidebarVariant = "admin" | "student" | "company";

interface SidebarProps {
    navigation: NavigationItem[];
    variant?: SidebarVariant;
    isOpen: boolean;
    onClose: () => void;
    quickStats?: {
        label: string;
        value: string | number;
        highlight?: boolean;
    }[];
    className?: string;
    onLogout?: () => void;
}

const variantStyles: Record<SidebarVariant, { active: string; hover: string }> = {
    admin: {
        active: "bg-red-50 text-red-600 font-semibold shadow-sm",
        hover: "text-gray-700 hover:bg-gray-50",
    },
    student: {
        active: "bg-primary/10 text-primary border-l-4 border-primary",
        hover: "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
    },
    company: {
        active: "bg-primary/10 text-primary border-l-4 border-primary",
        hover: "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
    },
};

export function Sidebar({
    navigation,
    variant = "student",
    isOpen,
    onClose,
    quickStats,
    className,
    onLogout,
}: SidebarProps) {
    const pathname = usePathname();
    const styles = variantStyles[variant];

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
                // All variants stay fixed
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                variant === "admin" ? "top-16 bottom-0 w-72 sm:w-64" : "mt-14 sm:mt-16",
                className
            )}
        >
            <div className="flex flex-col h-full">
                {/* Mobile User Info for Admin */}
                {variant === "admin" && (
                    <div className="md:hidden p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold">
                                A
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Admin User</p>
                                <p className="text-xs text-gray-600">admin@acadintern.com</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                                    isActive ? styles.active : styles.hover
                                )}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Quick Stats (Admin only) */}
                {quickStats && quickStats.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Quick Stats
                        </p>
                        <div className="space-y-2">
                            {quickStats.map((stat, i) => (
                                <div key={i} className="flex justify-between text-xs sm:text-sm">
                                    <span className="text-gray-600">{stat.label}</span>
                                    <span
                                        className={cn(
                                            "font-semibold",
                                            stat.highlight ? "text-red-600" : "text-gray-900"
                                        )}
                                    >
                                        {stat.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                {onLogout && (
                    <div className="border-t border-gray-200 p-4">
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
