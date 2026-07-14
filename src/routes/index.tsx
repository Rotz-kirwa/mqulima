import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { HomeHero } from "@/components/mqulima/HomeHero";
import { motion, Variants } from "framer-motion";
import { useRef } from "react";
import { 
  ArrowRight, 
  Users, 
  Globe, 
  ShoppingBag, 
  BookOpen, 
  ShieldAlert, 
  Sparkles, 
  Compass, 
  Star, 
  CheckCircle, 
  TrendingUp, 
  Wrench, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Cpu, 
  MapPin, 
  Award,
  Layers
} from "lucide-react";
import { articles, services } from "@/lib/mqulima-data";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedProducts } from "@/lib/api/products.server";
import { getPublishedBlogPosts } from "@/lib/api/blog.server";
import heroFarmerWoman from "@/assets/hero-farmer-woman.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mqulima — Agriculture for the Future" },
      {
        name: "description",
        content:
          "Cutting through the noise to empower farmers with the right knowledge, authentic products, and premium services.",
      },
    ],
  }),
  component: Index,
});

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } as any },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const testimonials = [
  {
    quote: "Finally, a premium platform where farmers can access verified agronomy knowledge, products, and services under one roof. First class execution.",
    author: "Grace Wambui",
    role: "Agronomist, Nakuru",
    image: "/images/farmer_grace.png",
    color: "from-[#0E2E1E] via-[#123C27] to-[#040C06] text-emerald-100 border-[#52B788]/20",
    badge: "Expert Advisory",
    stars: 5,
  },
  {
    quote: "The lookup headache is over. I have found genuine knowledge, authentic seed vectors, and a supportive community in one unified site. God bless Mqulima.",
    author: "David Kiprop",
    role: "Farmer, Uasin Gishu",
    image: "/images/farmer_david.png",
    color: "from-[#2A1E08] via-[#3D2C0C] to-[#120C03] text-amber-100 border-[#F5A623]/20",
    badge: "Verified Smallholder",
    stars: 5,
  },
  {
    quote: "This premium platform provides the digital infrastructure and tools that agriculture in Kenya has been missing for a long time.",
    author: "Joy Chemutai",
    role: "Livestock Breeder, Baringo",
    image: "/images/farmer_joy.png",
    color: "from-[#0B2535] via-[#10344B] to-[#040D13] text-cyan-100 border-cyan-500/20",
    badge: "Dairy & Genetics",
    stars: 5,
  },
  {
    quote: "With Mqulima's Soil Doctor tool, I optimized my fertilizer budget and increased my crop yields by 40% in Kiambu this season.",
    author: "Samuel Kamau",
    role: "Agribusiness Owner, Kiambu",
    image: "/images/farmer_samuel.png",
    color: "from-[#240F3E] via-[#331557] to-[#0F0619] text-violet-100 border-violet-500/20",
    badge: "Agripreneur",
    stars: 5,
  }
];

