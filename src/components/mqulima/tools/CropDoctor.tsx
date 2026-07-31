// ============================================================================
// CropDoctor.tsx — AI Plant Pathology Neural Diagnostics
// Bright Light Theme — Fresh Greens, Sun Yellow Buttons, White Cards
// ============================================================================

import { useState, useRef } from "react";
import {
  UploadCloud,
  ScanLine,
  Database,
  Sparkles,
  X,
  History,
  AlertTriangle,
  Cpu
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  runAIPathogenDiagnostics,
  getDiagnosisHistory,
} from "@/lib/api/crop-doctor.server";

type DiagnosisResult = {
  id: string | null;
  crop: string;
  scientificName: string;
  growthStage: string;
  healthStatus: string;
  disease: string;
  scientificDisease: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  visualObservations: string[];
  possibleCauses: string[];
  organicTreatment: string[];
  chemicalTreatment: string[];
  ipmRecommendations: string[];
  prevention: string[];
  soilRecommendations: {
    ph: string;
    fertilizer: string;
    npk: string;
    organicMatter: string;
  };
  weatherAdvice: string[];
  recommendedProductTypes: string[];
  followUpActions: string[];
  emergency: boolean;
  needsExpertInspection: boolean;
  additionalImagesRequired: string[];
  summary: string;
  recommendedProducts: { name: string; price: string; slug: string }[];
};

type HistoryEntry = {
  id: string;
  crop: string;
  symptoms: string[];
  imageName: string;
  disease: string;
  confidence: string;
  createdAt: string;
  resultJson?: any;
};

const CROPS = [
  { value: "maize", label: "Maize (Cereals)" },
  { value: "tomato", label: "Tomato (Horticulture)" },
  { value: "potato", label: "Irish Potato (Solanaceous Tubers)" },
];

