import React from "react";

export function AboutPartners() {
  const partners = [
    { name: "KARI", desc: "Agricultural Research" },
    { name: "Safaricom DigiFarm", desc: "Mobile Platform" },
    { name: "One Acre Fund", desc: "Smallholder Inputs" },
    { name: "Equity Bank Agri", desc: "Credit & Financing" },
    { name: "KCB Foundation", desc: "Socio-Economic Impact" },
  ];

  // Currently we render the placeholder fallback box as we don't have SVG assets in /public
  const hasPartnerLogos = false;
  const hasPressLogos = false;

  return (
    <section className="py-16 bg-[#f5f2ed] text-left border-t border-[#0c2e17]/5">
      <div className="mx-auto max-w-6xl px-6">
        
        {/* SUB-SECTION A — Partners */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            We work with
          </span>

          {hasPartnerLogos ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-8">
              {/* If logos were present, they would render here with grayscale and opacity:
                  className="filter grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition duration-200"
              */}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-[#0c2e17]/10 p-8 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-[#0c2e17] uppercase tracking-wider">
                Partner network coming soon
              </span>
              <p className="mt-1 text-[11px] text-gray-400 max-w-md leading-relaxed">
                Strategic integrations in progress with: {partners.map(p => p.name).join(", ")}.
              </p>
            </div>
          )}
        </div>

        {/* SUB-SECTION B — Press / Recognition */}
        {hasPressLogos && (
          <div className="mt-12 pt-12 border-t border-[#0c2e17]/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              As featured in
            </span>
            {/* Conditional render works and is hidden as requested when empty */}
          </div>
        )}

      </div>
    </section>
  );
}
