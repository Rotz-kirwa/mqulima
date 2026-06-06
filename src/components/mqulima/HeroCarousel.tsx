import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import heroFarmer from "@/assets/hero-farmer.jpg";
import heroVet from "@/assets/hero-vet.jpg";
import heroSoil from "@/assets/hero-soil.jpg";
import heroCommunity from "@/assets/hero-community.jpg";
import heroDelivery from "@/assets/hero-delivery.jpg";

const slides = [
  { image: heroFarmer, eyebrow: "The Mqulima Movement", title: "The Future of Farming Starts Here", subtitle: "Premium agrovet supplies, expert services and AI intelligence — delivered to your farm gate.", cta: "Shop Products", to: "/shop" },
  { image: heroVet, eyebrow: "Vet Care On Demand", title: "Expert Vet Care, One Click Away", subtitle: "Certified vets at your farm within 24 hours. From dairy cows to layers — we've got your livestock.", cta: "Book Appointment", to: "/services" },
  { image: heroSoil, eyebrow: "Soil Intelligence", title: "Know Your Soil. Maximize Your Yield.", subtitle: "Lab-grade soil testing with crop-specific recommendations. Stop guessing. Start growing.", cta: "Request Soil Test", to: "/services" },
  { image: heroCommunity, eyebrow: "Farmers Winning Together", title: "Join 5,000+ Farmers Already Winning", subtitle: "Real conversations. Real success stories. A nationwide community of Kenyan growers.", cta: "Join Community", to: "/community" },
  { image: heroDelivery, eyebrow: "Anywhere in Kenya", title: "Order. We Deliver to Your Farm.", subtitle: "Same-day in 20+ counties. M-Pesa or card. Track every order from warehouse to gate.", cta: "Shop Now", to: "/shop" },
];

export function HeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, []);
  const s = slides[i];
  return (
    <section className="relative h-[88vh] min-h-[620px] w-full overflow-hidden bg-forest">
      <AnimatePresence mode="sync">
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img src={s.image} alt={s.title} className="h-full w-full object-cover" width={1920} height={1280} />
          <div className="absolute inset-0 bg-gradient-hero" />
        </motion.div>
      </AnimatePresence>

      <div className="container-px relative z-10 mx-auto flex h-full max-w-7xl items-end pb-20 md:items-center md:pb-0">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {s.eyebrow}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl">
                {s.title}
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">{s.subtitle}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to={s.to}
                  className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-gold-foreground shadow-gold transition hover:scale-[1.03] active:scale-100"
                >
                  {s.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/about" className="rounded-full border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15">
                  Learn more
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dots & arrows */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 md:bottom-8">
        <button onClick={() => setI((p) => (p - 1 + slides.length) % slides.length)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20" aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-gold" : "w-4 bg-white/40 hover:bg-white/70"}`} />
          ))}
        </div>
        <button onClick={() => setI((p) => (p + 1) % slides.length)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20" aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
