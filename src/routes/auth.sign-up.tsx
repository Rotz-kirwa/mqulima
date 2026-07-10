import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Check, ChevronsUpDown, Loader2, User, Phone, Mail, CreditCard, MapPin, Landmark as LandmarkIcon, Sprout } from "lucide-react";
import { SignUpSchema } from "@/lib/auth-shop-shared";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Create Account · Mkulima" },
      { name: "description", content: "Join Mkulima's agricultural marketplace." },
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
  "Crop Farming","Livestock Farming","Mixed Farming","Dairy Farming","Poultry Farming",
  "Horticulture","Aquaculture (Fish Farming)","Apiculture (Bee Keeping)","Greenhouse Farming",
  "Fruit Farming","Coffee Farming","Tea Farming","Sugarcane Farming","Other"
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
  if (score <= 2) return { label: "Fair", color: "bg-yellow-400", pct: 50 };
  if (score <= 3) return { label: "Good", color: "bg-blue-400", pct: 75 };
  return { label: "Strong", color: "bg-green-500", pct: 100 };
}

// Reusable premium input wrapper
function InputField({ id, label, error, children }: {
  id: string; label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div suppressHydrationWarning className="flex flex-col">
      <div className="flex flex-col rounded-2xl bg-[#FCFBF4] px-5 py-2.5 text-left shadow-sm focus-within:ring-2 focus-within:ring-[#99D98C] transition-all duration-300">
        <label htmlFor={id} className="text-[10px] font-extrabold text-[#0B6A47] uppercase tracking-wider mb-0.5">{label}</label>
        {children}
      </div>
      {error && <p className="text-xs text-[#FFC1C1] font-semibold mt-1.5 px-2 animate-fadeIn">{error}</p>}
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countyOpen, setCountyOpen] = useState(false);
  const [countySearch, setCountySearch] = useState("");
  const countyRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countyRef.current && !countyRef.current.contains(e.target as Node)) setCountyOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCounties = useMemo(() =>
    COUNTIES.filter(c => c.toLowerCase().includes(countySearch.toLowerCase())),
  [countySearch]);

  if (!isMounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-64 bg-gray-200 rounded-lg" />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

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

    const vr = SignUpSchema.safeParse(fd);
    if (!vr.success) {
      const ne: Record<string, string> = {};
      vr.error.errors.forEach(err => { ne[err.path[0] as string] = err.message; });
      setErrors(ne);
      setLoading(false);
      toast.error("Please correct the validation errors.");
      return;
    }
    try {
      await register(fd);
      toast.success("Account created successfully!");
      navigate({ to: "/shop" });
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

  return (
    <div className="w-full select-none">
      {/* Cream Header with Back Arrow and Title */}
      <div className="bg-[#FCFBF4] pt-10 pb-8 px-8 relative flex items-center justify-center">
        <Link to="/auth/sign-in" className="absolute left-6 text-gray-800 hover:text-black transition-colors" aria-label="Back to sign in">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h2 className="text-gray-950 text-xl font-bold tracking-tight">Sign Up</h2>

        {/* Curved Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] translate-y-[99%] z-20">
          <svg viewBox="0 0 500 80" className="relative block w-full h-[32px] preserve-3d" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,0 500,60 L500,80 L0,80 Z" fill="#0B6A47"></path>
          </svg>
        </div>
      </div>

      {/* Pine Green Form Content Area */}
      <div className="bg-[#0B6A47] pt-12 pb-10 px-8 flex flex-col space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField id="firstName" label="First Name" error={errors.firstName}>
              <input id="firstName" type="text" name="firstName" value={fd.firstName} onChange={handleChange}
                onBlur={e => handleBlur("firstName", e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold" placeholder="John" required />
            </InputField>
            <InputField id="lastName" label="Last Name" error={errors.lastName}>
              <input id="lastName" type="text" name="lastName" value={fd.lastName} onChange={handleChange}
                onBlur={e => handleBlur("lastName", e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold" placeholder="Doe" required />
            </InputField>
          </div>

          {/* Phone Number & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField id="phoneNumber" label="Phone Number" error={errors.phoneNumber}>
              <input id="phoneNumber" type="text" name="phoneNumber" value={fd.phoneNumber} onChange={handlePhone}
                onBlur={e => handleBlur("phoneNumber", e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold" placeholder="+254 7XX XXX XXX" required />
            </InputField>
            <InputField id="email" label="Email Address" error={errors.email}>
              <input id="email" type="email" name="email" value={fd.email} onChange={handleChange}
                onBlur={e => handleBlur("email", e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold" placeholder="farmer@gmail.com" required />
            </InputField>
          </div>

          {/* National ID & County */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField id="nationalId" label="National ID Number" error={errors.nationalId}>
              <input id="nationalId" type="text" name="nationalId" value={fd.nationalId} onChange={handleId}
                onBlur={e => handleBlur("nationalId", e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold" placeholder="Enter 7 or 8 digits" required />
            </InputField>

            {/* County Combobox */}
            <div ref={countyRef} className="relative flex flex-col" suppressHydrationWarning>
              <button id="county-btn" type="button" onClick={() => setCountyOpen(!countyOpen)}
                className="flex flex-col w-full rounded-2xl bg-[#FCFBF4] px-5 py-2.5 text-left shadow-sm focus:ring-2 focus:ring-[#99D98C] transition-all duration-300">
                <span className="text-[10px] font-extrabold text-[#0B6A47] uppercase tracking-wider mb-0.5">County</span>
                <div className="flex items-center justify-between w-full mt-0.5">
                  <span className={fd.county ? "text-sm text-gray-800 font-semibold" : "text-sm text-gray-400"}>
                    {fd.county || "Select county"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 text-[#0B6A47]" />
                </div>
              </button>
              {countyOpen && (
                <div className="absolute z-30 mt-2 w-full border border-gray-100 bg-[#FCFBF4] rounded-2xl shadow-xl max-h-52 overflow-hidden flex flex-col animate-slideDown">
                  <input type="text" placeholder="Search county..." value={countySearch}
                    onChange={e => setCountySearch(e.target.value)}
                    className="w-full border-b border-gray-200 bg-transparent px-5 py-2.5 text-sm text-gray-800 outline-none placeholder-gray-400" autoFocus />
                  <div className="overflow-y-auto flex-1">
                    {filteredCounties.length === 0 ? (
                      <div className="px-5 py-3 text-sm text-gray-400 text-center">No county found</div>
                    ) : filteredCounties.map(c => (
                      <button key={c} type="button" onClick={() => { set("county", c); setCountyOpen(false); setCountySearch(""); setErrors(p => { const cp = {...p}; delete cp.county; return cp; }); }}
                        className={`flex w-full items-center justify-between px-5 py-2.5 text-sm outline-none transition-colors ${fd.county === c ? "bg-[#0B6A47]/10 text-[#0B6A47] font-extrabold" : "text-gray-700 hover:bg-gray-100"}`}>
                        <span>{c}</span>
                        {fd.county === c && <Check className="h-4 w-4 text-[#0B6A47]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.county && <p className="text-xs text-[#FFC1C1] font-semibold mt-1.5 px-2 animate-fadeIn">{errors.county}</p>}
            </div>
          </div>

          {/* Delivery Location & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField id="deliveryLocation" label="Delivery Location / Physical Address" error={errors.deliveryLocation}>
              <input id="deliveryLocation" type="text" name="deliveryLocation" value={fd.deliveryLocation} onChange={handleChange}
                onBlur={e => handleBlur("deliveryLocation", e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold" placeholder="Estate, Road, Building" required />
            </InputField>
            <InputField id="landmark" label="Landmark (Optional)" error={errors.landmark}>
              <input id="landmark" type="text" name="landmark" value={fd.landmark} onChange={handleChange}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold" placeholder="Near school, market" />
            </InputField>
          </div>

          {/* Nature of Farming & Conditional Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div suppressHydrationWarning className="flex flex-col">
              <div className="flex flex-col rounded-2xl bg-[#FCFBF4] px-5 py-2.5 text-left shadow-sm focus-within:ring-2 focus-within:ring-[#99D98C] transition-all duration-300">
                <label htmlFor="farmingType" className="text-[10px] font-extrabold text-[#0B6A47] uppercase tracking-wider mb-0.5">Nature of Farming</label>
                <select id="farmingType" name="farmingType" value={fd.farmingType} onChange={handleChange}
                  onBlur={e => handleBlur("farmingType", e.target.value)}
                  className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 appearance-none cursor-pointer font-semibold" required>
                  <option value="" disabled>Select farming type</option>
                  {FARMING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {errors.farmingType && <p className="text-xs text-[#FFC1C1] font-semibold mt-1.5 px-2 animate-fadeIn">{errors.farmingType}</p>}
            </div>

            {fd.farmingType === "Other" ? (
              <InputField id="specifyFarmingType" label="Specify Farming Type" error={errors.specifyFarmingType}>
                <input id="specifyFarmingType" type="text" name="specifyFarmingType" value={fd.specifyFarmingType} onChange={handleChange}
                  onBlur={e => handleBlur("specifyFarmingType", e.target.value)}
                  className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold animate-fadeIn" placeholder="Mushroom Gardening" required />
              </InputField>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div suppressHydrationWarning className="flex flex-col">
              <div className="flex flex-col rounded-2xl bg-[#FCFBF4] px-5 py-2.5 text-left shadow-sm focus-within:ring-2 focus-within:ring-[#99D98C] transition-all duration-300">
                <label htmlFor="password" className="text-[10px] font-extrabold text-[#0B6A47] uppercase tracking-wider mb-0.5">Password</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <input id="password" type={showPw ? "text" : "password"} name="password" value={fd.password} onChange={handleChange}
                    onBlur={e => handleBlur("password", e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none border-none p-0 placeholder-gray-400 font-semibold" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-[#0B6A47] hover:text-[#2D6A4F] transition-colors" aria-label="Toggle password">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {fd.password && (
                <div className="mt-2 flex items-center gap-2 px-1">
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className={`h-full ${pwStrength.color} rounded-full transition-all duration-500`} style={{ width: `${pwStrength.pct}%` }} />
                  </div>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider ${pwStrength.pct <= 25 ? "text-red-300" : pwStrength.pct <= 50 ? "text-yellow-300" : pwStrength.pct <= 75 ? "text-blue-300" : "text-green-300"}`}>{pwStrength.label}</span>
                </div>
              )}
              {errors.password && <p className="text-xs text-[#FFC1C1] font-semibold mt-1.5 px-2 animate-fadeIn">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <InputField id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
              <input id="confirmPassword" type={showPw ? "text" : "password"} name="confirmPassword" value={fd.confirmPassword} onChange={handleChange}
                onBlur={e => handleBlur("confirmPassword", e.target.value)}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold" placeholder="••••••••" required />
            </InputField>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-3 pt-1 text-white">
            <input id="terms" type="checkbox" name="terms" checked={fd.terms} onChange={handleChange}
              className="mt-0.5 h-4.5 w-4.5 rounded-md border-transparent text-[#0B6A47] focus:ring-transparent cursor-pointer accent-[#0B6A47]" required />
            <label htmlFor="terms" className="text-xs font-semibold leading-relaxed select-none cursor-pointer text-white/80 hover:text-white transition-colors">
              I agree to the <Link to="/about" className="font-bold text-[#99D98C] hover:underline">Terms & Conditions</Link> and Privacy Policy.
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={!isValid || loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1E1B18] text-white font-bold text-sm tracking-wider uppercase py-4 rounded-2xl hover:bg-[#2A2622] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 shadow-md mt-2">
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-white/80 font-medium pt-2">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="font-bold text-[#99D98C] hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

