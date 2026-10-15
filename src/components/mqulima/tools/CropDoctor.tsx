// ============================================================================
// CropDoctor.tsx — Mqulima AI Crop Doctor
// Simplified, Vibrant, Color-Rich Agricultural Intelligence Interface
// ============================================================================

import { useState, useRef, useEffect, useMemo } from "react";
import {
  UploadCloud,
  ScanLine,
  Sparkles,
  X,
  Bot,
  Send,
  Leaf,
  Droplets,
  Sun,
  CheckCircle2,
  Camera,
  ShoppingBag,
  ArrowRight,
  Check,
  Stethoscope,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  runAIPathogenDiagnostics,
  askAICropDoctorChat,
} from "@/lib/api/crop-doctor.server";
import { useAuth } from "@/hooks/useAuth";
import { AuthPromptModal } from "@/components/mqulima/AuthPromptModal";

export type DiagnosisResult = {
  id: string | null;
  crop: string;
  scientificName?: string;
  disease: string;
  scientificDisease: string;
  confidence: number;
  severity: string;
  organicTreatment: string[];
  chemicalTreatment: string[];
  ipmRecommendations: string[];
  weatherAdvice: string[];
  recommendedProducts: { name: string; price: string; slug: string }[];
  summary?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

// Kenyan Target Crops with Vibrant Colors & Emojis
const CROPS = [
  { value: "maize", label: "Maize (Mahindi)", emoji: "🌽", color: "from-amber-400 to-yellow-500", border: "border-amber-300" },
  { value: "tomato", label: "Tomato (Nyanya)", emoji: "🍅", color: "from-rose-500 to-red-600", border: "border-rose-300" },
  { value: "potato", label: "Irish Potato (Viazi)", emoji: "🥔", color: "from-amber-600 to-orange-700", border: "border-amber-400" },
  { value: "kale", label: "Sukuma Wiki / Kale", emoji: "🥬", color: "from-emerald-500 to-green-600", border: "border-emerald-300" },
  { value: "coffee", label: "Coffee (Kahawa)", emoji: "☕", color: "from-amber-800 to-yellow-900", border: "border-amber-700" },
  { value: "beans", label: "Beans (Maharagwe)", emoji: "🫘", color: "from-purple-500 to-indigo-600", border: "border-purple-300" },
  { value: "cabbage", label: "Cabbage (Kabeji)", emoji: "🥗", color: "from-teal-500 to-emerald-600", border: "border-teal-300" },
  { value: "avocado", label: "Avocado", emoji: "🥑", color: "from-lime-500 to-emerald-600", border: "border-lime-300" },
];

// 4 Colorful Sample Leaf Specimens for 1-Click Testing
const SAMPLE_SPECIMENS = [
  {
    id: "sample-maize",
    crop: "maize",
    title: "Maize: Armyworm",
    emoji: "🌽",
    color: "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100",
    badgeColor: "bg-amber-200 text-amber-900",
    symptomName: "Windowed leaf funnels & holes",
    svgBackground: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23fef3c7"/><path d="M50,380 C150,220 280,120 550,50 C450,180 320,290 120,380 Z" fill="%2365a30d"/><path d="M120,350 Q300,180 500,80" stroke="%2384cc16" stroke-width="6" fill="none"/><circle cx="280" cy="180" r="18" fill="%2378350f"/><circle cx="340" cy="140" r="14" fill="%2378350f"/><circle cx="210" cy="240" r="12" fill="%2378350f"/><text x="40" y="50" fill="%2378350f" font-family="sans-serif" font-size="22" font-weight="bold">🌽 MAIZE SPECIMEN (FALL ARMYWORM)</text><text x="40" y="80" fill="%2392400e" font-family="sans-serif" font-size="14">Notice the shredded holes and frass in the whorl</text></svg>`,
  },
  {
    id: "sample-tomato",
    crop: "tomato",
    title: "Tomato: Blight",
    emoji: "🍅",
    color: "bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100",
    badgeColor: "bg-rose-200 text-rose-900",
    symptomName: "Dark water-soaked rot spots",
    svgBackground: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23ffe4e6"/><path d="M100,200 C150,50 350,70 480,200 C350,330 150,350 100,200 Z" fill="%2316a34a"/><ellipse cx="280" cy="190" rx="60" ry="40" fill="%234c0519" stroke="%23f43f5e" stroke-width="4"/><ellipse cx="380" cy="160" rx="40" ry="25" fill="%234c0519" stroke="%23f43f5e" stroke-width="3"/><text x="40" y="50" fill="%239f1239" font-family="sans-serif" font-size="22" font-weight="bold">🍅 TOMATO SPECIMEN (LATE BLIGHT)</text><text x="40" y="80" fill="%23881337" font-family="sans-serif" font-size="14">Notice rapid spreading water-soaked necrotic rot</text></svg>`,
  },
  {
    id: "sample-potato",
    crop: "potato",
    title: "Potato: Wilt",
    emoji: "🥔",
    color: "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100",
    badgeColor: "bg-emerald-200 text-emerald-900",
    symptomName: "Rapid daytime wilting",
    svgBackground: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23ecfdf5"/><path d="M120,100 Q250,220 280,380" stroke="%2315803d" stroke-width="12" fill="none"/><path d="M280,200 C360,180 440,260 400,320 C340,300 300,240 280,200 Z" fill="%2384cc16" opacity="0.8"/><text x="40" y="50" fill="%23065f46" font-family="sans-serif" font-size="22" font-weight="bold">🥔 POTATO SPECIMEN (BACTERIAL WILT)</text><text x="40" y="80" fill="%23047857" font-family="sans-serif" font-size="14">Sudden wilting of green leaves despite moist soil</text></svg>`,
  },
  {
    id: "sample-coffee",
    crop: "coffee",
    title: "Coffee: Rust",
    emoji: "☕",
    color: "bg-orange-50 border-orange-300 text-orange-900 hover:bg-orange-100",
    badgeColor: "bg-orange-200 text-orange-900",
    symptomName: "Orange powdery spots",
    svgBackground: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23fff7ed"/><path d="M80,200 C200,60 400,60 520,200 C400,340 200,340 80,200 Z" fill="%2315803d"/><circle cx="220" cy="180" r="18" fill="%23ea580c"/><circle cx="280" cy="230" r="22" fill="%23ea580c"/><circle cx="360" cy="170" r="16" fill="%23ea580c"/><text x="40" y="50" fill="%239a3412" font-family="sans-serif" font-size="22" font-weight="bold">☕ COFFEE SPECIMEN (LEAF RUST)</text><text x="40" y="80" fill="%23c2410c" font-family="sans-serif" font-size="14">Bright orange-yellow powdery pustules on underside</text></svg>`,
  },
];

// Quick chatbot starter suggestions
const CHAT_PROMPTS = [
  "🌿 How to prepare organic neem spray?",
  "💧 Is it safe to spray before rain?",
  "🌽 Maize Armyworm exact dosage?",
  "🍅 Prevent tomato blossom end rot",
];

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function CropDoctor({ weatherState }: { weatherState?: any }) {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Mode switcher: "scan" | "chat"
  const [activeMode, setActiveMode] = useState<"scan" | "chat">("scan");

  // Simple Inputs
  const [selectedCrop, setSelectedCrop] = useState("maize");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [farmerNotes, setFarmerNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Diagnostic State
  const [isScanning, setIsScanning] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "intro-1",
      role: "assistant",
      content:
        "Habari! I am **Daktari wa Mimea**, your AI farm doctor. Ask me any question about plant diseases, pest control, chemical spray dosage, or organic remedies.",
      timestamp: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // Contextual weather
  const county = weatherState?.location?.type === "county" ? weatherState.location.county : "Nairobi";
  const currentTemp = weatherState?.data?.current?.temperature_2m ?? 24;
  const rainProb = weatherState?.data?.daily?.[0]?.precipitationProbMax ?? 20;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP photo.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setImageFile(file);
    setActiveSampleId(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      toast.success(`Photo "${file.name}" loaded successfully.`);
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (sample: typeof SAMPLE_SPECIMENS[0]) => {
    setImageFile(null);
    setImagePreview(sample.svgBackground);
    setActiveSampleId(sample.id);
    setSelectedCrop(sample.crop);
    setFarmerNotes(sample.symptomName);
    toast.success(`Loaded sample: ${sample.title}`, {
      description: "Click 'Scan & Prescribe Treatment' below to see the result!",
    });
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setActiveSampleId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runDiagnosis = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!imagePreview && !farmerNotes.trim()) {
      toast.warning("Please upload a leaf photo or pick a sample specimen first!");
      return;
    }

    setIsScanning(true);
    setDiagnosis(null);

    const current = weatherState?.data?.current;
    const dailyToday = weatherState?.data?.daily?.[0];
    const currentWeather = current
      ? {
          temperature: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          rainProbability: dailyToday ? dailyToday.precipitationProbMax : 0,
          windSpeed: current.wind_speed_10m,
        }
      : undefined;

    try {
      const result = await runAIPathogenDiagnostics({
        data: {
          crop: selectedCrop,
          symptoms: { [farmerNotes || "foliar_symptoms"]: true },
          imageFileName: imageFile?.name || (activeSampleId ? `${activeSampleId}.svg` : undefined),
          imageBase64: imagePreview || undefined,
          county,
          currentWeather,
          farmerQuestion: farmerNotes || undefined,
        },
      });

      setDiagnosis(result as DiagnosisResult);
      toast.success("AI Plant Scan Complete!", {
        description: `Found ${result.disease} (${result.confidence}% accuracy).`,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Diagnostic scan failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSendChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetText) setChatInput("");
    setIsChatLoading(true);

    try {
      const historyPayload = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askAICropDoctorChat({
        data: {
          message: userMsg.content,
          crop: selectedCrop,
          county,
          currentDiagnosis: diagnosis || undefined,
          history: historyPayload,
        },
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error("AI response error. Please try again.");
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-2 text-left font-['Plus_Jakarta_Sans',sans-serif] space-y-6">

      {/* ── 1. VIBRANT, BEAUTIFUL HERO BANNER ──────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0D3823] via-[#124B2F] to-[#19633E] p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/15 relative overflow-hidden">
        {/* Soft decorative background glows */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#85CC14]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-[#A7F3D0]">
              <Sparkles className="h-3.5 w-3.5 text-[#85CC14]" />
              <span>Smart Agricultural Diagnostics</span>
              <span className="text-white/40">•</span>
              <span className="text-white">{county} County</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit',sans-serif] tracking-tight">
              🌱 Mqulima AI Crop Doctor
            </h2>
            <p className="text-xs sm:text-sm text-white/85 max-w-xl leading-relaxed">
              Snap a leaf photo or pick a sample crop below to detect diseases instantly and receive organic & agrovet prescriptions.
            </p>
          </div>

          {/* Simple Mode Toggle */}
          <div className="flex items-center gap-2 bg-[#072013]/90 p-1.5 rounded-2xl border border-white/15 shrink-0 self-start md:self-center shadow-lg">
            <button
              onClick={() => setActiveMode("scan")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === "scan"
                  ? "bg-gradient-to-r from-[#85CC14] to-[#65A30D] text-[#071910] shadow-md shadow-[#85CC14]/30"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Photo Diagnosis</span>
            </button>

            <button
              onClick={() => setActiveMode("chat")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeMode === "chat"
                  ? "bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-md shadow-sky-500/30"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>Ask AI Daktari</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. MODE: PHOTO DIAGNOSIS (SIMPLIFIED & COLORFUL) ──────────────── */}
      {activeMode === "scan" && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">

          {/* Left Column: Photo & Crop Selection (5 cols) */}
          <div className="lg:col-span-5 space-y-4">

            {/* Step 1: Upload Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">1</span>
                  Plant Photo / Specimen
                </span>
                {imagePreview && (
                  <button
                    onClick={clearImage}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md group">
                  <img src={imagePreview} alt="Selected Specimen" className="w-full h-44 object-cover" />
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-full bg-black/75 text-white text-xs font-bold hover:bg-black transition cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 transition rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition shadow-sm">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <strong className="text-sm font-bold text-emerald-950 font-['Outfit',sans-serif]">
                    Take or Upload Leaf Photo
                  </strong>
                  <span className="text-[11px] text-emerald-700/70 mt-0.5">
                    Click here to browse phone camera or files
                  </span>
                </div>
              )}

              {/* 1-Click Sample Pills */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Or test with 1-click sample cases:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_SPECIMENS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadSample(s)}
                      className={`p-2 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer active:scale-95 ${s.color} ${
                        activeSampleId === s.id ? "ring-2 ring-emerald-500 shadow-xs" : ""
                      }`}
                    >
                      <span className="truncate">{s.emoji} {s.title}</span>
                      <span className={`text-[9px] px-1 py-0.5 rounded font-black ${s.badgeColor}`}>
                        TEST
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Crop Picker & Scan Button */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/50 space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">2</span>
                Choose Crop Species
              </span>

              {/* Colorful Crop Pills */}
              <div className="grid grid-cols-2 gap-2">
                {CROPS.map((c) => {
                  const isSelected = selectedCrop === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => setSelectedCrop(c.value)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-left flex items-center gap-2 cursor-pointer active:scale-95 ${
                        isSelected
                          ? `bg-gradient-to-r ${c.color} text-white font-black shadow-md border-transparent`
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-base shrink-0">{c.emoji}</span>
                      <span className="truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* BIG VIBRANT ACTION BUTTON */}
              <button
                onClick={runDiagnosis}
                disabled={isScanning}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#85CC14] via-[#10B981] to-[#059669] hover:brightness-105 text-white font-black text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isScanning ? (
                  <>
                    <ScanLine className="h-5 w-5 animate-spin" />
                    <span>Analyzing Plant Tissue...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-yellow-200" />
                    <span>Scan & Prescribe Treatment</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column: Diagnostic Results Screen (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 min-h-[500px] flex flex-col justify-between">
              
              {/* Standby State */}
              {!isScanning && !diagnosis && (
                <div className="my-auto py-12 text-center space-y-4 max-w-md mx-auto">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-100 to-lime-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <Stethoscope className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-800 font-['Outfit',sans-serif]">
                      Ready to Diagnose Your Plants
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Upload a leaf photo or pick one of the sample test cases on the left. The AI checks visual symptoms against verified Kenyan pathogen databases.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-100">
                      <span className="text-base block mb-0.5">🌿</span>
                      <strong className="text-[11px] block">Organic Cure</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-100">
                      <span className="text-base block mb-0.5">🧪</span>
                      <strong className="text-[11px] block">Agrovet Spray</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50 text-sky-900 border border-sky-100">
                      <span className="text-base block mb-0.5">🌦️</span>
                      <strong className="text-[11px] block">Safe Weather</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanning State */}
              {isScanning && (
                <div className="my-auto py-16 text-center space-y-4">
                  <div className="h-20 w-20 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto flex items-center justify-center">
                    <ScanLine className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <strong className="text-base font-black text-slate-800 block">
                      AI is Diagnosing Specimen...
                    </strong>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Comparing foliar tissue damage against East African disease models.
                    </span>
                  </div>
                </div>
              )}

              {/* RESULTS SCREEN (COLORFUL, BEAUTIFUL & SIMPLE) */}
              {!isScanning && diagnosis && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Diagnosis Header */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                          AI IDENTIFICATION
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {diagnosis.crop}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-emerald-950 font-['Outfit',sans-serif] mt-1">
                        {diagnosis.disease}
                      </h3>
                      {diagnosis.scientificDisease && (
                        <p className="text-xs text-emerald-700 italic">
                          Scientific name: {diagnosis.scientificDisease}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-center shadow-sm">
                        <span className="text-[9px] uppercase font-bold block opacity-80">Certainty</span>
                        <strong className="text-base font-black font-mono">{diagnosis.confidence}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* 3 DISTINCT VIBRANT SOLUTION BLOCKS */}
                  <div className="space-y-3">
                    
                    {/* 1. Organic Remedy Box (Vibrant Fresh Green) */}
                    <div className="p-4 rounded-2xl bg-[#F0FDF4] border-2 border-emerald-200 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900">
                        <span className="text-lg">🌿</span>
                        <h4 className="text-xs font-black uppercase tracking-wider font-['Outfit',sans-serif]">
                          Organic & Cultural Treatment (Immediate)
                        </h4>
                      </div>
                      <ul className="space-y-1.5 text-xs text-emerald-950">
                        {diagnosis.organicTreatment?.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 2. Agrovet Dawa / Chemical Spray (Vibrant Amber/Yellow) */}
                    {diagnosis.chemicalTreatment?.length > 0 && (
                      <div className="p-4 rounded-2xl bg-[#FFFBEB] border-2 border-amber-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-950">
                            <span className="text-lg">🧪</span>
                            <h4 className="text-xs font-black uppercase tracking-wider font-['Outfit',sans-serif]">
                              Agrovet Medicine & Dosage
                            </h4>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                            Dawa ya Kunyunyizia
                          </span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-amber-950">
                          {diagnosis.chemicalTreatment?.slice(0, 2).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Direct Shop Link */}
                        <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                          <span className="text-[11px] text-amber-900 font-medium">Buy verified remedies:</span>
                          <Link
                            to="/shop"
                            className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm hover:brightness-105 inline-flex items-center gap-1"
                          >
                            <ShoppingBag className="h-3 w-3" />
                            <span>Browse Agrovet Shop</span>
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* 3. Spraying Weather Radar (Soft Sky Blue) */}
                    <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-sky-200 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                        <Sun className="h-5 w-5" />
                      </div>
                      <div className="text-xs text-sky-950">
                        <strong className="block font-bold">
                          {rainProb > 40 ? "⚠️ Delay Spraying — High Rain Probability Today" : "✅ Favorable Spraying Weather in " + county}
                        </strong>
                        <span className="text-sky-700/80 text-[11px]">
                          Current: {currentTemp}°C • {rainProb}% Rain Risk • Apply early morning or late afternoon.
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Ask AI Follow-up Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 font-medium">
                      Need custom guidance on mixing ratios or recovery times?
                    </span>
                    <button
                      onClick={() => {
                        setActiveMode("chat");
                        handleSendChat(`What is the step-by-step home organic preparation for treating ${diagnosis.disease} on my ${diagnosis.crop}?`);
                      }}
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>Chat with AI Daktari →</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ── 3. MODE: AI AGRONOMIST CHATBOT (CLEAN & COLORFUL) ─────────────── */}
      {activeMode === "chat" && (
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 p-5 sm:p-7 flex flex-col h-[580px]">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-['Outfit',sans-serif]">
                  Daktari wa Mimea · AI Farm Doctor
                </h3>
                <span className="text-xs text-emerald-700 font-medium">
                  Online • Specialized in Kenyan Crops & Agronomy
                </span>
              </div>
            </div>

            {diagnosis && (
              <span className="hidden sm:inline-block text-xs bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-full">
                Context: {diagnosis.disease}
              </span>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="py-2.5 flex gap-2 overflow-x-auto scrollbar-none border-b border-slate-100">
            {CHAT_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(prompt)}
                disabled={isChatLoading}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Message Thread */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {chatMessages.map((msg) => {
              const isAI = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-2xl ${isAI ? "" : "ml-auto flex-row-reverse"}`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAI ? "bg-sky-100 text-sky-700" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isAI ? "AI" : "YOU"}
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isAI
                        ? "bg-slate-50 border border-slate-200/80 text-slate-800"
                        : "bg-emerald-600 text-white font-medium shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                    <span className="text-[10px] opacity-60 block mt-1 text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isChatLoading && (
              <div className="flex gap-2.5 max-w-md">
                <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-bounce delay-100" />
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-bounce delay-200" />
                  <span>Daktari wa Mimea is writing your advice...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Ask Daktari about fertilizer, dosage, spraying, or leaf spots..."
              disabled={isChatLoading}
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-full px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none"
            />
            <button
              onClick={() => handleSendChat()}
              disabled={isChatLoading || !chatInput.trim()}
              className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer shadow-md shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}

      {/* Guest Authentication Modal */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        featureName="use AI Crop Doctor plant diagnostics"
        redirectPath="/tools"
      />

    </div>
  );
}
