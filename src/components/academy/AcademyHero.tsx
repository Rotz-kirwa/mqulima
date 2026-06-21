import React from "react";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

interface AcademyHeroProps {
  onBrowseClick?: () => void;
  onPathsClick?: () => void;
}

export function AcademyHero({ onBrowseClick, onPathsClick }: AcademyHeroProps) {
  return (
    <section className="bg-[#0c2e17] text-white min-h-[420px] md:min-h-[460px] py-12 md:py-16 flex items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_var(--tw-gradient-stops))] from-[#1a5c2f]/45 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      <div className="container-px mx-auto max-w-7xl relative z-10 w-full">
        <div className="grid gap-8 lg:grid-cols-12 items-center text-left">
          
          {/* Left column: Text Content */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Eyebrow Pill */}
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7ed321] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7ed321]"></span>
              </span>
              Mqulima Academy
            </span>

            {/* H1 Title */}
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.1]">
              Learn from Africa's{" "}
              <span className="text-[#7ed321]">best farmers</span> & agri-experts.
            </h1>

            {/* Subheading */}
            <p className="mt-4 max-w-xl text-white/80 text-sm md:text-base leading-relaxed font-normal">
              Real courses. Real results. Built for East African farmers, agripreneurs, and food system builders — in Swahili & English.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
              <button
                onClick={onBrowseClick}
                className="w-full sm:w-auto rounded-lg bg-[#7ed321] text-[#0c2e17] font-bold text-xs uppercase tracking-wider py-3 px-6 hover:bg-[#8ee331] transition duration-200 shadow-md cursor-pointer"
              >
                Browse Courses
              </button>
              <button
                onClick={onPathsClick}
                className="w-full sm:w-auto rounded-lg bg-transparent border border-white/30 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 hover:bg-white/5 transition duration-200 cursor-pointer"
              >
                View Learning Paths
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-12 w-full border-t border-white/10 pt-6">
              <div className="grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-[#7ed321]">2,400+</div>
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">Farmers enrolled</div>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <div className="text-xl sm:text-2xl font-black text-[#7ed321]">38</div>
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">Expert courses</div>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <div className="text-xl sm:text-2xl font-black text-[#7ed321]">6</div>
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mt-0.5">EA countries</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Image */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
              <AcademyImagePlaceholder
                brief="Wide shot of a confident Kenyan agronomist standing in a lush green crop field, looking directly into camera, golden hour light."
                aspect="aspect-[4/3] md:aspect-[5/4] lg:aspect-[6/5]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
