'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface VerticalBarChartProps {
    data: {
        label: string
        value: number
        color?: string
    }[]
    title?: string
    height?: number
    className?: string
    showValues?: boolean
}

export function VerticalBarChart({ data, title, height = 200, className, showValues = true }: VerticalBarChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    if (data.length === 0) return null

    const maxValue = Math.max(...data.map(d => d.value)) || 1
    const total = data.reduce((sum, d) => sum + d.value, 0)

    return (
        <div className={cn('bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col', className)}>
            {title && (
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                        <span className="text-sm font-bold text-purple-700">{total}</span>
                        <span className="text-xs text-purple-600 font-medium">total</span>
                    </div>
                </div>
            )}

            <div style={{ height }} className="flex items-end justify-between gap-2 w-full mt-auto">
                {data.map((item, index) => {
                    const percentage = (item.value / maxValue) * 100
                    const isActive = activeIndex === index

                    return (
                        <div
                            key={index}
                            className="relative flex flex-col items-center group flex-1 h-full justify-end"
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            {/* Value tooltip on hover */}
                            <div
                                className={cn(
                                    "absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-2.5 rounded-lg shadow-xl opacity-0 transition-all duration-200 pointer-events-none z-10 whitespace-nowrap font-medium",
                                    isActive && "opacity-100 -top-10"
                                )}
                            >
                                {item.value} Applications
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>

                            {/* Bar with gradient */}
                            <div
                                className={cn(
                                    "w-full max-w-[40px] rounded-t-lg transition-all duration-300 relative overflow-hidden",
                                    isActive ? "opacity-100 scale-x-105" : "opacity-85"
                                )}
                                style={{
                                    height: `${percentage}%`,
                                    minHeight: '4px',
                                    background: item.color || `linear-gradient(180deg, #8b5cf6 0%, #a855f7 100%)`
                                }}
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                            </div>

                            {/* X-axis Label */}
                            <span
                                className={cn(
                                    "text-[10px] sm:text-xs text-center mt-3 font-medium transition-colors w-full truncate px-0.5",
                                    isActive ? "text-purple-700" : "text-gray-500"
                                )}
                            >
                                {item.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
