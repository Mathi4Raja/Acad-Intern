import React, { memo } from 'react'

interface CompletionWidgetProps {
    percentage: number
}

export const CompletionWidget = memo(({ percentage }: CompletionWidgetProps) => {
    return (
        <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-xl p-3 sm:p-5 mb-3 sm:mb-5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Profile Completion</h3>
                <span className="text-xl sm:text-2xl font-bold text-primary">{percentage}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 sm:h-3">
                <div
                    className="bg-primary h-2 sm:h-3 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">
                {percentage === 100
                    ? 'Your profile is complete! 🎉'
                    : 'Complete your profile to increase visibility to companies'}
            </p>
        </div>
    )
})
