"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { internshipsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export function InternshipsSection() {
    const ref = useRef<HTMLDivElement>(null);
    const [internships, setInternships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const DefaultCompanyLogo = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-7 md:h-7">
            <path d="M3 21h18" />
            <path d="M9 8h1" /><path d="M9 12h1" /><path d="M9 16h1" />
            <path d="M14 8h1" /><path d="M14 12h1" /><path d="M14 16h1" />
            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        </svg>
    );

    const gradients = [
        "from-blue-500 to-cyan-500",
        "from-purple-500 to-pink-500",
        "from-green-500 to-emerald-500",
        "from-orange-500 to-red-500",
        "from-red-500 to-rose-500",
        "from-indigo-500 to-violet-500"
    ];

    useEffect(() => {
        const fetchPopularInternships = async () => {
            try {
                const response = await internshipsApi.getPopular(6);
                setInternships(response.data.data);
            } catch (error) {
                console.error("Failed to fetch popular internships", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPopularInternships();
    }, []);

    useEffect(() => {
        if (loading) return;
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
            { threshold: 0.05, rootMargin: "0px 0px -50px 0px" }
        );
        ref.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [loading, internships]);

    return (
        <section id="internships" ref={ref} className="py-10 md:py-16 lg:py-20 scroll-mt-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-5 reveal">
                        Featured <span className="gradient-text">Internships</span>
                    </h2>
                    <p className="text-sm md:text-lg text-muted-foreground reveal px-2" style={{ transitionDelay: "100ms" }}>
                        Top opportunities from leading companies based on student applications.
                    </p>
                </div>

                {/* Grid - Compact Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {loading ? (
                        // Loading Skeletons
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="flex flex-col bg-background/50 border border-border/50 rounded-2xl p-4 md:p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
                                    <Skeleton className="h-5 w-12 rounded-full" />
                                </div>
                                <Skeleton className="h-6 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2 mb-4" />
                                <div className="flex gap-2 mb-4">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <div className="pt-3 border-t border-dashed border-border/60 mt-auto flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <Skeleton className="h-3 w-12" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                    <Skeleton className="h-9 w-24" />
                                </div>
                            </div>
                        ))
                    ) : (
                        internships.map((job, i) => {
                            const gradient = gradients[i % gradients.length];
                            // Consider it new if created within the last 7 days
                            const isNew = new Date(job.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;


                            return (
                                <div
                                    key={job._id || i}
                                    className="reveal group flex flex-col bg-background/50 backdrop-blur-md border border-border/50 rounded-2xl p-4 md:p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl overflow-hidden"
                                    style={{ transitionDelay: `${i * 80}ms` }}
                                >
                                    {/* Top: Logo & Badge */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:rotate-3 transition-transform duration-300 overflow-hidden`}>
                                            {job.companyId?.logo ? (
                                                <img src={job.companyId.logo} alt={job.companyId.companyName} className="w-full h-full object-cover bg-white" />
                                            ) : (
                                                <DefaultCompanyLogo />
                                            )}
                                        </div>
                                        {isNew && (
                                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs">
                                                New
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Middle: Info */}
                                    <div className="flex-grow">
                                        <h3 className="text-base md:text-lg font-bold mb-0.5 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                                            {job.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            <p className="text-sm text-muted-foreground font-medium line-clamp-1">
                                                {job.companyId?.companyName || "Anonymous Company"}
                                            </p>
                                            {job.companyId?.verified && (
                                                <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                            {job.skillsRequired?.slice(0, 3).map((skill: string, j: number) => (
                                                <span key={j} className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-secondary">
                                                    {skill}
                                                </span>
                                            ))}
                                            {job.skillsRequired?.length > 3 && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground border border-secondary">
                                                    +{job.skillsRequired.length - 3}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center text-xs text-muted-foreground gap-3 mb-2">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {job.location || job.mode}
                                            </span>
                                            {job.applicationCount > 0 && (
                                                <span className="flex items-center gap-1 text-primary">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                    {job.applicationCount} Applicants
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom: Info Row & Action */}
                                    <div className="pt-3 border-t border-dashed border-border/60 mt-auto flex items-center justify-between gap-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Stipend</span>
                                            <span className="text-sm font-bold text-foreground">
                                                {job.stipend > 0 ? `₹${job.stipend.toLocaleString()}/mo` : "Unpaid"}
                                            </span>
                                        </div>

                                        <Link href={`/internships/${job._id}`}>
                                            <Button className="h-8 md:h-9 px-3 md:px-4 text-sm bg-primary hover:bg-primary/90 shadow-md transition-all duration-300">
                                                Apply Now
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
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
