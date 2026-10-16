import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BellRing,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Layers,
  GraduationCap,
  Newspaper,
  LineChart,
  CloudSun,
  Users,
  BrainCircuit,
  Store,
  HelpCircle,
  ChevronRight,
  User,
  Calendar,
  CreditCard,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  X,
  Loader2,
  ChevronLeft,
  ChevronDown,
  RotateCcw,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch, getApiUrl } from "../../lib/api";
import { adminCache } from "../../lib/cache";
import { SUBSCRIPTION_SUB_CATEGORIES } from "../layout/Sidebar";

export interface SubscriptionItem {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  category: string;
  service_name: string;
  plan_code: string;
  subscription_type: "free" | "paid_recurring" | "one_time" | "trial";
  status: "active" | "pending_confirmation" | "pending_payment" | "expired" | "cancelled" | "unsubscribed" | "failed";
  billing_cycle: "monthly" | "quarterly" | "annual" | "one_time" | "none";
  price_kes: string | number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  payment_status: "paid" | "unpaid" | "pending" | "waived";
  started_at: string;
  expires_at: string | null;
  next_billing_at: string | null;
  cancelled_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_county?: string;
  user_status?: string;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  uniqueSubscribers: number;
  activeSubscriptions: number;
  newLast30Days: number;
  cancelledSubscriptions: number;
  paidSubscribers: number;
  totalRevenueKes: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    activeCount: number;
    revenue: number;
  }>;
}

interface SubscriptionsModuleProps {
  onNavigateTab?: (tab: any) => void;
}

