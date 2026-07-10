import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign In · Mkulima" },
      { name: "description", content: "Sign in to Mkulima's agricultural marketplace." },
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 bg-gray-200 rounded-2xl mb-2" />
          <div className="h-6 w-24 bg-gray-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-200 rounded-lg mx-auto" />
          <div className="h-4 w-60 bg-gray-200 rounded-lg mx-auto" />
        </div>
        <div className="space-y-4 pt-4">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const c = { ...prev };
        delete c[name];
        return c;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.identifier.trim()) {
      setErrors((prev) => ({ ...prev, identifier: "Email or Phone Number is required" }));
      setLoading(false);
      return;
    }
    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      setLoading(false);
      return;
    }

    try {
      const success = await login(formData.identifier, formData.password, formData.rememberMe);
      if (!success) {
        throw new Error("Invalid email/phone number or password");
      }
      toast.success("Signed in successfully!");
      navigate({ to: "/shop" });
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.identifier.trim().length > 0 && formData.password.length > 0;

  return (
    <div className="w-full select-none">
      {/* Cream Header with Leaf Logo */}
      <div className="bg-[#FCFBF4] pt-10 pb-8 px-8 relative flex flex-col items-center justify-center">
        <div className="flex items-center justify-center mb-1">
          <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M48 60 C38 45 28 45 22 52 C20 58 28 66 38 65 C43 65 47 62 48 60 Z" fill="#99D98C" />
            <path d="M50 60 C58 35 75 22 84 25 C88 38 75 58 58 64 C55 65 52 63 50 60 Z" fill="#0B6A47" />
          </svg>
        </div>

        {/* Curved Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] translate-y-[99%] z-20">
          <svg viewBox="0 0 500 80" className="relative block w-full h-[32px] preserve-3d" preserveAspectRatio="none">
            <path d="M0,0 C150,90 350,0 500,60 L500,80 L0,80 Z" fill="#0B6A47"></path>
          </svg>
        </div>
      </div>

      {/* Pine Green Form Content Area */}
      <div className="bg-[#0B6A47] pt-12 pb-10 px-8 flex flex-col space-y-6">
        <h2 className="text-white text-3xl font-bold text-center tracking-wide mb-2">Log In</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address */}
          <div suppressHydrationWarning className="flex flex-col">
            <div className="flex flex-col rounded-2xl bg-[#FCFBF4] px-5 py-2.5 text-left shadow-sm focus-within:ring-2 focus-within:ring-[#99D98C] transition-all duration-300">
              <label htmlFor="identifier" className="text-[10px] font-extrabold text-[#0B6A47] uppercase tracking-wider mb-0.5">Email or Phone Number</label>
              <input
                id="identifier"
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                className="bg-transparent text-sm text-gray-800 outline-none w-full border-none p-0 mt-0.5 placeholder-gray-400 font-semibold"
                placeholder="e.g., +254 7XX XXX XXX or user@gmail.com"
                required
              />
            </div>
            {errors.identifier && (
              <p className="text-xs text-[#FFC1C1] font-semibold mt-1.5 px-2 animate-fadeIn">{errors.identifier}</p>
            )}
          </div>

          {/* Password */}
          <div suppressHydrationWarning className="flex flex-col">
            <div className="flex flex-col rounded-2xl bg-[#FCFBF4] px-5 py-2.5 text-left shadow-sm focus-within:ring-2 focus-within:ring-[#99D98C] transition-all duration-300">
              <label htmlFor="password" className="text-[10px] font-extrabold text-[#0B6A47] uppercase tracking-wider mb-0.5">Password</label>
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none border-none p-0 placeholder-gray-400 font-semibold"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#0B6A47] hover:text-[#2D6A4F] transition-colors"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="text-xs text-[#FFC1C1] font-semibold mt-1.5 px-2 animate-fadeIn">{errors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs text-white px-1 pt-1">
            <label className="flex items-center gap-2 font-semibold select-none cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded-md border-transparent text-[#0B6A47] focus:ring-transparent cursor-pointer accent-[#0B6A47]"
              />
              Remember me
            </label>
            <Link to="/about" className="font-semibold text-[#99D98C] hover:underline">
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1E1B18] text-white font-bold text-sm tracking-wider uppercase py-4 rounded-2xl hover:bg-[#2A2622] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 shadow-md mt-2"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex flex-col items-center pt-2">
          <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4">Or Sign In with</span>
          <div className="flex items-center gap-4">
            {/* Facebook */}
            <button type="button" className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all shadow-sm">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
              </svg>
            </button>
            {/* Google */}
            <button type="button" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-sm">
              <svg className="w-5.5 h-5.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
            {/* Apple */}
            <button type="button" className="w-10 h-10 rounded-full bg-[#1E1B18] border border-white/10 flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all shadow-sm">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.11.09 2.27-.56 2.95-1.39z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-white/80 font-medium pt-2">
          Don't have an account?{" "}
          <Link to="/auth/sign-up" className="font-bold text-[#99D98C] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

