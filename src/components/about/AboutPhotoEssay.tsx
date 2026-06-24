import React from "react";
import { Image } from "./Image";

export function AboutPhotoEssay() {
  const photos = [
    {
      id: "essay-1",
      src: "/about/essay-1.jpg",
      alt: "Close-up portrait of weathered hands of a Kenyan male farmer carefully inspecting a green tomato leaf",
      caption: "Every crop tells a story.",
      gridClass: "col-span-1 md:row-span-2 md:col-start-1 h-[260px] md:h-full",
    },
    {
      id: "essay-2",
      src: "/about/essay-2.jpg",
      alt: "Sweeping panoramic landscape of Kenya highlands green farmland rolling hills and scattered homesteads under blue cloudy sky",
      caption: "This is what we're protecting.",
      gridClass: "col-span-2 md:col-span-2 md:col-start-2 md:row-start-1 h-[140px] md:h-[200px]",
    },
    {
      id: "essay-3",
      src: "/about/essay-3.jpg",
      alt: "Documentary photograph of a young Kenyan woman farmer in a maize field looking at her phone",
      caption: "Technology that fits in your pocket.",
      gridClass: "col-span-1 md:col-start-2 md:row-start-2 h-[140px] md:h-[220px]",
    },
    {
      id: "essay-4",
      src: "/about/essay-4.jpg",
      alt: "Vibrant overhead flat-lay of fresh Kenyan vegetables arranged on a rustic wooden table at a market",
      caption: "From soil to sale.",
      gridClass: "col-span-1 md:col-start-3 md:row-start-2 h-[140px] md:h-[220px]",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#f5f2ed] px-6 border-t border-[#0c2e17]/5">
      <div className="mx-auto max-w-6xl">
        {/* Asymmetric Masonry-style Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:auto-rows-fr items-stretch">
          {photos.map((p) => (
            <div
              key={p.id}
              className={`group relative overflow-hidden bg-[#0c2e17] ${p.gridClass}`}
            >
              {/* Image component inside with scale-on-hover */}
              <Image
                src={p.src}
                alt={p.alt}
                fill
                className="absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-[1.04] object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={false}
              />
              
              {/* Subtle dark bottom gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Caption (fades from 0.6 to 1 on hover) */}
              <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none transition-opacity duration-200 opacity-60 group-hover:opacity-100">
                <span className="text-[11px] italic text-white/90 drop-shadow-sm">
                  {p.caption}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
