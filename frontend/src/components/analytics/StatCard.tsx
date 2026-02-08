'use client'

import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface StatCardProps {
    title: string
    value: string | number
    change?: {
        value: number
        type: 'increase' | 'decrease' | 'neutral'
    }
    icon?: LucideIcon
    iconColor?: string
    iconBg?: string
    description?: string
    className?: string
    href?: string
    onClick?: () => void
    active?: boolean
}

export function StatCard({
    title,
    value,
    change,
    icon: Icon,
    iconColor = 'text-primary',
    iconBg = 'bg-primary/10',
    description,
    className,
    href,
    onClick,
    active
}: StatCardProps) {
    const getTrendIcon = () => {
        if (!change) return null
        switch (change.type) {
            case 'increase':
                return <TrendingUp className="w-4 h-4 text-green-500" />
            case 'decrease':
                return <TrendingDown className="w-4 h-4 text-red-500" />
            default:
                return <Minus className="w-4 h-4 text-gray-400" />
        }
    }

    const getTrendColor = () => {
        if (!change) return ''
        switch (change.type) {
            case 'increase':
                return 'text-green-600'
            case 'decrease':
                return 'text-red-600'
            default:
                return 'text-gray-500'
        }
    }

    const Content = (
        <div
            className={cn(
                'bg-white rounded-xl p-3 border border-gray-200 shadow-sm transition-all h-full flex flex-col justify-between relative overflow-hidden',
                (href || onClick) && 'cursor-pointer hover:shadow-md hover:border-primary/50 group',
                active && 'ring-2 ring-primary border-primary bg-primary/5',
                className
            )}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <div className={cn('p-1.5 rounded-md flex-shrink-0', iconBg, active && 'bg-white')}>
                            <Icon className={cn('w-4 h-4', iconColor)} />
                        </div>
                    )}
                    <h3 className={cn("text-[10px] uppercase tracking-wider font-semibold text-gray-500", active && "text-primary")}>{title}</h3>
                </div>
                {change ? (
                    <div className={cn('flex items-center gap-0.5 text-[10px] font-medium', getTrendColor())}>
                        {getTrendIcon()}
                        <span>
                            {change.value > 100
                                ? '100%+'
                                : `${change.value}%`}
                        </span>
                    </div>
                ) : (href || onClick) && (
                    <ChevronRight className={cn("w-4 h-4 text-gray-300 group-hover:text-primary transition-colors", active && "text-primary")} />
                )}
            </div>

            <div className="flex items-end justify-between mt-auto">
                <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
                {description && (
                    <p className="text-[10px] text-gray-400 leading-tight ml-2 text-right">{description}</p>
                )}
            </div>
        </div>
    )

    if (href) {
        return <Link href={href} className="block h-full">{Content}</Link>
    }

    return Content
}
