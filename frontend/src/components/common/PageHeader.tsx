import React, { memo, ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    children?: ReactNode
    className?: string
}

const PageHeader = memo(({ title, subtitle, children, className = '' }: PageHeaderProps) => {
    return (
        <div className={`mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`}>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
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
