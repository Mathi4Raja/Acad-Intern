"use client";

import { useEffect, useRef } from "react";

const features = [
    {
        icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
        title: "Smart Search",
        desc: "AI-powered matching for internships that fit your skills.",
        color: "from-blue-500/20 to-cyan-500/20",
    },
    {
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        title: "Verified Companies",
        desc: "All companies vetted for safe opportunities.",
        color: "from-green-500/20 to-emerald-500/20",
    },
    {
        icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
        title: "Real-time Alerts",
        desc: "Instant notifications for new opportunities.",
        color: "from-yellow-500/20 to-orange-500/20",
    },
    {
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
        title: "Track Progress",
        desc: "Monitor applications in one dashboard.",
        color: "from-purple-500/20 to-pink-500/20",
    },
    {
        icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
        title: "Skill Matching",
        desc: "Find roles where you'll thrive and grow.",
        color: "from-red-500/20 to-rose-500/20",
    },
    {
        icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
        title: "Direct Chat",
        desc: "Message recruiters instantly.",
        color: "from-indigo-500/20 to-violet-500/20",
    },
];

export function FeaturesSection() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("visible");
                }
            }),
            { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
        );
        ref.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <section id="features" ref={ref} className="py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-5 reveal">
                        Everything to <span className="gradient-text">Succeed</span>
                    </h2>
                    <p className="text-sm md:text-lg text-muted-foreground reveal px-2" style={{ transitionDelay: "100ms" }}>
                        All the tools to find, apply, and land your perfect internship.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-8">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="reveal group p-4 md:p-7 rounded-xl md:rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm card-hover relative overflow-hidden"
                            style={{ transitionDelay: `${i * 80}ms` }}
                        >
                            {/* Gradient bg on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center mb-3 md:mb-5 icon-float group-hover:bg-primary/15 transition-colors">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                                    </svg>
                                </div>
                                <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">{f.title}</h3>
                                <p className="text-xs md:text-base text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
