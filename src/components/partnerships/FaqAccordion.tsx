import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

export function FaqAccordion() {
  const faqs = [
    {
      q: "What's the minimum commitment for a Strategic Partnership?",
      a: "Strategic Partnerships are based on mutually aligned goals, typically requiring a minimum 12-month commitment. This guarantees appropriate developer resource allocation, integration support, and cooperative network boarding times.",
    },
    {
      q: "Do you support non-Kenyan organizations?",
      a: "Yes, we support international partners, NGOs, input manufacturers, and funds looking to deploy capital, resources, or services within Kenya.",
    },
    {
      q: "How does the API integration process work?",
      a: "Once your Strategic or Investment Partnership is approved, our developer relations team shares custom API keys, sandbox endpoints, and comprehensive documentation to integrate M-Pesa Native payment flows, agronomy reporting, or shop logistics directly.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="bg-[#FAF9F6] py-28 px-6 text-center border-t border-gray-200/80">
      <div className="max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#2D6A4F]">
          FAQ
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1A3D2F] tracking-tight leading-tight">
          Frequently Asked Questions.
        </h2>

        <div className="mt-16 text-left bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`py-5 ${idx > 0 ? "border-t border-gray-100" : ""}`}>
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-4 text-left py-2 focus:outline-none group cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-[#1A1A1A] group-hover:text-[#2D6A4F] transition-colors duration-200">
                    {faq.q}
                  </span>
                  <div className="text-[#2D6A4F] shrink-0">
                    {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </div>
                </button>
                
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-light">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
