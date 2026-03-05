'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'

import { useAuth } from '@/lib/AuthContext'
import { useSettings } from '@/lib/SettingsContext'

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

export default function LoginPage() {
  const { login, googleLogin } = useAuth()
  const { settings } = useSettings()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setResendEmail('')
    setIsLoading(true)

    try {
      await login(formData);
      // Redirect is handled in AuthContext
    } catch (err: any) {
      const resp = err.response?.data;
      setError(resp?.message || 'Login failed. Please check your credentials.');

      if (resp?.requiresVerification && resp?.email) {
        setResendEmail(resp.email);
      }

      setIsLoading(false);
    }
  }

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendLoading(true);
    setSuccessMessage('');
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setSuccessMessage('A new verification link has been sent to your email.');
      setResendEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification link.');
    } finally {
      setResendLoading(false);
    }
  }

  // Handle Google Sign-In callback
  const handleGoogleCallback = async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      await googleLogin(response.credential);
      // Redirect handled in AuthContext
    } catch (err: any) {
      const status = err.response?.status;
      const resp = err.response?.data;
      const message = resp?.message;

      if (status === 403) {
        setError(message || 'Registration is currently closed.');
        if (resp?.requiresVerification && resp?.email) {
          setResendEmail(resp.email);
        }
      } else if (status === 401 && message?.includes('Google Sign-In')) {
        setError(message); // Pass through the specific backend message about Google vs Email
      } else {
        setError(message || 'Google sign-in failed. Please try again.');
      }
      setIsGoogleLoading(false);
    }
  };

  // Track when Google script is ready
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  // Load Google Identity Services script
  useEffect(() => {
    // Check if script is already loaded
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

  // Render Google button when script is ready and container exists
  useEffect(() => {
    if (isGoogleReady && googleButtonContainerRef.current && window.google) {
      googleButtonContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'medium',
        text: 'continue_with',
        width: googleButtonContainerRef.current.offsetWidth || 280,
      });
    }
  }, [isGoogleReady]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8 relative">
      {/* Back Arrow - Top Left */}
      <Link
        href="/internships"
        className="absolute top-4 left-4 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm hover:shadow-md text-gray-600 hover:text-primary transition-all z-20"
        aria-label="Back to home"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-56 h-56 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-56 h-56 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-5">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary transition-colors">
            {settings?.siteName || 'AcadIntern'}
          </Link>
          <h1 className="mt-3 text-xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Login to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-1">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                {resendEmail && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors disabled:opacity-50 pl-6"
                  >
                    {resendLoading ? (
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Mail size={12} />
                    )}
                    Resend Verification Link
                  </button>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-1.5 block text-xs text-gray-600">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/90">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Sign-In Divider */}
          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="mt-3 overflow-hidden">
            {isGoogleLoading && (
              <div className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-gray-300 rounded-lg bg-gray-50 text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Signing in...</span>
              </div>
            )}
            <div
              ref={googleButtonContainerRef}
              className={`w-full flex justify-center overflow-hidden${isGoogleLoading ? ' hidden' : ''}`}
            ></div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">Don't have an account? </span>
            <Link
              href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="text-xs font-medium text-primary hover:text-primary/90"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
