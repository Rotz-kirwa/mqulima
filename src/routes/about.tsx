import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { Target, Handshake, Globe, Award, Users, ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Mqulima" },
      {
        name: "description",
        content:
          "Our mission: build the most farmer-friendly digital agriculture ecosystem in East Africa.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const [activeStep, setActiveStep] = useState(0);

  const timelineSteps = [
    {
      title: "1. Soil & Seed Diagnostics",
      description: "Every farming journey starts with ground-truth. We analyze local soil structures, seasonal climate anomalies, and certified seed matches to build a high-probability yield map.",
      metric: "95%+ Germination",
      color: "border-[#4EFE98] text-[#4EFE98]",
    },
    {
      title: "2. Precision Field Care",
      description: "Leverage mobile agronomists and AI-driven predictive insights. Farmers receive daily micro-alerts detailing top-dressing times, watering schedules, and preventative crop care.",
      metric: "-30% Input Waste",
      color: "border-[#F5A623] text-[#F5A623]",
    },
    {
      title: "3. Direct Logistics & Soko",
      description: "When the harvest is ready, Mqulima's unified logistics connects cooperative collection points directly to national wholesale hubs, securing premium trade prices.",
      metric: "+40% Profit Margins",
      color: "border-cyan-400 text-cyan-400",
    },
  ];

  const teamTiers = [
    {
      role: "Agronomists & Experts",
      specialty: "Soil Chemists, Extension Officers, Horticulture Vets",
      description: "Vetting seed varieties, auditing crop protocols, and publishing real-time market news weekly.",
      accent: "from-[#4EFE98] to-teal-500 text-[#4EFE98]",
    },
    {
      role: "Supply & Logistics Vets",
      specialty: "Cold Storage, Cooperative Dispatchers, Quality Auditors",
      description: "Guaranteeing zero-counterfeit chemical inputs and ensuring fast transport times to reduce post-harvest loss.",
      accent: "from-[#F5A623] to-orange-500 text-[#F5A623]",
    },
    {
      role: "Technology Engineers",
      specialty: "AI Developers, IoT Engineers, USSD/SMS Integrators",
      description: "Architecting the digital foundation that keeps Mqulima running offline in the most remote counties.",
      accent: "from-cyan-400 to-blue-500 text-cyan-400",
    },
  ];

  return (
    <AppLayout>
      <div className="bg-[#FAF9F5] min-h-screen font-sans selection:bg-[#4EFE98] selection:text-[#060E08] relative text-[#0A1E0C] text-left overflow-hidden">
        
        {/* ================= SECTION 1 — PREMIUM HERO (OBSIDIAN DARK) ================= */}
        <section className="relative bg-[#060E08] text-white pt-32 pb-24 px-6 sm:px-12 border-b border-[#2D6A4F]/20">
          {/* Decorative Grid and Glow Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: "radial-gradient(white 2px, transparent 2px)", backgroundSize: "24px 24px" }} 
          />
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#4EFE98]/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              
              {/* Left Column: Heading & Summary */}
              <div className="lg:col-span-7 space-y-8">
                <div className="inline-flex items-center gap-2 border border-[#4EFE98]/30 bg-[#4EFE98]/5 px-4.5 py-1.5 rounded-none text-[10px] font-black uppercase tracking-[0.25em] text-[#4EFE98] shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[#F5A623]" />
                  Discover Our Story
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black font-serif leading-[1.02] tracking-tight text-white">
                  Taking farmers <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4EFE98] via-[#52B788] to-teal-400 italic">first class.</span>
                </h1>
                
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl font-medium">
                  Mqulima is East Africa's premium agricultural ecosystem. We merge <strong className="text-white">ground-truth diagnostics</strong>, <strong className="text-white">genuine inputs</strong>, and <strong className="text-white">expert networks</strong> into a cohesive workspace so smallholder farmers can scale operations with complete confidence.
                </p>

                {/* Quick stats ribbon */}
                <div className="pt-8 grid grid-cols-3 gap-6 border-t border-[#2D6A4F]/30 max-w-xl">
                  <div>
                    <div className="text-3xl sm:text-4xl font-serif font-black text-[#4EFE98]">5,000+</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">Active Cultivators</div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-serif font-black text-[#4EFE98]">47</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">Counties Mapped</div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-serif font-black text-[#4EFE98]">100%</div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">Authenticity Vetted</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Poster Block with sharp border offset */}
              <div className="lg:col-span-5 relative group">
                <div className="absolute inset-0 border border-[#4EFE98] translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300" />
                <div className="border-2 border-[#4EFE98] bg-[#060E08] p-2">
                  <div className="aspect-[4/3] sm:aspect-square bg-gray-950 relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&auto=format&fit=crop&q=80" 
                      alt="Premium African crop harvest"
                      className="w-full h-full object-cover opacity-90 transition duration-750 group-hover:scale-105 group-hover:opacity-100"
                    />
                    <div className="absolute bottom-4 left-4 bg-[#060E08] text-[#4EFE98] text-[9px] font-black uppercase tracking-widest px-4 py-2 border border-[#4EFE98]/40 shadow-lg">
                      Farming is Freedom
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= SECTION 2 — DYNAMIC PROCESS TIMELINE (LIGHT PARCHMENT) ================= */}
        <section className="py-24 px-6 sm:px-12 bg-[#FAF9F5] border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              
              {/* Left Column: Heading */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-[#2D6A4F] text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-[#2D6A4F]"></span> The Process
                </span>
                
                <h2 className="text-4xl sm:text-5xl font-black font-serif text-[#0A1E0C] leading-[1.1] tracking-tight">
                  How we optimize your production cycle.
                </h2>
                
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
                  We have unified the fragmented agricultural supply chain into three clean, standardized stages. Click each stage to see how we protect your yield and secure wholesale pricing.
                </p>

                {/* Progress Visualizer */}
                <div className="hidden lg:block relative pl-6 border-l-2 border-gray-250 space-y-8 py-2 mt-8">
                  {timelineSteps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`text-left block transition duration-300 -ml-[25px] flex items-center gap-4 group`}
                    >
                      <div className={`h-[18px] w-[18px] rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                        activeStep === idx ? "border-[#2D6A4F] scale-125" : "border-gray-300 group-hover:border-gray-500"
                      }`}>
                        <div className={`h-2.5 w-2.5 rounded-full transition ${activeStep === idx ? "bg-[#2D6A4F]" : "bg-transparent"}`} />
                      </div>
                      <span className={`text-xs font-black uppercase tracking-wider transition ${
                        activeStep === idx ? "text-[#2D6A4F] font-extrabold" : "text-gray-400 group-hover:text-gray-600"
                      }`}>{step.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Display Panel */}
              <div className="lg:col-span-7">
                <div className="border-2 border-[#0A1E0C] p-8 sm:p-12 relative overflow-hidden bg-white shadow-[8px_8px_0px_#0A1E0C]">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(#0A1E0C 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }} />
                  
                  {/* Step content */}
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start border-b border-gray-150 pb-5">
                      <h3 className="text-2xl font-serif font-black text-[#0A1E0C] leading-snug">
                        {timelineSteps[activeStep].title}
                      </h3>
                      <span className={`text-[10px] font-black uppercase tracking-widest bg-emerald-50 border px-3 py-1.5 border-[#2D6A4F]/20 text-[#2D6A4F]`}>
                        {timelineSteps[activeStep].metric}
                      </span>
                    </div>

                    <p className="text-gray-600 text-base leading-relaxed font-medium">
                      {timelineSteps[activeStep].description}
                    </p>

                    <div className="pt-4 flex items-center gap-4">
                      <div className="flex gap-2">
                        <div className="h-1.5 w-10 bg-[#2D6A4F]" />
                        <div className={`h-1.5 w-10 transition-colors duration-300 ${activeStep >= 1 ? "bg-[#2D6A4F]" : "bg-gray-200"}`} />
                        <div className={`h-1.5 w-10 transition-colors duration-300 ${activeStep >= 2 ? "bg-[#2D6A4F]" : "bg-gray-200"}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Step {activeStep + 1} of 3</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Selector Ribbon */}
                <div className="flex justify-between mt-8 lg:hidden gap-2">
                  {timelineSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`flex-1 text-center py-3 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                        activeStep === idx 
                          ? "border-[#0A1E0C] bg-[#0A1E0C] text-white" 
                          : "border-gray-250 bg-white text-gray-500"
                      }`}
                    >
                      Stage {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ================= SECTION 3 — SHARP VALUES GRID (DEEP FOREST DARK) ================= */}
        <section className="py-24 px-6 sm:px-12 bg-[#08170F] text-white relative">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(white 2px, transparent 2px)", backgroundSize: "32px 32px" }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#4EFE98]/3 bg-opacity-20 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
              <span className="inline-flex items-center gap-2 border border-[#4EFE98]/20 bg-[#4EFE98]/5 px-4.5 py-1.5 rounded-none text-[10px] font-black uppercase tracking-[0.25em] text-[#4EFE98]">
                Our Guiding Pillars
              </span>
              <h2 className="text-4xl sm:text-5xl font-black font-serif text-white tracking-tight">
                Strict standards for regional growth
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Value 1 */}
              <div className="bg-[#0B130E] border border-[#2D6A4F]/40 p-8 hover:border-[#4EFE98]/60 transition-all duration-300 flex flex-col group relative overflow-hidden">
                <div className="w-12 h-12 border border-[#2D6A4F]/60 bg-[#08170F] flex items-center justify-center mb-6 group-hover:bg-[#4EFE98] group-hover:text-[#060E08] transition-colors duration-300">
                  <Target className="w-5 h-5 text-[#4EFE98] group-hover:text-[#060E08]" strokeWidth={2.5} />
                </div>
                <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wide font-serif">Farmer First</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-medium">
                  We don't optimize for brokers or retail giants. Every feature, checkout pathway, and tool is built to maximize direct profits for the grower.
                </p>
              </div>

              {/* Value 2 */}
              <div className="bg-[#0B130E] border border-[#2D6A4F]/40 p-8 hover:border-[#4EFE98]/60 transition-all duration-300 flex flex-col group relative overflow-hidden">
                <div className="w-12 h-12 border border-[#2D6A4F]/60 bg-[#08170F] flex items-center justify-center mb-6 group-hover:bg-[#4EFE98] group-hover:text-[#060E08] transition-colors duration-300">
                  <ShieldCheck className="w-5 h-5 text-[#4EFE98] group-hover:text-[#060E08]" strokeWidth={2.5} />
                </div>
                <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wide font-serif">Verified Supply</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-medium">
                  Counterfeit feeds and chemicals destroy livelihood. We verify manufacturers and audit catalog batches to ensure zero counterfeits.
                </p>
              </div>

              {/* Value 3 */}
              <div className="bg-[#0B130E] border border-[#2D6A4F]/40 p-8 hover:border-[#4EFE98]/60 transition-all duration-300 flex flex-col group relative overflow-hidden">
                <div className="w-12 h-12 border border-[#2D6A4F]/60 bg-[#08170F] flex items-center justify-center mb-6 group-hover:bg-[#4EFE98] group-hover:text-[#060E08] transition-colors duration-300">
                  <Globe className="w-5 h-5 text-[#4EFE98] group-hover:text-[#060E08]" strokeWidth={2.5} />
                </div>
                <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wide font-serif">County Coordinates</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-medium">
                  Soil structures differ from Rift Valley to Coastal dunes. We coordinate all diagnostic weather models to the precise county of origin.
                </p>
              </div>

              {/* Value 4 */}
              <div className="bg-[#0B130E] border border-[#2D6A4F]/40 p-8 hover:border-[#4EFE98]/60 transition-all duration-300 flex flex-col group relative overflow-hidden">
                <div className="w-12 h-12 border border-[#2D6A4F]/60 bg-[#08170F] flex items-center justify-center mb-6 group-hover:bg-[#4EFE98] group-hover:text-[#060E08] transition-colors duration-300">
                  <Zap className="w-5 h-5 text-[#4EFE98] group-hover:text-[#060E08]" strokeWidth={2.5} />
                </div>
                <h3 className="text-white font-black text-xl mb-3 uppercase tracking-wide font-serif">Hyper-Speed Support</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-medium">
                  Crops don't wait. Our live support team, automated AI doctor, and WhatsApp hotline guarantee resolution options in under an hour.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================= SECTION 4 — HYBRID MANIFESTO (VIBRANT SPLIT DARK) ================= */}
        <section className="py-28 px-6 sm:px-12 bg-[#060E08] text-white relative overflow-hidden border-b border-[#2D6A4F]/20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FAF9F5]/2 bg-opacity-10 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#F5A623]/3 bg-opacity-20 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
            
            {/* Left side */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[#F5A623] text-xs font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <span className="w-6 h-[2px] bg-[#F5A623]"></span> The Platform Manifesto
              </span>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black font-serif leading-[1.05] text-white">
                5 billion voices.<br />
                <span className="text-[#4EFE98] italic font-serif">99% is noise.</span>
              </h2>
            </div>

            {/* Right side */}
            <div className="lg:col-span-7 space-y-8">
              <p className="text-gray-300 text-lg leading-relaxed font-medium">
                The modern agricultural sector is flooded with speculative reports, untested input brands, and third-party brokers playing informational arbitrage. 
              </p>
              <p className="text-gray-300 text-lg leading-relaxed font-medium">
                Mqulima filters the noise. We establish <strong className="text-[#4EFE98]">direct digital pathways</strong> that link the diagnostic test tube to the cooperative silo, bringing verified science and high-speed execution straight to the farm gate.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-4">
                <span className="bg-[#4EFE98]/10 text-[#4EFE98] border border-[#4EFE98]/30 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest">
                  Bold Architecture
                </span>
                <span className="bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/30 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest">
                  Reliable Inputs
                </span>
                <span className="bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest">
                  The Future
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ================= SECTION 5 — TEAM TIERS (LIGHT PARCHMENT) ================= */}
        <section className="py-24 px-6 sm:px-12 bg-white relative">
          <div className="max-w-7xl mx-auto space-y-16">
            
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="w-12 h-12 border-2 border-[#0A1E0C] bg-[#FAF9F5] flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-[3px_3px_0px_#0A1E0C]">
                <Users className="w-5 h-5 text-[#0A1E0C]" />
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-black font-serif text-[#0A1E0C] tracking-tight">
                Built by operators who believe in smallholders
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
                We bring together specialized field operators, supply-chain architects, and technologists who wake up daily to make agricultural logistics work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamTiers.map((tier, idx) => (
                <div 
                  key={idx}
                  className="bg-[#FAF9F5] border-2 border-[#0A1E0C] p-8 flex flex-col justify-between hover:shadow-[8px_8px_0px_#0A1E0C] transition-all duration-300 relative group"
                >
                  {/* offset visual index number */}
                  <span className="absolute top-4 right-4 text-xs font-black text-gray-300 group-hover:text-[#2D6A4F] transition-colors duration-300">0{idx + 1}</span>
                  
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-[#0A1E0C] font-serif border-b border-gray-250 pb-3 leading-snug">{tier.role}</h3>
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#2D6A4F]">{tier.specialty}</p>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
                      {tier.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ================= SECTION 6 — PREMIUM CTA PANEL (OBSIDIAN DARK) ================= */}
        <section className="py-20 px-6 sm:px-12 bg-[#FAF9F5] pb-28">
          <div className="max-w-5xl mx-auto bg-[#060E08] border-2 border-[#4EFE98] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Glowing grids */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "radial-gradient(white 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#4EFE98]/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-serif text-white tracking-tight leading-tight">
                Be part of our <span className="text-[#F5A623] italic font-serif">story.</span>
              </h2>
              
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto font-medium">
                Join the cooperatives, agronomists, and retail operators building East Africa's most robust digital farming platform.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
                <a 
                  href="/shop" 
                  className="w-full sm:w-auto bg-[#F5A623] hover:bg-[#E0951F] text-[#0A1E0C] font-black text-xs uppercase tracking-widest py-4 px-8 rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(245,166,35,0.3)] border border-[#060E08]"
                >
                  Explore Shop <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="/services" 
                  className="w-full sm:w-auto bg-transparent border border-white/20 hover:border-white text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-none transition duration-300 cursor-pointer"
                >
                  Book Service
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
