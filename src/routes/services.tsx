import { createFileRoute } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect } from "react";
import { 
  Check, 
  ArrowRight, 
  Calendar, 
  Phone, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  Star, 
  Search, 
  MessageSquare, 
  AlertTriangle, 
  Sliders, 
  Droplet, 
  Download, 
  Activity, 
  Truck, 
  FileText, 
  ShieldAlert, 
  Coins 
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
    name: "Animal Feeds & Machinery",
    broaderDescription: "Advanced livestock nutrition formulation, silage shredding/packing, alternative high-protein feeds (Azolla), machinery hire, egg incubation, and expert advisory.",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800",
    subservices: [
      {
        id: "feed_formulation",
        name: "Formulation & formulation advice",
        description: "Custom ratio calculation sheets mixing maize germ, wheat pollard, and cotton cake to hit target crude protein percentages.",
        estimatedCost: "KES 1,800 per Ration"
      },
      {
        id: "silage_shredding",
        name: "Silage shredding & packing",
        description: "High-speed mechanical fodder chopping, molasses mixing, and airtight vacuum tube packing to secure long-term dairy silage.",
        estimatedCost: "KES 8,000 per Ton"
      },
      {
        id: "azolla",
        name: "Azolla cultivation",
        description: "Setup and seeding of highly nutritious, high-protein organic Azolla pools to cut standard dairy meal feed costs by up to 30%.",
        estimatedCost: "KES 4,000 per Pond Setup"
      },
      {
        id: "machinery_buy_rent",
        name: "Buy/rent machinery",
        description: "Flexible tractor and shredder leases including operators for on-farm crop residue grinding and silage operations.",
        estimatedCost: "KES 6,000 per Day"
      },
      {
        id: "incubation",
        name: "Incubation services",
        description: "High-yield commercial egg incubation and hatchery management for improved hatch rates and day-old chick supplies.",
        estimatedCost: "KES 20 per Egg"
      },
      {
        id: "ask_expert_feeds",
        name: "Advisory/Ask an Expert",
        description: "One-on-one nutrition consultation with animal scientists to increase milk yield and beef conversion rates.",
        estimatedCost: "KES 1,500 per Consult"
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
    name: "Value Addition & Milling",
    broaderDescription: "Agro-processing consultancy, solar dehydration setups, milling configurations, sorting/grading installations, and commercial brand branding/packaging setups to boost market price margins.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    subservices: [
      {
        id: "ask_expert_value",
        name: "Ask an expert",
        description: "On-farm consultations for milling, packing, drying, and value-addition setup to boost farm gate profits by up to 50%.",
        estimatedCost: "KES 3,000 per Consult"
      }
    ]
  },
  {
    id: "other",
    name: "Infrastructure & Smart Farming",
    broaderDescription: "Borehole drilling, advanced solar irrigation networks, livestock shed design, agriculture insurance, finance credit vouchers, climate-smart farming, and digital record keeping.",
    image: "https://images.unsplash.com/photo-1463123081488-729f555ee3f9?w=800",
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

function ServicesPage() {
  const search = Route.useSearch();
  const [activeView, setActiveView] = useState<"explore" | "tracker">("explore");
  const [selectedCategoryId, setSelectedCategoryId] = useState("soil");
  
  // Booking Wizard states
  const [selectedSubservice, setSelectedSubservice] = useState<SubService | null>(null);
  const [step, setStep] = useState(1);
  const [doneRef, setDoneRef] = useState<string | null>(null);
  
  // Customer Booking inputs
  const [farmerName, setFarmerName] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [county, setCounty] = useState("Uasin Gishu");
  const [gpsLocation, setGpsLocation] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [phone, setPhone] = useState("");
  
  // M-Pesa Simulator states
  const [simStep, setSimStep] = useState<"idle" | "pin" | "loading" | "success">("idle");
  const [pinCode, setPinCode] = useState("");

  // Tracker states
  const [trackerCode, setTrackerCode] = useState("");
  const [trackedJob, setTrackedJob] = useState<{ id: string; serviceName: string; county: string; date: string; time: string; status: "pending" | "assigned" | "dispatched" | "completed" } | null>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);

  // Sync url search parameters
  useEffect(() => {
    if (search.category) {
      const catExists = serviceCategories.some((cat) => cat.id === search.category);
      if (catExists) {
        setSelectedCategoryId(search.category);
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

  // Load user bookings from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_bookings");
      if (stored) {
        setUserBookings(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load bookings from local storage", e);
    }
  }, [activeView, doneRef]);

  const activeCategory = useMemo(() => {
    return serviceCategories.find((cat) => cat.id === selectedCategoryId) ?? serviceCategories[0];
  }, [selectedCategoryId]);

  const handleKeyPress = (num: string) => {
    if (pinCode.length < 4) {
      setPinCode((prev) => prev + num);
    }
  };

  const handlePinBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
  };

  const handleMpesaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(07|01|254)\d{8}$/.test(phone.trim())) {
      toast.error("Please enter a valid Kenyan phone number (e.g. 0712345678)");
      return;
    }
    setPinCode("");
    setSimStep("pin");
  };

  const handleConfirmPin = () => {
    if (pinCode.length < 4) {
      toast.error("Please enter your 4-digit M-Pesa PIN");
      return;
    }
    setSimStep("loading");
    
    setTimeout(() => {
      setSimStep("success");
      const ref = generateReference();
      setDoneRef(ref);

      // Create tracked job mock
      const newJob = {
        id: ref,
        serviceName: selectedSubservice?.name || "Soil Testing Service",
        county: county,
        date: bookingDate || new Date().toLocaleDateString(),
        time: bookingTime || "09:00 AM",
        status: "pending" as const
      };
      setTrackedJob(newJob);

      // Persist in localStorage
      try {
        const stored = localStorage.getItem("mqulima_bookings");
        const list = stored ? JSON.parse(stored) : [];
        list.push(newJob);
        localStorage.setItem("mqulima_bookings", JSON.stringify(list));
      } catch (e) {
        console.error("Failed to save booking to local storage", e);
      }

      setTimeout(() => {
        toast.success("SMS Confirmation Sent", {
          description: `Message: Ref ${ref} booked for ${selectedSubservice?.name} is confirmed. Pay ${selectedSubservice?.estimatedCost} after service.`,
          duration: 8000,
        });
      }, 500);
    }, 2500);
  };

  const resetBooking = () => {
    setSelectedSubservice(null);
    setDoneRef(null);
    setStep(1);
    setFarmerName("");
    setFarmerId("");
    setCounty("Uasin Gishu");
    setGpsLocation("");
    setBookingDate("");
    setBookingTime("");
    setUrgency("Normal");
    setPhone("");
    setSimStep("idle");
    setPinCode("");
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerCode.trim()) {
      toast.error("Please enter a reference code.");
      return;
    }
    const code = trackerCode.trim().toUpperCase();
    if (code === "MQ-DEMO55") {
      setTrackedJob({
        id: "MQ-DEMO55",
        serviceName: "Soil testing & analysis",
        county: "Trans Nzoia",
        date: "2026-06-28",
        time: "10:00 AM",
        status: "dispatched"
      });
      toast.success("Active booking located!");
    } else {
      try {
        const stored = localStorage.getItem("mqulima_bookings");
        const list = stored ? JSON.parse(stored) : [];
        const found = list.find((j: any) => j.id === code);
        if (found) {
          setTrackedJob(found);
          toast.success("Active booking located!");
          return;
        }
      } catch (e) {
        console.error("Failed to read bookings", e);
      }

      if (trackedJob && code === trackedJob.id) {
        toast.success("Active booking located!");
      } else {
        toast.error("No active booking found with that reference. Try 'MQ-DEMO55' for simulation.");
        setTrackedJob(null);
      }
    }
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

        {/* Tab Controls */}
        <section className="border-b border-gray-200 bg-white sticky top-16 z-30 shadow-sm">
          <div className="container-px mx-auto max-w-7xl text-left">
            <div className="flex gap-6 py-4 text-xs font-semibold uppercase tracking-wider">
              <button
                onClick={() => { setActiveView("explore"); setSelectedSubservice(null); }}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  activeView === "explore" ? "border-[#1A5438] text-[#1A5438] font-extrabold" : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                }`}
              >
                Explore Services
              </button>
              <button
                onClick={() => setActiveView("tracker")}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  activeView === "tracker" ? "border-[#1A5438] text-[#1A5438] font-extrabold" : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                }`}
              >
                Service Request Tracker
              </button>
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <section className="py-12">
          <div className="container-px mx-auto max-w-7xl">
            
            {/* VIEW A: Explore Services */}
            {activeView === "explore" && (
              <div className="space-y-12">
                
                {/* Stepper Wizard popup (if active) */}
                {selectedSubservice ? (
                  <div className="max-w-xl mx-auto rounded-2xl border border-[#D4DDD0] bg-white p-6 shadow-md text-left">
                    {doneRef ? (
                      <div className="grid place-items-center py-10 text-center">
                        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-800 text-3xl animate-bounce">
                          ✓
                        </div>
                        <h2 className="mt-6 text-2xl font-bold font-['Lora'] text-[#1A3A1A]">
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
                            className="rounded-xl bg-[#1A5438] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#113B26] transition cursor-pointer"
                          >
                            Book Another Service
                          </button>
                          <button
                            onClick={() => {
                              setTrackerCode(doneRef);
                              setActiveView("tracker");
                              setSelectedSubservice(null);
                            }}
                            className="rounded-xl border border-gray-300 px-6 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                          >
                            Track Status
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
                          <div>
                            <h2 className="text-base font-extrabold font-['Lora'] text-[#1A3A1A]">
                              Book {selectedSubservice.name}
                            </h2>
                            <p className="text-[10px] text-gray-500 font-semibold">Schedule on-farm expert appointment</p>
                          </div>
                          <button 
                            onClick={() => setSelectedSubservice(null)}
                            className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Steps indicator */}
                        <div className="relative flex items-center justify-between w-full max-w-xs mx-auto mb-8">
                          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-150 -translate-y-1/2 z-0" />
                          <div
                            className="absolute left-0 top-1/2 h-0.5 bg-[#1A5438] -translate-y-1/2 transition-all duration-300 z-0"
                            style={{ width: `${((step - 1) / 2) * 100}%` }}
                          />
                          {[1, 2, 3].map((s) => (
                            <div key={s} className="relative z-10 flex flex-col items-center">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border-2 transition-all duration-300 ${
                                  step > s
                                    ? "bg-[#1A5438] border-[#1A5438] text-white"
                                    : step === s
                                      ? "bg-white border-[#1A5438] text-[#1A5438]"
                                      : "bg-white border-gray-100 text-gray-400"
                                }`}
                              >
                                {step > s ? <Check className="w-3 h-3" /> : s}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Step Forms */}
                        {step === 1 && (
                          <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Your Name</span>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Samuel Kiprono"
                                  value={farmerName}
                                  onChange={(e) => setFarmerName(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs outline-none"
                                />
                              </label>
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase">National ID Number</span>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 34221088"
                                  value={farmerId}
                                  onChange={(e) => setFarmerId(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs outline-none"
                                />
                              </label>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase">County</span>
                                <select
                                  value={county}
                                  onChange={(e) => setCounty(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs outline-none cursor-pointer font-bold"
                                >
                                  <option value="Uasin Gishu">Uasin Gishu</option>
                                  <option value="Nyandarua">Nyandarua</option>
                                  <option value="Kericho">Kericho</option>
                                  <option value="Machakos">Machakos</option>
                                  <option value="Nakuru">Nakuru</option>
                                </select>
                              </label>
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Farm Landmark / GPS</span>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 2km past Junction, near high school"
                                  value={gpsLocation}
                                  onChange={(e) => setGpsLocation(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs outline-none"
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {step === 2 && (
                          <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Appointment Date</span>
                                <input
                                  type="date"
                                  required
                                  value={bookingDate}
                                  onChange={(e) => setBookingDate(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                                />
                              </label>
                              <label className="block">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Preferred Time Slot</span>
                                <input
                                  type="time"
                                  required
                                  value={bookingTime}
                                  onChange={(e) => setBookingTime(e.target.value)}
                                  className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                                />
                              </label>
                            </div>

                            <label className="block">
                              <span className="text-[10px] font-black text-gray-400 uppercase">Urgency Status</span>
                              <select
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value)}
                                className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs outline-none cursor-pointer font-bold"
                              >
                                <option value="Normal">Normal schedule (Within 3 days)</option>
                                <option value="Medium">Medium urgency (Within 48 hours)</option>
                                <option value="Urgent">Emergency dispatch (Vets within 12 hours)</option>
                              </select>
                            </label>
                          </div>
                        )}

                        {step === 3 && (
                          <div className="space-y-4">
                            <div className="bg-[#FAF9F5] border border-[#D4DDD0] rounded-xl p-4">
                              <span className="text-[9px] font-black text-[#1A5438] uppercase tracking-wider block mb-2">
                                Order Summary
                              </span>
                              <div className="space-y-1.5 text-xs text-gray-600 font-semibold">
                                <div className="flex justify-between">
                                  <span>Service Ordered:</span>
                                  <strong className="text-gray-800">{selectedSubservice.name}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>County & Landmark:</span>
                                  <strong className="text-gray-800">{county} County, {gpsLocation}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Appointment Target:</span>
                                  <strong className="text-gray-800">{bookingDate} at {bookingTime}</strong>
                                </div>
                                <div className="h-px bg-gray-200 my-1" />
                                <div className="flex justify-between text-sm font-black text-[#1A5438]">
                                  <span>Cost Estimate:</span>
                                  <span>{selectedSubservice.estimatedCost}</span>
                                </div>
                              </div>
                            </div>

                            {simStep === "idle" && (
                              <form onSubmit={handleMpesaSubmit} className="space-y-3">
                                <label className="block">
                                  <span className="text-[10px] font-black text-[#5D6B5C] uppercase">M-Pesa Number</span>
                                  <input
                                    type="tel"
                                    required
                                    placeholder="e.g. 0712345678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="mt-1.5 w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs outline-none"
                                  />
                                </label>
                                <button
                                  type="submit"
                                  className="w-full bg-[#1A5438] hover:bg-[#113B26] text-white py-2.5 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  Proceed to MPesa Authorization
                                </button>
                              </form>
                            )}

                            {simStep === "pin" && (
                              <div className="mx-auto max-w-xs border border-gray-800 rounded-2xl bg-[#1A1A1A] p-4 shadow-xl text-white">
                                <div className="text-center text-[9px] font-semibold text-gray-400 mb-2">M-PESA SIMULATOR</div>
                                <div className="rounded-xl bg-white p-3 text-center text-[#1A1A1A]">
                                  <div className="text-[9px] font-bold text-gray-400">PAY MQULIMA</div>
                                  <div className="text-xs font-black text-[#2D6A4F] mt-0.5">{selectedSubservice.estimatedCost}</div>
                                  
                                  <div className="mt-3">
                                    <div className="text-[9px] text-gray-400 font-bold mb-1">ENTER PIN:</div>
                                    <div className="flex justify-center gap-1.5">
                                      {Array.from({ length: 4 }).map((_, idx) => (
                                        <div key={idx} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-xs font-bold text-[#1A1A1A]">
                                          {pinCode[idx] ? "●" : ""}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-1.5">
                                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                                    <button key={n} type="button" onClick={() => handleKeyPress(n)} className="h-8 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold">{n}</button>
                                  ))}
                                  <button type="button" onClick={handlePinBackspace} className="h-8 rounded-full bg-red-600/20 text-red-400 text-[9px] font-bold">Clear</button>
                                  <button type="button" onClick={() => handleKeyPress("0")} className="h-8 rounded-full bg-white/10 text-xs font-bold">0</button>
                                  <button type="button" onClick={handleConfirmPin} className="h-8 rounded-full bg-[#1A5438] text-white text-[9px] font-bold">OK</button>
                                </div>
                              </div>
                            )}

                            {simStep === "loading" && (
                              <div className="text-center py-6">
                                <div className="w-10 h-10 rounded-full border-4 border-[#1A5438]/20 border-t-[#1A5438] animate-spin mx-auto mb-3" />
                                <h4 className="text-xs font-bold">Processing payment push...</h4>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Back / Continue triggers */}
                        {simStep !== "pin" && simStep !== "loading" && (
                          <div className="mt-6 flex items-center justify-between border-t border-gray-150 pt-4">
                            <button
                              disabled={step === 1}
                              onClick={() => setStep(step - 1)}
                              className="text-xs font-bold text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30 cursor-pointer"
                            >
                              ← Back
                            </button>
                            {step < 3 ? (
                              <button
                                disabled={(step === 1 && (!farmerName || !farmerId || !gpsLocation)) || (step === 2 && (!bookingDate || !bookingTime))}
                                onClick={() => setStep(step + 1)}
                                className="bg-[#1A5438] hover:bg-[#113B26] text-white px-5 py-2 rounded-lg text-xs font-bold disabled:opacity-40 transition cursor-pointer"
                              >
                                Continue
                              </button>
                            ) : null}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Category Selector Grid with Broader Class Details */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-left">
                      {serviceCategories.map((cat) => (
                        <div 
                          key={cat.id} 
                          className={`bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                            selectedCategoryId === cat.id ? "border-[#1A5438] ring-1 ring-[#1A5438]/10" : "border-[#D4DDD0]"
                          }`}
                        >
                          <div>
                            <div className="aspect-video w-full bg-slate-50 overflow-hidden relative">
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                                <h3 className="text-base font-extrabold font-['Lora'] text-white">
                                  {cat.name}
                                </h3>
                              </div>
                            </div>
                            <div className="p-5">
                              <p className="text-xs text-[#5D6B5C] leading-relaxed font-semibold">
                                {cat.broaderDescription}
                              </p>
                            </div>
                          </div>

                          <div className="p-5 border-t border-gray-100 bg-[#FAF9F5]">
                            <button
                              onClick={() => setSelectedCategoryId(cat.id)}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                selectedCategoryId === cat.id 
                                  ? "bg-[#1A5438] text-white" 
                                  : "bg-white border border-[#D4DDD0] text-[#1A5438] hover:bg-gray-50"
                              }`}
                            >
                              <span>Explore {cat.subservices.length} Services</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Specific Subservices Catalogue (Visible for the active Category) */}
                    <div className="border-t border-[#D4DDD0] pt-12 text-left">
                      <div className="mb-8">
                        <span className="text-[10px] font-black text-[#1A5438] uppercase tracking-wider block">
                          Specific Services Catalogue
                        </span>
                        <h2 className="text-2xl font-bold font-['Lora'] text-[#1A3A1A] mt-1">
                          Available under {activeCategory.name}
                        </h2>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {activeCategory.subservices.map((sub) => (
                          <div 
                            key={sub.id} 
                            className="bg-white border border-[#D4DDD0] rounded-xl p-5 shadow-xs hover:border-[#1A5438] transition flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-extrabold text-[#1A3A1A]">{sub.name}</h3>
                                <span className="text-[10px] text-[#1A5438] font-bold bg-[#1A5438]/5 px-2 py-0.5 rounded border border-[#1A5438]/10 whitespace-nowrap">
                                  {sub.estimatedCost}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5D6B5C] leading-relaxed font-semibold">
                                {sub.description}
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedSubservice(sub);
                                setStep(1);
                                setSimStep("idle");
                                setDoneRef(null);
                              }}
                              className="mt-5 w-full bg-[#FAF9F5] border border-[#1A5438] hover:bg-[#1A5438] hover:text-white text-[#1A5438] py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Order Service</span>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              </div>
            )}

            {/* VIEW B: Service Request Tracker */}
            {activeView === "tracker" && (
              <div className="max-w-2xl mx-auto rounded-2xl border border-[#D4DDD0] bg-white p-6 shadow-md md:p-8 text-left">
                <h2 className="text-xl font-bold font-['Lora'] text-[#1A3A1A] mb-2">Track Service Request</h2>
                <p className="text-xs text-gray-500 mb-6 font-semibold">
                  Enter your appointment reference number (e.g. `MQ-XXXXXX`) to view dispatch status. You can use the mock code <span className="font-mono font-bold text-[#1A5438]">MQ-DEMO55</span> to test the tracker stages.
                </p>

                <form onSubmit={handleTrackSubmit} className="flex gap-3 mb-8">
                  <input
                    type="text"
                    required
                    placeholder="Enter Reference (e.g. MQ-DEMO55)"
                    value={trackerCode}
                    onChange={(e) => setTrackerCode(e.target.value)}
                    className="flex-1 rounded-xl border border-[#D4DDD0] bg-white px-4 py-2 text-xs outline-none focus:border-[#1A5438] uppercase"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#1A5438] text-white px-6 py-2 text-xs font-bold hover:bg-[#113B26] transition cursor-pointer"
                  >
                    Locate Request
                  </button>
                </form>

                {trackedJob ? (
                  <div className="border-t border-gray-150 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setTrackedJob(null);
                          setTrackerCode("");
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-[#1A1A1A] cursor-pointer"
                      >
                        ← Back to History
                      </button>
                    </div>

                    <div className="flex flex-wrap justify-between items-center bg-[#FAF9F5] p-4 rounded-xl mb-6 text-xs border border-[#D4DDD0]">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Service Booked</div>
                        <div className="font-extrabold text-[#1A3A1A]">{trackedJob.serviceName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Reference Code</div>
                        <div className="font-mono font-bold text-[#1A5438]">{trackedJob.id}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Target Schedule</div>
                        <div className="font-semibold text-gray-700">{trackedJob.date} at {trackedJob.time}</div>
                      </div>
                    </div>

                    {/* Timeline stepper */}
                    <div className="space-y-6 relative pl-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                      {[
                        { key: "pending", label: "Booking Request Received", desc: "Our coordination team has received your order and is vetting technicians in your county." },
                        { key: "assigned", label: "Professional Expert Assigned", desc: "A verified agronomist/vet has been allocated to your schedule. Details sent to your phone." },
                        { key: "dispatched", label: "Technician Dispatched", desc: "The expert is currently traveling to your GPS/farm location." },
                        { key: "completed", label: "Job Completed & Certified", desc: "Service delivery was completed successfully. Receipt and recommendations generated." },
                      ].map((step, idx) => {
                        const statusOrder = ["pending", "assigned", "dispatched", "completed"];
                        const currentIdx = statusOrder.indexOf(trackedJob.status);
                        const stepIdx = statusOrder.indexOf(step.key);
                        const isDone = stepIdx <= currentIdx;
                        const isActive = stepIdx === currentIdx;

                        return (
                          <div key={step.key} className="relative text-left">
                            <div className={`absolute -left-8 top-0.5 w-7.5 h-7.5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              isDone ? "bg-[#1A5438] border-[#1A5438] text-white" : "bg-white border-gray-200 text-gray-300"
                            }`}>
                              {isDone ? <Check className="w-3.5 h-3.5" /> : (idx + 1)}
                            </div>
                            <div className="pl-2">
                              <h4 className={`text-xs font-extrabold ${isActive ? "text-[#1A5438]" : isDone ? "text-[#1A3A1A]" : "text-gray-400"}`}>
                                {step.label}
                              </h4>
                              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-semibold">Enter a reference code above to load booking status</p>
                    </div>

                    {userBookings.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-[#5D6B5C] uppercase tracking-wider">
                          Your Booking History ({userBookings.length})
                        </h3>
                        <div className="grid gap-3">
                          {userBookings.map((job) => (
                            <div
                              key={job.id}
                              className="flex items-center justify-between border border-[#D4DDD0] p-4 rounded-xl hover:border-[#1A5438] transition bg-white"
                            >
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-[#1A3A1A]">{job.serviceName}</h4>
                                <div className="text-[10px] text-gray-500 font-semibold">
                                  Ref: <span className="font-mono text-[#1A5438] font-bold">{job.id}</span> • {job.date}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  job.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : job.status === "dispatched"
                                      ? "bg-blue-100 text-blue-800"
                                      : job.status === "assigned"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-amber-100 text-amber-800"
                                }`}>
                                  {job.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTrackerCode(job.id);
                                    setTrackedJob(job);
                                    toast.success("Loaded booking details!");
                                  }}
                                  className="text-[10px] font-bold text-[#1A5438] hover:underline"
                                >
                                  Track →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </section>
      </div>
    </AppLayout>
  );
}
