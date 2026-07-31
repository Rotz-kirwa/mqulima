import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { loginAdminUser } from "@/lib/auth-server";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Secure Administrator Gateway · Mqulima Hub" },
      { name: "description", content: "Administrator authentication portal for Mqulima Hub management console." },
    ],
  }),
  component: AdminGatewayPage,
});

function AdminGatewayPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("Mqulima001@gmail.com");
  const [password, setPassword] = useState("MqulimaAdmin2026!");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginAdminUser({
        data: { email: email.trim(), password, rememberMe }
      });

      if (res.success) {
        toast.success(`Welcome back, ${res.user.name || "Administrator"}!`);
        // Force hard navigation to refresh session context in client
        window.location.href = "/";
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid administrator credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#143326] relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Subtle background overlay effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay pointer-events-none" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600')" }}
      />

      {/* ADMIN CONSOLE GATEWAY CARD */}
      <div className="relative z-10 w-full max-w-md bg-[#1D4A38] border border-[#2D6E54]/40 rounded-[2rem] p-6 sm:p-8 shadow-2xl backdrop-blur-md text-left">
        
        {/* HEADER TITLE */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#F5C453]/10 text-[#F5C453] mb-3">
            <ShieldCheck className="h-6 w-6 text-[#F5C453]" />
          </div>
          <h1 className="text-sm font-extrabold text-[#F5C453] uppercase tracking-[0.25em] font-sans">
            SECURE ADMINISTRATOR GATEWAY
          </h1>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* FIELD 1: ADMIN EMAIL */}
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#DDF0E6] pl-3">
              ADMIN EMAIL
            </label>
            <div className="relative flex items-center bg-[#FAF6EE] rounded-[2rem] px-4 py-3 border border-transparent focus-within:border-[#F5C453] transition-all shadow-inner">
              <Mail className="h-5 w-5 text-[#1D4A38] shrink-0 mr-3" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Mqulima001@gmail.com"
                className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* FIELD 2: SECURE PASSWORD */}
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#DDF0E6] pl-3">
              SECURE PASSWORD
            </label>
            <div className="relative flex items-center bg-[#FAF6EE] rounded-[2rem] px-4 py-3 border-2 border-[#E5A93C] focus-within:ring-2 focus-within:ring-[#F5C453]/50 transition-all shadow-inner">
              <Lock className="h-5 w-5 text-[#1D4A38] shrink-0 mr-3" />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="MqulimaAdmin2026!"
                className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none placeholder-gray-400 pr-2"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#1D4A38] hover:text-black transition-colors p-1 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* REMEMBER ME & FORGOT PASSWORD */}
          <div className="flex items-center justify-between pt-1 px-2 text-xs font-semibold text-[#DDF0E6]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#2D6E54] bg-[#143326] text-[#F5C453] accent-[#E5A93C] cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Contact super admin for password reset."); }} className="hover:underline text-[#DDF0E6]/90">
              Forgot password?
            </a>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#E5A93C] hover:bg-[#F5C453] active:scale-[0.99] text-[#143326] font-black text-xs uppercase tracking-widest py-4 rounded-[2rem] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <span>AUTHENTICATE & ENTER CONSOLE</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
