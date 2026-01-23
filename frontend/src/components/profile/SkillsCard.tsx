import React, { memo, useState } from 'react'
import { Award, Plus, X } from 'lucide-react'
import { StudentProfile } from '@/types'
import { ProfileSection } from './ProfileSection'

interface SkillsCardProps {
    profile: StudentProfile
    isEditing: boolean
    onChange: (updates: Partial<StudentProfile>) => void
}

export const SkillsCard = memo(({ profile, isEditing, onChange }: SkillsCardProps) => {
    const [newSkill, setNewSkill] = useState('')

    const handleAddSkill = () => {
        if (newSkill.trim()) {
            const skillToAdd = newSkill.trim()
            const currentSkills = profile.skills || []

            if (!currentSkills.includes(skillToAdd)) {
                onChange({ skills: [...currentSkills, skillToAdd] })
                setNewSkill('')
            }
        }
    }

    const handleRemoveSkill = (skillToRemove: string) => {
        const currentSkills = profile.skills || []
        onChange({ skills: currentSkills.filter(s => s !== skillToRemove) })
    }

    return (
        <ProfileSection title="Skills" icon={Award}>
            <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills?.map((skill) => (
                    <span
                        key={skill}
                        className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium border border-primary/20 transition-colors hover:bg-primary/20"
                    >
                        {skill}
                        {isEditing && (
                            <button
                                onClick={() => handleRemoveSkill(skill)}
                                className="text-primary/60 hover:text-primary p-0.5 rounded-full hover:bg-white/50 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </span>
                ))}
                {(!profile.skills || profile.skills.length === 0) && (
                    <p className="text-gray-500 text-sm italic">Add your skills to find matching internships.</p>
                )}
            </div>

            {isEditing && (
                <div className="flex gap-2 max-w-md">
                    <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        placeholder="e.g. React, Python, Data Analysis"
                        className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                        onClick={handleAddSkill}
                        disabled={!newSkill.trim()}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                </div>
            )}
        </ProfileSection>
    )
})
