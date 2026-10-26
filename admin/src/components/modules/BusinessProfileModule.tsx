import React, { useState, useEffect } from "react";
import {
  Building2,
  Save,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Globe,
  Camera,
  FileText,
  Search,
  Sparkles,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "../../lib/api";

interface OperatingHourDay {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface FaqItem {
  q: string;
  a: string;
}

interface BusinessProfileState {
  businessName: string;
  legalName: string;
  brandTagline: string;
  brandSlogan: string;
  primaryCategory: string;
  shortDescription: string;
  fullOverview: string;
  phonePrimary: string;
  phoneSecondary: string;
  emailPrimary: string;
  emailSupport: string;
  whatsappNumber: string;
  addressStreet: string;
  addressCity: string;
  addressCounty: string;
  addressPostalCode: string;
  addressCountry: string;
  latitude: number;
  longitude: number;
  mapsUrl: string;
  serviceAreas: string[];
  operatingHours: OperatingHourDay[];
  logoUrl: string;
  coverImageUrl: string;
  galleryImages: string[];
  socialLinks: Record<string, string>;
  faqs: FaqItem[];
  businessPolicies: {
    delivery: string;
    payments: string;
    returns: string;
    warranty: string;
  };
  googlePlaceId: string;
  googleReviewUrl: string;
  isPublished: boolean;
}

interface Props {
  userRole?: string;
}

const DEFAULT_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const BusinessProfileModule: React.FC<Props> = ({ userRole }) => {
  const canEdit =
    userRole === "super_admin" ||
    userRole === "admin" ||
    userRole === "operations_manager";

  const [activeTab, setActiveTab] = useState<
    "identity" | "contact" | "hours" | "media" | "faqs" | "policies" | "google"
  >("identity");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<BusinessProfileState | null>(null);

  // Load current profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/business-profile");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        setProfile({
          businessName: p.businessName || "Mqulima",
          legalName: p.legalName || "Kirgit Agri Enterprises Limited",
          brandTagline: p.brandTagline || "Africa's 360° agriculture ecosystem",
          brandSlogan: p.brandSlogan || "Taking you first class",
          primaryCategory: p.primaryCategory || "Agricultural Supply Outlet & Services",
          shortDescription: p.shortDescription || "",
          fullOverview: p.fullOverview || "",
          phonePrimary: p.phonePrimary || "+254 723 346 134",
          phoneSecondary: p.phoneSecondary || "",
          emailPrimary: p.emailPrimary || "info@mqulima.com",
          emailSupport: p.emailSupport || "support@mqulima.com",
          whatsappNumber: p.whatsappNumber || "254723346134",
          addressStreet: p.addressStreet || "Junction, Eldoret–Iten Highway",
          addressCity: p.addressCity || "Eldoret",
          addressCounty: p.addressCounty || "Uasin Gishu",
          addressPostalCode: p.addressPostalCode || "30100",
          addressCountry: p.addressCountry || "Kenya",
          latitude: Number(p.latitude) || 0.5143,
          longitude: Number(p.longitude) || 35.2698,
          mapsUrl: p.mapsUrl || "https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway",
          serviceAreas: Array.isArray(p.serviceAreas) ? p.serviceAreas : [],
          operatingHours: Array.isArray(p.operatingHours) && p.operatingHours.length > 0
            ? p.operatingHours
            : DEFAULT_DAYS.map((d) => ({
                day: d,
                open: "08:00",
                close: d === "Saturday" ? "13:00" : "18:00",
                closed: d === "Sunday",
              })),
          logoUrl: p.logoUrl || "/mqulima-logo.png",
          coverImageUrl: p.coverImageUrl || "/images/about/hero.webp",
          galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages : [],
          socialLinks: p.socialLinks || {},
          faqs: Array.isArray(p.faqs) ? p.faqs : [],
          businessPolicies: p.businessPolicies || {
            delivery: "",
            payments: "",
            returns: "",
            warranty: "",
          },
          googlePlaceId: p.googlePlaceId || "",
          googleReviewUrl: p.googleReviewUrl || "",
          isPublished: p.isPublished ?? true,
        });
      }
    } catch (err: any) {
      console.error("Failed to load business profile:", err);
      toast.error("Failed to load business profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!canEdit) {
      toast.error("Your role does not have permission to modify the business profile.");
      return;
    }

    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      toast.success("Business profile updated successfully! Changes are live on /business.");
    } catch (err: any) {
      console.error("Failed to save business profile:", err);
      toast.error(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left p-6">
        <div className="h-8 w-64 bg-[#d2e8e3] rounded-[6px]" />
        <div className="h-4 w-96 bg-[#d2e8e3]/70 rounded-[4px]" />
        <div className="h-96 bg-white border border-[#CCE5E1] rounded-2xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Unable to load business profile data.</p>
        <button
          onClick={fetchProfile}
          className="mt-4 px-4 py-2 bg-[#278C7B] text-white rounded-lg font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#CCE5E1] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#245B35] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#041E1C]">
                {profile.businessName} Business Profile
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Google Profile Sync
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage your authoritative public presence, verified address, operating hours, and Schema.org metadata.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <a
            href="/business"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Page
          </a>

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#245B35] hover:bg-[#1C492A] text-white text-xs font-bold shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Profile"}
            </button>
          )}
        </div>
      </div>

      {!canEdit && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            You have read-only access. Only <strong>Super Admin</strong>, <strong>Admin</strong>, or <strong>Operations Manager</strong> roles can edit the official business profile.
          </span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#CCE5E1] pb-1 no-scrollbar text-xs font-bold text-gray-600">
        {[
          { id: "identity", label: "Identity & Slogans", icon: Building2 },
          { id: "contact", label: "Contact & Location", icon: MapPin },
          { id: "hours", label: "Operating Hours", icon: Clock },
          { id: "media", label: "Photos & Media", icon: Camera },
          { id: "faqs", label: "Business FAQs", icon: HelpCircle },
          { id: "policies", label: "Policies & Terms", icon: FileText },
          { id: "google", label: "Google Business & SEO", icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#245B35] text-white shadow-sm"
                  : "hover:bg-[#E8F4F1] text-gray-700 hover:text-[#041E1C]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: IDENTITY & SLOGANS
         ========================================================================= */}
      {activeTab === "identity" && (
        <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-gray-150 pb-3">
            <h2 className="text-base font-bold text-[#041E1C]">Brand Identity & Overview</h2>
            <p className="text-xs text-gray-500">Official name, legal entity, category, and approved marketing text</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Official Business Name</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Legal Entity Name</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.legalName}
                onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Brand Slogan</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.brandSlogan}
                onChange={(e) => setProfile({ ...profile, brandSlogan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Brand Tagline</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.brandTagline}
                onChange={(e) => setProfile({ ...profile, brandTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-700">Primary Business Category</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.primaryCategory}
                onChange={(e) => setProfile({ ...profile, primaryCategory: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
              <p className="text-[11px] text-gray-400">Must reflect verified Google Business Profile primary category.</p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-700">Short Description (Meta & Header)</label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={profile.shortDescription}
                onChange={(e) => setProfile({ ...profile, shortDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-700">Full Business Overview</label>
              <textarea
                rows={4}
                disabled={!canEdit}
                value={profile.fullOverview}
                onChange={(e) => setProfile({ ...profile, fullOverview: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CONTACT & LOCATION
         ========================================================================= */}
      {activeTab === "contact" && (
        <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-gray-150 pb-3">
            <h2 className="text-base font-bold text-[#041E1C]">Headquarters & Contact Details</h2>
            <p className="text-xs text-gray-500">Verified phone numbers, physical address, and Google Maps pin coordinates</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Primary Phone (+254)</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.phonePrimary}
                onChange={(e) => setProfile({ ...profile, phonePrimary: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Secondary / Alternative Phone</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.phoneSecondary}
                onChange={(e) => setProfile({ ...profile, phoneSecondary: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Primary Email</label>
              <input
                type="email"
                disabled={!canEdit}
                value={profile.emailPrimary}
                onChange={(e) => setProfile({ ...profile, emailPrimary: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Support / Enquiries Email</label>
              <input
                type="email"
                disabled={!canEdit}
                value={profile.emailSupport}
                onChange={(e) => setProfile({ ...profile, emailSupport: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">WhatsApp Dispatch Number (Format: 254XXXXXXXXX)</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.whatsappNumber}
                onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Google Maps URL</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.mapsUrl}
                onChange={(e) => setProfile({ ...profile, mapsUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-700">Physical Street Address</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.addressStreet}
                onChange={(e) => setProfile({ ...profile, addressStreet: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">City / Town</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.addressCity}
                onChange={(e) => setProfile({ ...profile, addressCity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">County</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.addressCounty}
                onChange={(e) => setProfile({ ...profile, addressCounty: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Latitude (GPS)</label>
              <input
                type="number"
                step="0.0001"
                disabled={!canEdit}
                value={profile.latitude}
                onChange={(e) => setProfile({ ...profile, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Longitude (GPS)</label>
              <input
                type="number"
                step="0.0001"
                disabled={!canEdit}
                value={profile.longitude}
                onChange={(e) => setProfile({ ...profile, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-gray-700">Service Coverage Areas (Comma separated)</label>
              <input
                type="text"
                disabled={!canEdit}
                value={profile.serviceAreas.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    serviceAreas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: OPERATING HOURS
         ========================================================================= */}
      {activeTab === "hours" && (
        <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-gray-150 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#041E1C]">Weekly Operating Schedule</h2>
              <p className="text-xs text-gray-500">Configures the live open/closed status badge on the public business profile</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg">
              Timezone: Africa/Nairobi (UTC+3)
            </span>
          </div>

          <div className="space-y-3">
            {profile.operatingHours.map((h, idx) => (
              <div
                key={h.day}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  h.closed ? "bg-gray-50 border-gray-200 opacity-70" : "bg-white border-emerald-100"
                }`}
              >
                <div className="w-28 font-bold text-[#041E1C]">{h.day}</div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={h.closed}
                      onChange={(e) => {
                        const updated = [...profile.operatingHours];
                        updated[idx].closed = e.target.checked;
                        setProfile({ ...profile, operatingHours: updated });
                      }}
                      className="rounded text-[#245B35] focus:ring-[#245B35]"
                    />
                    <span className="font-semibold text-gray-600">Closed</span>
                  </label>

                  {!h.closed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        disabled={!canEdit}
                        value={h.open}
                        onChange={(e) => {
                          const updated = [...profile.operatingHours];
                          updated[idx].open = e.target.value;
                          setProfile({ ...profile, operatingHours: updated });
                        }}
                        className="px-2 py-1 rounded-lg border border-gray-250 focus:ring-1 focus:ring-[#245B35]"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="time"
                        disabled={!canEdit}
                        value={h.close}
                        onChange={(e) => {
                          const updated = [...profile.operatingHours];
                          updated[idx].close = e.target.value;
                          setProfile({ ...profile, operatingHours: updated });
                        }}
                        className="px-2 py-1 rounded-lg border border-gray-250 focus:ring-1 focus:ring-[#245B35]"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MEDIA & GALLERY
         ========================================================================= */}
      {activeTab === "media" && (
        <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-gray-150 pb-3">
            <h2 className="text-base font-bold text-[#041E1C]">Business Visuals & Gallery</h2>
            <p className="text-xs text-gray-500">Logo, hero cover banner, and genuine facility photographs</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-gray-700">Logo URL</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-gray-200 p-1 shrink-0 flex items-center justify-center bg-gray-50 overflow-hidden">
                  <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.logoUrl}
                  onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-gray-700">Cover Banner Image URL</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-gray-200 shrink-0 overflow-hidden bg-gray-50">
                  <img src={profile.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={profile.coverImageUrl}
                  onChange={(e) => setProfile({ ...profile, coverImageUrl: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35]"
                />
              </div>
            </div>
          </div>

          {/* Gallery Images List */}
          <div className="pt-4 border-t border-gray-150 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#041E1C]">Facility & Product Gallery Items</h3>
              {canEdit && (
                <button
                  onClick={() =>
                    setProfile({
                      ...profile,
                      galleryImages: [...profile.galleryImages, "/hero-cinematic.webp"],
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Image
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {profile.galleryImages.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  {canEdit && (
                    <button
                      onClick={() => {
                        const updated = profile.galleryImages.filter((_, i) => i !== idx);
                        setProfile({ ...profile, galleryImages: updated });
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: FAQS MANAGEMENT
         ========================================================================= */}
      {activeTab === "faqs" && (
        <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-gray-150 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#041E1C]">Approved Frequently Asked Questions</h2>
              <p className="text-xs text-gray-500">Rendered with accessible accordion controls and Schema.org FAQ markup</p>
            </div>
            {canEdit && (
              <button
                onClick={() =>
                  setProfile({
                    ...profile,
                    faqs: [...profile.faqs, { q: "New Question?", a: "Official answer here." }],
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#245B35] text-white text-xs font-bold hover:bg-[#1C492A] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            )}
          </div>

          <div className="space-y-4">
            {profile.faqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-emerald-800">Question #{idx + 1}</span>
                  {canEdit && (
                    <button
                      onClick={() => {
                        const updated = profile.faqs.filter((_, i) => i !== idx);
                        setProfile({ ...profile, faqs: updated });
                      }}
                      className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={faq.q}
                  onChange={(e) => {
                    const updated = [...profile.faqs];
                    updated[idx].q = e.target.value;
                    setProfile({ ...profile, faqs: updated });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-250 bg-white font-semibold focus:ring-1 focus:ring-[#245B35]"
                />
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={faq.a}
                  onChange={(e) => {
                    const updated = [...profile.faqs];
                    updated[idx].a = e.target.value;
                    setProfile({ ...profile, faqs: updated });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-250 bg-white focus:ring-1 focus:ring-[#245B35] leading-relaxed"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: POLICIES & TERMS
         ========================================================================= */}
      {activeTab === "policies" && (
        <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-gray-150 pb-3">
            <h2 className="text-base font-bold text-[#041E1C]">Business Policies & Standards</h2>
            <p className="text-xs text-gray-500">Official guidelines for dispatch, accepted payments, returns, and seed warranties</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Delivery & Logistics Policy</label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={profile.businessPolicies.delivery}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    businessPolicies: { ...profile.businessPolicies, delivery: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Payment Methods Policy</label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={profile.businessPolicies.payments}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    businessPolicies: { ...profile.businessPolicies, payments: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Returns & Damaged Goods Policy</label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={profile.businessPolicies.returns}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    businessPolicies: { ...profile.businessPolicies, returns: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Input Authenticity & Warranty</label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={profile.businessPolicies.warranty}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    businessPolicies: { ...profile.businessPolicies, warranty: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35] leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: GOOGLE BUSINESS PROFILE & SEO
         ========================================================================= */}
      {activeTab === "google" && (
        <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-gray-150 pb-3">
            <h2 className="text-base font-bold text-[#041E1C]">Google Business Profile Integration & SEO</h2>
            <p className="text-xs text-gray-500">Link verified Google Place IDs, customer review URLs, and Schema.org status</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Google Place ID (Optional)</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="e.g. ChIJ..."
                value={profile.googlePlaceId}
                onChange={(e) => setProfile({ ...profile, googlePlaceId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35]"
              />
              <p className="text-[11px] text-gray-400">Obtained from Google Business Profile console once verified.</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700">Google Review Request URL</label>
              <input
                type="text"
                disabled={!canEdit}
                placeholder="e.g. https://g.page/r/..."
                value={profile.googleReviewUrl}
                onChange={(e) => setProfile({ ...profile, googleReviewUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-250 focus:ring-2 focus:ring-[#245B35]"
              />
              <p className="text-[11px] text-gray-400">Direct link for customers to leave reviews on your Google listing.</p>
            </div>
          </div>

          {/* Integration Status & Checklist */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-3">
            <h3 className="font-bold text-sm text-[#041E1C] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Google Business Profile Verification Checklist
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>NAP Consistency:</strong> Name ({profile.businessName}), Address ({profile.addressStreet}, {profile.addressCity}), and Phone ({profile.phonePrimary}) match Google Maps records.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Website URL:</strong> Link Google Business Profile directly to <code>https://mqulima.com/business</code>.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Schema.org LocalBusiness:</strong> Valid JSON-LD structured data is active and rendered in SSR HTML.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>XML Sitemap:</strong> Public URL <code>/business</code> registered with priority 0.85 in <code>/sitemap.xml</code>.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
