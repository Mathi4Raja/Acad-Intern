import React, { memo } from 'react'
import { Globe, Linkedin, Github } from 'lucide-react'
import { StudentProfile } from '@/types'
import { ProfileSection } from './ProfileSection'

interface SocialLinksCardProps {
    profile: StudentProfile
    isEditing: boolean
    onChange: (updates: Partial<StudentProfile>) => void
}

export const SocialLinksCard = memo(({ profile, isEditing, onChange }: SocialLinksCardProps) => {
    return (
        <ProfileSection title="Social Links" icon={Globe}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Linkedin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="url"
                        value={profile.linkedIn || ''}
                        onChange={(e) => onChange({ linkedIn: e.target.value })}
                        disabled={!isEditing}
                        placeholder="LinkedIn Profile URL"
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Github className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="url"
                        value={profile.github || ''}
                        onChange={(e) => onChange({ github: e.target.value })}
                        disabled={!isEditing}
                        placeholder="GitHub Profile URL"
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    />
                </div>
            </div>
        </ProfileSection>
    )
})
