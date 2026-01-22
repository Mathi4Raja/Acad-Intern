"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const x = (clientX / innerWidth - 0.5) * 20;
            const y = (clientY / innerHeight - 0.5) * 20;
            const orbs = heroRef.current.querySelectorAll(".orb");
            orbs.forEach((orb, i) => {
                const factor = (i + 1) * 0.5;
                (orb as HTMLElement).style.transform = `translate(${x * factor}px, ${y * factor}px)`;
            });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const stats = [
        { value: "10K+", label: "Students" },
        { value: "500+", label: "Companies" },
        { value: "2K+", label: "Internships" },
        { value: "95%", label: "Success" },
    ];

    return (
        <section ref={heroRef} className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-40 pb-4 md:pb-8">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-background to-background" />
                <div className="orb absolute top-1/4 left-1/5 w-48 md:w-80 h-48 md:h-80 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-[80px] md:blur-[100px] animate-pulse-glow" />
                <div className="orb absolute bottom-1/3 right-1/5 w-40 md:w-96 h-40 md:h-96 rounded-full bg-gradient-to-br from-accent/15 to-accent/5 blur-[60px] md:blur-[120px] animate-pulse-glow delay-200" />

                {/* Floating decorative elements - hidden on mobile */}
                <div className="hidden md:block absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-primary/40 animate-float" />
                <div className="hidden md:block absolute top-1/3 left-1/3 w-2 h-2 rounded-full bg-accent/40 animate-float-slow delay-300" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
                <div className="text-center">
                    {/* Main Heading */}
                    <h1
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 md:mb-6 animate-fade-up opacity-0"
                        style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
                    >
                        Launch Your Career with
                        <br />
                        <span className="gradient-text">Top Internships</span>
                    </h1>

                    {/* Subtitle */}
                    <p
                        className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-10 leading-relaxed px-2 animate-fade-up opacity-0"
                        style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
                    >
                        Connect with leading companies and discover opportunities tailored to your skills.
                    </p>



                    {/* CTA Buttons */}
                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8 md:mb-14 animate-fade-up opacity-0"
                        style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
                    >
                        <Link href="/internships">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-sm md:text-base h-11 md:h-13 px-6 md:px-8 btn-glow shadow-lg shadow-primary/20"
                            >
                                Find Your Internship
                                <svg className="ml-2 w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto text-sm md:text-base h-11 md:h-13 px-6 md:px-8 border-2 border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
                            >
                                For Companies
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 lg:gap-8 max-w-3xl mx-auto animate-fade-up opacity-0"
                        style={{ animationDelay: "0.65s", animationFillMode: "forwards" }}
                    >
                        {stats.map((stat, i) => (
                            <div
                                key={i}
                                className="glass rounded-xl md:rounded-2xl px-3 md:px-6 py-3 md:py-5 card-hover cursor-default group"
                            >
                                <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-0.5 md:mb-1 group-hover:scale-105 transition-transform">
                                    {stat.value}
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
