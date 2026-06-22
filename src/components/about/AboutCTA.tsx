import React from "react";
import { Link } from "@tanstack/react-router";
import { Image } from "./Image";

export function AboutCTA() {
  return (
    <section className="relative bg-[#0c2e17] text-white py-20 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
      {/* Background Texture Overlay */}
      <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
        <Image
          src="/about/cta-bg.jpg"
          alt="Aerial drone photograph looking straight down at lush green farmland patchwork in Kenya, multiple shades of green crop plots, red soil paths between them, shot at dusk with very warm orange light, almost abstract in composition"
          fill
          className="absolute inset-0 w-full h-full object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={false}
        />
      </div>

      <div className="relative z-10 max-w-2xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight leading-tight">
          Mqulima ni yetu. Mqulima is ours.
        </h2>
        <p className="mt-4 text-xs sm:text-sm text-white/80 leading-relaxed font-normal max-w-lg mx-auto">
          Join 2,400+ farmers already using the platform — or partner with us to reach them.
        </p>

        {/* Buttons Row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            to="/shop"
            className="w-full sm:w-auto h-12 rounded-xl bg-[#7ed321] text-[#0c2e17] font-black text-xs uppercase tracking-widest px-8 hover:bg-[#8ee331] transition duration-200 shadow-md flex items-center justify-center cursor-pointer"
          >
            Start Shopping
          </Link>
          <a
            href="mailto:partnerships@mqulima.com?subject=Partnering%20with%20Mqulima"
            className="w-full sm:w-auto h-12 rounded-xl border border-white/20 hover:border-white/50 text-white font-black text-xs uppercase tracking-widest px-8 transition duration-200 flex items-center justify-center cursor-pointer"
          >
            Partner with us
          </a>
        </div>

        {/* Footer Credit Note */}
        <div className="mt-6">
          <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">
            Built in Nairobi. Growing across East Africa.
          </span>
        </div>
      </div>
    </section>
  );
}
