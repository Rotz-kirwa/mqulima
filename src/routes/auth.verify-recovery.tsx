import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, RefreshCw, KeyRound, CheckCircle2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { SproutLogo, WaveDivider } from "@/components/auth/AuthMockupAssets";
import { verifyRecoveryCode, requestPasswordRecovery } from "@/lib/auth-recovery.server";

type VerifyRecoverySearch = {
  identifier?: string;
  hint?: string;
};

export const Route = createFileRoute("/auth/verify-recovery")({
  validateSearch: (search: Record<string, unknown>): VerifyRecoverySearch => ({
    identifier: typeof search.identifier === "string" ? search.identifier : undefined,
    hint: typeof search.hint === "string" ? search.hint : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify Code · Mqulima Recovery" },
      { name: "description", content: "Enter the 6-digit recovery code sent to your email and phone." },
    ],
  }),
  component: VerifyRecoveryPage,
});

function VerifyRecoveryPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const identifier = search.identifier || "";
  const displayHint = search.hint || identifier || "your registered contacts";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(60);

  // 60-second cooldown timer for resending
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length < 6) {
      setErrorMsg("Please enter the complete 6-digit recovery code.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await verifyRecoveryCode({
        data: {
          code: code.trim(),
          identifier,
        },
      });

      toast.success("Identity verified! Signed in successfully.");
      // Navigate to set-new-password page (skippable once, recommended)
      navigate({
        to: "/auth/reset-password",
        search: {
          post_recovery: "1",
        },
      });
    } catch (err: any) {
      const msg = err?.message || "Invalid or expired code. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !identifier) return;

    setResending(true);
    setErrorMsg("");

    try {
      await requestPasswordRecovery({
        data: {
          identifier,
        },
      });

      setCooldown(60);
      toast.success(`A fresh code has been sent to ${displayHint}.`);
    } catch (err: any) {
      const msg = err?.message || "Failed to resend code. Please try again in a few moments.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
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
        <h1 className="text-2xl font-black text-white text-center tracking-tight mb-2 drop-shadow-xs">
          Enter Recovery Code
        </h1>

        <p className="text-xs text-[#EAE5D9]/90 text-center mb-5 leading-relaxed">
          We sent a 6-digit code to <span className="font-bold text-[#80E6A7]">{displayHint}</span>. The code expires in 10 minutes.
        </p>

        {/* ERROR DISPLAY */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-xs font-medium text-center animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* OTP INPUT */}
        <form onSubmit={handleVerify} className="space-y-5">
          <div className="flex justify-center py-2">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(val) => {
                setCode(val);
                if (errorMsg) setErrorMsg("");
                if (val.length === 6) {
                  // Auto-submit when all 6 digits entered
                  setTimeout(() => {
                    handleVerify();
                  }, 100);
                }
              }}
              disabled={loading}
              className="flex gap-2"
            >
              <InputOTPGroup className="gap-2 sm:gap-2.5">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-11 h-13 text-xl font-bold bg-[#FAF8F0] text-[#1C201D] border-2 border-[#FAF8F0] focus:border-[#80E6A7] rounded-xl shadow-xs"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* VERIFY SUBMIT BUTTON */}
          <div className="flex justify-center pt-1">
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 bg-[#E5A000] hover:bg-[#D49000] text-black font-extrabold text-sm py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-black" />
                  <span>Verify and Sign In</span>
                </>
              )}
            </button>
          </div>

          {/* RESEND CONTROLS (60s COOLDOWN) */}
          <div className="pt-2 text-center text-xs text-white/85 flex flex-col items-center gap-1.5">
            <span>Didn't receive the code or link?</span>
            {cooldown > 0 ? (
              <span className="font-mono text-xs text-[#80E6A7]">
                Resend available in {cooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1 font-bold text-[#80E6A7] hover:underline cursor-pointer transition-colors"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code & Link</span>
                  </>
                )}
              </button>
            )}
          </div>

        </form>

        {/* BACK TO FORGOT PASSWORD OR LOGIN */}
        <div className="text-center mt-6 pt-3 border-t border-white/10 flex justify-center gap-4 text-xs font-semibold">
          <Link
            to="/auth/forgot-password"
            className="text-white/80 hover:text-white transition-colors"
          >
            ← Change Email/Phone
          </Link>
          <span className="text-white/40">•</span>
          <Link
            to="/auth/sign-in"
            className="text-[#80E6A7] hover:text-white transition-colors"
          >
            Back to Log In
          </Link>
        </div>

      </div>
    </div>
  );
}
