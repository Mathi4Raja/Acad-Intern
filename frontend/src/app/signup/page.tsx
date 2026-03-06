'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Building2, GraduationCap, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { LegalModals } from '@/components/signup/LegalModals'

type UserRole = 'student' | 'company' | null

import { useAuth } from '@/lib/AuthContext'
import { useSettings } from '@/lib/SettingsContext'
import { DEPARTMENTS } from '@/lib/constants'
import { Select } from '@/components/ui/Select'
import { ensureHttps } from '@/lib/formatters'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function SignupPage() {
  const { signup, googleLogin } = useAuth()
  const { settings } = useSettings()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean, type: 'terms' | 'privacy' }>({
    isOpen: false,
    type: 'terms'
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    semester: '',
    companyName: '',
    website: '',
    cin: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedRole) {
      setError('Please select a role')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole
      };

      if (selectedRole === 'student') {
        payload.department = formData.department;
        payload.semester = formData.semester;
      } else if (selectedRole === 'company') {
        payload.companyName = formData.companyName;
        payload.website = ensureHttps(formData.website);
        payload.cin = formData.cin;
        payload.description = formData.description;
      }

      await signup(payload);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  }

  const handleGoogleCallback = async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await googleLogin(response.credential);
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 403) {
        setError(message || 'Registration is currently closed. Please check back later.');
      } else {
        setError(message || 'Google sign-in failed. Please try again.');
      }
      setIsGoogleLoading(false);
    }
  };

  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
      setIsGoogleReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        setIsGoogleReady(true);
      }
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (isGoogleReady && googleButtonContainerRef.current && window.google) {
      googleButtonContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'medium',
        text: 'signup_with',
        width: googleButtonContainerRef.current.offsetWidth || 280,
      });
    }
  }, [isGoogleReady, selectedRole]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8 relative">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-56 h-56 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-56 h-56 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className={`w-full relative z-10 transition-all duration-300 ${selectedRole ? 'max-w-2xl' : 'max-w-lg'}`}>
        {/* Header */}
        <div className="text-center mb-5">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary transition-colors">
            {settings?.siteName || 'AcadIntern'}
          </Link>
          <h1 className="mt-3 text-xl font-bold text-gray-900">
            {settings?.allowRegistration === false ? 'Onboarding Locked' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {settings?.allowRegistration === false
              ? 'New user registration is currently closed. Please check back later.'
              : `Join ${settings?.siteName || 'AcadIntern'} and start your journey`}
          </p>
        </div>

        {/* Locked State Notification */}
        {settings?.allowRegistration === false ? (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-100 p-8 text-center space-y-6 animate-fade-in">
            <div className="mx-auto w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">Registration is Closed</h2>
              <p className="text-gray-600 max-w-sm mx-auto">
                The administrator has temporarily disabled new user registrations. We're currently optimizing our platform to better serve you.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Link
                href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-primary hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
              >
                Sign in to Existing Account
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md group mt-2"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="font-semibold text-sm">Back to Home</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Role Selection */
          !selectedRole ? (
            <div className="space-y-4">
              {/* Student Card */}
              <div className="group bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
                {/* Card Header with gradient accent */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <GraduationCap className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900">I'm a Student</h2>
                      <p className="text-sm text-gray-600">Find your dream internship</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />Browse internships
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />One-click apply
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />Track progress
                    </span>
                  </div>

                  <div className="space-y-2.5 overflow-hidden">
                    {isGoogleLoading && (
                      <div className="w-full flex items-center justify-center gap-2 py-2.5 px-3 border border-gray-200 rounded-xl bg-gray-50 text-sm">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Signing up...</span>
                      </div>
                    )}
                    <div
                      ref={googleButtonContainerRef}
                      className={`w-full flex justify-center overflow-hidden animate-in fade-in duration-500 ${isGoogleLoading ? 'hidden' : ''}`}
                    ></div>
                    <button
                      onClick={() => setSelectedRole('student')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Mail className="w-4 h-4" />
                      Sign up with Email
                    </button>
                  </div>
                </div>
              </div>

              {/* Company Card */}
              <button
                onClick={() => setSelectedRole('company')}
                className="w-full group bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-purple-200 overflow-hidden transition-all duration-300 hover:shadow-xl text-left"
              >
                {/* Card Header with gradient accent */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b border-purple-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <Building2 className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-gray-900">I'm a Company</h2>
                      <p className="text-sm text-gray-600">Hire top talent for your team</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 group-hover:shadow-md transition-all duration-300">
                      <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />Post internships
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />Manage applications
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />Find talent
                    </span>
                  </div>
                </div>
              </button>

              {/* Login link */}
              <div className="text-center pt-3">
                <span className="text-sm text-gray-500">Already have an account? </span>
                <Link
                  href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                  className="text-sm font-semibold text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                >
                  Login
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
              {/* Form Header with gradient */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100/50 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedRole === 'student' ? (
                      <>
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-900">Student Registration</h2>
                          <p className="text-xs text-gray-500">Fill in your details to get started</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-900">Company Registration</h2>
                          <p className="text-xs text-gray-500">Set up your company profile</p>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-blue-600 hover:bg-blue-100"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Common Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {selectedRole === 'student' ? 'Full Name' : 'Contact Person'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 transition-all text-sm bg-gray-50/50 focus:bg-white focus:ring-blue-500/20 focus:border-blue-400"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 transition-all text-sm bg-gray-50/50 focus:bg-white focus:ring-blue-500/20 focus:border-blue-400"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Student Specific Fields */}
                {selectedRole === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                      <Select
                        value={formData.department}
                        onChange={(val) => setFormData({ ...formData, department: val })}
                        options={[
                          { value: '', label: 'Select Department' },
                          ...DEPARTMENTS.map(dept => ({ value: dept, label: dept }))
                        ]}
                        className="w-full !bg-gray-50/50"
                        isFullWidth
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Semester</label>
                      <Select
                        value={formData.semester}
                        onChange={(val) => setFormData({ ...formData, semester: val })}
                        options={[
                          { value: '', label: 'Select Semester' },
                          ...[1, 2, 3, 4, 5, 6, 7, 8].map(sem => ({ value: sem.toString(), label: `Semester ${sem}` }))
                        ]}
                        className="w-full !bg-gray-50/50"
                        isFullWidth
                      />
                    </div>
                  </div>
                )}

                {/* Company Specific Fields */}
                {selectedRole === 'company' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white"
                            placeholder="Acme Corporation"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
                        <input
                          type="url"
                          required
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white"
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">CIN (Optional)</label>
                        <input
                          type="text"
                          value={formData.cin}
                          onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white"
                          placeholder="Corporate Identity Number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <input
                          type="text"
                          required
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-sm bg-gray-50/50 focus:bg-white"
                          placeholder="Brief company description"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 transition-all text-sm bg-gray-50/50 focus:bg-white focus:ring-blue-500/20 focus:border-blue-400"
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 transition-all text-sm bg-gray-50/50 focus:bg-white focus:ring-blue-500/20 focus:border-blue-400"
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <label
                  htmlFor="terms"
                  className="flex items-center gap-3 p-3.5 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-100/50 hover:bg-gray-100/50 group transition-all cursor-pointer select-none"
                >
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-transform active:scale-95 shrink-0"
                  />
                  <span className="text-[13px] leading-[1.4] text-gray-600 font-bold flex-1">
                    I Agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegalModal({ isOpen: true, type: 'terms' }); }}
                      className="text-blue-600 hover:underline transition-colors font-black"
                    >
                      Terms
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegalModal({ isOpen: true, type: 'privacy' }); }}
                      className="text-blue-600 hover:underline transition-colors font-black"
                    >
                      Policies
                    </button>
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Already have an account? </span>
                  <Link
                    href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                    className="text-sm font-semibold hover:underline underline-offset-2 text-blue-600"
                  >
                    Login
                  </Link>
                </div>
              </form>
            </div>
          )
        )}
      </div>

      <LegalModals
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
      />
    </div>
  )
}
