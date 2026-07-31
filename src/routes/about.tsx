import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { 
  Sprout, 
  ArrowRight, 
  Check, 
  Users, 
  Target, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  BookOpen, 
  Network, 
  Lightbulb, 
  HeartHandshake, 
  MapPin, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Globe, 
  Building2, 
  CheckCircle2, 
  ArrowUpRight 
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Mqulima Hub" },
      {
        name: "description",
        content: "Discover Mqulima Hub — Africa's premier digital farming ecosystem delivering agricultural solutions first class.",
      },
    ],
  }),
  component: AboutPage,
});

const ABOUT_HERO_STATS = [
  { icon: Users, value: "50,000+", label: "Farmers Empowered" },
  { icon: MapPin, value: "47", label: "Counties Reached" },
  { icon: Building2, value: "1,200+", label: "Agribusinesses Connected" },
  { icon: TrendingUp, value: "$5M+", label: "Trade Facilitated" },
];

function AboutPage() {
  const [activeTimeline, setActiveTimeline] = useState(0);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const timelineData = [
    {
      period: "The Beginning",
      title: "Rooted in Purpose",
      subtitle: "Eliminating information asymmetry for Kenyan smallholders.",
      description: "Founded in Eldoret with a clear mission: How can modern software engineering eliminate middleman arbitrage and secure fair value for farmers? We started with soil diagnostic research and direct supplier verification.",
      metric: "Est. 2024",
      badge: "Inception"
    },
    {
      period: "The Transformation",
      title: "Cultivating the Ecosystem",
      subtitle: "Unifying agriculture on a singular digital plane.",
      description: "By integrating AI diagnostic tools, logistics dispatch networks, and a direct digital marketplace, Mqulima connected remote farming cooperatives directly with national wholesale buyers and agrovet suppliers.",
      metric: "50k+ Empowered",
      badge: "Expansion"
    },
    {
      period: "The Future",
      title: "Sustainable Prosperity",
      subtitle: "Building an intelligent, resilient farming economy.",
      description: "Our roadmap expands across East Africa, introducing predictive yield intelligence, carbon-credit soil audits, and solar cold-chain logistics to place African agriculture at the global forefront.",
      metric: "Pan-African 2030",
      badge: "Vision 2030"
    }
  ];

  const whyChooseUs = [
    {
      title: "Digital Farming Excellence",
      description: "Modern analytics, soil diagnostics, and AI models designed to put real-time precision in the hands of today's progressive farmer.",
      icon: Sprout,
      checklist: [
        "Real-time Crop Diagnostics",
        "Automated Soil Health Audits",
        "Predictive Market Analytics"
      ],
      image: "https://i.pinimg.com/736x/d3/8a/07/d38a0721bac4f6b2a4ee73d79c557f08.jpg"
    },
    {
      title: "Direct Market Access",
      description: "Empowering growers to bypass brokers and access direct, premium wholesale purchasing networks globally with zero arbitrage.",
      icon: TrendingUp,
      checklist: [
        "Bypass Middlemen & Brokers",
        "Transparent Produce Pricing",
        "Direct Buyer Connections"
      ],
      image: "https://i.pinimg.com/1200x/3b/e6/a6/3be6a688e5395fd04bee73b103690b3b.jpg"
    },
    {
      title: "Trusted Agricultural Network",
      description: "A secure, verified ecosystem connecting vetted farmers, agrovet suppliers, logistics handlers, and certified agronomists.",
      icon: Network,
      checklist: [
        "100% Vetted Suppliers",
        "Verified Service Providers",
        "Nationwide Logistics Dispatch"
      ],
      image: "https://i.pinimg.com/736x/95/bb/1b/95bb1ba4bc02563f8274bdd5a9ff6e77.jpg"
    },
    {
      title: "Knowledge Empowerment",
      description: "Providing scientific crop calendar automation, practical farming guides, and structured learning through Mqulima Academy.",
      icon: BookOpen,
      checklist: [
        "Agronomist-Reviewed Guides",
        "Structured Video Courses",
        "County Advisory Bulletins"
      ],
      image: "https://i.pinimg.com/1200x/91/9b/90/919b90e49bc35c6863ca1b8ccdf49bbe.jpg"
    },
    {
      title: "Innovation First",
      description: "Developing offline USSD fallback channels, automated Mqulima AI diagnostics, and dynamic agricultural bidding tools.",
      icon: Lightbulb,
      checklist: [
        "Mqulima AI Assistant",
        "Smart USSD Connectivity",
        "Automated Order Tracking"
      ],
      image: "https://i.pinimg.com/1200x/88/aa/65/88aa65f6e8435f9addf612deae8ac0d2.jpg"
    },
    {
      title: "Sustainable Growth",
      description: "Fostering long-term ecological balance through soil restoration audits, water efficiency tools, and climate-smart models.",
      icon: HeartHandshake,
      checklist: [
        "Soil Health Conservation",
        "Solar Water Pumping",
        "Climate Smart Practices"
      ],
      image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80"
    },
  ];

  const values = [
    {
      number: "01",
      name: "Excellence",
      description: "We believe agriculture deserves first-class technology. Average is not an option; we bring premium execution to every farm.",
    },
    {
      number: "02",
      name: "Integrity",
      description: "Building unshakeable trust through absolute supply verification, transparent billing, and zero-counterfeit input guarantees.",
    },
    {
      number: "03",
      name: "Innovation",
      description: "Redefining the boundaries of agricultural productivity by applying modern software engineering to seasonal challenges.",
    },
    {
      number: "04",
      name: "Community",
      description: "Co-authoring success stories. We grow in lockstep with the agricultural cooperatives, agronomists, and buyers we serve.",
    },
    {
      number: "05",
      name: "Sustainability",
      description: "Securing the future. Our digital diagnostic models ensure soil longevity and resource responsibility for generations.",
    },
  ];

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] text-[#0F291E] min-h-screen font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-[#85CC14] selection:text-[#0B2117] text-left">
        
        {/* =========================================================================
            SECTION 1: HERO BANNER (Matched to Services Page UI/UX)
           ========================================================================= */}
        <section className="relative overflow-hidden bg-[#0F291E] text-white">
          {/* Panoramic Background Image Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
              alt="Lush green modern agricultural landscape"
              className="w-full h-full object-cover object-center opacity-35 mix-blend-luminosity scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B2117] via-[#0F291E]/90 to-[#123828]/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B2117] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 container-px mx-auto max-w-7xl pt-10 pb-12 md:pt-14 md:pb-16">
            <div className="max-w-3xl text-left">
              
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 border border-white/15 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-[#85CC14] animate-pulse" />
                <span>MQULIMA ECOSYSTEM — TAKING YOU FIRST CLASS</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight font-['Outfit',sans-serif]">
                Taking Agriculture{" "}
                <span className="text-[#D4E157] underline decoration-[#D4E157]/30 underline-offset-8">
                  Beyond Boundaries
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-4 text-sm sm:text-base md:text-lg text-white/85 leading-relaxed font-normal max-w-2xl">
                Mqulima Hub is Africa’s 360° digital farming ecosystem — connecting smallholders, agribusinesses, buyers, and extension agronomists through technology, verified inputs, and direct market access.
              </p>

              {/* Action Buttons Row */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => scrollToSection("our-story")}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#85CC14] to-[#6FA810] text-[#0B2117] font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#85CC14]/20 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Discover Our Journey</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </button>

                <Link
                  to="/auth/sign-up"
                  className="px-6 py-3 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs sm:text-sm hover:bg-white/25 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Join Mqulima Today</span>
                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </div>

              {/* Trust Badges Checkmark Row */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs font-semibold text-white/90">
                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>100% Verified Quality Inputs</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>47 Kenyan Counties</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Direct Farm Gate Trading</span>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Bar Ribbon at Bottom of Hero (Marquee Style) */}
          <div className="relative z-10 bg-[#EDF7E2] border-t border-b border-[#D8EBC4] py-3.5 overflow-hidden">
            <div className="flex w-max items-center gap-10 sm:gap-16 animate-marquee">
              {[...ABOUT_HERO_STATS, ...ABOUT_HERO_STATS, ...ABOUT_HERO_STATS, ...ABOUT_HERO_STATS].map((stat, idx) => (
                <div key={idx} className="flex items-center gap-3 shrink-0">
                  <div className="p-2.5 rounded-full bg-[#85CC14]/25 text-[#2A520B] shrink-0">
                    <stat.icon className="h-5 w-5 stroke-[2]" />
                  </div>
                  <div className="text-left">
                    <span className="text-xl sm:text-2xl font-black text-[#1A380A] tracking-tight font-['Outfit',sans-serif] block leading-tight">
                      {stat.value}
                    </span>
                    <span className="text-[11px] font-semibold text-[#3D661B] whitespace-nowrap">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* =========================================================================
            SECTION 2: OUR HERITAGE & TIMELINE (MATCHED TO SERVICES CARDS)
           ========================================================================= */}
        <section id="our-story" className="py-16 md:py-24 bg-[#FAFBF9]">
          <div className="container-px mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* Left Story Column */}
              <div className="lg:col-span-5 space-y-6 text-left">
                <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D]">
                  OUR HERITAGE
                </span>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
                  Where Tradition <br />
                  <span className="text-[#6EA810]">Meets Innovation</span>
                </h2>
                
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                  Mqulima was created with a vision to transform African agriculture into a modern, profitable, and connected ecosystem. We believe every farmer deserves access to opportunities, verified information, transparent markets, and technology that unlocks their full potential.
                </p>

                <div className="pt-6 border-t border-slate-200/80 flex items-center gap-8">
                  <div>
                    <h4 className="text-3xl font-black text-[#0F291E] font-['Outfit',sans-serif]">2024</h4>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Foundation Rooted</p>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-200" />
                  <div>
                    <h4 className="text-3xl font-black text-[#6EA810] font-['Outfit',sans-serif]">47</h4>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Counties Reached</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-[#0F291E] hover:bg-[#16382B] text-white font-bold text-xs sm:text-sm transition duration-200 shadow-sm"
                  >
                    <span>Explore Our Ecosystem</span>
                    <ArrowRight className="h-4 w-4 text-[#85CC14] stroke-[2.5]" />
                  </Link>
                </div>
              </div>

              {/* Right Timeline Cards Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-6">
                  {timelineData.map((item, idx) => (
                    <div 
                      key={idx}
                      onMouseEnter={() => setActiveTimeline(idx)}
                      className={`bg-white rounded-[28px] border p-6 sm:p-8 text-left transition-all duration-300 shadow-sm ${
                        activeTimeline === idx 
                          ? "border-[#85CC14] ring-2 ring-[#85CC14]/20 shadow-lg -translate-y-1" 
                          : "border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black uppercase tracking-widest text-[#35610D]">{item.period}</span>
                        <span className="text-xs font-bold px-3 py-1 bg-[#E5F5D0] text-[#35610D] rounded-full">
                          {item.metric}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#0F291E] font-['Outfit',sans-serif] mb-1">{item.title}</h3>
                      <h4 className="text-xs font-semibold text-[#16A34A] mb-3">{item.subtitle}</h4>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* =========================================================================
            SECTION 3: MISSION & VISION CARDS (MATCHED TO ECOSYSTEM HIGH-CONTRAST)
           ========================================================================= */}
        <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-b border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Mission Card (Deep Forest Green) */}
              <div className="bg-[#0F291E] text-white rounded-[32px] p-8 sm:p-12 relative overflow-hidden shadow-xl flex flex-col justify-between group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#85CC14]/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="w-12 h-1 bg-[#85CC14] mb-8 group-hover:w-24 transition-all duration-300 rounded-full" />
                
                <div className="space-y-4 text-left relative z-10">
                  <span className="text-xs font-black uppercase tracking-widest text-[#85CC14]">STRATEGIC CORE</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight font-['Outfit',sans-serif]">Our Mission</h3>
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed font-normal">
                    To empower farmers and agricultural businesses with innovative digital tools, reliable scientific information, and access to direct markets that drive sustainable yield growth and rural prosperity.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-4">
                    <span className="bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-bold text-white">Direct Trade</span>
                    <span className="bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-bold text-white">AI Diagnostics</span>
                    <span className="bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-bold text-[#85CC14]">Verified Inputs</span>
                  </div>
                </div>
              </div>

              {/* Vision Card (Warm Light Green Accent) */}
              <div className="bg-[#EDF7E2] border border-[#D8EBC4] rounded-[32px] p-8 sm:p-12 relative overflow-hidden shadow-lg flex flex-col justify-between group">
                <div className="w-12 h-1 bg-[#35610D] mb-8 group-hover:w-24 transition-all duration-300 rounded-full" />
                
                <div className="space-y-4 text-left relative z-10">
                  <span className="text-xs font-black uppercase tracking-widest text-[#35610D]">FUTURE LANDSCAPE</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">Our Vision</h3>
                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed font-normal">
                    To become Africa's most trusted 360° agricultural ecosystem — where every smallholder, trader, and specialist operates with transparent information, seamless logistics, and continuous prosperity.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-4">
                    <span className="bg-white border border-[#D8EBC4] px-3 py-1 rounded-full text-xs font-bold text-[#35610D]">Smart Farming</span>
                    <span className="bg-[#85CC14] text-[#0B2117] px-3 py-1 rounded-full text-xs font-bold">Pan-African Reach</span>
                    <span className="bg-white border border-[#D8EBC4] px-3 py-1 rounded-full text-xs font-bold text-[#35610D]">Climate Resilience</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* =========================================================================
            SECTION 4: 6 PILLARS (WHY CHOOSE MQULIMA? MATCHED TO SERVICES CARDS GRID)
           ========================================================================= */}
        <section className="py-16 md:py-24 bg-[#FAFBF9]">
          <div className="container-px mx-auto max-w-7xl">
            
            {/* Section Header */}
            <div className="text-left max-w-3xl mb-12">
              <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D] mb-3">
                STRATEGIC PILLARS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
                Why Choose <span className="text-[#6EA810]">Mqulima Hub?</span>
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                We combine software engineering, direct agronomy support, and transparent logistics to deliver a first-class agricultural platform built for modern farmers.
              </p>
            </div>

            {/* 6 Pillars Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyChooseUs.map((pillar, idx) => {
                const IconComp = pillar.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-[28px] border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left group"
                  >
                    <div>
                      {/* Card Header Image */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                        <img
                          src={pillar.image}
                          alt={pillar.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2117]/90 via-[#0B2117]/30 to-transparent" />

                        {/* Top Left Icon Badge */}
                        <div className="absolute top-4 left-4 p-2.5 rounded-full bg-[#16A34A] text-white shadow-md flex items-center justify-center">
                          <IconComp className="h-5 w-5 stroke-[2]" />
                        </div>

                        {/* Bottom Title Overlay */}
                        <div className="absolute bottom-4 left-5 right-5">
                          <h3 className="text-xl font-bold text-white tracking-tight leading-tight font-['Outfit',sans-serif]">
                            {pillar.title}
                          </h3>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-6">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-6 min-h-[44px]">
                          {pillar.description}
                        </p>

                        <ul className="space-y-2.5">
                          {pillar.checklist.map((item, cIdx) => (
                            <li key={cIdx} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                              <Check className="h-4 w-4 text-[#16A34A] stroke-[3] shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Card Footer Button */}
                    <div className="p-6 pt-0">
                      <Link
                        to="/services"
                        className="w-full py-2.5 px-4 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs sm:text-sm transition duration-200 flex items-center justify-between shadow-sm cursor-pointer"
                      >
                        <span>Explore Standard</span>
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>


        {/* =========================================================================
            SECTION 5: CORE VALUES (LUXURY ROMAN NUMERAL STYLE GRID)
           ========================================================================= */}
        <section className="py-16 md:py-24 bg-white border-t border-slate-100">
          <div className="container-px mx-auto max-w-7xl text-left space-y-12">
            
            <div className="max-w-3xl space-y-3">
              <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D]">
                CORPORATE STANDARD
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight font-['Outfit',sans-serif]">
                Our Core Foundations
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {values.map((val, idx) => (
                <div 
                  key={idx}
                  className="bg-[#FAFBF9] border border-slate-200/90 rounded-[24px] p-6 flex flex-col justify-between text-left group hover:border-[#85CC14] hover:shadow-md transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-black text-[#85CC14] font-['Outfit',sans-serif]">{val.number}</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0F291E] font-['Outfit',sans-serif] uppercase tracking-wider">{val.name}</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                      {val.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>


        {/* =========================================================================
            SECTION 6: BREATHTAKING CLOSING CTA BANNER
           ========================================================================= */}
        <section className="py-16 md:py-20 container-px mx-auto max-w-7xl">
          <div className="bg-[#0F291E] border border-white/10 rounded-[36px] p-8 sm:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#85CC14]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#85CC14] border border-white/15">
                START TODAY
              </span>
              
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-['Outfit',sans-serif]">
                The Future of Agriculture <br />
                <span className="text-[#85CC14]">Starts Here</span>
              </h2>
              
              <p className="text-white/80 text-sm sm:text-base leading-relaxed font-normal max-w-xl mx-auto">
                Join thousands of progressive farmers and agribusinesses experiencing agriculture delivered first class.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                <Link 
                  to="/auth/sign-up" 
                  className="w-full sm:w-auto bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-extrabold text-xs sm:text-sm uppercase tracking-wider py-4 px-8 rounded-full shadow-lg transition duration-200 text-center cursor-pointer active:scale-98"
                >
                  Join Mqulima Today
                </Link>
                <Link 
                  to="/services" 
                  className="w-full sm:w-auto bg-white/15 backdrop-blur-md border border-white/25 hover:bg-white/25 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-4 px-8 rounded-full transition duration-200 text-center cursor-pointer active:scale-98"
                >
                  Explore Services
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
