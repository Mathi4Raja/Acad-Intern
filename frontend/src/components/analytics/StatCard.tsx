'use client'

import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
}

export function StatCard({
    title,
    value,
    change,
    icon: Icon,
    iconColor = 'text-primary',
    iconBg = 'bg-primary/10',
    description,
    className
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

    return (
        <div className={cn('bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow', className)}>
            <div className="flex items-start justify-between mb-1">
                {Icon && (
                    <div className={cn('p-1.5 rounded-md', iconBg)}>
                        <Icon className={cn('w-3 h-3', iconColor)} />
                    </div>
                )}
                {change && (
                    <div className={cn('flex items-center gap-0.5 text-[10px] font-medium', getTrendColor())}>
                        {getTrendIcon()}
                        <span>
                            {change.value > 100
                                ? '100%+'
                                : `${change.value}%`}
                        </span>
                    </div>
                )}
            </div>
            <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{title}</p>
                <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                {description && (
                    <p className="text-[10px] text-gray-400 leading-tight">{description}</p>
                )}
            </div>
        </div>
    )
}
