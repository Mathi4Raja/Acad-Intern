"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const internships = [
    {
        company: "TechFlow",
        // React Logo shape
        logo: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.2a9.78 9.78 0 019.8 9.8 9.78 9.78 0 01-9.8 9.8 9.78 9.78 0 019.8-9.8 9.78 9.78 0 01-9.8-9.8 9.78 9.78 0 019.8-9.8z" /></svg>),
        title: "Frontend Developer",
        location: "Remote",
        type: "Full-time",
        stipend: "₹25K/mo",
        skills: ["React", "TS"],
        isNew: true,
        gradient: "from-blue-500 to-cyan-500"
    },
    {
        company: "DataSync",
        // Database/Server shape
        logo: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 4.015 2 6.5S6.48 11 12 11s10-2.015 10-4.5S17.52 2 12 2zm0 11c-5.52 0-10 2.015-10 4.5S6.48 22 12 22s10-2.015 10-4.5S17.52 13 12 13z" /></svg>),
        title: "Data Science Intern",
        location: "Bangalore",
        type: "Full-time",
        stipend: "₹30K/mo",
        skills: ["Python", "ML"],
        isNew: true,
        gradient: "from-purple-500 to-pink-500"
    },
    {
        company: "CloudNine",
        // Cloud shape
        logo: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M18.5 6C15.86 6 13.62 7.84 12.87 10.3C12.59 10.2 12.3 10.16 12 10.16C8.13 10.16 5 13.29 5 17.16C5 21.03 8.13 24.16 12 24.16H18.5C21.54 24.16 24 21.7 24 18.66C24 15.68 21.61 13.25 18.67 13.17C18.62 9.17 15.35 6 18.5 6Z" transform="translate(0, -4)" /></svg>),
        title: "Backend Developer",
        location: "Hybrid",
        type: "Part-time",
        stipend: "₹20K/mo",
        skills: ["Node", "AWS"],
        isNew: false,
        gradient: "from-green-500 to-emerald-500"
    },
    {
        company: "DesignHub",
        // Palette/Design shape
        logo: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.86 16.86c-1.33 1.33-3.13 2.14-5.86 2.14-4.41 0-8-3.59-8-8s3.59-8 8-8c4.41 0 8 3.59 8 8 0 1.63-.51 3.15-1.39 4.41z" /></svg>),
        title: "UI/UX Designer",
        location: "Mumbai",
        type: "Full-time",
        stipend: "₹22K/mo",
        skills: ["Figma"],
        isNew: false,
        gradient: "from-orange-500 to-red-500"
    },
    {
        company: "SecureNet",
        // Shield/Security shape
        logo: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>),
        title: "Security Intern",
        location: "Delhi",
        type: "Full-time",
        stipend: "₹35K/mo",
        skills: ["Security"],
        isNew: true,
        gradient: "from-red-500 to-rose-500"
    },
    {
        company: "AIVerse",
        // Brain/AI shape
        logo: (<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /><circle cx="12" cy="12" r="3" /></svg>),
        title: "ML Engineer Intern",
        location: "Remote",
        type: "Full-time",
        stipend: "₹40K/mo",
        skills: ["PyTorch"],
        isNew: false,
        gradient: "from-indigo-500 to-violet-500"
    },
];

export function InternshipsSection() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
            { threshold: 0.05, rootMargin: "0px 0px -50px 0px" }
        );
        ref.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <section id="internships" ref={ref} className="py-10 md:py-16 lg:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-5 reveal">
                        Featured <span className="gradient-text">Internships</span>
                    </h2>
                    <p className="text-sm md:text-lg text-muted-foreground reveal px-2" style={{ transitionDelay: "100ms" }}>
                        Top opportunities from leading companies.
                    </p>
                </div>

                {/* Grid - Compact Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {internships.map((job, i) => (
                        <div
                            key={i}
                            className="reveal group flex flex-col bg-background/50 backdrop-blur-md border border-border/50 rounded-2xl p-4 md:p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden"
                            style={{ transitionDelay: `${i * 80}ms` }}
                        >
                            {/* Top: Logo & Badge */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${job.gradient} flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:rotate-3 transition-transform duration-300`}>
                                    {job.logo}
                                </div>
                                {job.isNew && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs">
                                        New
                                    </Badge>
                                )}
                            </div>

                            {/* Middle: Info */}
                            <div className="flex-grow">
                                <h3 className="text-base md:text-lg font-bold mb-0.5 group-hover:text-primary transition-colors duration-300">
                                    {job.title}
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium mb-3">
                                    {job.company}
                                </p>

                                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                    {job.skills.map((skill, j) => (
                                        <span key={j} className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-secondary">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom: Info Row & Action */}
                            <div className="pt-3 border-t border-dashed border-border/60 mt-auto flex items-center justify-between gap-3">
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Stipend</span>
                                    <span className="text-sm font-bold text-foreground">{job.stipend}</span>
                                </div>

                                <Button className="h-8 md:h-9 px-3 md:px-4 text-sm bg-primary hover:bg-primary/90 shadow-md transition-all duration-300">
                                    Apply Now
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>



                {/* View All Button */}
                <div className="text-center mt-12 md:mt-16 reveal" style={{ transitionDelay: "600ms" }}>
                    <Link href="/internships">
                        <Button variant="ghost" className="group text-muted-foreground hover:text-foreground hover:bg-transparent">
                            View All Opportunities
                            <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
