'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AreaChartProps {
    data: {
        label: string
        value: number
    }[]
    title?: string
    height?: number
    className?: string
}

export function AreaChart({ data, title, height = 160, className }: AreaChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    if (data.length === 0) return null

    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = 0 // Start from 0 for better context
    const range = maxValue - minValue || 1
    const total = data.reduce((sum, d) => sum + d.value, 0)

    // Chart dimensions - compact
    const chartWidth = 400
    const chartHeight = 160
    const padding = { top: 25, bottom: 30, left: 40, right: 15 }
    const innerWidth = chartWidth - padding.left - padding.right
    const innerHeight = chartHeight - padding.top - padding.bottom

    // Calculate points
    const points = data.map((d, i) => {
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth
        const y = padding.top + innerHeight - ((d.value - minValue) / range) * innerHeight
        return { x, y, ...d }
    })

    // Create smooth bezier curve
    const createSmoothPath = (pts: typeof points) => {
        if (pts.length < 2) return `M ${pts[0].x} ${pts[0].y}`

        let path = `M ${pts[0].x} ${pts[0].y}`

        for (let i = 0; i < pts.length - 1; i++) {
            const current = pts[i]
            const next = pts[i + 1]
            const tension = 0.3
            const cpx1 = current.x + (next.x - current.x) * tension
            const cpx2 = next.x - (next.x - current.x) * tension
            path += ` C ${cpx1} ${current.y}, ${cpx2} ${next.y}, ${next.x} ${next.y}`
        }

        return path
    }

    const linePath = createSmoothPath(points)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`

    // Y-axis ticks
    const yTicks = [0, Math.round(maxValue / 2), maxValue]

    return (
        <div className={cn('bg-white rounded-xl p-5 border border-gray-100 shadow-sm', className)}>
            {title && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-purple-700">{total}</span>
                        <span className="text-xs text-purple-600">total</span>
                    </div>
                </div>
            )}

            <div style={{ height }} className="relative">
                <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full"
                    onMouseLeave={() => setActiveIndex(null)}
                >
                    <defs>
                        {/* Gradient for area fill */}
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                        </linearGradient>

                        {/* Gradient for line */}
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                    </defs>

                    {/* Y-axis labels */}
                    {yTicks.map((tick, i) => {
                        const y = padding.top + innerHeight - (tick / maxValue) * innerHeight
                        return (
                            <g key={i}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={chartWidth - padding.right}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                    strokeDasharray={i === 0 ? "0" : "4,4"}
                                />
                                <text
                                    x={padding.left - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    className="fill-gray-400"
                                    style={{ fontSize: '11px' }}
                                >
                                    {tick}
                                </text>
                            </g>
                        )
                    })}

                    {/* Area fill */}
                    <path
                        d={areaPath}
                        fill="url(#areaGradient)"
                        className="transition-opacity duration-200"
                    />

                    {/* Line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Interactive areas and points */}
                    {points.map((p, i) => {
                        const isActive = activeIndex === i
                        const barWidth = innerWidth / data.length

                        return (
                            <g key={i}>
                                {/* Invisible hover area */}
                                <rect
                                    x={p.x - barWidth / 2}
                                    y={padding.top}
                                    width={barWidth}
                                    height={innerHeight}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setActiveIndex(i)}
                                />

                                {/* Vertical indicator line */}
                                {isActive && (
                                    <line
                                        x1={p.x}
                                        y1={padding.top}
                                        x2={p.x}
                                        y2={padding.top + innerHeight}
                                        stroke="#8b5cf6"
                                        strokeWidth="1"
                                        strokeDasharray="4,4"
                                        opacity="0.5"
                                    />
                                )}

                                {/* Data point */}
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isActive ? 8 : 5}
                                    fill="white"
                                    stroke="#8b5cf6"
                                    strokeWidth={isActive ? 3 : 2}
                                    className="transition-all duration-200 cursor-pointer"
                                />

                                {/* Tooltip */}
                                {isActive && (
                                    <g>
                                        <rect
                                            x={p.x - 35}
                                            y={p.y - 45}
                                            width="70"
                                            height="35"
                                            rx="6"
                                            fill="#1f2937"
                                        />
                                        <polygon
                                            points={`${p.x - 6},${p.y - 10} ${p.x + 6},${p.y - 10} ${p.x},${p.y - 4}`}
                                            fill="#1f2937"
                                        />
                                        <text
                                            x={p.x}
                                            y={p.y - 30}
                                            textAnchor="middle"
                                            className="fill-white font-bold"
                                            style={{ fontSize: '14px' }}
                                        >
                                            {p.value}
                                        </text>
                                        <text
                                            x={p.x}
                                            y={p.y - 17}
                                            textAnchor="middle"
                                            className="fill-gray-400"
                                            style={{ fontSize: '10px' }}
                                        >
                                            {p.label}
                                        </text>
                                    </g>
                                )}
                            </g>
                        )
                    })}

                    {/* X-axis labels */}
                    {points.map((p, i) => (
                        <text
                            key={i}
                            x={p.x}
                            y={chartHeight - 10}
                            textAnchor="middle"
                            className={cn(
                                "transition-colors",
                                activeIndex === i ? "fill-purple-600 font-semibold" : "fill-gray-500"
                            )}
                            style={{ fontSize: '12px' }}
                        >
                            {p.label}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    )
}
