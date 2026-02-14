'use client'

import { useState, useEffect } from 'react'
import { Building, Mail, Phone, MapPin, Globe, Users, Edit, Save, X, Briefcase, Calendar, CheckCircle, Upload, AlertCircle, Shield, Loader2, Trash2, AlertTriangle, Camera } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { INDUSTRIES, COMPANY_SIZES } from '@/lib/constants'

interface CompanyProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  companyName: string;
  website?: string;
  description?: string;
  verified: boolean;
  cin?: string;
  logo?: string;
  banner?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  founded?: string;
  phone?: string;
  about?: string;
  benefits?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
}

interface McaDetails {
  cin: string;
  companyName: string;
  registrationDate?: string;
  status?: string;
  authorizedCapital?: string;
  paidUpCapital?: string;
  registeredOffice?: string;
  email?: string;
  source: 'primary' | 'fallback';
}

export default function CompanyProfilePage() {
  const { deleteAccount } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [mcaDetails, setMcaDetails] = useState<McaDetails | null>(null)
  const [showMcaDetails, setShowMcaDetails] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // File state for deferred upload with local preview
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    industry: '',
    companySize: '',
    founded: '',
    description: '',
    about: '',
    benefits: '',
    cin: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      instagram: ''
    }
  })

  // Fetch company profile on mount
  useEffect(() => {
    fetchProfile()
  }, [])

  // Handle local preview for logo
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile)
      setLogoPreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setLogoPreview(null)
    }
  }, [logoFile])

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
      setIsLoading(true)
      const response = await api.get('/companies/me')
      if (response.data.success && response.data.data) {
        const p = response.data.data
        setProfile(p)
        setFormData({
          name: p.userId?.name || '',
          companyName: p.companyName || '',
          email: p.userId?.email || '',
          phone: p.phone || '',
          website: p.website || '',
          location: p.location || '',
          industry: p.industry || '',
          companySize: p.companySize || '',
          founded: p.founded || '',
          description: p.description || '',
          about: p.about || '',
          benefits: p.benefits || '',
          cin: p.cin || '',
          socialLinks: {
            linkedin: p.socialLinks?.linkedin || '',
            twitter: p.socialLinks?.twitter || '',
            instagram: p.socialLinks?.instagram || ''
          }
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData({
      ...formData,
      socialLinks: {
        ...formData.socialLinks,
        [platform]: value
      }
    })
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setLogoFile(file)
  }

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setBannerFile(file)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      let updatedLogoUrl = profile?.logo
      let updatedBannerUrl = profile?.banner

      // Upload logo if selected
      if (logoFile) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('file', logoFile)
          formDataUpload.append('type', 'companyLogo')
          const uploadResponse = await api.post('/upload', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          if (uploadResponse.data.success) {
            updatedLogoUrl = uploadResponse.data.data.url
          }
        } catch (err) {
          console.error('Failed to upload logo:', err)
          alert('Failed to upload logo')
          return
        }
      }

      // Upload banner if selected
      if (bannerFile) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('file', bannerFile)
          formDataUpload.append('type', 'companyBanner')
          const uploadResponse = await api.post('/upload', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          if (uploadResponse.data.success) {
            updatedBannerUrl = uploadResponse.data.data.url
          }
        } catch (err) {
          console.error('Failed to upload banner:', err)
          alert('Failed to upload banner')
          return
        }
      }

      const response = await api.post('/companies', {
        ...formData,
        logo: updatedLogoUrl,
        banner: updatedBannerUrl
      })

      if (response.data.success) {
        const p = response.data.data
        setProfile(p)
        setFormData({
          name: p.userId?.name || '',
          companyName: p.companyName || '',
          email: p.userId?.email || '',
          phone: p.phone || '',
          website: p.website || '',
          location: p.location || '',
          industry: p.industry || '',
          companySize: p.companySize || '',
          founded: p.founded || '',
          description: p.description || '',
          about: p.about || '',
          benefits: p.benefits || '',
          cin: p.cin || '',
          socialLinks: {
            linkedin: p.socialLinks?.linkedin || '',
            twitter: p.socialLinks?.twitter || '',
            instagram: p.socialLinks?.instagram || ''
          }
        })
        setIsEditing(false)
        setLogoFile(null)
        setBannerFile(null)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyCin = async () => {
    if (!formData.cin || formData.cin.length !== 21) {
      setVerificationError('Please enter a valid 21-character CIN')
      return
    }

    try {
      setIsVerifying(true)
      setVerificationError(null)
      setMcaDetails(null)

      const response = await api.post('/companies/verify-cin', { cin: formData.cin })

      if (response.data.success) {
        setProfile(response.data.data.profile)
        setMcaDetails(response.data.data.mcaDetails)
        setShowMcaDetails(true)
        setFormData(prev => ({ ...prev, cin: response.data.data.profile.cin }))
      } else {
        setVerificationError(response.data.error || response.data.message || 'Verification failed')
      }
    } catch (error: any) {
      console.error('Error verifying CIN:', error)
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Verification failed. Please try again.'
      setVerificationError(errorMsg)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to profile values
    if (profile) {
      setFormData({
        name: profile.userId?.name || '',
        companyName: profile.companyName || '',
        email: profile.userId?.email || '',
        phone: profile.phone || '',
        website: profile.website || '',
        location: profile.location || '',
        industry: profile.industry || '',
        companySize: profile.companySize || '',
        founded: profile.founded || '',
        description: profile.description || '',
        about: profile.about || '',
        benefits: profile.benefits || '',
        cin: profile.cin || '',
        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || '',
          twitter: profile.socialLinks?.twitter || '',
          instagram: profile.socialLinks?.instagram || ''
        }
      })
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-2 sm:p-3">
      {/* Header with Banner & Logo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 relative group">
        {/* Banner Area */}
        <div className="h-32 sm:h-48 bg-gray-100 relative">
          {bannerPreview || profile?.banner ? (
            <img
              src={bannerPreview || profile?.banner || ''}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-secondary/10" />
          )}

          {/* Banner Upload Button */}
          {isEditing && (
            <div className="absolute top-4 right-4">
              <input
                type="file"
                id="banner-upload"
                className="hidden"
                accept="image/*"
                onChange={handleBannerSelect}
              />
              <label
                htmlFor="banner-upload"
                className="flex items-center justify-center p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white cursor-pointer transition-all shadow-sm"
              >
                <Camera size={18} />
              </label>
            </div>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-12 sm:-mt-16">

            {/* Company Logo */}
            <div className="relative group/logo shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden relative">
                {logoPreview || profile?.logo ? (
                  <img
                    src={logoPreview || profile?.logo || ''}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                    {formData.companyName.charAt(0) || 'C'}
                  </div>
                )}

                {/* Logo Upload Overlay */}
                {isEditing && (
                  <label
                    htmlFor="logo-upload"
                    className="absolute inset-0 bg-black/30 hover:bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover/logo:opacity-100 transition-opacity"
                  >
                    <Camera size={24} className="text-white" />
                  </label>
                )}
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoSelect}
                />
              </div>
            </div>

            {/* Company Name and Info */}
            <div className="flex-1 pt-2 sm:pt-0">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">{formData.companyName || 'Company Name'}</h1>
              <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1">
                {formData.industry && <span className="flex items-center gap-1"><Briefcase size={14} /> {formData.industry}</span>}
                {formData.location && <span className="flex items-center gap-1"><MapPin size={14} /> {formData.location}</span>}
                {profile?.verified && <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Verified</span>}
              </div>
            </div>

            {/* Edit/Save Actions */}
            <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
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
                  <Edit size={16} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
          {/* Preview hint */}
          {isEditing && (logoFile || bannerFile) && (
            <p className="text-xs text-green-600 font-medium mt-3">Preview shown — click Save to upload</p>
          )}
        </div>
      </div>

      {/* Verification Status */}
      {profile?.verified ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4 flex items-start gap-2">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="font-semibold text-green-900 text-xs sm:text-sm">Verified Company</h3>
            <p className="text-xs text-green-700">
              Your company CIN has been verified via MCA.
              {profile.cin && <span className="font-mono ml-1">({profile.cin})</span>}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4 flex items-start gap-2">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 text-xs sm:text-sm">Unverified Company</h3>
            <p className="text-xs text-amber-700 mb-2">
              Add your Company CIN and verify it to get a verified badge.
            </p>
          </div>
        </div>
      )}

      {/* CIN Verification Section - Only show for unverified companies */}
      {!profile?.verified && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield size={18} />
            CIN Verification
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Corporate Identification Number (CIN)
              </label>
              <input
                type="text"
                name="cin"
                value={formData.cin}
                onChange={handleInputChange}
                placeholder="e.g., L74899DL1995PLC069802"
                maxLength={21}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">21 characters, format: L74899DL1995PLC069802</p>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleVerifyCin}
                disabled={isVerifying || !formData.cin || formData.cin.length !== 21}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isVerifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Verify CIN
                  </>
                )}
              </button>
            </div>
          </div>

          {verificationError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 flex items-center gap-1">
                <AlertCircle size={14} />
                {verificationError}
              </p>
            </div>
          )}

          {/* MCA Details Modal/Section */}
          {showMcaDetails && mcaDetails && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-green-900 text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  Verification Successful
                </h3>
                <button
                  onClick={() => setShowMcaDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Company Name:</span>
                  <p className="font-semibold text-gray-900">{mcaDetails.companyName}</p>
                </div>
                <div>
                  <span className="text-gray-600">CIN:</span>
                  <p className="font-mono text-gray-900">{mcaDetails.cin}</p>
                </div>
                {mcaDetails.registrationDate && (
                  <div>
                    <span className="text-gray-600">Registration Date:</span>
                    <p className="text-gray-900">{mcaDetails.registrationDate}</p>
                  </div>
                )}
                {mcaDetails.status && (
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="text-gray-900">{mcaDetails.status}</p>
                  </div>
                )}
                {mcaDetails.registeredOffice && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-600">Registered Office:</span>
                    <p className="text-gray-900">{mcaDetails.registeredOffice}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-gray-500 text-[10px]">
                    Source: {mcaDetails.source === 'primary' ? 'MCA Corporate Verifications' : 'MCA Company API'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Building size={18} />
          Basic Information
        </h2>

        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-900 font-semibold">{formData.name || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
            {isEditing ? (
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-900 font-semibold">{formData.companyName || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Industry</label>
            {isEditing ? (
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Industry</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs sm:text-sm text-gray-900">{formData.industry || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Phone size={12} />
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-900">{formData.phone || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Globe size={12} />
              Website
            </label>
            {isEditing ? (
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : formData.website ? (
              <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                {formData.website}
              </a>
            ) : (
              <p className="text-xs sm:text-sm text-gray-900">-</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin size={12} />
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-900">{formData.location || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Users size={12} />
              Size
            </label>
            {isEditing ? (
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Size</option>
                {COMPANY_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs sm:text-sm text-gray-900">{formData.companySize || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={12} />
              Founded
            </label>
            {isEditing ? (
              <input
                type="text"
                name="founded"
                value={formData.founded}
                onChange={handleInputChange}
                placeholder="2018"
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-900">{formData.founded || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Briefcase size={18} />
          Company Details
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line line-clamp-4">{formData.description || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Internship Program</label>
            {isEditing ? (
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line line-clamp-4">{formData.about || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Benefits</label>
            {isEditing ? (
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                rows={2}
                placeholder="Benefits offered..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line">{formData.benefits || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Social Media</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn</label>
            {isEditing ? (
              <input
                type="url"
                value={formData.socialLinks.linkedin}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                placeholder="linkedin.com/..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : formData.socialLinks.linkedin ? (
              <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                {formData.socialLinks.linkedin}
              </a>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500">-</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Twitter</label>
            {isEditing ? (
              <input
                type="url"
                value={formData.socialLinks.twitter}
                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                placeholder="twitter.com/..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : formData.socialLinks.twitter ? (
              <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                {formData.socialLinks.twitter}
              </a>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500">-</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Instagram</label>
            {isEditing ? (
              <input
                type="url"
                value={formData.socialLinks.instagram}
                onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                placeholder="instagram.com/..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : formData.socialLinks.instagram ? (
              <a href={formData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                {formData.socialLinks.instagram}
              </a>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500">-</p>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-3 mt-4">
        <h2 className="text-base sm:text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={18} />
          Danger Zone
        </h2>
        <p className="text-sm text-red-600 mb-3">
          Once you delete your account, there is no going back. All your data including internships and applications will be permanently removed.
        </p>
        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
            {error}
          </div>
        )}
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
              This action cannot be undone. This will permanently delete your company account and remove all your data including:
            </p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
              <li>Your company profile</li>
              <li>All your internship postings</li>
              <li>All applications received</li>
              <li>Your messages and notifications</li>
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
