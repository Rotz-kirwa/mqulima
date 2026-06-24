import React from "react";
import { MapPin, Clock } from "lucide-react";

export function MapEmbed() {
  return (
    <section className="relative w-full h-[250px] md:h-[400px] border-t-2 border-[#2D6A4F] overflow-hidden bg-gray-50">
      {/* Light Clear Map Container */}
      <div className="absolute inset-0 w-full h-full select-none pointer-events-auto">
        <iframe
          title="Mqulima HQ"
          src="https://www.openstreetmap.org/export/embed.html?bbox=35.2500,0.5000,35.2900,0.5300&layer=mapnik&marker=0.5142,35.2697"
          className="w-full h-full border-none transition duration-500"
          loading="lazy"
        />
      </div>

      {/* Floating Info Overlay Card (Light Theme) */}
      <div className="absolute top-6 left-6 z-10 max-w-[280px] bg-white border border-gray-200 rounded-2xl p-5 shadow-lg text-left">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#1A1A1A] tracking-wide">Mqulima HQ</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Junction, along Eldoret Iten Highway
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <Clock className="h-4 w-4 text-[#2D6A4F]" />
          <span>Open: Mon–Fri, 8AM–6PM</span>
        </div>
      </div>
    </section>
  );
}
