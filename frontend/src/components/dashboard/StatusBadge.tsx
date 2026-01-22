"use client";

import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "purple" | "default";

interface StatusBadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    default: "bg-gray-100 text-gray-700",
};

export function StatusBadge({ children, variant = "default", className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                variantStyles[variant],
                className
            )}
        >
            {children}
        </span>
    );
}

// Helper function to map status strings to variants
export function getStatusVariant(status: string): BadgeVariant {
    switch (status.toLowerCase()) {
        case "active":
            return "success";
        case "pending":
            return "warning";
        case "inactive":
        case "rejected":
            return "error";
        case "student":
            return "info";
        case "company":
            return "purple";
        default:
            return "default";
    }
}

// Helper for priority
export function getPriorityVariant(priority: string): BadgeVariant {
    switch (priority.toLowerCase()) {
        case "high":
            return "error";
        case "medium":
            return "warning";
        case "low":
            return "info";
        default:
            return "default";
    }
}
