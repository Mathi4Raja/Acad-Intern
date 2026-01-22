'use client'

import { useState } from 'react'
import { Building, Mail, Phone, MapPin, Globe, Users, Edit, Save, X, Briefcase, Calendar, CheckCircle, Upload } from 'lucide-react'

export default function CompanyProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: 'Tech Corp',
    email: 'contact@techcorp.com',
    phone: '+91 9876543210',
    website: 'https://techcorp.com',
    location: 'Bangalore, Karnataka',
    industry: 'Technology',
    companySize: '50-200',
    founded: '2018',
    description: 'Tech Corp is a leading technology company focused on building innovative solutions for the modern world. We specialize in web and mobile application development, cloud services, and AI-driven products.',
    about: 'At Tech Corp, we believe in empowering the next generation of tech talent. Our internship programs are designed to provide hands-on experience with cutting-edge technologies while working alongside experienced professionals.',
    benefits: 'Competitive stipends, Flexible work hours, Mentorship programs, Skill development workshops, Certificate of completion, Pre-placement offers for exceptional performers',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/techcorp',
      twitter: 'https://twitter.com/techcorp',
      instagram: 'https://instagram.com/techcorp'
    }
  })

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

  const handleSave = () => {
    console.log('Saving profile:', formData)
    setIsEditing(false)
    alert('Profile updated successfully! (This is a demo)')
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original values if needed
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5">Company Profile</h1>
          <p className="text-xs sm:text-sm text-gray-600">Manage your company information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm w-full sm:w-auto justify-center"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 sm:flex-none flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm justify-center"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 text-sm justify-center"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Verification Status */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 flex items-start gap-2">
        <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <h3 className="font-semibold text-green-900 text-xs sm:text-sm">Verified Company</h3>
          <p className="text-xs text-green-700">
            Your company has been verified.
          </p>
        </div>
      </div>

      {/* Logo Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-3 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Company Logo</h2>
        <div className="flex flex-row items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg flex-shrink-0">
            {formData.name.charAt(0)}
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
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-900 font-semibold">{formData.name}</p>
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
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-xs sm:text-sm text-gray-900">{formData.industry}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Mail size={12} />
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <p className="text-xs sm:text-sm text-gray-900 truncate">{formData.email}</p>
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
              <p className="text-xs sm:text-sm text-gray-900">{formData.phone}</p>
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
            ) : (
              <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                {formData.website}
              </a>
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
              <p className="text-xs sm:text-sm text-gray-900">{formData.location}</p>
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
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="50-200">50-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
            ) : (
              <p className="text-xs sm:text-sm text-gray-900">{formData.companySize}</p>
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
              <p className="text-xs sm:text-sm text-gray-900">{formData.founded}</p>
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
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line line-clamp-4">{formData.description}</p>
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
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line line-clamp-4">{formData.about}</p>
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
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line">{formData.benefits}</p>
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
            ) : (
              <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                {formData.socialLinks.linkedin}
              </a>
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
            ) : (
              <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                {formData.socialLinks.twitter}
              </a>
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
            ) : (
              <a href={formData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-primary hover:underline truncate block">
                {formData.socialLinks.instagram}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
