import { useState } from "react";
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

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard · Mqulima" },
      {
        name: "description",
        content:
          "Track orders, manage bookings and view personalized recommendations for your farm.",
      },
    ],
  }),
  component: Dashboard,
});

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

  if (isLoading) {
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
      <section className="bg-gradient-to-br from-forest to-primary py-12 text-forest-foreground">
        <div className="container-px mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                Welcome back
              </span>
              <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
                Karibu, {user.name.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-forest-foreground/80">
                <MapPin className="h-3.5 w-3.5" /> {user.county} · {user.farmSize} · {user.crops} &{" "}
                {user.livestock}
              </p>
            </div>
            <div className="flex gap-3">
              <Stat label="Loyalty points" value="2,340" icon={Award} />
              <Stat label="Yield this season" value="+38%" icon={TrendingUp} />
            </div>
          </div>
        </div>
      </section>

      {(user.role === "admin" || user.role === "super_admin") && (
        <section className="container-px mx-auto max-w-7xl pt-12">
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
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">System Status</div>
                  <div className="text-xs text-muted-foreground">
                    {isInstalled ? "Running as standalone app" : "Running in browser"}
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    isOnline ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="h-3 w-3 text-success" /> Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-destructive" /> Offline
                    </>
                  )}
                </div>
              </div>

              {/* Install Button if Installable */}
              {isInstallable && (
                <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-center">
                  <p className="text-xs font-medium text-foreground mb-3">
                    Install Mqulima on your device for fast, offline-capable access to your farm
                    tools.
                  </p>
                  <button
                    onClick={triggerInstall}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-gold-foreground transition hover:bg-gold/80"
                  >
                    <Download className="h-3.5 w-3.5" /> Install App
                  </button>
                </div>
              )}

              {isInstalled && !isInstallable && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center text-xs font-medium text-primary">
                  ✓ Mqulima is installed on your device
                </div>
              )}

              {/* Simulated Notification Toggles */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Alert Subscriptions
                </h4>

                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <div className="text-sm font-semibold text-foreground">Sowing Windows</div>
                    <div className="text-[11px] text-muted-foreground">
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
                    <div className="text-sm font-semibold text-foreground">Market Rates</div>
                    <div className="text-[11px] text-muted-foreground">
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
                    <div className="text-sm font-semibold text-foreground">AI Weather Alerts</div>
                    <div className="text-[11px] text-muted-foreground">
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
                  className="mt-2 w-full rounded-lg border border-border py-2 text-xs font-bold text-foreground transition hover:bg-secondary"
                >
                  Sign out
                </button>
              </div>
            </div>
          </Card>

          <Card title="My Orders" icon={Package} cta="View all" link="/shop">
            {ordersLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-secondary/50 rounded-xl w-full" />
                <div className="h-10 bg-secondary/50 rounded-xl w-full" />
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">No orders yet</div>
            ) : (
              orders.map((o) => {
                let color = "bg-gold/20 text-gold-foreground";
                if (o.status === "delivered") color = "bg-success/15 text-success";
                if (o.status === "cancelled") color = "bg-destructive/15 text-destructive";
                return (
                  <Row key={o.id} title={o.item} sub={o.id} chip={o.status} chipClass={color} />
                );
              })
            )}
          </Card>

          <Card title="Upcoming Bookings" icon={Calendar} cta="Book a service" link="/services">
            {bookingsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-secondary/50 rounded-xl w-full" />
                <div className="h-10 bg-secondary/50 rounded-xl w-full" />
              </div>
            ) : !bookings || bookings.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">No bookings yet</div>
            ) : (
              bookings.map((o) => {
                let color = "bg-primary/15 text-primary";
                if (o.status === "completed") color = "bg-success/15 text-success";
                if (o.status === "cancelled") color = "bg-destructive/15 text-destructive";
                return (
                  <Row key={o.id} title={o.item} sub={o.id} chip={`${o.status} (${o.scheduledDate})`} chipClass={color} />
                );
              })
            )}
          </Card>

          <Card title="Notifications" icon={Bell} cta="Mark all read" link="/dashboard">
            {notificationsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-secondary/50 rounded-xl w-full" />
                <div className="h-10 bg-secondary/50 rounded-xl w-full" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((n) => (
                <Row
                  key={n.id}
                  title={n.title}
                  sub={n.sub}
                  chip={n.readAt ? "Read" : "Unread"}
                  chipClass={n.readAt ? "bg-secondary text-muted-foreground" : "bg-gold/20 text-gold-foreground"}
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
                chipClass="bg-gold/20 text-gold-foreground"
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
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">County</span>
                <span className="font-semibold">Uasin Gishu</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Farm size</span>
                <span className="font-semibold">4 acres</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Crops</span>
                <span className="font-semibold">Maize, Beans</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Livestock</span>
                <span className="font-semibold">3 dairy cows</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
      <Icon className="h-5 w-5 text-gold" />
      <div>
        <div className="text-lg font-extrabold text-gold">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-forest-foreground/70">
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
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-forest">{title}</h3>
        </div>
        <Link to={link} className="text-xs font-semibold text-blue hover:underline">
          {cta}
        </Link>
      </div>
      <div className="space-y-2.5">{children}</div>
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
      className={`flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-4 py-3 ${
        onClick ? "cursor-pointer hover:bg-secondary/70 transition" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
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
    patternName: "Toggle Featured Status",
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
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600 animate-pulse" /> Admin Portal
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-[#0D2A1C] font-serif">
            Manage Featured Collection
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Filter by category to add, edit, or remove featured products on the platform.
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
