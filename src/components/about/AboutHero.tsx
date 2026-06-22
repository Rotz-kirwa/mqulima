import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Image } from "./Image";

export function AboutHero() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative w-full min-h-[500px] md:min-h-[600px] bg-[#0c2e17] flex flex-col justify-center items-center text-center px-6 overflow-hidden">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/about/hero-field.jpg"
          alt="Confident Black African agronomist in white shirt using a digital tablet in a lush green maize field, with a combine harvester working in the background under blue skies"
          fill
          className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={true}
        />
        {/* Linear Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c2e17]/55 to-[#0c2e17]/85" />
      </div>

      {/* Hero Content with CSS animations */}
      <div 
        className="relative z-10 max-w-[680px] mx-auto flex flex-col items-center select-none"
        style={{
          animation: "aboutHeroFadeInUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both"
        }}
      >
        {/* Style block for local CSS animation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes aboutHeroFadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes aboutBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(6px); }
          }
          .about-bounce-anim {
            animation: aboutBounce 2s infinite ease-in-out;
          }
        `}} />

        <span className="inline-block border border-white/20 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 bg-white/5 backdrop-blur-sm">
          Our story
        </span>

        <h1 className="mt-6 text-2xl sm:text-3xl md:text-5xl font-medium text-white tracking-tight leading-tight md:leading-[1.15]">
          We exist for the farmer who wakes up at 5am and still can't find a market for his harvest.
        </h1>

        <p className="mt-4 max-w-[520px] text-sm md:text-base text-white/70 font-light leading-relaxed">
          Mqulima was built out of frustration — and a deep belief that African agriculture deserves world-class infrastructure.
        </p>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-300 pointer-events-none flex flex-col items-center ${
          scrolled ? "opacity-0" : "opacity-100"
        }`}
      >
        <ChevronDown className="h-6 w-6 text-white about-bounce-anim" />
      </div>
    </section>
  );
}
