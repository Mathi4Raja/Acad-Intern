import React, { memo } from 'react'
import { FileText } from 'lucide-react'
import { StudentProfile } from '@/types'
import { ProfileSection } from './ProfileSection'

interface BioCardProps {
    profile: StudentProfile
    isEditing: boolean
    onChange: (updates: Partial<StudentProfile>) => void
}

export const BioCard = memo(({ profile, isEditing, onChange }: BioCardProps) => {
    return (
        <ProfileSection title="About Me" icon={FileText}>
            <div className="relative">
                <textarea
                    value={profile.bio || ''}
                    onChange={(e) => onChange({ bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell companies about your background, interests, and what you're looking for in an internship..."
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none transition-all placeholder:text-gray-400"
                />
                {isEditing && (
                    <div className="absolute right-3 bottom-3 text-xs text-gray-400 pointer-events-none">
                        {profile.bio?.length || 0} chars
                    </div>
                )}
            </div>
        </ProfileSection>
    )
})
