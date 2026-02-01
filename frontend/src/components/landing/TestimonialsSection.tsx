"use client";

import { useEffect, useRef, useState, TouchEvent } from "react";

const testimonials = [
    { name: "Priya S.", role: "SDE @ Google", avatar: "PS", text: "AcadIntern helped me land my dream internship. The matching was spot-on!", gradient: "from-blue-500 to-cyan-500" },
    { name: "Rahul V.", role: "Analyst @ Microsoft", avatar: "RV", text: "The skill matching connected me with perfect opportunities.", gradient: "from-purple-500 to-pink-500" },
    { name: "Ananya P.", role: "Designer @ Flipkart", avatar: "AP", text: "Seamless experience from application to acceptance!", gradient: "from-green-500 to-emerald-500" },
    { name: "Karthik R.", role: "MLE @ Amazon", avatar: "KR", text: "Found an amazing internship within my first week!", gradient: "from-orange-500 to-red-500" },
];

export function TestimonialsSection() {
    const [current, setCurrent] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    // Minimum swipe distance required (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Swipe left = next
            setCurrent((p) => (p + 1) % testimonials.length);
        } else if (isRightSwipe) {
            // Swipe right = previous
            setCurrent((p) => (p - 1 + testimonials.length) % testimonials.length);
        }
    };

    // Auto-rotate (paused on touch)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((p) => (p + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
            { threshold: 0.1 }
        );
        ref.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <section id="testimonials" ref={ref} className="py-10 md:py-16 lg:py-20 bg-muted/40 relative overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-5 reveal">
                        What Students <span className="gradient-text">Say</span>
                    </h2>
                    <p className="text-sm md:text-lg text-muted-foreground reveal px-2" style={{ transitionDelay: "100ms" }}>
                        Join thousands who launched their careers.
                    </p>
                </div>

                {/* Mobile Carousel (Swipeable) */}
                <div className="md:hidden reveal">
                    <div
                        className="relative overflow-hidden rounded-xl touch-pan-y"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${current * 100}%)` }}
                        >
                            {testimonials.map((t, i) => (
                                <div key={i} className="w-full flex-shrink-0 px-1">
                                    <TestimonialCard t={t} compact />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dots + Swipe hint */}
                    <div className="flex flex-col items-center gap-2 mt-4">
                        <div className="flex justify-center gap-1.5">
                            {testimonials.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-primary" : "w-1.5 bg-border"
                                        }`}
                                    aria-label={`Go to testimonial ${i + 1}`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Swipe to see more</p>
                    </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {testimonials.map((t, i) => (
                        <div key={i} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                            <TestimonialCard t={t} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TestimonialCard({ t, compact = false }: { t: typeof testimonials[0]; compact?: boolean }) {
    return (
        <div className={`h-full ${compact ? "p-3" : "p-4 md:p-5"} rounded-lg md:rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm card-hover`}>
            {/* Stars */}
            <div className="flex gap-0.5 mb-2 md:mb-3">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5 md:w-4 md:h-4"} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>

            {/* Quote */}
            <p className={`text-muted-foreground leading-relaxed ${compact ? "text-xs mb-2" : "text-xs md:text-sm mb-3 md:mb-4"}`}>
                &ldquo;{t.text}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center gap-2">
                <div className={`${compact ? "w-7 h-7" : "w-8 h-8 md:w-9 md:h-9"} rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-semibold text-[10px] md:text-xs shadow-lg`}>
                    {t.avatar}
                </div>
                <div>
                    <p className={`font-semibold ${compact ? "text-xs" : "text-xs md:text-sm"}`}>{t.name}</p>
                    <p className={`text-muted-foreground ${compact ? "text-[10px]" : "text-[10px] md:text-xs"}`}>{t.role}</p>
                </div>
            </div>
        </div>
    );
}
