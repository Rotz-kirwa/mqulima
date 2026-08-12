import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Lock, Sprout, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign In · Mqulima Hub" },
      { name: "description", content: "Sign in to Mqulima Hub's agricultural community and direct farm marketplace." },
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
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const redirectUrl = searchParams.get("redirect") || "/";
      navigate({ to: redirectUrl as any });
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.identifier.trim().length > 0 && formData.password.length > 0;
  const redirectParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;

  return (
    <div className="w-full bg-[#F8FAF6] text-gray-800 font-sans space-y-6">
      {/* HEADER NAV ROW */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#10B981] transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
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
        <h2 className="text-3xl font-black text-gray-950 tracking-tight">Welcome Back</h2>
        <p className="text-sm text-gray-500 font-medium">Log in to manage your produce, trade, and connect with farmers.</p>
      </div>

      {/* MAIN SIGN-IN FORM */}
      <form onSubmit={handleSubmit} data-lpignore="true" data-1p-ignore="true" data-bwignore="true" className="space-y-4">
        
        {/* EMAIL OR PHONE */}
        <div className="flex flex-col text-left">
          <label htmlFor="identifier" className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-[#10B981]" />
            <span>Email or Phone Number</span>
          </label>
          <div className={`relative flex items-center rounded-xl bg-white border ${
            errors.identifier ? "border-red-400 focus-within:ring-2 focus-within:ring-red-400/20" : "border-gray-200 focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-[#10B981]/20"
          } shadow-xs transition-all duration-200 min-h-[48px] px-3.5`}>
            <input
              id="identifier"
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400"
              placeholder="e.g. +254 7XX XXX XXX or user@gmail.com"
              required
            />
          </div>
          {errors.identifier && <p className="text-xs font-medium text-red-500 mt-1 px-1">{errors.identifier}</p>}
        </div>

        {/* PASSWORD */}
        <div className="flex flex-col text-left">
          <label htmlFor="password" className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-[#10B981]" />
            <span>Password</span>
          </label>
          <div className={`relative flex items-center rounded-xl bg-white border ${
            errors.password ? "border-red-400 focus-within:ring-2 focus-within:ring-red-400/20" : "border-gray-200 focus-within:border-[#10B981] focus-within:ring-2 focus-within:ring-[#10B981]/20"
          } shadow-xs transition-all duration-200 min-h-[48px] px-3.5`}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder-gray-400 pr-2"
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
              aria-label="Toggle password"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs font-medium text-red-500 mt-1 px-1">{errors.password}</p>}
        </div>

        {/* REMEMBER ME & FORGOT PASSWORD */}
        <div className="flex items-center justify-between text-xs text-gray-600 px-1 pt-1">
          <label className="flex items-center gap-2 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-[#10B981] focus:ring-[#10B981] cursor-pointer accent-[#10B981]"
            />
            Remember me
          </label>
          <Link to="/about" className="font-bold text-[#10B981] hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] active:scale-[0.99] text-white font-extrabold text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging In...</span>
            </>
          ) : (
            <span>LOG IN</span>
          )}
        </button>
      </form>

      {/* SOCIAL SIGN-IN SEPARATOR */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-gray-200 w-full" />
        <span className="bg-[#F8FAF6] px-4 text-xs font-bold text-gray-400 uppercase tracking-widest absolute">Or sign in with</span>
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

      {/* SIGN UP LINK */}
      <p className="text-center text-sm font-medium text-gray-600 pt-2">
        Don't have an account?{" "}
        <Link
          to="/auth/sign-up"
          search={redirectParam ? { redirect: redirectParam } as any : undefined}
          className="font-bold text-[#10B981] hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
