import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { 
  Target, 
  Handshake, 
  Globe, 
  Award, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Sprout, 
  TrendingUp, 
  BookOpen, 
  Network, 
  Lightbulb, 
  HeartHandshake 
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Mkulima" },
      {
        name: "description",
        content: "Discover Mkulima — Africa's premier digital farming ecosystem delivering agricultural solutions first class.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const [activeTimeline, setActiveTimeline] = useState(0);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const timelineData = [
    {
      period: "The Beginning",
      title: "Rooted in Purpose",
      subtitle: "Visions to solve the fundamental challenges facing smallholders.",
      description: "We started in Eldoret with a simple question: How can technology eliminate information asymmetry and secure fair value for farmers? Our journey began with soil health research and direct cataloging of verified seed supplies.",
      metric: "Est. 2024"
    },
    {
      period: "The Transformation",
      title: "Cultivating the Ecosystem",
      subtitle: "Unifying the agricultural community on a singular digital plane.",
      description: "By integrating AI diagnostic tools, logistics dispatch networks, and a direct digital marketplace, we connected remote cooperatives directly with national wholesale buyers, eliminating middleman arbitrage.",
      metric: "50k+ Empowered"
    },
    {
      period: "The Future",
      title: "Sustainable Prosperity",
      subtitle: "Sustaining a resilient and intelligent farming economy.",
      description: "Our vision expands beyond boundaries, introducing predictive yield models, carbon-credit initiatives, and cross-border cold-chain logistics to position African agriculture at the forefront of global trade.",
      metric: "Carbon Neutral 2030"
    }
  ];

  const whyChooseUs = [
    {
      title: "Digital Farming Excellence",
      description: "Modern analytics and diagnostic tools designed to put real-time precision in the hands of today's progressive farmer.",
      icon: Sprout,
      bgClass: "bg-gradient-to-br from-[#123B27] to-[#0A1E13]",
      borderClass: "border-[#1D5E3E]/45",
      textClass: "text-white",
      descClass: "text-emerald-100/70",
      iconBg: "bg-emerald-500/10 text-emerald-300",
      glowBg: "bg-emerald-400/5",
    },
    {
      title: "Market Connection",
      description: "Empowering growers to bypass brokers and access direct, premium wholesale purchasing networks globally.",
      icon: TrendingUp,
      bgClass: "bg-gradient-to-br from-[#8C6D1F] to-[#4F3E12]",
      borderClass: "border-[#A6832B]/45",
      textClass: "text-white",
      descClass: "text-amber-100/70",
      iconBg: "bg-amber-500/10 text-[#F3CD5F]",
      glowBg: "bg-amber-400/5",
    },
    {
      title: "Trusted Agricultural Network",
      description: "A secure, verified ecosystem connecting vetted farmers, suppliers, logistics handlers, and agronomists.",
      icon: Network,
      bgClass: "bg-gradient-to-br from-[#162E5C] to-[#0E1B36]",
      borderClass: "border-[#22488F]/45",
      textClass: "text-white",
      descClass: "text-blue-100/70",
      iconBg: "bg-blue-500/10 text-blue-300",
      glowBg: "bg-blue-400/5",
    },
    {
      title: "Knowledge Empowerment",
      description: "Providing scientific soil reviews, crop calendar automation, and structured digital training through Mkulima Academy.",
      icon: BookOpen,
      bgClass: "bg-gradient-to-br from-[#401C4A] to-[#25102B]",
      borderClass: "border-[#622E70]/45",
      textClass: "text-white",
      descClass: "text-purple-100/70",
      iconBg: "bg-purple-500/10 text-purple-300",
      glowBg: "bg-purple-400/5",
    },
    {
      title: "Innovation First",
      description: "Developing robust offline USSD solutions, automated AI diagnostic models, and dynamic marketplace bidding tools.",
      icon: Lightbulb,
      bgClass: "bg-gradient-to-br from-[#065057] to-[#043337]",
      borderClass: "border-[#0B7D87]/45",
      textClass: "text-white",
      descClass: "text-cyan-100/70",
      iconBg: "bg-cyan-500/10 text-cyan-300",
      glowBg: "bg-cyan-400/5",
    },
    {
      title: "Sustainable Growth",
      description: "Fostering long-term ecological balance through soil regeneration audits, water efficiency tools, and ethical trade models.",
      icon: HeartHandshake,
      bgClass: "bg-gradient-to-br from-[#73351C] to-[#451F10]",
      borderClass: "border-[#A34E2B]/45",
      textClass: "text-white",
      descClass: "text-orange-100/70",
      iconBg: "bg-orange-500/10 text-orange-300",
      glowBg: "bg-orange-400/5",
    },
  ];

  const values = [
    {
      number: "I",
      name: "Excellence",
      description: "We believe agriculture deserves first-class solutions. Average is not an option; we bring premium execution to the soil.",
    },
    {
      number: "II",
      name: "Integrity",
      description: "Building unshakeable trust through absolute supply verification, transparent billing, and zero-counterfeit input guarantees.",
    },
    {
      number: "III",
      name: "Innovation",
      description: "Constantly redefining the boundaries of agricultural productivity by applying modern software engineering to seasonal challenges.",
    },
    {
      number: "IV",
      name: "Community",
      description: "Co-authoring success stories. We grow in lockstep with the agricultural cooperatives, agronomists, and buyers we serve.",
    },
    {
      number: "V",
      name: "Sustainability",
      description: "Securing the future. Our digital diagnostic models are tuned to ensure soil longevity and resource responsibility for generations.",
    },
  ];

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] min-h-screen font-sans selection:bg-[#D4AF37] selection:text-[#0D2A1C] text-[#0D2A1C] text-left relative overflow-hidden">
        
        {/* ================= SECTION 1: LUXURY HERO SECTION ================= */}
        <section className="relative pt-24 pb-12 px-6 sm:px-12 overflow-hidden bg-[#0A1E0C]">
          
          {/* Atmospheric background overlays and gradients */}
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#112E22] to-[#0A1E0C]">
            {/* Ambient gold glow spotlights */}
            <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
            <div className="absolute bottom-[-100px] right-[-50px] w-[350px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[90px] pointer-events-none" />
            {/* Animated gold particles layer */}
            <div className="absolute inset-0 opacity-[0.03]" 
              style={{ 
                backgroundImage: "radial-gradient(#D4AF37 2px, transparent 2px)", 
                backgroundSize: "32px 32px" 
              }} 
            />
          </div>

          <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
            
            {/* Left text column */}
            <div className="lg:col-span-7 space-y-8">
              <span className="inline-flex items-center gap-2 border border-[#D4AF37]/45 bg-[#D4AF37]/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#F3CD5F] shadow-md backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#F3CD5F] animate-pulse" />
                Mkulima — Taking You First Class
              </span>
              
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-serif leading-[1.05] tracking-tight text-white">
                  Taking Agriculture <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3CD5F] via-[#D4AF37] to-amber-200 italic font-serif">Beyond Boundaries</span>
                </h1>
                
                <p className="text-gray-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl font-medium">
                  Mkulima is redefining farming by connecting farmers, businesses, buyers, and agricultural innovators through technology, knowledge, and opportunity.
                </p>
              </div>

              {/* Luxurious CTA buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => scrollToSection("our-story")}
                  className="group inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#0D2A1C] font-extrabold text-xs sm:text-sm uppercase tracking-wider py-4.5 px-8 rounded-xl shadow-lg shadow-[#D4AF37]/10 hover:shadow-xl hover:shadow-[#D4AF37]/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Discover Our Journey
                  <ArrowRight className="w-4 h-4 transition-transform duration-250 group-hover:translate-x-1" />
                </button>
                <Link 
                  to="/auth/sign-up"
                  className="inline-flex items-center justify-center bg-transparent border border-white/25 hover:border-[#D4AF37] text-white hover:text-[#F3CD5F] font-bold text-xs sm:text-sm uppercase tracking-wider py-4.5 px-8 rounded-xl backdrop-blur-sm transition duration-300 cursor-pointer"
                >
                  Join The Future Of Farming
                </Link>
              </div>
            </div>

            {/* Right graphic column with luxury glass-effect frame */}
            <div className="lg:col-span-5 relative group">
              <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-3xl blur-2xl pointer-events-none" />
              
              <div className="bg-white/5 border border-white/10 rounded-3xl p-3.5 backdrop-blur-md shadow-2xl relative">
                {/* Thin gold corner highlights */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] rounded-br-xl" />
                
                <div className="aspect-[4/3] sm:aspect-square bg-emerald-950/20 relative overflow-hidden rounded-2xl">
                  <img 
                    src="https://i.pinimg.com/736x/95/bb/1b/95bb1ba4bc02563f8274bdd5a9ff6e77.jpg" 
                    alt="African farmer planting crops" 
                    className="w-full h-full object-cover filter brightness-90 contrast-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2A1C]/80 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-[#0D2A1C]/90 text-white p-4 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm flex justify-between items-center">
                    <div className="text-left">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]">Active Innovation</p>
                      <p className="text-xs font-serif font-bold text-white">First-Class Agritech</p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/25 border border-emerald-400/20 text-emerald-300 px-2.5 py-1 rounded-full font-black">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================= SECTION 2: OUR STORY SECTION (WHERE TRADITION MEETS INNOVATION) ================= */}
        <section id="our-story" className="py-24 px-6 sm:px-12 relative bg-[#FAF9F6]">
          {/* Subtle leaves pattern glow */}
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start relative z-10">
            
            {/* Story text (left column) */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-[2px] bg-emerald-600"></span> Our Heritage
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#0D2A1C] leading-tight tracking-tight">
                Where Tradition <br />Meets Innovation
              </h2>
              
              <p className="text-gray-650 text-base leading-relaxed font-medium">
                Mkulima was created with a vision to transform agriculture into a modern, profitable, and connected ecosystem. We believe every farmer deserves access to opportunities, information, markets, and technology that can unlock their full potential.
              </p>

              <div className="pt-6 border-t border-[#D4AF37]/20 flex items-center gap-6">
                <div>
                  <h4 className="text-3xl font-serif font-black text-[#D4AF37]">2024</h4>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">Foundation Rooted</p>
                </div>
                <div className="h-10 w-[1px] bg-gray-200" />
                <div>
                  <h4 className="text-3xl font-serif font-black text-[#D4AF37]">47</h4>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">Counties Reached</p>
                </div>
              </div>
            </div>

            {/* Timeline component (right column) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="relative pl-6 border-l-2 border-[#D4AF37]/35 space-y-8">
                {timelineData.map((item, idx) => (
                  <div 
                    key={idx}
                    onMouseEnter={() => setActiveTimeline(idx)}
                    className="relative group transition-all duration-300 cursor-pointer"
                  >
                    {/* Circle bullet with status trigger */}
                    <div className={`absolute -left-[32px] top-1.5 h-4.5 w-4.5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                      activeTimeline === idx ? "border-[#D4AF37] ring-4 ring-[#D4AF37]/15" : "border-gray-300"
                    }`}>
                      <div className={`h-2.5 w-2.5 rounded-full transition ${activeTimeline === idx ? "bg-[#D4AF37]" : "bg-transparent"}`} />
                    </div>

                    <div className={`bg-white rounded-3xl border p-6.5 text-left transition-all duration-300 ${
                      activeTimeline === idx 
                        ? "border-[#D4AF37] shadow-[0_12px_40px_-8px_rgba(212,175,55,0.12)] -translate-y-1" 
                        : "border-emerald-100/60 shadow-[0_6px_20px_-6px_rgba(45,106,79,0.03)]"
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">{item.period}</span>
                        <span className="text-[9px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-100/50">{item.metric}</span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-[#0D2A1C] mb-1">{item.title}</h3>
                      <h4 className="text-xs font-semibold text-emerald-700/80 mb-3">{item.subtitle}</h4>
                      <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ================= SECTION 3: MISSION & VISION CARDS (GOLD & FOREST CONTRAST) ================= */}
        <section className="py-20 px-6 sm:px-12 bg-white relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Mission Card (Deep Forest Green, luxury contrast) */}
              <div className="bg-[#0D2A1C] text-white rounded-3xl p-10 sm:p-14 relative overflow-hidden shadow-2xl flex flex-col justify-between group">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                  style={{ backgroundImage: "radial-gradient(white 2px, transparent 2px)", backgroundSize: "20px 20px" }} 
                />
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-[70px] pointer-events-none" />
                
                {/* Horizontal gold accent line */}
                <div className="w-12 h-1 bg-[#D4AF37] mb-8 group-hover:w-20 transition-all duration-300" />
                
                <div className="space-y-6 text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Strategic Core</span>
                  <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">Our Mission</h3>
                  <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-medium">
                    To empower farmers and agricultural businesses with innovative digital solutions, reliable information, and access to opportunities that drive sustainable growth and prosperity.
                  </p>
                </div>
              </div>

              {/* Vision Card (Luxury Warm Light Gold, stunning visuals overlay) */}
              <div className="bg-[#FAF9F5] border border-[#D4AF37]/30 rounded-3xl p-10 sm:p-14 relative overflow-hidden shadow-xl flex flex-col justify-between group">
                {/* Gold abstract overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent" />
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
                
                {/* Horizontal deep forest green accent line */}
                <div className="w-12 h-1 bg-emerald-700 mb-8 group-hover:w-20 transition-all duration-300" />
                
                <div className="space-y-6 text-left relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Future Landscape</span>
                  <h3 className="text-3xl sm:text-4xl font-serif font-bold text-[#0D2A1C] tracking-tight leading-tight">Our Vision</h3>
                  <p className="text-gray-650 text-base sm:text-lg leading-relaxed font-medium">
                    To become Africa's most trusted agricultural ecosystem, where every farmer has the tools, knowledge, and connections needed to succeed.
                  </p>
                  
                  {/* Futuristic micro-bullets tags */}
                  <div className="flex flex-wrap gap-2.5 pt-4">
                    <span className="bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800">Smart Farming</span>
                    <span className="bg-white border border-[#D4AF37]/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#C59B27]">Digital Agriculture</span>
                    <span className="bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-800">Global Connections</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= SECTION 4: WHY CHOOSE MKULIMA SECTION (6 PILLARS) ================= */}
        <section className="py-24 px-6 sm:px-12 bg-[#FAF9F6] border-t border-b border-gray-100">
          <div className="max-w-7xl mx-auto text-center space-y-16">
            
            <div className="space-y-4 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50/50 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Strategic Advantages
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#0D2A1C] tracking-tight">
                Why Choose Mkulima?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyChooseUs.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    key={idx}
                    className={`${item.bgClass} ${item.borderClass} border rounded-3xl p-8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden text-left`}
                  >
                    {/* Glowing blob inside card on hover */}
                    <div className={`absolute top-0 right-0 w-32 h-32 ${item.glowBg} rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none`} />
                    
                    <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-5.5 h-5.5" strokeWidth={2} />
                    </div>
                    
                    <h3 className={`${item.textClass} font-bold text-lg mb-2 font-serif`}>{item.title}</h3>
                    <p className={`${item.descClass} text-xs sm:text-sm leading-relaxed font-medium`}>
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ================= SECTION 5: OUR VALUES SECTION (LUXURY STYLE GRID) ================= */}
        <section className="py-24 px-6 sm:px-12 bg-white relative">
          <div className="max-w-7xl mx-auto space-y-20 relative z-10">
            
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-4.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-[#C59B27]">
                Corporate Standard
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#0D2A1C] tracking-tight">
                Our Core Foundations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {values.map((val, idx) => (
                <div 
                  key={idx}
                  className="border-t-2 border-[#D4AF37]/30 pt-6 flex flex-col justify-between text-left group hover:border-[#D4AF37] transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-serif italic font-black text-[#D4AF37]/30 group-hover:text-[#D4AF37] transition-colors duration-300">{val.number}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0D2A1C] font-serif uppercase tracking-wider">{val.name}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">
                      {val.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ================= SECTION 6: IMPACT REPORT SECTION (CHARCOAL DARK CONTRAST) ================= */}
        <section className="py-24 px-6 sm:px-12 bg-[#121A15] text-white relative overflow-hidden">
          {/* Subtle green ambient spotlights */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "radial-gradient(white 2px, transparent 2px)", backgroundSize: "32px 32px" }} />
          <div className="absolute top-1/2 left-1/4 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
          <div className="absolute bottom-[-100px] right-[-50px] w-[350px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              
              {/* Left Column info */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-[#F3CD5F] text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-[2px] bg-[#D4AF37]"></span> Annual Performance
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold font-serif text-white tracking-tight leading-tight">
                  Global Impact Report
                </h2>
                <p className="text-gray-300 text-base leading-relaxed font-medium">
                  We measure our success in the productivity, prosperity, and ecological balance of the farming communities we enable across East Africa.
                </p>
                <div className="pt-2">
                  <span className="text-[10px] border border-white/10 px-4 py-2 rounded-full uppercase tracking-wider text-gray-400 font-bold bg-white/5">
                    Data Verified Audit Q3 2026
                  </span>
                </div>
              </div>

              {/* Right Column statistics grid */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
                
                {/* Stat 1 */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-sm hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all duration-300">
                  <h4 className="text-4xl sm:text-5xl font-serif font-black text-[#F3CD5F]">50,000+</h4>
                  <h5 className="text-sm font-bold text-white mt-2 font-serif">Farmers Empowered</h5>
                  <p className="text-gray-400 text-xs mt-1 font-medium">Accessing inputs, diagnostics, and wholesale prices.</p>
                </div>

                {/* Stat 2 */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-sm hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all duration-300">
                  <h4 className="text-4xl sm:text-5xl font-serif font-black text-[#F3CD5F]">1,200+</h4>
                  <h5 className="text-sm font-bold text-white mt-2 font-serif">Agribusinesses Connected</h5>
                  <p className="text-gray-400 text-xs mt-1 font-medium">Cooperatives, input vendors, and regional traders.</p>
                </div>

                {/* Stat 3 */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-sm hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all duration-300">
                  <h4 className="text-4xl sm:text-5xl font-serif font-black text-[#F3CD5F]">150+</h4>
                  <h5 className="text-sm font-bold text-white mt-2 font-serif">Communities Reached</h5>
                  <p className="text-gray-400 text-xs mt-1 font-medium">Establishing decentralized distribution collection points.</p>
                </div>

                {/* Stat 4 */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl shadow-sm hover:border-[#D4AF37]/50 hover:bg-white/10 transition-all duration-300">
                  <h4 className="text-4xl sm:text-5xl font-serif font-black text-[#F3CD5F]">$5M+</h4>
                  <h5 className="text-sm font-bold text-white mt-2 font-serif">Opportunities Created</h5>
                  <p className="text-gray-400 text-xs mt-1 font-medium">Direct market trade transaction value optimization.</p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ================= SECTION 7: BREATHTAKING CLOSING CTA ================= */}
        <section className="py-24 px-6 sm:px-12 bg-[#FAF9F6] relative overflow-hidden">
          <div className="max-w-5xl mx-auto bg-[#0D2A1C] border border-[#D4AF37]/45 rounded-3xl p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl">
            
            {/* Cinematic background image layer representing success / golden sunset over farm */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80" 
                alt="Golden farm harvest sunset" 
                className="w-full h-full object-cover opacity-20 filter brightness-90 saturate-50"
              />
              <div className="absolute inset-0 bg-[#0D2A1C]/90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            <div className="relative z-10 space-y-8">
              <span className="inline-flex items-center gap-2 border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#F3CD5F]">
                Start Today
              </span>
              
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif text-white tracking-tight leading-tight">
                The Future Of Agriculture <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3CD5F] via-[#D4AF37] to-amber-100 italic">Starts Here</span>
              </h2>
              
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto font-medium">
                Join Mkulima and experience agriculture delivered first class.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
                <Link 
                  to="/auth/sign-up" 
                  className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#C59B27] text-[#0D2A1C] font-extrabold text-xs sm:text-sm uppercase tracking-wider py-4.5 px-8 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 text-center cursor-pointer"
                >
                  Join Mkulima
                </Link>
                <Link 
                  to="/services" 
                  className="w-full sm:w-auto bg-transparent border border-white/20 hover:border-[#D4AF37] text-white hover:text-[#F3CD5F] font-extrabold text-xs sm:text-sm uppercase tracking-wider py-4.5 px-8 rounded-xl transition duration-300 text-center cursor-pointer"
                >
                  Explore Our Platform
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
