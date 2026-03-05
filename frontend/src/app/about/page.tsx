'use client'

import Link from 'next/link'
import { Target, Users, Shield, TrendingUp, Award, CheckCircle, BookOpen, Sparkles, ArrowRight, Zap, Globe, Rocket } from 'lucide-react'
import { useSettings } from '@/lib/SettingsContext'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export default function AboutPage() {
  const { settings: publicSettings } = useSettings()



  const features = [
    {
      icon: Target,
      title: 'Advanced Precision Search',
      description: 'Filter opportunities by location, duration, stipend, skills, and work mode to find your perfect match instantly.',
      colSpan: 'col-span-1 md:col-span-2'
    },
    {
      icon: TrendingUp,
      title: 'Smart Application Tracking',
      description: 'Monitor your progress with a unified dashboard. See status updates, timelines, and automated follow-ups.',
      colSpan: 'col-span-1 md:col-span-2'
    },
    {
      icon: Users,
      title: 'Profile Insights',
      description: 'Understand how recruiters view you. See profile visits, skill demands, and personalized growth suggestions.',
      colSpan: 'col-span-1 md:col-span-2 lg:col-span-1'
    },
    {
      icon: Shield,
      title: 'Verified Companies',
      description: 'Every organization is vetted. Browse authentic reviews, hiring velocity, and workplace culture metrics safely.',
      colSpan: 'col-span-1 md:col-span-2 lg:col-span-2'
    },
    {
      icon: BookOpen,
      title: 'Unified Document Hub',
      description: 'Store resumes, certificates, and cover letters securely in one accessible place.',
      colSpan: 'col-span-1 md:col-span-2 lg:col-span-1'
    }
  ]

  const values = [
    {
      title: 'Student-Centric',
      description: 'We optimize for learning curves, not just placement numbers. Your growth is our north star.'
    },
    {
      title: 'Radical Transparency',
      description: 'No hidden ghosting. Clear communication loops from application to offer letter.'
    },
    {
      title: 'Curated Quality',
      description: 'We filter out the noise so you only see high-impact roles that accelerate your career.'
    },
    {
      title: 'Continuous Innovation',
      description: 'We harness modern tech to streamline the hiring workflow for both sides.'
    }
  ]

  const team = [
    {
      name: 'Mathiraja',
      role: 'Founder & Lead Engineer',
      description: 'Bridging the gap between academic theory and industry reality through elegant software.',
      initials: 'M'
    }
  ]

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30 selection:text-primary">
      {/* Ambient Background Grid */}
      <div className="fixed inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none -z-10" />
      <div className="fixed inset-0 flex justify-center pointer-events-none -z-10">
        <div className="w-full max-w-7xl h-full bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
      </div>

      <Navbar />

      <main className="pt-24 sm:pt-32 lg:pt-40 pb-16">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 md:mb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>Redefining Talent Discovery</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Connecting ambition with <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">real opportunities.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-fade-in max-w-2xl mx-auto" style={{ animationDelay: '200ms' }}>
              {publicSettings?.siteDescription || `${publicSettings?.siteName || 'AcadIntern'} is engineered to bridge the gap between academic environment and the modern workforce through transparent, high-quality internships.`}
            </p>
          </div>

          {/* Hero Image Collage */}
          <div className="mt-16 md:mt-20 grid grid-cols-12 grid-rows-2 gap-4 md:gap-6 h-[400px] md:h-[500px] animate-fade-in relative" style={{ animationDelay: '300ms' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-[2.5rem] -z-10 blur-3xl opacity-50" />

            <div className="col-span-12 md:col-span-4 row-span-1 md:row-span-2 rounded-[2rem] overflow-hidden relative shadow-lg group">
              <img src="/images/about/img1.jpg" alt="Students collaborating" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="col-span-6 md:col-span-8 row-span-1 rounded-[2rem] overflow-hidden relative shadow-lg group hidden md:block">
              <img src="/images/about/img2.jpg" alt="Modern workspace" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="col-span-6 md:col-span-4 row-span-1 rounded-[2rem] overflow-hidden relative shadow-lg group">
              <img src="/images/about/img3.jpg" alt="Event presentation" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="col-span-6 md:col-span-4 row-span-1 rounded-[2rem] overflow-hidden relative shadow-lg group">
              <img src="/images/about/img4.jpg" alt="Team meeting" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </section>

        {/* Mission Split Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 md:mb-32">
          <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-8 md:p-12 lg:p-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Built for the next generation of builders.</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  We believe that every driven student deserves access to quality work environments that accelerate their trajectory. The traditional hiring process is fragmented, opaque, and slow. We fix that.
                </p>
                <div className="space-y-4 pt-4 border-t border-gray-200/60">
                  {[
                    "Unified matching algorithms that prioritize skill over pedigree.",
                    "Direct communication channels without bureaucratic friction.",
                    "Continuous feedback loops to refine your professional profile."
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-green-500/10 p-1 rounded-full">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-10 hidden lg:flex justify-center">
                <div className="group relative w-full max-w-md aspect-square rounded-[2rem] border-8 border-white rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl overflow-hidden bg-gray-100">
                  <img src="/images/about/img5.jpg" alt="Interns collaborating" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2rem] pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 md:mb-32">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why {publicSettings?.siteName || 'AcadIntern'}?</h2>
            <p className="text-lg text-gray-600 mt-2">The architecture of your career foundation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 lg:grid-rows-2">
            {features.map((feature, i) => (
              <div key={i} className={`${feature.colSpan} group overflow-hidden bg-white border border-gray-100 rounded-3xl p-6 md:p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative flex flex-col justify-between`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full -z-10 transition-opacity group-hover:opacity-100 opacity-50" />
                <div>
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-gray-700">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team / Values Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 md:mb-32">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our DNA</h2>
              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                A set of non-negotiable principles that dictate how we operate, build product, and interact with our community.
              </p>

              <div className="space-y-8">
                {values.map((v, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                      0{i + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{v.title}</h4>
                      <p className="text-gray-600">{v.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <h2 className="text-2xl md:text-3xl font-bold mb-10 relative z-10">The Architect</h2>

              <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                {team.map((member, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/10 transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-2xl font-black mb-5 shadow-lg">
                      {member.initials}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary-foreground/70 text-sm font-medium mb-3 tracking-wide uppercase">{member.role}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{member.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-primary to-accent rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden shadow-xl shadow-primary/20">
            <div className="absolute inset-0 mix-blend-overlay opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <Rocket className="w-16 h-16 mx-auto mb-6 opacity-80 mix-blend-overlay" />
            <h2 className="text-3xl md:text-5xl font-bold mb-4 relative z-10">Ready to accelerate?</h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-10 relative z-10 font-medium">
              Join thousands of ambitious students securing exactly the right opportunities to start their careers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/signup" className="bg-white text-primary px-8 py-3.5 rounded-full font-bold hover:scale-105 hover:shadow-xl transition-all inline-flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/internships" className="bg-transparent border-2 border-white/20 hover:border-white/50 text-white px-8 py-3.5 rounded-full font-bold hover:bg-white/5 transition-all flex items-center justify-center">
                Browse Internships
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
