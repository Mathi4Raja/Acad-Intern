import React, { memo, useMemo } from 'react'
import { Building2 } from 'lucide-react'

interface CompanyLogoProps {
    name?: string
    logoUrl?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const CompanyLogo = memo(({ name = '', logoUrl, size = 'md', className = '' }: CompanyLogoProps) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl'
    }

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 20,
        xl: 24
    }

    // Consistent emoji generation
    const logoContent = useMemo(() => {
        if (logoUrl) {
            // If we had real images, we'd use Next.js Image here
            return <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
        }

        if (!name) return <Building2 size={iconSizes[size]} className="text-gray-400" />

        const emojis = ['🏢', '🏛️', '🏗️', '💼', '📊', '🔧', '💡', '🚀', '🌐', '⚡', '🔷', '🌟', '🎯']
        let hash = 0
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash)
        }
        const emoji = emojis[Math.abs(hash) % emojis.length]

        return <span>{emoji}</span>
    }, [name, logoUrl, size])

    // Consistent background color based on name (optional, keeping it subtle for now)
    const bgClass = useMemo(() => {
        if (logoUrl) return 'bg-white'
        const colors = ['bg-blue-50', 'bg-purple-50', 'bg-green-50', 'bg-orange-50', 'bg-red-50', 'bg-indigo-50']
        let hash = 0
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash)
        }
        return colors[Math.abs(hash) % colors.length]
    }, [name, logoUrl])

    return (
        <div
            className={`
        ${sizeClasses[size]} 
        ${bgClass} 
        rounded-xl flex items-center justify-center 
        shadow-sm border border-gray-100 flex-shrink-0 
        overflow-hidden ${className}
      `}
            aria-label={`${name} logo`}
        >
            {logoContent}
        </div>
    )
})

CompanyLogo.displayName = 'CompanyLogo'

export default CompanyLogo
