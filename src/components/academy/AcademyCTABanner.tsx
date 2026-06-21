import React from "react";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

interface AcademyCTABannerProps {
  onStartClick?: () => void;
}

export function AcademyCTABanner({ onStartClick }: AcademyCTABannerProps) {
  return (
    <section className="relative bg-[#0c2e17] text-white py-16 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
        <AcademyImagePlaceholder
          brief="Very dark, blurred/dimmed landscape shot of Kenyan farmland at dusk. Used as a subtle texture behind the dark green bg."
          aspect="w-full h-full"
          className="absolute inset-0 w-full h-full"
        />
      </div>

      <div className="relative z-10 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
          Your farm. Your classroom. Start today.
        </h2>
        <p className="mt-4 text-xs sm:text-sm text-white/80 leading-relaxed font-normal max-w-lg mx-auto">
          Courses from KSh 850. Pay with M-Pesa. Learn on your phone, offline. Connect with verified agronomists instantly.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <button
            onClick={onStartClick}
            className="w-full sm:w-auto h-12 rounded-xl bg-[#7ed321] text-[#0c2e17] font-black text-xs uppercase tracking-widest px-8 hover:bg-[#8ee331] transition duration-200 shadow-md cursor-pointer flex items-center justify-center"
          >
            Start Your First Course
          </button>
          
          <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
            No subscription required. Pay per course.
          </span>
        </div>
      </div>
    </section>
  );
}
