'use client'

import Link from 'next/link'
import { useSettings } from '@/lib/SettingsContext'

export default function TermsPage() {
    const { settings } = useSettings()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-xl sm:text-2xl font-bold text-primary hover:scale-105 transition-transform">
                            {settings?.siteName || 'AcadIntern'}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
                    <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <div className="prose max-w-none text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using {settings?.siteName || 'AcadIntern'} ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. User Accounts</h2>
                            <p>
                                When you create an account, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Use of the Platform</h2>
                            <p>
                                You agree to use the Platform only for lawful purposes related to seeking or offering internship opportunities. You must not:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>Post false, misleading, or deceptive information.</li>
                                <li>Use the Platform to distribute spam or unauthorized advertising.</li>
                                <li>Attempt to circumvent any security features of the Platform.</li>
                                <li>Harass, abuse, or harm other users.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Intellectual Property</h2>
                            <p>
                                All content and materials available on the Platform are protected by intellectual property rights. You may not use, reproduce, or distribute any content without proper authorization. User-submitted content remains the property of the respective users, who grant us a license to use it for the purposes of operating the Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Disclaimer of Warranties</h2>
                            <p>
                                The Platform is provided "as is" without any warranties, express or implied. We do not guarantee the accuracy of any internship listings or that you will find an internship through the Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
                            <p>
                                {settings?.siteName || 'AcadIntern'} shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use or inability to use the Platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Changes to Terms</h2>
                            <p>
                                We may modify these Terms at any time. We will notify you of any significant changes by posting the updated Terms on the Platform. Your continued use of the Platform after such changes constitutes your acceptance of the new Terms.
                            </p>
                        </section>

                        <section className="pt-6 border-t border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at: <a href={`mailto:${settings?.contactEmail || 'support@acadintern.com'}`} className="text-primary hover:underline">{settings?.contactEmail || 'support@acadintern.com'}</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8 mt-auto">
                <div className="max-w-7xl mx-auto text-center">
                    <Link href="/" className="text-xl font-bold text-white hover:text-primary/80 transition-colors">
                        {settings?.siteName || 'AcadIntern'}
                    </Link>
                    <p className="mt-3 text-sm text-gray-400">
                        © {new Date().getFullYear()} {settings?.siteName || 'AcadIntern'}. All rights reserved.
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
