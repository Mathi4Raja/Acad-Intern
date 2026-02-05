import React, { memo } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { Application } from '@/types'
import { CompanyLogo, StatusBadge } from '@/components/common'

interface RecentApplicationsWidgetProps {
    applications: Application[]
    formatDate: (date: string) => string
}

const RecentApplicationsWidget = memo(({ applications, formatDate }: RecentApplicationsWidgetProps) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Applications</h2>
                <Link
                    href="/student/applications"
                    className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                    View All <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </Link>
            </div>

            <div className="flex-1 overflow-hidden">
                {applications.length === 0 ? (
                    <div className="h-32 sm:h-40 flex flex-col items-center justify-center text-gray-500 text-sm p-4 text-center">
                        <p className="mb-2">No active applications.</p>
                        <Link href="/student/internships" className="text-primary hover:underline">
                            Start applying now
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {applications.slice(0, 5).map((app) => (
                            <Link
                                key={app.id}
                                href={`/student/applications?highlight=${app.id}`}
                                className="block p-3 sm:p-4 bg-white hover:bg-blue-50/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-primary"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <CompanyLogo name={app.company} size="sm" />
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                                                {app.internshipTitle}
                                            </h3>
                                            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{app.company}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <StatusBadge status={app.status} showIcon={false} />
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1 group-hover:text-gray-500 transition-colors">
                                            <Clock size={10} />
                                            {formatDate(app.appliedDate)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
})

RecentApplicationsWidget.displayName = 'RecentApplicationsWidget'

export default RecentApplicationsWidget
