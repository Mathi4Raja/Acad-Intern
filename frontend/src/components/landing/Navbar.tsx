"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const closeMenu = () => setIsMobileMenuOpen(false);

    const handleLinkClick = (href: string) => {
        closeMenu();
        // Small delay to allow menu to close, then scroll
        setTimeout(() => {
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
    };

    const navLinks = [
        { href: "/#features", label: "Features" },
        { href: "/#how-it-works", label: "How It Works" },
        { href: "/internships", label: "Internships" },
        { href: "/#testimonials", label: "Testimonials" },
    ];

    return (
        <>
            {/* Overlay for closing menu on touch outside */}
            <div
                className={`fixed inset-0 z-40 md:hidden ${isMobileMenuOpen ? "" : "pointer-events-none"
                    }`}
                onClick={closeMenu}
                aria-hidden="true"
            />

            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                    ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-2 md:py-3"
                    : "bg-transparent py-2 md:py-5"
                    }`}
            >
                <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-6xl">
                    <div className="flex items-center justify-between h-10 md:h-14">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group" onClick={closeMenu}>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm md:text-base transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/25">
                                AI
                            </div>
                            <span className="text-lg md:text-xl font-semibold gradient-text hidden sm:block">
                                AcadIntern
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link, i) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-muted-foreground hover:text-foreground transition-all duration-300 text-sm font-medium relative group ${isMounted ? "animate-fade-in" : ""
                                        }`}
                                    style={{
                                        animationDelay: `${(i + 1) * 100}ms`,
                                        animationFillMode: "forwards",
                                        opacity: isMounted ? undefined : 0,
                                    }}
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
                                </Link>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div
                            className={`hidden md:flex items-center gap-4 ${isMounted ? "animate-fade-in" : ""
                                }`}
                            style={{
                                animationDelay: "500ms",
                                animationFillMode: "forwards",
                                opacity: isMounted ? undefined : 0,
                            }}
                        >
                            <Link href="/login">
                                <Button
                                    variant="ghost"
                                    className="text-sm font-medium h-10 px-4 hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="bg-primary hover:bg-primary/90 text-sm font-medium h-10 px-5 btn-glow">
                                    Get Started Free
                                </Button>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            <div className="w-5 h-4 relative flex flex-col justify-between">
                                <span
                                    className={`w-full h-0.5 bg-foreground rounded transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""
                                        }`}
                                />
                                <span
                                    className={`w-full h-0.5 bg-foreground rounded transition-all duration-300 ${isMobileMenuOpen ? "opacity-0 scale-0" : ""
                                        }`}
                                />
                                <span
                                    className={`w-full h-0.5 bg-foreground rounded transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""
                                        }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden transition-all duration-300 ease-out ${isMobileMenuOpen ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0"
                        } overflow-hidden`}
                >
                    <div className="bg-background border-b border-border px-3 py-4">
                        <div className="space-y-0.5">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block w-full text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3 py-2.5 rounded-md text-sm font-medium transition-all"
                                    onClick={closeMenu}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-border flex flex-col gap-2">
                            <Link href="/login" onClick={closeMenu}>
                                <Button variant="outline" className="w-full h-10 text-sm hover:bg-primary hover:text-primary-foreground transition-colors">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup" onClick={closeMenu}>
                                <Button className="w-full h-10 text-sm bg-primary">
                                    Get Started Free
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
