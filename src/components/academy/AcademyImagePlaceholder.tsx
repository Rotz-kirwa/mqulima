import React from "react";

interface AcademyImagePlaceholderProps {
  path?: string;
  brief: string;
  aspect?: string; // e.g. "aspect-video" or "aspect-square"
  className?: string;
}

export function AcademyImagePlaceholder({
  brief,
  aspect = "aspect-[4/3]",
  className = "",
}: AcademyImagePlaceholderProps) {
  return (
    <div
      className={`relative w-full ${aspect} bg-[#0c2e17] border border-white/10 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden ${className}`}
    >
      {/* Subtle organic pattern effect in background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a5c2f]/20 via-transparent to-transparent opacity-60" />
      
      <span className="text-[10px] uppercase font-bold tracking-widest text-[#7ed321] mb-2 opacity-80">
        Mqulima Photography
      </span>
      <p className="text-white/80 text-xs italic font-medium max-w-[280px] leading-relaxed relative z-10">
        "{brief}"
      </p>
      
      <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/30 uppercase">
        Placeholder
      </div>
    </div>
  );
}
