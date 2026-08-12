import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Eye, EyeOff, Check, ChevronsUpDown, Loader2, User, Phone, Mail,
  CreditCard, MapPin, Landmark as LandmarkIcon, Sprout, Lock, ArrowLeft
} from "lucide-react";
import { SignUpSchema } from "@/lib/auth-shop-shared";
import { useAuth } from "@/hooks/useAuth";

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

  if (score <= 1) return { label: "Weak", color: "bg-red-500", pct: 25 };
  if (score <= 2) return { label: "Fair", color: "bg-amber-500", pct: 50 };
  if (score <= 3) return { label: "Good", color: "bg-blue-500", pct: 75 };
  return { label: "Strong", color: "bg-emerald-500", pct: 100 };
}

function InputGroup({
  id,
  label,
  icon: Icon,
  error,
  children
}: {
  id: string;
  label: string;
  icon?: any;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col text-left">
      <label htmlFor={id} className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-[#10B981]" />}
        <span>{label}</span>
      </label>
      <div className={`relative flex items-center rounded-xl bg-white border ${
        error ? "border-red-400 focus-within:ring-2 focus-within:ring-red-400/20" : "border-gray-200 focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-[#10B981]/20"
      } shadow-xs transition-all duration-200 min-h-[48px] px-3.5`}>
        {children}
      </div>
      {error && <p className="text-xs font-medium text-red-500 mt-1 px-1">{error}</p>}
    </div>
  );
}

function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fd, setFd] = useState({
    firstName: "", lastName: "", phoneNumber: "+254", email: "", nationalId: "",
    county: "", deliveryLocation: "", landmark: "", farmingType: "" as any,
    specifyFarmingType: "", password: "", confirmPassword: "", terms: false,
  });
  const [fullNameInput, setFullNameInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
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
      if (countyRef.current && !countyRef.current.contains(e.target as Node)) setCountyOpen(false);
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
    if (d.length > 0) fmt = d.length <= 3 ? `+254 ${d}` : d.length <= 6 ? `+254 ${d.substring(0,3)} ${d.substring(3)}` : `+254 ${d.substring(0,3)} ${d.substring(3,6)} ${d.substring(6)}`;
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
    else if (fd.lastName.length < 2) ne["lastName"] = "Last name must be at least 2 characters";

    if (!fd.phoneNumber || fd.phoneNumber === "+254") ne["phoneNumber"] = "Phone number is required";
    else if (!/^\+254 \d{3} \d{3} \d{3}$/.test(fd.phoneNumber)) ne["phoneNumber"] = "Phone number must be +254 7XX XXX XXX";

    if (!fd.email) ne["email"] = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(fd.email)) ne["email"] = "Invalid email address";

    if (!fd.nationalId) ne["nationalId"] = "National ID number is required";
    else if (!/^\d{7,8}$/.test(fd.nationalId)) ne["nationalId"] = "National ID must be 7 or 8 digits";

    if (!fd.county) ne["county"] = "Please select your county";
    if (!fd.deliveryLocation) ne["deliveryLocation"] = "Please select your area of delivery";
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

    if (!fd.terms) ne["terms"] = "You must agree to the Terms & Conditions";

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

  const isValid = fd.firstName.length >= 2 && fd.lastName.length >= 2 &&
    /^\+254 \d{3} \d{3} \d{3}$/.test(fd.phoneNumber) && /\S+@\S+\.\S+/.test(fd.email) &&
    /^\d{7,8}$/.test(fd.nationalId) && fd.county.length > 0 && fd.deliveryLocation.length > 0 &&
    fd.farmingType.length > 0 && fd.password.length >= 8 && /[0-9]/.test(fd.password) &&
    /[A-Z]/.test(fd.password) && fd.password === fd.confirmPassword && fd.terms &&
    (fd.farmingType !== "Other" || (fd.specifyFarmingType || "").trim().length > 0) &&
    Object.keys(errors).length === 0;

  const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;

  return (
    <div className="w-full bg-[#F8FAF6] text-gray-800 font-sans space-y-6">
      {/* HEADER NAV ROW */}
      <div className="flex items-center justify-between">
        <Link
          to="/auth/sign-in"
          search={redirectParam ? { redirect: redirectParam } as any : undefined}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#10B981] transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sign In</span>
        </Link>

        {/* Mobile Logo Branding */}
        <div className="flex lg:hidden items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#10B981] flex items-center justify-center">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-gray-900 font-mono">MQULIMA<span className="text-[#10B981]">HUB</span></span>
        </div>
      </div>

      {/* FORM TITLE */}
      <div className="text-left space-y-1">
        <h2 className="text-3xl font-black text-gray-950 tracking-tight">Join Mqulima Today</h2>
        <p className="text-sm text-gray-500 font-medium">Create your profile to buy, sell, and connect with Kenya's farming community.</p>
      </div>

      {/* MAIN SIGN-UP FORM */}
      <form onSubmit={handleSubmit} data-lpignore="true" data-1p-ignore="true" data-bwignore="true" className="space-y-4">
        
        {/* ROW 1: FULL NAME & PHONE NUMBER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputGroup id="fullName" label="Full Name" icon={User} error={errors.firstName || errors.lastName}>
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
                  else if (last.length < 2) setErrors(p => ({ ...p, firstName: "", lastName: "Last name must be at least 2 characters" }));
                  else setErrors(p => { const cp = { ...p }; delete cp.firstName; delete cp.lastName; return cp; });
                }
              }}
              onBlur={() => {
                setTouched(p => ({ ...p, firstName: true, lastName: true }));
                const parts = fullNameInput.trim().split(/\s+/);
                const first = parts[0] || "";
                const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
                if (!first) setErrors(p => ({ ...p, firstName: "First name is required", lastName: "" }));
                else if (first.length < 2) setErrors(p => ({ ...p, firstName: "First name must be at least 2 characters", lastName: "" }));
                else if (!last) setErrors(p => ({ ...p, firstName: "", lastName: "Please enter both first & last name" }));
                else if (last.length < 2) setErrors(p => ({ ...p, firstName: "", lastName: "Last name must be at least 2 characters" }));
                else setErrors(p => { const cp = { ...p }; delete cp.firstName; delete cp.lastName; return cp; });
              }}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400"
              placeholder="e.g. Peter Keff"
              required
            />
          </InputGroup>

          <InputGroup id="phoneNumber" label="Phone Number" icon={Phone} error={errors.phoneNumber}>
            <input
              id="phoneNumber"
              type="text"
              name="phoneNumber"
              value={fd.phoneNumber}
              onChange={handlePhone}
              onBlur={e => handleBlur("phoneNumber", e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400"
              placeholder="+254 7XX XXX XXX"
              required
            />
          </InputGroup>
        </div>

        {/* ROW 2: EMAIL ADDRESS & NATIONAL ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputGroup id="email" label="Email Address" icon={Mail} error={errors.email}>
            <input
              id="email"
              type="email"
              name="email"
              value={fd.email}
              onChange={handleChange}
              onBlur={e => handleBlur("email", e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400"
              placeholder="farmer@gmail.com"
              required
            />
          </InputGroup>

          <InputGroup id="nationalId" label="National ID Number" icon={CreditCard} error={errors.nationalId}>
            <input
              id="nationalId"
              type="text"
              name="nationalId"
              value={fd.nationalId}
              onChange={handleId}
              onBlur={e => handleBlur("nationalId", e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400"
              placeholder="Enter 7 or 8 digits"
              required
            />
          </InputGroup>
        </div>

        {/* ROW 3: COUNTY COMBOBOX & AREA OF DELIVERY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* County Combobox */}
          <div ref={countyRef} className="relative flex flex-col text-left">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#10B981]" />
              <span>County</span>
            </label>
            <button
              type="button"
              onClick={() => setCountyOpen(!countyOpen)}
              className={`flex items-center justify-between w-full rounded-xl bg-white border ${
                errors.county ? "border-red-400" : "border-gray-200 focus:border-[#10B981]"
              } px-3.5 min-h-[48px] text-sm font-semibold transition-all text-left shadow-xs cursor-pointer`}
            >
              <span className={fd.county ? "text-gray-900" : "text-gray-400"}>
                {fd.county || "Select county"}
              </span>
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            </button>

            {countyOpen && (
              <div className="absolute z-40 mt-16 w-full border border-gray-200 bg-white rounded-xl shadow-xl max-h-52 overflow-hidden flex flex-col animate-fadeIn">
                <input
                  type="text"
                  placeholder="Search county..."
                  value={countySearch}
                  onChange={e => setCountySearch(e.target.value)}
                  className="w-full border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-800 outline-none"
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
                        fd.county === c ? "bg-[#10B981]/10 text-[#10B981]" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>{c}</span>
                      {fd.county === c && <Check className="h-3.5 w-3.5 text-[#10B981]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {errors.county && <p className="text-xs font-medium text-red-500 mt-1 px-1">{errors.county}</p>}
          </div>

          {/* Area of Delivery */}
          <InputGroup id="deliveryLocation" label="Area of Delivery" icon={MapPin} error={errors.deliveryLocation}>
            <input
              id="deliveryLocation"
              type="text"
              name="deliveryLocation"
              value={fd.deliveryLocation}
              onChange={handleChange}
              onBlur={e => handleBlur("deliveryLocation", e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400"
              placeholder="Enter custom delivery area or town (e.g. Eldoret West)"
              required
            />
          </InputGroup>
        </div>

        {/* ROW 4: LANDMARK (OPTIONAL) & NATURE OF FARMING */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputGroup id="landmark" label="Specific Landmark (Optional)" icon={LandmarkIcon} error={errors.landmark}>
            <input
              id="landmark"
              type="text"
              name="landmark"
              value={fd.landmark}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400"
              placeholder="Near school, market, building"
            />
          </InputGroup>

          <InputGroup id="farmingType" label="Nature of Farming" icon={Sprout} error={errors.farmingType}>
            <select
              id="farmingType"
              name="farmingType"
              value={fd.farmingType}
              onChange={handleChange}
              onBlur={e => handleBlur("farmingType", e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none border-none p-0 appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Select farming type</option>
              {FARMING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </InputGroup>
        </div>

        {/* CONDITIONAL SPECIFY FARMING TYPE */}
        {fd.farmingType === "Other" && (
          <InputGroup id="specifyFarmingType" label="Specify Farming Type" icon={Sprout} error={errors.specifyFarmingType}>
            <input
              id="specifyFarmingType"
              type="text"
              name="specifyFarmingType"
              value={fd.specifyFarmingType}
              onChange={handleChange}
              onBlur={e => handleBlur("specifyFarmingType", e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400 animate-fadeIn"
              placeholder="e.g. Mushroom Gardening"
              required
            />
          </InputGroup>
        )}

        {/* ROW 5: PASSWORD & CONFIRM PASSWORD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Password Input with Visibility Toggle & Strength Meter */}
          <div className="flex flex-col text-left">
            <label htmlFor="password" className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-[#10B981]" />
              <span>Password</span>
            </label>
            <div className={`relative flex items-center rounded-xl bg-white border ${
              errors.password ? "border-red-400" : "border-gray-200 focus-within:border-[#10B981]"
            } shadow-xs min-h-[48px] px-3.5`}>
              <input
                id="password"
                type={showPw ? "text" : "password"}
                name="password"
                value={fd.password}
                onChange={handleChange}
                onBlur={e => handleBlur("password", e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400 pr-2"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Meter Bar */}
            {fd.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${pwStrength.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pwStrength.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {pwStrength.label}
                  </span>
                </div>
              </div>
            )}
            {errors.password && <p className="text-xs font-medium text-red-500 mt-1 px-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <InputGroup id="confirmPassword" label="Confirm Password" icon={Lock} error={errors.confirmPassword}>
            <input
              id="confirmPassword"
              type={showPw ? "text" : "password"}
              name="confirmPassword"
              value={fd.confirmPassword}
              onChange={handleChange}
              onBlur={e => handleBlur("confirmPassword", e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400"
              placeholder="••••••••"
              required
            />
          </InputGroup>
        </div>

        {/* TERMS & CONDITIONS CHECKBOX */}
        <div className="flex items-start gap-3 pt-1 text-left">
          <input
            id="terms"
            type="checkbox"
            name="terms"
            checked={fd.terms}
            onChange={handleChange}
            className="mt-0.5 h-4.5 w-4.5 rounded border-gray-300 text-[#10B981] focus:ring-[#10B981] cursor-pointer accent-[#10B981]"
            required
          />
          <label htmlFor="terms" className="text-xs font-medium leading-relaxed text-gray-600 cursor-pointer select-none">
            I agree to the <Link to="/terms" className="font-bold text-[#10B981] hover:underline">Terms & Conditions</Link> and Privacy Policy.
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] text-white font-extrabold text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <span>SIGN UP</span>
          )}
        </button>
      </form>

      {/* SOCIAL SIGN-UP SEPARATOR */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-[#F8FAF6] px-4 text-xs font-bold text-gray-400 uppercase tracking-widest absolute">Or sign up with</span>
      </div>

      {/* SOCIAL BUTTONS */}
      <div className="w-full">
        <button
          type="button"
          onClick={() => toast.info("Google Sign-In will be available soon!")}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-xs transition cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>

      {/* SIGN IN LINK */}
      <p className="text-center text-sm font-medium text-gray-600 pt-2">
        Already have an account?{" "}
        <Link
          to="/auth/sign-in"
          search={redirectParam ? { redirect: redirectParam } as any : undefined}
          className="font-bold text-[#10B981] hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
