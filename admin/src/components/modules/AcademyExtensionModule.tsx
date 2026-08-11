import React from "react";
import { GraduationCap, Clock, Sparkles } from "lucide-react";

export const AcademyExtensionModule: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      {/* Module Header */}
      <div className="border-b border-[#CCE5E1] pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] tracking-tight">
            Academy & Extension
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-0.5 font-medium">
            Mqulima Agri-Education & Field Training Operations
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md">
          <Clock className="w-4 h-4 animate-spin text-amber-100" />
          <span>IN DEVELOPMENT</span>
        </div>
      </div>

      {/* Vibrant Rich Colored Development Container */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F3D3C] via-[#145248] to-[#0A2924] rounded-2xl p-10 text-center shadow-xl border-2 border-[#278C7B]/40 flex flex-col items-center justify-center space-y-6">
        
        {/* Ambient Glowing Background Halos */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-[#278C7B]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-[#F59E0B]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Vibrant Multi-Color Icon Halo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#10B981] to-[#3B82F6] blur-md opacity-80 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] border-4 border-white/90 flex items-center justify-center text-white shadow-2xl">
            <GraduationCap className="w-10 h-10 text-white drop-shadow-md" />
          </div>
        </div>

        {/* High-Contrast Colorful Typography */}
        <div className="space-y-2 max-w-lg z-10">
          <h2 className="text-2xl sm:text-3xl font-black font-serif bg-gradient-to-r from-[#FDE68A] via-[#6EE7B7] to-[#93C5FD] bg-clip-text text-transparent drop-shadow-sm">
            Academy Content Still Being Developed
          </h2>
          <p className="text-sm font-medium text-emerald-100/90 leading-relaxed">
            The Mqulima Academy & Extension content is currently under active development.
          </p>
        </div>

        {/* Colorful Status Pills Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 z-10 font-mono">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-bold shadow-inner">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <span>Interactive Video Masterclasses</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 text-xs font-bold shadow-inner">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Extension Field Logs</span>
          </div>
        </div>

      </div>
    </div>
  );
};
