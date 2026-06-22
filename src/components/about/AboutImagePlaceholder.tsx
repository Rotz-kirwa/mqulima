import React from "react";

interface AboutImagePlaceholderProps {
  brief: string;
  aspect?: string;
  className?: string;
}

export function AboutImagePlaceholder({ brief, aspect = "aspect-[4/3]", className = "" }: AboutImagePlaceholderProps) {
  return (
    <div
      className={`bg-[#1a3020] text-white/40 flex items-center justify-center p-4 text-center text-[10px] italic font-medium leading-relaxed overflow-hidden select-none ${aspect} ${className}`}
    >
      <div className="max-w-[85%]">
        <span className="block font-bold uppercase tracking-wider text-[8px] text-[#7ed321] not-italic mb-1">
          [Image Brief]
        </span>
        {brief}
      </div>
    </div>
  );
}
