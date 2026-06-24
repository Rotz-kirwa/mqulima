import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

export function CaseStudies() {
  const cases = [
    {
      quote: "By integration with Mqulima's cooperative order system, Osho Chemical has delivered certified crop protection products to 12,000 farmers in North Rift.",
      author: "Dr. Patrick Mwangi",
      role: "Commercial Director",
      org: "Osho Chemical Industries",
      tag: "Input Integration · 2024",
    },
    {
      quote: "Onboarding our livestock diagnostic machines onto the Mqulima system has optimized vet scheduling and equipment tracking across 8 counties.",
      author: "Grace Cherono",
      role: "Technical Manager",
      org: "Truvets Techno Systems",
      tag: "Tech & Diagnostics · 2024",
    },
    {
      quote: "Kenagro Suppliers saw a 38% increase in fertilizer order volumes through Mqulima's direct cooperative group-buying pipeline.",
      author: "Samuel Kosgei",
      role: "Logistics Lead",
      org: "Kenagro Suppliers",
      tag: "Supply Chain Partner · 2024",
    },
    {
      quote: "Amiram EA's drip irrigation kits are now accessible via financing models built on the Mqulima platform, helping 4,000 farmers adopt climate-smart agriculture.",
      author: "Yossi Cohen",
      role: "Managing Director",
      org: "Amiram EA",
      tag: "Irrigation Technology · 2024",
    },
    {
      quote: "Direct feed order integrations with Unga Farmcare have simplified feeds procurement for dairy cooperatives in Nakuru and Meru.",
      author: "David Ndwiga",
      role: "Head of Sales",
      org: "Unga Farmcare EA",
      tag: "Animal Feed Track · 2024",
    },
    {
      quote: "Our soil analysts utilize Mqulima's digital agronomist app to return lab results to cooperative farmers in under 48 hours.",
      author: "Faith Jepchirchir",
      role: "Lead Agronomist",
      org: "Agrosolutions Ltd",
      tag: "Soil Mapping Partner · 2024",
    },
    {
      quote: "Cooper Cooperative's training program for cooperative manager staff has reached 120 verified societies using Mqulima's academy tools.",
      author: "Peter Ndwiga",
      role: "Chairman",
      org: "Cooper Cooperative Ltd",
      tag: "Cooperative Track · 2024",
    },
    {
      quote: "Providing bulk animal pharmaceutical products directly to Mqulima's community animal health assistants has reduced livestock disease incidence by 18%.",
      author: "Dr. Richard Kiprono",
      role: "Veterinary Director",
      org: "Norbrook",
      tag: "Veterinary Partner · 2024",
    },
    {
      quote: "Our integration with the Mqulima shop allowed Highchem EA to streamline input logistics for crop boosters directly to verified agro-dealer hubs.",
      author: "John Kamau",
      role: "Supply Chain Manager",
      org: "Highchem EA",
      tag: "Chemical Distribution · 2024",
    },
    {
      quote: "With Yara EA's crop nutrition guides integrated into the Mqulima SMS platform, farmers achieved a 30% increase in crop yield performance.",
      author: "Sarah Wanjiku",
      role: "Agronomy Lead",
      org: "Yara EA",
      tag: "Crop Nutrition Partner · 2024",
    },
  ];

  const metrics = [
    { num: "3 weeks", label: "avg. integration time" },
    { num: "94%", label: "partner retention" },
    { num: "KES 2B+", label: "facilitated annually" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 5000);
  };

  const stopAutoPlay = () => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [currentIndex]);

  const triggerAnimation = (newIdx: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(newIdx);
      setIsAnimating(false);
    }, 300);
  };

  const handleNext = () => {
    if (isAnimating) return;
    const nextIdx = (currentIndex + 1) % cases.length;
    triggerAnimation(nextIdx);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    const prevIdx = (currentIndex - 1 + cases.length) % cases.length;
    triggerAnimation(prevIdx);
  };

  const handleDotClick = (idx: number) => {
    if (isAnimating || idx === currentIndex) return;
    triggerAnimation(idx);
  };

  const activeCase = cases[currentIndex];

  return (
    <section className="bg-[#FAF9F6] py-28 px-6 text-center border-t border-gray-200/80">
      <div className="max-w-5xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2D6A4F]">
          PARTNER STORIES
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A3D2F] tracking-tight leading-tight">
          Real Results, Real Partners.
        </h2>

        {/* Carousel Container */}
        <div className="mt-16 relative bg-white border border-gray-200 rounded-3xl p-8 sm:p-14 shadow-sm min-h-[380px] sm:min-h-[320px] flex flex-col justify-between overflow-hidden text-left">
          {/* Accent Gold Corner Tag */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F5A623]" />
          
          <div className="absolute right-8 top-8 text-[#2D6A4F]/10 pointer-events-none">
            <Quote className="h-20 w-20 transform scale-x-[-1]" />
          </div>

          {/* Animating Slide Wrapper */}
          <div className={`transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            <p className="text-lg sm:text-2xl text-[#1A1A1A] italic leading-relaxed font-light font-serif mb-8 max-w-4xl">
              "{activeCase.quote}"
            </p>

            <div>
              <div className="text-base font-bold text-[#1A1A1A]">{activeCase.author}</div>
              <div className="text-xs text-gray-500 mt-0.5">{activeCase.role}, <span className="font-semibold text-gray-700">{activeCase.org}</span></div>
              <div className="mt-4 inline-block text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#2D6A4F]/10 px-2.5 py-1 rounded">
                {activeCase.tag}
              </div>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Dots */}
            <div className="flex flex-wrap gap-2">
              {cases.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex ? "w-6 bg-[#2D6A4F]" : "w-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="h-10 w-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition duration-200 cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                className="h-10 w-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition duration-200 cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Trust Metrics Row */}
        <div className="mt-20 border-t border-b border-gray-200 py-10 bg-white rounded-2xl border border-gray-200">
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-center">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className={`px-6 flex flex-col items-center justify-center ${
                  idx < 2 ? "md:border-r border-gray-200" : ""
                }`}
              >
                <div className="text-3xl md:text-4xl font-serif font-bold text-[#2D6A4F]">
                  {m.num}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-2 font-semibold">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
