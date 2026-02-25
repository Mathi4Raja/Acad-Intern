'use client'

import { useState, useEffect, Suspense } from 'react'
import { Settings, Bell, Shield, Database, Mail, Users, Building2, Save, AlertCircle, CheckCircle, RotateCcw, AlertTriangle, FileText, Clock, IndianRupee, Activity, Key, Lock, ShieldAlert, RefreshCcw, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useSettings } from '@/lib/SettingsContext'

// Define types for settings
interface SettingsData {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  // Email Configuration
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  emailFrom: string;
  emailFromName: string;
  welcomeEmail: boolean;
  applicationStatusEmail: boolean;
  messageAlertEmail: boolean;
  reminderEmail: boolean;
  reportStatusEmail: boolean;
  passwordResetExpiry: number | string;
  passwordMinLength: number | string;
  sessionTimeout: number | string;
  maxLoginAttempts: number | string;
  timezone: string;
  autoApproveCompanies: boolean;
  requireCompanyVerification: boolean;
  maxInternshipPostsPerDay: number | string;
  maxApplicationsPerDay: number | string;
  allowResumeUpload: boolean;
  maxResumeSize: number | string;
  maxFileSize: number | string;
  maxMessageSize: number | string;
  // Notification Thresholds
  staleApplicationReminderDays: number | string;
  internshipClosingSoonDays: number | string;
  unreadMessageAlertCount: number | string;
  // Student Policies
  assessmentExpiryDays: number | string;
  // Data Retention
  expiredApplicationCleanupDays: number | string;
  autoBackup: boolean;
  backupFrequency: string;
  retentionDays: number | string;
  [key: string]: any;
}

const defaultSettings: SettingsData = {
  // General Settings
  siteName: 'AcadIntern',
  siteDescription: 'Student internship platform',
  contactEmail: 'support@acadintern.com',
  maintenanceMode: false,
  allowRegistration: true,

  // Email Settings
  smtpHost: 'smtp.gmail.com',
  smtpPort: '465',
  smtpUser: '',
  smtpPass: '',
  emailFrom: 'noreply@acadintern.com',
  emailFromName: 'AcadIntern',

  // Notification Settings
  welcomeEmail: true,
  applicationStatusEmail: true,
  messageAlertEmail: true,
  reminderEmail: true,
  reportStatusEmail: true,
  staleApplicationReminderDays: 5,
  internshipClosingSoonDays: 1,
  unreadMessageAlertCount: 3,

  // Security Settings
  timezone: 'Asia/Kolkata',
  requireEmailVerification: true,
  passwordResetExpiry: 60,
  passwordMinLength: 8,
  sessionTimeout: 24,
  maxLoginAttempts: 5,

  // Company Settings
  autoApproveCompanies: false,
  requireCompanyVerification: true,
  maxInternshipPostsPerDay: 10,

  // Student Settings
  maxApplicationsPerDay: 30,
  allowResumeUpload: true,
  maxResumeSize: 2,
  maxFileSize: 5,
  maxMessageSize: 15,
  assessmentExpiryDays: 7,

  // Database Settings
  autoBackup: true,
  backupFrequency: 'daily',
  retentionDays: 30,
  expiredApplicationCleanupDays: 7
}

function AdminSettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = searchParams.get('tab') || 'general';
  const { refreshSettings } = useSettings();

  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [initialSettings, setInitialSettings] = useState<SettingsData>(defaultSettings)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await adminApi.getSettings();
        if (response.data.data) {
          const merged = { ...defaultSettings, ...response.data.data };
          setSettings(merged);
          setInitialSettings(merged);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false)
      }
    };
    fetchSettings();
  }, []);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleTabChange = (tabId: string) => {
    // If dirty, maybe warn user? For now just switch.
    // Ideally we'd warn if unsaved changes.
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.replace(`?${params.toString()}`)
  }

  const handleSave = async () => {
    if (!isDirty) return;

    setSaveStatus('saving')
    try {
      await adminApi.updateSettings(settings);
      setSaveStatus('saved')
      setInitialSettings(settings) // Update baseline
      await refreshSettings() // Sync global context
      toast.success('Settings saved successfully')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error')
      toast.error('Failed to save settings')
    }
  }

  const handleReset = () => {
    setSettings(initialSettings);
    toast.success('Changes discarded');
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'email', label: 'Email', icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 'security', label: 'Security', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'companies', label: 'Companies', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'students', label: 'Students', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'files', label: 'Files', icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'database', label: 'Storage & Backups', icon: Database, color: 'text-orange-600', bg: 'bg-orange-50' }
  ]

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50/50"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
  }

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl p-2.5 sm:p-3 shadow-sm shadow-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative group/header mb-4">
          {/* Background Glow Effect */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover/header:bg-primary/10 transition-colors duration-700" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover/header:bg-blue-500/10 transition-colors duration-700" />

          <div className="relative flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover/header:scale-110 group-hover/header:rotate-6 transition-all duration-500 shadow-lg shadow-gray-200">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-blue-500 border-2 border-white flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <div>
              <h1 className="text-[15px] font-black text-gray-900 leading-none tracking-tight uppercase">
                Global Settings
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Configure system-wide settings and security
                </p>
                <div className="h-1 w-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Settings Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 relative z-10 w-full sm:w-auto">
            <button
              onClick={handleReset}
              disabled={!isDirty || saveStatus === 'saving'}
              className="px-4 py-2 border border-gray-200 bg-white text-gray-600 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
              <RotateCcw size={12} />
              DISCARD
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || saveStatus === 'saving'}
              className={cn(
                "px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20",
                saveStatus === 'saved' ? "bg-green-500 text-white" : "bg-primary text-white hover:scale-105 active:scale-95"
              )}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="animate-spin w-3.5 h-3.5" />
                  SAVING...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  SAVED
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  SAVE CONFIG
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden sticky top-5">
              <div className="p-3 border-b border-gray-50 bg-gray-50/30">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Configuration</p>
              </div>
              <nav className="p-1 grid grid-cols-2 lg:flex lg:flex-col gap-1 sm:gap-0.5">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded-xl transition-all group relative",
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20 z-10"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                        isActive ? "bg-white/20" : cn(tab.bg, tab.color)
                      )}>
                        <Icon size={16} />
                      </div>
                      <span className="text-[13px] font-bold">{tab.label}</span>
                      {isActive && (
                        <div className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Settings Canvas */}
          <div className="lg:col-span-9 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 min-h-[480px] relative transition-all duration-500">

              {/* Tab Title Decor */}
              <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none">
                {(() => {
                  const Icon = tabs.find(t => t.id === activeTab)?.icon || Settings
                  return <Icon size={100} />
                })()}
              </div>

              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h2 className="text-[17px] font-black text-gray-900 leading-tight">Platform Branding</h2>
                    <p className="text-[12px] text-gray-500 font-bold">Define how the platform presents itself to the world</p>
                  </header>

                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12} className="text-primary" />
                        Platform Branding Name
                      </label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="w-full max-w-md px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-[13px] text-gray-900"
                        placeholder="e.g. AcadIntern"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} className="text-primary" />
                        Meta Description
                      </label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                        rows={3}
                        className="w-full max-w-xl px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-[13px] text-gray-900"
                        placeholder="What is this platform about?"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Mail size={12} className="text-primary" />
                        Primary Contact / Support
                      </label>
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                        className="w-full max-w-md px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-[13px] text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="pt-8 mt-8 border-t border-gray-50">
                    <h3 className="text-[13px] font-black text-red-600 uppercase tracking-[2px] mb-4">Critical Overrides</h3>
                    <div className="grid gap-4">
                      <div className="bg-red-50/30 border border-red-100 rounded-2xl p-3.5 flex items-center justify-between group hover:bg-red-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm border border-red-200">
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-red-900">Maintenance Mode</p>
                            <p className="text-[11px] text-red-600/70 font-bold">Killswitch for all non-admin traffic</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", settings.maintenanceMode ? "text-red-600" : "text-gray-400")}>
                            {settings.maintenanceMode ? "ON" : "OFF"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settings.maintenanceMode}
                              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-red-200/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between group hover:border-gray-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shadow-sm border border-gray-200">
                            <Users size={18} />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-900">Registration Status</p>
                            <p className="text-[11px] text-gray-500 font-bold">Lock or unlock new user onboarding</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", settings.allowRegistration ? "text-primary" : "text-gray-400")}>
                            {settings.allowRegistration ? "ON" : "OFF"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settings.allowRegistration}
                              onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Settings */}
              {activeTab === 'email' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h2 className="text-[17px] font-black text-gray-900 mb-1 leading-tight tracking-tight uppercase group flex items-center gap-2">
                      Email System Configuration
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    </h2>
                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Activity size={12} className="text-primary" />
                      Mailing Infrastructure & Automated Outbound Routing
                    </p>
                  </header>

                  <div className="grid gap-4">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Sender Profile</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Users size={12} />
                            Sender Name
                          </label>
                          <input
                            type="text"
                            value={settings.emailFromName}
                            onChange={(e) => setSettings({ ...settings, emailFromName: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[14px] shadow-sm"
                            placeholder="AcadIntern"
                          />
                          <p className="text-[10px] text-gray-400 font-bold mt-1 italic">Display name for all dispatches</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Mail size={12} />
                            Verified Sender Identity
                          </label>
                          <input
                            type="email"
                            value={settings.emailFrom}
                            onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[14px] shadow-sm"
                            placeholder="noreply@domain.com"
                          />
                          <p className="text-[10px] text-gray-400 font-bold mt-1 italic">Email address used as sender</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      {/* SMTP - Final Fallback Logic */}
                      <div className="space-y-4 relative group">
                        <div className="bg-white p-4 rounded-3xl border border-gray-100 transition-all hover:border-amber-500/20 hover:shadow-xl hover:shadow-amber-500/5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-100/30 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm transition-transform group-hover:scale-110">
                                <Database size={18} />
                              </div>
                              <div>
                                <h3 className="text-[14px] font-black text-gray-900">Gmail SMTP</h3>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest">Universal Fallback</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50 mb-2">
                              <div className="flex gap-2">
                                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-700 font-bold leading-relaxed italic">
                                  Emergency failover provider. Used automatically if the primary engine (Resend) is unavailable.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">SMTP Host</label>
                                <input
                                  type="text"
                                  value={settings.smtpHost}
                                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                  placeholder="smtp.gmail.com"
                                  className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold text-gray-900 text-[12px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Port</label>
                                <input
                                  type="text"
                                  value={settings.smtpPort}
                                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                                  placeholder="465"
                                  className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold text-gray-900 text-[12px]"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gmail / User</label>
                                <input
                                  type="text"
                                  value={settings.smtpUser}
                                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                                  placeholder="user@gmail.com"
                                  className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-bold text-gray-900 text-[12px]"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center justify-between">
                                  App Password
                                  <Shield size={12} className="text-gray-300" />
                                </label>
                                <input
                                  type="password"
                                  value={settings.smtpPass}
                                  onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                                  placeholder="xxxx xxxx xxxx xxxx"
                                  className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono text-[11px] font-bold text-gray-900"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resend - Primary Logic */}
                      <div className="space-y-4 relative group">
                        <div className="bg-white p-4 rounded-3xl border border-gray-100 transition-all hover:border-orange-500/20 hover:shadow-xl hover:shadow-orange-500/5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-orange-100/30 flex items-center justify-center text-orange-600 border border-orange-100 shadow-sm transition-transform group-hover:scale-110">
                                <Activity size={18} />
                              </div>
                              <div>
                                <h3 className="text-[14px] font-black text-gray-900">Resend</h3>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                  <p className="text-[10px] text-orange-600 font-extrabold uppercase tracking-widest">Primary Dispatch</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] bg-orange-50 text-orange-600/70 px-2 py-1 rounded-lg font-black uppercase tracking-widest border border-orange-100">ENV Secure</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50 mb-2">
                              <div className="flex gap-2">
                                <CheckCircle size={14} className="text-orange-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-orange-700 font-bold leading-relaxed italic">
                                  Core engine for all system dispatches. High-speed delivery via specialized API.
                                </p>
                              </div>
                            </div>

                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed flex items-center justify-center gap-2">
                              <Shield size={14} className="text-gray-400" />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Enforced Configuration</span>
                            </div>

                            <p className="text-[10px] text-gray-400 font-bold text-center leading-relaxed">
                              Credentials updated via server environment variables for maximum security.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h2 className="text-[17px] font-black text-gray-900 mb-1 leading-tight">Notifications</h2>
                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide">Delivery Settings</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'welcomeEmail', label: 'Welcome & Verification', desc: 'Onboarding & account activation', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
                      { key: 'applicationStatusEmail', label: 'Application Status Updates', desc: 'Shortlisted, Selected, Rejected & Interview alerts', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { key: 'messageAlertEmail', label: 'Message Alerts', desc: 'Unread message warnings', icon: Bell, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { key: 'reportStatusEmail', label: 'Report Status Updates', desc: 'Notify reporters when their report is resolved', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
                      { key: 'reminderEmail', label: 'System Reminders', desc: 'Automated nudges for pending applications & deadlines', icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50' }
                    ].map((item) => (
                      <div key={item.key} className="p-3.5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm border border-transparent group-hover:border-white", item.bg, item.color)}>
                            <item.icon size={18} />
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-900 leading-tight">{item.label}</p>
                            <p className="text-[11px] text-gray-500 font-bold mt-0.5 opacity-80">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            settings[item.key as keyof SettingsData] ? item.color : "text-gray-300"
                          )}>
                            {settings[item.key as keyof SettingsData] ? "ON" : "OFF"}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settings[item.key as keyof SettingsData]}
                              onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className={cn(
                              "w-11 h-6 bg-gray-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all",
                              item.key === 'welcomeEmail' ? "peer-checked:bg-orange-600" :
                                item.key === 'applicationStatusEmail' ? "peer-checked:bg-emerald-600" :
                                  item.key === 'messageAlertEmail' ? "peer-checked:bg-indigo-600" :
                                    item.key === 'reportStatusEmail' ? "peer-checked:bg-red-600" :
                                      "peer-checked:bg-cyan-600"
                            )}></div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notification Thresholds */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-[13px] font-black text-gray-900 mb-3 flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      Reminders & Thresholds
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: 'staleApplicationReminderDays', label: 'Stale Application Reminder', unit: 'DAYS' },
                        { key: 'internshipClosingSoonDays', label: 'Internship Closing Soon', unit: 'DAYS' },
                        { key: 'unreadMessageAlertCount', label: 'Unread Message Alert', unit: 'MSGS' }
                      ].map((f) => (
                        <div key={f.key} className="space-y-1.5 p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{f.label}</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={(settings[f.key as keyof typeof settings] as number | string) || ''}
                              onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value === '' ? '' : parseInt(e.target.value) })}
                              className="w-full pr-12 pl-1 py-1 bg-transparent border-none focus:ring-0 font-black text-gray-900 text-[18px]"
                            />
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">{f.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h2 className="text-[17px] font-black text-gray-900 mb-1 leading-tight">Access & Security</h2>
                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide">Infrastructure Guard & Access Policies</p>
                  </header>

                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3.5 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-gray-900 leading-tight">Enforced Email Verification</p>
                        <p className="text-[11px] text-primary font-bold">Mandatory identity check</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!settings.requireEmailVerification}
                        onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-gray-900 leading-tight">System Timezone</p>
                        <p className="text-[11px] text-gray-500 font-bold">Global scheduling reference</p>
                      </div>
                    </div>
                    <select
                      value={settings.timezone || 'Asia/Kolkata'}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="UTC">UTC (Universal)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Europe/Paris">Europe/Paris (CET)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'passwordMinLength', label: 'Min. Password Length', unit: 'CHARS', icon: Lock },
                      { key: 'maxLoginAttempts', label: 'Max Login Attempts', unit: 'LOGINS', icon: ShieldAlert },
                      { key: 'sessionTimeout', label: 'Session Duration', unit: 'MINS', icon: Clock },
                      { key: 'passwordResetExpiry', label: 'Reset Link Expiry', unit: 'MINS', icon: RefreshCcw }
                    ].map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <f.icon size={12} className="text-primary" />
                          {f.label}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={(settings[f.key as keyof typeof settings] as number | string) || ''}
                            onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[13px]"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">{f.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company & Student Logic Abstraction into Cards */}
              {['companies', 'students'].includes(activeTab) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h2 className="text-[17px] font-black text-gray-900 mb-1 leading-tight">{activeTab === 'companies' ? 'Company Policies' : 'Student Policies'}</h2>
                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide">{activeTab === 'companies' ? 'Enterprise Operations' : 'Talent Ecosystem Interaction'}</p>
                  </header>

                  <div className="grid gap-4">
                    {activeTab === 'companies' ? (
                      <>
                        <div className="p-3.5 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
                              <CheckCircle size={18} />
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-emerald-900 leading-tight">Auto-Approve Companies</p>
                              <p className="text-[11px] text-emerald-600 font-bold tracking-tight">Zero-touch company onboarding</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settings.autoApproveCompanies}
                              onChange={(e) => setSettings({ ...settings, autoApproveCompanies: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-emerald-200/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                        <div className="p-3.5 bg-blue-50/30 border border-blue-100 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                              <ShieldCheck size={18} />
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-blue-900 leading-tight">Enforced Company Verification</p>
                              <p className="text-[11px] text-blue-600 font-bold tracking-tight">Only verified companies can post</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settings.requireCompanyVerification}
                              onChange={(e) => setSettings({ ...settings, requireCompanyVerification: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-blue-200/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        </div>
                        <div className="max-w-xs space-y-1">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Max Internship Posts (Per Day)</label>
                          <input
                            type="number"
                            value={settings.maxInternshipPostsPerDay || ''}
                            onChange={(e) => setSettings({ ...settings, maxInternshipPostsPerDay: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[13px]"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3.5 bg-indigo-50/30 border border-indigo-100 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-[13px] font-black text-indigo-900 leading-tight">Resume Upload Support</p>
                              <p className="text-[11px] text-indigo-600 font-bold tracking-widest">Enable student CV/Resume repository</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!settings.allowResumeUpload}
                              onChange={(e) => setSettings({ ...settings, allowResumeUpload: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-indigo-200/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                          </label>
                        </div>
                        <div className="max-w-xs space-y-1">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Max Application Limit (Per Day)</label>
                          <input
                            type="number"
                            value={settings.maxApplicationsPerDay || ''}
                            onChange={(e) => setSettings({ ...settings, maxApplicationsPerDay: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[13px]"
                          />
                        </div>

                        {/* Student Policies */}
                        <div className="pt-4 border-t border-gray-100">
                          <h3 className="text-[13px] font-black text-gray-900 mb-3 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-gray-400" />
                            Application Policies
                          </h3>
                          <div className="space-y-1 cursor-help group" title="Applications in 'Shortlisted' (Assessment) stage will expire if left incomplete for this many days.">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block">Assessment Expiry Delay</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={settings.assessmentExpiryDays || ''}
                                onChange={(e) => setSettings({ ...settings, assessmentExpiryDays: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                className="w-32 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[13px]"
                              />
                              <span className="text-[11px] font-black text-gray-400">DAYS</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold italic mt-1">Automatic expiration for incomplete assessments</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Files Management */}
              {activeTab === 'files' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h2 className="text-[17px] font-black text-gray-900 mb-1 leading-tight">File Upload Settings</h2>
                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide">Asset Quotas & System Limits</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'maxResumeSize', label: 'Resume Repository' },
                      { key: 'maxFileSize', label: 'Global File Limit' },
                      { key: 'maxMessageSize', label: 'Message Attachments' }
                    ].map((f) => (
                      <div key={f.key} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-primary/20 transition-all">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{f.label}</label>
                        <div className="flex items-end gap-1.5">
                          <input
                            type="number"
                            value={(settings[f.key as keyof typeof settings] as number | string) || ''}
                            onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 w-full text-lg font-black text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                          <span className="text-[12px] font-black text-gray-400 mb-2">MB</span>
                        </div>
                        <div className={`h-1 w-full bg-gray-200 rounded-full mt-3 overflow-hidden`}>
                          <div className={`h-full bg-primary w-[40%] group-hover:w-[60%] transition-all duration-700 opacity-60`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Database & Infrastructure */}
              {activeTab === 'database' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <header>
                    <h2 className="text-[17px] font-black text-gray-900 mb-1 leading-tight">System Backups</h2>
                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wide">Data Recovery Policies</p>
                  </header>
                  <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200 shadow-sm transition-transform group-hover:scale-105">
                        <Database size={20} />
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-orange-900">Enable Automated Backups</p>
                        <p className="text-[11px] text-orange-700 font-bold opacity-70 tracking-tight">Create periodic snapshots to prevent data loss</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-100">
                      <input
                        type="checkbox"
                        checked={!!settings.autoBackup}
                        onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-5.5 bg-orange-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[3px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Backup Schedule</label>
                      <select
                        value={settings.backupFrequency}
                        onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[13px]"
                      >
                        <option value="hourly">Every Hour</option>
                        <option value="daily">Daily Snapshot</option>
                        <option value="weekly">Weekly Routine</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Retention Period</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={settings.retentionDays || ''}
                          onChange={(e) => setSettings({ ...settings, retentionDays: e.target.value === '' ? '' : parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[13px]"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">DAYS</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Policy */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-[13px] font-black text-gray-900 mb-3 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-gray-400" />
                      Data Retention
                    </h3>
                    <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[13px] font-black text-gray-900 leading-tight">Automatic Application Cleanup</p>
                          <p className="text-[11px] text-gray-500 font-bold">Automatically remove application records after a set duration</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={settings.expiredApplicationCleanupDays || ''}
                            onChange={(e) => setSettings({ ...settings, expiredApplicationCleanupDays: e.target.value === '' ? '' : parseInt(e.target.value) })}
                            className="w-24 px-3 py-2 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-900 text-[13px]"
                          />
                          <span className="text-[11px] font-black text-gray-400">DAYS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dirty State Indicator */}
              {isDirty && (
                <div className="mt-6 p-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between group animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <div className="animate-spin text-primary">
                      <Settings size={16} />
                    </div>
                    <p className="text-[12px] font-bold text-primary">Configuration delta detected. Save to persist.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div >
  )
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center min-h-screen bg-gray-50 items-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <AdminSettingsContent />
    </Suspense>
  )
}
