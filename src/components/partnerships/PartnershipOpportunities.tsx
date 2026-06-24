import React from "react";
import { Truck, Coins, Leaf, Sprout } from "lucide-react";

export function PartnershipOpportunities() {
  const opportunities = [
    {
      title: "Input Distribution Channels",
      icon: Sprout,
      target: "Seed, fertilizer, and tool manufacturers",
      benefits: [
        "Direct listing in Mqulima Shop",
        "Cooperative group-purchasing pipelines",
        "Verified delivery track logs",
      ],
    },
    {
      title: "Credit & Financing Services",
      icon: Coins,
      target: "Fintechs, banks, and micro-lenders",
      benefits: [
        "Pre-scored farmer credit metrics",
        "Direct loan disbursements via M-Pesa",
        "Harvest-tied repayment scheduling",
      ],
    },
    {
      title: "Logistics & Cold-Chain Storage",
      icon: Truck,
      target: "Transporters and warehouse operators",
      benefits: [
        "First-mile transport dispatching",
        "Collection hub delivery routes optimization",
        "Cold storage capacity booking",
      ],
    },
    {
      title: "Digital Extension Services",
      icon: Leaf,
      target: "Agronomists and research institutions",
      benefits: [
        "Push notification SMS training delivery",
        "Regional weather-alert authoring",
        "Soil-testing lab results integration",
      ],
    },
  ];

  return (
    <section className="bg-[#FAF9F6] py-28 px-6 text-center border-t border-gray-200/80">
      <div className="max-w-7xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2D6A4F]">
          PARTNERSHIP OPPORTUNITIES
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A3D2F] tracking-tight leading-tight max-w-2xl mx-auto">
          Active Opportunities.
        </h2>
        <p className="mt-4 max-w-xl mx-auto text-sm text-gray-600 leading-relaxed font-light">
          We have designed targeted integration tracks so that specialized service providers can instantly add value to the farmer network.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {opportunities.map((o, idx) => {
            const Icon = o.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:shadow-md transition-all duration-300 hover:border-[#2D6A4F] flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-base font-bold text-[#1A1A1A] tracking-tight">
                    {o.title}
                  </h3>
                  <div className="text-[10px] text-[#2D6A4F] font-semibold mt-1">
                    Best for: <span className="text-gray-500 font-normal">{o.target}</span>
                  </div>

                  <div className="h-px bg-gray-100 my-4" />

                  <ul className="space-y-2">
                    {o.benefits.map((b, bIdx) => (
                      <li key={bIdx} className="text-xs text-gray-600 flex items-start gap-1.5 leading-relaxed font-light">
                        <span className="text-[#F5A623] font-bold shrink-0 mt-0.5">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
