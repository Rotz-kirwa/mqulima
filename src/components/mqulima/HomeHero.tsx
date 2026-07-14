import { Link } from "@tanstack/react-router";
import { motion, Variants } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import heroCinematic from "@/assets/hero-cinematic.png";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } as any },
};

export function HomeHero() {
  return (
    <section className="relative h-[95svh] min-h-[650px] w-full overflow-hidden bg-[#F4F8F5]">
      {/* ── Cinematic Static Background ── */}
      <div className="absolute inset-0 h-full w-full z-0">
        <img
          src={heroCinematic}
          alt="Cinematic premium farming"
          className="h-full w-full object-cover object-center"
        />
        
        {/* Subtle overlay for text readability without darkening the image excessively */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* ── Main Layout Container ── */}
      <div className="container-px relative z-10 mx-auto flex h-full max-w-7xl items-center">
        <div className="w-full pt-12 text-left">
          
          {/* Text Content Column */}
          <div className="max-w-2xl lg:max-w-3xl flex flex-col">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Premium micro badge */}
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-3.5 py-1.5 w-fit">
                <Sparkles className="h-3.5 w-3.5 text-[#52B788]" />
                <span className="text-[10px] md:text-xs font-black tracking-widest text-[#52B788] uppercase">
                  Taking you first class
                </span>
              </motion.div>

              {/* Title Statement */}
              <motion.h1
                variants={itemVariants}
                className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl uppercase"
              >
                Agriculture and{" "}
                <span className="bg-gradient-to-r from-[#52B788] via-[#8FD0A3] to-[#F5A623] bg-clip-text text-transparent">
                  Success
                </span>
                ,<br />
                in One Basket
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                variants={itemVariants}
                className="max-w-xl text-base leading-relaxed text-white/95 md:text-lg font-medium"
              >
                Everything you need to know, learn, buy, hire, trade, treat or tell someone in
                one platform. Africa’s 360° agriculture ecosystem
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link
                  to="/auth/sign-up"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-[#F5A623] px-7 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#F5A623]/25 transition-all duration-300 hover:bg-[#e09520] hover:scale-[1.02] active:scale-100"
                >
                  Join Us
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all duration-300 hover:bg-white/15"
                >
                  Explore the Ecosystem
                </Link>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* ── Scroll Indicator ── */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-white/40" />
        </motion.div>
      </div>
    </section>
  );
}
