import React, { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

export function AcademyLearningPath() {
  const steps = [
    {
      num: 1,
      title: "Foundation: Understanding Your Land",
      desc: "Master soil health analysis, agro-ecological climate zones matching, and secure water access/sources planning.",
      metrics: "3 courses · 8 hrs",
      tag: "Start here",
      tagColor: "bg-[#7ed321] text-[#0c2e17]",
    },
    {
      num: 2,
      title: "Core Crop or Livestock Specialisation",
      desc: "Deep-dive into a single production system (e.g. dairy feeds management or high-yielding hybrid maize protocols).",
      metrics: "4 courses · 12 hrs",
      tag: "Intermediate",
      tagColor: "bg-emerald-100 text-emerald-800",
    },
    {
      num: 3,
      title: "Market Access & Selling Your Produce",
      desc: "Identify offtake buyers, study dynamic county commodity pricing, design packaging, and structure supply contracts.",
      metrics: "2 courses · 5 hrs",
      tag: "Business",
      tagColor: "bg-amber-100 text-amber-800",
    },
    {
      num: 4,
      title: "Scale: Financing & Farm Management",
      desc: "Navigate cooperative SACCO loans, maintain digital farm record books, organize farm labor, and expand operations.",
      metrics: "3 courses · 9 hrs",
      tag: "Advanced",
      tagColor: "bg-purple-100 text-purple-800",
    },
  ];

  const timelineRef = useRef<HTMLDivElement>(null);
  const [visibleSteps, setVisibleSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepNum = parseInt(entry.target.getAttribute("data-step") || "0");
            if (stepNum) {
              // Staggered delay implementation
              setTimeout(() => {
                setVisibleSteps((prev) => ({ ...prev, [stepNum]: true }));
              }, stepNum * 100);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const stepElements = timelineRef.current?.querySelectorAll("[data-step]");
    stepElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-12 md:py-16 bg-[#FAF9F6] text-left overflow-hidden">
      <div className="container-px mx-auto max-w-3xl">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1a5c2f]">
            Structured paths
          </span>
          <h2 className="mt-2 text-2xl font-black text-[#0c2e17] tracking-tight">
            From beginner to agripreneur
          </h2>
        </div>

        {/* Timeline Container */}
        <div ref={timelineRef} className="relative pl-8 md:pl-12 before:absolute before:left-[17px] md:before:left-[21px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#1a5c2f]/20">
          {steps.map((step) => {
            const isVisible = visibleSteps[step.num];
            return (
              <div
                key={step.num}
                data-step={step.num}
                className={`relative mb-8 last:mb-0 text-left transition-all duration-500 transform ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                {/* Timeline Circle Number */}
                <div className="absolute -left-[30px] md:-left-[36px] top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#1a5c2f] border-4 border-white text-white flex items-center justify-center font-bold text-xs md:text-sm shadow-sm">
                  {step.num}
                </div>
                
                <div className="pl-4 md:pl-6 bg-white p-5 rounded-2xl border border-black/[0.05] shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm md:text-base font-extrabold text-[#0c2e17]">
                      {step.title}
                    </h3>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${step.tagColor}`}>
                      {step.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                  
                  <div className="mt-4 border-t border-gray-50 pt-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                    <span>Path Module</span>
                    <span className="text-[#1a5c2f]">{step.metrics}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Path CTA at bottom */}
        <div className="mt-12 text-center">
          <button
            onClick={() => toast.success("Loading Academy Pathways learning tree...")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a5c2f] hover:bg-[#0c2e17] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 transition duration-200 shadow-sm cursor-pointer"
          >
            <span>Start the full learning path</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
