'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { IndianRupee, Calendar, MapPin, Clock, Users, Briefcase, FileText, Plus, X, Loader2, Edit, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { useAlert } from '@/components/ui/AlertProvider'
import { INTERNSHIP_MODES } from '@/lib/constants'
import { Select } from '@/components/ui/Select'
import Link from 'next/link'

export default function EditInternship() {
    const router = useRouter()
    const params = useParams()
    const internshipId = params.id as string
    const { showAlert } = useAlert()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        responsibilities: '',
        stipend: '',
        duration: '',
        location: '',
        mode: 'remote',
        positions: '1',
        deadline: '',
        skills: [] as string[]
    })

    const [skillInput, setSkillInput] = useState('')

    const availableSkills = [
        'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
        'HTML', 'CSS', 'TypeScript', 'MongoDB', 'SQL', 'Git',
        'AWS', 'Docker', 'Machine Learning', 'Data Analysis'
    ]

    // Fetch existing internship data
    useEffect(() => {
        const fetchInternship = async () => {
            try {
                const response = await api.get(`/internships/${internshipId}`)
                if (response.data.success) {
                    const data = response.data.data
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        requirements: data.requirements || '',
                        responsibilities: data.responsibilities || '',
                        stipend: data.stipend?.toString() || '',
                        duration: data.durationWeeks?.toString() || '',
                        location: data.location || '',
                        mode: data.mode || 'remote',
                        positions: data.openings?.toString() || '1',
                        deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
                        skills: data.skillsRequired || []
                    })
                }
            } catch (error: any) {
                console.error('Failed to fetch internship:', error)
                showAlert('Failed to load internship details', 'error')
                router.push('/company/internships')
            } finally {
                setFetching(false)
            }
        }

        if (internshipId) {
            fetchInternship()
        }
    }, [internshipId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const addSkill = (skill: string) => {
        if (!formData.skills.includes(skill)) {
            setFormData({
                ...formData,
                skills: [...formData.skills, skill]
            })
        }
        setSkillInput('')
    }

    const removeSkill = (skillToRemove: string) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter(skill => skill !== skillToRemove)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                skillsRequired: formData.skills,
                durationWeeks: parseInt(formData.duration),
                stipend: parseInt(formData.stipend),
                mode: formData.mode,
                openings: parseInt(formData.positions),
                location: formData.location,
                deadline: formData.deadline,
                requirements: formData.requirements,
                responsibilities: formData.responsibilities
            }

            const response = await api.put(`/internships/${internshipId}`, payload)

            if (response.data.success) {
                showAlert('Internship updated successfully!', 'success')
                router.refresh()
                router.push('/company/internships')
            }
        } catch (error: any) {
            console.error('Failed to update internship:', error)
            const errorMsg = error.response?.data?.message || 'Failed to update internship'
            const validationErrors = error.response?.data?.errors
                ? '\n' + error.response.data.errors.map((e: any) => `• ${e.path}: ${e.message}`).join('\n')
                : ''

            showAlert(errorMsg + validationErrors, 'error')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="max-w-5xl mx-auto p-2 sm:p-3">
            {/* Header */}
            <div className="mb-6 flex flex-col items-center sm:flex-row justify-between gap-4">
                <div className="bg-gradient-to-br from-white to-amber-50/50 rounded-2xl shadow-sm border border-amber-100/50 p-3 sm:px-4 sm:py-3 w-full sm:w-auto overflow-hidden relative group">
                    <div className="relative z-10 flex items-center gap-3">
                        <Link
                            href="/company/internships"
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div className="p-2 bg-amber-500 rounded-lg text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Edit size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight tracking-tight">
                                Edit Internship
                            </h1>
                            <p className="text-xs text-gray-600 font-medium">
                                Update the internship details below
                            </p>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-100/50 rounded-full blur-2xl group-hover:bg-amber-100/80 transition-colors" />
                    <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-orange-100/50 rounded-full blur-2xl group-hover:bg-orange-100/80 transition-colors" />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
                {/* Basic Information */}
                <div className="mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <Briefcase size={18} />
                        Basic Information
                    </h2>

                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                Internship Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., Frontend Developer Intern"
                                className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Duration (months) *
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="number"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        placeholder="3"
                                        className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Stipend (₹/month) *
                                </label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="number"
                                        name="stipend"
                                        value={formData.stipend}
                                        onChange={handleInputChange}
                                        placeholder="15000"
                                        className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    No. of Positions *
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="number"
                                        name="positions"
                                        value={formData.positions}
                                        onChange={handleInputChange}
                                        placeholder="2"
                                        className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Location *
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Bangalore, Karnataka"
                                        className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Work Mode *
                                </label>
                                <Select
                                    value={formData.mode}
                                    onChange={(val) => setFormData({ ...formData, mode: val })}
                                    options={INTERNSHIP_MODES.map(mode => ({ value: mode.value, label: mode.label }))}
                                    className="w-full"
                                    isFullWidth
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                Application Deadline *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    name="deadline"
                                    value={formData.deadline}
                                    onChange={handleInputChange}
                                    min={today}
                                    className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description & Requirements */}
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                        <FileText size={20} />
                        Details
                    </h2>

                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                Description * <span className="text-gray-400 font-normal ml-1">(min. 20 characters)</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe the internship opportunity, company culture, and what makes this position exciting..."
                                rows={4}
                                className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                Responsibilities
                            </label>
                            <textarea
                                name="responsibilities"
                                value={formData.responsibilities}
                                onChange={handleInputChange}
                                placeholder="List the key responsibilities and day-to-day tasks..."
                                rows={4}
                                className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                Requirements
                            </label>
                            <textarea
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleInputChange}
                                placeholder="List the required qualifications, skills, and experience..."
                                rows={4}
                                className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Required Skills</h2>

                    <div className="mb-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                            Add Skills
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (skillInput.trim()) addSkill(skillInput.trim())
                                    }
                                }}
                                placeholder="Type a skill and press Enter"
                                className="flex-1 px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (skillInput.trim()) addSkill(skillInput.trim())
                                }}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">Quick add:</p>
                        <div className="flex flex-wrap gap-2">
                            {availableSkills.map((skill) => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => addSkill(skill)}
                                    disabled={formData.skills.includes(skill)}
                                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-colors ${formData.skills.includes(skill)
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-primary/20 hover:text-primary'
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    {formData.skills.length > 0 && (
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Selected Skills:</p>
                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary rounded-full text-xs sm:text-sm font-medium"
                                    >
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="hover:text-primary-900"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                    <Link
                        href="/company/internships"
                        className="w-full sm:w-auto px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm sm:text-base text-center"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="w-full sm:flex-1 px-6 py-2.5 sm:py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Edit size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
