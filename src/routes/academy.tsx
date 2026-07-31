import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle2, ShieldAlert, ShoppingBag, Instagram, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Mqulima Academy · Coming Soon" },
      {
        name: "description",
        content: "The premier agricultural learning platform by Mqulima Hub. Launching soon. Explore Mqulima products and join the waitlist.",
      },
    ],
  }),
  component: AcademyComingSoonPage,
});

// Symmetrical Camp & Mountain Illustration Component
const CampIllustration = ({ reverse = false }: { reverse?: boolean }) => {
  return (
    <div className={`relative w-48 sm:w-56 md:w-64 h-56 select-none shrink-0 ${reverse ? "scale-x-[-1]" : ""}`}>
      {/* Radiant Golden Sun / Sunrise */}
      <div className="absolute top-6 left-10 w-16 h-16 bg-gradient-to-b from-[#FCD34D] via-[#F97316] to-[#DC2626] rounded-full shadow-[0_0_30px_rgba(252,211,77,0.5)] border-2 border-[#FDE047]" />

      {/* Snow-Capped Mountain Range */}
      <svg viewBox="0 0 120 90" className="absolute bottom-10 left-0 w-44 sm:w-52 h-36 drop-shadow-2xl">
        {/* Back Mountain */}
        <polygon points="20,90 65,25 110,90" fill="#2A382E" />
        <polygon points="65,25 55,40 60,40 65,48 70,40 75,40" fill="#E2E8F0" />

        {/* Front Main Mountain */}
        <polygon points="0,90 45,15 90,90" fill="#1C2820" />
        {/* Snow Cap */}
        <polygon points="45,15 35,32 40,32 45,40 50,32 55,32" fill="#F8FAFC" />
        {/* Mountain Highlight */}
        <polygon points="45,15 45,40 50,32 90,90" fill="#141E18" opacity="0.6" />
      </svg>

      {/* Pine Trees Forest */}
      <div className="absolute bottom-10 left-20 z-10">
        <svg viewBox="0 0 50 70" className="w-12 h-20 text-[#091F14] drop-shadow-md">
          <polygon points="25,0 50,32 38,32 48,48 32,48 32,66 18,66 18,48 2,48 12,32 0,32" fill="#0A2919" />
          <polygon points="25,0 25,66 18,66 18,48 2,48 12,32 0,32" fill="#061C11" />
        </svg>
      </div>
      <div className="absolute bottom-10 left-2 z-10">
        <svg viewBox="0 0 40 60" className="w-10 h-16 text-[#091F14]">
          <polygon points="20,0 40,28 30,28 38,42 25,42 25,58 15,58 15,42 2,42 10,28 0,28" fill="#0D3621" />
        </svg>
      </div>

      {/* Yellow / Orange Camping Tent */}
      <div className="absolute bottom-8 left-6 z-20">
        <svg viewBox="0 0 70 55" className="w-20 sm:w-24 h-auto drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]">
          {/* Outer Tent Body */}
          <polygon points="35,5 5,50 65,50" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
          {/* Inner Door Shadow */}
          <polygon points="35,5 22,50 48,50" fill="#451A03" />
          {/* Left Door Flap */}
          <polygon points="35,5 22,50 30,50" fill="#D97706" />
          {/* Right Door Flap */}
          <polygon points="35,5 40,50 48,50" fill="#D97706" />
          {/* Ground Stakes */}
          <line x1="5" y1="50" x2="1" y2="54" stroke="#78350F" strokeWidth="2" />
          <line x1="65" y1="50" x2="69" y2="54" stroke="#78350F" strokeWidth="2" />
        </svg>
      </div>

      {/* Flickering Bonfire & Firewood */}
      <div className="absolute bottom-7 left-32 z-30 flex flex-col items-center">
        <div className="relative w-8 h-10">
          {/* Crossed Wood Logs */}
          <div className="absolute bottom-0 left-0 w-8 h-2 bg-[#451A03] rounded-sm transform rotate-12 border border-[#78350F]" />
          <div className="absolute bottom-0 left-0 w-8 h-2 bg-[#451A03] rounded-sm transform -rotate-12 border border-[#78350F]" />

          {/* Animated Flames */}
          <motion.div
            animate={{ scaleY: [1, 1.35, 0.95, 1.2, 1], y: [0, -3, 1, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1 left-2 w-4 h-7 bg-gradient-to-t from-[#DC2626] via-[#EA580C] to-[#FBBF24] rounded-full origin-bottom shadow-[0_0_12px_rgba(245,158,11,0.8)]"
          />
          <motion.div
            animate={{ scale: [0.85, 1.15, 0.9] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1.5 left-2.5 w-3 h-5 bg-[#FEF08A] rounded-full origin-bottom"
          />
        </div>
      </div>

      {/* Wood Log Sit */}
      <div className="absolute bottom-6 left-24 z-20 w-9 h-3 bg-[#54260C] rounded-full transform -rotate-6 shadow-md border border-[#78350F]" />
    </div>
  );
};

function AcademyComingSoonPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const isSubscribed = localStorage.getItem("mqulima_academy_subscribed") === "true";
    if (isSubscribed) {
      setSubscribed(true);
    }
  }, []);

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      localStorage.setItem("mqulima_academy_subscribed", "true");
    }, 1000);
  };

  const handleReset = () => {
    setSubscribed(false);
    setEmail("");
    localStorage.removeItem("mqulima_academy_subscribed");
  };

  return (
    <AppLayout>
      <div className="relative min-h-[92vh] w-full bg-[#082114] text-white overflow-hidden flex flex-col justify-between items-center selection:bg-[#85CC14] selection:text-[#0B2117]">
        
        {/* Deep Textured Forest Canvas Background */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-[#0B2A19] via-[#092214] to-[#05170D] opacity-95 z-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 50% 30%, rgba(133,204,20,0.12) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(245,158,11,0.08) 0%, transparent 50%)`
          }}
        />

        {/* Twinkling Ambient Particles */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-amber-200"
              style={{
                width: i % 2 === 0 ? "3px" : "2px",
                height: i % 2 === 0 ? "3px" : "2px",
                top: `${((i * 23) % 75) + 5}%`,
                left: `${((i * 47) % 92) + 4}%`,
              }}
              animate={{ opacity: [0.2, 0.9, 0.2], y: [0, -6, 0] }}
              transition={{
                duration: 2.5 + (i % 3),
                repeat: Infinity,
                delay: (i % 5) * 0.4,
              }}
            />
          ))}
        </div>

        {/* ══════════════════════════════════════════
            HEADER LOGO EMBLEMS (Left & Right)
            ══════════════════════════════════════════ */}
        <div className="w-full max-w-7xl px-4 sm:px-8 pt-6 pb-2 relative z-20 flex items-center justify-between pointer-events-none">
          {/* Top Left Badge Emblem */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg pointer-events-auto">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#85CC14] to-[#16A34A] flex items-center justify-center shadow-md">
              <span className="text-[#0B2117] font-black text-xs sm:text-sm font-mono">MH</span>
            </div>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white font-sans">Mqulima Academy</span>
          </div>

          {/* Top Right Badge Emblem */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg pointer-events-auto">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#F5A623] to-[#D97706] flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-200 hidden sm:inline-block">Coming 2026</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MAIN CONTENT AREA
            ══════════════════════════════════════════ */}
        <div className="max-w-7xl w-full px-4 sm:px-8 relative z-10 flex flex-col items-center justify-center my-auto py-8">
          
          {/* Poster Section (Left Camp + Center Title + Right Camp) */}
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4 my-auto">
            
            {/* Left Symmetrical Camp Graphic */}
            <div className="hidden lg:block">
              <CampIllustration />
            </div>

            {/* Centerpiece 3D Sticker Banner & CTA */}
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              
              {/* 🌟 GIANT 3D STICKER TITLE: COMING SOON!! 🌟 */}
              <div className="relative select-none font-black text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-none mb-8 flex flex-wrap justify-center items-center gap-2 sm:gap-4">
                
                {/* "COMING" Banner with Lime-Green Gradient & 3D White Outline */}
                <div className="relative transform -rotate-2 hover:scale-105 transition-transform duration-300">
                  <span
                    className="block bg-gradient-to-b from-[#C0F738] via-[#74D620] to-[#1E6B08] bg-clip-text text-transparent uppercase font-extrabold"
                    style={{
                      WebkitTextStroke: "6px #FFFFFF",
                      paintOrder: "stroke fill",
                      filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.6)) drop-shadow(0px 4px 0px #04140B)",
                    }}
                  >
                    COMING
                  </span>
                </div>

                {/* "SOON!!" Banner with Sun-Orange Gradient & 3D White Outline */}
                <div className="relative transform rotate-2 hover:scale-105 transition-transform duration-300">
                  <span
                    className="block bg-gradient-to-b from-[#FFC72C] via-[#F37016] to-[#B33100] bg-clip-text text-transparent uppercase font-extrabold"
                    style={{
                      WebkitTextStroke: "6px #FFFFFF",
                      paintOrder: "stroke fill",
                      filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.6)) drop-shadow(0px 4px 0px #04140B)",
                    }}
                  >
                    SOON!!
                  </span>
                </div>

              </div>

              {/* 🚀 HIGH-IMPACT "BROWSE PRODUCTS" CTA BUTTON (Replacing "FOLLOW UP CAMP EXPLORE!") 🚀 */}
              <div className="mb-10 w-full flex justify-center">
                <Link
                  to="/shop"
                  className="group relative inline-flex items-center gap-3 px-8 sm:px-12 py-4 sm:py-5 rounded-full bg-white border-4 border-[#0B2117] text-[#0B2117] font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-wider transform -rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-300 shadow-[0_12px_30px_rgba(0,0,0,0.4)] cursor-pointer"
                  style={{
                    boxShadow: "0 10px 0px #081B12, 0 15px 25px rgba(0,0,0,0.5)",
                  }}
                >
                  <ShoppingBag className="w-7 h-7 sm:w-9 sm:h-9 text-[#F57016] group-hover:scale-110 transition-transform stroke-[2.5]" />
                  <span className="bg-gradient-to-r from-[#0B2117] via-[#16A34A] to-[#F57016] bg-clip-text text-transparent">
                    BROWSE PRODUCTS
                  </span>
                  <ArrowRight className="w-7 h-7 sm:w-9 sm:h-9 text-[#16A34A] group-hover:translate-x-2 transition-transform stroke-[3]" />
                </Link>
              </div>

              {/* Secondary Helper Text */}
              <p className="text-sm sm:text-base text-slate-200 max-w-lg font-medium leading-relaxed mb-6 drop-shadow-md">
                Our certified agricultural video courses and expert masterclasses are launching shortly. In the meantime, explore Mqulima Soko marketplace and register for early access below!
              </p>

              {/* Quick Secondary Links (Services & Soko) */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <Link
                  to="/services"
                  className="px-5 py-2.5 rounded-full bg-[#EDF7E2] hover:bg-[#85CC14] text-[#0B2117] font-extrabold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-2"
                >
                  <span>Explore Specialist Services</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/tools"
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs uppercase tracking-wider transition backdrop-blur-md flex items-center gap-2"
                >
                  <span>VIEW TOOLS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>

            {/* Right Symmetrical Camp Graphic */}
            <div className="hidden lg:block">
              <CampIllustration reverse={true} />
            </div>

          </div>

          {/* ══════════════════════════════════════════
              WAITLIST / NOTIFY FORM
              ══════════════════════════════════════════ */}
          <div className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl text-left mt-2">
            <AnimatePresence mode="wait">
              {!subscribed ? (
                <form onSubmit={handleSubscribeSubmit} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-[#85CC14]" />
                        <span>Get Early Beta Access</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">100% Free</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative w-full">
                        <input
                          type="email"
                          name="academy_email"
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          placeholder="Mqulima001@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#85CC14] focus:ring-2 focus:ring-[#85CC14]/30 text-xs sm:text-sm font-medium transition"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center justify-center min-w-[140px] cursor-pointer"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-[#0B2117] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Join Waitlist"
                        )}
                      </button>
                    </div>
                  </div>
                  {errorMsg && (
                    <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium pt-1">
                      <ShieldAlert className="w-4 h-4" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </form>
              ) : (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-14 h-14 bg-[#85CC14]/20 border border-[#85CC14]/40 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-7 h-7 text-[#85CC14]" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wide mb-1">
                    You're On The VIP List! 🎉
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mb-4">
                    We will notify you immediately when Mqulima Academy launches.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] uppercase font-bold tracking-wider text-amber-300 hover:text-white transition cursor-pointer"
                  >
                    Use Different Email
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Go Back Link */}
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-xs font-extrabold uppercase tracking-wider text-slate-300 hover:text-white transition backdrop-blur-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

        </div>

        {/* ══════════════════════════════════════════
            BOTTOM TORN PAPER WAVE & FOOTER BAR
            ══════════════════════════════════════════ */}
        <div className="w-full relative z-20 mt-auto">
          {/* Authentic White Torn Paper Edge SVG */}
          <div className="w-full overflow-hidden leading-none">
            <svg 
              viewBox="0 0 1200 60" 
              preserveAspectRatio="none" 
              className="relative block w-full h-[32px] sm:h-[48px] text-white fill-current drop-shadow-md"
            >
              <path d="M0,20 Q60,5 120,25 Q180,35 240,15 Q300,5 360,28 Q420,40 480,18 Q540,8 600,28 Q660,42 720,20 Q780,5 840,30 Q900,45 960,18 Q1020,8 1080,26 Q1140,38 1200,15 L1200,60 L0,60 Z" />
            </svg>
          </div>

          {/* Bottom Dark Green Ribbon Bar matching screenshot */}
          <div className="bg-[#05170D] border-t border-[#092917] py-3 px-4 flex items-center justify-center gap-2 text-white">
            <Instagram className="w-4 h-4 text-[#85CC14]" />
            <span className="text-xs sm:text-sm font-bold font-mono tracking-wider text-slate-200">
              @mqulima_hub
            </span>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
