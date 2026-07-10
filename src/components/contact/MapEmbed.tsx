import React from "react";
import { MapPin, Clock } from "lucide-react";

export function MapEmbed() {
  return (
    <section className="relative w-full h-[300px] md:h-[450px] overflow-hidden bg-gray-50">
      {/* Light Clear Map Container */}
      <div className="absolute inset-0 w-full h-full select-none pointer-events-auto">
        <iframe
          title="Mqulima HQ"
          src="https://www.openstreetmap.org/export/embed.html?bbox=35.2500,0.5000,35.2900,0.5300&layer=mapnik&marker=0.5142,35.2697"
          className="w-full h-full border-none transition duration-500"
          loading="lazy"
        />
      </div>

      {/* Floating Info Overlay Card (Premium Theme) */}
      <div className="absolute top-8 left-8 z-10 max-w-[300px] bg-white border border-emerald-100 p-6 shadow-[0_10px_30px_-5px_rgba(45,106,79,0.1)] text-left rounded-2xl">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center border border-emerald-150 bg-emerald-50 text-emerald-700 rounded-xl">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#0A1E0C] tracking-wide">Mqulima HQ</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed font-medium">
              Junction, along Eldoret Iten Highway
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 pt-4 border-t border-emerald-50 text-xs text-gray-500 font-medium">
          <Clock className="h-4.5 w-4.5 text-emerald-700" />
          <span>Hours: Mon–Fri, 8AM–6PM</span>
        </div>
      </div>
    </section>
  );
}
