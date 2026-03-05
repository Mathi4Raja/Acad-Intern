import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'
import { StudentProfile } from '@/types'
import { Select } from '@/components/ui/Select'
import { ProfileSection } from './ProfileSection'

interface AcademicCardProps {
    profile: StudentProfile
    isEditing: boolean
    onChange: (updates: Partial<StudentProfile>) => void
}

const DEPARTMENTS = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Data Science',
    'Artificial Intelligence'
]

export const AcademicCard = memo(({ profile, isEditing, onChange }: AcademicCardProps) => {
    return (
        <ProfileSection title="Academic Information" icon={GraduationCap}>
            <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Department</label>
                    <Select
                        value={profile.department || ''}
                        onChange={(val) => onChange({ department: val })}
                        options={[
                            { value: '', label: 'Select Department' },
                            ...DEPARTMENTS.map(dept => ({ value: dept, label: dept }))
                        ]}
                        className={cn(!isEditing && "opacity-50 pointer-events-none bg-gray-50")}
                        isFullWidth
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Semester</label>
                    <Select
                        value={profile.semester?.toString() || ''}
                        onChange={(val) => onChange({ semester: parseInt(val) || undefined })}
                        options={[
                            { value: '', label: 'Select Semester' },
                            ...[1, 2, 3, 4, 5, 6, 7, 8].map(sem => ({ value: sem.toString(), label: `Semester ${sem}` }))
                        ]}
                        className={cn(!isEditing && "opacity-50 pointer-events-none bg-gray-50")}
                        isFullWidth
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">CGPA</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={profile.cgpa || ''}
                        onChange={(e) => onChange({ cgpa: parseFloat(e.target.value) || undefined })}
                        disabled={!isEditing}
                        placeholder="e.g. 8.5"
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Hours Required</label>
                    <input
                        type="number"
                        min="0"
                        value={profile.hoursRequired || ''}
                        onChange={(e) => onChange({ hoursRequired: parseInt(e.target.value) || undefined })}
                        disabled={!isEditing}
                        placeholder="e.g. 120"
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    />
                </div>
            </div>
        </ProfileSection>
    )
})
