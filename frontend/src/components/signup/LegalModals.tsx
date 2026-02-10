'use client'

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Scale, Shield, Database, Eye, Share2, Lock, Smartphone, ScrollText, ShieldCheck, AlertCircle, History, X, Mail } from 'lucide-react';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
}

export function LegalModals({ isOpen, onClose, type }: LegalModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 200);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const isTerms = type === 'terms';

    const termsSections = [
        {
            title: "1. Acceptance of Terms",
            icon: Scale,
            content: "By accessing or using AcadIntern, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site."
        },
        {
            title: "2. User Accounts",
            icon: ShieldCheck,
            content: "To access certain features of the platform, you must register for an account. You represent and warrant that all information you provide is accurate, current, and complete. You are responsible for maintaining the confidentiality of your account and password."
        },
        {
            title: "3. Platform Usage",
            icon: ScrollText,
            content: "AcadIntern provides a platform to connect students with companies for internship opportunities. Students may apply for internships, and companies may post and manage internship listings. We do not guarantee employment or the accuracy of listings."
        },
        {
            title: "4. Prohibited Activities",
            icon: AlertCircle,
            content: "Users are prohibited from: (a) posting false or misleading information; (b) harassing other users; (c) attempting to circumvent security measures; (d) using the platform for unauthorized commercial purposes; or (e) violating any intellectual property rights."
        },
        {
            title: "5. Intellectual Property",
            icon: History,
            content: "The platform and its original content, features, and functionality are and will remain the exclusive property of AcadIntern and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent."
        }
    ];

    const privacySections = [
        {
            title: "1. Information We Collect",
            icon: Database,
            content: "We collect information you provide directly to us when you create an account, including your name, email address, profile picture, education history (for students), and company details (for employers)."
        },
        {
            title: "2. How We Use Your Information",
            icon: Eye,
            content: "We use the information we collect to provide and improve our services, facilitate the internship application process, communicate with you, and personalize your experience on the platform."
        },
        {
            title: "3. Information Sharing",
            icon: Share2,
            content: "When students apply for an internship, we share their name, email, and profile details with the respective company. We do not sell your personal information to third parties."
        },
        {
            title: "4. Data Security",
            icon: Lock,
            content: "We implement robust security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. This includes encryption and secure server infrastructure."
        },
        {
            title: "5. Cookies & Tracking",
            icon: Smartphone,
            content: "We use cookies and similar tracking technologies to analyze platform usage and store your preferences. You can manage your cookie settings through your browser."
        }
    ];

    const sections = isTerms ? termsSections : privacySections;

    return (
        <div className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-500"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={cn(
                "relative bg-white rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden transform transition-all duration-300 border border-gray-100 flex flex-col",
                isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            )}>
                {/* Header */}
                <header className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border",
                            isTerms ? "bg-primary/10 text-primary border-primary/10" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/10"
                        )}>
                            {isTerms ? <Scale className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                                {isTerms ? "Legal Framework" : "Data Protection"}
                            </p>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">
                                {isTerms ? "Terms of Service" : "Privacy Policy"}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors active:scale-95"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                    {sections.map((section, idx) => (
                        <section key={idx} className="p-6 hover:bg-gray-50/30 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-500 border border-gray-200/50 shadow-sm">
                                    <section.icon className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[14px] font-bold text-gray-900 mb-1.5 leading-none uppercase tracking-wide">
                                        {section.title}
                                    </h3>
                                    <p className="text-[12px] text-gray-500 font-bold leading-relaxed">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </section>
                    ))}

                    <div className="p-6 bg-gray-50/40">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Additional Info</h4>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-[12px] font-bold text-gray-600">{isTerms ? "legal@acadintern.com" : "privacy@acadintern.com"}</span>
                            </div>
                            <div className="text-[12px] font-bold text-gray-400">
                                Last Updated: Feb 10, 2026
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className={cn(
                            "px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95",
                            isTerms ? "bg-primary hover:bg-primary/90 shadow-primary/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                        )}
                    >
                        Acknowledge & Close
                    </button>
                </footer>
            </div>
        </div>
    );
}
