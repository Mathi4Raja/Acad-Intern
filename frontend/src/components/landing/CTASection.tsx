"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CTASection() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
            { threshold: 0.2 }
        );
        ref.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={ref} className="py-12 md:py-24 lg:py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.25)_100%)]" />

                {/* Floating particles - hidden on mobile */}
                <div className="hidden md:block absolute top-1/4 left-1/5 w-4 h-4 bg-white/20 rounded-full animate-float" />
                <div className="hidden md:block absolute top-2/3 left-1/4 w-3 h-3 bg-white/15 rounded-full animate-float-slow delay-200" />
                <div className="hidden md:block absolute top-1/3 right-1/5 w-5 h-5 bg-white/20 rounded-full animate-float-reverse delay-400" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 md:mb-5 reveal">
                    Ready to Start?
                </h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed reveal px-2" style={{ transitionDelay: "100ms" }}>
                    Join thousands of students already building their careers. Start today — it&apos;s free!
                </p>

                {/* Email Form */}
                <form className="flex flex-col sm:flex-row gap-2 md:gap-4 max-w-lg mx-auto mb-4 md:mb-8 reveal" style={{ transitionDelay: "200ms" }}>
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        className="flex-grow bg-white/15 border-white/25 text-white placeholder:text-white/60 h-11 md:h-13 px-4 md:px-6 text-sm md:text-base rounded-lg md:rounded-xl focus:border-white/50 focus:bg-white/20 transition-all"
                    />
                    <Button type="submit" size="lg" className="h-11 md:h-13 px-6 md:px-8 rounded-lg md:rounded-xl bg-white text-primary hover:bg-white/95 font-semibold text-sm md:text-base shadow-xl">
                        Get Started Free
                    </Button>
                </form>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 md:gap-x-8 gap-y-2 text-white/70 reveal" style={{ transitionDelay: "300ms" }}>
                    <span className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        No credit card
                    </span>
                    <span className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Free forever
                    </span>
                    <span className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        500+ companies
                    </span>
                </div>
            </div>
        </section>
    );
}
