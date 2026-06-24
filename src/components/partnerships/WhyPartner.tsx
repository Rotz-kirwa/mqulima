import React from "react";
import { MapPin, TrendingUp, Zap, ShieldCheck, Hexagon, Code } from "lucide-react";

export function WhyPartner() {
  const cards = [
    {
      title: "Direct Farmer Reach",
      desc: "Connect with 500,000+ verified smallholder farmers across 12 counties. No middlemen. No noise.",
      icon: MapPin,
    },
    {
      title: "Agri-Data Network",
      desc: "Real-time crop yield data, seasonal trends, and buyer demand signals — before the market sees them.",
      icon: TrendingUp,
    },
    {
      title: "M-Pesa Native Payments",
      desc: "Integrated Daraja API. Your partnership activates frictionless KES transactions at farm level.",
      icon: Zap,
    },
    {
      title: "Kenyan Credibility",
      desc: "Co-brand with Kenya's most trusted agri-platform. Access cooperative trust that took decades to build.",
      icon: ShieldCheck,
    },
    {
      title: "Verified Cooperatives",
      desc: "500+ registered cooperatives with legal standing, group purchasing power, and documented harvest records.",
      icon: Hexagon,
    },
    {
      title: "API & White-Label Options",
      desc: "Embed Mqulima's marketplace, data feeds, or payment rails directly into your own platform.",
      icon: Code,
    },
  ];

  return (
    <section className="bg-[#FAF9F6] py-28 px-6 text-center border-t border-gray-200/80">
      <div className="max-w-7xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2D6A4F]">
          THE OPPORTUNITY
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A3D2F] tracking-tight max-w-2xl mx-auto leading-tight">
          You Don't Just Get Access.<br />
          You Get <span className="text-[#F5A623]">Advantage.</span>
        </h2>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl p-8 text-left transition-all duration-300 hover:border-[#2D6A4F] hover:-translate-y-1 hover:shadow-md group"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] transition-colors duration-300 group-hover:bg-[#2D6A4F]/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-[#1A1A1A] tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed font-light">
                  {c.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
