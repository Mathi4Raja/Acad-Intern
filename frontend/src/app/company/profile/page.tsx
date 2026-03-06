'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Mail, Phone, MapPin, Globe, Linkedin, Twitter, Instagram,
  Edit3, Camera, Save, X, Plus, Trash2, CheckCircle2, Loader2, Verified,
  ExternalLink, Activity, FileText, Briefcase, CheckCircle, Edit, Edit2,
  AlertCircle, Shield, Info, Rocket, Gift, AlertTriangle, Building, Users, Calendar
} from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useAlert } from '@/components/ui/AlertProvider'
import { cn } from '@/lib/utils'
import { INDUSTRIES, COMPANY_SIZES } from '@/lib/constants'
import { Select } from '@/components/ui/Select'
import { ensureHttps } from '@/lib/formatters'

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)

  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState(false)

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
      setLogoError(false)
      return () => URL.revokeObjectURL(url)
    } else {
      setLogoPreview(null)
      setLogoError(false)
    }
  }, [logoFile])

  // Handle local preview for banner
  useEffect(() => {
    if (bannerFile) {
      const url = URL.createObjectURL(bannerFile)
      setBannerPreview(url)
      setBannerError(false)
      return () => URL.revokeObjectURL(url)
    } else {
      setBannerPreview(null)
      setBannerError(false)
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
        setLogoError(false)
        setBannerError(false)
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
        website: ensureHttps(formData.website),
        socialLinks: {
          linkedin: ensureHttps(formData.socialLinks?.linkedin),
          twitter: ensureHttps(formData.socialLinks?.twitter),
          instagram: ensureHttps(formData.socialLinks?.instagram)
        },
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
    setLogoFile(null)
    setBannerFile(null)
    setLogoPreview(null)
    setBannerPreview(null)
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
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 relative group">
        {/* Banner Area */}
        <div className="h-32 sm:h-48 bg-gray-100 relative">
          {(bannerPreview || profile?.banner) && !bannerError ? (
            <img
              src={bannerPreview || profile?.banner || ''}
              alt="Company Banner"
              className="w-full h-full object-cover"
              onError={() => setBannerError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/20" />
          )}

          {/* Banner Upload Actions */}
          {isEditing && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <input
                type="file"
                id="banner-upload"
                className="hidden"
                accept="image/*"
                onChange={handleBannerSelect}
              />
              <label
                htmlFor="banner-upload"
                className="flex items-center justify-center p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white cursor-pointer transition-all shadow-sm"
                title="Change Banner"
              >
                <Edit2 size={16} />
              </label>

              {(bannerPreview || profile?.banner) && (
                <button
                  type="button"
                  onClick={() => {
                    setBannerFile(null)
                    setBannerPreview(null)
                    setProfile(prev => prev ? { ...prev, banner: undefined } : null)
                  }}
                  className="flex items-center justify-center p-2.5 bg-rose-500/80 hover:bg-rose-600/90 backdrop-blur-md rounded-full text-white transition-all shadow-sm"
                  title="Remove Banner"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end -mt-12 sm:-mt-16">

            {/* Company Logo */}
            <div className="relative group/logo shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden relative">
                {(logoPreview || profile?.logo) && !logoError ? (
                  <img
                    src={logoPreview || profile?.logo || ''}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold">
                    {formData.companyName?.charAt(0) || 'C'}
                  </div>
                )}
              </div>

              {/* Logo Upload Button */}
              {isEditing && (
                <label
                  htmlFor="logo-upload"
                  className="absolute bottom-0 right-0 p-1.5 bg-gray-900 border-2 border-white hover:bg-black rounded-full cursor-pointer shadow-sm transition-all z-20 group-hover/logo:scale-105"
                  title="Change Logo"
                >
                  <Edit2 size={14} className="text-white" />
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

          <div className="space-y-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Corporate Identification Number (CIN)
              </label>
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <input
                  type="text"
                  name="cin"
                  value={formData.cin}
                  onChange={handleInputChange}
                  placeholder="e.g., L74899DL1995PLC069802"
                  maxLength={21}
                  className="flex-1 pl-4 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono uppercase outline-none bg-gray-50/30"
                />
                <button
                  onClick={handleVerifyCin}
                  disabled={isVerifying || !formData.cin || formData.cin.length !== 21}
                  className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Verifying CIN...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Verify CIN</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 ml-1 flex items-center gap-1.5">
                <Info size={12} />
                21 characters, format: L74899DL1995PLC069802
              </p>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4 group transition-all hover:shadow-md">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 ml-1 flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <Building className="text-primary" size={18} />
          </div>
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Contact Person */}
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Contact Person</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Mail size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{formData.name || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Company Name</label>
            {isEditing ? (
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Building size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{formData.companyName || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Industry</label>
            {isEditing ? (
              <div className="space-y-2">
                <Select
                  value={INDUSTRIES.includes(formData.industry) ? formData.industry : 'Other'}
                  onChange={(val) => {
                    if (val === 'Other') {
                      setFormData({ ...formData, industry: '' })
                    } else {
                      setFormData({ ...formData, industry: val })
                    }
                  }}
                  options={[
                    { value: '', label: 'Select Industry' },
                    ...INDUSTRIES.map(ind => ({ value: ind, label: ind }))
                  ]}
                  className="w-full"
                  isFullWidth
                />
                {(!INDUSTRIES.includes(formData.industry) || formData.industry === 'Other') && (
                  <div className="animate-in slide-in-from-top-1 duration-200">
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry === 'Other' ? '' : formData.industry}
                      onChange={handleInputChange}
                      placeholder="Specify your industry"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-white"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Briefcase size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{formData.industry || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone</label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Phone size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{formData.phone || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Website */}
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Website</label>
            {isEditing ? (
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Globe size={14} />
                </div>
                {formData.website ? (
                  <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline truncate flex items-center gap-1.5">
                    {formData.website.replace(/^https?:\/\//, '')} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-sm font-semibold text-gray-400 italic font-normal">Not provided</span>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Location</label>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <MapPin size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{formData.location || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Company Size */}
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Company Size</label>
            {isEditing ? (
              <Select
                value={formData.companySize}
                onChange={(val) => setFormData({ ...formData, companySize: val })}
                options={[
                  { value: '', label: 'Select Size' },
                  ...COMPANY_SIZES.map(size => ({ value: size, label: size }))
                ]}
                className="w-full"
                isFullWidth
              />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Users size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{formData.companySize || 'Not provided'}</span>
              </div>
            )}
          </div>

          {/* Founded */}
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Founded</label>
            {isEditing ? (
              <input
                type="text"
                name="founded"
                value={formData.founded}
                onChange={handleInputChange}
                placeholder="2018"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Calendar size={14} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{formData.founded || 'Not provided'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4 group transition-all hover:shadow-md">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-purple-50 rounded-lg">
            <Info className="text-purple-600" size={18} />
          </div>
          Company Details
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1">Company Description</label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none"
              />
            ) : (
              <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{formData.description || 'Add a short description about your company.'}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1 flex items-center gap-2">
              <Rocket size={14} className="text-primary" /> Internship Program
            </label>
            {isEditing ? (
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none"
              />
            ) : (
              <div className="bg-blue-50/30 rounded-2xl p-4 sm:p-5 border border-blue-100/50">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{formData.about || 'Describe what makes your internship program unique.'}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-1 flex items-center gap-2">
              <Gift size={14} className="text-green-600" /> Company Benefits
            </label>
            {isEditing ? (
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                rows={3}
                placeholder="List key benefits (stipend, certificates, mentorship, etc.)"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none"
              />
            ) : (
              <div className="bg-green-50/30 rounded-2xl p-4 sm:p-5 border border-green-100/50">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{formData.benefits || 'List the perks and benefits of interning at your company.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-4 group transition-all hover:shadow-md">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-sky-50 rounded-lg">
            <ExternalLink className="text-sky-600" size={18} />
          </div>
          Social Media
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">LinkedIn</label>
            {isEditing ? (
              <div className="relative">
                <Linkedin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  placeholder="linkedin.com/..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Linkedin size={14} />
                </div>
                {formData.socialLinks.linkedin ? (
                  <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5">
                    LinkedIn <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-sm font-semibold text-gray-400 italic font-normal">Not provided</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Twitter (X)</label>
            {isEditing ? (
              <div className="relative">
                <Twitter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  placeholder="twitter.com/..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Twitter size={14} />
                </div>
                {formData.socialLinks.twitter ? (
                  <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5">
                    Twitter <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-sm font-semibold text-gray-400 italic font-normal">Not provided</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1 ml-1 cursor-default">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Instagram</label>
            {isEditing ? (
              <div className="relative">
                <Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  placeholder="instagram.com/..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                  <Instagram size={14} />
                </div>
                {formData.socialLinks.instagram ? (
                  <a href={formData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5">
                    Instagram <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-sm font-semibold text-gray-400 italic font-normal">Not provided</span>
                )}
              </div>
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
