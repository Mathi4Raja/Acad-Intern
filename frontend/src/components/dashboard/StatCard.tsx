"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    growth?: number;
    iconBgColor?: string;
    iconColor?: string;
    className?: string;
    invertGrowth?: boolean; // For metrics where negative is good (e.g., pending reports)
}

export function StatCard({
    title,
    value,
    icon: Icon,
    growth,
    iconBgColor = "bg-blue-50",
    iconColor = "text-blue-600",
    className,
    invertGrowth = false,
}: StatCardProps) {
    const isPositive = invertGrowth ? (growth ?? 0) < 0 : (growth ?? 0) > 0;
    const displayGrowth = Math.abs(growth ?? 0);

    return (
        <div
            className={cn(
                "bg-white rounded-lg shadow-sm border border-gray-100 p-2 hover:shadow-md transition-shadow",
                className
            )}
        >
            <div className="flex items-center justify-between mb-1">
                <div className={cn("p-1.5 rounded-lg", iconBgColor)}>
                    <Icon className={iconColor} size={14} />
                </div>
                {growth !== undefined && (
                    <div
                        className={cn(
                            "flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold",
                            isPositive ? "text-green-600" : "text-red-600"
                        )}
                    >
                        {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {displayGrowth}%
                    </div>
                )}
            </div>
            <h3 className="text-[10px] font-medium text-gray-600 mb-0.5">{title}</h3>
            <p className="text-base sm:text-xl font-bold text-gray-900">
                {typeof value === "number" ? value.toLocaleString() : value}
            </p>
        </div>
    );
}
