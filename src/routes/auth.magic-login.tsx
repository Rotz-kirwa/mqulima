import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { SproutLogo, WaveDivider } from "@/components/auth/AuthMockupAssets";
import { verifyMagicLinkToken } from "@/lib/auth-recovery.server";

type MagicLoginSearch = {
  token?: string;
};

export const Route = createFileRoute("/auth/magic-login")({
  validateSearch: (search: Record<string, unknown>): MagicLoginSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "One-Tap Sign In · Mqulima" },
      { name: "description", content: "Authenticating your secure Mqulima recovery session." },
    ],
  }),
  component: MagicLoginPage,
});

function MagicLoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const token = search.token || "";

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    if (!token || token.trim().length < 32) {
      setLoading(false);
      setErrorMsg("This sign-in link is missing a valid security token or has expired.");
      return;
    }

    const performMagicLogin = async () => {
      try {
        const res = await verifyMagicLinkToken({
          data: {
            token: token.trim(),
          },
        });

        setSuccess(true);
        toast.success("Welcome back! Signed in via secure one-tap link.");

        // Brief delay for visual confirmation before redirecting
        setTimeout(() => {
          navigate({
            to: "/auth/reset-password",
            search: {
              post_recovery: "1",
            },
          });
        }, 1200);
      } catch (err: any) {
        const msg = err?.message || "Invalid or expired sign-in link. Please request a new one.";
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    performMagicLogin();
  }, [token, navigate]);

  return (
    <div className="w-full max-w-[420px] mx-auto rounded-[36px] bg-[#FAF8F0] shadow-[0_25px_60px_-15px_rgba(4,40,25,0.25)] overflow-hidden transition-all duration-300 border border-[#E9E4D4]/60">
      
      {/* TOP HEADER SECTION */}
      <div className="bg-[#FAF8F0] pt-8 pb-3 flex flex-col items-center justify-center relative">
        <SproutLogo className="w-20 h-16 transition-transform duration-300 hover:scale-105" />
      </div>

      {/* SIGNATURE WAVE TRANSITION */}
      <WaveDivider className="w-full h-10 text-[#056B3A] -mb-[1px]" />

      {/* DEEP FOREST GREEN CARD BODY */}
      <div className="bg-[#056B3A] px-6 sm:px-8 pt-3 pb-8 text-white text-center">
        
        {loading && (
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#80E6A7]" />
            <h2 className="text-xl font-bold tracking-tight">
              Verifying One-Tap Link...
            </h2>
            <p className="text-xs text-[#EAE5D9]/80 max-w-xs">
              Securely validating your cryptographic recovery token and preparing your session.
            </p>
          </div>
        )}

        {!loading && success && (
          <div className="py-6 flex flex-col items-center gap-3 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-[#80E6A7]/20 border border-[#80E6A7]/50 flex items-center justify-center text-[#80E6A7]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Sign In Successful!
            </h2>
            <p className="text-xs text-[#EAE5D9]/90 max-w-xs">
              Your identity has been confirmed. Redirecting to your security dashboard...
            </p>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="py-4 flex flex-col items-center gap-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Unable to Sign In
            </h2>
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-100 text-xs font-medium">
              {errorMsg}
            </div>

            <div className="pt-4 flex flex-col gap-2 w-full">
              <Link
                to="/auth/forgot-password"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#E5A000] hover:bg-[#D49000] text-black font-extrabold text-sm py-3 px-6 rounded-full shadow-md transition-all cursor-pointer"
              >
                <span>Request New Link</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/auth/sign-in"
                className="text-xs font-semibold text-[#80E6A7] hover:underline pt-2"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