function Index() {
  const { data: dbFeaturedProducts } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: () => getFeaturedProducts()
  });

  const { data: dbArticles } = useQuery({
    queryKey: ["publishedArticles"],
    queryFn: () => getPublishedBlogPosts()
  });

  const featuredProducts = dbFeaturedProducts || [];
  const featuredArticles = dbArticles?.slice(0, 3) || articles.slice(0, 3);

  // Slideshow Refs & Scroll Handlers
  const productsRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 340;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <AppLayout>
      <HomeHero />

      {/* ══════════════════════════════════════════
          1. VALUE PROPOSITION & WHO IS MQULIMA?
          (Picture on Left, Story on Right)
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF9F5] via-white to-white py-12 text-[#0A1E0C] lg:py-16 border-b border-[#0A1E0C]/5">
        <div className="absolute left-1/4 top-1/4 h-[350px] w-[350px] rounded-full bg-[#52B788]/15 blur-[130px] pointer-events-none" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-[#F5A623]/10 blur-[120px] pointer-events-none" />
        
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#0A1E0C 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        <div className="container-px mx-auto max-w-7xl relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
            
            {/* Left Column: Story & Value Proposition */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="lg:col-span-7 text-left space-y-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#52B788]/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#2D6A4F]">
                <Sparkles className="h-3 w-3" />
                Value Proposition
              </span>
              
              <h2 className="text-4xl font-black tracking-tight text-[#0A1E0C] sm:text-5xl uppercase leading-none">
                Welcome to the home of <br />
                <span className="bg-gradient-to-r from-[#2D6A4F] via-[#52B788] to-[#F5A623] bg-clip-text text-transparent">
                  modern agriculture.
                </span>
              </h2>

              <div className="space-y-6 text-[#0A1E0C]/80 text-sm md:text-base leading-relaxed font-medium">
                <p>
                  We bring together every step of the agricultural journey, to one home.
                  Whether learning, producing, distributing, trading or adding value- just log
                  into Mqulima. We are Africa's 360° agricultural ecosystem. We bring an end
                  to guesswork, gossip, scattered information and unresponsive support.
                  Because agriculture works better when everything works together.
                </p>
                <p>
                  We understand that what you do is priceless and we are devoted to making it
                  easy, enjoyable and profitable.
                </p>

                {/* Who is Mqulima block */}
                <div className="relative overflow-hidden rounded-2xl border border-[#2D6A4F]/20 bg-[#FAF9F5]/70 p-6 shadow-sm">
                  <h4 className="text-[#2D6A4F] font-black text-lg md:text-xl flex items-center gap-2 uppercase tracking-tight">
                    Who is Mqulima?
                  </h4>
                  <p className="mt-2 text-xs md:text-sm text-[#0A1E0C]/85 italic font-semibold leading-relaxed">
                    "Mqulima is a farmer’s world. At mqulima, we are building a paradise for
                    everyone in agriculture. With Mqulima, you get a first class seat to success."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Picture */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5 relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] rounded-3xl overflow-hidden border border-gray-200/50 shadow-2xl"
            >
              <img
                src="https://i.pinimg.com/736x/d3/8a/07/d38a0721bac4f6b2a4ee73d79c557f08.jpg"
                alt="Aerial view of lush green modern agriculture fields"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-8">
                <div className="text-white text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#F5A623]">
                    Mqulima Ecosystem
                  </span>
                  <h3 className="text-xl font-black uppercase mt-1">Africa’s 360° Ag-Core</h3>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. THE ECOSYSTEM: AGRICULTURE CONNECTED
          (5-Part Custom Solutions Grid)
      ══════════════════════════════════════════ */}
      <section className="bg-[#1A3D2F] py-12 text-white lg:py-16 relative overflow-hidden border-b border-white/5">
        <div className="absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-[#52B788]/10 blur-[120px] pointer-events-none" />
        <div className="absolute left-1/4 bottom-1/4 h-[350px] w-[350px] rounded-full bg-[#F5A623]/5 blur-[150px] pointer-events-none" />

        <div className="container-px mx-auto max-w-7xl relative z-10">
          
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl text-left space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#52B788]/10 text-[10px] font-black uppercase tracking-widest text-[#52B788] border border-[#52B788]/20">
                <span className="h-1.5 w-1.5 rounded-full bg-[#52B788] animate-pulse" />
                The Ecosystem
              </span>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl uppercase leading-tight">
                Explore the Mqulima Ecosystem. <br />
                <span className="bg-gradient-to-r from-[#52B788] via-[#8FD0A3] to-[#F5A623] bg-clip-text text-transparent">
                  Agriculture Connected.
                </span>
              </h2>
            </div>
            <div className="max-w-md text-left">
              <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium">
                Whatever your role in agriculture and wherever you sit in the chain, Mqulima
                connects you to the knowledge, products, services and people you need to
                succeed—all in one place. Explore our solutions.
              </p>
            </div>
          </div>

          {/* 5-Solutions Grid */}
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            
            {/* 1. Agroshop */}
            <div className="bg-[#112F20]/50 border border-amber-500/20 hover:border-amber-400 backdrop-blur-sm shadow-xl p-6 rounded-2xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-10px_rgba(245,158,11,0.25)] group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/15 transition-all duration-500" />
              <div className="space-y-4 text-left relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] group-hover:bg-amber-500/20 group-hover:border-amber-400 group-hover:scale-110">
                  <span className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] select-none">🛒</span>
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-amber-500/60 group-hover:text-amber-300 transition-colors duration-300 mb-1 block">01</span>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight group-hover:text-amber-300 transition-colors duration-300">Agroshop</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-medium mt-2.5 group-hover:text-white/80 transition-colors duration-300">
                    Source trusted agricultural products from verified suppliers and have them delivered to your doorstep.
                  </p>
                </div>
              </div>
              <div className="pt-6 text-left relative z-10">
                <Link
                  to="/shop"
                  className="inline-flex w-full items-center justify-between gap-1.5 px-4 py-2.5 rounded-xl bg-amber-700 border border-amber-600 text-xs font-black uppercase tracking-wider text-white hover:bg-amber-600 group-hover:bg-amber-600 hover:border-amber-500 group-hover:border-amber-500 transition-all duration-300"
                >
                  <span>View shop</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* 2. Insights */}
            <div className="bg-[#112F20]/50 border border-emerald-500/20 hover:border-emerald-400 backdrop-blur-sm shadow-xl p-6 rounded-2xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-10px_rgba(16,185,129,0.25)] group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/15 transition-all duration-500" />
              <div className="space-y-4 text-left relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] group-hover:bg-emerald-500/20 group-hover:border-emerald-400 group-hover:scale-110">
                  <span className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] select-none">📈</span>
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-emerald-500/60 group-hover:text-emerald-300 transition-colors duration-300 mb-1 block">02</span>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight group-hover:text-emerald-300 transition-colors duration-300">Insights</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-medium mt-2.5 group-hover:text-white/80 transition-colors duration-300">
                    Stay ahead with practical farming guides, market intelligence, expert articles, and timely updates.
                  </p>
                </div>
              </div>
              <div className="pt-6 text-left relative z-10">
                <Link
                  to="/blog"
                  className="inline-flex w-full items-center justify-between gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 border border-emerald-600 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-600 group-hover:bg-emerald-600 hover:border-emerald-500 group-hover:border-emerald-500 transition-all duration-300"
                >
                  <span>View Updates</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* 3. Services */}
            <div className="bg-[#112F20]/50 border border-sky-500/20 hover:border-sky-400 backdrop-blur-sm shadow-xl p-6 rounded-2xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-10px_rgba(14,165,233,0.25)] group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-500/5 blur-xl group-hover:bg-sky-500/15 transition-all duration-500" />
              <div className="space-y-4 text-left relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] group-hover:bg-sky-500/20 group-hover:border-sky-400 group-hover:scale-110">
                  <span className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] select-none">🛠️</span>
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-sky-500/60 group-hover:text-sky-300 transition-colors duration-300 mb-1 block">03</span>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight group-hover:text-sky-300 transition-colors duration-300">Services</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-medium mt-2.5 group-hover:text-white/80 transition-colors duration-300">
                    Access trusted professional services when and where you need them—from veterinary care to installation.
                  </p>
                </div>
              </div>
              <div className="pt-6 text-left relative z-10">
                <Link
                  to="/services"
                  className="inline-flex w-full items-center justify-between gap-1.5 px-4 py-2.5 rounded-xl bg-sky-700 border border-sky-600 text-xs font-black uppercase tracking-wider text-white hover:bg-sky-600 group-hover:bg-sky-600 hover:border-sky-500 group-hover:border-sky-500 transition-all duration-300"
                >
                  <span>Book a Service</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* 4. Community */}
            <div className="bg-[#112F20]/50 border border-rose-500/20 hover:border-rose-400 backdrop-blur-sm shadow-xl p-6 rounded-2xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-10px_rgba(244,63,94,0.25)] group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-500/5 blur-xl group-hover:bg-rose-500/15 transition-all duration-500" />
              <div className="space-y-4 text-left relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-2xl transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] group-hover:bg-rose-500/20 group-hover:border-rose-400 group-hover:scale-110">
                  <span className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] select-none">🤝</span>
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-rose-500/60 group-hover:text-rose-300 transition-colors duration-300 mb-1 block">04</span>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight group-hover:text-rose-300 transition-colors duration-300">Community</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-medium mt-2.5 group-hover:text-white/80 transition-colors duration-300">
                    Connect with thousands of farmers, experts, and agribusinesses to learn, share, and solve together.
                  </p>
                </div>
              </div>
              <div className="pt-6 text-left relative z-10">
                <Link
                  to="/community"
                  className="inline-flex w-full items-center justify-between gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 border border-rose-600 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-600 group-hover:bg-rose-600 hover:border-rose-500 group-hover:border-rose-500 transition-all duration-300"
                >
                  <span>Connect</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* 5. Academy */}
            <div className="bg-[#112F20]/50 border border-violet-500/20 hover:border-violet-400 backdrop-blur-sm shadow-xl p-6 rounded-2xl flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-10px_rgba(139,92,246,0.25)] group relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/5 blur-xl group-hover:bg-violet-500/15 transition-all duration-500" />
              <div className="space-y-4 text-left relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] group-hover:bg-violet-500/20 group-hover:border-violet-400 group-hover:scale-110">
                  <span className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] select-none">🎓</span>
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-violet-500/60 group-hover:text-violet-300 transition-colors duration-300 mb-1 block">05</span>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight group-hover:text-violet-300 transition-colors duration-300">Academy</h3>
                  <p className="text-xs text-white/60 leading-relaxed font-medium mt-2.5 group-hover:text-white/80 transition-colors duration-300">
                    Master modern practical agriculture through structured learning and expert real-world guidance.
                  </p>
                </div>
              </div>
              <div className="pt-6 text-left relative z-10">
                <Link
                  to="/academy"
                  className="inline-flex w-full items-center justify-between gap-1.5 px-4 py-2.5 rounded-xl bg-violet-700 border border-violet-600 text-xs font-black uppercase tracking-wider text-white hover:bg-violet-600 group-hover:bg-violet-600 hover:border-violet-500 group-hover:border-violet-500 transition-all duration-300"
                >
                  <span>Visit Academy</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. FEATURED PRODUCTS (Slideshow Layout)
      ══════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-white to-[#FAF9F5] py-12 text-[#0A1E0C] lg:py-16 overflow-hidden">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header Row with Navigation Arrows */}
          <div className="flex items-end justify-between mb-8 text-left">
            <div>
              <span className="text-xs font-black tracking-widest text-[#2D6A4F] uppercase">
                Featured Collection
              </span>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#0A1E0C] sm:text-5xl uppercase leading-none">
                Farm Essentials
              </h2>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => scroll(productsRef, "left")}
                className="h-10 w-10 border border-[#0A1E0C]/10 bg-white hover:bg-[#0A1E0C]/5 flex items-center justify-center transition active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => scroll(productsRef, "right")}
                className="h-10 w-10 border border-[#0A1E0C]/10 bg-white hover:bg-[#0A1E0C]/5 flex items-center justify-center transition active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Slideshow Horizontal Container */}
          <div 
            ref={productsRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {featuredProducts.map((p) => {
              const slug = p.slug || p.id;
              return (
                <div
                  key={p.id}
                  className="w-[280px] sm:w-[320px] shrink-0 snap-start"
                >
                  <Link
                    to="/shop/product/$slug"
                    params={{ slug }}
                    className="group block relative aspect-square overflow-hidden rounded-2xl border border-[#0A1E0C]/5 bg-white shadow-sm transition-all duration-300 hover:shadow-lg p-4"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                    {p.badge && (
                      <span className="absolute left-3 top-3 rounded-lg bg-[#F5A623] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white z-10">
                        {p.badge}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col items-center justify-center p-4 text-center backdrop-blur-xs">
                      <p className="text-xs md:text-sm font-black text-white line-clamp-2 mb-1 px-2 uppercase">
                        {p.name}
                      </p>
                      <span className="text-[9px] font-black uppercase text-[#F5A623] tracking-widest mt-2 border border-[#F5A623]/30 px-3 py-1 rounded-md bg-[#F5A623]/5">
                        View Product Details
                      </span>
                    </div>
                  </Link>
                  <div className="mt-4 text-left px-1">
                    <h4 className="text-xs font-bold text-[#0A1E0C]/60 uppercase">{p.category}</h4>
                    <h3 className="text-sm font-black text-[#0A1E0C] mt-0.5 line-clamp-1 uppercase">{p.name}</h3>
                    <p className="text-sm font-black text-[#2D6A4F] mt-1">KES {p.price.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. FEATURED SERVICES (Slideshow Layout)
      ══════════════════════════════════════════ */}
      <section className="bg-[#F4F8F5] py-12 text-[#0A1E0C] lg:py-16 overflow-hidden border-y border-[#0A1E0C]/5">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header Row */}
          <div className="flex items-end justify-between mb-8 text-left">
            <div>
              <span className="text-xs font-black tracking-widest text-[#2D6A4F] uppercase">
                Premium Support
              </span>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-[#0A1E0C] sm:text-5xl uppercase leading-none">
                Featured Services
              </h2>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => scroll(servicesRef, "left")}
                className="h-10 w-10 border border-[#0A1E0C]/10 bg-white hover:bg-[#0A1E0C]/5 flex items-center justify-center transition active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => scroll(servicesRef, "right")}
                className="h-10 w-10 border border-[#0A1E0C]/10 bg-white hover:bg-[#0A1E0C]/5 flex items-center justify-center transition active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Slideshow Horizontal Container */}
          <div 
            ref={servicesRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-6"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {services.map((s) => (
              <div
                key={s.id}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-white border border-[#0A1E0C]/5 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition duration-300"
              >
                <div className="text-left space-y-4">
                  <div className="text-3xl">{s.icon}</div>
                  <div>
                    <h3 className="text-base font-black text-[#0A1E0C] uppercase tracking-wide">{s.name}</h3>
                    <p className="text-xs text-[#0A1E0C]/50 font-bold uppercase mt-0.5">{s.price}</p>
                  </div>
                  <p className="text-xs md:text-sm text-[#0A1E0C]/75 leading-relaxed font-medium">
                    {s.description}
                  </p>
                </div>
                <div className="pt-6 text-left">
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#2D6A4F] hover:underline"
                  >
                    Book a Service →
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. ACADEMY SECTION
      ══════════════════════════════════════════ */}
      <section className="bg-white py-12 text-[#0A1E0C] lg:py-16 border-b border-[#0A1E0C]/5">
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
            
            {/* Left text */}
            <div className="lg:col-span-6 text-left space-y-6">
              <span className="text-xs font-black tracking-widest text-[#2D6A4F] uppercase">
                Structured Academy
              </span>
              
              <h2 className="text-4xl font-black tracking-tight text-[#0A1E0C] sm:text-5xl uppercase leading-none">
                Farming is a science. <br />
                <span className="bg-gradient-to-r from-[#2D6A4F] to-[#52B788] bg-clip-text text-transparent">
                  Learn it like one.
                </span>
              </h2>

              <p className="text-sm text-[#0A1E0C]/75 leading-relaxed font-medium">
                Master modern practical agriculture through structured learning, best practices,
                and real-world guidance designed to help you farm smarter and grow profitably.
                Go from amateur planter to commercial agribusiness owner.
              </p>

              <div className="pt-2">
                <Link
                  to="/academy"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] px-8 py-4 text-xs font-black uppercase tracking-wider text-white hover:bg-[#1b4332] transition hover:scale-[1.02] shadow-md shadow-[#2D6A4F]/20"
                >
                  Visit Academy
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right details */}
            <div className="lg:col-span-6 grid gap-4">
              {[
                { step: "01", name: "Foundations", desc: "Understand soil diagnostics, water budgeting, and variety seed selection before planting." },
                { step: "02", name: "Crop Management", desc: "Implement fertilizer application formulas and dynamic pest alert spray matrices." },
                { step: "03", name: "Agripreneurship", desc: "Gain market access benchmarks, post-harvest logistics, and export certifications." }
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-5 border border-[#0A1E0C]/5 rounded-2xl bg-[#FAF9F5] text-left">
                  <div className="text-2xl font-black text-[#F5A623]">{item.step}</div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wide text-[#0A1E0C]">{item.name}</h4>
                    <p className="text-xs text-[#0A1E0C]/70 mt-1 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. BRAND STORY / WHY WE EXIST
          (Picture on Right, Story on Left)
      ══════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-white to-[#FAF9F5] py-12 text-[#0A1E0C] lg:py-16">
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
            
            {/* Left Story Column */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="lg:col-span-7 text-left space-y-6"
            >
              <span className="text-xs font-black tracking-widest text-[#F5A623] uppercase">
                Why we Exist / Brand Story
              </span>
              <h2 className="text-4xl font-black tracking-tight text-[#0A1E0C] sm:text-5xl uppercase leading-none">
                Building the Future <br />
                <span className="bg-gradient-to-r from-[#2D6A4F] to-[#F5A623] bg-clip-text text-transparent">
                  of Agriculture
                </span>
              </h2>

              <h4 className="text-lg font-black text-[#2D6A4F] uppercase tracking-tight">
                No farmer should have to gamble with their livelihood.
              </h4>
              
              <div className="space-y-6 text-[#0A1E0C]/80 text-sm md:text-base leading-relaxed font-medium">
                <p>
                  For too long, farmers and agribusinesses have had to navigate fragmented
                  information, disconnected services, scattered markets and countless
                  decisions on their own. The knowledge exists. The expertise exists. The
                  opportunities exist. They simply aren't connected.
                </p>
                <p>
                  That's why we built Mqulima. To make agriculture easier, faster, profitable
                  and enjoyable.
                </p>
                <p>
                  We're creating Africa's 360° agricultural ecosystem- a place where farmers,
                  traders, researchers, service providers and consumers come together to
                  learn, collaborate and grow.
                </p>
                <p className="text-xs font-black text-[#F5A623] uppercase tracking-widest">
                  Because when everything works together, agriculture works better.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2D6A4F] via-[#52B788] to-[#F5A623] px-8 py-4.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[#52B788]/25 transition hover:scale-[1.03] hover:shadow-xl hover:from-[#1b4332] hover:to-[#e09520]"
                >
                  Partner with us
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            {/* Right Image Feature Column */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5 relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] rounded-3xl overflow-hidden border border-gray-200/50 shadow-2xl"
            >
              <img
                src={heroFarmerWoman}
                alt="Modern African farming excellence"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                <div className="text-white text-left">
                  <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#F5A623] uppercase mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Verified Excellence
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-wide">Premium Agricultural Support</h4>
                  <p className="text-xs text-white/70 font-medium mt-0.5">Taking you first class in agronomy training.</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          7. SOCIAL PROOF & STATS
          (Served in 5 Countries Reach)
      ══════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#FAF9F5] to-white py-12 text-[#0A1E0C] lg:py-16">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl text-left mb-10"
          >
            <span className="text-xs font-black tracking-widest text-[#2D6A4F] uppercase">
              Social Proof
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0A1E0C] sm:text-4xl uppercase leading-tight">
              Loved by Farmers and adored by agricultural experts
            </h2>
          </motion.div>

        </div>

        {/* Testimonial Autoscrolling Row */}
        <div className="relative w-full overflow-hidden marquee-wrapper py-6">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee-testimonials {
              0% { transform: translateX(0); }
              100% { transform: translateX(-33.3333%); }
            }
            .animate-marquee-testimonials {
              display: flex;
              width: max-content;
              animation: marquee-testimonials 40s linear infinite;
            }
            .marquee-wrapper:hover .animate-marquee-testimonials {
              animation-play-state: paused;
            }
          `}} />
          
          <div className="animate-marquee-testimonials">
            {[1, 2, 3].map((setIdx) => (
              <div key={setIdx} className="flex gap-6 shrink-0 pr-6">
                {testimonials.map((t, idx) => (
                  <div
                    key={idx}
                    className={`relative shrink-0 w-[310px] sm:w-[380px] rounded-[24px] border bg-gradient-to-br ${t.color} p-7 md:p-8 shadow-xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-2xl transition-all duration-300`}
                  >
                    <div className="text-left space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5">
                          {[...Array(t.stars)].map((_, i) => (
                            <Star key={i} className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg bg-white/10 text-white tracking-widest border border-white/5">
                          {t.badge}
                        </span>
                      </div>

                      <span className="text-6xl text-white/10 font-serif absolute -top-1.5 left-4 pointer-events-none select-none">
                        “
                      </span>
                      
                      <p className="relative z-10 text-xs sm:text-sm leading-relaxed text-white/90 italic font-semibold">
                        {t.quote}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-3.5">
                      <img
                        src={t.image}
                        alt={t.author}
                        className="h-11 w-11 rounded-full object-cover border-2 border-white/20 shadow-md shrink-0 bg-slate-800"
                      />
                      <div className="text-left">
                        <div className="text-xs font-black uppercase text-white tracking-wide">
                          {t.author}
                        </div>
                        <div className="text-[10px] text-white/60 font-semibold uppercase">
                          {t.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="container-px mx-auto max-w-7xl">

          {/* Tech-Style Stats Board */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              {
                count: "47",
                label: "Counties Reached",
                desc: "Full Kenyan national coverage",
                color: "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/60 dark:from-amber-950/20 dark:to-slate-900 dark:border-amber-900/30 text-amber-950 dark:text-amber-300",
                iconColor: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400"
              },
              {
                count: "1000+",
                label: "Products Listed",
                desc: "100% verified quality inputs",
                color: "bg-gradient-to-br from-cyan-50 to-cyan-100/50 border-cyan-200/60 dark:from-cyan-950/20 dark:to-slate-900 dark:border-cyan-900/30 text-cyan-900 dark:text-cyan-300",
                iconColor: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400"
              },
              {
                count: "200+",
                label: "Knowledge Articles",
                desc: "Agronomist approved research",
                color: "bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200/60 dark:from-violet-950/20 dark:to-slate-900 dark:border-violet-900/30 text-violet-900 dark:text-violet-300",
                iconColor: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/20 dark:text-violet-400"
              },
            ].map((s, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col items-start text-left p-6 rounded-2xl border ${s.color} shadow-sm hover:shadow-md transition-all duration-300`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.iconColor} mb-4`}>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="text-3xl font-black leading-none tracking-tight">{s.count}</div>
                <div className="mt-2 text-[10px] font-black uppercase tracking-wider opacity-85">
                  {s.label}
                </div>
                <div className="text-[10px] mt-1 font-medium opacity-60">{s.desc}</div>
              </div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. COMMUNITY & KNOWLEDGE HUB
      ══════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-white to-[#FAF9F5] py-12 text-[#0A1E0C] lg:py-16">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header */}
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-12 items-end mb-10 text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <span className="text-xs font-black tracking-widest text-[#2D6A4F] uppercase">
                Community and Knowledge Hub
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0A1E0C] sm:text-4xl leading-tight uppercase">
                Agronomy journals that keep farmers in the know
              </h2>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 text-xs md:text-sm text-[#0A1E0C]/75 leading-relaxed font-medium"
            >
              <p>
                The difference between crop failure and record-breaking yields is science-backed information. Our Journal aggregates practical research files from expert soil agronomists, veterinary surgeons, and market intelligence directors.
              </p>
            </motion.div>
          </div>

          {/* Blogs Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            {featuredArticles.map((a, idx) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#0A1E0C]/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md text-left"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-white">
                  <img
                    src={(a as any).coverImage || (a as any).image}
                    alt={a.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500";
                    }}
                  />
                  <span className="absolute left-4 top-4 rounded-lg bg-[#0A1E0C] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                    {a.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-[10px] font-black uppercase text-[#0A1E0C]/45 tracking-wider">
                    {a.readTime.includes("read") ? a.readTime : `${a.readTime} read`}
                  </span>
                  <h3 className="mt-2.5 text-sm md:text-base font-black text-[#0A1E0C] line-clamp-2 group-hover:text-[#2D6A4F] transition-colors uppercase leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#0A1E0C]/65 line-clamp-3 font-medium flex-1">
                    {a.excerpt}
                  </p>
                  
                  <Link
                    to="/blog"
                    className="mt-6 w-full py-3 bg-[#F5A623] hover:bg-[#E0951F] text-[#0A1E0C] font-black uppercase tracking-wider text-xs rounded-xl transition text-center shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Read article <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          9. CONVERSION PATH
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF9F5] to-[#E9E4DB] py-12 text-left">
        <div className="container-px mx-auto max-w-7xl">
          
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden bg-gradient-to-br from-[#091F14] via-[#0D2E1E] to-[#040C06] text-white rounded-[32px] p-12 md:p-20 shadow-2xl border border-white/10"
          >
            {/* Stripe-style glowing atmosphere */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#52B788]/15 blur-[150px] pointer-events-none" />
            <div className="absolute -right-32 -bottom-32 h-[300px] w-[300px] rounded-full bg-[#F5A623]/10 blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-6">
              <span className="text-xs font-black tracking-widest text-[#F5A623] uppercase">
                Conversion Path
              </span>
              <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl uppercase leading-none">
                Ready to Experience Agriculture Differently?
              </h2>
              
              <p className="text-xs md:text-sm leading-relaxed text-white/80 max-w-2xl font-medium">
                Agriculture is changing, and so should the way we learn, connect, and grow.
                Mqulima brings together practical knowledge, trusted services, quality products,
                and a thriving community into one modern ecosystem built for everyone in
                agriculture. Whether you're producing, processing, trading, or simply passionate
                about the sector, you'll find the tools, people, and opportunities to move
                forward with confidence. Join us as we build the future of African agriculture-
                together.
              </p>

              <div className="flex flex-wrap items-center justify-start gap-4 pt-4">
                <Link
                  to="/auth/sign-up"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-[#F5A623] px-8 py-4.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#F5A623]/25 transition hover:bg-[#e09520] hover:scale-[1.02] active:scale-100"
                >
                  Join Us
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/5 px-8 py-4.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  Explore the Ecosystem
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </AppLayout>
  );
}
