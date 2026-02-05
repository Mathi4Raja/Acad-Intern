'use client'

import { cn } from '@/lib/utils'

interface BarChartProps {
    data: {
        label: string
        value: number
        color?: string
    }[]
    title?: string
    maxValue?: number
    showValues?: boolean
    className?: string
}

export function BarChart({ data, title, maxValue, showValues = true, className }: BarChartProps) {
    const max = maxValue || Math.max(...data.map(d => d.value))

    // Static color map to ensure Tailwind JIT picks up these classes
    const CHART_COLORS = [
        'bg-blue-500',
        'bg-purple-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-indigo-500',
        'bg-pink-500',
        'bg-cyan-500'
    ]

    return (
        <div className={cn('bg-white rounded-xl p-5 border border-gray-100 shadow-sm', className)}>
            {title && (
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
            )}
            <div className="space-y-3">
                {data.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">{item.label}</span>
                            {showValues && (
                                <span className="text-gray-900 font-semibold">{item.value}</span>
                            )}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                                className={cn(
                                    'h-2.5 rounded-full transition-all duration-500',
                                    // Use frontend mapping if available, fallback to backend or primary
                                    CHART_COLORS[index % CHART_COLORS.length] || item.color || 'bg-primary'
                                )}
                                style={{ width: `${(item.value / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
