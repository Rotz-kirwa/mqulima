import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import {
  CloudRain,
  Thermometer,
  Droplets,
  TrendingUp,
  TrendingDown,
  Search,
  ScanLine,
  UploadCloud,
  Database,
  AlertTriangle,
  QrCode,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Wrench
} from "lucide-react";
import { toast } from "sonner";
import toolsHero from "@/assets/mqulima_tools_hero.png";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Mqulima Tools · Advanced Agricultural Intelligence" },
      {
        name: "description",
        content:
          "Access real-time weather analytics, wholesale market prices, soil/climate advisories, and instant AI crop disease diagnosis.",
      },
    ],
  }),
  component: ToolsPage,
});

// Mock Weather Data
interface WeatherDetails {
  temp: string;
  soilTemp: string;
  humidity: string;
  rainProb: string;
  advisory: string;
  winds: string;
  alerts: string[];
}

const COUNTY_WEATHER: Record<string, WeatherDetails> = {
  Eldoret: {
    temp: "19°C",
    soilTemp: "16.5°C",
    humidity: "78%",
    rainProb: "15%",
    winds: "12 km/h NE",
    advisory: "Excellent window for maize planting and nitrogen application. Soil moisture is optimal.",
    alerts: ["No active extreme weather alerts"]
  },
  Nakuru: {
    temp: "22°C",
    soilTemp: "18.2°C",
    humidity: "62%",
    rainProb: "60%",
    winds: "14 km/h E",
    advisory: "Expected evening showers. Postpone chemical spraying to avoid wash-off. Ideal for cabbage transplanting.",
    alerts: ["Moderate Rain Warning (5 PM - 8 PM)"]
  },
  Nairobi: {
    temp: "23°C",
    soilTemp: "19.0°C",
    humidity: "55%",
    rainProb: "10%",
    winds: "9 km/h S",
    advisory: "Favorable dry conditions. Proceed with weeding and soil aeration. Ensure drip systems are active.",
    alerts: ["No active extreme weather alerts"]
  },
  Kericho: {
    temp: "18°C",
    soilTemp: "15.8°C",
    humidity: "85%",
    rainProb: "75%",
    winds: "16 km/h NE",
    advisory: "High humidity and rain probability. Inspect tea leaves for fungal blister blight signs. Improve drainage channels.",
    alerts: ["Heavy Thunderstorm Alert (Aviation/Farm warning)"]
  },
  Meru: {
    temp: "20°C",
    soilTemp: "17.4°C",
    humidity: "70%",
    rainProb: "30%",
    winds: "11 km/h SE",
    advisory: "Optimal temperature for potato sowing. Apply organic mulch to conserve soil moisture before slight drizzle.",
    alerts: ["No active extreme weather alerts"]
  }
};

// Mock Market Prices
interface MarketPrice {
  id: string;
  name: string;
  category: string;
  bagSize: string;
  nairobi: number;
  eldoret: number;
  nakuru: number;
  change: string;
  trend: "up" | "down" | "stable";
}

const MARKET_COMMODITIES: MarketPrice[] = [
  {
    id: "maize",
    name: "Dry Maize",
    category: "Grains",
    bagSize: "90kg Bag",
    nairobi: 3400,
    eldoret: 3100,
    nakuru: 3250,
    change: "+4.2%",
    trend: "up"
  },
  {
    id: "potato",
    name: "Irish Potatoes (Shangi)",
    category: "Tubers",
    bagSize: "50kg Bag",
    nairobi: 2800,
    eldoret: 2100,
    nakuru: 2400,
    change: "-2.5%",
    trend: "down"
  },
  {
    id: "tomato",
    name: "Tomatoes (M-PESA Grade)",
    category: "Horticulture",
    bagSize: "64kg Crate",
    nairobi: 6800,
    eldoret: 5900,
    nakuru: 6200,
    change: "+8.7%",
    trend: "up"
  },
  {
    id: "cabbage",
    name: "Cabbage",
    category: "Vegetables",
    bagSize: "100kg Bag",
    nairobi: 2200,
    eldoret: 1800,
    nakuru: 1950,
    change: "0.0%",
    trend: "stable"
  },
  {
    id: "beans",
    name: "Rosecoco Beans",
    category: "Grains",
    bagSize: "90kg Bag",
    nairobi: 8800,
    eldoret: 8200,
    nakuru: 8400,
    change: "+1.8%",
    trend: "up"
  },
  {
    id: "onion",
    name: "Red Bulb Onions",
    category: "Horticulture",
    bagSize: "1kg Net",
    nairobi: 150,
    eldoret: 130,
    nakuru: 140,
    change: "-1.2%",
    trend: "down"
  }
];

// Mock Diagnostic results
interface DiagnosisResult {
  disease: string;
  confidence: string;
  description: string;
  treatmentChemical: string;
  treatmentOrganic: string;
  recommendedProducts: { name: string; price: string; linkId: string }[];
}

