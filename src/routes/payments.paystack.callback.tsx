import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ShoppingBag, ShieldCheck, FileText } from "lucide-react";
import { verifyPaystackPaymentStatus } from "@/lib/api/paystack.server";

export const Route = createFileRoute("/payments/paystack/callback")({
  head: () => ({
    meta: [
      { title: "Paystack Payment Verification · Mqulima Hub" },
      { name: "description", content: "Verifying your Paystack payment transaction securely." },
    ],
  }),
  component: PaystackCallbackPage,
});

function PaystackCallbackPage() {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    reference?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
  } | null>(null);

  useEffect(() => {
    async function verify() {
      // Extract reference from URL query params (Paystack passes reference and trxref)
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const reference = params.get("reference") || params.get("trxref");

      if (!reference) {
        setVerifying(false);
        setSuccess(false);
        setErrorMsg("No payment reference found in callback URL.");
        return;
      }

      try {
        setVerifying(true);
        const result = await verifyPaystackPaymentStatus({ data: { reference } });

        if (result.success && result.paid) {
          setSuccess(true);
          setPaymentDetails({
            reference,
            orderId: result.orderId,
            amount: result.amount,
            currency: result.currency || "KES"
          });
        } else {
          setSuccess(false);
          setErrorMsg(result.error || "Payment verification failed or status is not successful.");
          setPaymentDetails({ reference });
        }
      } catch (err: any) {
        console.error("Callback verification exception:", err);
        setSuccess(false);
        setErrorMsg(err.message || "An error occurred while verifying your payment.");
      } finally {
        setVerifying(false);
      }
    }

    verify();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAF6] font-sans flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-150 p-6 sm:p-8 text-center space-y-6">
        
        {/* HEADER BRANDING */}
        <div className="flex items-center justify-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white font-black text-sm">
            🌾
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900 font-mono">
            MQULIMA<span className="text-[#2D6A4F]">HUB</span>
          </span>
        </div>

        {/* LOADING STATE */}
        {verifying && (
          <div className="py-8 space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#2D6A4F]/20 animate-ping" />
              <Loader2 className="w-10 h-10 text-[#2D6A4F] animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-gray-900">Verifying Payment...</h2>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Communicating with Paystack REST API to confirm your card transaction status.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {!verifying && success && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Payment Verified & Confirmed
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Order Paid Successfully! 🎉</h2>
              <p className="text-xs text-gray-600">
                Your payment has been received and verified via Paystack. Your order is now being processed.
              </p>
            </div>

            {/* PAYMENT SUMMARY CARD */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Payment Provider</span>
                <span className="font-extrabold text-[#2D6A4F] flex items-center gap-1">
                  <ShieldCheck size={12} /> Paystack Card
                </span>
              </div>
              {paymentDetails?.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Amount Paid</span>
                  <span className="font-black text-gray-900 text-sm">
                    {paymentDetails.currency || "KES"} {paymentDetails.amount.toLocaleString()}
                  </span>
                </div>
              )}
              {paymentDetails?.reference && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Transaction Ref</span>
                  <span className="font-mono text-[10px] text-gray-700 bg-gray-200 px-2 py-0.5 rounded">
                    {paymentDetails.reference}
                  </span>
                </div>
              )}
              {paymentDetails?.orderId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Order ID</span>
                  <span className="font-mono text-[10px] text-gray-700">
                    #{paymentDetails.orderId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/dashboard"
                className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                <span>View My Orders</span>
              </Link>
              <Link
                to="/shop"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {!verifying && success === false && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800">
                Verification Unsuccessful
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Verification Failed</h2>
              <p className="text-xs text-red-600 font-medium">
                {errorMsg || "The transaction could not be verified or was cancelled by the user."}
              </p>
            </div>

            {paymentDetails?.reference && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-left text-xs">
                <span className="text-gray-500 font-medium block text-[10px] uppercase">Transaction Reference</span>
                <span className="font-mono text-gray-800 text-[11px] block mt-0.5">{paymentDetails.reference}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/shop"
                className="w-full bg-[#2D6A4F] hover:bg-[#1A5438] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <ShoppingBag size={16} />
                <span>Return to Shop & Retry</span>
              </Link>
              <Link
                to="/contact"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Contact Customer Support</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
