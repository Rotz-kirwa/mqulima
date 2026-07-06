import { useState, useRef } from "react";
import {
  UploadCloud,
  ScanLine,
  Database,
  Sparkles,
  ClipboardList,
  X,
  History,
  AlertTriangle,
  Calendar,
  Sprout,
  Thermometer,
  ShieldCheck,
  Droplet,
  ArrowRight,
  Info,
  Activity
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
  
  // New deep diagnostic form states
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state for tabs in report viewer
  const [activeReportTab, setActiveReportTab] = useState<"treatment" | "prevention" | "soil" | "weather">("treatment");
  const [treatmentSubTab, setTreatmentSubTab] = useState<"organic" | "chemical" | "ipm">("organic");
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

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
    toast.success(`Image "${file.name}" selected — ready for scanning.`);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runDiagnosis = async () => {
    const activeSymptoms = Object.keys(symptoms).filter((k) => symptoms[k]);
    if (activeSymptoms.length === 0 && !imageFile && !farmerQuestion) {
      toast.warning("Please provide symptoms, observations, or upload a plant photo.");
      return;
    }

    setIsScanning(true);
    setDiagnosis(null);
    setCompletedActions({});

    // Inject shared weather context
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
      toast.success("AI Crop Diagnosis Complete!", {
        description: `Identified ${result.disease} with ${result.confidence}% confidence.`,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Diagnosis failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setShowHistory(true);
    try {
      const h = await getDiagnosisHistory();
      setHistory(h as HistoryEntry[]);
    } catch {
      toast.error("Could not load diagnosis history. Please log in.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectHistoryEntry = (entry: HistoryEntry) => {
    if (entry.resultJson) {
      setDiagnosis({
        id: entry.id,
        ...entry.resultJson,
      });
      setCompletedActions({});
      toast.success(`Loaded saved diagnosis: ${entry.disease}`);
    } else {
      // Fallback for older legacy rows
      setDiagnosis({
        id: entry.id,
        crop: entry.crop,
        disease: entry.disease,
        confidence: parseFloat(entry.confidence),
        scientificName: entry.crop === "tomato" ? "Solanum lycopersicum" : entry.crop === "potato" ? "Solanum tuberosum" : "Zea mays",
        scientificDisease: "Unknown pathogen",
        growthStage: "Unknown",
        healthStatus: "Infected",
        severity: "Moderate",
        symptoms: entry.symptoms,
        visualObservations: ["Legacy diagnosis log, full metadata not stored."],
        possibleCauses: ["Legacy migration entry."],
        organicTreatment: ["Consult standard crop disease manual."],
        chemicalTreatment: ["Consult standard crop disease manual."],
        ipmRecommendations: [],
        prevention: [],
        soilRecommendations: { ph: "—", fertilizer: "—", npk: "—", organicMatter: "—" },
        weatherAdvice: [],
        recommendedProductTypes: [],
        followUpActions: [],
        emergency: false,
        needsExpertInspection: false,
        additionalImagesRequired: [],
        summary: "Legacy diagnosis trace.",
        recommendedProducts: [],
      });
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    const sev = severity?.toLowerCase() || "";
    if (sev === "healthy") return "bg-emerald-950/60 border border-emerald-500/50 text-emerald-400";
    if (sev === "very mild" || sev === "mild") return "bg-teal-950/60 border border-teal-500/50 text-teal-400";
    if (sev === "moderate") return "bg-amber-950/60 border border-amber-500/50 text-amber-400";
    if (sev === "severe") return "bg-orange-950/60 border border-orange-500/50 text-orange-400";
    return "bg-rose-950/60 border border-rose-500/50 text-rose-400 animate-pulse";
  };

  const toggleAction = (idx: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 animate-fadeIn">
      {/* ── Control Panel (left) ───────────────────── */}
      <div className="lg:col-span-5 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[#4EFE98] uppercase tracking-wider font-serif">
                AI Crop Diagnostic Core
              </h3>
              <p className="text-xs text-[#A2AAA0] mt-1 leading-relaxed">
                Configure crop growth variables, input observations, and run neural pathogen diagnostic checks.
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center gap-1 px-2.5 py-1 border border-[#2D6A4F]/30 text-[9px] font-bold uppercase tracking-wider text-[#52B788] hover:bg-[#112E22] transition rounded-none shrink-0"
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
          </div>
        </div>

        {/* 1. Crop details selection */}
        <div className="space-y-4 bg-[#091D13]/40 border border-[#1C462C] p-4">
          <span className="text-[10px] font-black uppercase text-[#F5A623] tracking-wider block">
            1. Crop Registry & Geographic Focus
          </span>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[#A2AAA0] uppercase tracking-wider">
                Select Crop Type
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-[#091D13] border border-[#1C462C] text-xs rounded-none p-2.5 text-[#FAF9F5] outline-none focus:border-[#F5A623]"
              >
                {CROPS.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#112F20]">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#A2AAA0] uppercase tracking-wider">
                  County Location
                </label>
                <div className="bg-[#091D13] border border-[#1C462C]/40 text-xs p-2.5 text-[#FAF9F5]/70 font-bold truncate">
                  {weatherState?.location?.type === "county" ? `${weatherState.location.county}` : "GPS Detected"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#A2AAA0] uppercase tracking-wider">
                  Sub-County
                </label>
                <input
                  type="text"
                  placeholder="e.g. Turbo"
                  value={subCounty}
                  onChange={(e) => setSubCounty(e.target.value)}
                  className="w-full bg-[#091D13] border border-[#1C462C] text-xs rounded-none p-2.5 text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#A2AAA0] uppercase tracking-wider">
                  Crop Age / Stage
                </label>
                <input
                  type="text"
                  placeholder="e.g. 45 days"
                  value={cropAge}
                  onChange={(e) => setCropAge(e.target.value)}
                  className="w-full bg-[#091D13] border border-[#1C462C] text-xs rounded-none p-2.5 text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[#A2AAA0] uppercase tracking-wider">
                  Planting Date
                </label>
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="w-full bg-[#091D13] border border-[#1C462C] text-xs rounded-none p-2 text-[#FAF9F5] outline-none focus:border-[#F5A623] font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Symptoms Checkbox Grid */}
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase text-[#F5A623] tracking-wider block">
            2. Checked Observations
          </span>
          <div className="grid grid-cols-2 gap-2 bg-[#091D13]/60 p-4 border border-[#1C462C] text-xs text-[#FAF9F5]">
            {SYMPTOMS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer hover:text-[#52B788] py-1 transition select-none"
              >
                <input
                  type="checkbox"
                  checked={symptoms[key]}
                  onChange={() => toggleSymptom(key)}
                  className="rounded-none border-[#1C462C] text-[#2D6A4F] focus:ring-0 cursor-pointer h-4 w-4 accent-[#2D6A4F]"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* 3. Farmer Question / Description */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-[#F5A623] tracking-wider block">
            3. Specific Observations / Question
          </label>
          <textarea
            placeholder="Leaves are turning yellow and have brown spots..."
            value={farmerQuestion}
            onChange={(e) => setFarmerQuestion(e.target.value)}
            rows={3}
            className="w-full bg-[#091D13] border border-[#1C462C] text-xs rounded-none p-3 text-[#FAF9F5] outline-none focus:border-[#F5A623] resize-none leading-relaxed"
          />
        </div>

        {/* 4. Image Upload Block */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase text-[#F5A623] tracking-wider block">
            4. Image Upload (Optional)
          </span>

          {imagePreview ? (
            <div className="relative border border-[#1C462C] bg-[#091D13]/40 rounded-none overflow-hidden">
              <img
                src={imagePreview}
                alt="Selected plant"
                className="w-full h-40 object-cover"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-red-900/85 border border-red-700 text-white p-1 rounded-none hover:bg-red-800 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="p-2 text-[10px] text-[#A2AAA0] font-mono truncate">
                {imageFile?.name} · {((imageFile?.size ?? 0) / 1024).toFixed(0)}KB
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-[#1C462C] bg-[#091D13]/40 hover:bg-[#112F20]/40 transition p-6 rounded-none text-center relative flex flex-col items-center justify-center cursor-pointer group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Upload plant photo"
              />
              <UploadCloud className="h-7 w-7 text-[#FAF9F5]/40 mb-2 group-hover:text-white transition" />
              <span className="text-xs font-bold text-[#FAF9F5] block">
                Click to select or drop image
              </span>
              <span className="text-[10px] text-[#A2AAA0]/60 mt-1 block">
                JPEG, PNG, WebP · Max {MAX_FILE_SIZE_MB}MB
              </span>
            </div>
          )}
        </div>

        {/* Trigger check */}
        <button
          onClick={runDiagnosis}
          disabled={isScanning}
          className="w-full h-12 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs uppercase tracking-widest rounded-none transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <ScanLine className="h-4 w-4 animate-spin" />
              Scanning plant tissue...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Execute Diagnostics Check
            </>
          )}
        </button>
      </div>

      {/* ── Diagnostics Monitor (right) ──────────── */}
      <div className="lg:col-span-7 flex flex-col justify-start space-y-4">
        {/* Main diagnostic screen */}
        <div className="bg-[#091D13]/60 border border-[#1C462C] p-6 min-h-[500px] rounded-none flex flex-col relative justify-between overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(45,106,79,0.05)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(45,106,79,0.05)_1px,_transparent_1px)] bg-[size:20px_20px] opacity-70 pointer-events-none" />

          {isScanning && (
            <div
              className="absolute inset-x-0 h-1 bg-[#22C55E] shadow-[0_0_15px_#22C55E] z-20 pointer-events-none"
              style={{ animation: "scanLine 2.8s linear infinite", top: 0 }}
            />
          )}

          {/* Idle state */}
          {!isScanning && !diagnosis && (
            <div className="my-auto text-center space-y-4 max-w-sm mx-auto py-12 relative z-10">
              <div className="grid h-14 w-14 place-items-center bg-[#2D6A4F]/20 border border-[#2D6A4F]/30 text-[#FAF9F5]/80 mx-auto rounded-none">
                <Database className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#FAF9F5]">
                Diagnostics Awaiting Trigger
              </h4>
              <p className="text-xs text-[#A2AAA0] leading-relaxed">
                Configure crop parameters on the left panel, then run the diagnostics scan.
                The expert system matches symptoms with East African agricultural diseases.
              </p>
            </div>
          )}

          {/* Scanning state */}
          {isScanning && (
            <div className="my-auto text-center space-y-4 max-w-sm mx-auto py-12 relative z-10">
              <div className="h-10 w-10 border-2 border-t-[#FAF9F5] border-[#FAF9F5]/20 rounded-full animate-spin mx-auto" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#FAF9F5] animate-pulse">
                Running Neural Analytics...
              </h4>
              <p className="text-[11px] text-[#A2AAA0] leading-relaxed">
                Analyzing leaf chlorosis ratios, spot patterns, and environmental factors
                against crop diagnostic models.
              </p>
            </div>
          )}

          {/* Upgraded Result State */}
          {!isScanning && diagnosis && (
            <div className="space-y-6 relative z-10 text-left">
              
              {/* Emergency Alert Banner */}
              {(diagnosis.emergency || diagnosis.needsExpertInspection) && (
                <div className="bg-red-950/80 border border-red-500/80 px-4 py-3 flex items-start gap-3 text-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <strong className="font-extrabold block text-red-400 uppercase tracking-wide">
                      Urgent Agricultural Warning
                    </strong>
                    <p className="leading-relaxed">
                      Critical pathogen spread detected. We recommend isolating the affected block immediately
                      and contacting agricultural extension officers in {subCounty ? `${subCounty}, ` : ""} Uasin Gishu.
                    </p>
                  </div>
                </div>
              )}

              {/* Header diagnostic overview */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2D6A4F]/20 pb-4">
                <div>
                  <span className="text-[8px] font-black uppercase text-[#F5A623] tracking-widest block">
                    Diagnostic Core Result
                  </span>
                  <h4 className="text-lg font-black text-[#FAF9F5] mt-0.5 uppercase tracking-wide font-serif">
                    {diagnosis.disease}
                  </h4>
                  <span className="text-[10px] text-[#A2AAA0] italic block font-mono">
                    {diagnosis.scientificDisease} · {diagnosis.crop} ({diagnosis.scientificName})
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="bg-[#13301E] border border-[#2D6A4F]/30 px-3 py-1.5 text-center">
                    <span className="text-[8px] font-bold text-[#A2AAA0] block uppercase">Confidence</span>
                    <strong className="text-xs font-black text-[#FAF9F5] font-mono">
                      {diagnosis.confidence}%
                    </strong>
                  </div>
                  <div className={`border px-3 py-1.5 text-center ${getSeverityBadgeClass(diagnosis.severity)}`}>
                    <span className="text-[8px] font-bold block uppercase opacity-80">Severity</span>
                    <strong className="text-xs font-black uppercase">
                      {diagnosis.severity}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Observations & Causes Row */}
              <div className="grid gap-4 md:grid-cols-2 text-xs">
                <div className="bg-[#091D13]/40 border border-[#1C462C]/60 p-3.5 space-y-2">
                  <span className="text-[10px] font-black text-[#52B788] uppercase tracking-wider block flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Visual Observations
                  </span>
                  <ul className="space-y-1 text-[#A2AAA0] list-disc list-inside">
                    {diagnosis.visualObservations.map((obs, i) => (
                      <li key={i} className="leading-relaxed text-[11px]">{obs}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#091D13]/40 border border-[#1C462C]/60 p-3.5 space-y-2">
                  <span className="text-[10px] font-black text-[#F5A623] uppercase tracking-wider block flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Pathogen Root Causes
                  </span>
                  <ul className="space-y-1 text-[#A2AAA0] list-disc list-inside">
                    {diagnosis.possibleCauses.map((cause, i) => (
                      <li key={i} className="leading-relaxed text-[11px]">{cause}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tabbed Recommendations */}
              <div className="space-y-4">
                <div className="flex border-b border-[#2D6A4F]/20">
                  {[
                    { id: "treatment", label: "Treatments", icon: Sprout },
                    { id: "prevention", label: "Prevention", icon: ShieldCheck },
                    { id: "soil", label: "Soil & Nutrients", icon: Droplet },
                    { id: "weather", label: "Weather Context", icon: Thermometer },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveReportTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider border-b-2 transition ${
                        activeReportTab === tab.id
                          ? "border-[#F5A623] text-[#FAF9F5] bg-[#112F20]/60"
                          : "border-transparent text-[#A2AAA0] hover:text-[#FAF9F5]"
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="bg-[#091D13]/40 border border-[#1C462C]/60 p-4 text-xs">
                  {activeReportTab === "treatment" && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {["organic", "chemical", "ipm"].map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setTreatmentSubTab(sub as any)}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider border transition ${
                              treatmentSubTab === sub
                                ? "bg-[#2D6A4F] border-[#2D6A4F] text-[#FAF9F5]"
                                : "border-[#1C462C]/60 text-[#A2AAA0] hover:text-[#FAF9F5]"
                            }`}
                          >
                            {sub} Protocol
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {treatmentSubTab === "organic" && (
                          <ul className="space-y-1.5 text-[#A2AAA0] list-disc list-inside">
                            {diagnosis.organicTreatment.map((t, idx) => (
                              <li key={idx} className="leading-relaxed text-[11px]">{t}</li>
                            ))}
                          </ul>
                        )}
                        {treatmentSubTab === "chemical" && (
                          <ul className="space-y-1.5 text-[#A2AAA0] list-disc list-inside">
                            {diagnosis.chemicalTreatment.map((t, idx) => (
                              <li key={idx} className="leading-relaxed text-[11px]">{t}</li>
                            ))}
                          </ul>
                        )}
                        {treatmentSubTab === "ipm" && (
                          <ul className="space-y-1.5 text-[#A2AAA0] list-disc list-inside">
                            {diagnosis.ipmRecommendations.map((t, idx) => (
                              <li key={idx} className="leading-relaxed text-[11px]">{t}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {activeReportTab === "prevention" && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[#52B788] uppercase block">
                        Long-Term Preventive Measures:
                      </span>
                      <ul className="space-y-1.5 text-[#A2AAA0] list-disc list-inside">
                        {diagnosis.prevention.map((p, idx) => (
                          <li key={idx} className="leading-relaxed text-[11px]">{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeReportTab === "soil" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border-r border-[#1C462C]/40 pr-2">
                          <span className="text-[9px] font-bold text-[#A2AAA0] uppercase block">Recommended Soil pH</span>
                          <strong className="text-sm font-mono text-[#FAF9F5] block mt-0.5">{diagnosis.soilRecommendations.ph}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-[#A2AAA0] uppercase block">Target NPK Ratio</span>
                          <strong className="text-sm font-mono text-[#F5A623] block mt-0.5">{diagnosis.soilRecommendations.npk}</strong>
                        </div>
                      </div>
                      <div className="border-t border-[#1C462C]/40 pt-2 space-y-1">
                        <span className="text-[9px] font-bold text-[#A2AAA0] uppercase block">Fertility Advisory</span>
                        <p className="text-[11px] text-[#A2AAA0] leading-relaxed">{diagnosis.soilRecommendations.fertilizer}</p>
                      </div>
                      <div className="border-t border-[#1C462C]/40 pt-2 space-y-0.5">
                        <span className="text-[9px] font-bold text-[#A2AAA0] uppercase block">Organic Matter Advice</span>
                        <p className="text-[11px] text-[#A2AAA0] leading-relaxed">{diagnosis.soilRecommendations.organicMatter}</p>
                      </div>
                    </div>
                  )}

                  {activeReportTab === "weather" && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[#F5A623] uppercase block">
                        Microclimate-driven Advisory:
                      </span>
                      <ul className="space-y-1.5 text-[#A2AAA0] list-disc list-inside">
                        {diagnosis.weatherAdvice.map((w, idx) => (
                          <li key={idx} className="leading-relaxed text-[11px]">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Follow-Up Checklist */}
              {diagnosis.followUpActions.length > 0 && (
                <div className="bg-[#112F20]/60 border border-[#2D6A4F]/30 p-4 space-y-2.5">
                  <span className="text-[10px] font-black text-[#FAF9F5] uppercase tracking-wider block flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-[#F5A623]" />
                    Recommended Follow-up Actions
                  </span>
                  <div className="space-y-2 text-xs">
                    {diagnosis.followUpActions.map((action, idx) => (
                      <label
                        key={idx}
                        onClick={() => toggleAction(idx)}
                        className="flex items-start gap-2.5 cursor-pointer hover:text-white select-none py-0.5 transition"
                      >
                        <input
                          type="checkbox"
                          checked={!!completedActions[idx]}
                          onChange={() => {}} // handled by parent click
                          className="rounded-none border-[#1C462C] text-[#52B788] focus:ring-0 cursor-pointer h-4 w-4 mt-0.5 accent-[#2D6A4F]"
                        />
                        <span className={`text-[11px] leading-relaxed ${completedActions[idx] ? "line-through text-[#A2AAA0]/50" : "text-[#A2AAA0]"}`}>
                          {action}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Confidence Warning block */}
              {diagnosis.confidence < 70 && diagnosis.additionalImagesRequired.length > 0 && (
                <div className="bg-amber-950/60 border border-amber-500/50 p-3.5 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <strong className="font-bold uppercase tracking-wider">Low Confidence Advisory</strong>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Diagnostics score is under 70%. To improve diagnosis accuracy, please submit additional pictures showing:
                  </p>
                  <ul className="grid grid-cols-2 gap-1 text-[10px] text-amber-300 list-disc list-inside">
                    {diagnosis.additionalImagesRequired.map((imgReq, idx) => (
                      <li key={idx} className="truncate">{imgReq}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* E-Commerce Recommended Products list */}
              {diagnosis.recommendedProducts.length > 0 && (
                <div className="border-t border-[#2D6A4F]/20 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-wider block">
                      Recommended Agrovet Solutions
                    </span>
                    <span className="text-[9px] text-[#A2AAA0] block">
                      Matching product categories: {diagnosis.recommendedProductTypes.join(", ")}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {diagnosis.recommendedProducts.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-[#091D13]/40 border border-[#1C462C]/60 p-2.5 hover:border-[#F5A623]/30 transition"
                      >
                        <div className="max-w-[70%]">
                          <strong className="text-[11px] text-[#FAF9F5] block leading-snug truncate">
                            {p.name}
                          </strong>
                          <span className="text-[10px] font-mono text-[#F5A623] font-bold">
                            {p.price}
                          </span>
                        </div>
                        <Link
                          to="/shop"
                          search={{ category: "Pesticides" } as any}
                          className="px-3 py-1.5 bg-[#F5A623] hover:bg-[#e09520] text-white text-[9px] font-black uppercase tracking-wider transition rounded-none shrink-0 flex items-center gap-1"
                        >
                          Buy
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Diagnosis History Panel ─────────────── */}
        {showHistory && (
          <div className="bg-[#091D13]/60 border border-[#1C462C] p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#2D6A4F]/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F5A623] uppercase tracking-wider">
                <ClipboardList className="h-4 w-4" />
                Recent Diagnosis History
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-[#A2AAA0] hover:text-[#FAF9F5] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-6 text-center text-xs text-[#A2AAA0]/50 animate-pulse">
                Loading history logs...
              </div>
            ) : history.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#A2AAA0]/50">
                No diagnosis history found. Log in to save results.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => selectHistoryEntry(h)}
                    className="flex items-center justify-between bg-[#112F20]/40 border border-[#1C462C]/60 p-3 text-xs cursor-pointer hover:border-[#F5A623]/30 hover:bg-[#112F20]/60 transition select-none"
                  >
                    <div>
                      <strong className="text-[#FAF9F5] block text-[11px]">{h.disease}</strong>
                      <span className="text-[#A2AAA0] text-[10px]">
                        {h.crop} · {h.symptoms.join(", ")}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[#52B788] font-mono font-bold block">{h.confidence}</span>
                      <span className="text-[9px] text-[#A2AAA0] font-mono">
                        {new Date(h.createdAt).toLocaleDateString("en-KE")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
