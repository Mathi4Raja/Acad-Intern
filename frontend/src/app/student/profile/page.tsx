'use client'

import { useState, useEffect } from 'react'
import { Upload, Save, Plus, X, User, GraduationCap, FileText, Award, Loader2, ExternalLink, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { PageHeader } from '@/components/common'

interface StudentProfile {
  _id?: string
  userId: string
  department?: string
  semester?: number
  skills: string[]
  bio?: string
  cgpa?: number
  hoursRequired?: number
  resumeUrl?: string
  linkedIn?: string
  github?: string
}

export default function StudentProfile() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  const [profile, setProfile] = useState<StudentProfile>({
    userId: '',
    department: '',
    semester: 1,
    skills: [],
    bio: '',
    cgpa: undefined,
    hoursRequired: undefined,
    resumeUrl: undefined,
    linkedIn: '',
    github: ''
  })

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Business Administration',
    'Data Science',
    'Artificial Intelligence'
  ]

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/students/profile/me')

      if (response.data.success && response.data.data) {
        const data = response.data.data
        setProfile({
          _id: data._id,
          userId: data.userId,
          department: data.department || '',
          semester: data.semester || 1,
          skills: data.skills || [],
          bio: data.bio || '',
          cgpa: data.cgpa,
          hoursRequired: data.hoursRequired,
          resumeUrl: data.resumeUrl,
          linkedIn: data.linkedIn || '',
          github: data.github || ''
        })
        setSkills(data.skills || [])
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err)
      if (err?.response?.status !== 404) {
        setError('Failed to load profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const { userId, _id, ...profileData } = profile

      // Filter out undefined values to avoid Zod validation errors
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined)
      )

      const requestData = {
        ...cleanProfileData,
        skills
      }

      console.log('Sending profile data:', requestData)

      const response = await api.post('/students/profile', requestData)

      if (response.data.success) {
        setIsEditing(false)
        setSuccessMessage('Profile saved successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: any) {
      console.error('Failed to save profile:', err)
      console.error('Error response:', err?.response?.data)
      setError(err?.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'resume')

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setProfile({ ...profile, resumeUrl: response.data.data.url })
        setSuccessMessage('Resume uploaded successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: any) {
      console.error('Failed to upload resume:', err)
      setError(err?.response?.data?.message || 'Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const completionPercentage = () => {
    let completed = 0
    const total = 8

    if (user?.name) completed++
    if (user?.email) completed++
    if (profile.department) completed++
    if (profile.semester) completed++
    if (profile.cgpa) completed++
    if (profile.bio) completed++
    if (skills.length > 0) completed++
    if (profile.resumeUrl) completed++

    return Math.round((completed / total) * 100)
  }

  const getResumeFileName = (url?: string) => {
    if (!url) return 'resume.pdf'
    try {
      const fileName = url.split('/').pop() || 'resume.pdf'
      // Truncate long filenames to prevent layout issues
      if (fileName.length > 25) {
        const ext = fileName.split('.').pop() || 'pdf'
        const name = fileName.substring(0, 20)
        return `${name}...${ext}`
      }
      return fileName
    } catch {
      return 'resume.pdf'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Header */}
      {/* Header */}
      <PageHeader
        title="My Profile"
        subtitle="Manage your profile information and preferences"
      >
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save
            </button>
          </div>
        )}
      </PageHeader>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Profile Completion Card */}
      <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-xl p-3 sm:p-4 mb-2 sm:mb-3 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Profile Completion</h3>
          <span className="text-xl sm:text-2xl font-bold text-primary">{completionPercentage()}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-2 sm:h-3">
          <div
            className="bg-primary h-2 sm:h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage()}%` }}
          ></div>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">
          {completionPercentage() === 100
            ? 'Your profile is complete! 🎉'
            : 'Complete your profile to increase visibility to companies'}
        </p>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 ml-1 flex items-center gap-2">
          <User className="text-primary" size={18} />
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Full Name</label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 ml-1 flex items-center gap-2">
          <GraduationCap className="text-primary" size={18} />
          Academic Information
        </h2>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
            <select
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              disabled={!isEditing}
              className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            >
              <option value="">Select</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Semester</label>
            <select
              value={profile.semester}
              onChange={(e) => setProfile({ ...profile, semester: parseInt(e.target.value) })}
              disabled={!isEditing}
              className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Sem {sem}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">CGPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={profile.cgpa || ''}
              onChange={(e) => setProfile({ ...profile, cgpa: parseFloat(e.target.value) || undefined })}
              disabled={!isEditing}
              placeholder="8.5"
              className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hours Required</label>
            <input
              type="number"
              value={profile.hoursRequired || ''}
              onChange={(e) => setProfile({ ...profile, hoursRequired: parseInt(e.target.value) || undefined })}
              disabled={!isEditing}
              placeholder="120"
              className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="text-primary" size={18} />
          About Me
        </h2>
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          disabled={!isEditing}
          rows={3}
          placeholder="Tell companies about yourself..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 resize-none"
        />
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Award className="text-primary" size={18} />
          Skills
        </h2>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 sm:py-1 rounded text-xs font-medium"
            >
              {skill}
              {isEditing && (
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-primary hover:text-primary/70"
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
          {skills.length === 0 && (
            <p className="text-gray-500 text-xs">No skills added yet</p>
          )}
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="Add skill"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handleAddSkill}
              className="bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1 text-sm"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        )}
      </div>

      {/* Resume Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="text-primary" size={18} />
          Resume
        </h2>
        {profile.resumeUrl ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-green-600 flex-shrink-0" size={16} />
              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[180px] sm:max-w-none">
                {getResumeFileName(profile.resumeUrl)}
              </span>
            </div>
            <div className="flex gap-2">
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 text-primary text-xs px-2 py-1.5 border border-primary/30 rounded-lg hover:bg-primary/5"
              >
                <ExternalLink size={12} />
                View Resume
              </a>
              {isEditing && (
                <label className="flex-1 bg-primary text-white px-2 py-1.5 rounded-lg hover:bg-primary/90 cursor-pointer text-xs flex items-center justify-center gap-1">
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : 'Replace'}
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600 mb-2 text-xs sm:text-sm">Upload resume (PDF, max 2MB)</p>
            {isEditing && (
              <label className={`inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg cursor-pointer text-xs sm:text-sm ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Choose File'
                )}
                <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Social Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn</label>
            <input
              type="url"
              value={profile.linkedIn}
              onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })}
              disabled={!isEditing}
              placeholder="linkedin.com/in/..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">GitHub</label>
            <input
              type="url"
              value={profile.github}
              onChange={(e) => setProfile({ ...profile, github: e.target.value })}
              disabled={!isEditing}
              placeholder="github.com/..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
