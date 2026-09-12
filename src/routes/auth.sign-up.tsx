import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WaveDivider } from "@/components/auth/AuthMockupAssets";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Sign Up · Mqulima Hub" },
      { name: "description", content: "Create an account on Mqulima Hub to connect, trade, and discover fresh produce." },
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

function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    county: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showExtraFields, setShowExtraFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.firstName.trim()) {
      setErrorMsg("Please enter your First Name");
      return;
    }
    if (!formData.lastName.trim()) {
      setErrorMsg("Please enter your Last Name");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMsg("Please enter a valid email address");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        county: formData.county.trim() || undefined,
        deliveryLocation: formData.county.trim() || "Kenya",
        farmingType: "General Agriculture",
        terms: true,
      });

      toast.success("Account created successfully! Welcome to Mqulima.");
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const redirectUrl = searchParams.get("redirect") || "/";
      navigate({ to: redirectUrl as any });
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message);
        setErrorMsg(parsed.error || "Registration failed");
        toast.error(parsed.error || "Registration failed");
      } catch {
        const msg = err.message || "Unable to register. Please try again.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;

  return (
    <div className="w-full max-w-[390px] mx-auto rounded-[36px] bg-[#FAF8F0] shadow-[0_25px_60px_-15px_rgba(4,40,25,0.25)] overflow-hidden transition-all duration-300 border border-[#E9E4D4]/60">
      
      {/* TOP HEADER SECTION (Back Arrow + Sign Up Title) */}
      <div className="bg-[#FAF8F0] pt-6 pb-2 px-5 flex items-center justify-between relative">
        <Link
          to="/auth/sign-in"
          search={redirectParam ? { redirect: redirectParam } as any : undefined}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#1C201D] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
          aria-label="Back to Log In"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </Link>

        <h1 className="text-xl sm:text-2xl font-black text-[#1C201D] tracking-tight pr-6">
          Sign Up
        </h1>

        <div className="w-3" /> {/* Spacer for centering balance */}
      </div>

      {/* SIGNATURE ORGANIC WAVE TRANSITION */}
      <WaveDivider className="w-full h-10 text-[#056B3A] -mb-[1px]" />

      {/* DEEP FOREST GREEN CARD BODY */}
      <div className="bg-[#056B3A] px-6 sm:px-7 pt-1 pb-8 text-white">
        
        {/* INLINE ERROR IF PRESENT */}
        {errorMsg && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-xs font-medium text-center animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* SIGN UP FORM (5 CORE FIELDS MATCHING MOCKUP) */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* 1. FIRST NAME */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
            <label htmlFor="firstName" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              autoComplete="given-name"
              required
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* 2. LAST NAME */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
            <label htmlFor="lastName" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              autoComplete="family-name"
              required
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* 3. EMAIL */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
            <label htmlFor="email" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="johndoe@xyz.com"
              autoComplete="email"
              required
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* 4. PASSWORD */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 relative">
            <label htmlFor="password" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              Password
            </label>
            <div className="flex items-center justify-between">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••••••"
                autoComplete="new-password"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer p-0.5"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 5. CONFIRM PASSWORD */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 relative">
            <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              Confirm Password
            </label>
            <div className="flex items-center justify-between">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••••••••"
                autoComplete="new-password"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer p-0.5"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* OPTIONAL ACCORDION: PHONE & COUNTY (FOR M-PESA & LOCALIZED DELIVERY) */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowExtraFields(!showExtraFields)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-emerald-100 transition-colors cursor-pointer"
            >
              <span>+ Add Phone & County (Optional)</span>
              {showExtraFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showExtraFields && (
              <div className="mt-2 space-y-2.5 animate-fadeIn">
                <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs">
                  <label htmlFor="phoneNumber" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
                    Phone Number (for M-Pesa & SMS)
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs">
                  <label htmlFor="county" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
                    County / Region
                  </label>
                  <select
                    id="county"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer"
                  >
                    <option value="">Select your county</option>
                    {COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SIGN UP BUTTON (ESPRESSO JET-BLACK PILL) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-[#14120F] hover:bg-[#221F1A] active:scale-[0.99] text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Signing Up...</span>
              </>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        {/* FOOTER SWITCH LINK */}
        <p className="text-center text-xs text-white/90 pt-5 font-normal">
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
