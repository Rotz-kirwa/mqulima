import React from "react";
import { Sprout, Users, MapPin } from "lucide-react";

export function AboutMission() {
  const values = [
    {
      icon: Sprout,
      title: "Farmer first, always",
      body: "Every feature we build starts with one question: does this help a farmer earn more or waste less? If the answer is no, we don't build it.",
    },
    {
      icon: Users,
      title: "Community over competition",
      body: "African agriculture grows when farmers share knowledge, not hoard it. Mqulima is a platform built on openness and collective progress.",
    },
    {
      icon: MapPin,
      title: "Built for here, not imported",
      body: "We didn't copy a Western agri-tech model and translate it. We built Mqulima from the ground up for Kenyan soils, seasons, and realities.",
    },
  ];

  return (
    <section className="py-20 bg-[#0c2e17] text-white text-center px-6">
      <div className="mx-auto max-w-6xl">
        
        {/* Top: Mission Statement */}
        <div className="flex flex-col items-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ed321]">
            Our mission
          </span>
          <h2 className="mt-4 text-xl sm:text-2xl md:text-3xl font-medium text-white leading-snug">
            "To give every Kenyan farmer the tools, knowledge, and market access they need to build a profitable farm — and pass it on to the next generation."
          </h2>
        </div>

        {/* Bottom: 3-column values grid */}
        <div className="grid gap-6 md:grid-cols-3 text-left">
          {values.map((v, idx) => (
            <div
              key={idx}
              className="bg-white/[0.04] border border-[#7ed321]/20 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white/5 text-[#7ed321] mb-5">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">
                  {v.title}
                </h3>
                <p className="mt-2 text-xs text-white/70 leading-relaxed font-normal">
                  {v.body}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
