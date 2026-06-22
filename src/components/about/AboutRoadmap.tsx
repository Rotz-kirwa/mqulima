import React, { useEffect, useRef, useState } from "react";
import { ROADMAP_PHASES } from "@/lib/about-content";

export function AboutRoadmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visiblePhases, setVisiblePhases] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Only apply scroll animations on mobile screens (<768px)
    if (window.innerWidth >= 768) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexAttr = entry.target.getAttribute("data-index");
            if (indexAttr !== null) {
              const index = parseInt(indexAttr);
              setVisiblePhases((prev) => ({ ...prev, [index]: true }));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const phaseElements = containerRef.current?.querySelectorAll("[data-index]");
    phaseElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-[#0c2e17] text-white text-left overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        
        <div className="max-w-xl mb-16">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ed321]">
            Where we're going
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium text-white tracking-tight">
            This is just the beginning.
          </h2>
          <p className="mt-2 text-xs md:text-sm text-white/70 leading-relaxed font-normal">
            Mqulima is a 10-year project. Here's what we're building.
          </p>
        </div>

        {/* Roadmap Container */}
        <div ref={containerRef} className="relative">
          {/* Desktop Horizontal Dashed Connection Line */}
          <div className="hidden md:block absolute top-[44px] left-8 right-8 h-[2px] border-t-2 border-dashed border-[#7ed321]/30 z-0" />

          {/* Timeline Grid (Flex horizontal on md+, vertical stack on mobile) */}
          <div className="grid gap-6 md:grid-cols-4 items-stretch relative z-10">
            {ROADMAP_PHASES.map((phase, idx) => {
              const isVisible = visiblePhases[idx] || false;
              return (
                <div
                  key={idx}
                  data-index={idx}
                  className={`flex flex-col justify-between transition-all duration-500 transform ${
                    phase.isActive
                      ? "opacity-100"
                      : "opacity-50 hover:opacity-80 transition-opacity"
                  } ${
                    // Fade-in slide effect on mobile if visible
                    "md:opacity-100 md:translate-y-0 " + 
                    (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 md:opacity-100 md:translate-y-0")
                  }`}
                >
                  <div>
                    {/* Phase Badge / Bullet */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        phase.isActive
                          ? "bg-[#7ed321] text-[#0c2e17]"
                          : "bg-white/10 text-white border border-white/20"
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        phase.isActive ? "text-[#7ed321]" : "text-white/60"
                      }`}>
                        {phase.label}
                      </span>
                    </div>

                    {/* Phase Info Box */}
                    <div className={`p-5 rounded-2xl bg-white/5 border-2 min-h-[160px] flex flex-col justify-between ${
                      phase.isActive
                        ? "border-[#7ed321]"
                        : "border-white/10 border-dashed"
                    }`}>
                      <div>
                        <h3 className="text-xs md:text-sm font-extrabold text-white leading-snug">
                          {phase.title}
                        </h3>
                        <p className="mt-2 text-[11px] text-white/70 leading-relaxed font-normal">
                          {phase.body}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
