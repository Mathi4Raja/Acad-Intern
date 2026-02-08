'use client'

import Link from 'next/link'
import { Target, Users, Shield, TrendingUp, Award, CheckCircle, Zap, Clock, BookOpen, Sparkles, ArrowRight, Mail, Phone, MapPin, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useSettings } from '@/lib/SettingsContext'


export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { settings: publicSettings } = useSettings()

  const stats = [
    { label: 'Active Students', value: '10,000+', icon: Users },
    { label: 'Companies', value: '500+', icon: Shield },
    { label: 'Internships Posted', value: '2,500+', icon: BookOpen },
    { label: 'Success Rate', value: '94%', icon: TrendingUp }
  ]

  const features = [
    {
      icon: Target,
      title: 'Advanced Search & Filters',
      description: 'Filter internships by location, duration, stipend, skills, work mode, and company size to find exactly what you need.'
    },
    {
      icon: TrendingUp,
      title: 'Application Tracking System',
      description: 'Monitor all your applications in one place with status updates, timeline views, and automatic follow-up reminders.'
    },
    {
      icon: Users,
      title: 'Profile Analytics',
      description: 'See how many companies viewed your profile, which skills are in demand, and get suggestions to improve your chances.'
    },
    {
      icon: Shield,
      title: 'Company Insights',
      description: 'View detailed company profiles, past internship reviews, hiring patterns, and employee ratings before applying.'
    },
    {
      icon: BookOpen,
      title: 'Document Management',
      description: 'Upload and manage multiple versions of your resume, cover letters, and certificates in one secure location.'
    },
    {
      icon: Award,
      title: 'Career Resources',
      description: 'Access interview preparation guides, resume templates, skill assessments, and mentorship from industry professionals.'
    }
  ]

  const values = [
    {
      title: 'Student First',
      description: 'Every decision we make prioritizes student success and experience.'
    },
    {
      title: 'Transparency',
      description: 'Clear communication and honest feedback at every step of the journey.'
    },
    {
      title: 'Quality',
      description: 'We maintain high standards for both internships and student applications.'
    },
    {
      title: 'Innovation',
      description: 'Continuously improving our platform with the latest technology and feedback.'
    }
  ]

  const team = [
    {
      name: 'Mathiraja',
      role: 'Founder & Developer',
      description: 'Full-stack developer passionate about education technology'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-primary hover:scale-110 transition-transform">
              {publicSettings?.siteName || 'AcadIntern'}
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/internships" className="text-gray-700 hover:text-primary transition-colors">
                Internships
              </Link>
              <Link href="/about" className="text-primary font-medium">
                About
              </Link>
              <Link href="/login" className="text-gray-700 hover:text-primary transition-colors">
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base shadow-lg shadow-primary/20"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-3 space-y-3">
              <Link
                href="/internships"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
              >
                Internships
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium"
              >
                About
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Connecting Students with <span className="text-primary">Real Opportunities</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            {publicSettings?.siteDescription || `${publicSettings?.siteName || 'AcadIntern'} is a student-first platform designed to bridge the gap between academic learning and industry experience through meaningful internship opportunities.`}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-5 bg-gray-50 rounded-xl">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-base text-gray-600 mb-4">
                We believe that every student deserves access to quality internship opportunities
                that complement their academic journey and prepare them for successful careers.
              </p>
              <p className="text-base text-gray-600 mb-5">
                {publicSettings?.siteName || 'AcadIntern'} was created to solve the common challenges students face: finding relevant
                opportunities, navigating complex application processes, and getting timely responses.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-base text-gray-700">Simplified application process</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-base text-gray-700">Transparent communication</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-base text-gray-700">Quality-focused opportunities</span>
                </div>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="bg-gradient-to-br from-primary/20 to-purple-100 rounded-2xl p-8 h-72 flex items-center justify-center">
                <Sparkles className="w-24 h-24 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Why Choose {publicSettings?.siteName || 'AcadIntern'}?</h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Built with students in mind, packed with features to make your internship search effortless
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Our Core Values</h2>
            <p className="text-base text-gray-600">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-xl p-5 h-full border border-gray-200">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Meet the Team</h2>
            <p className="text-base text-gray-600">Passionate individuals making internships accessible</p>
          </div>

          <div className="flex justify-center">
            {team.map((member, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 max-w-sm text-center hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/40 to-purple-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{member.name.charAt(0)}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-primary font-medium mb-2">{member.role}</p>
                <p className="text-sm text-gray-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-base text-gray-600">Getting started is simple and takes just a few minutes</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your account in minutes' },
              { step: '2', title: 'Complete Profile', description: 'Add your details and skills' },
              { step: '3', title: 'Browse & Apply', description: 'Find and apply with one click' },
              { step: '4', title: 'Get Hired', description: 'Start your internship journey' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-xl p-5 shadow-md">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Get in Touch</h2>
          <p className="text-base text-gray-600 mb-8">Have questions? We'd love to hear from you!</p>

          <div className="grid grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
              <a href={`mailto:${publicSettings?.contactEmail || 'support@acadintern.com'}`} className="text-sm text-primary hover:text-primary/80 transition-colors">
                {publicSettings?.contactEmail || 'support@acadintern.com'}
              </a>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
              <a href="tel:+1234567890" className="text-sm text-primary hover:text-primary/80 transition-colors">
                +1 (234) 567-890
              </a>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
              <p className="text-sm text-gray-600">Online Platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to Start Your Journey?</h2>
          <p className="text-base text-white/80 mb-6">
            Join thousands of students already finding their dream internships
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-primary px-7 py-2.5 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg inline-flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/internships"
              className="bg-transparent border-2 border-white text-white px-7 py-2.5 rounded-lg font-medium hover:bg-white hover:text-primary transition-all inline-flex items-center justify-center gap-2"
            >
              Browse Internships
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Link href="/" className="text-xl font-bold text-white hover:text-primary/80 transition-colors">
            {publicSettings?.siteName || 'AcadIntern'}
          </Link>
          <p className="mt-3 text-sm text-gray-400">
            © {new Date().getFullYear()} {publicSettings?.siteName || 'AcadIntern'}. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center gap-5">
            <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
