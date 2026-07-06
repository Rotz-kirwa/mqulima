import { createFileRoute } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createServiceBooking } from "@/lib/api/services.server";
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
  Download, 
  Activity, 
  Truck, 
  FileText, 
  ShieldAlert, 
  Coins,
  Sprout,
  Database
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";

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
      { title: "Mqulima Services — Professional On-Farm Advisory" },
      {
        name: "description",
        content: "Book vetted agricultural experts: soil testing, veterinary diagnostics, silage shredding, AI breeding, greenhouses, and borehole installations.",
      },
    ],
  }),
  component: ServicesPage,
});

function generateReference() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MQ-${suffix}`;
}

// Full Service Category and Sub-Service Data Mapping
type SubService = {
  id: string;
  name: string;
  description: string;
  estimatedCost: string;
};

type ServiceCategory = {
  id: string;
  name: string;
  broaderDescription: string;
  image: string;
  subservices: SubService[];
};

const serviceCategories: ServiceCategory[] = [
  {
    id: "soil",
    name: "Soil Services",
    broaderDescription: "Comprehensive agricultural soil testing, diagnostic chemical analysis, corrective soil treatment schedules, and site-specific fertilizer recommendations to optimize crop yields and soil fertility.",
    image: "/services_soil_analysis.png",
    subservices: [
      {
        id: "soil_test",
        name: "Soil testing & analysis",
        description: "Accurate physical and chemical soil sampling to measure pH levels, nitrogen, phosphorus, potassium, organic carbon, and trace mineral distribution.",
        estimatedCost: "KES 2,500 per Sample"
      },
      {
        id: "soil_treatment",
        name: "Soil treatment",
        description: "Corrective application schedules for agricultural lime, gypsum, and soil conditioners to fix soil acidity, sodicity, and compact structures.",
        estimatedCost: "KES 5,000 per Acre"
      },
      {
        id: "fertilizer_rec",
        name: "Fertilizer recommendation",
        description: "Tailored prescription regimens recommending specific NPK ratios, foliar feeds, and micro-nutrients custom-mapped to your crop cycles.",
        estimatedCost: "KES 1,500 per Report"
      }
    ]
  },
  {
    id: "vet",
    name: "Veterinary & Animal Health",
    broaderDescription: "On-farm veterinary diagnosis, clinical animal health, expert artificial insemination (AI) breeding programs, vaccine schedules, and professional emergency veterinary treatments.",
    image: "/services_veterinary_care.png",
    subservices: [
      {
        id: "ai_breeding",
        name: "AI & Breeding",
        description: "High-conception artificial insemination using premium dairy and beef semen, heat synchronization, and genetic lineage advisory.",
        estimatedCost: "KES 3,000 per Cow"
      },
      {
        id: "vaccination",
        name: "Vaccination",
        description: "Preventative immunization programs protecting livestock herds against foot-and-mouth, anthrax, lumpy skin, and Newcastle disease.",
        estimatedCost: "KES 150 per Head"
      },
      {
        id: "vet_diagnosis",
        name: "Veterinary diagnosis",
        description: "Professional on-farm clinical diagnosis, pathology checks, and prescription management for acute and chronic herd sicknesses.",
        estimatedCost: "KES 2,000 per Visit"
      },
      {
        id: "professional_vets",
        name: "Professional vet services",
        description: "Minor surgical operations, calving assistance, mastitis control, and preventative veterinary herd health advisory.",
        estimatedCost: "KES 3,500 per Procedure"
      }
    ]
  },
  {
    id: "feeds",
    name: "Animal Feeds & Livestock Solutions",
    broaderDescription: "Maximize livestock productivity with science-backed nutrition, modern feeding technologies, silage preservation, hatchery services, and precision farm machinery. Our solutions help dairy, poultry, beef, and mixed farmers reduce production costs, improve animal health, and increase profitability.",
    image: "https://i.pinimg.com/1200x/f4/77/45/f47745a90185d04f09cba6f954261c63.jpg",
    subservices: [
      {
        id: "feed_formulation",
        name: "Custom Feed Formulation",
        description: "Develop nutritionally balanced feed rations tailored to your livestock using locally available ingredients. Our experts formulate cost-effective diets that support faster growth, higher milk production, improved feed conversion, and healthier animals.",
        estimatedCost: "KES 1,800 per Formulation"
      },
      {
        id: "silage_shredding",
        name: "Silage Production & Preservation",
        description: "Convert fresh fodder into high-quality silage using professional chopping, mixing, and airtight packing techniques that preserve nutrients, minimize spoilage, and ensure reliable feed throughout the year.",
        estimatedCost: "KES 8,000 per Ton"
      },
      {
        id: "azolla",
        name: "Azolla Production Systems",
        description: "Establish sustainable Azolla cultivation units to produce natural, protein-rich livestock feed that lowers feeding costs while enhancing dairy, poultry, fish, and pig performance.",
        estimatedCost: "KES 4,000 per Pond Setup"
      },
      {
        id: "machinery_buy_rent",
        name: "Machinery Hire",
        description: "Access reliable tractors, forage harvesters, silage choppers, shredders, and skilled operators for efficient land preparation, fodder processing, harvesting, and other essential farm operations.",
        estimatedCost: "KES 6,000 per Day"
      },
      {
        id: "incubation",
        name: "Egg Incubation Services",
        description: "Increase hatch success with professionally managed incubation systems that deliver healthy, high-quality day-old chicks through optimized temperature, humidity, and hatchery management.",
        estimatedCost: "KES 20 per Egg"
      },
      {
        id: "ask_expert_feeds",
        name: "Livestock Advisory",
        description: "Receive personalized guidance from experienced livestock specialists on feeding strategies, disease prevention, breeding management, pasture improvement, and productivity optimization to maximize your farm's performance.",
        estimatedCost: "KES 1,500 per Consultation"
      }
    ]
  },
  {
    id: "crops",
    name: "Crop Production & Logistics",
    broaderDescription: "Commercial greenhouse setup, machinery leasing, solar-powered cold storage, regional farm logistics, land leasing, drip irrigation installations, and expert agronomy consulting.",
    image: "/services_crop_production.png",
    subservices: [
      {
        id: "greenhouse",
        name: "Greenhouse services",
        description: "Turnkey greenhouse steel construction, polythene cladding replacement, misting systems, and soil sterilization setups.",
        estimatedCost: "KES 120,000 Setup"
      },
      {
        id: "partnerships",
        name: "Partnerships",
        description: "Cooperative outgrower agreements linking growers to certified seeds, agro-chemicals, and export market aggregators.",
        estimatedCost: "Free Consultation"
      },
      {
        id: "rent_machinery_crop",
        name: "Rent machinery",
        description: "Tractors, disc plows, rotavators, and precision seeders available with fuel and certified operators.",
        estimatedCost: "KES 5,500 per Acre"
      },
      {
        id: "cold_storage",
        name: "Cold storage",
        description: "Solar-hybrid cold hubs and crates leasing to extend post-harvest shelf-life for leafy greens, tomatoes, and export herbs.",
        estimatedCost: "KES 100 per Crate/week"
      },
      {
        id: "transport",
        name: "Transportation",
        description: "Temperature-controlled logistics trucks delivering crop harvests from farm gates to urban wholesale centers.",
        estimatedCost: "KES 80 per Kilometre"
      },
      {
        id: "lease_land",
        name: "Lease land",
        description: "Access vetted agricultural land with long-term leases, water access, and soil health profiles ready for crop production.",
        estimatedCost: "KES 15,000 per Acre/year"
      },
      {
        id: "irrigation_setup",
        name: "Irrigation services",
        description: "Custom design, piping, filtration, and installation of gravity-fed drip and sprinkler irrigation networks.",
        estimatedCost: "KES 40,000 per Acre"
      },
      {
        id: "agronomy_expert",
        name: "Consult an Expert/Agronomy services",
        description: "On-site agronomist visits for crop health checkups, scouting schedules, and export quality controls.",
        estimatedCost: "KES 2,000 per Visit"
      }
    ]
  },
  {
    id: "value",
    name: "Value Addition & Agro-Processing",
    broaderDescription: "Transform raw harvests into premium, market-ready products that command higher prices. We design and implement complete value-addition systems—from cleaning, grading, drying, milling, packaging, and branding to processing workflows that help farmers, cooperatives, and agribusinesses maximize profitability while reducing post-harvest losses.",
    image: "/services_value_addition.png",
    subservices: [
      {
        id: "ask_expert_value",
        name: "Talk to a Processing Expert",
        description: "Receive tailored guidance on selecting the right processing equipment, optimizing production, improving product quality, and creating a premium brand that attracts larger buyers and stronger profit margins.",
        estimatedCost: "KES 3,000 per Consult"
      }
    ]
  },
  {
    id: "other",
    name: "Infrastructure & Smart Farming",
    broaderDescription: "Borehole drilling, advanced solar irrigation networks, livestock shed design, agriculture insurance, finance credit vouchers, climate-smart farming, and digital record keeping.",
    image: "https://i.pinimg.com/736x/95/bb/1b/95bb1ba4bc02563f8274bdd5a9ff6e77.jpg",
    subservices: [
      {
        id: "borehole",
        name: "Borehole services",
        description: "Geological water surveys, professional borehole drilling, test pumping, and solar water pump installations.",
        estimatedCost: "KES 150,000 Initial deposit"
      },
      {
        id: "irrigation_sys",
        name: "Irrigation and irrigation systems",
        description: "Advanced sprinkler and overhead drip systems designed for commercial field setups.",
        estimatedCost: "KES 45,000 per Acre"
      },
      {
        id: "shed_construction",
        name: "Shed construction & advisory",
        description: "Architectural blueprints and timber/steel construction for zero-grazing cattle sheds and poultry multi-tier cages.",
        estimatedCost: "KES 75,000 Setup fee"
      },
      {
        id: "agri_insurance",
        name: "Agriculture Insurance",
        description: "Multi-peril crop and index-based livestock insurance packages buffering against drought and flood tragedies.",
        estimatedCost: "KES 2.5% of Crop value"
      },
      {
        id: "agri_finance",
        name: "Agriculture finance",
        description: "Input credit financing and asset leasing terms matching your crop harvesting calendars.",
        estimatedCost: "Free Evaluation"
      },
      {
        id: "climate_smart",
        name: "Climate Smart Agriculture",
        description: "Carbon credit registration, water conservation techniques, and drought-tolerant seed mappings.",
        estimatedCost: "Free Portal access"
      },
      {
        id: "records",
        name: "Keep your records",
        description: "Digital farm logging tools and accounting dashboards tracking input expenses, labor, and crop sales margins.",
        estimatedCost: "KES 450 per Month"
      }
    ]
  }
];

const CATEGORY_META: Record<string, { eyebrow: string; icon: React.ComponentType<any> }> = {
  soil: {
    eyebrow: "KNOW YOUR SOIL. GROW YOUR HARVEST.",
    icon: Sprout
  },
  vet: {
    eyebrow: "KEEP LIVESTOCK HEALTHY. OPTIMIZE PRODUCTION.",
    icon: ShieldCheck
  },
  feeds: {
    eyebrow: "FEED SMART. GROW STRONGER. EARN MORE.",
    icon: Activity
  },
  crops: {
    eyebrow: "GROW EFFICIENTLY. TRANSPORT SECURELY.",
    icon: Truck
  },
  value: {
    eyebrow: "TURN HARVESTS INTO HIGH-VALUE PRODUCTS",
    icon: Coins
  },
  other: {
    eyebrow: "DIGITIZE YOUR FARM. SECURE WATER ACCESS.",
    icon: Database
  }
};

const getCategoryFields = (catId?: string) => {
  switch (catId) {
    case "soil":
      return {
        scaleLabel: "Field Size to Test (Acres)",
        scalePlaceholder: "e.g. 2.5",
        scaleType: "number",
        activityLabel: "Target Crop Type",
        activityOptions: ["Cereals (Maize/Wheat)", "Horticulture/Vegetables", "Tubers (Potatoes)", "Cash Crops (Coffee/Tea)", "Fruits/Orchards"],
        subjectLabel: "Specific Crop Variety (to plant)",
        subjectPlaceholder: "e.g. H614 Maize, Shangi Potatoes",
        descriptionLabel: "Field History & Soil Challenge Details",
        descriptionPlaceholder: "Describe the history of this field: last crop planted, fertilizers previously used, crop discoloration, pest history, or known yield drops..."
      };
    case "vet":
      return {
        scaleLabel: "Number of Animals to Treat (Head Count)",
        scalePlaceholder: "e.g. 4",
        scaleType: "number",
        activityLabel: "Livestock Category",
        activityOptions: ["Dairy Cattle", "Beef Cattle", "Poultry (Layers/Broilers)", "Pigs", "Sheep/Goats", "Mixed Livestock"],
        subjectLabel: "Animal Breed / Age Spec",
        subjectPlaceholder: "e.g. Friesian cow, 3 months old broilers",
        descriptionLabel: "Symptoms & Clinical Challenge Details",
        descriptionPlaceholder: "Describe the animal's physical symptoms in detail: body temperature, feeding rate, milk yield drop, coughing, skin lesions, or calving difficulties..."
      };
    case "feeds":
      return {
        scaleLabel: "Feed Operation Scale / Target Quantity",
        scalePlaceholder: "e.g. 50 dairy cows, 3 tons silage, 1 Azolla unit",
        scaleType: "text",
        activityLabel: "Feeding Focus",
        activityOptions: ["Dairy Feeding", "Poultry Feeding", "Silage / Fodder conservation", "Azolla / Alternative feeds", "Mixed feeds"],
        subjectLabel: "Target Livestock / Machine Model",
        subjectPlaceholder: "e.g. Dairy cattle herd, silage shredder hired",
        descriptionLabel: "Feeding Challenge & Formulation Requirements",
        descriptionPlaceholder: "Describe your feeding challenges, available ingredients (e.g. maize germ, pollard), or target machinery capacity requirement..."
      };
    case "crops":
      return {
        scaleLabel: "Project Area Size (Acres)",
        scalePlaceholder: "e.g. 5",
        scaleType: "number",
        activityLabel: "Cultivation Setting",
        activityOptions: ["Open Field farming", "Greenhouse / Protected", "Irrigated farming", "Rainfed cereals", "Logistics & Transport"],
        subjectLabel: "Crop / System Specification",
        subjectPlaceholder: "e.g. Greenhouse tomatoes, Gravity Drip irrigation",
        descriptionLabel: "Cultivation, Logistics, or Irrigation Project Scope",
        descriptionPlaceholder: "Describe the crop type, greenhouse dimensions, logistics pick-up/drop-off points, or water source (dam, river, borehole) in detail..."
      };
    case "value":
      return {
        scaleLabel: "Processing Capacity / Volumetric Scale",
        scalePlaceholder: "e.g. 1000 kg maize daily, 200 liters milk",
        scaleType: "text",
        activityLabel: "Value Addition Category",
        activityOptions: ["Flour / Grain Milling", "Dairy Processing & Pasteurization", "Fruit drying & packaging", "Oil extraction", "General branding & packaging consultancy"],
        subjectLabel: "Primary Processing Equipment / Raw Material",
        subjectPlaceholder: "e.g. Posho mill, Milk pasteurizer, Maize grain",
        descriptionLabel: "Processing Setup & Business Goals",
        descriptionPlaceholder: "Describe your current raw material volumes, source of supply, packaging specs, hygiene standards, or branding expectations in detail..."
      };
    case "other":
    default:
      return {
        scaleLabel: "Project / Infrastructure Scale",
        scalePlaceholder: "e.g. 150m borehole depth, 3kW solar unit",
        scaleType: "text",
        activityLabel: "Infrastructure Project Focus",
        activityOptions: ["Borehole Drilling & Solar Pumps", "Solar Irrigation Networks", "Livestock sheds / barns construction", "Agricultural Insurance & Credit", "Smart farming apps & record keeping"],
        subjectLabel: "System Specification / Infrastructure Type",
        subjectPlaceholder: "e.g. Geological survey & drilling, Solar system",
        descriptionLabel: "Project Requirements & Technical Specifications",
        descriptionPlaceholder: "Describe the geological site conditions, power output requirements, insurance package desired, or smart system goals in detail..."
      };
  }
};

const kenyanCounties = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo/Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita/Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
  "Other"
];

function ServicesPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const [selectedCategoryId, setSelectedCategoryId] = useState("soil");
  
  // Booking Wizard states
  const [selectedSubservice, setSelectedSubservice] = useState<SubService | null>(null);
  const [step, setStep] = useState(1);
  const [doneRef, setDoneRef] = useState<string | null>(null);
  
  // Customer Booking inputs
  const [farmerName, setFarmerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [county, setCounty] = useState("Uasin Gishu");
  const [subCounty, setSubCounty] = useState("");
  const [gpsLocation, setGpsLocation] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [farmActivity, setFarmActivity] = useState<string[]>([]);
  const [otherActivitySpec, setOtherActivitySpec] = useState("");
  
  const [targetSubject, setTargetSubject] = useState("");
  const [vividDescription, setVividDescription] = useState("");
  
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  
  // M-Pesa Simulator states
  const [simStep, setSimStep] = useState<"idle" | "loading" | "prompt" | "success" | "failed" | "timeout">("idle");
  const [pinCode, setPinCode] = useState("");
  const [pollCountdown, setPollCountdown] = useState(120);
  const pollTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);



  const currentCategory = serviceCategories.find(cat => 
    cat.subservices.some(sub => sub.id === selectedSubservice?.id)
  );
  
  const fields = getCategoryFields(currentCategory?.id);

  // Sync url search parameters
  useEffect(() => {
    if (selectedSubservice) {
      const cat = serviceCategories.find(c => 
        c.subservices.some(sub => sub.id === selectedSubservice.id)
      );
      if (cat) {
        const catFields = getCategoryFields(cat.id);
        setFarmActivity([catFields.activityOptions[0]]);
        setOtherActivitySpec("");
      }
    }
  }, [selectedSubservice]);
  useEffect(() => {
    if (search.category) {
      const catExists = serviceCategories.some((cat) => cat.id === search.category);
      if (catExists) {
        // Safe check
      }
    }
    
    if (search.serviceId) {
      let targetCatId = "";
      let targetSubId = "";
      
      switch (search.serviceId) {
        case "vet":
          targetCatId = "vet";
          targetSubId = "vet_diagnosis";
          break;
        case "soil":
          targetCatId = "soil";
          targetSubId = "soil_test";
          break;
        case "silage":
          targetCatId = "feeds";
          targetSubId = "silage_shredding";
          break;
        case "ai":
          targetCatId = "vet";
          targetSubId = "ai_breeding";
          break;
        case "machinery":
          targetCatId = "feeds";
          targetSubId = "machinery_buy_rent";
          break;
        case "advisory":
          targetCatId = "crops";
          targetSubId = "agronomy_expert";
          break;
        default:
          if (serviceCategories.some((cat) => cat.id === search.serviceId)) {
            targetCatId = search.serviceId;
          }
          break;
      }
      
      if (targetCatId) {
        setSelectedCategoryId(targetCatId);
        if (targetSubId) {
          const category = serviceCategories.find((cat) => cat.id === targetCatId);
          const subservice = category?.subservices.find((sub) => sub.id === targetSubId);
          if (subservice) {
            setSelectedSubservice(subservice);
            setStep(1);
            setSimStep("idle");
            setDoneRef(null);
          }
        }
      }
    }
  }, [search.category, search.serviceId]);

  const activeCategory = useMemo(() => {
    return serviceCategories.find((cat) => cat.id === selectedCategoryId) ?? serviceCategories[0];
  }, [selectedCategoryId]);

  const startPaymentPolling = (orderId: string, reference: string) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    setPollCountdown(120);

    let secondsRemaining = 120;

    pollTimerRef.current = setInterval(async () => {
      secondsRemaining -= 3;
      setPollCountdown(secondsRemaining);

      if (secondsRemaining <= 0) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setSimStep("timeout");
        toast.error("Payment confirmation timed out. Please check your phone or try again.");
        return;
      }

      try {
        const { getPaymentStatus } = await import("@/lib/api/mpesa.server");
        const statusRes = await getPaymentStatus({ data: { orderId } });
        if (statusRes.status === "paid") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setSimStep("success");
          toast.success("Payment Received & Confirmed!");

          setTimeout(() => {
            toast.success("SMS Confirmation Sent", {
              description: `Message: Ref ${reference} booked for ${selectedSubservice?.name} is confirmed.`,
              duration: 8000,
            });
          }, 500);
        } else if (statusRes.status === "failed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setSimStep("failed");
          toast.error("M-Pesa payment failed or was cancelled.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  const handleMpesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(07|01|254)\d{8}$/.test(phone.trim())) {
      toast.error("Please enter a valid Kenyan phone number (e.g. 0712345678)");
      return;
    }
    if (!user) {
      toast.error("Please log in to complete your booking.");
      return;
    }
    setSimStep("loading");

    try {
      const amountNumeric = selectedSubservice?.estimatedCost
        ? Number(selectedSubservice.estimatedCost.replace(/[^0-9]/g, ""))
        : 1500;

      // 1. Create booking and get orderId
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      const res = await createServiceBooking({
        data: {
          service_type: selectedSubservice?.id || "soil_test",
          farmer_id: user.id,
          location: gpsLocation || subCounty || county,
          farm_size_acres: parseFloat(farmSize) || 1.0,
          scheduled_date: bookingDate || new Date().toISOString(),
          notes: vividDescription || `Booked for ${bookingTime || "09:00 AM"}`,
          amount: amountNumeric,
          csrfToken: getCsrfTokenFromCookie(),
        }
      });

      if (res.success && res.reference && res.orderId) {
        setDoneRef(res.reference);

        // 2. Initiate STK Push
        const { initiateStkPush } = await import("@/lib/api/mpesa.server");
        const pushRes = await initiateStkPush({
          data: {
            phone: phone.trim(),
            amount: amountNumeric,
            orderId: res.orderId,
            description: selectedSubservice?.name || "Service Booking"
          }
        });

        if (pushRes.success) {
          toast.success("M-Pesa STK Push Sent!");
          setSimStep("prompt");

          // 3. Start Polling Status
          startPaymentPolling(res.orderId, res.reference);
        } else {
          throw new Error("Failed to initiate payment prompt");
        }
      } else {
        throw new Error("Failed to create booking");
      }
    } catch (err: any) {
      console.error(err);
      setSimStep("idle");
      toast.error(err.message || "An error occurred during payment setup.");
    }
  };

  const handlePaymentRetry = () => {
    setSimStep("idle");
    setPinCode("");
  };

  const resetBooking = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    setSelectedSubservice(null);
    setDoneRef(null);
    setStep(1);
    setFarmerName("");
    setPhone("");
    setEmail("");
    setCounty("Uasin Gishu");
    setSubCounty("");
    setGpsLocation("");
    setFarmSize("");
    setFarmActivity([]);
    setOtherActivitySpec("");
    setTargetSubject("");
    setVividDescription("");
    setBookingDate("");
    setBookingTime("");
    setSimStep("idle");
    setPinCode("");
  };



  return (
    <AppLayout>
      <div className="bg-[#FAF9F5] text-[#2C332A] min-h-screen font-['Open_Sans'] antialiased">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] py-16 text-white text-left">
          <div className="container-px mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A623]">
              🩺 Professional On-Farm Services
            </span>
            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl font-['Lora'] tracking-tight">Experts at your farm gate.</h1>
            <p className="mt-2 max-w-xl text-white/80 text-sm leading-relaxed">
              Book vetted livestock doctors, agricultural scientists, mechanization operations, and track service dispatch live.
            </p>
          </div>
        </section>



        {/* Main Content Section */}
        {!selectedSubservice ? (
          <section className="bg-white text-[#2C332A] border-t border-gray-200">
            <div className="container-px mx-auto max-w-7xl py-16 space-y-24">
              {serviceCategories.map((cat, index) => {
                const meta = CATEGORY_META[cat.id] || { eyebrow: "EXPERT FARM SERVICES.", icon: Sprout };
                const IconComponent = meta.icon;
                return (
                  <div key={cat.id} className="grid gap-x-8 gap-y-6 lg:grid-cols-12 lg:items-start border-b border-gray-200/80 last:border-b-0 pb-16 last:pb-0">
                    
                    {/* A: Title & Eyebrow (Top on mobile, Right column top row on PC) */}
                    <div className="order-1 lg:order-2 lg:col-span-7 text-left">
                      {/* Eyebrow */}
                      <div className="flex items-center gap-2 text-[#F5A623] font-extrabold text-xs sm:text-sm uppercase tracking-[0.2em] mb-2">
                        <IconComponent className="h-4.5 w-4.5 shrink-0 text-[#F5A623] stroke-[3]" />
                        <strong>{meta.eyebrow}</strong>
                      </div>

                      {/* Title */}
                      <h2 className="text-3xl font-black sm:text-5xl text-[#1A3D2F] font-serif tracking-tight italic leading-tight">
                        {cat.name}
                      </h2>
                    </div>

                    {/* B: Image (Middle on mobile, Left column spanning 2 rows on PC) */}
                    <div className="order-2 lg:order-1 lg:col-span-5 lg:row-span-2 lg:sticky lg:top-24 w-full">
                      <div className="w-full relative group aspect-[4/3] lg:aspect-[3/4] overflow-hidden border border-gray-200 shadow-2xl">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover rounded-none transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>

                    {/* C: Description, Cards, Buttons (Bottom on mobile, Right column bottom row on PC) */}
                    <div className="order-3 lg:order-3 lg:col-span-7 space-y-6 text-left flex flex-col justify-between h-full">
                      <div>
                        {/* Description */}
                        <p className="text-sm sm:text-base text-gray-800 font-semibold leading-relaxed max-w-2xl mb-6">
                          {cat.broaderDescription}
                        </p>

                        {/* Sub-services Grid - 2 columns */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                          {cat.subservices.map((sub) => (
                            <div 
                              key={sub.id} 
                              className="bg-[#2D6A4F]/5 border border-[#2D6A4F]/20 p-5 hover:bg-[#2D6A4F]/10 hover:border-[#2D6A4F]/40 transition duration-300 flex flex-col justify-between rounded-none shadow-sm"
                            >
                              <div>
                                <h4 className="text-sm sm:text-base font-bold text-[#1A3D2F] tracking-wide mb-1.5">{sub.name}</h4>
                                <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">{sub.description}</p>
                              </div>
                              <div className="text-xs sm:text-sm text-[#2D6A4F] font-bold mt-4 border-t border-[#2D6A4F]/15 pt-3 font-mono flex items-center justify-between">
                                <span className="bg-[#2D6A4F]/10 px-2.5 py-1 rounded-none">{sub.estimatedCost}</span>
                                <button
                                  onClick={() => {
                                    setSelectedSubservice(sub);
                                    setStep(1);
                                    setSimStep("idle");
                                    setDoneRef(null);
                                    setTimeout(() => {
                                      const el = document.getElementById("services-wizard");
                                      el?.scrollIntoView({ behavior: "smooth" });
                                    }, 50);
                                  }}
                                  className="text-[10px] sm:text-xs bg-[#F5A623] hover:bg-[#e09520] text-black px-3.5 py-1.5 font-sans font-black uppercase transition rounded-none shadow-sm cursor-pointer"
                                >
                                  Book
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-4 pt-4">
                        <button
                          onClick={() => {
                            setSelectedSubservice(cat.subservices[0]);
                            setStep(1);
                            setSimStep("idle");
                            setDoneRef(null);
                            setTimeout(() => {
                              const el = document.getElementById("services-wizard");
                              el?.scrollIntoView({ behavior: "smooth" });
                            }, 50);
                          }}
                          className="h-12 px-8 bg-[#F5A623] hover:bg-[#e09520] text-black font-black text-sm uppercase tracking-wider rounded-none transition flex items-center justify-center shadow-lg shadow-[#F5A623]/25"
                        >
                          Book a Service
                        </button>
                        <a
                          href={`https://wa.me/254723346134?text=${encodeURIComponent(
                            `Hi Mqulima, I would like to consult an expert regarding the "${cat.name}" category.\n\nAbout this category: ${cat.broaderDescription}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-12 px-8 border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 font-black text-sm uppercase tracking-wider rounded-none transition flex items-center justify-center"
                        >
                          Talk to an Expert
                        </a>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="py-12">
            <div className="container-px mx-auto max-w-7xl">
              
              {selectedSubservice && (
                <div className="space-y-12">
                  
                  {/* Stepper Wizard popup (if active) */}
                  <div id="services-wizard" className="max-w-2xl mx-auto rounded-none border border-[#D4DDD0] border-l-4 border-l-[#2D6A4F] bg-white p-6 shadow-md text-left text-[#0A1E0C] md:p-8">
                    {doneRef ? (
                      <div className="grid place-items-center py-10 text-center">
                        <div className="grid h-16 w-16 place-items-center rounded-none border-2 border-emerald-800 bg-emerald-50 text-emerald-800 text-3xl font-bold animate-bounce">
                          ✓
                        </div>
                        <h2 className="mt-6 text-2xl font-bold font-serif text-[#1A3D2F] italic">
                          Booking Confirmed!
                        </h2>
                        <p className="mt-2 text-xs text-gray-500 font-semibold">
                          Reference code: <span className="font-mono font-bold text-[#1A5438]">{doneRef}</span>
                        </p>
                        <p className="max-w-xs text-xs text-gray-400 mt-3 leading-relaxed">
                          Thank you for booking with Mqulima. An SMS confirmation was sent to {phone}. Our field expert will contact you shortly.
                        </p>
                        
                        <div className="flex gap-4 mt-8">
                          <button
                            onClick={resetBooking}
                            className="rounded-none bg-[#1A5438] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#113B26] transition cursor-pointer uppercase tracking-wider"
                          >
                            Book Another Service
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
                          <div>
                            <h2 className="text-lg font-bold font-serif text-[#1A3D2F] italic">
                              Book {selectedSubservice.name}
                            </h2>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Schedule on-farm expert appointment</p>
                          </div>
                          <button 
                            onClick={() => setSelectedSubservice(null)}
                            className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-[#1A1A1A] border border-gray-200 text-[10px] font-black uppercase tracking-wider cursor-pointer transition rounded-none"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Steps indicator */}
                        <div className="grid grid-cols-3 gap-2 w-full mb-8 border-b border-gray-150 pb-3 text-center">
                          {[
                            { stepNum: 1, label: "01. PROFILE" },
                            { stepNum: 2, label: "02. CONTEXT" },
                            { stepNum: 3, label: "03. PAYMENT" }
                          ].map((s) => (
                            <div 
                              key={s.stepNum} 
                              className={`text-[9px] font-black tracking-widest transition duration-300 pb-1 border-b-2 ${
                                step === s.stepNum 
                                  ? "text-[#1A5438] border-b-[#1A5438]" 
                                  : step > s.stepNum 
                                    ? "text-[#2D6A4F] border-b-[#2D6A4F]/40" 
                                    : "text-gray-400 border-b-transparent"
                              }`}
                            >
                              {s.label}
                            </div>
                          ))}
                        </div>

                        {/* Step Forms */}
                        {step === 1 && (
                          <div className="space-y-4">
                            <label className="block">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Your Full Name</span>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Samuel Kiprono"
                                value={farmerName}
                                onChange={(e) => setFarmerName(e.target.value)}
                                className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438]"
                              />
                            </label>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Phone Number</span>
                                <input
                                  type="tel"
                                  required
                                  placeholder="e.g. 0712345678"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438]"
                                />
                              </label>
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Email Address</span>
                                <input
                                  type="email"
                                  required
                                  placeholder="e.g. samuel@example.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438]"
                                />
                              </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">County</span>
                                <select
                                  value={county}
                                  onChange={(e) => setCounty(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none cursor-pointer font-bold focus:border-[#1A5438]"
                                >
                                  {kenyanCounties.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Sub-County / Constituency</span>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Kesses, Ainabkoi"
                                  value={subCounty}
                                  onChange={(e) => setSubCounty(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438]"
                                />
                              </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{fields.scaleLabel}</span>
                                <input
                                  type={fields.scaleType}
                                  required
                                  min={fields.scaleType === "number" ? "0.1" : undefined}
                                  step={fields.scaleType === "number" ? "0.1" : undefined}
                                  placeholder={fields.scalePlaceholder}
                                  value={farmSize}
                                  onChange={(e) => setFarmSize(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438]"
                                />
                              </label>
                              <div className="block sm:col-span-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{fields.activityLabel} (Select all that apply)</span>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {fields.activityOptions.map((opt) => {
                                    const isChecked = farmActivity.includes(opt);
                                    return (
                                      <label key={opt} className={`flex items-start gap-2.5 cursor-pointer p-2.5 border rounded-none transition ${isChecked ? 'bg-[#1A5438]/5 border-[#1A5438]/40' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setFarmActivity([...farmActivity, opt]);
                                            } else {
                                              setFarmActivity(farmActivity.filter((item) => item !== opt));
                                            }
                                          }}
                                          className="mt-0.5 h-3.5 w-3.5 rounded-none border-gray-300 text-[#1A5438] focus:ring-[#1A5438]"
                                        />
                                        <span className="text-[11px] font-semibold text-gray-700">{opt}</span>
                                      </label>
                                    );
                                  })}
                                  {/* Always include Other checkbox */}
                                  {(() => {
                                    const isOtherChecked = farmActivity.includes("Other");
                                    return (
                                      <label className={`flex items-start gap-2.5 cursor-pointer p-2.5 border rounded-none transition ${isOtherChecked ? 'bg-[#1A5438]/5 border-[#1A5438]/40' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                          type="checkbox"
                                          checked={isOtherChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setFarmActivity([...farmActivity, "Other"]);
                                            } else {
                                              setFarmActivity(farmActivity.filter((item) => item !== "Other"));
                                              setOtherActivitySpec("");
                                            }
                                          }}
                                          className="mt-0.5 h-3.5 w-3.5 rounded-none border-gray-300 text-[#1A5438] focus:ring-[#1A5438]"
                                        />
                                        <span className="text-[11px] font-semibold text-gray-700">Other / Not Listed</span>
                                      </label>
                                    );
                                  })()}
                                </div>

                                {farmActivity.includes("Other") && (
                                  <div className="mt-2">
                                    <input
                                      type="text"
                                      required
                                      placeholder="Please specify your other requirements..."
                                      value={otherActivitySpec}
                                      onChange={(e) => setOtherActivitySpec(e.target.value)}
                                      className="w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2 text-xs outline-none focus:border-[#1A5438]"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <label className="block">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Directions / Farm Landmark</span>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 2km past Ainabkoi Junction, near St. Jude Secondary School"
                                value={gpsLocation}
                                onChange={(e) => setGpsLocation(e.target.value)}
                                className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438]"
                              />
                            </label>
                          </div>
                        )}

                        {step === 2 && (
                          <div className="space-y-4">
                            <label className="block">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{fields.subjectLabel}</span>
                              <input
                                type="text"
                                required
                                placeholder={fields.subjectPlaceholder}
                                value={targetSubject}
                                onChange={(e) => setTargetSubject(e.target.value)}
                                className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438]"
                              />
                            </label>

                            <label className="block">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{fields.descriptionLabel}</span>
                              <textarea
                                required
                                rows={4}
                                placeholder={fields.descriptionPlaceholder}
                                value={vividDescription}
                                onChange={(e) => setVividDescription(e.target.value)}
                                className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438] resize-none leading-relaxed"
                              />
                            </label>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Preferred Appointment Date</span>
                                <input
                                  type="date"
                                  required
                                  value={bookingDate}
                                  onChange={(e) => setBookingDate(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none cursor-pointer focus:border-[#1A5438]"
                                />
                              </label>
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Preferred Time Slot</span>
                                <input
                                  type="time"
                                  required
                                  value={bookingTime}
                                  onChange={(e) => setBookingTime(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none cursor-pointer focus:border-[#1A5438]"
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {step === 3 && (
                          <div className="space-y-4">
                            <div className="bg-[#FAF9F5] border border-[#D4DDD0] rounded-none p-4 text-xs">
                              <span className="text-[9px] font-black text-[#1A5438] uppercase tracking-wider block mb-3 border-b pb-1">
                                Complete Appointment Summary
                              </span>
                              
                              <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2 text-gray-600 font-semibold mb-3">
                                <div>
                                  <div className="text-[9px] text-gray-400 uppercase">Customer Profile</div>
                                  <div className="text-gray-800 font-bold mt-0.5">{farmerName}</div>
                                  <div className="text-[10px] text-gray-500 font-medium">{phone} • {email}</div>
                                </div>
                                <div>
                                  <div className="text-[9px] text-gray-400 uppercase">Farm/Case Profile</div>
                                  <div className="text-gray-800 font-bold mt-0.5">{county} County ({subCounty})</div>
                                  <div className="text-[10px] text-gray-500 font-medium mt-1 space-y-0.5">
                                    <div><span className="font-bold text-gray-400">{fields.scaleLabel}:</span> <span className="text-gray-700">{farmSize}</span></div>
                                    <div>
                                      <span className="font-bold text-gray-400">{fields.activityLabel}:</span>{" "}
                                      <span className="text-gray-700">
                                        {farmActivity
                                          .map((act) => (act === "Other" ? `Other (${otherActivitySpec})` : act))
                                          .join(", ")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="sm:col-span-2 border-t pt-2 mt-1">
                                  <div className="text-[9px] text-gray-400 uppercase">Directions / GPS</div>
                                  <div className="text-gray-700 font-medium mt-0.5">{gpsLocation}</div>
                                </div>
                                <div className="border-t pt-2 sm:col-span-2">
                                  <div className="text-[9px] text-gray-400 uppercase">Service Details & Target</div>
                                  <div className="text-gray-800 font-bold mt-0.5 font-serif italic">{selectedSubservice.name} ({targetSubject})</div>
                                  <div className="text-[10px] text-gray-500 font-medium">Appointment: {bookingDate} at {bookingTime}</div>
                                </div>
                                <div className="sm:col-span-2 bg-white p-2 border border-gray-150">
                                  <div className="text-[9px] text-[#2D6A4F] uppercase font-black tracking-wide">{fields.descriptionLabel}</div>
                                  <p className="text-[10px] text-gray-600 italic mt-1 leading-relaxed font-medium">"{vividDescription}"</p>
                                </div>
                              </div>
                              
                              <div className="border-t border-[#D4DDD0] pt-2 flex justify-between text-sm font-black text-[#1A5438]">
                                <span>Cost Estimate:</span>
                                <span>{selectedSubservice.estimatedCost}</span>
                              </div>
                            </div>

                            {simStep === "idle" && (
                              <form onSubmit={handleMpesaSubmit} className="space-y-3">
                                <label className="block">
                                  <span className="text-[10px] font-black text-[#5D6B5C] uppercase tracking-wider">M-Pesa Number</span>
                                  <input
                                    type="tel"
                                    required
                                    placeholder="e.g. 0712345678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-none px-3 py-2.5 text-xs outline-none focus:border-[#1A5438]"
                                  />
                                </label>
                                <button
                                  type="submit"
                                  className="w-full bg-[#1A5438] hover:bg-[#113B26] text-white py-2.5 rounded-none text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
                                >
                                  Proceed to MPesa Authorization
                                </button>
                              </form>
                            )}
                            {simStep === "loading" && (
                              <div className="text-center py-6">
                                <div className="w-10 h-10 rounded-none border-4 border-[#1A5438]/20 border-t-[#1A5438] animate-spin mx-auto mb-3" />
                                <h4 className="text-xs font-bold">Initiating M-Pesa Payment...</h4>
                                <p className="text-[10px] text-gray-500 mt-1">Please keep this window open</p>
                              </div>
                            )}

                            {simStep === "prompt" && (
                              <div className="text-center py-6 bg-white border border-gray-200 p-4">
                                <div className="w-10 h-10 rounded-none border-4 border-[#1A5438]/20 border-t-[#1A5438] animate-spin mx-auto mb-3" />
                                <h4 className="text-xs font-bold text-gray-800">Check Your Phone!</h4>
                                <p className="text-[11px] text-gray-600 mt-1.5">
                                  We've sent an M-Pesa PIN prompt to <strong>{phone}</strong>.
                                  Please enter your PIN on your phone to authorize the transaction of {selectedSubservice.estimatedCost}.
                                </p>
                                <p className="text-[10px] text-gray-400 mt-3 font-semibold uppercase tracking-wider">
                                  Waiting for confirmation... ({pollCountdown}s)
                                </p>
                              </div>
                            )}

                            {simStep === "failed" && (
                              <div className="text-center py-6 bg-red-50/50 border border-red-200 p-4">
                                <div className="text-2xl text-red-600 mb-2">❌</div>
                                <h4 className="text-xs font-bold text-red-800">Payment Failed</h4>
                                <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                                  The transaction could not be processed. Please verify your phone number and balance, and try again.
                                </p>
                                <button
                                  type="button"
                                  onClick={handlePaymentRetry}
                                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                                >
                                  Try Again
                                </button>
                              </div>
                            )}

                            {simStep === "timeout" && (
                              <div className="text-center py-6 bg-amber-50/50 border border-amber-200 p-4">
                                <div className="text-2xl text-amber-600 mb-2">⚠️</div>
                                <h4 className="text-xs font-bold text-amber-800">Request Timed Out</h4>
                                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                                  We didn't receive confirmation in time. If you entered your PIN, please check your messages.
                                </p>
                                <button
                                  type="button"
                                  onClick={handlePaymentRetry}
                                  className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-none text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                                >
                                  Try Again
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Back / Continue triggers */}
                        {simStep === "idle" && (
                          <div className="mt-6 flex items-center justify-between border-t border-gray-150 pt-4">
                            <button
                              disabled={step === 1}
                              onClick={() => setStep(step - 1)}
                              className="text-xs font-bold text-gray-500 hover:text-[#1A1A1A] disabled:opacity-30 cursor-pointer uppercase tracking-wider px-5 py-2 border border-transparent transition"
                            >
                              ← Back
                            </button>
                            {step < 3 ? (
                              <button
                                disabled={
                                  (step === 1 && (
                                    !farmerName || 
                                    !phone || 
                                    !email || 
                                    !subCounty || 
                                    !gpsLocation || 
                                    !farmSize || 
                                    farmActivity.length === 0 || 
                                    (farmActivity.includes("Other") && !otherActivitySpec.trim())
                                  )) || 
                                  (step === 2 && (
                                    !targetSubject || 
                                    !vividDescription || 
                                    !bookingDate || 
                                    !bookingTime
                                  ))
                                }
                                onClick={() => setStep(step + 1)}
                                className="bg-[#1A5438] hover:bg-[#113B26] text-white px-6 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition cursor-pointer shadow-sm"
                              >
                                Continue
                              </button>
                            ) : null}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
