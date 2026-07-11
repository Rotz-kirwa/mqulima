import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { X, Download, Share, PlusSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MqulimaLogo } from "./MqulimaLogo";

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, triggerInstall } = usePWA();
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    // Check if dismissed in localStorage
    const isDismissed = localStorage.getItem("mq_pwa_banner_dismissed") === "true";
    if (isDismissed || isInstalled) return;

    // Detect iOS & Safari
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const safari = /^((?!chrome|android).)*safari/i.test(ua);
    setIsIOS(ios);
    setIsSafari(safari);

    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    // We show the banner if:
    // 1. Browser supports direct install (isInstallable is true) OR
    // 2. It is iOS/Safari and not running in standalone mode (direct install prompt not supported but share menu can be used)
    if (!isStandalone && (isInstallable || ios)) {
      // Delay slightly for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("mq_pwa_banner_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install trigger, we show guide instead
      return;
    }
    await triggerInstall();
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:hidden bg-white border border-gray-150 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 max-w-sm mx-auto"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="shrink-0 bg-[#2D6A4F] text-white p-2 rounded-xl border border-[#F5A623] shadow-inner">
                <MqulimaLogo size={28} />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Install Mqulima App
                </h4>
                <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                  Access tools, soko marketplace & updates right from your home screen.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-450 transition"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conditional Guidance / Button */}
          {isIOS ? (
            <div className="bg-[#F8F9F8] border border-gray-100 rounded-xl p-2.5 text-left">
              <div className="text-[10px] font-bold text-gray-700 flex items-center gap-1.5 leading-snug">
                <span>To install on iPhone/iPad:</span>
              </div>
              <ol className="text-[9px] text-gray-500 list-decimal list-inside space-y-1 mt-1 font-medium">
                <li className="leading-tight">
                  Tap the <strong className="text-gray-800 inline-flex items-center gap-0.5 px-1 bg-gray-100 border border-gray-200 rounded shrink-0 font-bold"><Share className="h-2.5 w-2.5" /> Share</strong> button in Safari's bottom bar.
                </li>
                <li className="leading-tight">
                  Scroll down and tap <strong className="text-gray-800 inline-flex items-center gap-0.5 px-1 bg-gray-100 border border-gray-200 rounded shrink-0 font-bold"><PlusSquare className="h-2.5 w-2.5" /> Add to Home Screen</strong>.
                </li>
              </ol>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-500 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-lg transition"
              >
                Not Now
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-[#F5A623] hover:bg-[#E0951F] text-white font-black text-[10px] uppercase tracking-wider py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
