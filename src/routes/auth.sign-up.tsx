import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Eye, EyeOff, Loader2, User, Phone, Mail, Lock, ArrowLeft
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { WaveDivider, SproutLogo } from "@/components/auth/AuthMockupAssets";
import { trackEvent } from "@/lib/events";

type SignUpSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/auth/sign-up")({
  validateSearch: (search: Record<string, unknown>): SignUpSearch => {
    return {
      redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Create Account · Mqulima Hub" },
      { name: "description", content: "Join Mqulima Hub — Kenya's #1 agricultural community and direct farm marketplace." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullNameInput, setFullNameInput] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+254");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const startedTrackedRef = useRef(false);
  useEffect(() => {
    if (!startedTrackedRef.current) {
      startedTrackedRef.current = true;
      trackEvent("sign_up_started", { method: "credentials" });
    }

    async function initCsrf() {
      try {
        const { ensureCsrfToken } = await import("@/lib/csrf-client");
        await ensureCsrfToken();
      } catch (e) {
        console.warn("CSRF token init error:", e);
      }
    }
    initCsrf();
  }, []);

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
    setPhoneNumber(fmt);
    if (touched.phoneNumber) {
      if (d.length < 9) {
        setErrors(p => ({ ...p, phoneNumber: "Enter a valid 9-digit Kenyan phone number" }));
      } else {
        setErrors(p => { const cp = { ...p }; delete cp.phoneNumber; return cp; });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const ne: Record<string, string> = {};
    const nameVal = fullNameInput.trim();
    if (!nameVal) {
      ne["fullName"] = "Full name is required";
    } else if (nameVal.length < 2) {
      ne["fullName"] = "Name must be at least 2 characters";
    }

    const cleanDigits = phoneNumber.replace(/\D/g, "");
    if (!phoneNumber || phoneNumber === "+254" || cleanDigits.length < 9) {
      ne["phoneNumber"] = "Valid phone number is required";
    }

    if (!email.trim()) {
      ne["email"] = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      ne["email"] = "Invalid email address";
    }

    if (!password) {
      ne["password"] = "4-digit password is required";
    } else if (password.length < 4) {
      ne["password"] = "Password / PIN must be at least 4 digits";
    }

    if (!terms) {
      ne["terms"] = "You must accept the terms & conditions";
    }

    if (Object.keys(ne).length > 0) {
      setErrors(ne);
      setTouched({ fullName: true, phoneNumber: true, email: true, password: true, terms: true });
      setLoading(false);
      const firstErrKey = Object.keys(ne)[0];
      toast.error(ne[firstErrKey] || "Please fill in all required fields.");
      return;
    }

    const parts = nameVal.split(/\s+/);
    const firstName = parts[0] || "Farmer";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "Farmer";

    try {
      await register({
        firstName,
        lastName,
        phoneNumber,
        email: email.trim().toLowerCase(),
        password,
        terms: true,
      });

      trackEvent("sign_up_completed", { method: "credentials" });
      toast.success("Account created successfully! Welcome to Mqulima Hub.");

      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const redirectUrl = searchParams.get("redirect") || "/";

      if (redirectUrl.includes("?")) {
        const [pathname, searchStr] = redirectUrl.split("?");
        const searchObj: Record<string, string> = {};
        new URLSearchParams(searchStr).forEach((val, key) => { searchObj[key] = val; });
        navigate({ to: pathname as any, search: searchObj as any });
      } else {
        navigate({ to: redirectUrl as any });
      }
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
    <div className="w-full max-w-xl mx-auto rounded-[36px] bg-[#FAF8F0] shadow-[0_25px_60px_-15px_rgba(4,40,25,0.25)] overflow-hidden transition-all duration-300 border border-[#E9E4D4]/60">
      
      {/* TOP HEADER SECTION */}
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
      <div className="bg-[#056B3A] px-6 sm:px-8 pt-4 pb-8 text-white">
        
        {/* SIMPLIFIED 4-FIELD REGISTRATION FORM */}
        <form onSubmit={handleSubmit} data-lpignore="true" data-1p-ignore="true" data-bwignore="true" className="space-y-4">
          
          {/* GRID ROW 1: FULL NAME & PHONE NUMBER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* FULL NAME */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-3 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="fullName" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <User className="w-3.5 h-3.5 text-[#056B3A]" />
                <span>Full Name</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullNameInput}
                onChange={(e) => {
                  setFullNameInput(e.target.value);
                  if (touched.fullName) {
                    if (!e.target.value.trim()) {
                      setErrors(p => ({ ...p, fullName: "Full name is required" }));
                    } else {
                      setErrors(p => { const cp = { ...p }; delete cp.fullName; return cp; });
                    }
                  }
                }}
                onBlur={() => {
                  setTouched(p => ({ ...p, fullName: true }));
                  if (!fullNameInput.trim()) {
                    setErrors(p => ({ ...p, fullName: "Full name is required" }));
                  } else {
                    setErrors(p => { const cp = { ...p }; delete cp.fullName; return cp; });
                  }
                }}
                placeholder="e.g. Peter Keff"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {errors.fullName && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* PHONE NUMBER */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-3 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="phoneNumber" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Phone className="w-3.5 h-3.5 text-[#056B3A]" />
                <span>Phone Number</span>
              </label>
              <input
                id="phoneNumber"
                type="text"
                name="phoneNumber"
                value={phoneNumber}
                onChange={handlePhone}
                onBlur={() => {
                  setTouched(p => ({ ...p, phoneNumber: true }));
                  const clean = phoneNumber.replace(/\D/g, "");
                  if (!phoneNumber || phoneNumber === "+254" || clean.length < 9) {
                    setErrors(p => ({ ...p, phoneNumber: "Enter a valid phone number" }));
                  } else {
                    setErrors(p => { const cp = { ...p }; delete cp.phoneNumber; return cp; });
                  }
                }}
                placeholder="+254 7XX XXX XXX"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {errors.phoneNumber && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.phoneNumber}</p>
              )}
            </div>
          </div>

          {/* GRID ROW 2: EMAIL ADDRESS & 4-DIGIT PASSWORD / PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* EMAIL ADDRESS */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-3 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60">
              <label htmlFor="email" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Mail className="w-3.5 h-3.5 text-[#056B3A]" />
                <span>Email Address</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    if (!e.target.value.trim() || !/\S+@\S+\.\S+/.test(e.target.value)) {
                      setErrors(p => ({ ...p, email: "Enter a valid email address" }));
                    } else {
                      setErrors(p => { const cp = { ...p }; delete cp.email; return cp; });
                    }
                  }
                }}
                onBlur={() => {
                  setTouched(p => ({ ...p, email: true }));
                  if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
                    setErrors(p => ({ ...p, email: "Enter a valid email address" }));
                  } else {
                    setErrors(p => { const cp = { ...p }; delete cp.email; return cp; });
                  }
                }}
                placeholder="farmer@gmail.com"
                required
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              {errors.email && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* 4-DIGIT PASSWORD / PIN */}
            <div className="bg-[#FAF8F0] rounded-2xl px-4 py-3 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 relative">
              <label htmlFor="password" className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5 uppercase">
                <Lock className="w-3.5 h-3.5 text-[#056B3A]" />
                <span>Password / PIN (4+ digits)</span>
              </label>
              <div className="flex items-center justify-between">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) {
                      if (!e.target.value || e.target.value.length < 4) {
                        setErrors(p => ({ ...p, password: "Must be at least 4 digits" }));
                      } else {
                        setErrors(p => { const cp = { ...p }; delete cp.password; return cp; });
                      }
                    }
                  }}
                  onBlur={() => {
                    setTouched(p => ({ ...p, password: true }));
                    if (!password || password.length < 4) {
                      setErrors(p => ({ ...p, password: "Must be at least 4 digits" }));
                    } else {
                      setErrors(p => { const cp = { ...p }; delete cp.password; return cp; });
                    }
                  }}
                  placeholder="e.g. 1234"
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

              {errors.password && (
                <p className="text-[10px] font-bold text-red-500 mt-1">{errors.password}</p>
              )}
            </div>
          </div>

          {/* TERMS & CONDITIONS CHECKBOX */}
          <div className="flex items-center gap-2.5 pt-1 text-left">
            <input
              id="terms"
              type="checkbox"
              name="terms"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="h-4 w-4 rounded bg-white text-[#056B3A] accent-[#056B3A] cursor-pointer"
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

          {/* SIGN UP BUTTON */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-auto min-w-[220px] px-12 bg-[#FACC15] hover:bg-[#EAB308] active:scale-[0.99] text-[#14120F] font-black text-sm py-3.5 rounded-2xl shadow-lg hover:shadow-xl shadow-yellow-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-75 disabled:cursor-not-allowed"
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
          </div>
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
