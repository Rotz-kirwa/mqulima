import React from "react";
import yaraLogo from "@/assets/yara-logo.png";
import oshoLogo from "@/assets/osho-logo.png";
import truvetsLogo from "@/assets/truvets-logo.png";
import norbrookLogo from "@/assets/norbrook-logo.png";
import merrychemLogo from "@/assets/merrychem-logo.png";
import agrosolutionsLogo from "@/assets/agrosolutions-logo.png";
import ungaLogo from "@/assets/unga-logo.png";
import kenagroLogo from "@/assets/kenagro-logo.png";
import {
  AmiramLogo,
  CooperLogo,
  HighchemLogo
} from "../partnerships/PartnerLogos";

export function PartnerMarquee() {
  const customLogos = [
    // 1. Osho Chemical Industries
    <div key="osho" className="flex items-center justify-center px-12 shrink-0">
      <img src={oshoLogo} alt="Osho Chemical Industries Logo" className="h-22 object-contain" loading="eager" />
    </div>,

    // 2. Truvets Techno Systems
    <div key="truvets" className="flex items-center justify-center px-12 shrink-0">
      <img src={truvetsLogo} alt="Truvets Techno Systems Logo" className="h-22 object-contain" loading="eager" />
    </div>,

    // 3. Kenagro Suppliers
    <div key="kenagro" className="flex items-center justify-center px-12 shrink-0">
      <img src={kenagroLogo} alt="Kenagro Suppliers Logo" className="h-22 object-contain" loading="eager" />
    </div>,

    // 4. Amiram EA
    <div key="amiram" className="flex items-center justify-center px-12 shrink-0">
      <div className="flex items-center gap-4">
        <AmiramLogo className="h-14 w-14 text-[#2D6A4F]" />
        <span className="text-lg font-serif font-black text-[#1A1A1A] tracking-wider">AMIRAM</span>
      </div>
    </div>,

    // 5. Unga Farmcare EA
    <div key="unga" className="flex items-center justify-center px-12 shrink-0">
      <img src={ungaLogo} alt="Unga Farmcare EA Logo" className="h-22 object-contain" loading="eager" />
    </div>,

    // 6. Agrosolutions Ltd
    <div key="agrosolutions" className="flex items-center justify-center px-12 shrink-0">
      <img src={agrosolutionsLogo} alt="Agrosolutions Logo" className="h-22 object-contain" loading="eager" />
    </div>,

    // 7. Cooper Cooperative Ltd
    <div key="cooper" className="flex items-center justify-center px-12 shrink-0">
      <div className="flex items-center gap-4">
        <CooperLogo className="h-14 w-14 text-[#2D6A4F]" />
        <span className="text-lg font-serif font-black text-[#1A1A1A] tracking-wider">COOPER COOP</span>
      </div>
    </div>,

    // 8. Norbrook
    <div key="norbrook" className="flex items-center justify-center px-12 shrink-0">
      <img src={norbrookLogo} alt="Norbrook Logo" className="h-22 object-contain" loading="eager" />
    </div>,

    // 9. Highchem EA
    <div key="highchem" className="flex items-center justify-center px-12 shrink-0">
      <div className="flex items-center gap-4">
        <HighchemLogo className="h-14 w-14 text-[#2D6A4F]" />
        <span className="text-lg font-sans font-black text-[#1A1A1A] tracking-wide">HIGHCHEM</span>
      </div>
    </div>,

    // 10. Yara EA
    <div key="yara" className="flex items-center justify-center px-12 shrink-0">
      <img src={yaraLogo} alt="Yara EA Logo" className="h-22 object-contain brightness-95 contrast-125" loading="eager" />
    </div>,

    // 11. Merrychem
    <div key="merrychem" className="flex items-center justify-center px-12 shrink-0">
      <img src={merrychemLogo} alt="Merrychem Logo" className="h-22 object-contain" loading="eager" />
    </div>
  ];

  return (
    <section className="bg-white border-t border-b border-gray-150/80 py-12 overflow-hidden relative w-full">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 45s linear infinite;
        }
        .marquee-wrapper:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#2D6A4F]">
          TRUSTED BY LEADING AGRICULTURAL ORGANIZATIONS
        </span>
      </div>

      <div className="flex w-full overflow-hidden relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-20 before:bg-gradient-to-r before:from-white before:to-transparent before:z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-20 after:bg-gradient-to-l after:from-white after:to-transparent after:z-10">
        <div className="marquee-wrapper flex w-max flex-nowrap">
          {/* First Track */}
          <div className="flex shrink-0 items-center animate-marquee">
            {customLogos}
          </div>
          {/* Second Track (Identical clone with unique keys to satisfy React) */}
          <div className="flex shrink-0 items-center animate-marquee" aria-hidden="true">
            {customLogos.map((logo, idx) => React.cloneElement(logo, { key: `dup-${logo.key}-${idx}` }))}
          </div>
        </div>
      </div>
    </section>
  );
}
