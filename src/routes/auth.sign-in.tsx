import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SproutLogo, WaveDivider } from "@/components/auth/AuthMockupAssets";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Log In · Mqulima Hub" },
      { name: "description", content: "Log in to your Mqulima Hub account to trade, order, and connect with farmers." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!formData.identifier.trim()) {
      setErrorMsg("Please enter your email or phone number");
      setLoading(false);
      return;
    }
    if (!formData.password) {
      setErrorMsg("Please enter your password");
      setLoading(false);
      return;
    }

    try {
      const success = await login(formData.identifier.trim(), formData.password, formData.rememberMe);
      if (!success) {
        throw new Error("Invalid credentials. Please verify your email and password.");
      }
      toast.success("Welcome back! Signed in successfully.");
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const redirectUrl = searchParams.get("redirect") || "/";
      navigate({ to: redirectUrl as any });
    } catch (err: any) {
      const msg = err.message || "Invalid credentials. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password reset instructions will be sent to your registered email or phone.");
  };

  const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;

  return (
    <div className="w-full max-w-[390px] mx-auto rounded-[36px] bg-[#FAF8F0] shadow-[0_25px_60px_-15px_rgba(4,40,25,0.25)] overflow-hidden transition-all duration-300 border border-[#E9E4D4]/60">
      
      {/* TOP HEADER SECTION (Warm Ivory with Sprout Logo) */}
      <div className="bg-[#FAF8F0] pt-10 pb-4 flex flex-col items-center justify-center relative">
        <SproutLogo className="w-24 h-20 transition-transform duration-300 hover:scale-105" />
      </div>

      {/* SIGNATURE ORGANIC WAVE TRANSITION */}
      <WaveDivider className="w-full h-11 text-[#056B3A] -mb-[1px]" />

      {/* DEEP FOREST GREEN CARD BODY */}
      <div className="bg-[#056B3A] px-6 sm:px-7 pt-1 pb-8 text-white">
        
        {/* TITLE */}
        <h1 className="text-2xl sm:text-[26px] font-black text-white text-center tracking-tight mb-5 drop-shadow-xs">
          Log In
        </h1>

        {/* INLINE ERROR IF PRESENT */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-xs font-medium text-center animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* EMAIL INPUT */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 focus-within:border-transparent">
            <label htmlFor="identifier" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              Email
            </label>
            <input
              id="identifier"
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="johndoe@xyz.com"
              autoComplete="username"
              required
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* PASSWORD INPUT */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 focus-within:border-transparent relative">
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
                autoComplete="current-password"
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

          {/* REMEMBER ME & FORGOT PASSWORD ROW */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-white/95 font-medium">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded-md border-0 bg-white text-[#056B3A] accent-[#056B3A] cursor-pointer focus:ring-0"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-medium text-[#80E6A7] hover:text-white transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* LOG IN BUTTON (VIBRANT YELLOW PILL - CENTERED & COMPACT) */}
          <div className="flex justify-center pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-auto min-w-[200px] px-10 bg-[#FACC15] hover:bg-[#EAB308] active:scale-[0.99] text-[#14120F] font-black text-sm py-3.5 rounded-2xl shadow-lg hover:shadow-xl shadow-yellow-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#14120F]" />
                  <span>Logging In...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </div>
        </form>

        {/* FOOTER SWITCH LINK */}
        <p className="text-center text-xs text-white/90 pt-6 font-normal">
          Don't have an account?{" "}
          <Link
            to="/auth/sign-up"
            search={redirectParam ? { redirect: redirectParam } as any : undefined}
            className="font-bold text-[#80E6A7] hover:underline transition-colors ml-0.5"
          >
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
}
