import React from "react";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

export function AcademyPhotoImmersion() {
  return (
    <section className="py-12 md:py-16 bg-white text-left">
      <div className="container-px mx-auto max-w-7xl">
        <div className="max-w-xl mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1a5c2f]">
            From the field
          </span>
          <h2 className="mt-2 text-2xl font-black text-[#0c2e17] tracking-tight">
            Learning that looks like Kenya
          </h2>
          <p className="mt-2 text-xs md:text-sm text-gray-500 leading-relaxed">
            All course content features real East African farmers, real landscapes, and real conditions.
          </p>
        </div>

        {/* Asymmetric Photo Grid */}
        <div className="grid gap-4 md:grid-cols-3 items-stretch">
          
          {/* Left Column (Wider, 2fr equivalent) */}
          <div className="md:col-span-2 relative min-h-[300px] rounded-2xl overflow-hidden shadow-sm group">
            <AcademyImagePlaceholder
              brief="Wide outdoor shot of an instructor teaching a small group of farmers under a tree or in an open farm setting. Golden hour. Authentic. Not a classroom."
              aspect="w-full h-full"
              className="absolute inset-0 w-full h-full"
            />
            {/* Dark overlay bottom 40% */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none z-10" />
            {/* Caption */}
            <div className="absolute bottom-4 left-4 right-4 z-20 text-white pointer-events-none">
              <span className="text-xs font-bold uppercase text-[#7ed321] tracking-wider block">Field Mentorship</span>
              <p className="text-[11px] text-white/95 mt-0.5 leading-snug">Direct agronomy training session under a acacia tree in Nakuru County.</p>
            </div>
          </div>

          {/* Right Column (Stacked, 1fr) */}
          <div className="grid gap-4">
            
            {/* Right Top */}
            <div className="relative min-h-[140px] rounded-2xl overflow-hidden shadow-sm group">
              <AcademyImagePlaceholder
                brief="Young farmer studying on a smartphone in a field — course app visible on screen."
                aspect="w-full h-full"
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-3 left-3 right-3 z-20 text-white pointer-events-none">
                <span className="text-[10px] font-bold uppercase text-[#7ed321] tracking-wider block">Mobile Learning</span>
                <p className="text-[10px] text-white/90 leading-tight">Byte-sized modules accessible right in the shamba.</p>
              </div>
            </div>

            {/* Right Bottom */}
            <div className="relative min-h-[140px] rounded-2xl overflow-hidden shadow-sm group">
              <AcademyImagePlaceholder
                brief="Farmer proudly holding a printed certificate, smiling, crops in background."
                aspect="w-full h-full"
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-3 left-3 right-3 z-20 text-white pointer-events-none">
                <span className="text-[10px] font-bold uppercase text-[#7ed321] tracking-wider block">Certificates</span>
                <p className="text-[10px] text-white/90 leading-tight">Earn accredited cooperative certificates upon completion.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Photographer credit note */}
        <div className="mt-6 text-right">
          <span className="text-[10px] italic text-gray-400">
            📸 Photography by Webmakers Nairobi, Nairobi/Nakuru 2024
          </span>
        </div>
      </div>
    </section>
  );
}
