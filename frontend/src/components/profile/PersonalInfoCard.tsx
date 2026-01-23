import React, { memo } from 'react'
import { User } from '@/types'
import { ProfileSection } from './ProfileSection'
import { User as UserIcon } from 'lucide-react'

interface PersonalInfoCardProps {
    user: User | null
}

export const PersonalInfoCard = memo(({ user }: PersonalInfoCardProps) => {
    return (
        <ProfileSection title="Personal Information" icon={UserIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <div className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium">
                        {user?.name || '—'}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wider">Email</label>
                    <div className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium">
                        {user?.email || '—'}
                    </div>
                </div>
            </div>
        </ProfileSection>
    )
})
