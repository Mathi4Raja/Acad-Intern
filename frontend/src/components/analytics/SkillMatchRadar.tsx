'use client'

import { cn } from '@/lib/utils'

interface SkillMatchRadarProps {
    skills: {
        name: string
        studentLevel: number // 0-100
        requiredLevel: number // 0-100
    }[]
    title?: string
    className?: string
}

export function SkillMatchRadar({ skills, title, className }: SkillMatchRadarProps) {
    const size = 280
    const center = size / 2
    const maxRadius = 70
    const labelOffset = 40

    const getPoint = (index: number, value: number) => {
        const angle = (Math.PI * 2 * index) / skills.length - Math.PI / 2
        const radius = (value / 100) * maxRadius
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle)
        }
    }

    const getLabelPoint = (index: number) => {
        const angle = (Math.PI * 2 * index) / skills.length - Math.PI / 2
        const radius = maxRadius + labelOffset
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle)
        }
    }

    const studentPoints = skills.map((_, i) => getPoint(i, skills[i].studentLevel))
    const requiredPoints = skills.map((_, i) => getPoint(i, skills[i].requiredLevel))

    const studentPath = studentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
    const requiredPath = requiredPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

    return (
        <div className={cn('bg-white rounded-xl p-5 border border-gray-100 shadow-sm', className)}>
            {title && (
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
            )}

            <div className="flex justify-center overflow-visible">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                    {/* Grid circles */}
                    {[25, 50, 75, 100].map(level => (
                        <circle
                            key={level}
                            cx={center}
                            cy={center}
                            r={(level / 100) * maxRadius}
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Grid lines */}
                    {skills.map((_, i) => {
                        const point = getPoint(i, 100)
                        return (
                            <line
                                key={i}
                                x1={center}
                                y1={center}
                                x2={point.x}
                                y2={point.y}
                                stroke="#E5E7EB"
                                strokeWidth="1"
                            />
                        )
                    })}

                    {/* Required level (background) */}
                    <path
                        d={requiredPath}
                        fill="rgba(168, 85, 247, 0.1)"
                        stroke="#A855F7"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                    />

                    {/* Student level (foreground) */}
                    <path
                        d={studentPath}
                        fill="rgba(59, 130, 246, 0.2)"
                        stroke="#3B82F6"
                        strokeWidth="2"
                    />

                    {/* Data points */}
                    {studentPoints.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill="#3B82F6"
                        />
                    ))}

                    {/* Skill labels */}
                    {skills.map((skill, i) => {
                        const labelPoint = getLabelPoint(i)
                        return (
                            <text
                                key={i}
                                x={labelPoint.x}
                                y={labelPoint.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-xs fill-gray-600 font-medium"
                            >
                                {skill.name}
                            </text>
                        )
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-gray-600">Your Skills</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500 opacity-50" />
                    <span className="text-gray-600">Required</span>
                </div>
            </div>
        </div>
    )
}
