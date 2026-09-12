import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Eye, EyeOff, Check, ChevronsUpDown, Loader2, User, Phone, Mail,
  CreditCard, MapPin, Landmark as LandmarkIcon, Sprout, Lock, ArrowLeft
} from "lucide-react";
import { SignUpSchema } from "@/lib/auth-shop-shared";
import { useAuth } from "@/hooks/useAuth";
import { WaveDivider, SproutLogo } from "@/components/auth/AuthMockupAssets";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Create Account · Mqulima Hub" },
      { name: "description", content: "Join Mqulima Hub — Kenya's #1 agricultural community and direct farm marketplace." },
    ],
  }),
  component: SignUp,
});

const COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado",
  "Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia",
  "Lamu","Machakos","Makueni","Mandera","Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi",
  "Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River",
  "Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"
];

const FARMING_TYPES = [
  "Crop Farming (Horticulture)",
  "Crop Farming (Cereals & Grains)",
  "Livestock Farming",
  "Dairy Farming",
  "Poultry Farming",
  "Aquaculture (Fish Farming)",
  "Apiculture (Bee Keeping)",
  "Greenhouse Farming",
  "Mixed Farming",
  "Agroforestry",
  "I'm a Buyer/Consumer Only (no farming)",
  "Other"
];

function getPasswordStrength(pw: string): { label: string; color: string; pct: number } {
  if (!pw) return { label: "", color: "", pct: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-400", pct: 25 };
  if (score <= 2) return { label: "Fair", color: "bg-amber-400", pct: 50 };
  if (score <= 3) return { label: "Good", color: "bg-blue-400", pct: 75 };
  return { label: "Strong", color: "bg-emerald-400", pct: 100 };
}

function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fd, setFd] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "+254",
    email: "",
    nationalId: "",
    county: "",
    deliveryLocation: "",
    landmark: "",
    farmingType: "" as any,
    specifyFarmingType: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [fullNameInput, setFullNameInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countyOpen, setCountyOpen] = useState(false);
  const [countySearch, setCountySearch] = useState("");
  const countyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initCsrf() {
      try {
        const { ensureCsrfToken } = await import("@/lib/csrf-client");
        await ensureCsrfToken();
      } catch (e) {
        console.warn("CSRF token init error:", e);
      }
    }
    initCsrf();

    const handler = (e: MouseEvent) => {
      if (countyRef.current && !countyRef.current.contains(e.target as Node)) {
        setCountyOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCounties = useMemo(() =>
    COUNTIES.filter(c => c.toLowerCase().includes(countySearch.toLowerCase())),
  [countySearch]);

  const pwStrength = getPasswordStrength(fd.password);

  const set = (name: string, val: any) => {
    setFd(p => ({ ...p, [name]: val }));
    if (touched[name]) validate(name, val);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    set(name, val);
  };

  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    let d = e.target.value.replace(/\D/g, "");
    if (d.startsWith("254")) d = d.substring(3);
    else if (d.startsWith("0")) d = d.substring(1);
    d = d.substring(0, 9);
    let fmt = "+254";
    if (d.length > 0) {
      fmt = d.length <= 3
        ? `+254 ${d}`
        : d.length <= 6
        ? `+254 ${d.substring(0, 3)} ${d.substring(3)}`
        : `+254 ${d.substring(0, 3)} ${d.substring(3, 6)} ${d.substring(6)}`;
    }
    set("phoneNumber", fmt);
  };

  const handleId = (e: React.ChangeEvent<HTMLInputElement>) => {
    set("nationalId", e.target.value.replace(/\D/g, "").substring(0, 8));
  };

  const validate = (name: string, value: any) => {
    if (name === "confirmPassword") {
      setErrors(p => value !== fd.password ? { ...p, confirmPassword: "Passwords do not match" } : (() => { const c = { ...p }; delete c.confirmPassword; return c; })());
      return;
    }
    const shape = (SignUpSchema._def as any).schema?.shape || (SignUpSchema as any).shape;
    const fieldSchema = shape?.[name];
    if (!fieldSchema) return;
    const r = fieldSchema.safeParse(value);
    setErrors(p => !r.success ? { ...p, [name]: r.error.errors[0].message } : (() => { const c = { ...p }; delete c[name]; return c; })());
  };

  const handleBlur = (name: string, value: any) => {
    setTouched(p => ({ ...p, [name]: true }));
    validate(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const allTouched: Record<string, boolean> = {};
    Object.keys(fd).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);

    const ne: Record<string, string> = {};
    if (!fd.firstName) ne["firstName"] = "First name is required";
    else if (fd.firstName.length < 2) ne["firstName"] = "First name must be at least 2 characters";
    if (!fd.lastName) ne["lastName"] = "Please enter both first & last name";
    else if (fd.lastName.length < 1) ne["lastName"] = "Last name is required";

    if (!fd.phoneNumber || fd.phoneNumber === "+254") ne["phoneNumber"] = "Phone number is required";
    else if (!/^\+254 \d{3} \d{3} \d{3}$/.test(fd.phoneNumber)) ne["phoneNumber"] = "Phone number must be in +254 7XX XXX XXX format";

    if (!fd.email) ne["email"] = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(fd.email)) ne["email"] = "Invalid email address";

    if (!fd.nationalId) ne["nationalId"] = "National ID number is required";
    else if (!/^\d{7,8}$/.test(fd.nationalId)) ne["nationalId"] = "National ID must be 7 or 8 digits";

    if (!fd.county) ne["county"] = "Please select your county";
    if (!fd.deliveryLocation) ne["deliveryLocation"] = "Please enter your area of delivery";
    if (!fd.farmingType) ne["farmingType"] = "Please select nature of farming";
    if (fd.farmingType === "Other" && (!fd.specifyFarmingType || !fd.specifyFarmingType.trim())) {
      ne["specifyFarmingType"] = "Please specify your farming type";
    }

    if (!fd.password) ne["password"] = "Password is required";
    else if (fd.password.length < 8) ne["password"] = "Password must be at least 8 characters";
    else if (!/[0-9]/.test(fd.password)) ne["password"] = "Password must contain at least one number";
    else if (!/[A-Z]/.test(fd.password)) ne["password"] = "Password must contain at least one uppercase letter";

    if (!fd.confirmPassword) ne["confirmPassword"] = "Please confirm your password";
    else if (fd.confirmPassword !== fd.password) ne["confirmPassword"] = "Passwords do not match";

    if (!fd.terms) ne["terms"] = "You must accept the terms & conditions";

    if (Object.keys(ne).length > 0) {
      setErrors(ne);
      setLoading(false);
      const firstErrKey = Object.keys(ne)[0];
      toast.error(ne[firstErrKey] || "Please correct the highlighted form errors.");
      return;
    }

    try {
      await register(fd);
      toast.success("Account created successfully! Welcome to Mqulima Hub.");
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const redirectUrl = searchParams.get("redirect") || "/";
      navigate({ to: redirectUrl as any });
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.field) {
          setErrors(p => ({ ...p, [parsed.field]: parsed.error }));
        }
        toast.error(parsed.error || "Registration failed");
      } catch (e) {
        toast.error(err.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;

  return (
    <div className="w-full max-w-2xl mx-auto rounded-[36px] bg-[#FAF8F0] shadow-[0_25px_60px_-15px_rgba(4,40,25,0.25)] overflow-hidden transition-all duration-300 border border-[#E9E4D4]/60">
      
      {/* TOP HEADER SECTION (Ivory Top with Nav & Titles) */}
      <div className="bg-[#FAF8F0] pt-6 pb-4 px-6 sm:px-8 text-left relative flex items-start justify-between">
        <div>
          <Link
            to="/auth/sign-in"
            search={redirectParam ? { redirect: redirectParam } as any : undefined}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#056B3A] transition-colors mb-2 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Sign In</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1C201D] tracking-tight">
            Join Mqulima Today
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Create your profile to buy, sell, and connect with Kenya's farming community.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-gray-100 p-1.5 shrink-0 hidden sm:flex items-center justify-center">
          <SproutLogo className="w-full h-full" />
        </div>
      </div>

      {/* SIGNATURE ORGANIC WAVE TRANSITION */}
      <WaveDivider className="w-full h-10 text-[#056B3A] -mb-[1px]" />

      {/* DEEP FOREST GREEN CARD BODY */}
      <div className="bg-[#056B3A] px-6 sm:px-8 pt-3 pb-8 text-white">
        
        {/* COMPREHENSIVE FORM */}
        <form onSubmit={handleSubmit} data-lpignore="true" data-1p-ignore="true" data-bwignore="true" className="space-y-3.5">
          
          {/* GRID ROW 1: FULL NAME & PHONE NUMBER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* FULL NAME */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="fullName" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <User className="w-3 h-3 text-[#056B3A]" />
                <span>Full Name</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullNameInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setFullNameInput(val);
                  const parts = val.trim().split(/\s+/);
                  const first = parts[0] || "";
                  const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
                  setFd(p => ({ ...p, firstName: first, lastName: last }));
                  
                  if (touched.firstName || touched.lastName) {
                    if (!first) setErrors(p => ({ ...p, firstName: "First name is required", lastName: "" }));
                    else if (first.length < 2) setErrors(p => ({ ...p, firstName: "First name must be at least 2 characters", lastName: "" }));
                    else if (!last) setErrors(p => ({ ...p, firstName: "", lastName: "Please enter both first & last name" }));
                    else setErrors(p => { const cp = { ...p }; delete cp.firstName; delete cp.lastName; return cp; });
                  }
                }}
                onBlur={() => {
                  setTouched(p => ({ ...p, firstName: true, lastName: true }));
                  const parts = fullNameInput.trim().split(/\s+/);
                  const first = parts[0] || "";
                  const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
                  if (!first) setErrors(p => ({ ...p, firstName: "First name is required" }));
                  else if (first.length < 2) setErrors(p => ({ ...p, firstName: "First name must be at least 2 characters" }));
                  else if (!last) setErrors(p => ({ ...p, lastName: "Please enter both first & last name" }));
                  else setErrors(p => { const cp = { ...p }; delete cp.firstName; delete cp.lastName; return cp; });
                }}
                placeholder="e.g. Peter Keff"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {(errors.firstName || errors.lastName) && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.firstName || errors.lastName}</p>
              )}
            </div>

            {/* PHONE NUMBER */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="phoneNumber" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Phone className="w-3 h-3 text-[#056B3A]" />
                <span>Phone Number</span>
              </label>
              <input
                id="phoneNumber"
                type="text"
                name="phoneNumber"
                value={fd.phoneNumber}
                onChange={handlePhone}
                onBlur={e => handleBlur("phoneNumber", e.target.value)}
                placeholder="+254 7XX XXX XXX"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {errors.phoneNumber && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* GRID ROW 2: EMAIL ADDRESS & NATIONAL ID NUMBER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* EMAIL ADDRESS */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="email" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Mail className="w-3 h-3 text-[#056B3A]" />
                <span>Email Address</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={fd.email}
                onChange={handleChange}
                onBlur={e => handleBlur("email", e.target.value)}
                placeholder="farmer@gmail.com"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {errors.email && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* NATIONAL ID NUMBER */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="nationalId" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <CreditCard className="w-3 h-3 text-[#056B3A]" />
                <span>National ID Number</span>
              </label>
              <input
                id="nationalId"
                type="text"
                name="nationalId"
                value={fd.nationalId}
                onChange={handleId}
                onBlur={e => handleBlur("nationalId", e.target.value)}
                placeholder="Enter 7 or 8 digits"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {errors.nationalId && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.nationalId}</p>
              )}
            </div>
          </div>

          {/* GRID ROW 3: COUNTY & AREA OF DELIVERY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* COUNTY (COMBOBOX) */}
            <div ref={countyRef} className="relative bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <MapPin className="w-3 h-3 text-[#056B3A]" />
                <span>County</span>
              </label>
              <button
                type="button"
                onClick={() => setCountyOpen(!countyOpen)}
                className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 outline-none cursor-pointer text-left"
              >
                <span className={fd.county ? "text-gray-900" : "text-gray-400"}>
                  {fd.county || "Select county"}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-gray-400" />
              </button>

              {countyOpen && (
                <div className="absolute left-0 right-0 z-50 mt-3 border border-gray-200 bg-white rounded-2xl shadow-xl max-h-52 overflow-hidden flex flex-col text-gray-900 animate-fadeIn">
                  <input
                    type="text"
                    placeholder="Search county..."
                    value={countySearch}
                    onChange={e => setCountySearch(e.target.value)}
                    className="w-full border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-800 outline-none"
                    autoFocus
                  />
                  <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                    {filteredCounties.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-gray-400 text-center">No county found</div>
                    ) : filteredCounties.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          set("county", c);
                          setCountyOpen(false);
                          setCountySearch("");
                          setErrors(p => { const cp = {...p}; delete cp.county; return cp; });
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2 text-xs font-semibold outline-none transition-colors cursor-pointer ${
                          fd.county === c ? "bg-[#056B3A]/10 text-[#056B3A]" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span>{c}</span>
                        {fd.county === c && <Check className="w-3.5 h-3.5 text-[#056B3A]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.county && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.county}</p>
              )}
            </div>

            {/* AREA OF DELIVERY */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="deliveryLocation" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <MapPin className="w-3 h-3 text-[#056B3A]" />
                <span>Area of Delivery</span>
              </label>
              <input
                id="deliveryLocation"
                type="text"
                name="deliveryLocation"
                value={fd.deliveryLocation}
                onChange={handleChange}
                onBlur={e => handleBlur("deliveryLocation", e.target.value)}
                placeholder="Enter custom delivery area or town (e.g. Eldoret West)"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {errors.deliveryLocation && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.deliveryLocation}</p>
              )}
            </div>
          </div>

          {/* GRID ROW 4: SPECIFIC LANDMARK (OPTIONAL) & NATURE OF FARMING */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* SPECIFIC LANDMARK (OPTIONAL) */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="landmark" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <LandmarkIcon className="w-3 h-3 text-[#056B3A]" />
                <span>Specific Landmark (Optional)</span>
              </label>
              <input
                id="landmark"
                type="text"
                name="landmark"
                value={fd.landmark}
                onChange={handleChange}
                placeholder="Near school, market, building"
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>

            {/* NATURE OF FARMING */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="farmingType" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Sprout className="w-3 h-3 text-[#056B3A]" />
                <span>Nature of Farming</span>
              </label>
              <select
                id="farmingType"
                name="farmingType"
                value={fd.farmingType}
                onChange={handleChange}
                onBlur={e => handleBlur("farmingType", e.target.value)}
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer"
              >
                <option value="" disabled>Select farming type</option>
                {FARMING_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.farmingType && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.farmingType}</p>
              )}
            </div>
          </div>

          {/* CONDITIONAL SPECIFY FARMING TYPE */}
          {fd.farmingType === "Other" && (
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs animate-fadeIn focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="specifyFarmingType" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Sprout className="w-3 h-3 text-[#056B3A]" />
                <span>Specify Farming Type</span>
              </label>
              <input
                id="specifyFarmingType"
                type="text"
                name="specifyFarmingType"
                value={fd.specifyFarmingType}
                onChange={handleChange}
                onBlur={e => handleBlur("specifyFarmingType", e.target.value)}
                placeholder="e.g. Mushroom Gardening, Herb Cultivation"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {errors.specifyFarmingType && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.specifyFarmingType}</p>
              )}
            </div>
          )}

          {/* GRID ROW 5: PASSWORD & CONFIRM PASSWORD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* PASSWORD */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 relative">
              <label htmlFor="password" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Lock className="w-3 h-3 text-[#056B3A]" />
                <span>Password</span>
              </label>
              <div className="flex items-center justify-between">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  name="password"
                  value={fd.password}
                  onChange={handleChange}
                  onBlur={e => handleBlur("password", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer p-0.5"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* STRENGTH METER BAR */}
              {fd.password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pwStrength.color} transition-all duration-300`}
                      style={{ width: `${pwStrength.pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                    {pwStrength.label}
                  </span>
                </div>
              )}

              {errors.password && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 relative">
              <label htmlFor="confirmPassword" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Lock className="w-3 h-3 text-[#056B3A]" />
                <span>Confirm Password</span>
              </label>
              <div className="flex items-center justify-between">
                <input
                  id="confirmPassword"
                  type={showConfirmPw ? "text" : "password"}
                  name="confirmPassword"
                  value={fd.confirmPassword}
                  onChange={handleChange}
                  onBlur={e => handleBlur("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer p-0.5"
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* TERMS & CONDITIONS CHECKBOX */}
          <div className="flex items-start gap-2.5 pt-1 text-left">
            <input
              id="terms"
              type="checkbox"
              name="terms"
              checked={fd.terms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded bg-white text-[#056B3A] accent-[#056B3A] cursor-pointer"
              required
            />
            <label htmlFor="terms" className="text-xs text-white/95 font-medium leading-relaxed cursor-pointer select-none">
              I agree to the{" "}
              <Link to="/terms" className="font-bold text-[#80E6A7] hover:underline">
                Terms & Conditions
              </Link>{" "}
              and Privacy Policy.
            </label>
          </div>
          {errors.terms && (
            <p className="text-[10px] font-bold text-red-300 text-left px-1">{errors.terms}</p>
          )}

          {/* SIGN UP BUTTON (VIBRANT YELLOW PILL) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-[#FACC15] hover:bg-[#EAB308] active:scale-[0.99] text-[#14120F] font-black text-sm py-4 rounded-2xl shadow-lg hover:shadow-xl shadow-yellow-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#14120F]" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        {/* FOOTER SWITCH LINK */}
        <p className="text-center text-xs text-white/90 pt-6 font-normal">
          Already have an account?{" "}
          <Link
            to="/auth/sign-in"
            search={redirectParam ? { redirect: redirectParam } as any : undefined}
            className="font-bold text-[#80E6A7] hover:underline transition-colors ml-0.5"
          >
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
