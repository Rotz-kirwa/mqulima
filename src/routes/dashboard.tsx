import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Calendar,
  Heart,
  Bell,
  Award,
  TrendingUp,
  MapPin,
  Download,
  Wifi,
  WifiOff,
  Settings,
  Star,
  Search,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Filter,
  Tag,
  X,
  Wrench,
  CheckCircle,
  Clock,
  UserCheck,
  Phone,
  MessageSquare,
  FileText,
  AlertCircle,
  Eye,
  ArrowRight,
  Sparkles,
  ShoppingCart,
  ShieldCheck,
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Save,
  User,
  ThumbsUp,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { usePWA } from "@/hooks/usePWA";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getUserInitials } from "@/lib/auth-types";
import { useCart } from "@/lib/cart-context";
import { useWishlistIds } from "@/lib/wishlist";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserOrders,
  getUserServiceBookings,
  getUserNotifications,
  markNotificationRead,
  getUserForumPosts,
  getUserSavedForumPosts,
  getSavedProductsDetails,
  updateAccountProfile,
  deleteUserAccount,
} from "@/lib/api/dashboard.server";
import { getProducts } from "@/lib/api/products.server";
import { adminCreateProduct, adminUpdateProduct, adminDeleteProduct, adminGetCategoriesList } from "@/lib/api/admin-shop.server";
import { adminGetServiceRequests, adminAssignServiceExpert, adminUpdateServiceStatus } from "@/lib/api/admin-services.server";

type DashboardSearch = {
  tab?: "overview" | "orders" | "saved" | "services" | "posts" | "profile" | "admin";
};

const VALID_TABS = new Set(["overview", "orders", "saved", "services", "posts", "profile", "admin"]);

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    const raw = typeof search.tab === "string" ? search.tab : "overview";
    return {
      tab: (VALID_TABS.has(raw) ? raw : "overview") as DashboardSearch["tab"],
    };
  },
  component: Dashboard,
});

