import React from "react";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

export function AcademyPhotoStrip() {
  const cells = [
    {
      label: "Crop Farming",
      brief: "Aerial or eye-level view of a maize/wheat field in Rift Valley. Rich green.",
    },
    {
      label: "Horticulture",
      brief: "Close-up of a Kenyan woman's hands carefully picking tomatoes off the vine. Warm skin tones, vivid red tomatoes.",
    },
    {
      label: "Livestock",
      brief: "Farmer tending to chickens or dairy cows in a well-maintained shed. Nakuru or Kiambu setting.",
    },
    {
      label: "Irrigation",
      brief: "Drip irrigation lines running through a vegetable plot. Water droplets visible. Sunrise light.",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-[3px] bg-black/10 overflow-hidden">
      {cells.map((cell, index) => (
        <div key={index} className="relative h-[100px] md:h-[140px] w-full overflow-hidden group">
          {/* Fallback Placeholder */}
          <AcademyImagePlaceholder
            brief={cell.brief}
            aspect="w-full h-full"
            className="absolute inset-0 w-full h-full"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition duration-300 z-10 pointer-events-none" />
          
          {/* Category Label bottom-left */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded">
              {cell.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
