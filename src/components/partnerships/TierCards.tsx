import React from "react";
import { Check } from "lucide-react";

interface TierCardsProps {
  onSelectTier: (tierName: string) => void;
}

export function TierCards({ onSelectTier }: TierCardsProps) {
  const models = [
    {
      name: "SUPPLY CHAIN & INPUT MODEL",
      badge: "Inputs & Trade",
      badgeStyle: "border border-[#2D6A4F] text-[#2D6A4F] bg-[#2D6A4F]/5",
      forText: "Input manufacturers, agrodealers, seed and machinery companies",
      investment: "Volume-based listing / Distribution margins",
      isFeatured: false,
      benefits: [
        "Product listing inside the Mqulima Shop marketplace",
        "Direct access to 500+ verified buyer cooperatives",
        "Last-mile distribution tracking with Sendy/Copile",
        "Group procurement discounts and campaign tools",
        "Monthly store transaction settlement reports",
      ],
    },
    {
      name: "FINTECH & TRANSACTIONAL MODEL",
      badge: "MOST POPULAR",
      badgeStyle: "bg-[#F5A623] text-[#1A1A1A] font-bold shadow-sm",
      forText: "Banks, fintech startups, micro-lenders, and insurers",
      investment: "API integration / Revenue share options",
      isFeatured: true,
      benefits: [
        "Pre-scored farmer credit metric API access",
        "Integrated M-Pesa Native payment checkout flows",
        "Weather-indexed micro-insurance product listings",
        "Automated loan repayment deductions during harvest",
        "Co-branded payment wallets and custom ledger APIs",
        "Dedicated ag-finance developer support team",
      ],
    },
    {
      name: "DEVELOPMENT & GRANT MODEL",
      badge: "Impact & Research",
      badgeStyle: "border border-gray-300 text-gray-700 bg-gray-50",
      forText: "NGOs, county governments, and academic research institutions",
      investment: "Co-funded grants / Project partnerships",
      isFeatured: false,
      benefits: [
        "Co-branded digital agronomy outreach campaigns",
        "Access to regional anonymized soil and yield reports",
        "Customized KPI dashboards tracking project metrics",
        "Field agronomist mobile extension application tools",
        "Priority onboarding for community farmer groups",
      ],
    },
  ];

  return (
    <section className="bg-[#FAF9F6] py-28 px-6 text-center border-t border-gray-200/80">
      <div className="max-w-7xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2D6A4F]">
          COLLABORATION MODELS
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A3D2F] tracking-tight max-w-2xl mx-auto leading-tight">
          Structure Your<br />
          Engagement <span className="text-[#F5A623]">Models.</span>
        </h2>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 items-stretch">
          {models.map((m, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-8 border text-left flex flex-col justify-between transition-all duration-300 ${
                m.isFeatured
                  ? "border-[#F5A623] ring-2 ring-[#F5A623]/20 shadow-xl lg:scale-105"
                  : "border-gray-200 hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${m.badgeStyle}`}>
                    {m.badge}
                  </span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A] tracking-tight mb-2">
                  {m.name}
                </h3>
                <div className="text-xs text-gray-500 mb-4">
                  <span className="font-semibold text-gray-800">Best for:</span> {m.forText}
                </div>
                <div className="bg-[#2D6A4F]/5 border border-[#2D6A4F]/10 rounded-xl p-4 mb-6">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Structure</div>
                  <div className="text-sm font-bold text-[#2D6A4F] mt-0.5">{m.investment}</div>
                </div>

                <div className="h-px bg-gray-100 mb-6" />

                <ul className="space-y-3.5 mb-8">
                  {m.benefits.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed font-light">
                      <Check className="h-4 w-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onSelectTier(m.name)}
                className={`w-full py-3.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                  m.isFeatured
                    ? "bg-[#F5A623] text-[#1A1A1A] hover:bg-[#2D6A4F] hover:text-white"
                    : "bg-[#2D6A4F] text-white hover:bg-[#F5A623] hover:text-[#1A1A1A]"
                }`}
              >
                Select This Model
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
