import React, { memo, ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    children?: ReactNode
    className?: string
}

const PageHeader = memo(({ title, subtitle, children, className = '' }: PageHeaderProps) => {
    return (
        <div className={`mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 ${className}`}>
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5 tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-xs sm:text-sm text-gray-600 max-w-2xl">
                        {subtitle}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex-shrink-0">
                    {children}
                </div>
            )}
        </div>
    )
})

PageHeader.displayName = 'PageHeader'

export default PageHeader
