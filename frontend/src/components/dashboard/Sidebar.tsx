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

const variantStyles: Record<SidebarVariant, { active: string; hover: string; icon: string }> = {
    admin: {
        active: "bg-red-50/80 text-red-600 font-black shadow-sm ring-1 ring-red-100",
        hover: "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
        icon: "group-hover:scale-110 shadow-red-100/50",
    },
    student: {
        active: "bg-primary/10 text-primary border-l-4 border-primary font-bold",
        hover: "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        icon: "",
    },
    company: {
        active: "bg-primary/10 text-primary border-l-4 border-primary font-bold",
        hover: "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        icon: "",
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
                "fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-gray-100 transform transition-all duration-300 ease-in-out shadow-[1px_0_10px_rgba(0,0,0,0.02)]",
                // All variants stay fixed
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                variant === "admin" ? "top-14 sm:top-16 bottom-0 w-60" : "mt-14 sm:mt-16 w-60",
                className
            )}
        >
            <div className="flex flex-col h-full">
                {/* Mobile User Info for Admin */}
                {variant === "admin" && (
                    <div className="lg:hidden p-4 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-gray-200">
                                A
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-gray-900 truncate">Admin Terminal</p>
                                <p className="text-[10px] font-bold text-gray-400 truncate">Root Access</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-hide">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 text-[14px] font-bold tracking-tight",
                                    isActive ? styles.active : styles.hover
                                )}
                            >
                                <div className={cn(
                                    "p-1 rounded-lg transition-transform duration-300",
                                    isActive && variant === "admin" ? "bg-white shadow-sm" : "bg-transparent",
                                    isActive ? styles.icon : ""
                                )}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                                </div>
                                <span className={cn(isActive ? "translate-x-0.5" : "")}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Quick Stats (Admin only) */}
                {quickStats && quickStats.length > 0 && (
                    <div className="p-3 mx-3 mb-2 bg-gray-50/50 rounded-2xl border border-gray-50 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 group/stats">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                            Live Metrics
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </p>
                        <div className="space-y-2">
                            {quickStats.map((stat, i) => (
                                <div key={i} className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-black text-gray-400 tracking-tight">{stat.label}</span>
                                    <div className="flex items-baseline justify-between">
                                        <span
                                            className={cn(
                                                "text-[14px] font-black tracking-tight",
                                                stat.highlight ? "text-red-600" : "text-gray-900"
                                            )}
                                        >
                                            {stat.value}
                                        </span>
                                        {stat.highlight && (
                                            <span className="text-[8px] font-black text-red-500 bg-red-50 px-1 py-0.5 rounded border border-red-100 uppercase tracking-tighter">Action Req.</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-2 bg-white mt-auto">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 px-3.5 py-2.5 w-full text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-red-50 hover:text-red-600 hover:shadow-sm rounded-2xl transition-all duration-300 group/logout"
                    >
                        <div className="p-1 rounded-lg group-hover/logout:bg-white group-hover/logout:shadow-sm transition-all">
                            <LogOut size={18} />
                        </div>
                        Logout
                    </button>
                </div>
            </div>
        </aside>
    );
}
