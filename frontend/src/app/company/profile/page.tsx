'use client'

import { useState, useEffect } from 'react'
import { Building, Mail, Phone, MapPin, Globe, Users, Edit, Save, X, Briefcase, Calendar, CheckCircle, Upload, AlertCircle, Shield, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { PageHeader } from '@/components/common'

interface CompanyProfile {
  _id: string;
  companyName: string;
  website?: string;
  description?: string;
  verified: boolean;
  cin?: string;
  logo?: string;
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

  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [formData, setFormData] = useState({
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

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/companies/me')
      if (response.data.success && response.data.data) {
        setProfile(response.data.data)
        setFormData({
          companyName: response.data.data.companyName || '',
          email: response.data.data.email || '',
          phone: response.data.data.phone || '',
          website: response.data.data.website || '',
          location: response.data.data.location || '',
          industry: response.data.data.industry || '',
          companySize: response.data.data.companySize || '',
          founded: response.data.data.founded || '',
          description: response.data.data.description || '',
          about: response.data.data.about || '',
          benefits: response.data.data.benefits || '',
          cin: response.data.data.cin || '',
          socialLinks: {
            linkedin: response.data.data.socialLinks?.linkedin || '',
            twitter: response.data.data.socialLinks?.twitter || '',
            instagram: response.data.data.socialLinks?.instagram || ''
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

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await api.post('/companies', formData)

      if (response.data.success) {
        setProfile(response.data.data)
        setIsEditing(false)
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
        companyName: profile.companyName || '',
        email: '',
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
    <div className="max-w-5xl mx-auto p-3 sm:p-4">
      <PageHeader
        title="Company Profile"
        subtitle="Manage your company information and verification details."
        action={
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm w-full sm:w-auto justify-center shadow-sm"
            >
              <Edit size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save
              </button>
            </div>
          )
        }
      />

      {/* Verification Status */}
      {profile?.verified ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 flex items-start gap-2">
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 flex items-start gap-2">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 text-xs sm:text-sm">Unverified Company</h3>
            <p className="text-xs text-amber-700 mb-2">
              Add your Company CIN and verify it to get a verified badge.
            </p>
          </div>
        </div>
      )}

      {/* CIN Verification Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
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

      {/* Logo Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Company Logo</h2>
        <div className="flex flex-row items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg flex-shrink-0">
            {formData.companyName.charAt(0) || 'C'}
          </div>
          {isEditing && (
            <div className="flex-1">
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary rounded-lg hover:bg-primary/10 text-xs sm:text-sm">
                <Upload size={16} />
                Upload Logo
              </button>
              <p className="text-xs text-gray-500 mt-1">Square, 400x400px</p>
            </div>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Building size={18} />
          Basic Information
        </h2>

        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
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
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
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
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="50-200">50-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Social Media</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      <div className="bg-red-50 rounded-xl border border-red-200 p-3 sm:p-4 mt-6">
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
