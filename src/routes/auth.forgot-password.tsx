import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck, Mail, Phone } from "lucide-react";
import { SproutLogo, WaveDivider } from "@/components/auth/AuthMockupAssets";
import { requestPasswordRecovery } from "@/lib/auth-recovery.server";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password · Mqulima" },
      {
        name: "description",
        content: "Recover access to your Mqulima account. We will send a secure sign-in code and link to your email and phone.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formStartTime, setFormStartTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setFormStartTime(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const clean = identifier.trim();
    if (!clean) {
      setErrorMsg("Please enter your registered email address or phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await requestPasswordRecovery({
        data: {
          identifier: clean,
          honeypot,
          formStartTime,
        },
      });

      toast.success("Recovery code dispatched!");
      // Navigate to verification screen with identifier and hint query params
      navigate({
        to: "/auth/verify-recovery",
        search: {
          identifier: clean,
          hint: res.maskedHint || clean,
        },
      });
    } catch (err: any) {
      const msg = err?.message || "Failed to process recovery request. Please try again.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto rounded-[36px] bg-[#FAF8F0] shadow-[0_25px_60px_-15px_rgba(4,40,25,0.25)] overflow-hidden transition-all duration-300 border border-[#E9E4D4]/60">
      
      {/* TOP HEADER SECTION */}
      <div className="bg-[#FAF8F0] pt-8 pb-3 flex flex-col items-center justify-center relative">
        <SproutLogo className="w-20 h-16 transition-transform duration-300 hover:scale-105" />
      </div>

      {/* SIGNATURE WAVE TRANSITION */}
      <WaveDivider className="w-full h-10 text-[#056B3A] -mb-[1px]" />

      {/* DEEP FOREST GREEN CARD BODY */}
      <div className="bg-[#056B3A] px-6 sm:px-7 pt-1 pb-8 text-white">
        
        {/* TITLE */}
        <h1 className="text-2xl font-black text-white text-center tracking-tight mb-2 drop-shadow-xs">
          Forgot Password
        </h1>

        <p className="text-xs text-[#EAE5D9]/90 text-center mb-5 leading-relaxed">
          Enter your registered email or phone number. We will send a secure 6-digit code and one-tap sign-in link to <strong>both</strong> channels.
        </p>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-xs font-medium text-center animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Honeypot Bot Trap (invisible to real users) */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input
              type="text"
              name="hp_security_check"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* INPUT FIELD */}
          <div className="bg-[#FAF8F0] rounded-2xl px-4 py-3 text-left shadow-xs transition-all focus-within:ring-2 focus-within:ring-[#8CB63D]/60 focus-within:border-transparent">
            <label htmlFor="identifier" className="block text-[11px] font-bold text-[#1C201D] tracking-tight mb-0.5">
              Email Address or Phone Number
            </label>
            <div className="flex items-center gap-2">
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="e.g. 0712345678 or farmer@mqulima.com"
                autoComplete="username"
                required
                disabled={loading}
                className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
              />
            </div>
          </div>

          {/* CHANNELS NOTICE */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-white/80 py-1">
            <span className="inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#80E6A7]" />
              Email Link & Code
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#80E6A7]" />
              SMS Code
            </span>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 bg-[#E5A000] hover:bg-[#D49000] text-black font-extrabold text-sm py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Send Recovery Code</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* BACK TO LOGIN */}
        <div className="text-center mt-6 pt-3 border-t border-white/10">
          <Link
            to="/auth/sign-in"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#80E6A7] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Remembered your password? Log In</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