export const SubscriptionsModule: React.FC<SubscriptionsModuleProps> = () => {
  // Read category from URL if present
  const getInitialCategory = () => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("category");
      if (p) return p;
    }
    return "all";
  };

  const [activeCategory, setActiveCategory] = useState<string>(getInitialCategory);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"started_at" | "email" | "price_kes" | "status">("started_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals state
  const [selectedSubscriberEmail, setSelectedSubscriberEmail] = useState<string | null>(null);
  const [subscriberProfile, setSubscriberProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [targetSubscription, setTargetSubscription] = useState<SubscriptionItem | null>(null);
  const [renewExpiryDate, setRenewExpiryDate] = useState("");
  const [renewNotes, setRenewNotes] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);

  // Form for new subscription
  const [newSubForm, setNewSubForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    category: "academy",
    serviceName: "",
    planCode: "standard",
    subscriptionType: "free" as any,
    status: "active" as any,
    billingCycle: "none" as any,
    priceKes: 0,
    paymentStatus: "waived" as any,
    notes: "",
  });
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Listen to category switch dispatched from Sidebar
  useEffect(() => {
    const handleCategoryEvent = (e: any) => {
      if (e?.detail?.category) {
        setActiveCategory(e.detail.category);
        setPage(1);
      }
    };
    window.addEventListener("mq_admin_subscription_category_change", handleCategoryEvent);
    return () => window.removeEventListener("mq_admin_subscription_category_change", handleCategoryEvent);
  }, []);

  // Fetch KPI Stats
  const fetchStats = useCallback(async (bypassCache = false) => {
    try {
      const res = await adminFetch("/api/admin/subscriptions/stats", { bypassCache });
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("[SubscriptionsModule] Failed to fetch stats:", err);
    }
  }, []);

  // Fetch Subscriptions list
  const fetchSubscriptions = useCallback(
    async (bypassCache = false) => {
      if (bypassCache) setIsRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (activeCategory && activeCategory !== "all") params.set("category", activeCategory);
        if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);
        if (filterPayment && filterPayment !== "all") params.set("paymentStatus", filterPayment);
        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        const url = `/api/admin/subscriptions?${params.toString()}`;
        const res = await adminFetch(url, { bypassCache });
        const data = await res.json();

        if (data.success) {
          setSubscriptions(data.subscriptions || []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalCount(data.pagination.total || 0);
          }
          if (data.categoryCounts) {
            setCategoryCounts(data.categoryCounts);
          }
        }
      } catch (err) {
        console.error("[SubscriptionsModule] Fetch error:", err);
        toast.error("Failed to load subscriptions list");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, limit, activeCategory, filterStatus, filterPayment, searchQuery, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Load single subscriber profile
  const openSubscriberProfile = async (email: string) => {
    setSelectedSubscriberEmail(email);
    setLoadingProfile(true);
    try {
      const res = await adminFetch(`/api/admin/subscriptions/subscriber?email=${encodeURIComponent(email)}`, {
        bypassCache: true,
      });
      const data = await res.json();
      if (data.success) {
        setSubscriberProfile(data.profile);
      } else {
        toast.error(data.error || "Failed to load profile");
      }
    } catch (err) {
      toast.error("Error loading subscriber profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Status updates
  const handleStatusChange = async (id: string, newStatus: string, previousStatus: string) => {
    try {
      const res = await adminFetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          id,
          status: newStatus,
          previousStatus,
          notes: `Updated status to ${newStatus} by admin`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Subscription marked as ${newStatus}`);
        fetchSubscriptions(true);
        fetchStats(true);
        if (selectedSubscriberEmail) {
          openSubscriberProfile(selectedSubscriberEmail);
        }
      } else {
        toast.error(data.error || "Status update failed");
      }
    } catch (err) {
      toast.error("Network error while updating status");
    }
  };

  // Renew / Extend handler
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubscription) return;
    setIsRenewing(true);
    try {
      const res = await adminFetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "renew",
          id: targetSubscription.id,
          expiresAt: renewExpiryDate || undefined,
          notes: renewNotes || "Extended by admin operator",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscription renewed successfully!");
        setIsRenewModalOpen(false);
        setTargetSubscription(null);
        fetchSubscriptions(true);
        fetchStats(true);
      } else {
        toast.error(data.error || "Renewal failed");
      }
    } catch (err) {
      toast.error("Failed to renew subscription");
    } finally {
      setIsRenewing(false);
    }
  };

  // Create new subscription handler
  const handleCreateNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubForm.email || !newSubForm.serviceName) {
      toast.error("Please enter email and service name");
      return;
    }
    setIsSubmittingNew(true);
    try {
      const res = await adminFetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...newSubForm,
          priceKes: Number(newSubForm.priceKes || 0),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscriber successfully enrolled!");
        setIsNewModalOpen(false);
        setNewSubForm({
          email: "",
          fullName: "",
          phone: "",
          category: "academy",
          serviceName: "",
          planCode: "standard",
          subscriptionType: "free",
          status: "active",
          billingCycle: "none",
          priceKes: 0,
          paymentStatus: "waived",
          notes: "",
        });
        fetchSubscriptions(true);
        fetchStats(true);
      } else {
        toast.error(data.error || "Failed to create subscription");
      }
    } catch (err) {
      toast.error("Error creating subscription");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // CSV Export handler
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== "all") params.set("category", activeCategory);
      if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);
      if (filterPayment && filterPayment !== "all") params.set("paymentStatus", filterPayment);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const url = getApiUrl(`/api/admin/subscriptions/export?${params.toString()}`);
      const token = localStorage.getItem("mqulima_admin_token") || sessionStorage.getItem("mqulima_admin_token");

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("CSV generation failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `mqulima_subscribers_${activeCategory}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Subscribers CSV exported successfully!");
    } catch (err) {
      toast.error("Failed to export subscriptions CSV");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper for category badge styling
  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case "academy":
        return { label: "Academy", icon: GraduationCap, bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "news":
        return { label: "News", icon: Newspaper, bg: "bg-teal-50 text-teal-700 border-teal-200" };
      case "market_alerts":
        return { label: "Market Rates", icon: LineChart, bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "weather_alerts":
        return { label: "Weather Radar", icon: CloudSun, bg: "bg-sky-50 text-sky-700 border-sky-200" };
      case "community":
        return { label: "Community", icon: Users, bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "ai_services":
        return { label: "AI Services", icon: BrainCircuit, bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "marketplace_business":
        return { label: "Business Plan", icon: Store, bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      default:
        return { label: "Other", icon: HelpCircle, bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="h-3 w-3 text-emerald-600" /> Active
          </span>
        );
      case "pending_confirmation":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="h-3 w-3 text-amber-600" /> Pending Confirmation
          </span>
        );
      case "pending_payment":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <Clock className="h-3 w-3 text-orange-600" /> Pending Payment
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="h-3 w-3 text-rose-600" /> Cancelled
          </span>
        );
      case "unsubscribed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <RotateCcw className="h-3 w-3 text-slate-500" /> Unsubscribed
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <AlertCircle className="h-3 w-3 text-gray-500" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left pb-16">
      {/* =========================================================================
         1. TOP HEADER & PRIMARY ACTIONS
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[6px] bg-[#7C3AED] flex items-center justify-center text-white shadow-sm">
              <BellRing className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black text-[#0F3D3C] tracking-tight">
              Subscription Management System
            </h1>
          </div>
          <p className="text-xs text-[#278C7B] mt-1 font-medium">
            Centralized registry & lifecycle governance for Academy, Alerts, News, AI, and Commerce Subscriptions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              fetchSubscriptions(true);
              fetchStats(true);
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-white border border-[#CCE5E1] hover:bg-[#E8F4F1] text-xs font-bold text-[#0F3D3C] transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#278C7B]" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-white border border-[#CCE5E1] hover:bg-[#E8F4F1] text-xs font-bold text-[#0F3D3C] transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Export filtered subscriber records to CSV"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-[#278C7B]" />}
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#145248] hover:bg-[#0E3A33] text-white text-xs font-black transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Enroll Subscriber</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
         2. KPI SUMMARY CARDS
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Subscriptions</span>
            <Layers className="h-4 w-4 text-[#7C3AED]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0F3D3C] font-mono">
              {stats?.totalSubscriptions ?? "—"}
            </span>
            <span className="text-[11px] text-slate-500">
              ({stats?.uniqueSubscribers ?? 0} unique users)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Live synced across 9 categories
          </div>
        </div>

        <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Active Services</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {stats?.activeSubscriptions ?? "—"}
            </span>
            {stats && stats.totalSubscriptions > 0 && (
              <span className="text-[11px] text-emerald-600 font-bold">
                {Math.round((stats.activeSubscriptions / stats.totalSubscriptions) * 100)}% active rate
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Currently receiving service & alerts</div>
        </div>

        <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">New (Last 30 Days)</span>
            <Clock className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#0284C7] font-mono">
              +{stats?.newLast30Days ?? "—"}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-sky-700 font-bold">Recent organic activations</div>
        </div>

        <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Cancelled / Inactive</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {stats?.cancelledSubscriptions ?? "—"}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Opted out or cancelled plans</div>
        </div>

        <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 shadow-xs bg-linear-to-br from-white to-[#F4FAF8]">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Paid Subscribers</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#0F3D3C] font-mono">
              {stats?.paidSubscribers ?? "—"}
            </span>
            <span className="text-xs font-black text-emerald-700 font-mono">
              KES {Number(stats?.totalRevenueKes || 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#278C7B] font-bold">Verified recurring & course revenue</div>
        </div>
      </div>

      {/* =========================================================================
         3. CATEGORY TABS (9 Core Mqulima Subscription Pillars)
         ========================================================================= */}
      <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-1.5 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {SUBSCRIPTION_SUB_CATEGORIES.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeCategory === tab.id;
            const count = tab.id === "all" ? stats?.totalSubscriptions ?? totalCount : categoryCounts[tab.id] ?? 0;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setPage(1);
                  if (typeof window !== "undefined") {
                    const target = tab.id === "all" ? `/subscriptions` : `/subscriptions?category=${tab.id}`;
                    window.history.replaceState({ tab: "subscriptions", category: tab.id }, "", target);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-xs font-extrabold transition cursor-pointer ${
                  isSelected
                    ? "bg-[#145248] text-white shadow-xs"
                    : "text-[#0F3D3C] hover:bg-[#E8F4F1] hover:text-[#0F3D3C]"
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-[#278C7B]"}`} />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-mono font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-[#E8F4F1] text-[#0F3D3C]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
         4. SEARCH, FILTER & SORT CONTROLS
         ========================================================================= */}
      <div className="bg-white border border-[#CCE5E1] rounded-[8px] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, phone, service, or payment receipt..."
              className="w-full pl-10 pr-4 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-medium text-[#0F3D3C] placeholder:text-slate-400 focus:outline-none focus:border-[#278C7B] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 font-mono">STATUS:</span>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] px-2.5 py-1.5 text-xs font-bold text-[#0F3D3C] focus:outline-none focus:border-[#278C7B]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_confirmation">Pending Confirmation</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 font-mono">PAYMENT:</span>
              <select
                value={filterPayment}
                onChange={(e) => {
                  setFilterPayment(e.target.value);
                  setPage(1);
                }}
                className="bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] px-2.5 py-1.5 text-xs font-bold text-[#0F3D3C] focus:outline-none focus:border-[#278C7B]"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="waived">Waived / Free</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 font-mono">SORT:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] px-2.5 py-1.5 text-xs font-bold text-[#0F3D3C] focus:outline-none focus:border-[#278C7B]"
              >
                <option value="started_at">Subscription Date</option>
                <option value="email">Email</option>
                <option value="price_kes">Amount (KES)</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                className="px-2 py-1.5 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-bold hover:bg-[#E8F4F1] cursor-pointer"
                title="Toggle sort direction"
              >
                {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
         5. SUBSCRIBER DATA TABLE
         ========================================================================= */}
      <div className="bg-white border border-[#CCE5E1] rounded-[8px] shadow-xs overflow-hidden">
        {loading && subscriptions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#278C7B] animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading verified subscriber records...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-[#E8F4F1] text-[#278C7B] flex items-center justify-center mx-auto">
              <BellRing className="h-6 w-6 stroke-[2]" />
            </div>
            <h3 className="text-sm font-black text-[#0F3D3C]">No subscriptions found matching criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query, status filters, or category tabs.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterPayment("all");
                setActiveCategory("all");
              }}
              className="text-xs font-bold text-[#145248] underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] text-[11px] font-mono uppercase text-[#0F3D3C]">
                <tr>
                  <th className="py-3 px-4 font-black">Subscriber</th>
                  <th className="py-3 px-3 font-black">Category</th>
                  <th className="py-3 px-3 font-black">Service & Plan</th>
                  <th className="py-3 px-3 font-black">Billing & Amount</th>
                  <th className="py-3 px-3 font-black">Status</th>
                  <th className="py-3 px-3 font-black">Subscription Date</th>
                  <th className="py-3 px-3 font-black">Renewal / Expiry</th>
                  <th className="py-3 px-4 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CCE5E1]/60">
                {subscriptions.map((sub) => {
                  const catMeta = getCategoryMeta(sub.category);
                  const CatIcon = catMeta.icon;
                  const priceNum = Number(sub.price_kes || 0);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-[#F4FAF8]/80 transition group cursor-pointer"
                      onClick={() => openSubscriberProfile(sub.email)}
                    >
                      {/* Subscriber Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#145248]/10 text-[#145248] flex items-center justify-center font-black text-xs shrink-0">
                            {(sub.full_name || sub.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#0F3D3C] truncate max-w-[180px]">
                              {sub.full_name || "Mqulima User"}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {sub.email}
                            </div>
                            {sub.phone && (
                              <div className="text-[10px] text-slate-400 font-mono">{sub.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10.5px] font-bold border ${catMeta.bg}`}
                        >
                          <CatIcon className="h-3 w-3 shrink-0" />
                          <span>{catMeta.label}</span>
                        </span>
                      </td>

                      {/* Service & Plan */}
                      <td className="py-3.5 px-3 max-w-[220px]">
                        <div className="font-bold text-[#0F3D3C] truncate">{sub.service_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                            {sub.plan_code || "standard"}
                          </span>
                          <span className="text-[10.5px] text-slate-400 capitalize">
                            • {sub.subscription_type.replace("_", " ")}
                          </span>
                        </div>
                      </td>

                      {/* Billing & Amount */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-black text-[#0F3D3C]">
                          {priceNum > 0 ? `KES ${priceNum.toLocaleString()}` : "Free"}
                        </div>
                        <div className="text-[10.5px] text-slate-500 capitalize">
                          {sub.billing_cycle !== "none" ? `${sub.billing_cycle}` : "No recurring fee"}
                        </div>
                        {sub.payment_status === "paid" && (
                          <span className="inline-block text-[9.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            ✓ {sub.payment_method.toUpperCase()}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">{getStatusBadge(sub.status)}</td>

                      {/* Started Date */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        {sub.started_at ? new Date(sub.started_at).toLocaleDateString("en-KE") : "—"}
                      </td>

                      {/* Expiry / Renewal Date */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        {sub.expires_at ? (
                          <span className={new Date(sub.expires_at) < new Date() ? "text-rose-600 font-bold" : ""}>
                            {new Date(sub.expires_at).toLocaleDateString("en-KE")}
                          </span>
                        ) : sub.next_billing_at ? (
                          <span>{new Date(sub.next_billing_at).toLocaleDateString("en-KE")}</span>
                        ) : (
                          <span className="text-slate-400">Ongoing</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openSubscriberProfile(sub.email)}
                            className="px-2 py-1 rounded bg-[#E8F4F1] hover:bg-[#CCE5E1] text-[#145248] text-[11px] font-bold transition cursor-pointer"
                            title="View complete subscriber history"
                          >
                            Profile
                          </button>

                          {sub.status === "active" ? (
                            <button
                              onClick={() => handleStatusChange(sub.id, "cancelled", sub.status)}
                              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition cursor-pointer"
                              title="Cancel subscription"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setTargetSubscription(sub);
                                setIsRenewModalOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition cursor-pointer"
                              title="Reactivate or renew subscription"
                            >
                              Renew
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-[#F4FAF8] border-t border-[#CCE5E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Showing <span className="font-bold text-[#0F3D3C]">{subscriptions.length}</span> of{" "}
            <span className="font-bold text-[#0F3D3C]">{totalCount}</span> subscribers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1.5 rounded bg-white border border-[#CCE5E1] font-bold text-[#0F3D3C] disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono font-bold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 rounded bg-white border border-[#CCE5E1] font-bold text-[#0F3D3C] disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
         6. SUBSCRIBER PROFILE SLIDE-OVER / MODAL
         ========================================================================= */}
      {selectedSubscriberEmail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#CCE5E1] bg-[#F4FAF8] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-[#145248] text-white flex items-center justify-center font-black">
                  {selectedSubscriberEmail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#0F3D3C]">Subscriber Portfolio</h2>
                  <p className="text-xs text-slate-500 font-mono truncate">{selectedSubscriberEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubscriberEmail(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {loadingProfile ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="h-7 w-7 text-[#278C7B] animate-spin" />
                  <p className="text-xs text-slate-500 font-bold">Fetching verified user profile & timeline...</p>
                </div>
              ) : subscriberProfile ? (
                <>
                  {/* User Account Info Card */}
                  <div className="bg-[#F4FAF8] border border-[#CCE5E1] rounded-[8px] p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#CCE5E1]">
                      <span className="font-mono uppercase font-bold text-[10.5px] text-slate-500">
                        Mqulima Unified Identity
                      </span>
                      {subscriberProfile.user ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          ✓ Registered User ({subscriberProfile.user.role})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                          Public / Newsletter Contact
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px]">FULL NAME</span>
                        <span className="font-bold text-[#0F3D3C]">
                          {subscriberProfile.user
                            ? `${subscriberProfile.user.first_name || ""} ${subscriberProfile.user.last_name || ""}`.trim() || "N/A"
                            : subscriberProfile.subscriptions[0]?.full_name || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">PHONE</span>
                        <span className="font-bold text-[#0F3D3C]">
                          {subscriberProfile.user?.phone_number || subscriberProfile.subscriptions[0]?.phone || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">COUNTY / LOCATION</span>
                        <span className="font-bold text-[#0F3D3C]">
                          {subscriberProfile.user?.county || "Kenya"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ACCOUNT STATUS</span>
                        <span className="font-bold text-emerald-700 capitalize">
                          {subscriberProfile.user?.status || "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subscriptions across all categories */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono font-black uppercase tracking-wider text-[#0F3D3C]">
                      Subscribed Services ({subscriberProfile.subscriptions?.length || 0})
                    </h3>

                    <div className="space-y-2.5">
                      {subscriberProfile.subscriptions?.map((s: any) => {
                        const meta = getCategoryMeta(s.category);
                        const MetaIcon = meta.icon;

                        return (
                          <div
                            key={s.id}
                            className="border border-[#CCE5E1] rounded-[6px] p-3.5 bg-white space-y-2 hover:border-[#278C7B] transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${meta.bg}`}>
                                  <MetaIcon className="h-3 w-3" /> {meta.label}
                                </span>
                                <h4 className="font-bold text-xs text-[#0F3D3C] mt-1">{s.service_name}</h4>
                              </div>
                              <div>{getStatusBadge(s.status)}</div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                              <span>
                                Amount: <strong className="text-[#0F3D3C] font-mono">{Number(s.price_kes) > 0 ? `KES ${Number(s.price_kes).toLocaleString()}` : "Free"}</strong>
                              </span>
                              <span>
                                Started: {new Date(s.started_at).toLocaleDateString("en-KE")}
                              </span>
                              {s.status === "active" ? (
                                <button
                                  onClick={() => handleStatusChange(s.id, "cancelled", s.status)}
                                  className="text-rose-600 font-bold hover:underline"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(s.id, "active", s.status)}
                                  className="text-emerald-700 font-bold hover:underline"
                                >
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timeline History */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-mono font-black uppercase tracking-wider text-[#0F3D3C]">
                      Subscription Audit & History
                    </h3>

                    <div className="border-l-2 border-[#CCE5E1] ml-2 space-y-4 pl-4 text-xs">
                      {subscriberProfile.events?.map((ev: any) => (
                        <div key={ev.id} className="relative space-y-0.5">
                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#145248] ring-4 ring-white" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F3D3C] uppercase text-[10px] font-mono tracking-wider">
                              {ev.event_type.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(ev.created_at).toLocaleString("en-KE")}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{ev.notes || "System logged action"}</p>
                          <div className="text-[10px] text-slate-400">
                            Actor: <span className="font-mono font-bold text-slate-600">{ev.actor_email || ev.actor_type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         7. ENROLL NEW SUBSCRIBER MODAL
         ========================================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[8px] shadow-2xl border border-[#CCE5E1] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#CCE5E1]">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#145248]" />
                <h3 className="text-sm font-black text-[#0F3D3C]">Enroll New Subscriber</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newSubForm.email}
                    onChange={(e) => setNewSubForm({ ...newSubForm, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#278C7B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newSubForm.fullName}
                    onChange={(e) => setNewSubForm({ ...newSubForm, fullName: e.target.value })}
                    placeholder="Farmer or Buyer Name"
                    className="w-full px-3 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#278C7B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newSubForm.phone}
                    onChange={(e) => setNewSubForm({ ...newSubForm, phone: e.target.value })}
                    placeholder="+2547XXXXXXXX"
                    className="w-full px-3 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#278C7B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Category *</label>
                  <select
                    value={newSubForm.category}
                    onChange={(e) => setNewSubForm({ ...newSubForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-bold focus:bg-white focus:outline-none focus:border-[#278C7B]"
                  >
                    <option value="academy">Academy Subscriptions</option>
                    <option value="news">News Subscriptions</option>
                    <option value="market_alerts">Market Price Alerts</option>
                    <option value="weather_alerts">Weather Alerts</option>
                    <option value="community">Community Subscriptions</option>
                    <option value="ai_services">AI Services Subscriptions</option>
                    <option value="marketplace_business">Marketplace & Business</option>
                    <option value="other">Other Subscriptions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Service / Course Name *</label>
                <input
                  type="text"
                  required
                  value={newSubForm.serviceName}
                  onChange={(e) => setNewSubForm({ ...newSubForm, serviceName: e.target.value })}
                  placeholder="e.g. Avocado Farming Masterclass or Daily KAMIS Rates"
                  className="w-full px-3 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#278C7B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Type</label>
                  <select
                    value={newSubForm.subscriptionType}
                    onChange={(e) => setNewSubForm({ ...newSubForm, subscriptionType: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#278C7B]"
                  >
                    <option value="free">Free</option>
                    <option value="paid_recurring">Paid Recurring</option>
                    <option value="one_time">One-Time Fee</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSubForm.priceKes}
                    onChange={(e) => setNewSubForm({ ...newSubForm, priceKes: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-[#278C7B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Status</label>
                  <select
                    value={newSubForm.paymentStatus}
                    onChange={(e) => setNewSubForm({ ...newSubForm, paymentStatus: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-medium focus:bg-white focus:outline-none focus:border-[#278C7B]"
                  >
                    <option value="waived">Waived / Free</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Admin Notes</label>
                <textarea
                  value={newSubForm.notes}
                  onChange={(e) => setNewSubForm({ ...newSubForm, notes: e.target.value })}
                  placeholder="Optional internal justification or notes..."
                  rows={2}
                  className="w-full px-3 py-1.5 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs focus:bg-white focus:outline-none focus:border-[#278C7B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#CCE5E1]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] border border-slate-300 font-bold hover:bg-slate-50 cursor-pointer text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-4 py-2 rounded-[6px] bg-[#145248] hover:bg-[#0E3A33] text-white font-black cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingNew && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Enroll Subscriber</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         8. RENEW / EXTEND SUBSCRIPTION MODAL
         ========================================================================= */}
      {isRenewModalOpen && targetSubscription && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[8px] shadow-2xl border border-[#CCE5E1] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#CCE5E1]">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-emerald-700" />
                <h3 className="text-sm font-black text-[#0F3D3C]">Renew / Extend Subscription</h3>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-3.5 text-xs">
              <div className="bg-[#F4FAF8] p-3 rounded border border-[#CCE5E1] space-y-1">
                <div className="text-slate-500 text-[10.5px]">SUBSCRIBER</div>
                <div className="font-bold text-[#0F3D3C]">{targetSubscription.email}</div>
                <div className="text-slate-500 text-[10.5px] pt-1">SERVICE</div>
                <div className="font-bold text-[#0F3D3C]">{targetSubscription.service_name}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  New Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={renewExpiryDate}
                  onChange={(e) => setRenewExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-[#278C7B]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Leave blank to auto-extend based on billing cycle (30 days or 1 year)
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Renewal Notes</label>
                <input
                  type="text"
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  placeholder="e.g. M-Pesa renewal verified, customer requested reactivate"
                  className="w-full px-3 py-2 bg-[#F4FAF8] border border-[#CCE5E1] rounded-[6px] text-xs focus:bg-white focus:outline-none focus:border-[#278C7B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#CCE5E1]">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] border border-slate-300 font-bold hover:bg-slate-50 cursor-pointer text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenewing}
                  className="px-4 py-2 rounded-[6px] bg-emerald-700 hover:bg-emerald-800 text-white font-black cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isRenewing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Renewal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
