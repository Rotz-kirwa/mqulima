import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/auth/verify")({
  head: () => ({
    meta: [
      { title: "Verify Account · Mqulima" },
      { name: "description", content: "Verify your phone number or email using the one-time password (OTP)." },
    ],
  }),
  component: VerifyAccount,
});

function VerifyAccount() {
  const navigate = useNavigate();
  // Read query parameters passed from sign-up redirect
  const search = Route.useSearch() as { email?: string; phone?: string };
  const contactMethod = search.phone || search.email || "your registered contact";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      // Stub the OTP API call verification
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Verification successful! You can now sign in.");
      navigate({ to: "/auth/sign-in" });
    } catch (err: any) {
      toast.error("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setResendTimer(60);
    toast.success(`A new verification code has been sent to ${contactMethod}.`);
  };

  return (
    <div>
      <div className="text-left mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif">
          Verify Your Account
        </h2>
        <p className="mt-1.5 text-xs text-gray-400">
          Enter the 6-digit OTP code sent to <span className="text-[#F5A623]">{contactMethod}</span>.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center py-2">
          {/* OTP Slots with Mqulima's sharp-cornered style */}
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            className="flex gap-2"
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="border-gray-800 bg-[#0A0F0D] text-white focus:border-[#2D6A4F] rounded-[2px]" />
              <InputOTPSlot index={1} className="border-gray-800 bg-[#0A0F0D] text-white focus:border-[#2D6A4F] rounded-[2px]" />
              <InputOTPSlot index={2} className="border-gray-800 bg-[#0A0F0D] text-white focus:border-[#2D6A4F] rounded-[2px]" />
              <InputOTPSlot index={3} className="border-gray-800 bg-[#0A0F0D] text-white focus:border-[#2D6A4F] rounded-[2px]" />
              <InputOTPSlot index={4} className="border-gray-800 bg-[#0A0F0D] text-white focus:border-[#2D6A4F] rounded-[2px]" />
              <InputOTPSlot index={5} className="border-gray-800 bg-[#0A0F0D] text-white focus:border-[#2D6A4F] rounded-[2px]" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="text-center text-[10px] text-gray-500 font-mono">
          Tip: You can enter any 6 digits (e.g. 123456) to verify during development.
        </div>

        {/* Resend Helper */}
        <div className="text-xs text-gray-400 flex items-center justify-between">
          <span>Didn't receive the code?</span>
          {resendTimer > 0 ? (
            <span className="text-gray-500 font-mono">Resend in {resendTimer}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-bold text-[#F5A623] hover:underline"
            >
              Resend OTP
            </button>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={otp.length < 6 || loading}
          className="w-full flex items-center justify-center gap-2 bg-[#F5A623] px-6 py-3.5 text-sm font-extrabold text-[#0A0F0D] hover:bg-[#F5A623]/90 hover:scale-[1.01] active:scale-100 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 rounded-[2px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#2D6A4F]" />
              Verifying Code...
            </>
          ) : (
            "Verify Code"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-gray-400">
        <Link to="/auth/sign-in" className="font-bold text-[#F5A623] hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
