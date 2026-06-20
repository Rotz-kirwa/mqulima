import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import heroVet from "@/assets/hero-vet.jpg";
import heroCommunity from "@/assets/hero-community.jpg";
import heroMarketplace from "@/assets/hero-marketplace.png";

const slides = [
  { 
    image: heroMarketplace, 
    eyebrow: "Agrovet Soko", 
    title: "Your Digital Agrovet Store", 
    subtitle: "Browse premium fertilizers, certified seeds, and modern farming equipment with secure delivery.", 
    cta: "Shop Marketplace", 
    to: "/shop" 
  },
  { 
    image: heroVet, 
    eyebrow: "Vet Care On Demand", 
    title: "Expert Vet Care at Your Farm", 
    subtitle: "Certified vets at your farm gate within 24 hours. Precision health monitoring for maximum production.", 
    cta: "Book Appointment", 
    to: "/services" 
  },
  { 
    image: heroCommunity, 
    eyebrow: "Farmers Community", 
    title: "Join 5,000+ Winning Farmers", 
    subtitle: "Real conversations, shared wisdom, and advice from a nationwide community of Kenyan growers.", 
    cta: "Join Community", 
    to: "/community" 
  },
];

export function HeroCarousel() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setI((p) => (p + 1) % slides.length);
    }, 4000); // 4 seconds auto-rotation
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative h-[88vh] min-h-[620px] w-full overflow-hidden bg-forest">
      {/* Sliding row container */}
      <div 
        className="flex h-full w-full transition-transform duration-700 ease-out" 
        style={{ transform: `translateX(-${i * 100}%)`, width: `${slides.length * 100}%` }}
      >
        {slides.map((s, idx) => (
          <div key={idx} className="relative h-full w-full flex-shrink-0">
            <img src={s.image} alt={s.title} className="h-full w-full object-cover" width={1920} height={1280} />
            <div className="absolute inset-0 bg-gradient-hero" />
            
            {/* Sliding text content area */}
            <div className="container-px absolute inset-0 z-10 mx-auto flex h-full max-w-7xl items-end pb-20 md:items-center md:pb-0 text-left">
              <div className="max-w-2xl bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-[24px] border border-white/10 text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#F5A623] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" /> {s.eyebrow}
                </span>
                <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl md:text-6xl">
                  {s.title}
                </h1>
                <p className="mt-4 text-sm text-white/85 leading-relaxed">{s.subtitle}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to={s.to}
                    className="group inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.03] active:scale-100"
                  >
                    {s.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link to="/about" className="rounded-full border border-[#2D6A4F]/40 bg-[#2D6A4F]/15 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-[#2D6A4F]/30">
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots & arrows */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 md:bottom-8">
        <button 
          onClick={() => setI((p) => (p - 1 + slides.length) % slides.length)} 
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20" 
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setI(idx)} 
              aria-label={`Slide ${idx + 1}`} 
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-[#F5A623]" : "w-4 bg-white/40 hover:bg-white/70"}`} 
            />
          ))}
        </div>
        <button 
          onClick={() => setI((p) => (p + 1) % slides.length)} 
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20" 
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