const CROP_DIAGNOSES: Record<string, DiagnosisResult> = {
  maize_yellow: {
    disease: "Maize Lethal Necrosis Disease (MLND)",
    confidence: "94.8%",
    description: "MLND is caused by a combination of Maize Chlorotic Mottle Virus and Sugarcane Mosaic Virus. It causes severe chlorosis (yellowing), leaf necrosis starting from the margins, and failure to produce cobs.",
    treatmentChemical: "Control insect vectors (thrips and aphids) using systemic insecticides like Deltamethrin early in the cycle.",
    treatmentOrganic: "Practise strict crop rotation, immediately uproot and burn infected crops, and plant certified disease-free hybrid seeds.",
    recommendedProducts: [
      { name: "Dudu-dust Bio-Insecticide", price: "KES 650", linkId: "1" },
      { name: "Certified Hybrid Maize H6213", price: "KES 2,400", linkId: "1" }
    ]
  },
  maize_bore: {
    disease: "Maize Stem Borer Infestation",
    confidence: "97.2%",
    description: "Stem Borer larvae tunnel into the maize stalks, disrupting nutrient flow. Symptoms include small holes in leaves (window-paning) and structural collapse of the stalk.",
    treatmentChemical: "Apply granular insecticide directly into the whorl (funnel) of the maize plants at 4-6 weeks.",
    treatmentOrganic: "Intercrop with Desmodium (push-pull method) to repel stem borer moths, and plant Napier grass on margins to trap them.",
    recommendedProducts: [
      { name: "Stem Borer Control Granules", price: "KES 850", linkId: "1" }
    ]
  },
  tomato_curl: {
    disease: "Tomato Yellow Leaf Curl Virus (TYLCV)",
    confidence: "93.1%",
    description: "TYLCV is a destructive begomovirus transmitted by silverleaf whiteflies. Infected tomato leaves roll upward and inward, turn bright yellow, and plant growth becomes extremely stunted.",
    treatmentChemical: "Apply targeted insecticide sprays containing Imidacloprid to suppress vector whitefly colonies.",
    treatmentOrganic: "Install yellow sticky traps, drape nursery beds in fine insect-proof mesh, and apply organic neem oil extracts weekly.",
    recommendedProducts: [
      { name: "Premium Neem Oil Concentrate", price: "KES 1,200", linkId: "3" },
      { name: "Yellow Insect Sticky Pads (10 Pcs)", price: "KES 400", linkId: "3" }
    ]
  },
  tomato_spots: {
    disease: "Tomato Late Blight (Phytophthora infestans)",
    confidence: "96.5%",
    description: "Late Blight is a fungal-like water mold pathogen that thrives in cool, wet conditions. It manifests as dark water-soaked lesions on leaves and white cottony growth on the underside during humid weather.",
    treatmentChemical: "Spray preventative copper-based fungicides or curative metalaxyl treatments immediately.",
    treatmentOrganic: "Ensure adequate spacing for air circulation, avoid overhead watering, and prune lower leaves touching the soil.",
    recommendedProducts: [
      { name: "Copper Fungicide Powder 500g", price: "KES 1,150", linkId: "2" },
      { name: "Drip Irrigation Kit (Single Line)", price: "KES 14,800", linkId: "2" }
    ]
  },
  potato_wilting: {
    disease: "Bacterial Wilt (Ralstonia solanacearum)",
    confidence: "89.4%",
    description: "Bacterial Wilt is a soil-borne disease causing rapid wilting of potato stems during warm hours without yellowing. Stems exude a milky white bacterial slime when cut and placed in water.",
    treatmentChemical: "No effective curative chemical treatments exist once infected. Focus entirely on preventative biosecurity.",
    treatmentOrganic: "Uproot infected plants carefully, solarize soil, avoid planting nightshade crops in the same area, and use disease-resistant seeds.",
    recommendedProducts: [
      { name: "Certified Shangi Seed Potatoes 50kg", price: "KES 3,000", linkId: "1" }
    ]
  }
};

