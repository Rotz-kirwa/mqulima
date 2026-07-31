import { createFileRoute } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createServiceBooking, getServiceCategoriesWithServices } from "@/lib/api/services.server";
import { 
  Check, 
  ArrowRight, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Star, 
  MessageSquare, 
  AlertTriangle,  
  Sliders, 
  Droplet, 
  Activity, 
  Truck, 
  FileText, 
  Coins,
  Sprout,
  Database,
  User,
  Wrench,
  MapPin,
  Heart,
  Search,
  Sparkles,
  Filter,
  RotateCcw,
  Compass,
  ArrowUpRight,
  Sun,
  Layers,
  Factory,
  Stethoscope,
  Tractor,
  Wheat,
  X,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

type ServicesSearch = {
  serviceId?: string;
  category?: string;
};

export const Route = createFileRoute("/services")({
  validateSearch: (search: Record<string, unknown>): ServicesSearch => {
    return {
      serviceId: (search.serviceId as string) || undefined,
      category: (search.category as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Mqulima Services — Everything Your Farm Needs, In One Place" },
      {
        name: "description",
        content: "Explore specialist agricultural categories delivered by vetted professionals across Kenya: soil testing, veterinary diagnostics, silage shredding, AI breeding, greenhouses, and borehole installations.",
      },
    ],
  }),
  component: ServicesPage,
});

const SERVICES_HERO_STATS = [
  { icon: User, value: "2,400+", label: "Farmers served" },
  { icon: Sprout, value: "30+", label: "Specialist services" },
  { icon: MapPin, value: "47", label: "Counties covered" },
  { icon: Phone, value: "< 10 mins", label: "Average response" },
];

// Category definition matching screenshot taxonomy
interface ServiceCategoryConfig {
  id: string;
  title: string;
  servicesCountText: string;
  count: number;
  description: string;
  image: string;
  icon: React.ComponentType<any>;
  checklist: string[];
  hasBookingButton?: boolean;
  bookingButtonText?: string;
  subservices: Array<{
    id: string;
    name: string;
    description: string;
    estimatedCost: string;
    image: string;
  }>;
}

const CATEGORIES_CONFIG: ServiceCategoryConfig[] = [
  {
    id: "soil",
    title: "Soil Services",
    servicesCountText: "3 services",
    count: 3,
    description: "Improve soil productivity through testing, treatment and professional fertilizer recommendations.",
    image: "/images/services/soil.png",
    icon: Sprout,
    checklist: [
      "Soil Testing & Analysis",
      "Soil Treatment",
      "Fertilizer Recommendation"
    ],
    subservices: [
      {
        id: "soil_testing_analysis",
        name: "Soil Testing & Analysis",
        description: "Full spectrum NPK, pH, organic carbon & EC laboratory report with customized agronomy recommendations.",
        estimatedCost: "KES 2,500 / sample",
        image: "https://i.pinimg.com/1200x/48/12/12/4812125dd6f1e95e1ac21acdee79498a.jpg"
      },
      {
        id: "soil_treatment",
        name: "Soil Treatment & Conditioning",
        description: "Agricultural lime application, soil reclamation, microbial inoculants and acidity balancing.",
        estimatedCost: "KES 4,000 / acre",
        image: "https://images.unsplash.com/photo-1693385998902-656569d40b88?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fHw%3D"
      },
      {
        id: "fertilizer_recommendation",
        name: "Fertilizer Recommendation & Plan",
        description: "Crop-specific fertilizer blending guides tailored to soil test findings and target yield goals.",
        estimatedCost: "KES 1,500 / farm plan",
        image: "https://i.pinimg.com/1200x/74/0d/a6/740da633e89e8be82af6afff9bec4ac0.jpg"
      }
    ]
  },
  {
    id: "veterinary",
    title: "Veterinary & Animal Health",
    servicesCountText: "4 services",
    count: 4,
    description: "Professional veterinary care, breeding services, vaccinations and livestock diagnosis.",
    image: "/images/services/veterinary.png",
    icon: Stethoscope,
    checklist: [
      "AI & Breeding",
      "Vaccination",
      "Veterinary Diagnosis",
      "Professional Vet Services"
    ],
    hasBookingButton: true,
    bookingButtonText: "Book Vet",
    subservices: [
      {
        id: "ai_breeding",
        name: "AI & Artificial Breeding",
        description: "High-pedigree bull semen straw insemination, heat synchronization & genetic improvement.",
        estimatedCost: "KES 3,000 / straw",
        image: "https://i.pinimg.com/736x/20/3c/22/203c222335557e8e22e6b6bcb323e252.jpg"
      },
      {
        id: "livestock_vaccination",
        name: "Livestock Vaccination",
        description: "FMD, Anthrax, ECF, CCPP & Newcastle routine immunization and herd health management.",
        estimatedCost: "KES 500 / head",
        image: "https://plus.unsplash.com/premium_photo-1661883044790-9c4342a4639c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8TGl2ZXN0b2NrJTIwVmFjY2luYXRpb258ZW58MHx8MHx8fDA%3D"
      },
      {
        id: "veterinary_diagnosis",
        name: "Veterinary Diagnosis & On-Farm Emergency",
        description: "Rapid clinical exam, disease diagnosis, surgical interventions & prescription therapy.",
        estimatedCost: "KES 2,000 / visit",
        image: "https://i.pinimg.com/1200x/8a/a8/17/8aa8174542e4c4decea9b3c7700e74c8.jpg"
      },
      {
        id: "professional_vet_services",
        name: "Professional Vet Services & Herd Audit",
        description: "Comprehensive farm herd health audits, mastitis testing, deworming schedules & reproductive health.",
        estimatedCost: "KES 5,000 / audit",
        image: "https://images.unsplash.com/photo-1527153857715-3908f2ae5da8?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "animal_feeds",
    title: "Animal Feeds",
    servicesCountText: "6 services",
    count: 6,
    description: "Feed formulation, silage production, incubation and livestock nutrition.",
    image: "/images/services/animal_feeds.png",
    icon: Wheat,
    checklist: [
      "Feed Formulation",
      "Feed Advice",
      "Silage",
      "Azolla",
      "Machinery Rental",
      "Incubation"
    ],
    subservices: [
      {
        id: "feed_formulation",
        name: "Feed Formulation & Ration Blending",
        description: "Pearson square least-cost feed formulation for dairy cows, broilers, layers & pigs.",
        estimatedCost: "KES 2,500 / ration plan",
        image: "/images/services/feed_formulation.png"
      },
      {
        id: "feed_advice",
        name: "Livestock Nutrition & Feed Advice",
        description: "Dietary optimization to increase milk yield per cow per day and improve feed conversion ratio.",
        estimatedCost: "KES 1,500 / consultation",
        image: "/images/services/feed_advice.png"
      },
      {
        id: "silage_shredding_packing",
        name: "Silage Shredding & Packing",
        description: "Mobile heavy-duty tractor chopper service with molasses inoculant application and bale wrapping.",
        estimatedCost: "KES 3,500 / ton",
        image: "/images/services/silage.png"
      },
      {
        id: "azolla_farming",
        name: "Azolla Protein Cultivation Setup",
        description: "High-protein aquatic fern pond setup, seed inoculant supply and harvesting training for poultry & dairy.",
        estimatedCost: "KES 5,000 / pond unit",
        image: "/images/services/azolla.png"
      },
      {
        id: "feed_machinery_rental",
        name: "Feed Chopper & Mill Machinery Rental",
        description: "Rental of diesel multi-purpose hammer mills, chaff cutters and feed mixers.",
        estimatedCost: "KES 3,000 / day",
        image: "/images/services/machinery_rental.png"
      },
      {
        id: "egg_incubation",
        name: "Egg Incubation & Hatchery Service",
        description: "Automated climate-controlled egg hatching service for Kienyeji, Quails and Turkeys.",
        estimatedCost: "KES 30 / egg batch",
        image: "/images/services/incubation.png"
      }
    ]
  },
  {
    id: "crop_production",
    title: "Crop Production",
    servicesCountText: "8 services",
    count: 8,
    description: "Complete crop production services from land preparation to harvesting.",
    image: "/images/services/crop_production.png",
    icon: Tractor,
    checklist: [
      "Greenhouse",
      "Partnerships",
      "Machinery Rental",
      "Cold Storage",
      "Transportation",
      "Lease Land",
      "Irrigation",
      "Agronomy Consultation"
    ],
    hasBookingButton: true,
    bookingButtonText: "Book Service",
    subservices: [
      {
        id: "greenhouse_installation",
        name: "Greenhouse Installation & Tunnel Setup",
        description: "Galvanized steel metallic or wooden greenhouse construction with UV-treated covers and drip systems.",
        estimatedCost: "KES 180,000 / unit (8x15m)",
        image: "https://i.pinimg.com/1200x/88/aa/65/88aa65f6e8435f9addf612deae8ac0d2.jpg"
      },
      {
        id: "farming_partnerships",
        name: "Farm Contract Partnerships",
        description: "Joint venture commercial farming models connecting land owners with equity investor agronomists.",
        estimatedCost: "Quote basis",
        image: "/images/services/partnerships.jpg"
      },
      {
        id: "rent_machinery_soil",
        name: "Tractor & Machinery Rental",
        description: "Ploughing, harrowing, rotavating, ridge making, combined harvesting and boom spraying equipment.",
        estimatedCost: "KES 3,000 / acre",
        image: "https://i.pinimg.com/1200x/3b/e6/a6/3be6a688e5395fd04bee73b103690b3b.jpg"
      },
      {
        id: "cold_storage_hubs",
        name: "Solar Cold Storage Hubs",
        description: "On-farm walk-in cold rooms for horticultural produce preservation post-harvest.",
        estimatedCost: "KES 50 / crate / day",
        image: "https://i.pinimg.com/1200x/a2/c7/53/a2c75333acd271ec1ddaa2ee9e5c56ab.jpg"
      },
      {
        id: "crop_transportation",
        name: "Produce Transportation Logistics",
        description: "Refrigerated and open lorry transport from farm gate directly to urban wholesale markets.",
        estimatedCost: "KES 8,000 / trip",
        image: "https://i.pinimg.com/1200x/d7/9e/ab/d79eab383df654feb5aedb0fe108d3e7.jpg"
      },
      {
        id: "lease_farm_land",
        name: "Agricultural Land Leasing",
        description: "Vetted fertile arable land parcels available for seasonal or long-term lease with water access.",
        estimatedCost: "KES 15,000 / acre / year",
        image: "https://i.pinimg.com/1200x/df/af/b9/dfafb970a524d98c252bfb2a1c85d84c.jpg"
      },
      {
        id: "drip_irrigation_services",
        name: "Drip & Overhead Irrigation Systems",
        description: "Button drippers, pressure compensated drip lines, filter kits and automatic fertigation injectors.",
        estimatedCost: "KES 65,000 / acre",
        image: "https://i.pinimg.com/1200x/de/53/87/de538732285bfdc37795743685118b36.jpg"
      },
      {
        id: "consult_expert_agronomy",
        name: "Agronomy Consultation & Spray Programs",
        description: "Routine field scouting visits, pest/disease diagnostic reports and tailor-made spray schedules.",
        estimatedCost: "KES 3,500 / visit",
        image: "https://i.pinimg.com/1200x/91/9b/90/919b90e49bc35c6863ca1b8ccdf49bbe.jpg"
      }
    ]
  },
  {
    id: "value_addition",
    title: "Value Addition",
    servicesCountText: "4 services",
    count: 4,
    description: "Increase the value of your agricultural produce through processing and expert guidance.",
    image: "/images/services/value_addition.png",
    icon: Factory,
    checklist: [
      "Processing",
      "Packaging",
      "Branding",
      "Expert Advice"
    ],
    subservices: [
      {
        id: "agro_processing",
        name: "Agro-Processing & Milling Services",
        description: "Maize flour fortification, oil seed pressing, honey refining, fruit pulping and solar dehydration.",
        estimatedCost: "KES 5 / kg processed",
        image: "https://media.istockphoto.com/id/1337512337/photo/modern-granary-elevator-and-seed-cleaning-line.jpg?s=612x612&w=0&k=20&c=XObN1SdB23tVQJVzyreZMP65GANtynoyki8wos1iUfY="
      },
      {
        id: "produce_packaging",
        name: "Food-Grade Packaging & Pouching",
        description: "Vacuum sealing, nitrogen flushing, barcoded stand-up pouches and biodegradable produce punnets.",
        estimatedCost: "KES 15 / package unit",
        image: "https://i.pinimg.com/736x/13/f1/c6/13f1c6ac50b970963952aa6c44d78d5b.jpg"
      },
      {
        id: "branding_kebs_certification",
        name: "KEBS Certification & Brand Design",
        description: "Standardization mark application support, nutritional table testing, logo & packaging design.",
        estimatedCost: "KES 25,000 / product line",
        image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "value_addition_expert_advice",
        name: "Value Addition Expert Advisory",
        description: "Commercial feasibility studies, recipe formulation, shelf-life extension & export compliance.",
        estimatedCost: "KES 5,000 / session",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
      }
    ]
  },
  {
    id: "other_services",
    title: "Other Services",
    servicesCountText: "7 services",
    count: 7,
    description: "Additional agricultural services to support profitable farming.",
    image: "/images/services/other_services.png",
    icon: Sun,
    checklist: [
      "Boreholes",
      "Irrigation Systems",
      "Shed Construction",
      "Agricultural Insurance",
      "Agricultural Finance",
      "Climate Smart Agriculture",
      "Farm Record Keeping"
    ],
    subservices: [
      {
        id: "borehole_drilling",
        name: "Borehole Drilling & Hydro-Geological Survey",
        description: "Professional underground water surveys, rotary drilling, steel casing installation and pump testing.",
        estimatedCost: "KES 6,500 / meter",
        image: "https://i.pinimg.com/736x/3b/22/64/3b2264ca23820c25831c917f99c24f25.jpg"
      },
      {
        id: "irrigation_systems_other",
        name: "Smart Solar Pumping Systems",
        description: "Submersible solar pump sizing, solar panel array installation and automatic tank level controls.",
        estimatedCost: "KES 120,000 / kit",
        image: "https://i.pinimg.com/736x/12/d7/19/12d719413f68bf7b49af1b2caebf2d33.jpg"
      },
      {
        id: "shed_construction",
        name: "Zero-Grazing & Poultry Shed Construction",
        description: "Biosecure farm structures, concrete calf pens, raised deep litter poultry houses and silage pits.",
        estimatedCost: "KES 95,000 / unit",
        image: "https://i.pinimg.com/1200x/db/6e/ba/db6eba6dc56b198e13976d209df48c09.jpg"
      },
      {
        id: "agri_insurance",
        name: "Multi-Peril Crop & Livestock Insurance",
        description: "Satellite-indexed drought, flood, pest attack and livestock mortality insurance coverage.",
        estimatedCost: "3.5% of crop value",
        image: "/images/services/agri_insurance.jpg"
      },
      {
        id: "agri_finance",
        name: "Agri-Asset Finance & Working Capital",
        description: "Low-interest agricultural loan facilitation for greenhouse, solar pump & livestock purchasing.",
        estimatedCost: "Tailored options",
        image: "https://i.pinimg.com/1200x/bf/25/9a/bf259add2a1ed5f825e2e9ba0862e631.jpg"
      },
      {
        id: "climate_smart_agri",
        name: "Climate Smart Agriculture & Conservation",
        description: "Zero-tillage planting, agro-forestry, rainwater harvesting dams and carbon credit enrollment.",
        estimatedCost: "KES 4,000 / acre",
        image: "https://i.pinimg.com/1200x/e7/8b/16/e78b16a40e62dfc38235c4c7018bb1cf.jpg"
      },
      {
        id: "farm_record_keeping",
        name: "Farm Record Keeping & Digital Audits",
        description: "Implementation of computerized farm accounting, inventory management and milk yield ledgers.",
        estimatedCost: "KES 2,000 / month",
        image: "https://i.pinimg.com/736x/11/bf/6d/11bf6d9c54bf11ed612ac9acdae37239.jpg"
      }
    ]
  }
];

const KENYA_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo",
  "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui",
  "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori",
  "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana",
  "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
];

function ServicesPage() {
  const { user } = useAuth();
  const search = Route.useSearch();

  // Active Category View Drawer Modal State
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryConfig | null>(null);

  // Booking Wizard Modal State
  const [selectedSubservice, setSelectedSubservice] = useState<{
    id: string;
    name: string;
    description: string;
    estimatedCost: string;
    categoryTitle: string;
  } | null>(null);

  const [bookingStep, setBookingStep] = useState(1);
  const [farmerName, setFarmerName] = useState(user?.name || "");
  const [phone, setPhone] = useState((user as any)?.phone || "");
  const [county, setCounty] = useState(user?.county || "Uasin Gishu");
  const [locationDetails, setLocationDetails] = useState("");
  const [farmScale, setFarmScale] = useState("2.5 Acres");
  const [bookingDate, setBookingDate] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);

  // Handle WhatsApp quotation link helper
  const openWhatsAppQuotation = (serviceName: string) => {
    const text = encodeURIComponent(
      `Jambo Mqulima Agri-Desk! 🌿\n\nI am requesting an official quotation & specialist dispatch for: *${serviceName}*.\n\n📍 *Platform Request*: Mqulima Services Core\n📋 *Inquiry*: Pricing breakdown, availability & field consultation.\n\nPlease link me with a verified extension specialist at your earliest convenience. Asante!`
    );
    window.open(`https://wa.me/254723346134?text=${text}`, "_blank");
  };

  // Sync route URL search query params
  useEffect(() => {
    if (search.category) {
      const matched = CATEGORIES_CONFIG.find(c => c.id === search.category);
      if (matched) setSelectedCategory(matched);
    }
  }, [search.category]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter a valid phone number for service dispatch.");
      return;
    }
    if (!user) {
      toast.error("Please log in to complete your booking.");
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      const costNumeric = selectedSubservice?.estimatedCost
        ? Number(selectedSubservice.estimatedCost.replace(/[^0-9]/g, "")) || 2500
        : 2500;

      const res = await createServiceBooking({
        data: {
          service_type: selectedSubservice?.id || "soil_testing_analysis",
          farmer_id: user.id,
          location: `${locationDetails || "Farm location"}, ${county}`,
          farm_size_acres: parseFloat(farmScale) || 1.0,
          scheduled_date: bookingDate || new Date().toISOString(),
          notes: specialNotes || `Requested for ${selectedSubservice?.name}`,
          amount: costNumeric,
          csrfToken: getCsrfTokenFromCookie(),
        }
      });

      if (res.success && res.reference) {
        setBookingReference(res.reference);
        setBookingStep(3); // Success step
        toast.success(`Service Booking Submitted! Ref: ${res.reference}`);
      } else {
        throw new Error("Failed to submit service booking");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err.message || "Could not complete booking request.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const closeBookingModal = () => {
    setSelectedSubservice(null);
    setBookingStep(1);
    setBookingReference(null);
    setLocationDetails("");
    setSpecialNotes("");
  };

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] text-[#1A261C] min-h-screen font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-[#85CC14] selection:text-white">
        
        {/* =========================================================================
            SECTION 1: HERO BANNER (Pixel-matched to Screenshot 4)
           ========================================================================= */}
        <section className="relative overflow-hidden bg-[#0F291E] text-white">
          {/* High-res panoramic agricultural background image with dark overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
              alt="Lush agricultural green fields"
              className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
            />
            {/* Subtle radial green glow gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B2117] via-[#0F291E]/90 to-[#123828]/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B2117] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 container-px mx-auto max-w-7xl pt-8 pb-10 md:pt-10 md:pb-12">
            <div className="max-w-3xl text-left">
              
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 border border-white/15 mb-3">
                <Sprout className="h-3.5 w-3.5 text-[#85CC14]" />
                <span>MQULIMA AGRICULTURAL SERVICES</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight font-['Outfit',sans-serif]">
                Professional{" "}
                <span className="text-[#D4E157] underline decoration-[#D4E157]/30 underline-offset-6">
                  Agricultural
                </span>{" "}
                Services
              </h1>

              {/* Subheading */}
              <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed font-normal max-w-2xl">
                Mqulima connects farmers with trusted agricultural professionals across Kenya — from soil testing and veterinary care to crop production, value addition and farm infrastructure. Book a service or request a quotation in minutes.
              </p>

              {/* Action Buttons Row */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    const el = document.getElementById("our-services-grid");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#85CC14] to-[#6FA810] text-[#0B2117] font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#85CC14]/20 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Book a Service</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </button>

                <button
                  onClick={() => openWhatsAppQuotation("General Agricultural Service")}
                  className="px-6 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs sm:text-sm hover:bg-white/25 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 text-[#25D366]" />
                  <span>Request a Quotation</span>
                </button>
              </div>

              {/* Trust Badges Checkmark Row */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-5 text-xs font-semibold text-white/90">
                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Vetted professionals</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Nationwide coverage</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="p-0.5 rounded-full bg-[#85CC14]/20 text-[#85CC14]">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>Transparent pricing</span>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Bar Ribbon at Bottom of Hero (Infinite Smooth Right-to-Left Marquee Carousel - matching Mqulima Tools) */}
          <div className="relative z-10 bg-[#EDF7E2] border-t border-b border-[#D8EBC4] py-3.5 overflow-hidden">
            <div className="flex w-max items-center gap-10 sm:gap-16 animate-marquee">
              {[...SERVICES_HERO_STATS, ...SERVICES_HERO_STATS, ...SERVICES_HERO_STATS, ...SERVICES_HERO_STATS].map((stat, idx) => (
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
            SECTION 2: OUR SERVICES GRID (Pixel-matched to Screenshots 1, 2, 3)
           ========================================================================= */}
        <section id="our-services-grid" className="py-16 md:py-24 bg-[#FAFBF9]">
          <div className="container-px mx-auto max-w-7xl">
            
            {/* Section Header */}
            <div className="text-left max-w-3xl mb-12">
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
              {CATEGORIES_CONFIG.map((cat) => {
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
                    <div className="p-6 pt-0 flex flex-wrap items-center gap-2.5">
                      
                      {/* Primary View Services Button */}
                      <button
                        onClick={() => setSelectedCategory(cat)}
                        className="flex-1 min-w-[120px] py-2.5 px-4 rounded-full bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs sm:text-sm transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-sm"
                      >
                        <span>View Services</span>
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      </button>

                      {/* Direct Booking Pill Button (Book Vet or Book Service) */}
                      <button
                        onClick={() => {
                          const sub = cat.subservices[0];
                          setSelectedSubservice({
                            id: sub.id,
                            name: sub.name,
                            description: sub.description,
                            estimatedCost: sub.estimatedCost,
                            categoryTitle: cat.title
                          });
                        }}
                        className="py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 border border-slate-200"
                      >
                        <Calendar className="h-4 w-4 text-slate-600" />
                        <span>{cat.bookingButtonText || "Book Service"}</span>
                      </button>

                      {/* WhatsApp Quote Button */}
                      <button
                        onClick={() => openWhatsAppQuotation(cat.title)}
                        className="w-full py-2.5 px-4 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs sm:text-sm transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm"
                      >
                        <WhatsAppIcon className="h-4.5 w-4.5 text-white" />
                        <span>WhatsApp Quote</span>
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </section>


        {/* =========================================================================
            MODAL 1: VIEW CATEGORY SERVICES DRAWER / OVERLAY
           ========================================================================= */}
        <AnimatePresence>
          {selectedCategory && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                className="bg-white w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="relative p-6 sm:p-8 bg-[#0F291E] text-white flex items-center justify-between shrink-0">
                  <div>
                    <span className="text-xs font-bold text-[#85CC14] uppercase tracking-wider block mb-1">
                      {selectedCategory.servicesCountText} AVAILABLE
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif]">
                      {selectedCategory.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Subservices List */}
                <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-left">
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {selectedCategory.description} Pick a specialized sub-service below to schedule a technician or request an instant cost quotation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedCategory.subservices.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#16A34A] transition-all duration-200 flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                            <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                            <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                              {sub.estimatedCost}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 leading-snug mb-1">
                            {sub.name}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {sub.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCategory(null);
                              setSelectedSubservice({
                                id: sub.id,
                                name: sub.name,
                                description: sub.description,
                                estimatedCost: sub.estimatedCost,
                                categoryTitle: selectedCategory.title
                              });
                            }}
                            className="flex-1 py-2 px-3 rounded-full bg-[#16A34A] text-white text-xs font-bold hover:bg-[#15803D] transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Book Now</span>
                          </button>

                          <button
                            onClick={() => openWhatsAppQuotation(sub.name)}
                            className="py-2 px-3 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                            <span>Quote</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>


        {/* =========================================================================
            MODAL 2: BOOKING WIZARD MODAL
           ========================================================================= */}
        <AnimatePresence>
          {selectedSubservice && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
              >
                {/* Header */}
                <div className="p-6 bg-[#0F291E] text-white flex items-center justify-between text-left">
                  <div>
                    <span className="text-xs font-bold text-[#85CC14] uppercase tracking-wider block">
                      BOOKING REQUEST
                    </span>
                    <h3 className="text-xl font-bold font-['Outfit',sans-serif]">
                      {selectedSubservice.name}
                    </h3>
                  </div>

                  <button
                    onClick={closeBookingModal}
                    className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 text-left">
                  {bookingStep === 1 && (
                    <form onSubmit={handleBookingSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Farmer / Contact Name
                        </label>
                        <input
                          type="text"
                          required
                          value={farmerName}
                          onChange={(e) => setFarmerName(e.target.value)}
                          placeholder="e.g. James Kariuki"
                          className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#16A34A] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 0712345678"
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#16A34A] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            County Location
                          </label>
                          <select
                            value={county}
                            onChange={(e) => setCounty(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#16A34A] focus:outline-none"
                          >
                            {KENYA_COUNTIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Farm Size / Project Scale
                          </label>
                          <input
                            type="text"
                            value={farmScale}
                            onChange={(e) => setFarmScale(e.target.value)}
                            placeholder="e.g. 3 Acres or 10 Cows"
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#16A34A] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Preferred Service Date
                          </label>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#16A34A] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Specific Requirements / Notes
                        </label>
                        <textarea
                          rows={3}
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          placeholder="Describe symptoms, crop type, or location landmarks..."
                          className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#16A34A] focus:outline-none"
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          Est. Base Cost: <strong className="text-[#16A34A]">{selectedSubservice.estimatedCost}</strong>
                        </span>

                        <button
                          type="submit"
                          disabled={isSubmittingBooking}
                          className="py-3 px-6 rounded-full bg-[#16A34A] text-white font-bold text-sm hover:bg-[#15803D] transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                        >
                          {isSubmittingBooking ? "Submitting..." : "Submit Service Booking"}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {bookingStep === 3 && (
                    <div className="text-center py-6 space-y-4">
                      <div className="h-16 w-16 bg-[#E5F5D0] text-[#16A34A] rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-8 w-8 stroke-[3]" />
                      </div>
                      <h4 className="text-2xl font-extrabold text-slate-900 font-['Outfit',sans-serif]">
                        Booking Confirmed!
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto">
                        Your request has been logged under reference code <strong className="text-[#16A34A]">{bookingReference}</strong>. An assigned regional agronomist will contact you shortly on <strong>{phone}</strong>.
                      </p>

                      <button
                        onClick={closeBookingModal}
                        className="py-3 px-8 rounded-full bg-[#0F291E] text-white font-bold text-sm hover:bg-[#1A380A] transition cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>


        {/* =========================================================================
            FLOATING WHATSAPP BUTTON (Bottom Right - Matching Screenshot Widget)
           ========================================================================= */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => openWhatsAppQuotation("General Inquiry")}
            className="flex items-center gap-2.5 py-3 px-5 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-extrabold text-sm shadow-xl shadow-[#25D366]/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <WhatsAppIcon className="h-5 w-5 text-white" />
            <span>Chat with us</span>
          </button>
        </div>

      </div>
    </AppLayout>
  );
}