const SYMPTOMS = [
  { key: "yellow", label: "Yellowing Leaves" },
  { key: "spots", label: "Dark Spot Lesions" },
  { key: "wilting", label: "Sudden Wilting" },
  { key: "mold", label: "White Cottony Mold" },
  { key: "bore", label: "Stalk Holes / Borers" },
  { key: "curl", label: "Leaf Curling" },
];

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function CropDoctor({ weatherState }: { weatherState?: any }) {
  const [selectedCrop, setSelectedCrop] = useState("maize");
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>(
    Object.fromEntries(SYMPTOMS.map((s) => [s.key, false]))
  );
  
  const [subCounty, setSubCounty] = useState("");
  const [cropAge, setCropAge] = useState("45 days");
  const [plantingDate, setPlantingDate] = useState("2026-05-15");
  const [farmerQuestion, setFarmerQuestion] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSymptom = (key: string) =>
    setSymptoms((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    toast.success(`Image "${file.name}" selected — ready for neural scan.`);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runDiagnosis = async () => {
    const activeSymptoms = Object.keys(symptoms).filter((k) => symptoms[k]);
    if (activeSymptoms.length === 0 && !imageFile && !farmerQuestion) {
      toast.warning("Please select symptoms, input observations, or upload a plant photo.");
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

    const county = weatherState?.location?.type === "county" ? weatherState.location.county : "Nairobi";

    try {
      const result = await runAIPathogenDiagnostics({
        data: {
          crop: selectedCrop,
          symptoms,
          imageFileName: imageFile?.name,
          imageBase64: imagePreview || undefined,
          county,
          subCounty: subCounty || undefined,
          cropAge: cropAge || undefined,
          plantingDate: plantingDate || undefined,
          currentWeather,
          farmerQuestion: farmerQuestion || undefined,
        },
      });

      setDiagnosis(result as DiagnosisResult);
      toast.success("AI Neural Crop Scan Complete!", {
        description: `Identified ${result.disease} with ${result.confidence}% accuracy confidence.`,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Diagnosis failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const loadHistory = async () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      try {
        const h = await getDiagnosisHistory();
        setHistory(h as HistoryEntry[]);
      } catch {
        toast.error("Could not load diagnosis history. Please log in.");
      }
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    const sev = severity?.toLowerCase() || "";
    if (sev === "healthy") return "bg-emerald-100 border border-emerald-300 text-emerald-800";
    if (sev === "very mild" || sev === "mild" || sev === "moderate") return "bg-amber-100 border border-amber-300 text-amber-900";
    return "bg-red-100 border border-red-300 text-red-800 animate-pulse";
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left font-['Plus_Jakarta_Sans',sans-serif]">

      {/* ── Control Panel Grid ────────────────────────────── */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
        
        {/* Left Column — Config & Scan Trigger */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          
          {/* Header Card (Deep Forest Green) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white border-2 border-[#85CC14]/30 shadow-xl shadow-[#0F291E]/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white font-['Outfit',sans-serif]">
                  AI PLANT PATHOLOGY CORE
                </h3>
                <Sparkles className="h-4 w-4 text-[#85CC14] shrink-0" />
              </div>
              <p className="text-xs text-white/80 mt-1">
                Neural diagnostic engine trained on East African pathogens.
              </p>
            </div>
            
            <button
              onClick={loadHistory}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold text-[#D4E157] transition shadow-sm shrink-0 cursor-pointer active:scale-95 relative z-10"
            >
              <History className="h-4 w-4 inline mr-1 text-[#85CC14]" />
              History
            </button>
          </div>

          {/* Central Upload Zone (Deep Forest Green & Green Border) */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white border-2 border-[#85CC14]/30 p-4 sm:p-6 space-y-4 shadow-xl shadow-[#0F291E]/20">
            <span className="text-xs font-mono font-bold text-[#D4E157] uppercase tracking-widest block">
              1. IMAGE UPLOAD & SCANNER
            </span>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#85CC14] group">
                <img src={imagePreview} alt="Target crop" className="w-full h-44 sm:h-48 object-cover" />
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition shadow-md cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-[#0B2117]/90 backdrop-blur-md p-2 text-center text-xs font-mono text-[#D4E157] font-bold truncate">
                  {imageFile?.name}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#85CC14]/40 hover:border-[#85CC14] bg-[#091D14]/60 hover:bg-[#091D14] transition rounded-2xl p-5 sm:p-8 text-center relative flex flex-col items-center justify-center cursor-pointer group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                />
                
                <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#85CC14]/20 border-2 border-[#85CC14] flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-sm">
                  <UploadCloud className="h-6 w-6 sm:h-8 sm:w-8 text-[#85CC14] animate-pulse" />
                </div>

                <span className="text-xs sm:text-sm font-bold text-white block font-['Outfit',sans-serif]">
                  Tap or Drag Photo to Upload Leaf Specimen
                </span>
                <span className="text-[10px] font-mono text-white/60 mt-1 block">
                  Supports JPEG, PNG, WebP • Max {MAX_FILE_SIZE_MB}MB
                </span>
              </div>
            )}
          </div>

          {/* Crop Parameters & Symptoms Checklist */}
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white border-2 border-[#85CC14]/30 p-4 sm:p-6 space-y-4 shadow-xl shadow-[#0F291E]/20">
            <span className="text-xs font-mono font-bold text-[#D4E157] uppercase tracking-widest block">
              2. CROP SPECIES & SYMPTOMS CHECKLIST
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-white/80 font-bold uppercase block mb-1">Target Crop</label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full bg-[#091D14] border border-[#85CC14]/40 rounded-xl p-3 text-xs font-mono text-[#D4E157] font-bold outline-none cursor-pointer focus:border-[#85CC14] shadow-sm"
                >
                  {CROPS.map((c) => (
                    <option key={c.value} value={c.value} className="bg-[#0F291E] text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Symptoms Grid */}
              <div>
                <label className="text-xs font-mono text-white/80 font-bold uppercase block mb-2">Observed Symptoms</label>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                  {SYMPTOMS.map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition cursor-pointer text-xs font-semibold select-none ${
                        symptoms[key]
                          ? "bg-[#85CC14] text-[#0B2117] border-[#85CC14] font-bold"
                          : "bg-[#091D14] border-[#85CC14]/30 text-white/90 hover:bg-[#0F291E]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={symptoms[key]}
                        onChange={() => toggleSymptom(key)}
                        className="rounded accent-[#0B2117] h-4 w-4 shrink-0 cursor-pointer"
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* High Contrast Green Gradient Action Button */}
            <button
              onClick={runDiagnosis}
              disabled={isScanning}
              className="w-full h-12 sm:h-14 rounded-full bg-gradient-to-r from-[#85CC14] to-[#6FA810] hover:brightness-110 text-[#0B2117] font-black text-xs uppercase tracking-wider sm:tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-[#85CC14]/20 disabled:opacity-50 mt-4 active:scale-98 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <ScanLine className="h-5 w-5 animate-spin text-[#0B2117]" />
                  <span>Scanning Tissue Structure...</span>
                </>
              ) : (
                <>
                  <Cpu className="h-5 w-5 text-[#0B2117]" />
                  <span>EXECUTE AI NEURAL DIAGNOSIS</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column — Neural Diagnostic Result Screen */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white border-2 border-[#85CC14]/30 p-4 xs:p-6 sm:p-8 min-h-[480px] sm:min-h-[550px] relative flex flex-col justify-between overflow-hidden shadow-xl shadow-[#0F291E]/20">
            
            {/* Animated Scan Line */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-[#85CC14] shadow-md shadow-[#85CC14]/50 animate-scan-line z-20" />
            )}

            {!isScanning && !diagnosis && (
              <div className="my-auto text-center space-y-4 max-w-md mx-auto py-12 sm:py-16">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#85CC14]/20 border-2 border-[#85CC14] flex items-center justify-center mx-auto shadow-sm">
                  <Database className="h-8 w-8 sm:h-10 sm:w-10 text-[#85CC14]" />
                </div>
                <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-['Outfit',sans-serif]">
                  NEURAL MONITOR STANDBY
                </h4>
                <p className="text-xs text-white/80 leading-relaxed">
                  Select crop observations or upload a photo to initiate neural diagnostic scanning. 
                  Results match symptoms against verified East African agricultural pathogen databases.
                </p>
              </div>
            )}

            {/* Active Diagnostic Result Display */}
            {!isScanning && diagnosis && (
              <div className="space-y-6 relative z-10">
                
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#85CC14] uppercase tracking-widest block">
                      DIAGNOSIS COMPLETE
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Outfit',sans-serif] mt-1">
                      {diagnosis.disease}
                    </h2>
                    <span className="text-xs font-mono text-[#D4E157] italic block mt-0.5">
                      {diagnosis.scientificDisease} • {diagnosis.crop} ({diagnosis.scientificName})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[#091D14] border border-[#85CC14]/40">
                      <span className="text-[10px] font-mono text-white/70 font-bold uppercase">Accuracy</span>
                      <strong className="text-lg sm:text-xl font-mono font-black text-[#85CC14]">
                        {diagnosis.confidence}%
                      </strong>
                    </div>

                    <div className={`px-3.5 py-2 sm:px-4 sm:py-3 rounded-2xl font-mono text-xs font-black uppercase tracking-wider ${getSeverityBadgeClass(diagnosis.severity)}`}>
                      {diagnosis.severity} SEVERITY
                    </div>
                  </div>
                </div>

                {/* Treatment Protocols */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-[#D4E157] uppercase tracking-widest">
                    RECOMMENDED TREATMENT PROTOCOLS
                  </h4>

                  <ul className="space-y-3 text-xs sm:text-sm text-white">
                    {diagnosis.organicTreatment.map((treatment, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#091D14]/80 border border-[#85CC14]/30">
                        <span className="h-6 w-6 rounded-full bg-[#85CC14] text-[#0B2117] font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed font-medium text-white/95">{treatment}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Products */}
                {diagnosis.recommendedProducts.length > 0 && (
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <span className="text-xs font-mono font-bold text-[#85CC14] uppercase tracking-widest block">
                      VERIFIED AGROVET SOLUTIONS
                    </span>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {diagnosis.recommendedProducts.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3.5 rounded-2xl bg-[#091D14] border border-[#85CC14]/40 shadow-sm">
                          <div>
                            <strong className="text-xs text-white block font-['Outfit',sans-serif]">{p.name}</strong>
                            <span className="text-xs font-mono text-[#D4E157] font-bold">{p.price}</span>
                          </div>
                          <Link
                            to="/shop"
                            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#85CC14] to-[#6FA810] text-[#0B2117] font-black text-xs uppercase shadow-sm hover:brightness-110"
                          >
                            Order
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── History Timeline Strip ───────────────────────── */}
      {showHistory && history.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-[#0B2117] via-[#0F291E] to-[#143B2B] text-white border-2 border-[#85CC14]/30 p-6 space-y-4 shadow-xl shadow-[#0F291E]/20">
          <h4 className="text-xs font-mono font-bold text-[#D4E157] uppercase tracking-widest">
            HISTORICAL SCAN TIMELINE
          </h4>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {history.map((item) => (
              <div key={item.id} className="min-w-[200px] p-4 rounded-2xl bg-[#091D14] border border-[#85CC14]/30 space-y-2">
                <span className="text-[10px] font-mono text-white/60 block">{item.createdAt.substring(0, 10)}</span>
                <strong className="text-sm font-bold text-white block truncate">{item.disease}</strong>
                <span className="text-xs font-mono text-[#85CC14] font-bold block">{item.confidence}% Match</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
