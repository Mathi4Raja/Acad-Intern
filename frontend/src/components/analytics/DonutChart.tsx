'use client'

import { cn } from '@/lib/utils'

interface DonutChartProps {
    data: {
        label: string
        value: number
        color?: string
    }[]
    title?: string
    className?: string
}

const CHART_COLORS = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#22c55e', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#6366f1', // indigo
]

export function DonutChart({ data, title, className }: DonutChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0)

    // Calculate stroke-dasharray for each segment
    const radius = 40
    const circumference = 2 * Math.PI * radius

    let cumulativePercent = 0
    const segments = data.map((item, index) => {
        const percent = total > 0 ? (item.value / total) * 100 : 0
        const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`
        const rotation = (cumulativePercent / 100) * 360 - 90
        cumulativePercent += percent

        return {
            ...item,
            percent,
            strokeDasharray,
            rotation,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }
    })

    return (
        <div className={cn('bg-white rounded-xl p-5 border border-gray-100 shadow-sm', className)}>
            {title && (
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
            )}

            <div className="flex items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="12"
                        />
                        {/* Data segments */}
                        {segments.map((segment, index) => (
                            <circle
                                key={index}
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth="12"
                                strokeDasharray={segment.strokeDasharray}
                                strokeLinecap="round"
                                style={{
                                    transform: `rotate(${segment.rotation + 90}deg)`,
                                    transformOrigin: '50% 50%',
                                    transition: 'all 0.5s ease-out'
                                }}
                            />
                        ))}
                    </svg>
                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{total}</span>
                        <span className="text-xs text-gray-500">views</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2 overflow-hidden">
                    {segments.slice(0, 5).map((segment, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: segment.color }}
                                />
                                <span className="text-gray-600 truncate">{segment.label}</span>
                            </div>
                            <span className="text-gray-900 font-semibold flex-shrink-0">{segment.value}</span>
                        </div>
                    ))}
                    {segments.length > 5 && (
                        <p className="text-xs text-gray-400 pl-4">+{segments.length - 5} more</p>
                    )}
                </div>
            </div>
        </div>
    )
}
