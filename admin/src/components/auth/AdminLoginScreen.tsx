import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { getApiUrl } from "../../lib/api";
import { MqulimaLogo } from "../shared/MqulimaLogo";
import loginBg from "../../assets/admin-login-bg.webp";

interface AdminLoginScreenProps {
  onLoginSuccess: (user: { id: string; name: string; email: string; role: string }) => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password.trim()) {
      setError("Please enter both username/email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        if (data.token) {
          localStorage.setItem("mqulima_admin_token", data.token);
          sessionStorage.setItem("mqulima_admin_token", data.token);
        }
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Authentication failed. Invalid admin credentials.");
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError("Network error. Unable to reach authentication server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-[#278C7B] selection:text-white overflow-hidden">
      {/* Background Image (WebP) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      {/* Dark Overlay for High Contrast & Brand Consistency */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#061513]/88 via-[#0B2A27]/82 to-[#103D37]/88 backdrop-blur-[2px]" />

      {/* Glow Effects */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#278C7B]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F59E0B]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Login Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl space-y-6 text-left">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#17605E] to-[#0F3D3C] border border-[#278C7B]/50 flex items-center justify-center mx-auto shadow-lg">
            <MqulimaLogo size={44} />
          </div>

          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] tracking-tight">
            Mqulima Admin Console
          </h1>
          <p className="text-xs text-[#2C5E5B] font-medium">
            Authorized Executive Staff & Super Admin Authentication
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-[#0F3D3C] tracking-wider">
              Admin Email / Username / Phone
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="mqulima@mqulima.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F4F9F8] border border-[#CCE5E1] text-xs font-medium text-[#0F3D3C] placeholder-[#4A7C79] focus:outline-none focus:border-[#278C7B] focus:ring-2 focus:ring-[#278C7B]/20 transition"
              />
              <Mail className="w-4 h-4 text-[#278C7B] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-[#0F3D3C] tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F4F9F8] border border-[#CCE5E1] text-xs font-medium text-[#0F3D3C] placeholder-[#4A7C79] focus:outline-none focus:border-[#278C7B] focus:ring-2 focus:ring-[#278C7B]/20 transition"
              />
              <Lock className="w-4 h-4 text-[#278C7B] absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#4A7C79] hover:text-[#0F3D3C] transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-[#061513] font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-yellow-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2 active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#061513] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Authenticate Admin Session</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
