import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Search, 
  X, 
  Users, 
  Package, 
  ShoppingCart, 
  LayoutDashboard, 
  CreditCard, 
  Wrench, 
  LineChart, 
  MessageSquare, 
  ShieldAlert, 
  GraduationCap, 
  Newspaper,
  Star,
  ArrowRight,
  ExternalLink,
  CornerDownLeft,
  Command
} from "lucide-react";
import { AdminTab } from "./Sidebar";
import { adminCache } from "../../lib/cache";
import { adminFetch } from "../../lib/api";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: AdminTab) => void;
  initialQuery?: string;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Modules" | "Farmers" | "Products" | "Orders";
  tab: AdminTab;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  url?: string;
}

const STATIC_MODULES: SearchItem[] = [
  { id: "mod-dashboard", title: "Executive Dashboard", subtitle: "Real-time metrics, revenue, active orders, live feeds", category: "Modules", tab: "dashboard", icon: LayoutDashboard },
  { id: "mod-customers", title: "Customer & Farmer CRM", subtitle: "National IDs, delivery locations, crops, KYC statuses", category: "Modules", tab: "customers", icon: Users },
  { id: "mod-products", title: "Products & Stock Inventory", subtitle: "Catalog, prices, inventory levels, SKUs, categories", category: "Modules", tab: "products", icon: Package },
  { id: "mod-featured", title: "Featured Collection", subtitle: "Curated hero promotions & seasonal campaigns", category: "Modules", tab: "featured", icon: Star },
  { id: "mod-orders", title: "Orders & Quotations", subtitle: "Customer orders, WhatsApp checkout, B2B quotes", category: "Modules", tab: "orders", icon: ShoppingCart },
  { id: "mod-payments", title: "Payment Reconciliation", subtitle: "M-Pesa Daraja, Paystack, bank verification", category: "Modules", tab: "payments", icon: CreditCard },
  { id: "mod-services", title: "Service Requests", subtitle: "Veterinary care, soil testing, agronomy bookings", category: "Modules", tab: "services", icon: Wrench },
  { id: "mod-trends", title: "Commodity Trends & Market Prices", subtitle: "Nairobi, Eldoret, Nakuru market indices", category: "Modules", tab: "commodity-trends", icon: LineChart },
  { id: "mod-inquiries", title: "Support Inquiries", subtitle: "Farmer requests, WhatsApp messages, tickets", category: "Modules", tab: "inquiries", icon: MessageSquare },
  { id: "mod-forum", title: "Forum Moderation", subtitle: "Community posts, flagged comments, farmer showcases", category: "Modules", tab: "forum", icon: ShieldAlert },
  { id: "mod-academy", title: "Academy & Extension", subtitle: "Guides, agronomy curricula, seasonal manuals", category: "Modules", tab: "academy", icon: GraduationCap },
  { id: "mod-news", title: "Agritech News CMS", subtitle: "Articles, editorial drafts, agriculture updates", category: "Modules", tab: "news", icon: Newspaper },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  initialQuery = "",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Load cached data or prefetch in background
      const cachedCust = adminCache.get("/api/admin/customers")?.entry?.data;
      if (cachedCust?.success && Array.isArray(cachedCust.customers)) {
        setCustomersData(cachedCust.customers);
      } else {
        adminFetch("/api/admin/customers")
          .then((r) => r.json())
          .then((d) => d.success && setCustomersData(d.customers))
          .catch(() => {});
      }

      const cachedProd = adminCache.get("/api/admin/products")?.entry?.data;
      if (cachedProd?.success && Array.isArray(cachedProd.products)) {
        setProductsData(cachedProd.products);
      } else {
        adminFetch("/api/admin/products?limit=100")
          .then((r) => r.json())
          .then((d) => d.success && setProductsData(d.products || d.data))
          .catch(() => {});
      }

      const cachedOrders = adminCache.get("/api/admin/orders")?.entry?.data;
      if (cachedOrders?.success && Array.isArray(cachedOrders.orders)) {
        setOrdersData(cachedOrders.orders);
      } else {
        adminFetch("/api/admin/orders")
          .then((r) => r.json())
          .then((d) => d.success && setOrdersData(d.orders || d.data))
          .catch(() => {});
      }
    }
  }, [isOpen, initialQuery]);

  // Compute search results across all data sets
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: SearchItem[] = [];

    // 1. Matches in Modules
    if (!q) {
      items.push(...STATIC_MODULES.slice(0, 6));
    } else {
      STATIC_MODULES.forEach((mod) => {
        if (mod.title.toLowerCase().includes(q) || mod.subtitle.toLowerCase().includes(q)) {
          items.push(mod);
        }
      });
    }

    // 2. Matches in Customers / Farmers
    if (q) {
      customersData.forEach((c) => {
        const name = (c.name || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.phone || "");
        const idNum = (c.nationalId || c.idNumber || "");
        const county = (c.county || "").toLowerCase();

        if (name.includes(q) || email.includes(q) || phone.includes(q) || idNum.includes(q) || county.includes(q)) {
          items.push({
            id: `cust-${c.id}`,
            title: c.name || "Farmer Account",
            subtitle: `${c.phone || "No phone"} • Nat ID: ${c.nationalId || "N/A"} • ${c.county || "Kenya"}`,
            category: "Farmers",
            tab: "customers",
            icon: Users,
            badge: c.status?.toUpperCase() || "ACTIVE",
            badgeColor: c.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
          });
        }
      });
    }

    // 3. Matches in Products
    if (q) {
      productsData.forEach((p) => {
        const title = (p.title || p.name || "").toLowerCase();
        const cat = (p.category || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();

        if (title.includes(q) || cat.includes(q) || sku.includes(q)) {
          items.push({
            id: `prod-${p.id}`,
            title: p.title || p.name || "Agricultural Product",
            subtitle: `KES ${Number(p.price || 0).toLocaleString()} • Category: ${p.category || "General"} • Stock: ${p.stock ?? p.inventory ?? 0}`,
            category: "Products",
            tab: "products",
            icon: Package,
            badge: (p.stock || p.inventory) > 0 ? "IN STOCK" : "LOW STOCK",
            badgeColor: (p.stock || p.inventory) > 0 ? "bg-teal-100 text-teal-800" : "bg-rose-100 text-rose-800",
          });
        }
      });
    }

    // 4. Matches in Orders
    if (q) {
      ordersData.forEach((o) => {
        const id = (o.id || "").toLowerCase();
        const customerName = (o.customerName || o.deliveryAddress || "").toLowerCase();
        const status = (o.status || "").toLowerCase();

        if (id.includes(q) || customerName.includes(q) || status.includes(q)) {
          items.push({
            id: `order-${o.id}`,
            title: `Order #${(o.id || "").slice(0, 8)}`,
            subtitle: `KES ${Number(o.total || 0).toLocaleString()} • Status: ${o.status || "Pending"} • ${o.checkoutChannel || "Website"}`,
            category: "Orders",
            tab: "orders",
            icon: ShoppingCart,
            badge: (o.status || "PENDING").toUpperCase(),
            badgeColor: o.status === "paid" || o.status === "delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
          });
        }
      });
    }

    return items.slice(0, 15);
  }, [query, customersData, productsData, ordersData]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        onNavigateTab(selected.tab);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-[10px] shadow-2xl border border-[#CCE5E1] overflow-hidden flex flex-col mx-4 animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#CCE5E1] bg-[#F7FCFB] gap-3">
          <Search className="h-5 w-5 text-[#278C7B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search dashboard, orders, farmers, inventory, National IDs..."
            className="flex-1 bg-transparent text-[#0F3D3C] text-sm placeholder-[#4A7C79] focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="p-1 hover:bg-[#CCE5E1] rounded text-[#4A7C79] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-1 font-mono text-[11px] text-[#4A7C79] bg-[#E8F4F1] border border-[#CCE5E1] px-2 py-0.5 rounded">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-[#CCE5E1]/40">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-[#4A7C79]">
              <Search className="h-8 w-8 mx-auto text-[#CCE5E1] mb-2" />
              <p className="text-sm font-semibold text-[#0F3D3C]">No results found for "{query}"</p>
              <p className="text-xs text-[#4A7C79] mt-1">Try searching for farmer names, phone numbers, product titles, or order IDs.</p>
            </div>
          ) : (
            searchResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onNavigateTab(item.tab);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-[6px] transition cursor-pointer ${
                    isSelected ? "bg-[#E8F4F1] text-[#0F3D3C] border-l-4 border-[#278C7B]" : "hover:bg-[#F7FCFB] text-[#0F3D3C]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-[6px] shrink-0 ${isSelected ? "bg-[#278C7B] text-white" : "bg-[#E8F4F1] text-[#278C7B]"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate text-[#0F3D3C]">{item.title}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.category}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${item.badgeColor || "bg-gray-100 text-gray-700"}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#4A7C79] truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#4A7C79] shrink-0 pl-2">
                    <span className="text-[11px] font-mono hidden sm:inline">Go to {item.tab}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#278C7B]" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#E8F4F1] border-t border-[#CCE5E1] flex items-center justify-between text-[11px] font-mono text-[#2C5E5B]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#CCE5E1] text-[10px]">↑</kbd>
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#CCE5E1] text-[10px]">↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#CCE5E1] text-[10px]">↵</kbd> to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-[#CCE5E1] text-[10px]">ESC</kbd> to close
            </span>
          </div>
          <span className="font-bold text-[#0F3D3C]">Mqulima Global Command Palette</span>
        </div>
      </div>
    </div>
  );
};
