'use client'

import Link from 'next/link'
import { useSettings } from '@/lib/SettingsContext'

export default function PrivacyPage() {
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
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                    <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <div className="prose max-w-none text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
                            <p>
                                At {settings?.siteName || 'AcadIntern'}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Personal Information</h3>
                            <p>
                                We may collect personal information that you voluntarily provide to us when you register on the Platform, express an interest in obtaining information about us or our products and services, or otherwise contact us. This includes:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>Name and Contact Data (email address, phone number).</li>
                                <li>Credentials (passwords and similar security information used for authentication).</li>
                                <li>Profile Data (resume, education history, skills, experience).</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Automatically Collected Information</h3>
                            <p>
                                We automatically collect certain information when you visit, use, or navigate the Platform. This information does not reveal your specific identity but may include device and usage information, such as your IP address, browser and device characteristics, operating system, and language preferences.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
                            <p>
                                We use personal information collected via our Platform for a variety of business purposes described below:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>To facilitate account creation and logon process.</li>
                                <li>To provide and manage the services (e.g., matching students with internships).</li>
                                <li>To communicate with you regarding your account, applications, or platform updates.</li>
                                <li>To protect our Platform and ensure its security.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Sharing Your Information</h2>
                            <p>
                                We may share your information with third parties in the following situations:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>With Employers: When you apply for an internship, your profile and application details are shared with the respective company.</li>
                                <li>With Service Providers: We may share your data with third-party vendors who perform services for us (e.g., hosting, analytics, customer service).</li>
                                <li>For Legal Reasons: If required by law or to protect our rights, safety, or property.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
                            <p>
                                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Privacy Rights</h2>
                            <p>
                                You may review, change, or terminate your account at any time. Depending on your region, you may also have specific rights regarding access to and control over your personal data.
                            </p>
                        </section>

                        <section className="pt-6 border-t border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
                            <p>
                                If you have questions or comments about this policy, you may email us at: <a href={`mailto:${settings?.contactEmail || 'support@acadintern.com'}`} className="text-primary hover:underline">{settings?.contactEmail || 'support@acadintern.com'}</a>.
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