function ToolsPage() {
  const [activeTab, setActiveTab] = useState<"weather" | "markets" | "doctor" | "trace">("doctor");

  // Weather States
  const [selectedCounty, setSelectedCounty] = useState<string>("Eldoret");
  const weather = COUNTY_WEATHER[selectedCounty];

  // Market States
  const [marketSearch, setMarketSearch] = useState<string>("");
  const filteredCommodities = MARKET_COMMODITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(marketSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(marketSearch.toLowerCase())
  );

  // Climate States
  const [soilMoisture, setSoilMoisture] = useState<number>(45); // percent
  const getSoilAdvisory = (moisture: number) => {
    if (moisture < 30) {
      return {
        status: "Critical Dryness",
        color: "text-red-600 bg-red-50 border-red-200",
        text: "Urgent watering required. Soil microbial activity is low. Prolonged state will result in permanent crop wilting."
      };
    } else if (moisture >= 30 && moisture <= 65) {
      return {
        status: "Optimal Moisture",
        color: "text-[#2D6A4F] bg-[#E9F3EC] border-[#52B788]/20",
        text: "Ideal zone for nutrient uptake. Apply top-dressing fertilizer now for maximum assimilation. Maintain current watering schedules."
      };
    } else {
      return {
        status: "Water-Logged / Saturated",
        color: "text-[#F5A623] bg-amber-50 border-amber-200",
        text: "High risk of root rot and oxygen deprivation. Suspend irrigation. Ensure drainage furrows are cleared to dry top soil layers."
      };
    }
  };
  const soilAdvisory = getSoilAdvisory(soilMoisture);

  // Crop Doctor States
  const [selectedCrop, setSelectedCrop] = useState<string>("maize");
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({
    yellow: false,
    spots: false,
    wilting: false,
    mold: false,
    bore: false,
    curl: false
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleSymptomToggle = (key: string) => {
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      toast.success(`Image "${file.name}" uploaded successfully! Ready for scanning.`);
    }
  };

  const runDiagnosis = () => {
    setIsScanning(true);
    setDiagnosis(null);

    // Simulate scanning time
    setTimeout(() => {
      setIsScanning(false);
      
      // Determine simulated diagnosis based on selected fields
      let resultKey = "maize_yellow";
      if (selectedCrop === "maize") {
        resultKey = symptoms.bore ? "maize_bore" : "maize_yellow";
      } else if (selectedCrop === "tomato") {
        resultKey = symptoms.curl ? "tomato_curl" : "tomato_spots";
      } else if (selectedCrop === "potato") {
        resultKey = "potato_wilting";
      } else {
        resultKey = "maize_yellow"; // Default
      }

      setDiagnosis(CROP_DIAGNOSES[resultKey]);
      toast.success("AI Crop Diagnosis Complete!", {
        description: `Identified pathogen with ${CROP_DIAGNOSES[resultKey].confidence} confidence.`,
      });
    }, 2800);
  };

  // Traceability States
  const [showQR, setShowQR] = useState<boolean>(false);

  return (
    <AppLayout>
      <div className="bg-[#FAF9F5] text-[#0A1E0C] min-h-screen font-sans">
        
        {/* ══════════════════════════════════════════
            LIGHT-THEMED HERO BANNER
        ══════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b border-[#0A1E0C]/5 bg-[#F4F8F5] py-20 lg:py-28">
          <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-[#52B788]/15 blur-[120px] pointer-events-none" />
          <div className="absolute right-1/4 bottom-1/4 h-[250px] w-[250px] rounded-full bg-[#F5A623]/10 blur-[100px] pointer-events-none" />

          <div className="container-px mx-auto max-w-7xl relative z-10">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              
              {/* Left Column Text */}
              <div className="lg:col-span-7 text-left space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#52B788]/15 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#409c71]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Mqulima AI-Core Active
                </div>
                
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[#0A1E0C] font-serif uppercase leading-tight">
                  Advanced <br />
                  <span className="bg-gradient-to-r from-[#2D6A4F] via-[#52B788] to-[#F5A623] bg-clip-text text-transparent">
                    Agri-Tools
                  </span>
                </h1>
                
                <p className="text-base text-[#2D3A2F]/90 max-w-xl leading-relaxed">
                  Empowering Kenyan growers with next-generation technology. Instantly scan crops for pests, monitor daily local weather alerts, map commodity price shifts, and maintain farm records.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => {
                      const el = document.getElementById("dashboard-control");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="h-12 px-6 bg-[#F5A623] hover:bg-[#e09520] text-white font-extrabold text-xs uppercase tracking-wider rounded-none transition flex items-center gap-2 shadow-md shadow-[#F5A623]/25"
                  >
                    Open Control Console
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <Link
                    to="/shop"
                    className="h-12 px-6 border border-[#0A1E0C]/20 bg-[#0A1E0C]/5 hover:bg-[#0A1E0C]/10 text-[#0A1E0C] font-bold text-xs uppercase tracking-wider rounded-none transition flex items-center justify-center"
                  >
                    Browse Supplies
                  </Link>
                </div>
              </div>

              {/* Right Column Image Banner */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative group max-w-md w-full">
                  <div className="absolute -inset-1 rounded-none bg-gradient-to-r from-[#52B788] to-[#F5A623] opacity-20 blur-lg group-hover:opacity-40 transition duration-500" />
                  
                  <div className="relative rounded-none border border-[#0A1E0C]/10 bg-white p-2 overflow-hidden shadow-xl">
                    <img
                      src={toolsHero}
                      alt="Mqulima AI Control Center Dashboard"
                      className="w-full object-cover rounded-none aspect-square scale-98 group-hover:scale-100 transition-transform duration-500"
                    />
                    
                    {/* Laser Scanner animation effect */}
                    <div className="absolute inset-x-0 h-1 bg-[#22C55E]/80 shadow-[0_0_15px_#22C55E] top-1/2 animate-bounce pointer-events-none" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TABBED INTERACTIVE CONSOLE
        ══════════════════════════════════════════ */}
        <section id="dashboard-control" className="py-16 container-px mx-auto max-w-7xl">
          
          {/* Tabs header selector */}
          <div className="flex flex-wrap border-b border-[#2D6A4F]/10 gap-1 bg-[#E9F3EC] p-1">
            <button
              onClick={() => setActiveTab("doctor")}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold uppercase tracking-wider rounded-none transition ${
                activeTab === "doctor"
                  ? "bg-[#2D6A4F] text-white"
                  : "hover:bg-[#2D6A4F]/5 text-[#2D3A2F]/80 hover:text-[#0A1E0C]"
              }`}
            >
              <Wrench className="h-4 w-4" />
              AI Crop Doctor
            </button>
            <button
              onClick={() => setActiveTab("weather")}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold uppercase tracking-wider rounded-none transition ${
                activeTab === "weather"
                  ? "bg-[#2D6A4F] text-white"
                  : "hover:bg-[#2D6A4F]/5 text-[#2D3A2F]/80 hover:text-[#0A1E0C]"
              }`}
            >
              <CloudRain className="h-4 w-4" />
              Weather & Climate
            </button>
            <button
              onClick={() => setActiveTab("markets")}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold uppercase tracking-wider rounded-none transition ${
                activeTab === "markets"
                  ? "bg-[#2D6A4F] text-white"
                  : "hover:bg-[#2D6A4F]/5 text-[#2D3A2F]/80 hover:text-[#0A1E0C]"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Wholesale Prices
            </button>
            <button
              onClick={() => setActiveTab("trace")}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-extrabold uppercase tracking-wider rounded-none transition ${
                activeTab === "trace"
                  ? "bg-[#2D6A4F] text-white"
                  : "hover:bg-[#2D6A4F]/5 text-[#2D3A2F]/80 hover:text-[#0A1E0C]"
              }`}
            >
              <QrCode className="h-4 w-4" />
              Traceability Ledger <span className="text-[8px] bg-[#F5A623] text-white px-1.5 py-0.5 rounded-none font-black ml-1">BETA</span>
            </button>
          </div>

          <div className="bg-white border-x border-b border-[#2D6A4F]/10 p-6 sm:p-10 text-left shadow-sm">
            
            {/* ──────────────────────────────────────────
                TAB 1: AI CROP DOCTOR SCANNER
            ────────────────────────────────────────── */}
            {activeTab === "doctor" && (
              <div className="grid gap-10 lg:grid-cols-12">
                
                {/* Control Panel (left) */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#0A1E0C] uppercase tracking-wider">AI Crop Diagnostic Core</h3>
                    <p className="text-xs text-[#2D3A2F]/70 mt-1 leading-relaxed">
                      Select crop family and observed symptoms or upload a crisp plant photograph. Our neural networks scan visual pathogens to recommend custom treatments.
                    </p>
                  </div>

                  {/* Crop selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-[#F5A623] tracking-wider block">1. Select Target Crop</label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#2D6A4F]/20 text-sm rounded-none p-3 text-[#0A1E0C] outline-none focus:border-[#2D6A4F]"
                    >
                      <option value="maize">Maize (Cereals)</option>
                      <option value="tomato">Tomato (Horticulture)</option>
                      <option value="potato">Irish Potato (Solanaceous Tubers)</option>
                    </select>
                  </div>

                  {/* Symptoms checkboxes */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase text-[#F5A623] tracking-wider block">2. Identify Symptoms</span>
                    <div className="grid grid-cols-2 gap-2 bg-[#FAF9F5] p-4 border border-[#2D6A4F]/15 text-xs text-[#2D3A2F]">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[#2D6A4F] py-1">
                        <input
                          type="checkbox"
                          checked={symptoms.yellow}
                          onChange={() => handleSymptomToggle("yellow")}
                          className="rounded-none border-[#2D6A4F]/30 text-[#2D6A4F] focus:ring-0 cursor-pointer h-4 w-4 accent-[#2D6A4F]"
                        />
                        Yellowing Leaves
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[#2D6A4F] py-1">
                        <input
                          type="checkbox"
                          checked={symptoms.spots}
                          onChange={() => handleSymptomToggle("spots")}
                          className="rounded-none border-[#2D6A4F]/30 text-[#2D6A4F] focus:ring-0 cursor-pointer h-4 w-4 accent-[#2D6A4F]"
                        />
                        Dark Spot Lesions
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[#2D6A4F] py-1">
                        <input
                          type="checkbox"
                          checked={symptoms.wilting}
                          onChange={() => handleSymptomToggle("wilting")}
                          className="rounded-none border-[#2D6A4F]/30 text-[#2D6A4F] focus:ring-0 cursor-pointer h-4 w-4 accent-[#2D6A4F]"
                        />
                        Sudden Wilting
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[#2D6A4F] py-1">
                        <input
                          type="checkbox"
                          checked={symptoms.mold}
                          onChange={() => handleSymptomToggle("mold")}
                          className="rounded-none border-[#2D6A4F]/30 text-[#2D6A4F] focus:ring-0 cursor-pointer h-4 w-4 accent-[#2D6A4F]"
                        />
                        White Cottony Mold
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[#2D6A4F] py-1">
                        <input
                          type="checkbox"
                          checked={symptoms.bore}
                          onChange={() => handleSymptomToggle("bore")}
                          className="rounded-none border-[#2D6A4F]/30 text-[#2D6A4F] focus:ring-0 cursor-pointer h-4 w-4 accent-[#2D6A4F]"
                        />
                        Stalk Holes / Borers
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-[#2D6A4F] py-1">
                        <input
                          type="checkbox"
                          checked={symptoms.curl}
                          onChange={() => handleSymptomToggle("curl")}
                          className="rounded-none border-[#2D6A4F]/30 text-[#2D6A4F] focus:ring-0 cursor-pointer h-4 w-4 accent-[#2D6A4F]"
                        />
                        Leaf Curling
                      </label>
                    </div>
                  </div>

                  {/* Upload Image Section */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-[#F5A623] tracking-wider block">3. Add Plant Picture (Optional)</span>
                    <div className="border border-dashed border-[#2D6A4F]/40 bg-[#FAF9F5] hover:bg-[#E9F3EC]/40 transition p-6 rounded-none text-center relative flex flex-col items-center justify-center cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="h-8 w-8 text-[#2D6A4F] mb-2 group-hover:scale-105 transition" />
                      <span className="text-xs font-bold text-[#0A1E0C] block">
                        {fileName ? fileName : "Click to select or drop image"}
                      </span>
                      <span className="text-[10px] text-[#2D3A2F]/50 mt-1 block">Supports JPEG, PNG up to 10MB</span>
                    </div>
                  </div>

                  {/* Diagnostic Trigger Button */}
                  <button
                    onClick={runDiagnosis}
                    disabled={isScanning}
                    className="w-full h-12 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs uppercase tracking-widest rounded-none transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <ScanLine className="h-4 w-4 animate-spin" />
                        Scanning plant canopy...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Execute Diagnostics Check
                      </>
                    )}
                  </button>
                </div>

                {/* Diagnostics Monitor screen (right) */}
                <div className="lg:col-span-7 flex flex-col justify-start">
                  <div className="bg-[#FAF9F5] border border-[#2D6A4F]/20 p-6 min-h-[420px] rounded-none flex flex-col relative justify-between overflow-hidden shadow-inner">
                    
                    {/* Futuristic scan grid backdrop */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(45,106,79,0.03)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(45,106,79,0.03)_1px,_transparent_1px)] bg-[size:20px_20px] opacity-70 pointer-events-none" />

                    {/* Scan Line Animation Overlay */}
                    {isScanning && (
                      <div className="absolute inset-x-0 h-1 bg-[#22C55E] shadow-[0_0_15px_#22C55E] z-20 pointer-events-none" style={{
                        animation: 'scan 2.8s linear infinite',
                        top: '0%'
                      }} />
                    )}

                    {!isScanning && !diagnosis && (
                      <div className="my-auto text-center space-y-4 max-w-sm mx-auto py-12 relative z-10">
                        <div className="grid h-14 w-14 place-items-center bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-[#2D6A4F] mx-auto rounded-none">
                          <Database className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#0A1E0C]">Diagnostics Awaiting Trigger</h4>
                        <p className="text-xs text-[#2D3A2F]/60 leading-relaxed">
                          Configure crop variables and symptoms on the left to initialize the scanning laser matrices and read recommendations.
                        </p>
                      </div>
                    )}

                    {isScanning && (
                      <div className="my-auto text-center space-y-4 max-w-sm mx-auto py-12 relative z-10">
                        <div className="h-10 w-10 border-2 border-t-[#2D6A4F] border-[#2D6A4F]/20 rounded-full animate-spin mx-auto" />
                        <h4 className="text-sm font-bold uppercase tracking-widest text-[#2D6A4F] animate-pulse">Running Neural Analytics...</h4>
                        <p className="text-[11px] text-[#2D3A2F]/70 leading-relaxed">
                          Analyzing visual chlorosis indexes, edge distortions, and leaf necrotic cells compared against Kenyan crop pathogen databases.
                        </p>
                      </div>
                    )}

                    {!isScanning && diagnosis && (
                      <div className="space-y-6 relative z-10 text-left">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2D6A4F]/15 pb-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-[#F5A623] tracking-widest block">AI Identification Result</span>
                            <h4 className="text-base font-extrabold text-[#2D6A4F] mt-0.5 uppercase tracking-wide">{diagnosis.disease}</h4>
                          </div>
                          <div className="bg-[#E9F3EC] border border-[#2D6A4F]/20 px-3 py-1.5 text-center rounded-none">
                            <span className="text-[8px] font-bold text-[#2D3A2F]/60 block uppercase">Confidence</span>
                            <strong className="text-sm font-black text-[#2D6A4F] font-mono">{diagnosis.confidence}</strong>
                          </div>
                        </div>

                        <div className="space-y-4 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-[#2D3A2F]/50 uppercase block">Disease Description:</span>
                            <p className="text-[#0A1E0C]/90 mt-1 leading-relaxed bg-[#E9F3EC]/30 border border-[#2D6A4F]/10 p-3 rounded-none">
                              {diagnosis.description}
                            </p>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="bg-white border border-[#2D6A4F]/15 p-3.5">
                              <span className="text-[9px] font-black text-[#2D6A4F] uppercase tracking-wide block">🌱 Organic Treatment</span>
                              <p className="text-[11px] text-[#2D3A2F]/80 mt-1.5 leading-relaxed">{diagnosis.treatmentOrganic}</p>
                            </div>
                            <div className="bg-white border border-[#2D6A4F]/15 p-3.5">
                              <span className="text-[9px] font-black text-[#F5A623] uppercase tracking-wide block">🧪 Chemical Counter-measures</span>
                              <p className="text-[11px] text-[#2D3A2F]/80 mt-1.5 leading-relaxed">{diagnosis.treatmentChemical}</p>
                            </div>
                          </div>

                          {/* Recommended Agrovet Products list */}
                          <div className="border-t border-[#2D6A4F]/15 pt-4 space-y-3">
                            <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider block">Recommended Agrovet Solutions</span>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {diagnosis.recommendedProducts.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white border border-[#2D6A4F]/15 p-2.5">
                                  <div>
                                    <strong className="text-[11px] text-[#0A1E0C] block leading-snug">{p.name}</strong>
                                    <span className="text-[10px] font-mono text-[#2D6A4F] font-bold">{p.price}</span>
                                  </div>
                                  <Link
                                    to="/shop"
                                    className="px-3.5 py-1.5 bg-[#F5A623] hover:bg-[#e09520] text-white text-[9px] font-black uppercase tracking-wider transition rounded-none shrink-0"
                                  >
                                    Shop
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

            {/* ──────────────────────────────────────────
                TAB 2: WEATHER & CLIMATE ADVISORY
            ────────────────────────────────────────── */}
            {activeTab === "weather" && (
              <div className="space-y-10">
                
                {/* Weather county headers */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2D6A4F]/15 pb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#0A1E0C] uppercase tracking-wider">County Weather Alerts & advisories</h3>
                    <p className="text-xs text-[#2D3A2F]/70 mt-1">Select your county to fetch satellite-derived agro-meteorological advisory reports.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#F5A623] uppercase">County:</span>
                    <select
                      value={selectedCounty}
                      onChange={(e) => setSelectedCounty(e.target.value)}
                      className="bg-[#FAF9F5] border border-[#2D6A4F]/20 text-xs rounded-none px-4 py-2 text-[#0A1E0C] outline-none focus:border-[#2D6A4F] font-extrabold cursor-pointer"
                    >
                      {Object.keys(COUNTY_WEATHER).map((cName) => (
                        <option key={cName} value={cName}>{cName} County</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dashboard Metrics grid */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div className="bg-[#FAF9F5] border border-[#2D6A4F]/15 p-5 rounded-none flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-[#2D6A4F] grid place-items-center">
                      <Thermometer className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#2D3A2F]/60 block uppercase">Air Temp</span>
                      <strong className="text-lg font-black font-mono text-[#0A1E0C] mt-0.5 block">{weather.temp}</strong>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F5] border border-[#2D6A4F]/15 p-5 rounded-none flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] grid place-items-center">
                      <Thermometer className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#2D3A2F]/60 block uppercase">Soil Temp (10cm)</span>
                      <strong className="text-lg font-black font-mono text-[#F5A623] mt-0.5 block">{weather.soilTemp}</strong>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F5] border border-[#2D6A4F]/15 p-5 rounded-none flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-[#2D6A4F] grid place-items-center">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#2D3A2F]/60 block uppercase">Rel. Humidity</span>
                      <strong className="text-lg font-black font-mono text-[#0A1E0C] mt-0.5 block">{weather.humidity}</strong>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F5] border border-[#2D6A4F]/15 p-5 rounded-none flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-[#2D6A4F] grid place-items-center">
                      <CloudRain className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-[#2D3A2F]/60 block uppercase">Rain Probability</span>
                      <strong className="text-lg font-black font-mono text-[#0A1E0C] mt-0.5 block">{weather.rainProb}</strong>
                    </div>
                  </div>
                </div>

                {/* Weather Advisory text details */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-[#E9F3EC]/50 border border-[#2D6A4F]/15 p-6 rounded-none space-y-4">
                    <div className="flex items-center gap-2 text-[#2D6A4F] font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" />
                      Agronomical Recommendation
                    </div>
                    <p className="text-xs text-[#0A1E0C] leading-relaxed">
                      {weather.advisory}
                    </p>
                    <div className="text-[10px] text-[#2D3A2F]/50 leading-relaxed border-t border-[#2D6A4F]/10 pt-4">
                      *Satellites query microclimatic moisture indices once every 6 hours. Recalibrating coordinates.
                    </div>
                  </div>

                  <div className="bg-[#E9F3EC]/50 border border-[#2D6A4F]/15 p-6 rounded-none space-y-4">
                    <div className="flex items-center gap-2 text-[#F5A623] font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="h-4 w-4" />
                      Extreme Climatic Alert Feed
                    </div>
                    <ul className="space-y-2 text-xs">
                      {weather.alerts.map((alert, idx) => (
                        <li key={idx} className="bg-amber-50 border border-amber-200 p-3 text-amber-600 rounded-none font-bold">
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Soil moisture interactive simulator */}
                <div className="border-t border-[#2D6A4F]/15 pt-8 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-[#0A1E0C] uppercase tracking-wider">Interactive Soil Moisture Calibration Simulator</h4>
                    <p className="text-[11px] text-[#2D3A2F]/60 mt-1">Calibrate hypothetical soil moisture levels to test advisory logic outcomes.</p>
                  </div>

                  <div className="bg-[#FAF9F5] border border-[#2D6A4F]/15 p-6 rounded-none space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-[#0A1E0C]">
                        <span>Soil Moisture Level</span>
                        <span className="font-mono text-[#2D6A4F]">{soilMoisture}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={soilMoisture}
                        onChange={(e) => setSoilMoisture(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-[#E9F3EC] rounded-lg appearance-none cursor-pointer accent-[#2D6A4F]"
                      />
                      <div className="flex justify-between text-[9px] text-[#2D3A2F]/50">
                        <span>10% (Critically dry sand)</span>
                        <span>50% (Ideal silt)</span>
                        <span>90% (Saturated loam)</span>
                      </div>
                    </div>

                    <div className={`border p-4 rounded-none text-xs leading-relaxed space-y-1.5 ${soilAdvisory.color}`}>
                      <strong className="text-xs font-extrabold uppercase block tracking-wider">Status: {soilAdvisory.status}</strong>
                      <p className="text-[11px] opacity-90">{soilAdvisory.text}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ──────────────────────────────────────────
                TAB 3: WHOLESALE MARKET PRICE INDEX
            ────────────────────────────────────────── */}
            {activeTab === "markets" && (
              <div className="space-y-6">
                
                {/* Search filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#2D6A4F]/15 pb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#0A1E0C] uppercase tracking-wider">Wholesale Produce Price Tracker</h3>
                    <p className="text-xs text-[#2D3A2F]/70 mt-1">Real-time daily wholesale prices mapped across key trading hubs in Kenya.</p>
                  </div>
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="Search crops..."
                      value={marketSearch}
                      onChange={(e) => setMarketSearch(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#2D6A4F]/20 text-xs rounded-none pl-9 pr-4 py-2.5 text-[#0A1E0C] outline-none focus:border-[#2D6A4F]"
                    />
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-[#2D3A2F]/40" />
                  </div>
                </div>

                {/* Commodities Grid list */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCommodities.length > 0 ? (
                    filteredCommodities.map((c) => (
                      <div key={c.id} className="bg-white border border-[#2D6A4F]/15 p-5 rounded-none space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] font-bold text-[#2D6A4F] uppercase tracking-wider block">{c.category}</span>
                            <h4 className="text-sm font-bold text-[#0A1E0C] mt-0.5">{c.name}</h4>
                            <span className="text-[10px] text-[#2D3A2F]/60 block mt-0.5">Unit size: {c.bagSize}</span>
                          </div>
                          
                          {/* Change badge */}
                          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-none ${
                            c.trend === "up" 
                              ? "bg-green-50 text-green-700 border border-green-200" 
                              : c.trend === "down"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}>
                            {c.trend === "up" && <TrendingUp className="h-3 w-3" />}
                            {c.trend === "down" && <TrendingDown className="h-3 w-3" />}
                            {c.change}
                          </div>
                        </div>

                        {/* Wholesale market indexes */}
                        <div className="space-y-2 border-t border-[#2D6A4F]/10 pt-3 text-xs">
                          <div className="flex justify-between text-[#2D3A2F]">
                            <span>Nairobi (Wakulima)</span>
                            <span className="font-mono font-bold text-[#0A1E0C]">KES {c.nairobi.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[#2D3A2F]">
                            <span>Eldoret (Main Market)</span>
                            <span className="font-mono font-bold text-[#0A1E0C]">KES {c.eldoret.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[#2D3A2F]">
                            <span>Nakuru (Municipal)</span>
                            <span className="font-mono font-bold text-[#0A1E0C]">KES {c.nakuru.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Custom mockup graph visualizations */}
                        <div className="h-8 flex items-end gap-1 pt-2 w-full">
                          <div className="bg-[#2D6A4F]/20 hover:bg-[#2D6A4F] transition h-[50%] flex-1 rounded-none" title="Nairobi" />
                          <div className="bg-[#2D6A4F]/20 hover:bg-[#2D6A4F] transition h-[35%] flex-1 rounded-none" title="Eldoret" />
                          <div className="bg-[#2D6A4F]/20 hover:bg-[#2D6A4F] transition h-[70%] flex-1 rounded-none" title="Nakuru" />
                          <div className="bg-[#2D6A4F]/20 hover:bg-[#2D6A4F] transition h-[45%] flex-1 rounded-none" title="Kisumu" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-xs text-[#2D3A2F]/50">
                      No commodities found matching search criteria.
                    </div>
                  )}
                </div>

                <div className="bg-[#E9F3EC]/50 border border-[#2D6A4F]/15 p-4 text-[10px] text-[#2D3A2F]/60 leading-relaxed">
                  *Market prices represent estimated averages validated daily by local County Market Inspectors. High demand and seasonal rain factors affect price deviations.
                </div>

              </div>
            )}

            {/* ──────────────────────────────────────────
                TAB 4: LEDGER & TRACEABILITY (COMING SOON)
            ────────────────────────────────────────── */}
            {activeTab === "trace" && (
              <div className="space-y-8 max-w-3xl">
                
                <div className="space-y-2 border-b border-[#2D6A4F]/15 pb-6">
                  <span className="inline-flex items-center gap-1.5 bg-[#F5A623]/10 border border-[#F5A623]/30 px-2 py-0.5 text-[9px] font-black uppercase text-[#F5A623] tracking-wide rounded-none">
                    Under Development
                  </span>
                  <h3 className="text-lg font-bold text-[#0A1E0C] uppercase tracking-wider">Record Keeping & Traceability Platform</h3>
                  <p className="text-xs text-[#2D3A2F]/70 leading-relaxed">
                    Build consumer trust and unlock premium export markets. We are constructing a simplified ledger where you log farm inputs, seeding dates, and spraying schedules to generate export-ready QR codes.
                  </p>
                </div>

                {/* Dashboard layout mockup preview */}
                <div className="bg-[#FAF9F5] border border-[#2D6A4F]/20 p-6 rounded-none space-y-6 relative overflow-hidden blur-xs select-none">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="border border-[#2D6A4F]/20 bg-white p-4 space-y-2">
                      <span className="text-[9px] text-[#2D6A4F] uppercase block font-bold">Active Crop Batches</span>
                      <strong className="text-sm text-[#0A1E0C] block">Maize Batch #H6213-NKR</strong>
                      <div className="h-1.5 w-full bg-[#E9F3EC]">
                        <div className="bg-[#2D6A4F] h-1.5 w-[65%]" />
                      </div>
                      <span className="text-[10px] text-[#2D3A2F]/50 block">Progress: 45 Days (Vegetative)</span>
                    </div>

                    <div className="border border-[#2D6A4F]/20 bg-white p-4 space-y-2">
                      <span className="text-[9px] text-[#F5A623] uppercase block font-bold">Chemical Application Log</span>
                      <strong className="text-sm text-[#0A1E0C] block">Copper Fungicide Sprayed</strong>
                      <span className="text-[10px] text-[#2D3A2F]/50 block">Last logged: 4 Days ago</span>
                      <span className="text-[10px] text-[#2D6A4F] block font-bold">✓ PHI Compliance Valid</span>
                    </div>
                  </div>
                </div>

                {/* Interactive overlay card (non-blurred) */}
                <div className="bg-[#E9F3EC]/50 border border-[#2D6A4F]/25 p-6 rounded-none space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-[#2D6A4F] rounded-none">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0A1E0C] uppercase tracking-wide">Traceability Passport Preview</h4>
                      <p className="text-xs text-[#2D3A2F]/70 mt-1 leading-relaxed">
                        Test the generated traceability card mockup below. Buyers scanning this QR code will see chemical logs and organic verification certificates.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowQR(!showQR);
                      if (!showQR) toast.success("Simulated Traceability passport generated successfully!");
                    }}
                    className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-xs font-bold text-white uppercase tracking-wider rounded-none transition"
                  >
                    {showQR ? "Hide Preview" : "Simulate QR Code Generation"}
                  </button>

                  {showQR && (
                    <div className="border border-[#2D6A4F]/20 bg-white p-6 max-w-sm mx-auto rounded-none text-center space-y-4 animate-fadeIn shadow-md">
                      <div className="bg-white p-4 inline-block rounded-none border border-[#2D6A4F]/30">
                        {/* Mock QR image */}
                        <div className="h-36 w-36 bg-[#FAF9F5] flex items-center justify-center text-gray-500 font-mono text-xs relative">
                          <QrCode className="h-28 w-28 text-[#0B150F]" />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-[#2D6A4F] uppercase block tracking-wider">MQULIMA PASSPORT REGISTERED</span>
                        <h5 className="text-xs font-bold text-[#0A1E0C] uppercase">Farm: Kiprono Holdings Ltd, Nakuru</h5>
                        <p className="text-[10px] text-[#2D3A2F]/70 leading-relaxed">
                          Verified certified hybrid seed batch. PHI spraying records compliant under KEPHIS export guidelines.
                        </p>
                      </div>
                      
                      <div className="border-t border-[#2D6A4F]/10 pt-3 flex items-center justify-center gap-1.5 text-[9px] text-[#2D6A4F] font-bold">
                        <ShieldCheck className="h-4 w-4" />
                        SECURED ON INTEGRATED LEDGER
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </section>

      </div>
    </AppLayout>
  );
}
