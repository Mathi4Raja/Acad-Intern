'use client'

import { cn } from '@/lib/utils'

interface LineChartProps {
    data: {
        label: string
        value: number
    }[]
    title?: string
    color?: string
    height?: number
    className?: string
}

export function LineChart({ data, title, color = 'stroke-primary', height = 200, className }: LineChartProps) {
    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = Math.min(...data.map(d => d.value))
    const range = maxValue - minValue || 1

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((d.value - minValue) / range) * 80 - 10
        return { x, y, ...d }
    })

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = `${pathD} L 100 100 L 0 100 Z`

    return (
        <div className={cn('bg-white rounded-xl p-5 border border-gray-100 shadow-sm', className)}>
            {title && (
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
            )}
            <div style={{ height }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map(y => (
                        <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="100"
                            y2={y}
                            stroke="#E5E7EB"
                            strokeWidth="0.3"
                        />
                    ))}

                    {/* Area fill */}
                    <path
                        d={areaD}
                        className="fill-primary/10"
                    />

                    {/* Line */}
                    <path
                        d={pathD}
                        fill="none"
                        className={cn('stroke-2', color)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="1.5"
                            className="fill-primary"
                        />
                    ))}
                </svg>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                {data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)).map((d, i) => (
                    <span key={i}>{d.label}</span>
                ))}
            </div>
        </div>
    )
}