function Dashboard() {
  const { user, logout, isLoading, updateUser } = useAuth();
  const { cartItems, addToCart, setCartOpen } = useCart();
  const { wishlistIds, removeWishlistId } = useWishlistIds();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const activeTab = search.tab || "overview";

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCounty, setProfileCounty] = useState("");
  const [profileYears, setProfileYears] = useState("0");
  const [profileCrops, setProfileCrops] = useState("");
  const [profileLivestock, setProfileLivestock] = useState("");

  const [channels, setChannels] = useState({
    sowing: true,
    market: false,
    weather: true,
  });
  const {
    isOnline,
    isInstallable,
    isInstalled,
    triggerInstall,
    notificationPermission,
    requestNotificationPermission,
  } = usePWA();

  const queryClient = useQueryClient();

  const [cachedUser, setCachedUser] = useState<any | null>(null);
  const activeUser = user || cachedUser;
  const isAdmin = activeUser?.role === "admin" || activeUser?.role === "super_admin";
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["userOrders", activeUser?.id],
    queryFn: () => getUserOrders({ data: { userId: activeUser!.id } }),
    enabled: !!activeUser?.id && activeUser.id !== "user"
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["userBookings", activeUser?.id],
    queryFn: () => getUserServiceBookings({ data: activeUser!.id }),
    enabled: !!activeUser?.id && activeUser.id !== "user"
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["userNotifications", activeUser?.id],
    queryFn: () => getUserNotifications({ data: activeUser!.id }),
    enabled: !!activeUser?.id && activeUser.id !== "user"
  });

  const { data: myPosts, isLoading: myPostsLoading } = useQuery({
    queryKey: ["userForumPosts", activeUser?.id],
    queryFn: () => getUserForumPosts({ data: activeUser!.id }),
    enabled: !!activeUser?.id && activeUser.id !== "user"
  });

  const { data: savedPosts, isLoading: savedPostsLoading } = useQuery({
    queryKey: ["userSavedForumPosts", activeUser?.id],
    queryFn: () => getUserSavedForumPosts({ data: activeUser!.id }),
    enabled: !!activeUser?.id && activeUser.id !== "user"
  });

  const { data: savedProducts, isLoading: savedProductsLoading } = useQuery({
    queryKey: ["savedProductsDetails", wishlistIds.join(",")],
    queryFn: () => getSavedProductsDetails({ data: { ids: wishlistIds } }),
    enabled: wishlistIds.length > 0
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      return markNotificationRead({
        data: {
          notificationId,
          userId: activeUser!.id,
          csrfToken: getCsrfTokenFromCookie()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userNotifications", activeUser?.id] });
    }
  });

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const { ensureCsrfToken } = await import("@/lib/csrf-client");
      const csrfToken = await ensureCsrfToken();
      return updateAccountProfile({
        data: {
          userId: activeUser!.id,
          name: profileName.trim(),
          phone: profilePhone.trim(),
          county: profileCounty.trim() || "Kenya",
          yearsFarming: Number(profileYears) || 0,
          crops: profileCrops.trim(),
          livestock: profileLivestock.trim(),
          csrfToken,
        },
      });
    },
    onSuccess: (res) => {
      if (res?.user) {
        updateUser(res.user);
        setCachedUser((prev: any) => (prev ? { ...prev, ...res.user } : res.user));
      }
      toast.success("Account profile updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update account profile.");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const { ensureCsrfToken } = await import("@/lib/csrf-client");
      const csrfToken = await ensureCsrfToken();
      return deleteUserAccount({
        data: {
          userId: activeUser!.id,
          csrfToken,
        },
      });
    },
    onSuccess: async () => {
      await logout();
      toast.success("Account permanently deleted.");
      navigate({ to: "/" });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Could not delete account right now. Please try again or email mqulima@mqulima.com.");
    },
  });

  const [mounted, setMounted] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mqulima_user_account");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            setCachedUser(parsed);
          } else {
            localStorage.removeItem("mqulima_user_account");
          }
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    setProfileName(activeUser.name || "");
    setProfilePhone(activeUser.phone || "");
    setProfileCounty(activeUser.county || "Kenya");
    const yrs = activeUser.yearsFarming ?? (parseInt(String(activeUser.farmSize || "0"), 10) || 0);
    setProfileYears(String(yrs));
    setProfileCrops(activeUser.crops || "");
    setProfileLivestock(activeUser.livestock || "");
  }, [activeUser]);

  useEffect(() => {
    if (!mounted || isLoading || activeUser || redirectedRef.current) return;
    redirectedRef.current = true;
    navigate({
      to: "/auth/sign-in",
      search: { redirect: `/dashboard?tab=${activeTab}` } as any,
      replace: true,
    });
  }, [mounted, isLoading, activeUser, activeTab, navigate]);

  useEffect(() => {
    if (!mounted) return;
    if (activeUser && (activeUser.role === "admin" || activeUser.role === "super_admin")) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = "https://i.pinimg.com/1200x/40/27/8b/40278bca7c2df2276814acc0ae7b8afe.jpg";
        link.type = "image/jpeg";
      }
    }
    if (activeUser?.email) {
      fetch(`/api/user/subscriptions?email=${encodeURIComponent(activeUser.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.channels) {
            setChannels((prev) => ({
              ...prev,
              sowing: data.channels.sowing ?? prev.sowing,
              market: data.channels.market ?? prev.market,
              weather: data.channels.weather ?? prev.weather,
            }));
          }
        })
        .catch(() => {});
    }
  }, [mounted, activeUser]);

  if (!mounted || !activeUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFBF4]">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const handleToggleChannel = async (key: "sowing" | "market" | "weather", value: boolean) => {
    if (value && notificationPermission !== "granted") {
      const result = await requestNotificationPermission();
      if (result !== "granted") {
        return; // Don't turn on if permission denied
      }
    }
    setChannels((prev) => ({ ...prev, [key]: value }));
    try {
      await fetch("/api/user/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: key,
          enabled: value,
          email: activeUser?.email,
        }),
      });
      if (value) {
        toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} alerts enabled!`);
      } else {
        toast.info(`${key.charAt(0).toUpperCase() + key.slice(1)} alerts disabled.`);
      }
    } catch (_) {}
  };

  return (
    <AppLayout>
      {/* =========================================================================
         ACCOUNT & DASHBOARD HERO PROFILE CARD (Matched to Mqulima App)
         ========================================================================= */}
      <section className="bg-[#0F291E] py-8 md:py-12 text-white border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-[#85CC14]/10 blur-[100px] pointer-events-none" />

        <div className="container-px mx-auto max-w-7xl relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5 text-left min-w-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-[#16382B] to-[#16A34A] text-white flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 border-2 border-[#85CC14]/70 shadow-lg overflow-hidden">
                {activeUser.avatarUrl ? (
                  <img src={activeUser.avatarUrl} alt={activeUser.name} className="h-full w-full object-cover" />
                ) : (
                  getUserInitials(activeUser.name, activeUser.email)
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full bg-[#85CC14]/20 border border-[#85CC14]/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#85CC14]">
                    MY ACCOUNT
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-extrabold text-[#85CC14]">
                    <CheckCircle className="h-3 w-3 text-[#85CC14]" />
                    <span>Verified {activeUser.role === "admin" || activeUser.role === "super_admin" ? "Administrator" : "Farmer"}</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight font-['Outfit',sans-serif] truncate">
                  {activeUser.name || "Mqulima Farmer"}
                </h1>
                <p className="text-xs sm:text-sm text-white/85 truncate">{activeUser.email}</p>
                <p className="flex items-center gap-1.5 text-xs text-white/75 font-medium truncate">
                  <MapPin className="h-3.5 w-3.5 text-[#85CC14] shrink-0" />
                  <span>
                    {[activeUser.phone, activeUser.county || "Kenya"].filter(Boolean).join(" • ")}
                    {activeUser.crops ? ` • ${activeUser.crops}` : ""}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Stats Pill Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto">
              <button type="button" onClick={() => navigate({ search: { tab: "orders" } as any })} className="text-left cursor-pointer hover:scale-[1.02] transition-transform">
                <Stat label="Order History" value={orders?.length ? String(orders.length) : "0"} icon={Receipt} color="lime" />
              </button>
              <button type="button" onClick={() => navigate({ search: { tab: "saved" } as any })} className="text-left cursor-pointer hover:scale-[1.02] transition-transform">
                <Stat label="Saved Items" value={String(wishlistIds.length + (savedPosts?.length || 0))} icon={Heart} color="yellow" />
              </button>
              <button type="button" onClick={() => navigate({ search: { tab: "services" } as any })} className="text-left cursor-pointer hover:scale-[1.02] transition-transform">
                <Stat label="Booked Services" value={bookings?.length ? String(bookings.length) : "0"} icon={Briefcase} color="yellow" />
              </button>
              <button type="button" onClick={() => setCartOpen(true)} className="text-left cursor-pointer hover:scale-[1.02] transition-transform">
                <Stat label="My Cart" value={String(cartCount)} icon={ShoppingCart} color="lime" />
              </button>
            </div>
          </div>

          {/* MAIN ACCOUNT TOP NAVIGATION TABS */}
          <div className="mt-8 flex items-center gap-2 border-b border-white/15 pb-0.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => navigate({ search: { tab: "overview" } as any })}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === "overview"
                  ? "bg-[#FAFBF9] text-[#0F291E] border-white/20 font-black shadow-md"
                  : "text-white/70 hover:text-white border-transparent hover:bg-white/10"
              }`}
            >
              <LayoutDashboard className={`h-4 w-4 ${activeTab === "overview" ? "text-[#16A34A]" : "text-white/60"}`} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => navigate({ search: { tab: "orders" } as any })}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === "orders"
                  ? "bg-[#FAFBF9] text-[#0F291E] border-white/20 font-black shadow-md"
                  : "text-white/70 hover:text-white border-transparent hover:bg-white/10"
              }`}
            >
              <Receipt className={`h-4 w-4 ${activeTab === "orders" ? "text-[#2563EB]" : "text-blue-300/80"}`} />
              <span>Order History</span>
              <span className={`ml-1 px-2 py-0.5 text-[10px] font-black rounded-full ${activeTab === "orders" ? "bg-[#16382B] text-[#85CC14]" : "bg-white/15 text-white"}`}>
                {orders?.length ?? 0}
              </span>
            </button>

            <button
              onClick={() => navigate({ search: { tab: "saved" } as any })}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === "saved"
                  ? "bg-[#FAFBF9] text-[#0F291E] border-white/20 font-black shadow-md"
                  : "text-white/70 hover:text-white border-transparent hover:bg-white/10"
              }`}
            >
              <Heart className={`h-4 w-4 ${activeTab === "saved" ? "text-[#E11D48]" : "text-rose-300/80"}`} />
              <span>Saved Items</span>
              <span className={`ml-1 px-2 py-0.5 text-[10px] font-black rounded-full ${activeTab === "saved" ? "bg-[#16382B] text-[#85CC14]" : "bg-white/15 text-white"}`}>
                {wishlistIds.length + (savedPosts?.length ?? 0)}
              </span>
            </button>

            <button
              onClick={() => navigate({ search: { tab: "services" } as any })}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === "services"
                  ? "bg-[#FAFBF9] text-[#0F291E] border-white/20 font-black shadow-md"
                  : "text-white/70 hover:text-white border-transparent hover:bg-white/10"
              }`}
            >
              <Briefcase className={`h-4 w-4 ${activeTab === "services" ? "text-[#EA580C]" : "text-amber-400/80"}`} />
              <span className={activeTab === "services" ? "text-[#0F291E]" : "text-amber-300/90"}>Booked Services</span>
              <span className={`ml-1 px-2 py-0.5 text-[10px] font-black rounded-full ${activeTab === "services" ? "bg-[#F5A623] text-white" : "bg-amber-400/20 text-amber-300"}`}>
                {bookings?.length ?? 0}
              </span>
            </button>

            <button
              onClick={() => navigate({ search: { tab: "posts" } as any })}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === "posts"
                  ? "bg-[#FAFBF9] text-[#0F291E] border-white/20 font-black shadow-md"
                  : "text-white/70 hover:text-white border-transparent hover:bg-white/10"
              }`}
            >
              <MessageSquare className={`h-4 w-4 ${activeTab === "posts" ? "text-[#7C3AED]" : "text-purple-300/80"}`} />
              <span>My Forum Posts</span>
              <span className={`ml-1 px-2 py-0.5 text-[10px] font-black rounded-full ${activeTab === "posts" ? "bg-[#16382B] text-[#85CC14]" : "bg-white/15 text-white"}`}>
                {myPosts?.length ?? 0}
              </span>
            </button>

            <button
              onClick={() => navigate({ search: { tab: "profile" } as any })}
              className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeTab === "profile"
                  ? "bg-[#FAFBF9] text-[#0F291E] border-white/20 font-black shadow-md"
                  : "text-white/70 hover:text-white border-transparent hover:bg-white/10"
              }`}
            >
              <Settings className={`h-4 w-4 ${activeTab === "profile" ? "text-[#16A34A]" : "text-white/60"}`} />
              <span>Account Settings</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => navigate({ search: { tab: "admin" } as any })}
                className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider rounded-t-2xl border-t border-x transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeTab === "admin"
                    ? "bg-[#FAFBF9] text-[#0F291E] border-white/20 font-black shadow-md"
                    : "text-white/70 hover:text-white border-transparent hover:bg-white/10"
                }`}
              >
                <ShieldCheck className={`h-4 w-4 ${activeTab === "admin" ? "text-[#85CC14]" : "text-white/60"}`} />
                <span>Admin Operations</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* TAB CONTENT VIEWS */}
      <section className="container-px mx-auto max-w-7xl py-6">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* 1. Account Navigation Rows (Matched to Mqulima Mobile App Account Hub) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0F291E]">Your Account</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Manage orders, saved products, community posts, and services in one place</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    id: "orders",
                    label: "Order History",
                    sub: "Track AgroShop deliveries & receipts",
                    count: orders?.length ?? 0,
                    icon: Receipt,
                    bg: "bg-[#2563EB]",
                    onClick: () => navigate({ search: { tab: "orders" } as any }),
                  },
                  {
                    id: "saved",
                    label: "Saved Items",
                    sub: "Wishlisted products & saved posts",
                    count: wishlistIds.length + (savedPosts?.length ?? 0),
                    icon: Heart,
                    bg: "bg-[#E11D48]",
                    onClick: () => navigate({ search: { tab: "saved" } as any }),
                  },
                  {
                    id: "cart",
                    label: "My Cart",
                    sub: "Review items ready for checkout",
                    count: cartCount,
                    icon: ShoppingCart,
                    bg: "bg-[#16A34A]",
                    onClick: () => setCartOpen(true),
                  },
                  {
                    id: "posts",
                    label: "My Forum Posts",
                    sub: "Your farmer discussions & updates",
                    count: myPosts?.length ?? 0,
                    icon: MessageSquare,
                    bg: "bg-[#7C3AED]",
                    onClick: () => navigate({ search: { tab: "posts" } as any }),
                  },
                  {
                    id: "services",
                    label: "Booked Services",
                    sub: "Specialist farm visits & requests",
                    count: bookings?.length ?? 0,
                    icon: Briefcase,
                    bg: "bg-[#EA580C]",
                    onClick: () => navigate({ search: { tab: "services" } as any }),
                  },
                  {
                    id: "profile",
                    label: "Account & Settings",
                    sub: "Edit profile, alerts & security",
                    icon: Settings,
                    bg: "bg-[#0F291E]",
                    onClick: () => navigate({ search: { tab: "profile" } as any }),
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className="flex items-center gap-3.5 min-h-[68px] bg-white border border-slate-200/90 hover:border-[#16A34A]/40 hover:shadow-md rounded-2xl px-4 py-3 text-left transition-all cursor-pointer group"
                    >
                      <span className={`h-10 w-10 rounded-full ${item.bg} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-[#0F291E] group-hover:text-[#16A34A] transition-colors font-['Outfit',sans-serif]">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{item.sub}</div>
                      </div>
                      {item.count !== undefined && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E5F5D0] text-[#35610D] text-xs font-black shrink-0">
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Quick Agricultural Shortcuts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h2 className="text-lg sm:text-xl font-black text-[#0F291E]">Quick Agricultural Shortcuts</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Direct access to your farming tools, AI assistance, and marketplace</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
                <Link
                  to="/ai"
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#0B2117] to-[#16382B] text-white hover:shadow-lg transition-all group border border-[#85CC14]/30 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#85CC14]/20 text-[#85CC14] flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-[#85CC14] tracking-wider">AI Powered</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-white group-hover:text-[#85CC14] transition-colors">Mqulima AI</h3>
                    <p className="text-[11px] text-white/70 mt-1 line-clamp-2">Ask crop pathology, spray windows & localized diagnostics</p>
                  </div>
                </Link>

                <Link
                  to="/shop"
                  className="p-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 hover:shadow-md transition-all border border-slate-200 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Shop</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-[#0F291E] group-hover:text-[#16A34A] transition-colors">AgroShop</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Order certified fertilizers, seeds & farm machinery</p>
                  </div>
                </Link>

                <Link
                  to="/tools"
                  className="p-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 hover:shadow-md transition-all border border-slate-200 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Diagnostics</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-[#0F291E] group-hover:text-amber-600 transition-colors">Crop Doctor</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Neural plant disease identification & IPM recommendations</p>
                  </div>
                </Link>

                <Link
                  to="/services"
                  className="p-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 hover:shadow-md transition-all border border-slate-200 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Services</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-[#0F291E] group-hover:text-orange-600 transition-colors">Request a Service</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Soil testing, veterinary care & agronomist visits</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* 3. Overview Summary Cards Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Orders Overview */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#0F291E]">Recent Shop Purchases</h3>
                    </div>
                    <button
                      onClick={() => navigate({ search: { tab: "orders" } as any })}
                      className="text-xs font-bold text-[#16A34A] hover:underline cursor-pointer"
                    >
                      View All Orders →
                    </button>
                  </div>

                  {ordersLoading ? (
                    <div className="py-8 text-center text-xs font-bold text-slate-400 animate-pulse">Loading orders...</div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="py-8 text-center space-y-3">
                      <p className="text-xs text-slate-500 font-medium">No product purchases made yet.</p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#85CC14] text-[#0B2117] text-xs font-bold shadow-xs hover:bg-[#74B510] transition"
                      >
                        <span>Explore AgroShop Products</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {orders.slice(0, 3).map((o: any) => (
                        <div key={o.id} className="py-3 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs font-extrabold text-[#0F291E] line-clamp-1">{o.item}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{o.id} · {o.createdAt}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-[#16A34A] block">KES {o.total.toLocaleString()}</span>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Account Notifications Feed */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#0F291E]">Recent Account Updates</h3>
                    </div>
                  </div>
                  {notificationsLoading ? (
                    <div className="py-6 text-center text-xs font-bold text-slate-400 animate-pulse">Loading updates...</div>
                  ) : !notifications || notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No new notifications. Order and booking alerts will show here.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {notifications.slice(0, 4).map((n: any) => (
                        <Row
                          key={n.id}
                          title={n.title}
                          sub={n.sub || "Account notification"}
                          chip={n.readAt ? "Read" : "New"}
                          chipClass={n.readAt ? "bg-slate-100 text-slate-500" : "bg-[#E5F5D0] text-[#35610D]"}
                          onClick={!n.readAt ? () => markReadMutation.mutate(n.id) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Verified Profile Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 text-left flex flex-col justify-between h-fit">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#0F291E]">Account Profile</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#85CC14]/20 text-[#2D6A4F] border border-[#85CC14]/30">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between gap-2 py-1.5 border-b border-slate-50">
                      <span className="text-slate-400 font-medium">Full Name</span>
                      <span className="font-bold text-[#0F291E] text-right">{activeUser.name}</span>
                    </div>
                    <div className="flex justify-between gap-2 py-1.5 border-b border-slate-50">
                      <span className="text-slate-400 font-medium">Email</span>
                      <span className="font-bold text-[#0F291E] truncate max-w-[170px]">{activeUser.email}</span>
                    </div>
                    <div className="flex justify-between gap-2 py-1.5 border-b border-slate-50">
                      <span className="text-slate-400 font-medium">Phone</span>
                      <span className="font-bold text-[#0F291E]">{activeUser.phone || "Add phone"}</span>
                    </div>
                    <div className="flex justify-between gap-2 py-1.5 border-b border-slate-50">
                      <span className="text-slate-400 font-medium">County</span>
                      <span className="font-bold text-[#0F291E]">{activeUser.county || "Kenya"}</span>
                    </div>
                    <div className="flex justify-between gap-2 py-1.5 border-b border-slate-50">
                      <span className="text-slate-400 font-medium">Account Role</span>
                      <span className="font-bold text-[#16A34A] uppercase">{activeUser.role || "Farmer"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => navigate({ search: { tab: "profile" } as any })}
                    className="w-full py-2.5 rounded-xl bg-[#0F291E] text-white text-xs font-bold hover:bg-[#16382B] transition cursor-pointer"
                  >
                    Edit Profile & Settings
                  </button>
                  <button
                    onClick={async () => {
                      await logout();
                      toast.success("Successfully signed out");
                      navigate({ to: "/" });
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="text-left">
                <h2 className="text-2xl font-black text-[#0F291E]">My Shop Orders</h2>
                <p className="text-xs text-gray-500 mt-0.5">Track your product purchases, itemized receipts, and order statuses</p>
              </div>
              <Link to="/shop" className="px-4 py-2.5 rounded-xl bg-[#85CC14] text-[#0B2117] text-xs font-bold hover:bg-[#74B510] transition-colors flex items-center gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
                <span>New Shop Order</span>
              </Link>
            </div>

            {ordersLoading ? (
              <div className="py-16 text-center text-sm font-bold text-gray-400 animate-pulse">Loading your shop orders...</div>
            ) : !orders || orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center max-w-md mx-auto my-8 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-[#0F291E]">No Shop Orders Found</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  You haven't placed any AgroShop product purchases yet. All fertilizers, seeds, and equipment orders will appear here.
                </p>
                <Link to="/shop" className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#16382B] text-[#85CC14] font-bold text-xs hover:bg-[#0B2117] transition-all shadow-md">
                  <span>Browse AgroShop</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((o: any) => {
                  let statusBadge = "bg-amber-100 text-amber-800 border-amber-200";
                  if (o.status === "delivered" || o.status === "completed") statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  if (o.status === "processing" || o.status === "shipped") statusBadge = "bg-sky-100 text-sky-800 border-sky-200";
                  if (o.status === "cancelled") statusBadge = "bg-rose-100 text-rose-800 border-rose-200";

                  return (
                    <div key={o.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all text-left">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold text-sm">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-mono font-bold text-gray-400">{o.id}</div>
                            <div className="text-xs text-gray-500 font-medium">{o.createdAt}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                            {o.status}
                          </span>
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Breakdown</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 font-bold block uppercase text-[10px]">Purchased Products</span>
                          <span className="font-extrabold text-[#0F291E] block mt-0.5 line-clamp-2">{o.item}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block uppercase text-[10px]">Delivery & Payment</span>
                          <span className="font-semibold text-gray-700 block mt-0.5">{o.paymentMethod} · {o.deliveryAddress}</span>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-gray-400 font-bold block uppercase text-[10px]">Total Paid</span>
                          <span className="font-black text-[#16A34A] text-sm block mt-0.5">KES {o.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="text-left">
                <h2 className="text-2xl font-black text-[#0F291E]">Booked Extension Services</h2>
                <p className="text-xs text-gray-500 mt-0.5">Track field specialist requests, scheduled dates, and expert assignments</p>
              </div>
              <Link to="/services" className="px-4 py-2.5 rounded-xl bg-[#85CC14] text-[#0B2117] text-xs font-bold hover:bg-[#74B510] transition-colors flex items-center gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
                <span>Book New Service</span>
              </Link>
            </div>

            {bookingsLoading ? (
              <div className="py-16 text-center text-sm font-bold text-gray-400 animate-pulse">Loading your service bookings...</div>
            ) : !bookings || bookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center max-w-md mx-auto my-8 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-lime-100 text-[#35610D] flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-[#0F291E]">No Booked Services Found</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  You haven't requested any agricultural services or extension visits yet. Soil testing, vet services, AI breeding & greenhouse setups will appear here.
                </p>
                <Link to="/services" className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#16382B] text-[#85CC14] font-bold text-xs hover:bg-[#0B2117] transition-all shadow-md">
                  <span>Request a Service</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((b: any) => {
                  let statusBadge = "bg-amber-100 text-amber-800 border-amber-200";
                  if (b.status === "completed") statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  if (b.status === "assigned" || b.status === "in_progress") statusBadge = "bg-sky-100 text-sky-800 border-sky-200";
                  if (b.status === "cancelled") statusBadge = "bg-rose-100 text-rose-800 border-rose-200";

                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all text-left">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-lime-100 text-[#35610D] flex items-center justify-center font-bold text-sm">
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-mono font-bold text-gray-400">{b.id}</div>
                            <div className="text-xs font-bold text-[#0F291E]">{b.subserviceName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                            {b.status}
                          </span>
                          <button
                            onClick={() => setSelectedBookingDetails(b)}
                            className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Booking Details</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 font-bold block uppercase text-[10px]">Scheduled Date</span>
                          <span className="font-bold text-[#0F291E] block mt-0.5">{b.scheduledDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block uppercase text-[10px]">Farm Location</span>
                          <span className="font-semibold text-gray-700 block mt-0.5">{b.location}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block uppercase text-[10px]">Contact Person</span>
                          <span className="font-semibold text-gray-700 block mt-0.5">{b.contactName} ({b.contactPhone})</span>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-gray-400 font-bold block uppercase text-[10px]">Assigned Specialist</span>
                          <span className="font-bold text-[#16A34A] block mt-0.5">{b.expertName || "Pending Assignment"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="text-left">
                <h2 className="text-2xl font-black text-[#0F291E]">Saved Items</h2>
                <p className="text-xs text-gray-500 mt-0.5">AgroShop products you hearted and community discussions you bookmarked</p>
              </div>
              <Link to="/shop" className="px-4 py-2.5 rounded-xl bg-[#85CC14] text-[#0B2117] text-xs font-bold hover:bg-[#74B510] transition-colors flex items-center gap-1.5 shadow-sm">
                <ShoppingBag className="w-4 h-4" />
                <span>Browse AgroShop</span>
              </Link>
            </div>

            {savedProductsLoading ? (
              <div className="py-12 text-center text-sm font-bold text-gray-400 animate-pulse">Loading your saved products...</div>
            ) : (!savedProducts || savedProducts.length === 0) && (!savedPosts || savedPosts.length === 0) && !savedPostsLoading ? (
              <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center max-w-md mx-auto my-8 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-[#E11D48] flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-[#0F291E]">No saved items</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Tap the heart on any product in AgroShop or bookmark any forum post to save it here.
                </p>
                <Link to="/shop" className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#16382B] text-[#85CC14] font-bold text-xs hover:bg-[#0B2117] transition-all shadow-md">
                  <span>Browse AgroShop</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                {savedProducts && savedProducts.length > 0 && (
                  <div className="space-y-3 text-left">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Saved AgroShop Products ({savedProducts.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedProducts.map((p: any) => (
                        <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                          <Link to="/shop/product/$slug" params={{ slug: p.slug } as any} className="block group">
                            <div className="relative h-44 bg-slate-100 overflow-hidden">
                              <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-[#0F291E]">
                                {p.category}
                              </span>
                            </div>
                            <div className="p-4 space-y-1">
                              <h4 className="text-sm font-black text-[#0F291E] line-clamp-2 group-hover:text-[#16A34A] transition-colors">{p.name}</h4>
                              <div className="text-xs text-slate-500">{p.county}</div>
                              <div className="text-base font-black text-[#16A34A] pt-1">
                                KES {Number(p.price || 0).toLocaleString()}
                                <span className="text-[11px] font-medium text-slate-400 ml-1">{p.unit}</span>
                              </div>
                            </div>
                          </Link>
                          <div className="px-4 pb-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                addToCart({
                                  id: p.id,
                                  slug: p.slug,
                                  name: p.name,
                                  description: "",
                                  price: p.price,
                                  originalPrice: p.originalPrice,
                                  stock: p.stock,
                                  image: p.image,
                                  category: p.category,
                                  unit: p.unit,
                                } as any, 1);
                              }}
                              className="flex-1 py-2 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </button>
                            <button
                              type="button"
                              aria-label="Remove saved item"
                              onClick={() => {
                                removeWishlistId(p.id);
                                toast.info("Removed from saved items");
                              }}
                              className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-[#E11D48] hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {savedPosts && savedPosts.length > 0 && (
                  <div className="space-y-3 text-left">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Saved Forum Discussions ({savedPosts.length})
                    </h3>
                    <div className="grid gap-3">
                      {savedPosts.map((post: any) => (
                        <Link
                          key={post.id}
                          to="/community"
                          className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="text-sm font-black text-[#0F291E]">{post.title}</div>
                            <p className="text-xs text-slate-600 line-clamp-2">{post.text}</p>
                            <div className="text-[11px] text-slate-400">
                              By {post.author} • {post.createdAt}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="text-left">
                <h2 className="text-2xl font-black text-[#0F291E]">My Forum Posts</h2>
                <p className="text-xs text-gray-500 mt-0.5">Discussions, agronomic questions, and updates you shared with Kenyan farmers</p>
              </div>
              <Link to="/community" className="px-4 py-2.5 rounded-xl bg-[#85CC14] text-[#0B2117] text-xs font-bold hover:bg-[#74B510] transition-colors flex items-center gap-1.5 shadow-sm">
                <Plus className="w-4 h-4" />
                <span>New Discussion</span>
              </Link>
            </div>

            {myPostsLoading ? (
              <div className="py-16 text-center text-sm font-bold text-gray-400 animate-pulse">Loading your forum discussions...</div>
            ) : !myPosts || myPosts.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-gray-200 text-center max-w-md mx-auto my-8 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-purple-50 text-[#7C3AED] flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-[#0F291E]">No Forum Posts Yet</h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Share a crop question, harvest update, or farming tip in the Mqulima Farmers Network to see it tracked here.
                </p>
                <Link to="/community" className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#16382B] text-[#85CC14] font-bold text-xs hover:bg-[#0B2117] transition-all shadow-md">
                  <span>Open Farmers Forum</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {myPosts.map((post: any) => (
                  <Link
                    key={post.id}
                    to="/community"
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-all text-left block"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <h3 className="text-base font-black text-[#0F291E]">{post.title}</h3>
                        {post.text && <p className="text-xs text-slate-600 line-clamp-2">{post.text}</p>}
                        {Array.isArray(post.tags) && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {post.tags.map((t: string) => (
                              <span key={t} className="px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] text-[10px] font-bold">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">{post.createdAt}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#16A34A]" /> {post.likes} likes
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[#7C3AED]" /> {post.commentCount} comments
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Editable Farm & Personal Profile Card */}
              <div className="rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-sm text-left space-y-4">
                <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5F5D0] text-[#35610D]">
                      <User className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F291E] font-['Outfit',sans-serif]">
                      Edit Account & Farm Profile
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-[#16A34A]">
                    {activeUser.role || "Farmer"}
                  </span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!profileName.trim() || profileName.trim().length < 2) {
                      toast.error("Please enter your full name.");
                      return;
                    }
                    saveProfileMutation.mutate();
                  }}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:border-[#16A34A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={activeUser.email}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+2547..."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:border-[#16A34A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">County</label>
                      <input
                        type="text"
                        value={profileCounty}
                        onChange={(e) => setProfileCounty(e.target.value)}
                        placeholder="e.g. Nakuru"
                        required
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:border-[#16A34A] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Years Farming</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={profileYears}
                        onChange={(e) => setProfileYears(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:border-[#16A34A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Primary Crops</label>
                      <input
                        type="text"
                        value={profileCrops}
                        onChange={(e) => setProfileCrops(e.target.value)}
                        placeholder="Maize, Beans, Avocado"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:border-[#16A34A] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Livestock</label>
                    <input
                      type="text"
                      value={profileLivestock}
                      onChange={(e) => setProfileLivestock(e.target.value)}
                      placeholder="Dairy Cows, Poultry, Goats"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-[#0F291E] focus:border-[#16A34A] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saveProfileMutation.isPending}
                    className="w-full mt-2 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 text-white text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {saveProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{saveProfileMutation.isPending ? "Saving Changes..." : "Save Profile Changes"}</span>
                  </button>
                </form>
              </div>

              {/* PWA & Notification Center + Account Session */}
              <div className="space-y-6">
                <div className="rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-sm text-left space-y-4">
                  <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5F5D0] text-[#35610D]">
                        <Settings className="h-4 w-4 stroke-[2.5]" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F291E] font-['Outfit',sans-serif]">
                        Alerts & App Preferences
                      </h3>
                    </div>
                    <div
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        isOnline ? "bg-[#E5F5D0] text-[#35610D]" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      <span>{isOnline ? "Online" : "Offline"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <div>
                      <div className="text-xs font-bold text-[#0F291E]">App Environment</div>
                      <div className="text-[11px] text-slate-500">
                        {isInstalled ? "Running as standalone Mqulima app" : "Running in web browser"}
                      </div>
                    </div>
                  </div>

                  {isInstallable && (
                    <div className="rounded-2xl border border-[#85CC14]/40 bg-[#85CC14]/10 p-4 text-center">
                      <p className="text-xs font-medium text-[#0F291E] mb-3">
                        Install Mqulima on your device for instant offline access to orders and services.
                      </p>
                      <button
                        onClick={triggerInstall}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#85CC14] hover:bg-[#74B510] px-4 py-2.5 text-xs font-bold text-[#0B2117] transition shadow-sm cursor-pointer"
                      >
                        <Download className="h-4 w-4 stroke-[2.5]" /> Install App
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alert Subscriptions</h4>
                    <div className="flex items-center justify-between">
                      <div className="pr-2">
                        <div className="text-xs font-bold text-[#0F291E]">Sowing Windows</div>
                        <div className="text-[11px] text-slate-500">Alerts for optimal planting times</div>
                      </div>
                      <Switch checked={channels.sowing} onCheckedChange={(checked) => handleToggleChannel("sowing", checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="pr-2">
                        <div className="text-xs font-bold text-[#0F291E]">Market Rates</div>
                        <div className="text-[11px] text-slate-500">Daily updates for crop prices</div>
                      </div>
                      <Switch checked={channels.market} onCheckedChange={(checked) => handleToggleChannel("market", checked)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="pr-2">
                        <div className="text-xs font-bold text-[#0F291E]">Weather Advisories</div>
                        <div className="text-[11px] text-slate-500">County rainfall & spray window warnings</div>
                      </div>
                      <Switch checked={channels.weather} onCheckedChange={(checked) => handleToggleChannel("weather", checked)} />
                    </div>
                  </div>
                </div>

                {/* Session & Account Deletion (Matched to Mobile App Account Screen) */}
                <div className="rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-sm text-left space-y-4">
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      toast.success("Signed out cleanly.");
                      navigate({ to: "/" });
                    }}
                    className="w-full rounded-2xl border border-slate-200 hover:bg-slate-50 py-3 text-sm font-bold text-[#0F291E] transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>

                  {!isAdmin && (
                    !confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#DC2626] hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete My Account</span>
                      </button>
                    ) : (
                      <div className="rounded-2xl bg-[#FEF2F2] border border-[#FECACA] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-[#991B1B] font-extrabold text-sm">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>Permanently Delete Account?</span>
                        </div>
                        <p className="text-xs text-[#7F1D1D] leading-relaxed">
                          This removes your personal profile and signs you out immediately. Order receipts remain anonymized for regulatory records.
                        </p>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 py-2.5 rounded-xl border border-red-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deleteAccountMutation.isPending}
                            onClick={() => deleteAccountMutation.mutate()}
                            className="flex-1 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {deleteAccountMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <span>{deleteAccountMutation.isPending ? "Deleting..." : "Confirm Delete"}</span>
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN MANAGEMENT TAB (RESTRICTED ONLY TO ADMINS) */}
        {isAdmin && activeTab === "admin" && (
          <div className="space-y-8">
            <AdminFeaturedProductsPanel />
            <AdminServiceRequestsPanel />
          </div>
        )}
      </section>

      {/* POPUP MODAL: ORDER DETAILS BREAKDOWN */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderDetails(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl z-50 text-left border border-gray-150"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 text-[#16A34A]">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#0F291E]">Order Receipt Details</h3>
                    <div className="text-[11px] font-mono text-gray-400">{selectedOrderDetails.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                  <div className="flex justify-between text-gray-500">
                    <span>Order Date:</span>
                    <span className="font-bold text-gray-800">{selectedOrderDetails.createdAt}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Status:</span>
                    <span className="font-black uppercase text-[#16A34A]">{selectedOrderDetails.status}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Payment Method:</span>
                    <span className="font-bold text-gray-800">{selectedOrderDetails.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery Address:</span>
                    <span className="font-bold text-gray-800">{selectedOrderDetails.deliveryAddress}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Itemized Breakdown</h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                    {Array.isArray(selectedOrderDetails.items) && selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-[#0F291E]">{item.name || item.title || "AgroShop Product"}</div>
                            <div className="text-[10px] text-gray-400">Qty: {item.quantity || 1} × KES {Number(item.price || 0).toLocaleString()}</div>
                          </div>
                          <div className="font-black text-gray-800">
                            KES {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-600">{selectedOrderDetails.item}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
                  <span className="font-black text-[#0F291E]">Total Amount Paid</span>
                  <span className="font-black text-[#16A34A] text-lg">KES {selectedOrderDetails.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-5 py-2 rounded-xl bg-[#0F291E] text-white text-xs font-bold hover:bg-[#16382B] transition-colors"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP MODAL: SERVICE BOOKING DETAILS BREAKDOWN */}
      <AnimatePresence>
        {selectedBookingDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBookingDetails(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl z-50 text-left border border-gray-150"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-lime-100 text-[#35610D]">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#0F291E]">Service Booking Record</h3>
                    <div className="text-[11px] font-mono text-gray-400">{selectedBookingDetails.id}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBookingDetails(null)}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                  <div className="flex justify-between text-gray-500">
                    <span>Service Category:</span>
                    <span className="font-bold text-gray-800">{selectedBookingDetails.serviceName}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Subservice Selected:</span>
                    <span className="font-bold text-[#16A34A]">{selectedBookingDetails.subserviceName}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Booking Status:</span>
                    <span className="font-black uppercase text-amber-600">{selectedBookingDetails.status}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Scheduled Date:</span>
                    <span className="font-bold text-gray-800">{selectedBookingDetails.scheduledDate}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Farm Location:</span>
                    <span className="font-bold text-gray-800">{selectedBookingDetails.location}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Farm Scale:</span>
                    <span className="font-bold text-gray-800">{selectedBookingDetails.farmScale}</span>
                  </div>
                </div>

                {selectedBookingDetails.expertName ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left">
                    <div className="text-[10px] font-black uppercase text-emerald-800">Assigned Extension Expert</div>
                    <div className="text-sm font-black text-[#0F291E] mt-1">{selectedBookingDetails.expertName}</div>
                    <div className="text-xs text-gray-600 mt-0.5">📞 {selectedBookingDetails.expertPhone}</div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-800 text-[11px] font-medium">
                    ℹ️ Extension specialist assignment is currently in progress by Mqulima Agri-Desk. You will receive an SMS update once assigned.
                  </div>
                )}

                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Farmer Notes / Instructions</h4>
                  <div className="p-3 bg-gray-50 rounded-xl text-gray-700 font-medium leading-relaxed">
                    {selectedBookingDetails.notes}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedBookingDetails(null)}
                  className="px-5 py-2 rounded-xl bg-[#0F291E] text-white text-xs font-bold hover:bg-[#16382B] transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function Stat({ label, value, icon: Icon, color = "lime" }: { label: string; value: string; icon: LucideIcon; color?: "lime" | "yellow" }) {
  const isYellow = color === "yellow";
  const textColor = isYellow ? "text-[#F5A623]" : "text-[#85CC14]";
  const iconBg = isYellow ? "bg-[#F5A623]/20 text-[#F5A623]" : "bg-[#85CC14]/20 text-[#85CC14]";

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white/10 px-3.5 sm:px-5 py-3 border border-white/15 backdrop-blur-md min-w-0">
      <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl ${iconBg} shrink-0`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
      </div>
      <div className="text-left min-w-0">
        <div className={`text-lg sm:text-xl font-black ${textColor} font-['Outfit',sans-serif] leading-none`}>{value}</div>
        <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-white/80 mt-1 truncate">
          {label}
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  sub,
  chip,
  chipClass,
  onClick,
}: {
  title: string;
  sub: string;
  chip: string;
  chipClass: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-left ${
        onClick ? "cursor-pointer hover:bg-slate-100 transition-colors" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="truncate text-xs font-bold text-[#0F291E] font-['Outfit',sans-serif]">{title}</div>
        <div className="truncate text-[11px] text-slate-500 font-normal mt-0.5">{sub}</div>
      </div>
      {chip && (
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${chipClass}`}
        >
          {chip}
        </span>
      )}
    </div>
  );
}

function AdminFeaturedProductsPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAdding, setIsAdding] = useState(false);
  
  // Creation state
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");

  // Edit state
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editIsFeatured, setEditIsFeatured] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: () => adminGetCategoriesList()
  });

  const { data, isLoading } = useQuery({
    queryKey: ["adminProducts"],
    queryFn: () => getProducts({ data: { limit: 1000 } }),
  });

  const categories = categoriesData || [];

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      return adminUpdateProduct({
        data: {
          id,
          isFeatured,
          csrfToken: getCsrfTokenFromCookie(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
      toast.success("Featured status updated!");
    },
    onError: (err: any) => {
      toast.error("Failed to update status: " + err.message);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (updatedFields: any) => {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      return adminUpdateProduct({
        data: {
          ...updatedFields,
          csrfToken: getCsrfTokenFromCookie()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
      toast.success("Product updated successfully!");
      setEditingProduct(null);
    },
    onError: (err: any) => {
      toast.error("Failed to update product: " + err.message);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      return adminDeleteProduct({
        data: {
          id,
          csrfToken: getCsrfTokenFromCookie()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
      toast.success("Product deleted successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to delete product: " + err.message);
    }
  });

  const createFeaturedMutation = useMutation({
    mutationFn: async () => {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      return adminCreateProduct({
        data: {
          name: newProductName,
          price: Number(newProductPrice),
          image: newProductImage || "/placeholder-product.png",
          description: newProductDesc,
          categoryId: newProductCategory || null,
          organic: false,
          verifiedSeller: true,
          seller: "Mqulima Partner",
          county: "Nakuru",
          isFeatured: true,
          csrfToken: getCsrfTokenFromCookie(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
      toast.success("Successfully created and featured product!");
      setIsAdding(false);
      setNewProductName("");
      setNewProductPrice("");
      setNewProductImage("");
      setNewProductDesc("");
      setNewProductCategory("");
    },
    onError: (err: any) => {
      toast.error("Failed to create product: " + err.message);
    },
  });

  const productsList = data?.products || [];

  const uniqueCategories = Array.from(
    new Set(productsList.map((p) => p.category).filter(Boolean))
  ) as string[];

  const filteredProducts = productsList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="rounded-[28px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F5D0] px-3.5 py-1 text-xs font-bold text-[#35610D]">
            <Star className="h-3.5 w-3.5 fill-[#35610D] text-[#35610D] animate-pulse" /> Admin Portal
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#0F291E] font-['Outfit',sans-serif]">
            Product Catalog & Inventory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Filter by category to add, edit, or pin featured products across the platform.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingProduct(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D2A1C] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#143e2a] transition"
        >
          {isAdding ? "Cancel" : <><Plus className="h-4 w-4" /> Add New Product</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5 mb-8">
          <h3 className="text-sm font-bold text-[#0D2A1C] mb-4 uppercase tracking-wider">
            Create & Feature New Product
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Product Name</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. Premium NPK Fertilizer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Price (KES)</label>
              <input
                type="number"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. 3200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Image URL</label>
              <input
                type="text"
                value={newProductImage}
                onChange={(e) => setNewProductImage(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Leave blank for default"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description</label>
            <textarea
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="Brief description of the product benefits..."
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                if (!newProductName || !newProductPrice) {
                  toast.error("Please provide a name and price");
                  return;
                }
                createFeaturedMutation.mutate();
              }}
              disabled={createFeaturedMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] hover:bg-[#bfa032] text-[#0D2A1C] px-5 py-2.5 text-xs font-bold transition shadow-sm"
            >
              {createFeaturedMutation.isPending ? "Creating..." : "Save and Feature"}
            </button>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Edit className="h-4 w-4 text-amber-700" /> Edit Product: {editingProduct.name}
            </h3>
            <button
              onClick={() => setEditingProduct(null)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Product Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Price (KES)</label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Image URL</label>
              <input
                type="text"
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="editIsFeatured"
                checked={editIsFeatured}
                onChange={(e) => setEditIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="editIsFeatured" className="text-xs font-bold text-gray-700 uppercase cursor-pointer select-none">
                Feature this product
              </label>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setEditingProduct(null)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!editName || !editPrice) {
                  toast.error("Please provide a name and price");
                  return;
                }
                updateProductMutation.mutate({
                  id: editingProduct.id,
                  name: editName,
                  price: Number(editPrice),
                  image: editImage,
                  description: editDesc,
                  categoryId: editCategory || null,
                  isFeatured: editIsFeatured
                });
              }}
              disabled={updateProductMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 text-xs font-bold transition shadow-sm"
            >
              {updateProductMutation.isPending ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 border-b border-gray-100 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
            selectedCategory === "All"
              ? "bg-[#0D2A1C] text-white shadow-sm"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Filter className="h-3 w-3" /> All Categories
        </button>
        {uniqueCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
              selectedCategory === cat
                ? "bg-[#0D2A1C] text-white shadow-sm"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Tag className="h-3 w-3" /> {cat}
          </button>
        ))}
      </div>

      {/* Product List with Search */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${selectedCategory === "All" ? "" : selectedCategory + " "}products in database...`}
          className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No products found matching your criteria.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-center">Featured Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => {
                const isFeatured = !!p.isFeatured;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-product.png";
                        }}
                      />
                      <div>
                        <div className="font-bold text-[#0D2A1C]">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.category || "No Category"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#0D2A1C]">
                      KES {p.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          toggleFeatureMutation.mutate({ id: p.id, isFeatured: !isFeatured });
                        }}
                        disabled={toggleFeatureMutation.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                          isFeatured
                            ? "bg-[#D4AF37]/15 text-[#b08e23]"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isFeatured ? "fill-[#D4AF37] text-[#D4AF37]" : ""}`} />
                        {isFeatured ? "Featured" : "Not Featured"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsAdding(false);
                            setEditName(p.name);
                            setEditPrice(String(p.price));
                            setEditImage(p.image);
                            setEditDesc(p.description);
                            const matchingCat = categories.find((c) => c.name === p.category);
                            setEditCategory(matchingCat ? matchingCat.id : "");
                            setEditIsFeatured(isFeatured);
                          }}
                          className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                              deleteProductMutation.mutate(p.id);
                            }
                          }}
                          disabled={deleteProductMutation.isPending}
                          className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminServiceRequestsPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [channelFilter, setChannelFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [assignAgentName, setAssignAgentName] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [modalTargetStatus, setModalTargetStatus] = useState<string>("");

  const { data: requestsList = [], isLoading } = useQuery({
    queryKey: ["adminServiceRequests"],
    queryFn: () => adminGetServiceRequests(),
    refetchInterval: 10000,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assignedAgent, targetStatus, notes }: any) => {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      return adminAssignServiceExpert({
        data: {
          id,
          assignedAgent,
          targetStatus: targetStatus || "assigned",
          notes,
          csrfToken: getCsrfTokenFromCookie(),
        },
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["adminServiceRequests"] });
      toast.success(res.message);
      setSelectedRequest(null);
      setAssignAgentName("");
      setActionNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign expert");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, targetStatus, notes }: any) => {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      return adminUpdateServiceStatus({
        data: {
          id,
          targetStatus,
          notes,
          csrfToken: getCsrfTokenFromCookie(),
        },
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["adminServiceRequests"] });
      toast.success(res.message);
      setSelectedRequest(null);
      setActionNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const filteredRequests = requestsList.filter((r: any) => {
    const matchesSearch =
      r.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      r.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.county.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const matchesChannel = channelFilter === "All" || r.channel === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const totalCount = requestsList.length;
  const requestedCount = requestsList.filter((r: any) => r.status === "requested").length;
  const assignedCount = requestsList.filter((r: any) => r.status === "assigned" || r.status === "in_progress").length;
  const completedCount = requestsList.filter((r: any) => r.status === "completed").length;

  return (
    <div className="rounded-[28px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm text-left mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
            <Wrench className="h-3.5 w-3.5 text-emerald-700" /> Service Dispatch Console
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#0F291E] font-['Outfit',sans-serif]">
            Incoming Service Orders & Bookings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time management of farmer service requests from website checkout & WhatsApp quotation dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-extrabold text-amber-800">
            <Clock className="h-4 w-4 text-amber-600 animate-pulse" /> {requestedCount} New Requests
          </span>
        </div>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="text-xs text-slate-500 font-bold uppercase">Total Bookings</div>
          <div className="text-2xl font-black text-[#0F291E] mt-1">{totalCount}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="text-xs text-amber-700 font-bold uppercase">Pending Action</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{requestedCount}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="text-xs text-blue-700 font-bold uppercase">Active / Assigned</div>
          <div className="text-2xl font-black text-blue-900 mt-1">{assignedCount}</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="text-xs text-emerald-700 font-bold uppercase">Completed</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-5 justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ref, farmer, phone, county..."
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 bg-white focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="requested">Requested (Pending)</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 bg-white focus:outline-none"
          >
            <option value="All">All Channels</option>
            <option value="website">Website Direct</option>
            <option value="whatsapp">WhatsApp Quote</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-gray-400 text-xs">
          No service requests found matching your filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full border-collapse text-left text-xs text-gray-600">
            <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5">Ref Code</th>
                <th className="px-4 py-3.5">Farmer & Contact</th>
                <th className="px-4 py-3.5">Service & Scale</th>
                <th className="px-4 py-3.5 text-center">Channel</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Assigned Expert</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRequests.map((r: any) => {
                let statusBadge = "bg-amber-100 text-amber-800 border-amber-200";
                if (r.status === "assigned") statusBadge = "bg-blue-100 text-blue-800 border-blue-200";
                if (r.status === "in_progress") statusBadge = "bg-purple-100 text-purple-800 border-purple-200";
                if (r.status === "completed") statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
                if (r.status === "cancelled") statusBadge = "bg-rose-100 text-rose-800 border-rose-200";

                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-extrabold text-[#0F291E]">
                      {r.referenceCode}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-gray-900">{r.fullName}</div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{r.phone}</span>
                        <span className="text-gray-300">•</span>
                        <span>{r.county}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#0F291E]">{r.serviceType}</div>
                      <div className="text-[11px] text-gray-400">{r.farmScale}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.channel === "whatsapp" 
                          ? "bg-[#25D366]/15 text-[#1DA851]" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {r.channel === "whatsapp" ? <MessageSquare className="h-3 w-3 text-[#25D366]" /> : <FileText className="h-3 w-3 text-slate-500" />}
                        {r.channel === "whatsapp" ? "WhatsApp" : "Website"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadge}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium">
                      {r.assignedTechnician ? (
                        <span className="inline-flex items-center gap-1 text-blue-700 font-bold">
                          <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                          {r.assignedTechnician}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedRequest(r);
                          setAssignAgentName(r.assignedTechnician || "");
                          setModalTargetStatus(r.status);
                          setActionNotes("");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0D2A1C] hover:bg-[#153f2b] text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" /> Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action / Inspection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Service Request Manager
                </span>
                <h3 className="text-lg font-black text-[#0F291E] mt-1">
                  {selectedRequest.referenceCode} — {selectedRequest.serviceType}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Farmer Contact</span>
                  <span className="font-bold text-gray-800">{selectedRequest.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Phone Number</span>
                  <span className="font-bold text-gray-800">{selectedRequest.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Location / County</span>
                  <span className="font-bold text-gray-800">{selectedRequest.county}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Farm Scale</span>
                  <span className="font-bold text-gray-800">{selectedRequest.farmScale}</span>
                </div>
              </div>
              {selectedRequest.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-gray-400 font-bold block uppercase text-[10px]">Farmer Notes</span>
                  <p className="text-gray-700 italic">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            {/* Assignment & Status Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Assign Agronomist / Expert Agent
                </label>
                <input
                  type="text"
                  value={assignAgentName}
                  onChange={(e) => setAssignAgentName(e.target.value)}
                  placeholder="e.g. Dr. John Kiprop (Agronomist)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Update Service Status
                </label>
                <select
                  value={modalTargetStatus}
                  onChange={(e) => setModalTargetStatus(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-800 bg-white focus:outline-none"
                >
                  <option value="requested">Requested (Pending)</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Admin Dispatch Notes (Optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={2}
                  placeholder="Add notes on dispatch status, quotation pricing or expert schedule..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (assignAgentName && assignAgentName !== selectedRequest.assignedTechnician) {
                    assignMutation.mutate({
                      id: selectedRequest.id,
                      assignedAgent: assignAgentName,
                      targetStatus: modalTargetStatus || "assigned",
                      notes: actionNotes,
                    });
                  } else if (modalTargetStatus !== selectedRequest.status) {
                    updateStatusMutation.mutate({
                      id: selectedRequest.id,
                      targetStatus: modalTargetStatus,
                      notes: actionNotes,
                    });
                  } else {
                    toast.info("No changes were made");
                  }
                }}
                disabled={assignMutation.isPending || updateStatusMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-[#0D2A1C] hover:bg-[#153f2b] text-white text-xs font-bold transition shadow-sm"
              >
                {assignMutation.isPending || updateStatusMutation.isPending ? "Saving..." : "Save Dispatch Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
