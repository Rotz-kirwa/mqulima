import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  X,
  ArrowRight,
  ShoppingBag,
  Wrench,
  Sparkles,
  Navigation,
  Globe,
  MessageSquare,
  Check,
  Building2,
  Truck,
  CreditCard,
  RotateCcw,
  Award,
  Layers,
  ChevronLeft,
  ChevronRight,
  Store,
  Compass,
} from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  AUTHORITATIVE_BUSINESS_DEFAULTS,
  getBusinessOpenStatus,
  format12Hour,
  buildBusinessProfileJsonLd,
  type BusinessProfileData,
  type OperatingHourDay,
} from "@/lib/business-data";
import { getBusinessProfile } from "@/lib/api/business.server";
import { getFeaturedProducts } from "@/lib/api/products.server";
import { getServiceCategoriesWithServices } from "@/lib/api/services.server";

export const Route = createFileRoute("/business")({
  staleTime: 60_000,
  gcTime: 10 * 60_000,
  loader: async () => {
    const withSafeTimeout = async <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> => {
      let timer: any;
      const timeout = new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      });
      return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
    };

    try {
      const [profile, featProducts, servicesData] = await withSafeTimeout(
        Promise.all([
          getBusinessProfile().catch(() => AUTHORITATIVE_BUSINESS_DEFAULTS),
          getFeaturedProducts().catch(() => []),
          getServiceCategoriesWithServices().catch(() => ({ categories: [], services: [] })),
        ]),
        4500,
        [AUTHORITATIVE_BUSINESS_DEFAULTS, [], { categories: [], services: [] }]
      );

      return {
        profile: profile || AUTHORITATIVE_BUSINESS_DEFAULTS,
        products: (featProducts || []).slice(0, 6),
        services: (servicesData?.services || []).slice(0, 6),
      };
    } catch {
      return {
        profile: AUTHORITATIVE_BUSINESS_DEFAULTS,
        products: [],
        services: [],
      };
    }
  },
  head: ({ loaderData }) => {
    const profile = loaderData?.profile || AUTHORITATIVE_BUSINESS_DEFAULTS;
    const jsonLd = buildBusinessProfileJsonLd(profile);

    return {
      meta: [
        { title: `${profile.businessName} — Official Business Profile & Agricultural Hub` },
        {
          name: "description",
          content: `${profile.shortDescription} Located at ${profile.addressStreet}, ${profile.addressCity}, Kenya. Official telephone: ${profile.phonePrimary}.`,
        },
        { property: "og:title", content: `${profile.businessName} — Official Business Profile` },
        {
          property: "og:description",
          content: `${profile.shortDescription} Eldoret, Kenya hub for certified seeds, agrochemicals, agronomy services, and farm trade.`,
        },
        { property: "og:url", content: "https://mqulima.com/business" },
        { property: "og:image", content: `https://mqulima.com${profile.logoUrl}` },
        { property: "og:type", content: "business.business" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${profile.businessName} — Official Business Profile` },
        {
          name: "twitter:description",
          content: profile.shortDescription,
        },
        { name: "twitter:image", content: `https://mqulima.com${profile.coverImageUrl}` },
      ],
      links: [
        { rel: "canonical", href: "https://mqulima.com/business" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  component: BusinessProfilePage,
});

function BusinessProfilePage() {
  const { profile, products, services } = Route.useLoaderData();

  // Active section for sticky sub-nav
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Gallery filter state
  const [galleryFilter, setGalleryFilter] = useState<string>("all");

  // Time and Open status in Africa/Nairobi
  const openStatus = useMemo(() => {
    return getBusinessOpenStatus(profile.operatingHours);
  }, [profile.operatingHours]);

  // Gallery assets with metadata
  const galleryItems = useMemo(() => {
    const images = profile.galleryImages || [];
    return images.map((src, i) => {
      let category = "hub";
      let caption = "Mqulima Eldoret Depot & Operations";

      if (src.includes("crop_production") || src.includes("soil") || src.includes("veterinary") || src.includes("value_addition")) {
        category = "services";
        caption = "Professional Agricultural Advisory & Extension Services";
      } else if (src.includes("soko") || src.includes("community")) {
        category = "community";
        caption = "Kenyan Farmer Network & Produce Trade Linkages";
      } else if (src.includes("product") || src.includes("banner")) {
        category = "products";
        caption = "Certified Genuine Agricultural Inputs & Seedlings";
      }

      return { id: i, src, category, caption };
    });
  }, [profile.galleryImages]);

  const filteredGallery = useMemo(() => {
    if (galleryFilter === "all") return galleryItems;
    return galleryItems.filter((item) => item.category === galleryFilter);
  }, [galleryItems, galleryFilter]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < filteredGallery.length - 1 ? prev + 1 : 0));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredGallery.length - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredGallery.length]);

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // offset for sticky nav
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] text-[#0A1E0C] min-h-screen font-sans selection:bg-[#245B35] selection:text-white relative">
        {/* =========================================================================
            SECTION 1: HERO COVER BANNER & GOOGLE BUSINESS PROFILE IDENTITY HEADER
           ========================================================================= */}
        <section className="relative w-full bg-[#112E22] text-white overflow-hidden border-b border-emerald-950/20">
          {/* Cover Image with subtle darkened gradient for readability */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-emerald-950">
            <img
              src={profile.coverImageUrl || "/hero-cinematic.webp"}
              alt={`${profile.businessName} Headquarters Cover`}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-700 ease-out"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1E0C] via-[#0A1E0C]/60 to-transparent" />
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0A1E0C]/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Business Profile
              </span>
            </div>
          </div>

          {/* Profile Identity Card Overlay */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-20 pb-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-[0_20px_50px_-15px_rgba(10,30,12,0.15)] border border-emerald-100/80 text-left">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                {/* Brand Logo & Core Meta */}
                <div className="flex items-start sm:items-center gap-5 sm:gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-emerald-100 p-2 shrink-0 shadow-md flex items-center justify-center overflow-hidden">
                    <img
                      src={profile.logoUrl || "/mqulima-logo.png"}
                      alt={`${profile.businessName} Logo`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-serif text-[#0A1E0C] tracking-tight">
                        {profile.businessName}
                      </h1>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Merchant
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-emerald-850 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-700" />
                      {profile.primaryCategory}
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600 font-normal">{profile.brandTagline}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 pt-1">
                      <span className="flex items-center gap-1 text-gray-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        {profile.addressStreet}, {profile.addressCity}
                      </span>
                      <span className="text-gray-300">•</span>
                      {/* Live Open / Closed Beacon */}
                      <span className="flex items-center gap-1.5 font-bold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            openStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        <span className={openStatus.isOpen ? "text-emerald-700" : "text-rose-700"}>
                          {openStatus.statusLabel}
                        </span>
                        <span className="text-gray-500 font-normal">({openStatus.nextTimeLabel})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA Buttons (Google Business Profile Pattern) */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto pt-2 md:pt-0">
                  <a
                    href={`tel:${profile.phonePrimary.replace(/\s+/g, "")}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#245B35] hover:bg-[#1C492A] text-white text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                    Call Business
                  </a>
                  <a
                    href={profile.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#0A1E0C] text-xs sm:text-sm font-bold border border-emerald-200 shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <Navigation className="w-4 h-4 text-emerald-700" />
                    Directions
                  </a>
                  <a
                    href={`https://wa.me/${profile.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BA56] text-white text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
                    title="Chat on WhatsApp"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    AgroShop
                  </Link>
                </div>
              </div>

              {/* Sub-Notice: Official Google Listing Sync Status */}
              <div className="mt-6 pt-5 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    Official verified digital business profile of <strong>Mqulima Hub (Kirgit Agri)</strong>.
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={profile.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    Open in Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-gray-300">•</span>
                  <span>Eldoret Depot, Kenya</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: STICKY SUB-NAVIGATION BAR (Google Profile Hierarchy)
           ========================================================================= */}
        <nav
          aria-label="Profile navigation"
          className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar text-xs sm:text-sm font-bold text-gray-600">
              {[
                { id: "overview", label: "Overview" },
                { id: "products", label: "Products" },
                { id: "services", label: "Services" },
                { id: "photos", label: "Photos" },
                { id: "hours", label: "Hours & Location" },
                { id: "reviews", label: "Quality & Reviews" },
                { id: "faqs", label: "FAQs" },
                { id: "policies", label: "Policies" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#245B35] text-white shadow-sm"
                      : "hover:bg-emerald-50 text-gray-700 hover:text-emerald-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* =========================================================================
            MAIN CONTENT GRID (Information-Rich 2-Column Layout)
           ========================================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ───────────────────────────────────────────────────────────
                LEFT COLUMN (Content Sections: Overview, Products, Services, Photos, FAQs)
               ─────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-12">
              {/* SECTION: OVERVIEW */}
              <section id="overview" className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 text-left space-y-6">
                <div className="flex items-center gap-2.5 border-b border-emerald-100 pb-4">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0A1E0C]">About {profile.businessName}</h2>
                </div>

                <div className="prose prose-emerald max-w-none text-gray-700 text-sm sm:text-base leading-relaxed space-y-4">
                  <p className="font-semibold text-emerald-950 text-base sm:text-lg">
                    {profile.brandSlogan} — {profile.brandTagline}
                  </p>
                  <p>{profile.fullOverview}</p>
                </div>

                {/* Ecosystem Highlights Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/80 text-left">
                    <span className="text-2xl sm:text-3xl font-black font-serif text-emerald-800">47</span>
                    <p className="text-xs font-semibold text-emerald-950 uppercase tracking-wide mt-1">Counties Reached</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Nationwide delivery</p>
                  </div>
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/80 text-left">
                    <span className="text-2xl sm:text-3xl font-black font-serif text-emerald-800">100%</span>
                    <p className="text-xs font-semibold text-emerald-950 uppercase tracking-wide mt-1">Certified Inputs</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Zero counterfeit rule</p>
                  </div>
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/80 text-left">
                    <span className="text-2xl sm:text-3xl font-black font-serif text-emerald-800">24–48h</span>
                    <p className="text-xs font-semibold text-emerald-950 uppercase tracking-wide mt-1">Regional Dispatch</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">From Eldoret Depot</p>
                  </div>
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100/80 text-left">
                    <span className="text-2xl sm:text-3xl font-black font-serif text-emerald-800">Verified</span>
                    <p className="text-xs font-semibold text-emerald-950 uppercase tracking-wide mt-1">Agri Specialists</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Vetted field experts</p>
                  </div>
                </div>

                {/* Service Areas Covered */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Service Areas & Regional Coverage</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.serviceAreas.map((area, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F8F6EF] text-emerald-900 border border-[#E9E4D4]"
                      >
                        <MapPin className="w-3 h-3 text-emerald-700" />
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* SECTION: FEATURED PRODUCTS */}
              <section id="products" className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 text-left space-y-6">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-emerald-700" />
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0A1E0C]">Featured Agricultural Inputs</h2>
                      <p className="text-xs text-gray-500">Genuine seeds, fertilizers, and protection straight from verified manufacturers</p>
                    </div>
                  </div>
                  <Link
                    to="/shop"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-750 hover:text-emerald-950 transition-colors"
                  >
                    View All in AgroShop <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {products.map((prod: any) => (
                      <Link
                        key={prod.id}
                        to="/shop/product/$slug"
                        params={{ slug: prod.slug }}
                        className="group flex flex-col bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 p-3.5 hover:shadow-lg transition-all duration-300 text-left"
                      >
                        <div className="relative aspect-square w-full rounded-xl bg-gray-50 overflow-hidden mb-3">
                          <img
                            src={prod.image || "/placeholder-product.png"}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0A1E0C]/80 text-white backdrop-blur-sm">
                            {prod.category || "Certified Input"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0A1E0C] group-hover:text-emerald-750 line-clamp-2 leading-snug mb-1">
                          {prod.name}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{prod.brand || "Verified Input"}</p>
                        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="font-black text-sm text-emerald-850">
                            KSh {Number(prod.price || 0).toLocaleString()}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            View Product
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-2xl">
                    <p className="text-sm">Explore our catalog of certified agricultural inputs in the Mqulima AgroShop.</p>
                  </div>
                )}

                <div className="pt-2 text-center sm:hidden">
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 rounded-xl bg-[#245B35] text-white text-xs font-bold"
                  >
                    View All 300+ Products <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </section>

              {/* SECTION: AGRICULTURAL SERVICES */}
              <section id="services" className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 text-left space-y-6">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Wrench className="w-5 h-5 text-emerald-700" />
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0A1E0C]">On-Demand Agricultural Services</h2>
                      <p className="text-xs text-gray-500">Book vetted agronomists, soil lab profiling, and mechanization specialists</p>
                    </div>
                  </div>
                  <Link
                    to="/services"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-750 hover:text-emerald-950 transition-colors"
                  >
                    Explore Services <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Certified Soil Testing & Nutrient Profiling",
                      desc: "Laboratory analysis of pH, NPK, micro-nutrients, and organic carbon with custom fertilizer blend guidelines.",
                      icon: Layers,
                      action: "Book Soil Test",
                    },
                    {
                      title: "Veterinary Care & AI Breeding Services",
                      desc: "Registered veterinary field officers for herd vaccination, ultrasound pregnancy scans, and superior cattle genetics.",
                      icon: Award,
                      action: "Book Vet Visit",
                    },
                    {
                      title: "Silage Shredding & Fodder Processing",
                      desc: "High-throughput tractor-mounted silage shredding, inoculation, and baling for commercial and smallholder dairy farmers.",
                      icon: Truck,
                      action: "Request Equipment",
                    },
                    {
                      title: "Greenhouse Installation & Smart Drip Kits",
                      desc: "Turnkey wooden and galvanized steel greenhouse construction with automated filtration and drip lines.",
                      icon: Compass,
                      action: "Get Quotation",
                    },
                  ].map((srv, idx) => {
                    const IconComponent = srv.icon;
                    return (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-[#F8F6EF]/60 border border-[#E9E4D4] hover:border-emerald-300 transition-all text-left flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-[#245B35] text-white flex items-center justify-center shadow-sm">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-base text-[#0A1E0C]">{srv.title}</h4>
                          <p className="text-xs text-gray-600 leading-relaxed">{srv.desc}</p>
                        </div>
                        <div className="pt-4 mt-2 border-t border-[#E9E4D4]/60">
                          <Link
                            to="/services"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                          >
                            {srv.action} <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION: GENUINE BUSINESS PHOTOS & GALLERY */}
              <section id="photos" className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 text-left space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0A1E0C]">Business Photos & Facilities</h2>
                    <p className="text-xs text-gray-500">Genuine operations, certified catalog products, and field extensions</p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold no-scrollbar">
                    {[
                      { id: "all", label: "All" },
                      { id: "hub", label: "Depot & Hub" },
                      { id: "products", label: "Products" },
                      { id: "services", label: "Services" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setGalleryFilter(f.id)}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          galleryFilter === f.id
                            ? "bg-emerald-100 text-emerald-900 font-bold"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {filteredGallery.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setLightboxIndex(idx)}
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      aria-label={`View photo: ${item.caption}`}
                    >
                      <img
                        src={item.src}
                        alt={item.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <span className="text-[11px] text-white font-medium line-clamp-1 text-left">
                          {item.caption}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* SECTION: CUSTOMER QUALITY, REVIEWS & GOOGLE REPUTATION */}
              <section id="reviews" className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 text-left space-y-6">
                <div className="border-b border-emerald-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0A1E0C]">Quality Standards & Reviews</h2>
                  <p className="text-xs text-gray-500">Transparent farmer feedback and regulatory compliance</p>
                </div>

                <div className="bg-[#F8F6EF] rounded-2xl p-6 border border-[#E9E4D4] flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-lg">★</span>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-emerald-950">Customer Satisfaction Guarantee</span>
                    </div>
                    <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                      Mqulima adheres to strict KEPHIS and PCPB verification for all inputs sold. We invite verified customers to review their experience on our official Google Business Profile.
                    </p>
                  </div>

                  <a
                    href={profile.googleReviewUrl || profile.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#245B35] hover:bg-[#1C492A] text-white text-xs sm:text-sm font-bold shrink-0 shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Review Mqulima on Google
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  <div className="p-4 rounded-xl border border-gray-150 bg-white">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-sm text-[#0A1E0C]">Zero-Counterfeit Rule</h4>
                    <p className="text-xs text-gray-500 mt-1">Direct partnership with registered primary manufacturers only.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-150 bg-white">
                    <Truck className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-sm text-[#0A1E0C]">Eldoret Regional Dispatch</h4>
                    <p className="text-xs text-gray-500 mt-1">Prompt packaging and courier tracking with SMS confirmation.</p>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-150 bg-white">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="font-bold text-sm text-[#0A1E0C]">Verified Field Officers</h4>
                    <p className="text-xs text-gray-500 mt-1">All consulting agronomists are vetted with official credentials.</p>
                  </div>
                </div>
              </section>

              {/* SECTION: FREQUENTLY ASKED QUESTIONS */}
              <section id="faqs" className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 text-left space-y-6">
                <div className="border-b border-emerald-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0A1E0C]">Frequently Asked Questions</h2>
                  <p className="text-xs text-gray-500">Official answers regarding our location, services, and policies</p>
                </div>

                <div className="space-y-3">
                  {profile.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-emerald-100 overflow-hidden transition-all duration-200"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-emerald-50/50 cursor-pointer"
                        >
                          <span className="font-bold text-sm sm:text-base text-[#0A1E0C] pr-4">{faq.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 text-emerald-700 shrink-0 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="p-5 pt-0 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-emerald-50 bg-emerald-50/20">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SECTION: BUSINESS POLICIES */}
              <section id="policies" className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 text-left space-y-6">
                <div className="border-b border-emerald-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0A1E0C]">Official Business Policies</h2>
                  <p className="text-xs text-gray-500">Transparent guidelines governing orders, dispatches, and warranties</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E9E4D4] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Truck className="w-4 h-4" />
                      Delivery & Fulfillment
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{profile.businessPolicies.delivery}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E9E4D4] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CreditCard className="w-4 h-4" />
                      Payment Methods
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{profile.businessPolicies.payments}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E9E4D4] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <RotateCcw className="w-4 h-4" />
                      Returns & Refunds
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{profile.businessPolicies.returns}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E9E4D4] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Award className="w-4 h-4" />
                      Quality & Warranty
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{profile.businessPolicies.warranty}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* ───────────────────────────────────────────────────────────
                RIGHT COLUMN: CONTACT DETAILS, OPERATING HOURS, MAP & SOCIAL
               ─────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-4 space-y-8 sticky top-28">
              {/* OPERATING HOURS CARD */}
              <div id="hours" className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-sm text-left space-y-5">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold font-serif text-lg text-[#0A1E0C]">Operating Hours</h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      openStatus.isOpen ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {openStatus.statusLabel}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  {profile.operatingHours.map((h: OperatingHourDay, i: number) => {
                    const isToday = h.day.toLowerCase() === openStatus.currentDayName.toLowerCase();
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors ${
                          isToday ? "bg-emerald-50/80 font-bold text-emerald-950 border border-emerald-200" : "text-gray-600"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                          {h.day}
                        </span>
                        <span>
                          {h.closed ? (
                            <span className="text-gray-400 font-medium">Closed</span>
                          ) : (
                            `${format12Hour(h.open)} – ${format12Hour(h.close)}`
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-100">
                  Times displayed in East Africa Time (EAT, UTC+3)
                </p>
              </div>

              {/* CONTACT DETAILS & LOCATION CARD */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-emerald-100 shadow-sm text-left space-y-5">
                <h3 className="font-bold font-serif text-lg text-[#0A1E0C] border-b border-emerald-100 pb-3.5">
                  Contact & Location
                </h3>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Headquarters</h4>
                      <p className="font-bold text-[#0A1E0C] leading-snug">{profile.addressStreet}</p>
                      <p className="text-gray-500 text-xs">
                        {profile.addressCity}, {profile.addressCounty}, Kenya
                      </p>
                      <a
                        href={profile.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline mt-1"
                      >
                        Get Directions on Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Direct Telephone</h4>
                      <a
                        href={`tel:${profile.phonePrimary.replace(/\s+/g, "")}`}
                        className="font-bold text-[#0A1E0C] hover:text-emerald-700 block transition-colors"
                      >
                        {profile.phonePrimary}
                      </a>
                      {profile.phoneSecondary && (
                        <a
                          href={`tel:${profile.phoneSecondary.replace(/\s+/g, "")}`}
                          className="text-gray-500 hover:text-emerald-700 block text-xs mt-0.5"
                        >
                          {profile.phoneSecondary} (Secondary)
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Official Email</h4>
                      <a
                        href={`mailto:${profile.emailPrimary}`}
                        className="font-bold text-[#0A1E0C] hover:text-emerald-700 block transition-colors break-all"
                      >
                        {profile.emailPrimary}
                      </a>
                      <a
                        href={`mailto:${profile.emailSupport}`}
                        className="text-gray-500 hover:text-emerald-700 block text-xs mt-0.5 break-all"
                      >
                        {profile.emailSupport} (Support)
                      </a>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 mt-0.5">
                      <WhatsAppIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Instant Messaging</h4>
                      <a
                        href={`https://wa.me/${profile.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#25D366] hover:underline block"
                      >
                        Chat with Mqulima Support
                      </a>
                      <p className="text-[11px] text-gray-400">Typical response under 15 minutes</p>
                    </div>
                  </div>
                </div>

                {/* Social Profiles */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                    Official Social Profiles
                  </h4>
                  <div className="flex items-center gap-2">
                    {profile.socialLinks?.twitter && (
                      <a
                        href={profile.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center hover:opacity-85 transition-opacity"
                        title="Mqulima on X"
                      >
                        <span className="text-xs font-black">X</span>
                      </a>
                    )}
                    {profile.socialLinks?.tiktok && (
                      <a
                        href={profile.socialLinks.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-[#010101] text-white flex items-center justify-center hover:opacity-85 transition-opacity"
                        title="Mqulima on TikTok"
                      >
                        <span className="text-xs font-black">TT</span>
                      </a>
                    )}
                    {profile.socialLinks?.linkedin && (
                      <a
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-[#0077B5] text-white flex items-center justify-center hover:opacity-85 transition-opacity"
                        title="Mqulima on LinkedIn"
                      >
                        <span className="text-xs font-black">in</span>
                      </a>
                    )}
                    {profile.socialLinks?.instagram && (
                      <a
                        href={profile.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center hover:opacity-85 transition-opacity"
                        title="Mqulima on Instagram"
                      >
                        <span className="text-xs font-black">IG</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* MINI MAP CARD */}
              <div className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-sm overflow-hidden text-left">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-3 border border-gray-150">
                  <iframe
                    title="Mqulima Location Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.6586392094244!2d35.2698!3d0.5143!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMzAnNTEuNSJOIDM1wrAxNicxMS4zIkU!5e0!3m2!1sen!2ske!4v1620000000000!5m2!1sen!2ske"
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h4 className="text-xs font-bold text-[#0A1E0C]">Eldoret Depot</h4>
                    <p className="text-[11px] text-gray-500">Junction, Eldoret–Iten Highway</p>
                  </div>
                  <a
                    href={profile.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    Open Map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            LIGHTBOX MODAL FOR GENUINE PHOTOS
           ========================================================================= */}
        {lightboxIndex !== null && filteredGallery[lightboxIndex] && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Photo Preview Lightbox"
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredGallery.length - 1))
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
              aria-label="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null && prev < filteredGallery.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
              aria-label="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
              <img
                src={filteredGallery[lightboxIndex].src}
                alt={filteredGallery[lightboxIndex].caption}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              />
              <p className="mt-4 text-sm font-medium text-white/90 text-center">
                {filteredGallery[lightboxIndex].caption} ({lightboxIndex + 1} of {filteredGallery.length})
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
