import React, { useState } from "react";
import { Star } from "lucide-react";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

export function AcademyTestimonials() {
  const testimonials = [
    {
      quote: "Nilifanya kozi ya greenhouse tomatoes. Baada ya miezi 3, ninaingiza KSh 45,000 kwa mwezi.",
      author: "James Kamau",
      location: "Murang'a County",
      avatarBrief: "Headshot of a Kenyan man in his 30s, smiling, outdoors. Natural light.",
    },
    {
      quote: "The poultry course helped me go from 200 to 1,000 birds. The vet contact section alone saved me twice.",
      author: "Faith Wangari",
      location: "Kiambu County",
      avatarBrief: "Headshot of a Kenyan woman in her 40s, confident expression, outdoors or farm background.",
    },
    {
      quote: "Sikujua drip irrigation inaweza kuwa affordable. Course ilionyesha jinsi ya kuunda system ya KSh 8,000.",
      author: "Ahmed Osman",
      location: "Meru County",
      avatarBrief: "Kenyan man in his 40s, smiling, outdoors, farming context.",
    },
    {
      quote: "The agri-business module gave me the confidence to pitch to Carrefour. Now I supply weekly.",
      author: "Grace Achieng",
      location: "Kisumu County",
      avatarBrief: "Kenyan woman in business/market environment, smiling.",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  };

  return (
    <section className="py-12 md:py-16 bg-white text-left">
      <div className="container-px mx-auto max-w-7xl">
        <div className="max-w-xl mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1a5c2f]">
            Real results
          </span>
          <h2 className="mt-2 text-2xl font-black text-[#0c2e17] tracking-tight">
            Farmers who've made moves
          </h2>
        </div>

        {/* Desktop Grid Layout (visible on md+) */}
        <div className="hidden md:grid gap-6 md:grid-cols-2">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-0.5 text-amber-500 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-700 italic leading-relaxed">
                  "{test.quote}"
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
                  <AcademyImagePlaceholder
                    brief={test.avatarBrief}
                    aspect="w-full h-full"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0c2e17]">{test.author}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">
                    {test.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Snap Scroll Layout */}
        <div className="md:hidden">
          <div
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4"
          >
            {testimonials.map((test, idx) => (
              <div
                key={idx}
                className="w-full shrink-0 snap-center rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-0.5 text-amber-500 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 italic leading-relaxed">
                    "{test.quote}"
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
                    <AcademyImagePlaceholder
                      brief={test.avatarBrief}
                      aspect="w-full h-full"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0c2e17]">{test.author}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">
                      {test.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {testimonials.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  activeIndex === idx ? "w-4 bg-[#1a5c2f]" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
