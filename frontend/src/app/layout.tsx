import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { SocketProvider } from "@/lib/SocketContext";
import { Toaster } from 'react-hot-toast';

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "AcadIntern | Launch Your Career with Top Internships",
  description:
    "AcadIntern is the premier student-first internship platform connecting talented students with leading companies. Find your dream internship, build your skills, and kickstart your professional journey.",
  keywords: [
    "internship",
    "student jobs",
    "career development",
    "entry-level positions",
    "college internships",
    "tech internships",
  ],
  authors: [{ name: "AcadIntern Team" }],
  openGraph: {
    title: "AcadIntern | Launch Your Career with Top Internships",
    description:
      "Connect with leading companies and find your perfect internship opportunity.",
    type: "website",
    locale: "en_US",
    siteName: "AcadIntern",
  },
  twitter: {
    card: "summary_large_image",
    title: "AcadIntern | Launch Your Career with Top Internships",
    description:
      "Connect with leading companies and find your perfect internship opportunity.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans`} suppressHydrationWarning>
        <AuthProvider>
          <SocketProvider>
            <Toaster position="top-right" />
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
