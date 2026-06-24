import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { PartnerDirectory } from "@/components/partnerships/PartnerDirectory";
import { PartnershipOpportunities } from "@/components/partnerships/PartnershipOpportunities";
import { TierCards } from "@/components/partnerships/TierCards";
import { CaseStudies } from "@/components/partnerships/CaseStudies";
import { PartnershipForm } from "@/components/partnerships/PartnershipForm";
import { FaqAccordion } from "@/components/partnerships/FaqAccordion";

export const Route = createFileRoute("/partnerships")({
  head: () => ({
    meta: [
      { title: "Partnerships & Onboarding · Mqulima" },
      {
        name: "description",
        content: "Collaborate with Kenya's leading digital agricultural network. Access crop intelligence, transaction infrastructure, and verified cooperatives.",
      },
    ],
  }),
  component: PartnershipsPage,
});

function PartnershipsPage() {
  const [selectedTier, setSelectedTier] = useState("");

  const handleSelectTier = (tierName: string) => {
    setSelectedTier(tierName);
  };

  const handleApplyToPartnerClick = () => {
    // Scroll to form and set default model to FINTECH & TRANSACTIONAL MODEL
    setSelectedTier("FINTECH & TRANSACTIONAL MODEL");
  };

  const handleDownloadDeck = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success("Downloading Mqulima Integration Guide (PDF)...");
  };

  const handleScheduleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success("Scheduling an onboarding call with our developer relations team...");
  };

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen font-sans overflow-x-hidden selection:bg-[#F5A623] selection:text-[#1A1A1A]">
        
        {/* Style block for drift and stagger animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes networkDrift {
            0% { transform: scale(1) translate(0px, 0px) rotate(0deg); }
            33% { transform: scale(1.05) translate(15px, -15px) rotate(2deg); }
            66% { transform: scale(0.98) translate(-10px, 10px) rotate(-1deg); }
            100% { transform: scale(1) translate(0px, 0px) rotate(0deg); }
          }
          .animate-network-drift {
            animation: networkDrift 30s infinite ease-in-out;
          }
          @keyframes slideFromRight {
            from { opacity: 0; transform: translateX(40px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-slide-1 {
            animation: slideFromRight 600ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both;
          }
          .animate-slide-2 {
            animation: slideFromRight 600ms cubic-bezier(0.16, 1, 0.3, 1) 550ms both;
          }
          .animate-slide-3 {
            animation: slideFromRight 600ms cubic-bezier(0.16, 1, 0.3, 1) 700ms both;
          }
        `}} />

        {/* SECTION 1 — HERO */}
        <section className="relative flex flex-col justify-center py-16 px-6 overflow-hidden bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] text-white">
          
          {/* Radial Glow Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />

          {/* SVG Network Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <svg
              className="w-[140%] h-[140%] min-w-[800px] animate-network-drift text-white"
              viewBox="0 0 1000 1000"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              {/* Nodes */}
              <circle cx="200" cy="150" r="4" fill="#F5A623" />
              <circle cx="500" cy="100" r="4" fill="#ffffff" />
              <circle cx="800" cy="200" r="4" fill="#ffffff" />
              <circle cx="150" cy="450" r="4" fill="#ffffff" />
              <circle cx="450" cy="500" r="4" fill="#F5A623" />
              <circle cx="850" cy="400" r="4" fill="#ffffff" />
              <circle cx="300" cy="800" r="4" fill="#ffffff" />
              <circle cx="700" cy="750" r="4" fill="#F5A623" />

              {/* Connecting Lines */}
              <line x1="200" y1="150" x2="500" y2="100" />
              <line x1="500" y1="100" x2="800" y2="200" />
              <line x1="200" y1="150" x2="150" y2="450" />
              <line x1="150" y1="450" x2="450" y2="500" />
              <line x1="450" y1="500" x2="500" y2="100" />
              <line x1="500" y1="100" x2="850" y2="400" />
              <line x1="850" y1="400" x2="700" y2="750" />
              <line x1="450" y1="500" x2="300" y2="800" />
              <line x1="300" y1="800" x2="700" y2="750" />
              <line x1="150" y1="450" x2="300" y2="800" />
              <line x1="800" y1="200" x2="850" y2="400" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto w-full relative z-10">
            {/* Centered Content container */}
            <div className="max-w-3xl text-left space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5A623] block">
                COLLABORATIVE NETWORK
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight leading-tight text-white">
                Building Africa's<br />
                Agricultural Ecosystem
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm text-white/80 font-light leading-relaxed">
                Connecting farmers, cooperatives, suppliers, financial institutions, logistics providers, and agribusiness leaders through one digital platform.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={handleApplyToPartnerClick}
                  className="bg-[#F5A623] hover:bg-white text-[#1A1A1A] font-bold text-xs uppercase tracking-wider px-7 py-3.5 rounded-xl transition duration-300 shadow-md cursor-pointer"
                >
                  Become a Partner
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — PARTNER DIRECTORY */}
        <PartnerDirectory />

        {/* SECTION 4 — PARTNERSHIP OPPORTUNITIES */}
        <PartnershipOpportunities />

        {/* SECTION 5 — COLLABORATION MODELS */}
        <TierCards onSelectTier={handleSelectTier} />

        {/* SECTION 6 — SOCIAL PROOF / CASE STUDIES */}
        <CaseStudies />

        {/* SECTION 7 — SERVICE PROVIDER ONBOARDING FORM */}
        <PartnershipForm selectedTier={selectedTier} />

        {/* SECTION 8 — FAQ ACCORDION */}
        <FaqAccordion />

        {/* SECTION 9 — FOOTER CTA BAND */}
        <section className="bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] py-28 px-6 text-center border-t border-[#1E3A2F]/40 relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(245,166,35,0.05)_0%,transparent_60%)] pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10 space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight">
              Africa's agricultural transformation<br />
              won't wait. Neither should you.
            </h2>
            <div className="pt-4 flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleApplyToPartnerClick}
                className="bg-[#F5A623] hover:bg-white text-[#1A1A1A] font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-xl transition duration-300 cursor-pointer"
              >
                Onboard With Us
              </button>
              <a
                href="#call"
                onClick={handleScheduleCall}
                className="border border-white/30 hover:border-white hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-xl transition duration-300 cursor-pointer"
              >
                Schedule Onboarding Call
              </a>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
