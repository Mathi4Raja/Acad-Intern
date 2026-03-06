
'use client'

import Link from 'next/link'
import { Settings, Wrench, Clock, Lock, ArrowLeft, RefreshCw } from 'lucide-react'
import { useSettings } from '@/lib/SettingsContext'

export default function MaintenancePage() {
    const { settings, refreshSettings } = useSettings()

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="max-w-2xl w-full text-center space-y-8 p-12 bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden group">
                <div className="absolute top-6 left-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                        <span className="font-semibold text-[10px] uppercase tracking-wider">Back to Home</span>
                    </Link>
                </div>

                {/* Decorative Background Glows */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />

                {/* Icon Header */}
                <div className="relative flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center shadow-xl shadow-slate-900/20 transform group-hover:rotate-[5deg] transition-all duration-700">
                            <Settings className="w-12 h-12 text-white animate-[spin_8s_linear_infinite]" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary flex items-center justify-center border-4 border-white shadow-lg">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-[900] text-slate-900 tracking-tight">
                        SYSTEM UPGRADE IN PROGRESS
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                        {settings?.siteName || 'AcadIntern'} is currently undergoing scheduled maintenance. We're polishing things up for you!
                    </p>
                </div>

                {/* Status Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                            <p className="text-[13px] font-bold text-slate-900 leading-none">Maintenance</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                            <Lock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Access</p>
                            <p className="text-[13px] font-bold text-slate-900 leading-none">Dashboard Locked</p>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => refreshSettings()}
                        className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[2px] shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group/btn"
                    >
                        <RefreshCw className="w-4 h-4 group-active/btn:animate-spin" />
                        CHECK STATUS
                    </button>
                    <Link
                        href="/login"
                        className="px-8 py-3.5 bg-white text-slate-600 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-[2px] shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Lock className="w-4 h-4" />
                        ADMIN LOGIN
                    </Link>
                </div>

                {/* Footer Info */}
                <div className="pt-8 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Thank you for your patience
                    </p>
                </div>
            </div>
        </div>
    )
}
