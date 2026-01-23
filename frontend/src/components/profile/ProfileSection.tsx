import React, { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface ProfileSectionProps {
    title: string
    icon?: LucideIcon
    children: ReactNode
    className?: string
}

export const ProfileSection = ({ title, icon: Icon, children, className = '' }: ProfileSectionProps) => {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 transition-shadow hover:shadow-md ${className}`}>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                {Icon && <Icon className="text-primary" size={20} />}
                {title}
            </h2>
            {children}
        </div>
    )
}
