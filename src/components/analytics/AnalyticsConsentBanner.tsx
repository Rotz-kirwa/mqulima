import React, { useState, useEffect } from "react";
import { ShieldCheck, Cookie, Settings, Check, X } from "lucide-react";
import {
  getStoredConsent,
  acceptAllConsent,
  rejectOptionalConsent,
  saveConsentPreferences,
  onConsentChange,
  DEFAULT_CONSENT,
} from "@/lib/events";

export function AnalyticsConsentBanner() {
  const [hasDecided, setHasDecided] = useState<boolean>(true); // start true to prevent SSR flash
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const existing = getStoredConsent();
    if (!existing) {
      setHasDecided(false);
    } else {
      setAnalyticsEnabled(existing.analytics);
      setMarketingEnabled(existing.marketing);
    }

    return onConsentChange((prefs) => {
      setHasDecided(true);
      setAnalyticsEnabled(prefs.analytics);
      setMarketingEnabled(prefs.marketing);
    });
  }, []);

  const handleAcceptAll = () => {
    acceptAllConsent();
    setHasDecided(true);
    setShowPreferencesModal(false);
  };

  const handleRejectOptional = () => {
    rejectOptionalConsent();
    setHasDecided(true);
    setShowPreferencesModal(false);
  };

  const handleSaveCustom = () => {
    saveConsentPreferences({
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
    });
    setHasDecided(true);
    setShowPreferencesModal(false);
  };

  return (
    <>
      {/* Floating Re-open Button (Allows changing consent preferences later) */}
      {hasDecided && !showPreferencesModal && (
        <button
          onClick={() => setShowPreferencesModal(true)}
          title="Manage Cookie & Analytics Preferences"
          aria-label="Manage Cookie & Analytics Preferences"
          className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-[11px] font-mono text-[#0F3D3C] shadow-sm border border-[#CCE5E1] hover:bg-[#E8F4F1] hover:border-[#278C7B] transition-all cursor-pointer"
        >
          <Cookie className="h-3.5 w-3.5 text-[#278C7B]" />
          <span className="hidden sm:inline font-semibold">Cookie Settings</span>
        </button>
      )}

      {/* Main Consent Banner (Bottom Tray) */}
      {!hasDecided && (
        <aside
          role="region"
          aria-label="Cookie and Privacy Consent"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xl z-50 rounded-2xl bg-white/95 backdrop-blur-md p-5 shadow-2xl border border-[#CCE5E1] text-[#0F3D3C] animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-[#E8F4F1] p-2.5 text-[#278C7B] shrink-0 mt-0.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold tracking-tight text-[#0F3D3C]">
                Your Privacy & Analytics Preferences
              </h3>
              <p className="text-xs leading-relaxed text-[#2C5E5B]">
                Mqulima uses essential cookies to ensure secure operations, and optional Google Analytics 4 to understand website traffic, improve farming tools, and optimize performance. You have full control over your choices.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#CCE5E1]/60">
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-[#2C5E5B] hover:text-[#0F3D3C] hover:bg-[#E8F4F1] rounded-lg transition-colors cursor-pointer"
            >
              Customize
            </button>
            <button
              onClick={handleRejectOptional}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0F3D3C] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Reject Optional
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#278C7B] hover:bg-[#1D6F61] rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Accept All
            </button>
          </div>
        </aside>
      )}

      {/* Granular Preferences Modal */}
      {showPreferencesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-[#CCE5E1] text-[#0F3D3C] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#278C7B]" />
                <h2 id="cookie-preferences-title" className="text-base font-bold text-[#0F3D3C]">
                  Cookie & Analytics Preferences
                </h2>
              </div>
              <button
                onClick={() => setShowPreferencesModal(false)}
                aria-label="Close preferences modal"
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#2C5E5B] leading-relaxed">
              We respect your right to privacy. Toggle optional categories below according to your preference. Changes will be saved and respected across your visit.
            </p>

            <div className="space-y-3.5">
              {/* Essential Category */}
              <div className="rounded-xl bg-[#F8FAF9] p-3.5 border border-[#CCE5E1]/60 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0F3D3C]">Strictly Necessary</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                      Always Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4A7C79] leading-relaxed">
                    Essential for secure authentication, CSRF validation, shopping cart persistence, and core site stability. Cannot be disabled.
                  </p>
                </div>
                <div className="pt-1 text-[#278C7B]">
                  <Check className="h-4 w-4" />
                </div>
              </div>

              {/* Analytics Category */}
              <div className="rounded-xl bg-white p-3.5 border border-[#CCE5E1] flex items-start justify-between gap-3 hover:border-[#278C7B] transition-colors">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#0F3D3C]">
                    Visitor & Performance Analytics (GA4)
                  </span>
                  <p className="text-[11px] text-[#4A7C79] leading-relaxed">
                    Helps us understand how many visitors engage with agricultural market prices, tools, and courses without identifying you personally.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={analyticsEnabled}
                    onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#278C7B]"></div>
                </label>
              </div>

              {/* Marketing Category */}
              <div className="rounded-xl bg-white p-3.5 border border-[#CCE5E1] flex items-start justify-between gap-3 hover:border-[#278C7B] transition-colors">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#0F3D3C]">
                    Campaign Attribution & Referral Insights
                  </span>
                  <p className="text-[11px] text-[#4A7C79] leading-relaxed">
                    Measures the effectiveness of agricultural outreach campaigns, cooperative referrals, and seasonal webinars.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={marketingEnabled}
                    onChange={(e) => setMarketingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#278C7B]"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#CCE5E1]">
              <button
                onClick={handleRejectOptional}
                className="px-3.5 py-2 text-xs font-semibold text-[#0F3D3C] hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Reject All Optional
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-4 py-2 text-xs font-bold text-white bg-[#278C7B] hover:bg-[#1D6F61] rounded-lg shadow-sm cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
