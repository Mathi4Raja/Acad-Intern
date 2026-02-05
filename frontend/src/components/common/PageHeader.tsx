import React, { memo, ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    children?: ReactNode
    action?: ReactNode
    className?: string
    size?: 'default' | 'small'
}

const PageHeader = memo(({ title, subtitle, children, action, className = '', size = 'default' }: PageHeaderProps) => {
    return (
        <div className={`mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`}>
            <div>
                <h1 className={`${size === 'small' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-bold text-gray-900 mb-2 tracking-tight`}>
                    {title}
                </h1>
                {subtitle && (
                    <p className={`${size === 'small' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} text-gray-600 max-w-2xl`}>
                        {subtitle}
                    </p>
                )}
                {children}
            </div>
            {action && (
                <div className="flex-shrink-0">
                    {action}
                </div>
            )}
        </div>
    )
})

PageHeader.displayName = 'PageHeader'

export default PageHeader
