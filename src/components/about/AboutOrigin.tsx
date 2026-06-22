import React from "react";
import { Image } from "./Image";

export function AboutOrigin() {
  return (
    <section className="py-16 md:py-24 bg-[#f5f2ed] text-left">
      <div className="mx-auto max-w-6xl px-6 grid gap-10 md:grid-cols-2 items-center">
        
        {/* Left Column: Narrative Text */}
        <div className="max-w-lg space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a5c2f]">
            Our Impact & Vision
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-[#0c2e17] leading-tight">
            Empowering farmers to grow more and earn better.
          </h2>
          <div className="space-y-4 text-xs md:text-sm text-gray-600 leading-relaxed font-normal">
            <p>
              Across East Africa, millions of smallholder farmers feed our nations, yet they are often the last to benefit from modern value chains. Mqulima was built to change that. By bypassing middlemen and traditional bottlenecks, we connect local growers directly to premium markets, ensuring that a bountiful harvest translates directly into fair, reliable household income.
            </p>
            <p>
              We believe that agricultural prosperity begins with knowledge and resources. Through our localized learning modules and expert agronomist networks, farmers are moving from guesswork to science-backed cultivation, optimizing their soil health, managing pests, and adapting to changing climates in real time.
            </p>
            <p>
              The result is a thriving community of over 2,400 farmers who are increasing their yields, lowering production costs, and building sustainable livelihoods. Whether it is ordering certified seeds on their phone or sharing practices in the forum, Mqulima is the digital home where African farming goes to thrive.
            </p>
          </div>
        </div>

        {/* Right Column: Visual Component */}
        <div className="relative rounded-2xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.08)] bg-[#0c2e17] aspect-[4/3] w-full max-w-[540px]">
          <Image
            src="/about/origin-conversation.jpg"
            alt="Fresh ripe green avocados piled in a rustic wooden crate at an outdoor market in East Africa"
            fill
            className="absolute inset-0 w-full h-full object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={false}
          />
        </div>

      </div>
    </section>
  );
}
