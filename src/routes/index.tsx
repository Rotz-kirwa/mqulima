import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { HomeHero } from "@/components/mqulima/HomeHero";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
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
  Layers,
  Sprout,
  Shield,
  Database,
  Droplet,
  Coins,
  Stethoscope,
  Wheat,
  Tractor,
  Factory,
  Sun,
  Check,
  ArrowUpRight
} from "lucide-react";
import { articles } from "@/lib/mqulima-data";
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

const HOMEPAGE_CATEGORIES = [
  {
    id: "soil",
    title: "Soil Services",
    servicesCountText: "3 services",
    description: "Improve soil productivity through testing, treatment and professional fertilizer recommendations.",
    image: "/images/services/soil.png",
    icon: Sprout,
    checklist: [
      "Soil Testing & Analysis",
      "Soil Treatment & Conditioning",
      "Fertilizer Recommendation"
    ]
  },
  {
    id: "veterinary",
    title: "Veterinary & Animal Health",
    servicesCountText: "4 services",
    description: "Professional veterinary care, breeding services, vaccinations and livestock diagnosis.",
    image: "/images/services/veterinary.png",
    icon: Stethoscope,
    checklist: [
      "AI & Breeding",
      "Vaccination",
      "Veterinary Diagnosis",
      "Professional Vet Services"
    ]
  },
  {
    id: "animal_feeds",
    title: "Animal Feeds",
    servicesCountText: "6 services",
    description: "Feed formulation, silage production, incubation and livestock nutrition.",
    image: "/images/services/animal_feeds.png",
    icon: Wheat,
    checklist: [
      "Feed Formulation",
      "Feed Advice",
      "Silage Shredding",
      "Azolla Setup",
      "Machinery Rental",
      "Egg Incubation"
    ]
  },
  {
    id: "crop_production",
    title: "Crop Production",
    servicesCountText: "8 services",
    description: "Complete crop production services from land preparation to harvesting.",
    image: "/images/services/crop_production.png",
    icon: Tractor,
    checklist: [
      "Greenhouse Installation",
      "Partnerships",
      "Machinery Rental",
      "Cold Storage Hubs",
      "Irrigation Systems",
      "Agronomy Consultation"
    ]
  },
  {
    id: "value_addition",
    title: "Value Addition",
    servicesCountText: "4 services",
    description: "Increase the value of your agricultural produce through processing and expert guidance.",
    image: "/images/services/value_addition.png",
    icon: Factory,
    checklist: [
      "Agro-Processing & Milling",
      "Food-Grade Packaging",
      "KEBS Certification & Branding",
      "Expert Advisory"
    ]
  },
  {
    id: "other",
    title: "Other Services",
    servicesCountText: "7 services",
    description: "Additional agricultural services to support profitable farming.",
    image: "/images/services/other_services.png",
    icon: Sun,
    checklist: [
      "Boreholes & Hydro Survey",
      "Smart Solar Pumping",
      "Shed Construction",
      "Agri-Insurance & Finance"
    ]
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

  // Auto-sliding showcase carousel state (2 products on mobile, 3 on desktop, 3s interval)
  const [featuredPageIndex, setFeaturedPageIndex] = useState(0);
  const [isFeaturedHovered, setIsFeaturedHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const itemsPerPage = isMobile ? 2 : 3;
  const totalPages = Math.max(1, Math.ceil(featuredProducts.length / itemsPerPage));

  // Reset page index if out of bounds on screen resize
  useEffect(() => {
    if (featuredPageIndex >= totalPages) {
      setFeaturedPageIndex(0);
    }
  }, [itemsPerPage, totalPages, featuredPageIndex]);

  // Auto slide every 3 seconds (3000ms)
  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => {
      setFeaturedPageIndex((prev) => (prev + 1) % totalPages);
    }, 3000);
    return () => clearInterval(timer);
  }, [totalPages]);

  // Extract current products to display
  const currentGroupProducts = useMemo(() => {
    if (!featuredProducts.length) return [];
    const start = (featuredPageIndex * itemsPerPage) % featuredProducts.length;
    const group = [];
    for (let i = 0; i < itemsPerPage; i++) {
      const p = featuredProducts[(start + i) % featuredProducts.length];
      if (p) {
        group.push({ ...p, uniqueKey: `${p.id}-slot-${i}-page-${featuredPageIndex}-${isMobile ? 'm' : 'd'}` });
      }
    }
    return group;
  }, [featuredProducts, featuredPageIndex, itemsPerPage, isMobile]);

  // Testimonials auto-sliding carousel state (1 on mobile, 2 on desktop, 4s interval)
  const [testimonialPageIndex, setTestimonialPageIndex] = useState(0);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);

  const testimonialItemsPerPage = isMobile ? 1 : 2;
  const totalTestimonialPages = Math.max(1, Math.ceil(testimonials.length / testimonialItemsPerPage));

  useEffect(() => {
    if (testimonialPageIndex >= totalTestimonialPages) {
      setTestimonialPageIndex(0);
    }
  }, [testimonialItemsPerPage, totalTestimonialPages, testimonialPageIndex]);

  useEffect(() => {
    if (isTestimonialHovered || totalTestimonialPages <= 1) return;
    const timer = setInterval(() => {
      setTestimonialPageIndex((prev) => (prev + 1) % totalTestimonialPages);
    }, 4000);
    return () => clearInterval(timer);
  }, [isTestimonialHovered, totalTestimonialPages]);

  const currentGroupTestimonials = useMemo(() => {
    if (!testimonials.length) return [];
    const start = (testimonialPageIndex * testimonialItemsPerPage) % testimonials.length;
    const group = [];
    for (let i = 0; i < testimonialItemsPerPage; i++) {
      const t = testimonials[(start + i) % testimonials.length];
      if (t) {
        group.push({ ...t, uniqueKey: `${t.author}-slot-${i}-page-${testimonialPageIndex}-${isMobile ? 'm' : 'd'}` });
      }
    }
    return group;
  }, [testimonialPageIndex, testimonialItemsPerPage, isMobile]);

  return (
    <AppLayout>
      <HomeHero />

      {/* ══════════════════════════════════════════
          1. VALUE PROPOSITION & WHO IS MQULIMA?
          (Picture on Left, Story on Right)
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#FAFBF9] pt-6 pb-10 md:pt-8 md:pb-14 text-[#0F291E] border-b border-slate-200/60">
        <div className="container-px mx-auto max-w-7xl relative z-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-center">
            
            {/* Left Column: Story & Value Proposition */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="lg:col-span-7 text-left space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
                Welcome to the home of <br />
                <span className="text-[#6EA810]">
                  modern agriculture
                </span>
              </h2>

              <div className="space-y-5 text-slate-600 text-sm md:text-base leading-relaxed font-normal">
                <p>
                  We bring together every step of the agricultural journey to one home.
                  Whether learning, producing, distributing, trading or adding value — just log
                  into Mqulima. We are Africa's 360° agricultural ecosystem. We bring an end
                  to guesswork, gossip, scattered information and unresponsive support.
                  Because agriculture works better when everything works together.
                </p>
                <p>
                  We understand that what you do is priceless and we are devoted to making it
                  easy, enjoyable and profitable.
                </p>

                {/* Who is Mqulima block */}
                <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white p-6 shadow-sm">
                  <h4 className="text-[#0F291E] font-extrabold text-lg md:text-xl flex items-center gap-2 font-['Outfit',sans-serif]">
                    <Sparkles className="h-5 w-5 text-[#85CC14]" />
                    Who is Mqulima?
                  </h4>
                  <p className="mt-2 text-xs md:text-sm text-slate-700 italic font-medium leading-relaxed">
                    "Mqulima is a farmer’s world. At Mqulima, we are building a paradise for
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
              className="lg:col-span-5 relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] rounded-[28px] overflow-hidden border border-slate-200/90 shadow-xl"
            >
              <img
                src="https://i.pinimg.com/736x/d3/8a/07/d38a0721bac4f6b2a4ee73d79c557f08.jpg"
                alt="Aerial view of lush green modern agriculture fields"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2117]/90 via-transparent to-transparent flex items-end p-8">
                <div className="text-white text-left">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#85CC14]">
                    MQULIMA ECOSYSTEM
                  </span>
                  <h3 className="text-xl font-bold uppercase mt-1 font-['Outfit',sans-serif]">Africa’s 360° Ag-Core</h3>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. THE ECOSYSTEM: AGRICULTURE CONNECTED
          (5-Part Custom Solutions Grid - Services Hero Dark Theme Match)
      ══════════════════════════════════════════ */}
      <section className="bg-[#0F291E] py-10 md:py-14 text-white relative overflow-hidden">
        <div className="container-px mx-auto max-w-7xl relative z-10">
          
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl text-left space-y-3">
              <span className="inline-block rounded-full bg-[#85CC14]/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#85CC14] border border-[#85CC14]/30">
                THE ECOSYSTEM
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight font-['Outfit',sans-serif]">
                Explore the Mqulima Ecosystem. <br />
                <span className="text-[#85CC14]">
                  Agriculture Connected.
                </span>
              </h2>
            </div>
            <div className="max-w-md text-left">
              <p className="text-xs md:text-sm text-white/80 leading-relaxed font-normal">
                Whatever your role in agriculture and wherever you sit in the chain, Mqulima
                connects you to the knowledge, products, services and people you need to
                succeed — all in one place.
              </p>
            </div>
          </div>

          {/* 5-Solutions Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            
            {/* 1. Agroshop */}
            <div className="bg-[#16382B]/70 border border-white/10 hover:border-[#85CC14] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className="space-y-4 text-left">
                <div className="h-12 w-12 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/30 flex items-center justify-center text-xl">
                  <span>🛒</span>
                </div>
                <div>
                  <span className="text-xs font-black tracking-widest text-[#85CC14] mb-1 block">01</span>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight font-['Outfit',sans-serif]">Agroshop</h3>
                  <p className="text-xs text-white/70 leading-relaxed font-normal mt-2">
                    Source trusted agricultural products from verified suppliers and have them delivered to your doorstep.
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <Link
                  to="/shop"
                  className="w-fit sm:w-full py-2 px-4 sm:py-2.5 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs transition duration-200 inline-flex sm:flex items-center justify-between gap-2 shadow-sm"
                >
                  <span>View shop</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* 2. Insights */}
            <div className="bg-[#16382B]/70 border border-white/10 hover:border-[#85CC14] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className="space-y-4 text-left">
                <div className="h-12 w-12 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/30 flex items-center justify-center text-xl">
                  <span>📈</span>
                </div>
                <div>
                  <span className="text-xs font-black tracking-widest text-[#85CC14] mb-1 block">02</span>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight font-['Outfit',sans-serif]">Insights</h3>
                  <p className="text-xs text-white/70 leading-relaxed font-normal mt-2">
                    Stay ahead with practical farming guides, market intelligence, expert articles, and timely updates.
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <Link
                  to="/blog"
                  className="w-fit sm:w-full py-2 px-4 sm:py-2.5 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs transition duration-200 inline-flex sm:flex items-center justify-between gap-2 shadow-sm"
                >
                  <span>View Updates</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* 3. Services */}
            <div className="bg-[#16382B]/70 border border-white/10 hover:border-[#85CC14] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className="space-y-4 text-left">
                <div className="h-12 w-12 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/30 flex items-center justify-center text-xl">
                  <span>🛠️</span>
                </div>
                <div>
                  <span className="text-xs font-black tracking-widest text-[#85CC14] mb-1 block">03</span>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight font-['Outfit',sans-serif]">Services</h3>
                  <p className="text-xs text-white/70 leading-relaxed font-normal mt-2">
                    Access trusted professional services when and where you need them — from veterinary care to installation.
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <Link
                  to="/services"
                  className="w-fit sm:w-full py-2 px-4 sm:py-2.5 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs transition duration-200 inline-flex sm:flex items-center justify-between gap-2 shadow-sm"
                >
                  <span>Book a Service</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* 4. Community */}
            <div className="bg-[#16382B]/70 border border-white/10 hover:border-[#85CC14] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group">
              <div className="space-y-4 text-left">
                <div className="h-12 w-12 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/30 flex items-center justify-center text-xl">
                  <span>🤝</span>
                </div>
                <div>
                  <span className="text-xs font-black tracking-widest text-[#85CC14] mb-1 block">04</span>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight font-['Outfit',sans-serif]">Community</h3>
                  <p className="text-xs text-white/70 leading-relaxed font-normal mt-2">
                    Connect with thousands of farmers, experts, and agribusinesses to learn, share, and solve together.
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <Link
                  to="/community"
                  className="w-fit sm:w-full py-2 px-4 sm:py-2.5 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs transition duration-200 inline-flex sm:flex items-center justify-between gap-2 shadow-sm"
                >
                  <span>Connect</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* 5. Academy */}
            <div className="bg-[#16382B]/70 border border-white/10 hover:border-[#85CC14] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group sm:col-span-2 lg:col-span-1">
              <div className="space-y-4 text-left">
                <div className="h-12 w-12 rounded-full bg-[#85CC14]/20 border border-[#85CC14]/30 flex items-center justify-center text-xl">
                  <span>🎓</span>
                </div>
                <div>
                  <span className="text-xs font-black tracking-widest text-[#85CC14] mb-1 block">05</span>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight font-['Outfit',sans-serif]">Academy</h3>
                  <p className="text-xs text-white/70 leading-relaxed font-normal mt-2">
                    Master modern practical agriculture through structured learning and expert real-world guidance.
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <Link
                  to="/academy"
                  className="w-fit sm:w-full py-2 px-4 sm:py-2.5 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs transition duration-200 inline-flex sm:flex items-center justify-between gap-2 shadow-sm"
                >
                  <span>Visit Academy</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. FEATURED PRODUCTS (Auto-Sliding Group - 3s Interval)
      ══════════════════════════════════════════ */}
      <section 
        className="bg-[#FAFBF9] py-6 sm:py-8 md:py-12 text-[#0F291E] overflow-hidden border-b border-slate-200/60"
        onMouseEnter={() => setIsFeaturedHovered(true)}
        onMouseLeave={() => setIsFeaturedHovered(false)}
      >
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header Row with Clean Title and Navigation Controls */}
          <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4 text-left">
            <div>
              <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#35610D] mb-1">
                FEATURED COLLECTION
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
                Farm <span className="text-[#6EA810]">Essentials</span>
              </h2>
            </div>
            
            {/* Carousel Navigation Chevron Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setFeaturedPageIndex((prev) => (prev - 1 + totalPages) % totalPages)}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-slate-200 bg-white hover:bg-[#E5F5D0] text-[#0F291E] flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer"
                aria-label="Previous featured showcase"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setFeaturedPageIndex((prev) => (prev + 1) % totalPages)}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-slate-200 bg-white hover:bg-[#E5F5D0] text-[#0F291E] flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer"
                aria-label="Next featured showcase"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Products Grid/Carousel with Touch Swipe & Auto-Slide */}
          <div className="relative touch-pan-y overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${featuredPageIndex}-${isMobile ? 'm' : 'd'}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) {
                    setFeaturedPageIndex((prev) => (prev + 1) % totalPages);
                  } else if (info.offset.x > 40) {
                    setFeaturedPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
                  }
                }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 md:gap-6 cursor-grab active:cursor-grabbing"
              >
                {currentGroupProducts.map((p) => {
                  const targetLink = (p as any).linkUrl || (p.slug ? `/shop/product/${p.slug}` : "/shop");

                  return (
                    <div
                      key={p.uniqueKey || p.id}
                      className="w-full shrink-0 mx-auto"
                    >
                      <Link
                        to={targetLink}
                        className="group block relative aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] w-full h-full overflow-hidden rounded-none border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:shadow-xl cursor-pointer"
                      >
                        <img
                          src={p.image || (p.imageUrls && p.imageUrls[0]) || "/placeholder-product.png"}
                          alt={p.name || "Farm Essential"}
                          loading="lazy"
                          className="h-full w-full object-contain object-center p-2.5 sm:p-4 pb-12 sm:pb-14 transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder-product.png";
                          }}
                        />
                        {p.name && p.name !== "Farm Essential" && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-2.5 px-3 sm:px-4 text-left pointer-events-none">
                            <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-[#0F291E] font-['Outfit',sans-serif] line-clamp-2 tracking-tight leading-tight">
                              {p.name}
                            </h3>
                            {p.price > 0 && (
                              <span className="text-[11px] sm:text-xs font-bold text-[#16A34A] block mt-0.5 font-mono">
                                KSh {Number(p.price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pagination Indicators Below Product Cards */}
          {totalPages > 1 && (
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 py-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedPageIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
                    featuredPageIndex === idx
                      ? "w-7 bg-[#16A34A]"
                      : "w-2 bg-slate-300 hover:bg-slate-400"
                  }`}
                  aria-label={`Go to page ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Explore Agroshop Button */}
          <div className="mt-4 sm:mt-6 text-center flex justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl md:rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg active:scale-98 cursor-pointer w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              <span>Explore Agroshop</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. MQULIMA SERVICES CATEGORIES GRID (Pixel-matched to Services Page)
      ══════════════════════════════════════════ */}
      <section className="py-10 md:py-14 bg-[#FAFBF9] border-y border-slate-200/60 w-full max-w-full overflow-hidden">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Section Header */}
          <div className="text-left max-w-3xl mb-8">
            <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D] mb-3">
              OUR SERVICES
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
              Everything your farm needs,{" "}
              <span className="text-[#6EA810]">in one place</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Explore six specialist categories delivered by vetted professionals. Pick a category, view the services and get a quotation on WhatsApp in minutes.
            </p>
          </div>

          {/* 6 Category Cards Grid (3 Columns on Desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {HOMEPAGE_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-[28px] border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left group"
                >
                  <div>
                    {/* Card Image Header with Overlays */}
                    <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Gradient overlay on bottom of image for title readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B2117]/90 via-[#0B2117]/30 to-transparent" />

                      {/* Top Left Circular Category Icon Badge */}
                      <div className="absolute top-4 left-4 p-2.5 rounded-full bg-[#16A34A] text-white shadow-md flex items-center justify-center">
                        <IconComponent className="h-5 w-5 stroke-[2]" />
                      </div>

                      {/* Top Right Translucent Service Count Pill */}
                      <div className="absolute top-4 right-4 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm border border-white/40">
                        {cat.servicesCountText}
                      </div>

                      {/* Bottom Left Title Overlay */}
                      <div className="absolute bottom-4 left-5 right-5">
                        <h3 className="text-2xl font-bold text-white tracking-tight leading-tight font-['Outfit',sans-serif]">
                          {cat.title}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-6">
                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-6 min-h-[44px]">
                        {cat.description}
                      </p>

                      {/* Green Checkmarks List */}
                      <ul className="space-y-2.5">
                        {cat.checklist.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                            <Check className="h-4 w-4 text-[#16A34A] stroke-[3] shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Card Footer Action Buttons */}
                  <div className="p-6 pt-0">
                    <Link
                      to="/services"
                      search={{ category: cat.id }}
                      className="w-full py-2.5 px-4 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs sm:text-sm transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-sm"
                    >
                      <span>View Services</span>
                      <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. ACADEMY SECTION
      ══════════════════════════════════════════ */}
      <section className="bg-white py-10 md:py-14 text-[#0F291E] border-b border-slate-200/60 w-full max-w-full overflow-hidden">
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-center">
            
            {/* Left text */}
            <div className="lg:col-span-6 text-left space-y-6">
              <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D] mb-1">
                STRUCTURED ACADEMY
              </span>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
                Farming is a science. <br />
                <span className="text-[#6EA810]">
                  Learn it like one.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                Master modern practical agriculture through structured learning, best practices,
                and real-world guidance designed to help you farm smarter and grow profitably.
                Go from amateur planter to commercial agribusiness owner.
              </p>

              <div className="pt-2">
                <Link
                  to="/academy"
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs sm:text-sm transition duration-200 shadow-sm cursor-pointer"
                >
                  <span>Visit Academy</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
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
                <div key={item.step} className="flex gap-4 p-6 border border-slate-200/90 rounded-[24px] bg-white text-left shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="text-2xl font-black text-[#6EA810] font-['Outfit',sans-serif]">{item.step}</div>
                  <div>
                    <h4 className="text-base font-bold text-[#0F291E] font-['Outfit',sans-serif]">{item.name}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal leading-relaxed">{item.desc}</p>
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
      <section className="bg-[#FAFBF9] py-10 md:py-14 text-[#0F291E] border-b border-slate-200/60 w-full max-w-full overflow-hidden">
        <div className="container-px mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-center">
            
            {/* Left Story Column */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="lg:col-span-7 text-left space-y-6"
            >
              <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D] mb-1">
                WHY WE EXIST
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
                Building the Future <br />
                <span className="text-[#6EA810]">
                  of Agriculture
                </span>
              </h2>

              <h4 className="text-base sm:text-lg font-bold text-[#16A34A] uppercase tracking-wide font-['Outfit',sans-serif]">
                No farmer should have to gamble with their livelihood.
              </h4>
              
              <div className="space-y-5 text-slate-600 text-sm md:text-base leading-relaxed font-normal">
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
                  We're creating Africa's 360° agricultural ecosystem — a place where farmers,
                  traders, researchers, service providers and consumers come together to
                  learn, collaborate and grow.
                </p>
                <p className="text-xs sm:text-sm font-bold text-[#35610D] uppercase tracking-wider">
                  Because when everything works together, agriculture works better.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs sm:text-sm transition duration-200 shadow-sm cursor-pointer"
                >
                  <span>Partner with us</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>
              </div>
            </motion.div>

            {/* Right Image Feature Column */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5 relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] rounded-[28px] overflow-hidden border border-slate-200/90 shadow-xl"
            >
              <img
                src={heroFarmerWoman}
                alt="Modern African farming excellence"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2117]/90 via-transparent to-transparent flex items-end p-8">
                <div className="text-white text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#85CC14] uppercase mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Verified Excellence
                  </div>
                  <h4 className="text-lg font-bold uppercase tracking-wide font-['Outfit',sans-serif]">Premium Agricultural Support</h4>
                  <p className="text-xs text-white/80 font-normal mt-0.5">Taking you first class in agronomy training.</p>
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
      <section 
        className="bg-[#FAFBF9] py-10 md:py-14 text-[#0F291E] border-b border-slate-200/60 w-full max-w-full overflow-hidden"
        onMouseEnter={() => setIsTestimonialHovered(true)}
        onMouseLeave={() => setIsTestimonialHovered(false)}
      >
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header with Navigation Controls */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D] mb-3">
                SOCIAL PROOF
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-[#Outfit,sans-serif]">
                Loved by farmers, trusted by <span className="text-[#6EA810]">agricultural experts</span>
              </h2>
            </motion.div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Pagination Dots */}
              <div className="flex gap-1.5 mr-2 max-w-[140px] sm:max-w-none overflow-x-auto no-scrollbar py-1">
                {Array.from({ length: totalTestimonialPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTestimonialPageIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
                      testimonialPageIndex === idx
                        ? "w-8 bg-[#16A34A]"
                        : "w-2.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to testimonial group ${idx + 1}`}
                  />
                ))}
              </div>

              <button 
                onClick={() => setTestimonialPageIndex((prev) => (prev - 1 + totalTestimonialPages) % totalTestimonialPages)}
                className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-[#E5F5D0] text-[#0F291E] flex items-center justify-center transition active:scale-95 shadow-sm cursor-pointer shrink-0"
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setTestimonialPageIndex((prev) => (prev + 1) % totalTestimonialPages)}
                className="h-10 w-10 rounded-full border border-slate-200 bg-white hover:bg-[#E5F5D0] text-[#0F291E] flex items-center justify-center transition active:scale-95 shadow-sm cursor-pointer shrink-0"
                aria-label="Next testimonials"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Testimonial Cards Carousel Grid with Framer Motion Auto-Slide + Touch Swipe */}
          <div className="relative min-h-[220px] touch-pan-y overflow-hidden mb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${testimonialPageIndex}-${isMobile ? 'm' : 'd'}`}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) {
                    setTestimonialPageIndex((prev) => (prev + 1) % totalTestimonialPages);
                  } else if (info.offset.x > 40) {
                    setTestimonialPageIndex((prev) => (prev - 1 + totalTestimonialPages) % totalTestimonialPages);
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 cursor-grab active:cursor-grabbing"
              >
                {currentGroupTestimonials.map((t) => (
                  <div
                    key={t.uniqueKey || t.author}
                    className="relative w-full rounded-[24px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm hover:shadow-xl flex flex-col justify-between transition-all duration-300 text-left"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[...Array(t.stars)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-[#F5A623] text-[#F5A623]" />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#E5F5D0] text-[#35610D]">
                          {t.badge}
                        </span>
                      </div>
                      
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-normal italic">
                        "{t.quote}"
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3.5">
                      <img
                        src={t.image}
                        alt={t.author}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#0F291E] font-['Outfit',sans-serif]">
                          {t.author}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {t.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stats Board */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              {
                count: "47",
                label: "Counties Reached",
                desc: "Full Kenyan national coverage",
                icon: MapPin
              },
              {
                count: "1,000+",
                label: "Products Listed",
                desc: "100% verified quality inputs",
                icon: ShoppingBag
              },
              {
                count: "200+",
                label: "Knowledge Articles",
                desc: "Agronomist approved research",
                icon: BookOpen
              },
            ].map((s, idx) => {
              const IconComp = s.icon;
              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between gap-4 text-left p-6 rounded-[24px] border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div>
                    <div className="text-3xl font-black text-[#0F291E] leading-none tracking-tight font-['Outfit',sans-serif]">{s.count}</div>
                    <div className="mt-1.5 text-xs font-bold uppercase tracking-wider text-[#35610D]">
                      {s.label}
                    </div>
                    <div className="text-xs mt-0.5 font-normal text-slate-500">{s.desc}</div>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E5F5D0] text-[#35610D]">
                    <IconComp className="h-6 w-6 stroke-[2.5]" />
                  </div>
                </div>
              );
            })}
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. COMMUNITY & KNOWLEDGE HUB
      ══════════════════════════════════════════ */}
      <section className="bg-[#FAFBF9] py-10 md:py-14 text-[#0F291E] border-b border-slate-200/60 w-full max-w-full overflow-hidden">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header */}
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-12 items-end mb-6 text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7"
            >
              <span className="inline-block rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#35610D] mb-3">
                KNOWLEDGE HUB & JOURNALS
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0F291E] tracking-tight leading-tight font-['Outfit',sans-serif]">
                Agronomy journals that keep <span className="text-[#6EA810]">farmers in the know</span>
              </h2>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 text-xs md:text-sm text-slate-600 leading-relaxed font-normal"
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
                className="group flex flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:shadow-xl text-left"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={(a as any).coverImage || (a as any).image}
                    alt={a.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/mqulima_news_banner.png";
                    }}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-[#0F291E] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    {a.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    {a.readTime.includes("read") ? a.readTime : `${a.readTime} read`}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-[#0F291E] line-clamp-2 group-hover:text-[#16A34A] transition-colors font-['Outfit',sans-serif] leading-snug">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3 font-normal flex-1">
                    {a.excerpt}
                  </p>
                  
                  <Link
                    to="/blog"
                    className="mt-6 w-full py-2.5 px-4 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs transition duration-200 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Read article</span>
                    <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
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
      <section className="bg-[#FAFBF9] py-10 md:py-14 text-left w-full max-w-full overflow-hidden">
        <div className="container-px mx-auto max-w-7xl">
          
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden bg-[#0F291E] text-white rounded-[32px] p-6 md:p-10 shadow-2xl border border-white/10"
          >
            <div className="relative z-10 max-w-3xl space-y-6">
              <span className="inline-block rounded-full bg-[#85CC14]/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#85CC14] border border-[#85CC14]/30">
                JOIN THE ECOSYSTEM
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-['Outfit',sans-serif] leading-tight">
                Ready to Experience Agriculture Differently?
              </h2>
              
              <p className="text-xs md:text-sm leading-relaxed text-white/85 max-w-2xl font-normal">
                Agriculture is changing, and so should the way we learn, connect, and grow.
                Mqulima brings together practical knowledge, trusted services, quality products,
                and a thriving community into one modern ecosystem built for everyone in
                agriculture.
              </p>

              <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-4 pt-4 w-full">
                <Link
                  to="/auth/sign-up"
                  className="w-full sm:w-auto py-3.5 px-3 sm:px-8 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-extrabold text-[11px] sm:text-sm transition duration-200 shadow-lg shadow-[#85CC14]/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 text-center"
                >
                  <span>Join Mqulima</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5] shrink-0" />
                </Link>
                <Link
                  to="/tools"
                  className="w-full sm:w-auto py-3.5 px-3 sm:px-8 rounded-full bg-white/10 border border-white/20 text-white font-bold text-[11px] sm:text-sm hover:bg-white/20 transition duration-200 backdrop-blur-md flex items-center justify-center text-center"
                >
                  Explore Ecosystem
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </AppLayout>
  );
}
