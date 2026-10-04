import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { SproutLogo, WaveDivider } from "@/components/auth/AuthMockupAssets";
import { setNewPasswordAfterRecovery } from "@/lib/auth-recovery.server";

type ResetPasswordSearch = {
  post_recovery?: string;
};

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    post_recovery: typeof search.post_recovery === "string" ? search.post_recovery : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Set New Password · Mqulima" },
      { name: "description", content: "Update your password to keep your Mqulima account secure." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const isPostRecovery = search.post_recovery === "1";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const hasMinLength = password.length >= 8;
  const hasMixedChars = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!hasMinLength) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      await setNewPasswordAfterRecovery({
        data: {
          newPassword: password,
          confirmPassword,
        },
      });

      toast.success("New password saved securely!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const msg = err?.message || "Failed to update password. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info("Password update skipped. You can update your password anytime from your profile settings.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto rounded-[36px] bg-[#FAF8F0] shadow-[0_25px_60px_-15px_rgba(4,40,25,0.25)] overflow-hidden transition-all duration-300 border border-[#E9E4D4]/60">
      
      {/* TOP HEADER SECTION */}
      <div className="bg-[#FAF8F0] pt-8 pb-3 flex flex-col items-center justify-center relative">
        <SproutLogo className="w-20 h-16 transition-transform duration-300 hover:scale-105" />
      </div>

      {/* SIGNATURE WAVE TRANSITION */}
      <WaveDivider className="w-full h-10 text-[#056B3A] -mb-[1px]" />

      {/* DEEP FOREST GREEN CARD BODY */}
      <div className="bg-[#056B3A] px-6 sm:px-8 pt-1 pb-8 text-white">
        
        {/* TITLE */}
        <h1 className="text-2xl font-black text-white text-center tracking-tight mb-1.5 drop-shadow-xs">
          Set a New Password
        </h1>

        <p className="text-xs text-[#EAE5D9]/90 text-center mb-4 leading-relaxed">
          {isPostRecovery
            ? "Your account was recovered successfully. We strongly recommend setting a fresh, strong password now."
            : "Choose a secure password to protect your account and farm data."}
        </p>

        {/* ERROR DISPLAY */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-xs font-medium text-center animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* NEW PASSWORD */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 focus-within:border-transparent relative">
            <label htmlFor="new-password" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              New Password
            </label>
            <div className="flex items-center justify-between">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                disabled={loading}
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

          {/* CONFIRM PASSWORD */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-2.5 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 focus-within:border-transparent">
            <label htmlFor="confirm-password" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              required
              disabled={loading}
              className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* PASSWORD REQUIREMENTS HINTS */}
          <div className="py-1 text-[11px] space-y-1 text-white/80">
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMinLength ? "bg-[#80E6A7] text-black font-bold" : "bg-white/20 text-white"}`}>
                {hasMinLength ? "✓" : "•"}
              </span>
              <span>At least 8 characters</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMixedChars ? "bg-[#80E6A7] text-black font-bold" : "bg-white/20 text-white"}`}>
                {hasMixedChars ? "✓" : "•"}
              </span>
              <span>Contains a number or symbol</span>
            </div>
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isMatch ? "bg-[#80E6A7] text-black font-bold" : "bg-red-400 text-black font-bold"}`}>
                  {isMatch ? "✓" : "✕"}
                </span>
                <span className={isMatch ? "text-[#80E6A7]" : "text-red-200"}>
                  {isMatch ? "Passwords match" : "Passwords do not match"}
                </span>
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !hasMinLength || !isMatch}
              className="w-full flex items-center justify-center gap-2 bg-[#E5A000] hover:bg-[#D49000] text-black font-extrabold text-sm py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Saving New Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-black" />
                  <span>Save New Password</span>
                </>
              )}
            </button>
          </div>

          {/* SKIPPABLE BUTTON */}
          {isPostRecovery && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="text-xs font-semibold text-white/80 hover:text-white underline cursor-pointer py-1 transition-colors"
              >
                Skip for now (continue to Dashboard)
              </button>
            </div>
          )}

        </form>

      </div>
    </div>
  );
}
