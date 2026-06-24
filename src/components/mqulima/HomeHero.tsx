import { Link } from "@tanstack/react-router";
import { ArrowRight, Smartphone, TrendingUp, Truck } from "lucide-react";
import heroBanner from "@/assets/hero-banner.png";

export function HomeHero() {
  return (
    <section className="relative h-[88vh] min-h-[620px] w-full overflow-hidden bg-forest">
      {/* Background image — farmer positioned right */}
      <img
        src={heroBanner}
        alt="A confident African farmer holding a smartphone in a lush farm — Mqulima agritech platform"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "right center" }}
        width={1920}
        height={1280}
        fetchPriority="high"
      />

      {/* Left-to-right gradient — keeps text legible while the farmer photo stays vivid */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(10,30,15,0.93) 0%, rgba(10,30,15,0.78) 38%, rgba(10,30,15,0.18) 62%, rgba(10,30,15,0.0) 100%)",
        }}
      />

      {/* Content */}
      <div className="container-px relative z-10 mx-auto flex h-full max-w-7xl items-center">
        <div className="max-w-xl">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Kenya's #1 Agritech Platform
          </span>

          {/* Headline */}
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Grow More.{" "}
            <span className="text-gold">Sell Better.</span>{" "}
            Farm Smarter.
          </h1>

          {/* Subheadline */}
          <p className="mt-5 max-w-lg text-base text-white/85 md:text-lg">
            Mqulima connects farmers to markets, inputs, expert advice, and
            logistics — all in one powerful platform built for African
            agriculture.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/services"
              className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-gold-foreground shadow-gold transition hover:scale-[1.03] active:scale-100"
            >
              Start Farming Smarter
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/about"
              className="rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Learn more
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur">
              <TrendingUp className="h-4 w-4 text-gold" />
              <span className="text-xs font-semibold text-white">5,000+ Active Farmers</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur">
              <Smartphone className="h-4 w-4 text-gold" />
              <span className="text-xs font-semibold text-white">App + Web Platform</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur">
              <Truck className="h-4 w-4 text-gold" />
              <span className="text-xs font-semibold text-white">20+ Counties Covered</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
