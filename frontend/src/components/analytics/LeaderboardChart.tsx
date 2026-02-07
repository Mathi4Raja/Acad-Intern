'use client'

import { cn } from '@/lib/utils'
import { Eye, Trophy, Medal } from 'lucide-react'

interface LeaderboardChartProps {
    data: {
        label: string
        value: number
    }[]
    title?: string
    className?: string
    valueLabel?: string
}

export function LeaderboardChart({ data, title, className, valueLabel = 'views' }: LeaderboardChartProps) {
    const maxValue = Math.max(...data.map(d => d.value), 1)

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />
        if (index === 1) return <Medal className="w-4 h-4 text-gray-400" />
        if (index === 2) return <Medal className="w-4 h-4 text-amber-600" />
        return <span className="w-4 h-4 text-xs font-bold text-gray-400 flex items-center justify-center">{index + 1}</span>
    }

    const getGradient = (index: number) => {
        const gradients = [
            'from-yellow-400 to-orange-500',
            'from-gray-300 to-gray-400',
            'from-amber-500 to-amber-600',
            'from-blue-400 to-blue-500',
            'from-purple-400 to-purple-500',
        ]
        return gradients[index] || 'from-gray-300 to-gray-400'
    }

    return (
        <div className={cn('bg-white rounded-xl p-5 border border-gray-100 shadow-sm', className)}>
            {title && (
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                </div>
            )}

            <div className="space-y-3">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className={cn(
                            "relative flex items-center gap-3 p-2 rounded-lg transition-all",
                            index === 0 && "bg-yellow-50 border border-yellow-200",
                            index === 1 && "bg-gray-50 border border-gray-200",
                            index === 2 && "bg-amber-50 border border-amber-200",
                            index > 2 && "bg-gray-50/50"
                        )}
                    >
                        {/* Rank */}
                        <div className="flex-shrink-0 w-6 flex items-center justify-center">
                            {getRankIcon(index)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={cn(
                                    "text-sm font-medium truncate",
                                    index === 0 ? "text-yellow-800" : "text-gray-700"
                                )}>
                                    {item.label}
                                </span>
                                <span className={cn(
                                    "text-sm font-bold flex-shrink-0",
                                    index === 0 ? "text-yellow-700" : "text-gray-900"
                                )}>
                                    {item.value}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                                        getGradient(index)
                                    )}
                                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No data yet</p>
                )}
            </div>
        </div>
    )
}
