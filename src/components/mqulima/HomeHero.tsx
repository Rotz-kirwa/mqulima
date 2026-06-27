import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import heroCinematic from "@/assets/hero-cinematic.png";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export function HomeHero() {
  return (
    <section className="relative h-[90svh] min-h-[580px] w-full overflow-hidden bg-[#0A1E0C]">
      {/* ── Background Image Collage ── */}
      <div className="absolute inset-0 h-full w-full">
        <img
          src={heroCinematic}
          alt="Premium AgriTech collage: cabbage farming, soil test, cows, greenhouse, tractor"
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
          width={1920}
          height={1080}
        />
        {/* 
          Multi-directional overlays:
          - Bottom-to-top dark overlay on mobile/portrait so text remains perfectly readable without blocking top content.
          - Left-to-right dark overlay on desktop/landscape.
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent lg:hidden" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
      </div>

      {/* ── Main Content Area ── */}
      <div className="container-px relative z-10 mx-auto flex h-full max-w-7xl items-end pb-20 lg:items-center lg:pb-0">
        <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col text-left"
          >
            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Agriculture{" "}
              <span className="text-[#52B788]">for the</span>
              <br />
              future.
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              variants={itemVariants}
              className="mt-4 text-base leading-relaxed text-white/85 md:text-lg"
            >
              Cutting through the noise, taking you first class.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap items-center gap-3.5"
            >
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#F5A623]/20 transition hover:bg-[#e09520] hover:scale-[1.02] active:scale-100"
              >
                Walk Around
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white/95 backdrop-blur-sm transition hover:bg-white/20"
              >
                Our Services
              </Link>
            </motion.div>
          </motion.div>
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
