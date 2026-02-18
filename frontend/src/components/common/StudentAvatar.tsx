import React, { memo, useState } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudentAvatarProps {
    name?: string
    logoUrl?: string | null
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    className?: string
}

const StudentAvatar = memo(({ name = 'Student', logoUrl, size = 'md', className = '' }: StudentAvatarProps) => {
    const [hasError, setHasError] = useState(false)

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-24 h-24 sm:w-32 sm:h-32 text-2xl',
        '2xl': 'w-32 h-32 text-3xl'
    }

    const iconSizes = {
        sm: 14,
        md: 18,
        lg: 20,
        xl: 40,
        '2xl': 48
    }

    return (
        <div
            className={cn(
                "rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0 overflow-hidden bg-gray-50",
                sizeClasses[size as keyof typeof sizeClasses],
                className
            )}
            aria-label={`${name}'s profile picture`}
        >
            {logoUrl && !hasError ? (
                <img
                    src={logoUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setHasError(true)}
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary/40">
                    <User size={iconSizes[size as keyof typeof iconSizes]} />
                </div>
            )}
        </div>
    )
})

StudentAvatar.displayName = 'StudentAvatar'

export default StudentAvatar
