"use client";

import { useEffect, useRef } from "react";

const steps = [
    {
        num: "01",
        title: "Create Profile",
        desc: "Sign up and build your professional profile with skills and resume.",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
        num: "02",
        title: "Discover",
        desc: "Browse internships or let our algorithm recommend matches.",
        icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    },
    {
        num: "03",
        title: "Apply",
        desc: "Submit applications with one click and track status.",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
        num: "04",
        title: "Get Hired",
        desc: "Land your dream role and kickstart your journey.",
        icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    },
];

export function HowItWorksSection() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
            { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
        );
        ref.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <section id="how-it-works" ref={ref} className="py-12 md:py-24 lg:py-32 bg-muted/40 relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-5 reveal">
                        How It <span className="gradient-text">Works</span>
                    </h2>
                    <p className="text-sm md:text-lg text-muted-foreground reveal px-2" style={{ transitionDelay: "100ms" }}>
                        Four simple steps to land your perfect internship.
                    </p>
                </div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection line - desktop only */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 -translate-y-1/2" />

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-6">
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                className="reveal relative"
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className="bg-card border border-border/60 rounded-xl md:rounded-2xl p-4 md:p-7 card-hover relative z-10 h-full group">
                                    {/* Step number badge */}
                                    <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs md:text-sm shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                                        {step.num}
                                    </div>

                                    {/* Icon */}
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary mb-3 md:mb-5 icon-float">
                                        <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                                        </svg>
                                    </div>

                                    <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">{step.title}</h3>
                                    <p className="text-xs md:text-base text-muted-foreground leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
