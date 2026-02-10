'use client'

import { useState, useEffect } from 'react'
import { Upload, Save, Plus, X, User, GraduationCap, FileText, Award, Loader2, ExternalLink, CheckCircle, Download, Trash2, AlertTriangle, Camera, Users, MapPin, Edit2 } from 'lucide-react'
import api, { settingsApi } from '@/lib/api' // Import settingsApi
import { useAuth } from '@/lib/AuthContext'
import toast from 'react-hot-toast'

interface StudentProfile {
  _id?: string
  userId: string
  department?: string
  semester?: number | null
  phone?: string
  skills: string[]
  bio?: string
  cgpa?: number | null
  hoursRequired?: number
  resumeUrl?: string
  linkedIn?: string
  github?: string
  profilePicture?: string | null
  bannerImage?: string | null
}

export default function StudentProfile() {
  const { user, deleteAccount } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false) // Renamed from 'saving'
  const [uploading, setUploading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [resumeVersion, setResumeVersion] = useState(Date.now())

  const [resumeFile, setResumeFile] = useState<File | null>(null)

  // New state for image previews and files
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [maxFileSizeMB, setMaxFileSizeMB] = useState<number>(5) // Default to 5MB
  const [allowResumeUpload, setAllowResumeUpload] = useState<boolean>(true)


  const [profile, setProfile] = useState<StudentProfile>({
    userId: '',
    department: '',
    semester: null,
    phone: '',
    skills: [],
    bio: '',
    cgpa: null,
    hoursRequired: undefined,
    resumeUrl: undefined,
    linkedIn: '',
    github: '',
    profilePicture: null,
    bannerImage: null
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
    fetchSettings() // Fetch settings on mount
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getPublic()
      if (response.data.success) {
        if (response.data.data.maxFileSize) {
          setMaxFileSizeMB(response.data.data.maxFileSize)
        }
        if (response.data.data.allowResumeUpload !== undefined) {
          setAllowResumeUpload(response.data.data.allowResumeUpload)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings, using defaults', error)
    }
  }

  // Handle local preview URL for resume
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (resumeFile) {
      const url = URL.createObjectURL(resumeFile)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [resumeFile])

  // Handle local preview for profile picture
  useEffect(() => {
    if (profilePicFile) {
      const url = URL.createObjectURL(profilePicFile)
      setProfilePicPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setProfilePicPreview(null)
    }
  }, [profilePicFile])

  // Handle local preview for banner
  useEffect(() => {
    if (bannerFile) {
      const url = URL.createObjectURL(bannerFile)
      setBannerPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setBannerPreview(null)
    }
  }, [bannerFile])

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
          semester: data.semester || null,
          phone: data.phone || '',
          skills: data.skills || [],
          bio: data.bio || '',
          cgpa: data.cgpa || null,
          hoursRequired: data.hoursRequired,
          resumeUrl: data.resumeUrl,
          linkedIn: data.linkedIn || '',
          github: data.github || '',
          profilePicture: data.profilePicture || null,
          bannerImage: data.bannerImage || null
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

  const handleFileSelect = (file: File, type: 'profilePicture' | 'bannerImage') => {
    if (type === 'profilePicture') {
      setProfilePicFile(file)
    } else {
      setBannerFile(file)
    }
  };

  const handleSubmit = async () => { // Renamed from handleSave to handleSubmit to match the new UI snippet
    try {
      setIsSaving(true) // Renamed from setSaving
      setError(null)
      setSuccessMessage(null)

      // DEFERRED UPLOAD LOGIC:
      // 1. Files are stored in local state (profilePicFile, bannerFile, resumeFile)
      // 2. Previews are shown using URL.createObjectURL
      // 3. Actual upload to R2 happens here, sequentially
      // 4. Returned URLs are then used to update the profile document

      const { userId, _id, ...profileData } = profile

      // Filter out undefined and null values to avoid Zod validation errors
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== null)
      )

      let updatedResumeUrl = profile.resumeUrl
      let updatedProfilePicUrl = profile.profilePicture
      let updatedBannerUrl = profile.bannerImage

      // Upload profile picture if selected
      if (profilePicFile) {
        try {
          const formData = new FormData()
          formData.append('file', profilePicFile)
          formData.append('type', 'profilePicture')
          const uploadResponse = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          if (uploadResponse.data.success) {
            updatedProfilePicUrl = uploadResponse.data.data.url
          }
        } catch (uploadErr) {
          console.error('Failed to upload profile picture:', uploadErr)
          throw new Error('Failed to upload profile picture')
        }
      }

      // Upload banner if selected
      if (bannerFile) {
        try {
          const formData = new FormData()
          formData.append('file', bannerFile)
          formData.append('type', 'bannerImage')
          const uploadResponse = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          if (uploadResponse.data.success) {
            updatedBannerUrl = uploadResponse.data.data.url
          }
        } catch (uploadErr) {
          console.error('Failed to upload banner:', uploadErr)
          throw new Error('Failed to upload banner')
        }
      }

      // Upload resume if a new file is selected
      if (resumeFile) {
        try {
          const formData = new FormData()
          formData.append('file', resumeFile)
          formData.append('type', 'resume')

          const uploadResponse = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })

          if (uploadResponse.data.success) {
            updatedResumeUrl = uploadResponse.data.data.url
          }
        } catch (uploadErr: any) {
          // GRACEFUL HANDLING: Don't crash, just report error
          const msg = uploadErr?.response?.data?.message || 'Failed to upload resume';

          if (msg.includes('disabled')) {
            setError(msg);
            setIsSaving(false);
            return; // Stop saving, but don't throw
          }

          // For other errors, we can throw to let the outer catcher handle it, 
          // or handle here similarly.
          throw new Error(msg);
        }
      }

      const requestData = {
        ...cleanProfileData,
        ...cleanProfileData,
        resumeUrl: updatedResumeUrl,
        profilePicture: updatedProfilePicUrl,
        bannerImage: updatedBannerUrl,
        skills
      }

      console.log('Sending profile data:', requestData)

      const response = await api.post('/students/profile', requestData)

      if (response.data.success) {
        setIsEditing(false)
        setResumeFile(null) // Clear pending file
        setProfilePicFile(null)
        setBannerFile(null)
        setProfile({
          ...profile,
          resumeUrl: updatedResumeUrl,
          profilePicture: updatedProfilePicUrl,
          bannerImage: updatedBannerUrl
        }) // Update local profile state with new URL
        setResumeVersion(Date.now()) // Update version to bust cache
        setSuccessMessage('Profile saved successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: any) {
      console.error('Failed to save profile:', err)
      console.error('Error response:', err?.response?.data)

      let errorMessage = err?.response?.data?.message || 'Failed to save profile'

      // Handle Zod validation errors
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const validationErrors = err.response.data.errors
          .map((e: any) => `${e.path.join('.')} : ${e.message}`)
          .join(', ')
        errorMessage = `Validation error: ${validationErrors}`
      }

      setError(errorMessage)
    } finally {
      setIsSaving(false) // Renamed from setSaving
    }
  }

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    // Validate file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, Word document, or Image')
      return
    }
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxFileSizeMB}MB`)
      return
    }

    setResumeFile(file)
    setError(null)
  }

  const completionPercentage = () => {
    let completed = 0
    const total = 9

    if (user?.name) completed++
    if (user?.email) completed++
    if (profile.department) completed++
    if (profile.semester) completed++
    if (profile.cgpa) completed++
    if (profile.bio) completed++
    if (skills.length > 0) completed++
    if (profile.resumeUrl) completed++
    if (profile.phone) completed++

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

  const isValidUrl = (url?: string) => {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    const url = previewUrl || profile.resumeUrl
    if (!url) return

    // For local files, strict download
    if (previewUrl) {
      const link = document.createElement('a')
      link.href = url
      link.download = resumeFile?.name || 'resume.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // For remote files, use backend proxy to enforce download headers
    try {
      const response = await api.get('/upload/proxy-download', {
        params: { url: profile.resumeUrl },
        responseType: 'blob'
      })

      // Extract filename from header if available
      let filename = 'resume.pdf'
      const disposition = response.headers['content-disposition']
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename="?([^"]+)"?/.exec(disposition)
        if (matches != null && matches[1]) {
          filename = matches[1]
        }
      } else {
        filename = `resume_${user?.name?.replace(/\s+/g, '_') || 'student'}.pdf`
      }

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download failed:', err)
      setError('Failed to download resume. Please try again.')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    try {
      setIsDeleting(true);
      await deleteAccount();
      // Redirect handled in AuthContext
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4">
      {/* Header with Banner & Profile Picture */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative group">
        {/* Banner Area */}
        <div className="h-32 sm:h-48 bg-gray-100 relative">
          {profile.bannerImage || bannerPreview ? (
            <img
              src={bannerPreview || (profile.bannerImage ? `${profile.bannerImage}?t=${resumeVersion}` : '')}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20" />
          )}

          {/* Banner Upload Button */}
          {isEditing && (
            <div className="absolute top-4 right-4">
              <input
                type="file"
                id="banner-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'bannerImage');
                }}
              />
              <label
                htmlFor="banner-upload"
                className="flex items-center justify-center p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white cursor-pointer transition-all shadow-sm"
              >
                {/* Camera icon always visible, no loading spinner needed here since it's instant preview */}
                <Camera size={18} />
              </label>
            </div>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-12 sm:-mt-16">

            {/* Profile Picture */}
            <div className="relative group/pfp shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative">
                {profile.profilePicture || profilePicPreview ? (
                  <img
                    src={profilePicPreview || (profile.profilePicture ? `${profile.profilePicture}?t=${resumeVersion}` : '')}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                    <Users size={40} />
                  </div>
                )}

                {/* PFP Upload Overlay */}
                {isEditing && (
                  <label
                    htmlFor="pfp-upload"
                    className="absolute inset-0 bg-black/30 hover:bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover/pfp:opacity-100 transition-opacity"
                  >
                    {/* Camera icon always visible, no loading spinner needed here since it's instant preview */}
                    <Camera size={24} className="text-white" />
                  </label>
                )}
                <input
                  type="file"
                  id="pfp-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'profilePicture');
                  }}
                />
              </div>
            </div>

            {/* Name and Info */}
            <div className="flex-1 pt-2 sm:pt-0">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">{user?.name}</h1>
              <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1">
                {profile.department && <span className="flex items-center gap-1"><FileText size={14} /> {profile.department}</span>}
                {/* {profile.location && <span className="flex items-center gap-1"><MapPin size={14}/> {profile.location}</span>} */}
              </div>
            </div>

            {/* Edit/Save Actions (Moved inside for cleaner layout) */}
            <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 sm:flex-none px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 transition-all text-sm"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto px-6 py-2 bg-black text-white hover:bg-gray-800 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-black/5 transition-all text-sm"
                >
                  <Edit2 size={16} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Phone Number</label>
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
              value={profile.semester || ''}
              onChange={(e) => setProfile({ ...profile, semester: parseInt(e.target.value) || null })}
              disabled={!isEditing}
              className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            >
              <option value="">Select</option>
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
              onChange={(e) => setProfile({ ...profile, cgpa: parseFloat(e.target.value) || null })}
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
          className="w-full px-3 py-2 !text-xs sm:!text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 resize-none"
        />
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Award className="text-primary" size={18} />
          Skills
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill) => (
            <span
              key={skill}
              className="group flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl text-xs sm:text-xs font-bold border border-indigo-100/50 shadow-sm transition-all hover:bg-indigo-100 hover:shadow-md"
            >
              {skill}
              {isEditing && (
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-indigo-400 hover:text-rose-500 transition-colors"
                  aria-label={`Remove ${skill}`}
                >
                  <X size={14} className="sm:w-3 sm:h-3" strokeWidth={3} />
                </button>
              )}
            </span>
          ))}
          {skills.length === 0 && (
            <div className="w-full py-4 text-center border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-gray-400 text-xs font-medium">No skills added yet</p>
            </div>
          )}
        </div>
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="Type a skill (e.g. React)"
                className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                < Award size={16} />
              </div>
            </div>
            <button
              onClick={handleAddSkill}
              className="bg-primary text-white px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-sm font-black shadow-lg shadow-primary/10 active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              Add Skill
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
        {(isValidUrl(profile.resumeUrl) || resumeFile) ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-green-600 flex-shrink-0" size={16} />
              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[180px] sm:max-w-none">
                {resumeFile ? resumeFile.name : getResumeFileName(profile.resumeUrl)}
              </span>
              {resumeFile && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                  Pending Save
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <a
                href={previewUrl || (profile.resumeUrl ? `${profile.resumeUrl}?t=${resumeVersion}` : '#')}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 flex items-center justify-center gap-1 text-primary text-xs px-2 py-1.5 border border-primary/30 rounded-lg hover:bg-primary/5 ${(!previewUrl && !isValidUrl(profile.resumeUrl)) ? 'pointer-events-none opacity-50' : ''}`}
              >
                <ExternalLink size={12} />
                Preview
              </a>
              {!isEditing && (
                <button
                  onClick={handleDownload}
                  className={`flex-1 flex items-center justify-center gap-1 text-primary text-xs px-2 py-1.5 border border-primary/30 rounded-lg hover:bg-primary/5 ${(!previewUrl && !isValidUrl(profile.resumeUrl)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!previewUrl && !isValidUrl(profile.resumeUrl)}
                >
                  <Download size={12} />
                  Download
                </button>
              )}
              {isEditing && (
                <label className="flex-1 bg-primary text-white px-2 py-1.5 rounded-lg hover:bg-primary/90 cursor-pointer text-xs flex items-center justify-center gap-1">
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : 'Change'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600 mb-2 text-xs sm:text-sm">Upload resume (PDF, DOC/X, Image - max 5MB)</p>
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
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={uploading}
                />
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

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-3 sm:p-4 mt-6">
        <h2 className="text-base sm:text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={18} />
          Danger Zone
        </h2>
        <p className="text-sm text-red-600 mb-3">
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete your account and remove all your data including:
            </p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
              <li>Your profile information</li>
              <li>All your applications</li>
              <li>Your messages</li>
              <li>Your notifications</li>
            </ul>
            <p className="text-sm text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
