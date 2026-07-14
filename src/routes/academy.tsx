import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Mqulima Academy · Coming Soon" },
      {
        name: "description",
        content: "The premium agricultural learning platform by Mqulima. Under active development. Sign up for early access notifications.",
      },
    ],
  }),
  component: AcademyComingSoonPage,
});

// Symmetrical Camp Graphics Component (Mountain, Sun, Tent, Campfire, Log)
const CampIllustration = ({ reverse = false }: { reverse?: boolean }) => {
  return (
    <div className={`relative w-44 h-48 select-none shrink-0 ${reverse ? "scale-x-[-1]" : ""}`}>
      {/* Golden Sun */}
      <div className="absolute top-10 left-12 w-14 h-14 bg-gradient-to-b from-[#fcd34d] to-[#f97316] rounded-full shadow-[0_0_20px_rgba(253,211,77,0.3)]" />
      
      {/* Mountains */}
      <svg viewBox="0 0 100 80" className="absolute bottom-6 left-0 w-36 h-28 text-[#374151] drop-shadow-lg">
        {/* Mountain Base */}
        <polygon points="10,80 50,20 90,80" fill="#3E4F41" />
        {/* Snow Cap */}
        <polygon points="50,20 40,35 45,35 50,42 55,35 60,35" fill="#E2E8F0" />
      </svg>

      {/* Pine Trees */}
      <svg viewBox="0 0 40 60" className="absolute bottom-6 left-24 w-12 h-20 text-[#091F14]">
        <polygon points="20,0 40,30 30,30 40,45 25,45 25,60 15,60 15,45 0,45 10,30 0,30" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 40 60" className="absolute bottom-6 left-4 w-10 h-16 text-[#091F14]/80">
        <polygon points="20,0 40,30 30,30 40,45 25,45 25,60 15,60 15,45 0,45 10,30 0,30" fill="currentColor" />
      </svg>

      {/* Cozy Orange Tent */}
      <div className="absolute bottom-6 left-10 z-10">
        <svg viewBox="0 0 60 50" className="w-16 h-auto drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
          {/* Main Tent Body */}
          <polygon points="30,5 5,45 55,45" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
          {/* Inside Flap Door */}
          <polygon points="30,5 20,45 40,45" fill="#78350f" />
          {/* Front Flaps */}
          <polygon points="30,5 20,45 26,45" fill="#d97706" />
          <polygon points="30,5 34,45 40,45" fill="#d97706" />
        </svg>
      </div>

      {/* Flickering Campfire */}
      <div className="absolute bottom-6 left-26 z-20 flex flex-col items-center">
        <div className="relative w-6 h-8">
          {/* Firewood Logs */}
          <div className="absolute bottom-0 w-6 h-1.5 bg-amber-950 rounded-sm transform rotate-12" />
          <div className="absolute bottom-0 w-6 h-1.5 bg-amber-950 rounded-sm transform -rotate-12" />
          
          {/* Flame Shapes */}
          <motion.div 
            animate={{ scaleY: [1, 1.3, 0.9, 1.1, 1], y: [0, -2, 1, -1, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1 left-1.5 w-3 h-5 bg-[#f97316] rounded-full origin-bottom"
          />
          <motion.div 
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1.5 left-2 w-2 h-4 bg-[#fcd34d] rounded-full origin-bottom"
          />
        </div>
      </div>

      {/* Log Sit */}
      <div className="absolute bottom-6 left-5 z-20 w-8 h-3.5 bg-[#451a03] rounded-full transform rotate-12 shadow-sm" />
    </div>
  );
};

function AcademyComingSoonPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load waitlist state
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
      <div className="relative min-h-[95vh] w-full bg-gradient-to-b from-[#113B24] via-[#0E331E] to-[#0A2616] text-white overflow-hidden py-16 flex flex-col justify-between items-center">
        
        {/* Subtle Canvas Grain Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent pointer-events-none z-0" />

        {/* Dynamic Stars */}
        <div className="absolute inset-0 z-0 opacity-30">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Content Container */}
        <div className="max-w-6xl w-full px-4 md:px-8 relative z-10 flex flex-col items-center justify-center my-auto">
          
          {/* Main Camping / coming soon layout */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-8 md:gap-4 mb-8">
            
            {/* Left Symmetrical Camp Graphic */}
            <div className="hidden sm:block">
              <CampIllustration />
            </div>

            {/* Middle Big Title Section */}
            <div className="flex flex-col items-center text-center px-2">
              
              {/* Giant 3D Sticker-Style Title */}
              <div className="flex items-center justify-center select-none font-black text-4xl xs:text-5xl sm:text-7xl md:text-8xl tracking-tight leading-none mb-6">
                
                {/* COMING */}
                <span
                  className="bg-gradient-to-b from-[#A3E537] via-[#6BC72B] to-[#2B6A14] bg-clip-text text-transparent transform -rotate-3 inline-block pr-0.5"
                  style={{
                    textShadow: `
                      -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff,
                      3px 3px 0px #020a05
                    `,
                  }}
                >
                  COMING
                </span>

                {/* SOON */}
                <span
                  className="bg-gradient-to-b from-[#F7C619] via-[#E86E18] to-[#9C3506] bg-clip-text text-transparent transform rotate-3 inline-block px-0.5"
                  style={{
                    textShadow: `
                      -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff,
                      3px 3px 0px #020a05
                    `,
                  }}
                >
                  SOON
                </span>

                {/* !! */}
                <span
                  className="text-white transform rotate-6 inline-block ml-0.5 font-sans"
                  style={{
                    textShadow: `
                      -2px -2px 0 #020a05, 2px -2px 0 #020a05, -2px 2px 0 #020a05, 2px 2px 0 #020a05
                    `,
                  }}
                >
                  !!
                </span>
              </div>

              {/* Yellow Subtitle Banner */}
              <div
                className="text-sm sm:text-xl md:text-2xl font-black uppercase tracking-wider text-[#FCD34D] transform -rotate-1 font-mono mb-6"
                style={{
                  textShadow: "1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000",
                }}
              >
                KNOWLEDGE ROOTED HERE
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-md font-medium leading-relaxed mb-6">
                Our immersive agricultural academy is currently under construction. Get ready to explore state-of-the-art agronomy courses.
              </p>

            </div>

            {/* Right Symmetrical Camp Graphic */}
            <div className="hidden sm:block">
              <CampIllustration reverse={true} />
            </div>

          </div>

          {/* Waitlist Box */}
          <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl text-left">
            <AnimatePresence mode="wait">
              {!subscribed ? (
                <form onSubmit={handleSubscribeSubmit} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Notify Me At Launch
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative w-full">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          name="academy_email"
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          placeholder="farmer@mqulima.co.ke"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#6BC72B] focus:ring-1 focus:ring-[#6BC72B] text-xs transition"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2B6A14] hover:bg-[#1B4E0E] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center justify-center min-w-[120px]"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Join Waitlist"
                        )}
                      </button>
                    </div>
                  </div>
                  {errorMsg && (
                    <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </form>
              ) : (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-12 h-12 bg-[#2B6A14]/20 border border-[#6BC72B]/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-[#6BC72B]" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-1">
                    You're registered!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mb-4">
                    We will send beta-access details directly to your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-white transition"
                  >
                    Change Email
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Go Back Link */}
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>

        </div>

        {/* Bottom Jagged Paper Edge Wave */}
        <div className="absolute bottom-0 left-0 right-0 z-10 w-full overflow-hidden leading-none translate-y-[2px]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] text-white fill-current">
            <path d="M0,0 L50,15 L100,5 L150,20 L200,10 L250,25 L300,12 L350,28 L400,14 L450,30 L500,15 L550,25 L600,8 L650,22 L700,12 L750,28 L800,10 L850,25 L900,14 L950,30 L1000,15 L1050,22 L1100,8 L1150,20 L1200,5 L1200,120 L0,120 Z" />
          </svg>
        </div>

      </div>
    </AppLayout>
  );
}
