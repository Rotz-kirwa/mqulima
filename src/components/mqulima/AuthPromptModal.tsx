import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Lock,
  X,
  Sparkles,
  ShoppingBag,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  featureName?: string;
  redirectPath?: string;
}

export function AuthPromptModal({
  isOpen,
  onClose,
  title = "Account Required",
  message = "Create a free Mqulima account or sign in to purchase products, use Mqulima AI, and access your personalized agricultural dashboard.",
  featureName,
  redirectPath,
}: AuthPromptModalProps) {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedRedirect =
    redirectPath || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 text-left overflow-hidden z-10"
        >
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0B2117] via-[#1B4332] to-[#85CC14]" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon + Title Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-[#E9F5EC] border border-[#1B4332]/20 flex items-center justify-center text-[#1B4332] shrink-0 shadow-xs">
              <Lock className="h-6 w-6 text-[#1B4332]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0B2117] tracking-tight font-['Outfit',sans-serif]">
                {title}
              </h2>
              {featureName ? (
                <p className="text-xs text-stone-500 font-medium">
                  Authentication required to <span className="font-bold text-stone-800">{featureName}</span>
                </p>
              ) : (
                <p className="text-xs text-stone-500 font-medium">Member Access Only</p>
              )}
            </div>
          </div>

          {/* Main Explanation Body */}
          <p className="text-xs sm:text-sm text-stone-600 mb-5 leading-relaxed">
            {message}
          </p>

          {/* Value Props & Benefits Checklist */}
          <div className="space-y-2.5 bg-[#FAFBF9] rounded-2xl p-4 border border-stone-200/80 mb-6 text-xs text-stone-700 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                ✓
              </div>
              <span>Track product orders, fast delivery & dispatch updates</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                ✓
              </div>
              <span>Gemini-powered plant diagnostics & weather spray windows</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                ✓
              </div>
              <span>Personalized farmer dashboard & 47-county community forum</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate({
                  to: "/auth/sign-in",
                  search: { redirect: resolvedRedirect } as any,
                });
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0B2117] hover:bg-[#16382B] text-[#85CC14] font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer active:scale-[0.99]"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate({
                  to: "/auth/sign-up",
                  search: { redirect: resolvedRedirect } as any,
                });
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer active:scale-[0.99]"
            >
              <span>Create Free Account</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-center text-xs font-bold text-stone-500 hover:text-stone-800 transition cursor-pointer"
            >
              Continue Browsing as Guest
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
