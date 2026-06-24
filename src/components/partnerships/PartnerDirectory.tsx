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
} from "./PartnerLogos";

interface Partner {
  name: string;
  category: "Finance & Insurance" | "Inputs & Machinery" | "Logistics & Tech" | "Development & NGOs";
  desc: string;
  role: string;
  logoText: string;
  logoUrl?: string;
  renderLogo?: () => React.ReactNode;
}

export function PartnerDirectory() {
  const partners: Partner[] = [
    {
      name: "Osho Chemical Industries",
      category: "Inputs & Machinery",
      desc: "Providing high-quality crop protection solutions, public health products, and animal health supplies to agro-dealers.",
      role: "Agrochemical & Seed Supplier",
      logoText: "Osho",
      logoUrl: oshoLogo,
    },
    {
      name: "Truvets Techno Systems",
      category: "Logistics & Tech",
      desc: "Delivering veterinary care equipment, modern livestock management technology, and automated diagnostic systems.",
      role: "Veterinary Technology Partner",
      logoText: "Truvets",
      logoUrl: truvetsLogo,
    },
    {
      name: "Kenagro Suppliers",
      category: "Inputs & Machinery",
      desc: "Distributing agricultural tools, premium seeds, and tailored fertilizer blends to county cooperative networks.",
      role: "Input Distribution Partner",
      logoText: "Kenagro",
      logoUrl: kenagroLogo,
    },
    {
      name: "Amiram EA",
      category: "Inputs & Machinery",
      desc: "Supplying agrochemicals, premium seeds, and advanced drip irrigation systems for horticulture projects.",
      role: "Irrigation & Inputs Provider",
      logoText: "Amiram",
      renderLogo: () => <AmiramLogo />,
    },
    {
      name: "Unga Farmcare EA",
      category: "Inputs & Machinery",
      desc: "Manufacturing premium animal nutrition, mineral supplements, and quality feeds for dairy and poultry cooperatives.",
      role: "Animal Feed & Care Partner",
      logoText: "Unga",
      logoUrl: ungaLogo,
    },
    {
      name: "Agrosolutions Ltd",
      category: "Development & NGOs",
      desc: "Conducting soil mapping, training local agronomists, and providing sustainable crop consulting services.",
      role: "Agronomy Advisory Partner",
      logoText: "Agrosolutions",
      logoUrl: agrosolutionsLogo,
    },
    {
      name: "Cooper Cooperative Ltd",
      category: "Development & NGOs",
      desc: "Co-develop cooperative administration tools, training resources, and collective marketing programs.",
      role: "Cooperative Support Partner",
      logoText: "Cooper",
      renderLogo: () => <CooperLogo />,
    },
    {
      name: "Norbrook",
      category: "Finance & Insurance",
      desc: "Offering animal care pharmaceutical credit packages and bulk purchase subsidies for veterinary groups.",
      role: "Veterinary Health Partner",
      logoText: "Norbrook",
      logoUrl: norbrookLogo,
    },
    {
      name: "Highchem EA",
      category: "Inputs & Machinery",
      desc: "Distributing high-grade industrial and agricultural chemicals, fertilizers, and field spray equipment.",
      role: "Chemical Distribution Partner",
      logoText: "Highchem",
      renderLogo: () => <HighchemLogo />,
    },
    {
      name: "Yara EA",
      category: "Inputs & Machinery",
      desc: "Supplying premium crop nutrition solutions and digital fertilizer calculator integrations to boost soil health.",
      role: "Crop Nutrition Partner",
      logoText: "Yara",
      logoUrl: yaraLogo,
    },
    {
      name: "Merrychem",
      category: "Inputs & Machinery",
      desc: "Distributing specialized agrochemicals, crop boosters, and foliar feeds to smallholder farmer cooperatives.",
      role: "Agrochemical Partner",
      logoText: "Merrychem",
      logoUrl: merrychemLogo,
    },
  ];

  return (
    <section id="ecosystem" className="bg-[#F8F9FB] py-28 px-6 text-center border-t border-gray-200/80">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-[#1A3D2F] tracking-tight leading-tight">
          Partners we are proud of
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-gray-500 leading-relaxed font-light">
          Collaborating with leading agricultural providers, logistics innovators, and financial systems to support farmers across Kenya.
        </p>

        {/* Directory Grid */}
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {partners.map((p, idx) => (
            <div
              key={idx}
              className="group relative p-4 flex items-center justify-center h-40 hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Logo wrapper */}
              <div className="flex items-center justify-center w-full h-full">
                {p.logoText === "Amiram" ? (
                  <div className="flex items-center gap-4">
                    <AmiramLogo className="h-16 w-16 text-[#2D6A4F]" />
                    <span className="text-xl font-serif font-black text-[#1A1A1A] tracking-wider">AMIRAM</span>
                  </div>
                ) : p.logoText === "Cooper" ? (
                  <div className="flex items-center gap-4">
                    <CooperLogo className="h-16 w-16 text-[#2D6A4F]" />
                    <span className="text-xl font-serif font-black text-[#1A1A1A] tracking-wider">COOPER COOP</span>
                  </div>
                ) : p.logoText === "Highchem" ? (
                  <div className="flex items-center gap-4">
                    <HighchemLogo className="h-16 w-16 text-[#2D6A4F]" />
                    <span className="text-xl font-sans font-black text-[#1A1A1A] tracking-wide">HIGHCHEM</span>
                  </div>
                ) : p.logoUrl ? (
                  <img src={p.logoUrl} alt={`${p.name} logo`} className="h-24 max-w-[90%] object-contain transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <span className="text-xl font-serif font-black text-gray-400 tracking-wider">
                    {p.logoText}
                  </span>
                )}
              </div>

              {/* Custom hover tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-64 bg-slate-900/95 text-white rounded-lg p-3 text-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-20 shadow-lg text-center backdrop-blur-sm">
                <div className="font-bold text-emerald-400 mb-0.5">{p.name}</div>
                <div className="text-[10px] text-slate-300 font-medium mb-1.5">{p.role}</div>
                <div className="text-slate-200 font-light leading-relaxed">{p.desc}</div>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
