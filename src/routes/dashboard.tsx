import { useState, useEffect } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
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
  type LucideIcon,
} from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { usePWA } from "@/hooks/usePWA";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserOrders, getUserServiceBookings, getUserNotifications, markNotificationRead } from "@/lib/api/dashboard.server";
import { getProducts } from "@/lib/api/products.server";
import { adminCreateProduct, adminUpdateProduct, adminDeleteProduct, adminGetCategoriesList } from "@/lib/api/admin-shop.server";
import { adminGetServiceRequests, adminAssignServiceExpert, adminUpdateServiceStatus } from "@/lib/api/admin-services.server";

export const Route = createFileRoute("/dashboard")({
  component: RedirectToHome,
});

function RedirectToHome() {
  return <Navigate to="/" replace />;
}

function Dashboard() {
  const { user, logout, isLoading } = useAuth();
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

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["userOrders", user?.id],
    queryFn: () => getUserOrders({ data: { userId: user!.id } }),
    enabled: !!user?.id
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["userBookings", user?.id],
    queryFn: () => getUserServiceBookings({ data: user!.id }),
    enabled: !!user?.id
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["userNotifications", user?.id],
    queryFn: () => getUserNotifications({ data: user!.id }),
    enabled: !!user?.id
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      return markNotificationRead({
        data: {
          notificationId,
          userId: user!.id,
          csrfToken: getCsrfTokenFromCookie()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userNotifications", user?.id] });
    }
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (user && (user.role === "admin" || user.role === "super_admin")) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = "https://i.pinimg.com/1200x/40/27/8b/40278bca7c2df2276814acc0ae7b8afe.jpg";
        link.type = "image/jpeg";
      }
    }
  }, [user]);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCFBF4]">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" />;
  }

  const handleToggleChannel = async (key: "sowing" | "market" | "weather", value: boolean) => {
    if (value && notificationPermission !== "granted") {
      const result = await requestNotificationPermission();
      if (result !== "granted") {
        return; // Don't turn on if permission denied
      }
    }
    setChannels((prev) => ({ ...prev, [key]: value }));
    if (value) {
      toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} alerts enabled!`);
    } else {
      toast.info(`${key.charAt(0).toUpperCase() + key.slice(1)} alerts disabled.`);
    }
  };

  return (
    <AppLayout>
      {/* =========================================================================
         DASHBOARD HERO BANNER
         ========================================================================= */}
      <section className="bg-[#0F291E] py-12 md:py-16 text-white border-b border-white/10 relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-[#85CC14]/10 blur-[100px] pointer-events-none" />
        
        <div className="container-px mx-auto max-w-7xl relative z-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="text-left space-y-2">
              <span className="inline-block rounded-full bg-[#85CC14]/20 border border-[#85CC14]/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#85CC14]">
                FARMER DASHBOARD
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-['Outfit',sans-serif]">
                Karibu, {user.name.split(" ")[0]} 👋
              </h1>
              <p className="flex items-center gap-2 text-xs sm:text-sm text-white/80 font-normal">
                <MapPin className="h-4 w-4 text-[#85CC14] shrink-0" /> 
                <span>{user.county} · {user.farmSize} · {user.crops} & {user.livestock}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Stat label="Loyalty points" value="2,340" icon={Award} />
              <Stat label="Yield this season" value="+38%" icon={TrendingUp} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Background */}
      <div className="bg-[#FAFBF9] min-h-screen py-12 md:py-16">
        {(user.role === "admin" || user.role === "super_admin") && (
          <section className="container-px mx-auto max-w-7xl pb-10 space-y-10">
            <AdminServiceRequestsPanel />
            <AdminFeaturedProductsPanel />
          </section>
        )}

      <section className="container-px mx-auto max-w-7xl py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* PWA & Notification Center Card */}
          <Card
            title="PWA & Notification Center"
            icon={Settings}
            cta="App Settings"
            link="/dashboard"
          >
            <div className="space-y-4">
              {/* Connection Status & Mode */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-left">
                <div>
                  <div className="text-xs font-bold text-[#0F291E] font-['Outfit',sans-serif]">System Status</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {isInstalled ? "Running as standalone app" : "Running in browser"}
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    isOnline ? "bg-[#E5F5D0] text-[#35610D]" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-[#35610D]" /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-rose-600" /> Offline
                    </>
                  )}
                </div>
              </div>

              {/* Install Button if Installable */}
              {isInstallable && (
                <div className="rounded-2xl border border-[#85CC14]/40 bg-[#85CC14]/10 p-4 text-center">
                  <p className="text-xs font-medium text-[#0F291E] mb-3">
                    Install Mqulima on your device for fast, offline-capable access to your farm
                    tools.
                  </p>
                  <button
                    onClick={triggerInstall}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#85CC14] hover:bg-[#74B510] px-4 py-2.5 text-xs font-bold text-[#0B2117] transition shadow-sm cursor-pointer"
                  >
                    <Download className="h-4 w-4 stroke-[2.5]" /> Install App
                  </button>
                </div>
              )}

              {isInstalled && !isInstallable && (
                <div className="rounded-2xl border border-[#85CC14]/30 bg-[#E5F5D0] p-3 text-center text-xs font-bold text-[#35610D]">
                  ✓ Mqulima is installed on your device
                </div>
              )}

              {/* Simulated Notification Toggles */}
              <div className="space-y-3 pt-2 text-left">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Alert Subscriptions
                </h4>

                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <div className="text-xs font-bold text-[#0F291E]">Sowing Windows</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Alerts for perfect planting times
                    </div>
                  </div>
                  <Switch
                    checked={channels.sowing}
                    onCheckedChange={(checked) => handleToggleChannel("sowing", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <div className="text-xs font-bold text-[#0F291E]">Market Rates</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Daily updates for crop prices
                    </div>
                  </div>
                  <Switch
                    checked={channels.market}
                    onCheckedChange={(checked) => handleToggleChannel("market", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <div className="text-xs font-bold text-[#0F291E]">AI Weather Alerts</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Extreme weather warning notifications
                    </div>
                  </div>
                  <Switch
                    checked={channels.weather}
                    onCheckedChange={(checked) => handleToggleChannel("weather", checked)}
                  />
                </div>

                <button
                  onClick={() => {
                    logout();
                    toast.info("Signed out");
                  }}
                  className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 py-2.5 text-xs font-bold text-rose-700 transition cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          </Card>

          <Card title="My Orders" icon={Package} cta="View all" link="/shop">
            {ordersLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No orders yet</div>
            ) : (
              orders.map((o) => {
                let color = "bg-amber-100 text-amber-800";
                if (o.status === "delivered") color = "bg-[#E5F5D0] text-[#35610D]";
                if (o.status === "cancelled") color = "bg-rose-100 text-rose-700";
                return (
                  <Row key={o.id} title={o.item} sub={o.id} chip={o.status} chipClass={color} />
                );
              })
            )}
          </Card>

          <Card title="Upcoming Bookings" icon={Calendar} cta="Book a service" link="/services">
            {bookingsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
              </div>
            ) : !bookings || bookings.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No bookings yet</div>
            ) : (
              bookings.map((o) => {
                let color = "bg-sky-100 text-sky-800";
                if (o.status === "completed") color = "bg-[#E5F5D0] text-[#35610D]";
                if (o.status === "cancelled") color = "bg-rose-100 text-rose-700";
                return (
                  <Row key={o.id} title={o.item} sub={o.id} chip={`${o.status} (${o.scheduledDate})`} chipClass={color} />
                );
              })
            )}
          </Card>

          <Card title="Notifications" icon={Bell} cta="Mark all read" link="/dashboard">
            {notificationsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">No notifications</div>
            ) : (
              notifications.map((n) => (
                <Row
                  key={n.id}
                  title={n.title}
                  sub={n.sub}
                  chip={n.readAt ? "Read" : "Unread"}
                  chipClass={n.readAt ? "bg-slate-100 text-slate-500" : "bg-[#E5F5D0] text-[#35610D]"}
                  onClick={!n.readAt ? () => markReadMutation.mutate(n.id) : undefined}
                />
              ))
            )}
          </Card>

          <Card title="Saved Products" icon={Heart} cta="Browse shop" link="/shop">
            {[
              { id: "p1", name: "Mavuno Planting Fertilizer", price: 3450 },
              { id: "p7", name: "Sukari F1 Tomato Seed", price: 1850 },
            ].map((p) => (
              <Row
                key={p.id}
                title={p.name}
                sub={`KES ${p.price.toLocaleString()}`}
                chip="Save 5%"
                chipClass="bg-[#E5F5D0] text-[#35610D]"
              />
            ))}
          </Card>

          <Card title="Recommended For You" icon={TrendingUp} cta="View shop" link="/shop">
            {[
              { name: "CAN Top Dressing", reason: "Matches your maize crop stage" },
              { name: "Maclick Dewormer", reason: "Due for your dairy cows" },
              { name: "Layers Mash", reason: "Top pick in Uasin Gishu" },
            ].map((r, i) => (
              <Row key={i} title={r.name} sub={r.reason} chip="" chipClass="" />
            ))}
          </Card>

          <Card title="Farm Profile" icon={MapPin} cta="Edit profile" link="/dashboard">
            <ul className="space-y-3 text-xs sm:text-sm text-left">
              <li className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">County</span>
                <span className="font-bold text-[#0F291E]">{user.county || "Uasin Gishu"}</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Farm size</span>
                <span className="font-bold text-[#0F291E]">{user.farmSize || "4 acres"}</span>
              </li>
              <li className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Crops</span>
                <span className="font-bold text-[#0F291E]">{user.crops || "Maize, Beans"}</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="text-slate-500">Livestock</span>
                <span className="font-bold text-[#0F291E]">{user.livestock || "3 dairy cows"}</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 border border-white/15 backdrop-blur-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#85CC14]/20 text-[#85CC14]">
        <Icon className="h-5 w-5 stroke-[2.5]" />
      </div>
      <div className="text-left">
        <div className="text-xl font-black text-[#85CC14] font-['Outfit',sans-serif] leading-none">{value}</div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-white/70 mt-1">
          {label}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  cta,
  link,
  children,
}: {
  title: string;
  icon: LucideIcon;
  cta: string;
  link: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between text-left">
      <div>
        <div className="mb-5 flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5F5D0] text-[#35610D]">
              <Icon className="h-4 w-4 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F291E] font-['Outfit',sans-serif]">{title}</h3>
          </div>
          <Link to={link} className="text-xs font-bold text-[#16A34A] hover:text-[#0F291E] hover:underline transition-colors">
            {cta}
          </Link>
        </div>
        <div className="space-y-3">{children}</div>
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
    queryFn: () => getProducts({ data: { limit: 100 } }),
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
