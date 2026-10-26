import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Wrench,
  TrendingUp,
  LineChart,
  BrainCircuit,
  MessageSquare,
  ShieldAlert,
  Star,
  GraduationCap,
  Newspaper,
  BellRing,
  ChevronDown,
  ChevronUp,
  Layers,
  CloudSun,
  Store,
  HelpCircle,
  Building2,
} from "lucide-react";
import { prefetchAdminData } from "../../lib/api";

export type AdminTab =
  | "dashboard"
  | "analytics"
  | "customers"
  | "products"
  | "featured"
  | "orders"
  | "payments"
  | "subscriptions"
  | "services"
  | "commodity-trends"
  | "inquiries"
  | "forum"
  | "academy"
  | "news"
  | "business-profile";

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  userRole?: string;
}

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  badgeBg: string; // Strong solid background color
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export interface SubscriptionSubCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  badgeColor?: string;
}

export const SUBSCRIPTION_SUB_CATEGORIES: SubscriptionSubCategory[] = [
  { id: "all", label: "All Subscriptions", icon: Layers },
  { id: "academy", label: "Academy Subscriptions", icon: GraduationCap },
  { id: "news", label: "News Subscriptions", icon: Newspaper },
  { id: "market_alerts", label: "Market Price Alerts", icon: LineChart },
  { id: "weather_alerts", label: "Weather Alerts", icon: CloudSun },
  { id: "community", label: "Community Subscriptions", icon: Users },
  { id: "ai_services", label: "AI Services Subscriptions", icon: BrainCircuit },
  { id: "marketplace_business", label: "Marketplace & Business", icon: Store },
  { id: "other", label: "Other Subscriptions", icon: HelpCircle },
];

const MODULE_LOADERS: Record<AdminTab, () => Promise<any>> = {
  dashboard: () => Promise.resolve(),
  analytics: () => import("../modules/VisitorAnalyticsModule"),
  customers: () => import("../modules/CustomersModule"),
  products: () => import("../modules/ProductsStockModule"),
  featured: () => import("../modules/FeaturedCollectionModule"),
  orders: () => import("../modules/OrdersQuotationsModule"),
  payments: () => import("../modules/PaymentsModule"),
  subscriptions: () => import("../modules/SubscriptionsModule"),
  services: () => import("../modules/ServiceRequestsModule"),
  "commodity-trends": () => import("../modules/CommodityTrendsModule"),
  inquiries: () => import("../modules/InquiriesModule"),
  forum: () => import("../modules/ForumModerationModule"),
  academy: () => import("../modules/AcademyExtensionModule"),
  news: () => import("../modules/NewsCMSModule"),
  "business-profile": () => import("../modules/BusinessProfileModule").then(m => ({ default: m.BusinessProfileModule })),
};

const TAB_DATA_ENDPOINTS: Record<AdminTab, string[]> = {
  dashboard: ["/api/admin/analytics", "/api/admin/market-prices"],
  analytics: ["/api/admin/visitor-analytics"],
  customers: ["/api/admin/customers"],
  products: ["/api/admin/products"],
  featured: ["/api/admin/featured"],
  orders: ["/api/admin/orders", "/api/admin/quotations"],
  payments: ["/api/admin/payments"],
  subscriptions: ["/api/admin/subscriptions", "/api/admin/subscriptions/stats"],
  services: ["/api/admin/services"],
  "commodity-trends": ["/api/admin/commodity-trends"],
  inquiries: ["/api/admin/inquiries"],
  forum: ["/api/admin/forum-moderation"],
  academy: ["/api/admin/academy"],
  news: ["/api/admin/news"],
  "business-profile": ["/api/admin/business-profile"],
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const [isSubsOpen, setIsSubsOpen] = useState<boolean>(() => activeTab === "subscriptions");
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("category");
      return p || "all";
    }
    return "all";
  });

  // Keep accordion open when navigating to subscriptions
  useEffect(() => {
    if (activeTab === "subscriptions") {
      setIsSubsOpen(true);
      const p = new URLSearchParams(window.location.search).get("category") || "all";
      setActiveCategory(p);
    }
  }, [activeTab]);

  // Listen to popstate or category changes
  useEffect(() => {
    const handleUrlChange = () => {
      const p = new URLSearchParams(window.location.search).get("category") || "all";
      setActiveCategory(p);
    };
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  const handlePreload = (tabId: AdminTab) => {
    try {
      MODULE_LOADERS[tabId]?.();
    } catch (_) {}

    TAB_DATA_ENDPOINTS[tabId]?.forEach((endpoint) => {
      prefetchAdminData(endpoint);
    });
  };

  const handleSelectCategory = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCategory(catId);
    if (typeof window !== "undefined") {
      const targetUrl = catId === "all" ? `/subscriptions` : `/subscriptions?category=${catId}`;
      window.history.pushState({ tab: "subscriptions", category: catId }, "", targetUrl);
      window.dispatchEvent(
        new CustomEvent("mq_admin_subscription_category_change", {
          detail: { category: catId },
        })
      );
    }
    setActiveTab("subscriptions");
  };

  const groups: NavGroup[] = [
    {
      groupName: "OPERATIONS HOME",
      items: [
        {
          id: "dashboard",
          label: "Executive Dashboard",
          icon: LayoutDashboard,
          badgeBg: "bg-[#F59E0B]", // Solid Amber Gold
        },
        {
          id: "analytics",
          label: "Visitor Analytics (GA4)",
          icon: BarChart3,
          badgeBg: "bg-[#278C7B]", // Solid Deep Teal
        },
        {
          id: "business-profile",
          label: "Business Profile",
          icon: Building2,
          badgeBg: "bg-[#245B35]", // Solid Forest Green
        },
      ],
    },
    {
      groupName: "COMMERCE & OPERATIONS",
      items: [
        {
          id: "customers",
          label: "Customers CRM",
          icon: Users,
          badgeBg: "bg-[#0284C7]", // Solid Electric Cyan Blue
        },
        {
          id: "subscriptions",
          label: "Subscriptions",
          icon: BellRing,
          badgeBg: "bg-[#7C3AED]", // Solid Vivid Purple
        },
        {
          id: "products",
          label: "Products",
          icon: Package,
          badgeBg: "bg-[#10B981]", // Solid Fresh Emerald
        },
        {
          id: "featured",
          label: "Featured Collection",
          icon: Star,
          badgeBg: "bg-[#F59E0B]", // Solid Gold Star
        },
        {
          id: "orders",
          label: "Orders & Quotations",
          icon: ShoppingCart,
          badgeBg: "bg-[#EA580C]", // Solid Harvest Orange
        },
        {
          id: "payments",
          label: "Payment Reconciliation",
          icon: CreditCard,
          badgeBg: "bg-[#16A34A]", // Solid Bright Green
        },
        {
          id: "services",
          label: "Service Requests",
          icon: Wrench,
          badgeBg: "bg-[#4F46E5]", // Solid Indigo
        },
      ],
    },
    {
      groupName: "MARKETPLACE & INTELLIGENCE",
      items: [
        {
          id: "commodity-trends",
          label: "Commodity Trends",
          icon: LineChart,
          badgeBg: "bg-[#0EA5E9]", // Solid Sky Blue
        },
      ],
    },
    {
      groupName: "COMMUNITY & CONTENT",
      items: [
        {
          id: "inquiries",
          label: "Support Inquiries",
          icon: MessageSquare,
          badgeBg: "bg-[#E11D48]", // Solid Rose Pink
        },
        {
          id: "forum",
          label: "Forum Moderation",
          icon: ShieldAlert,
          badgeBg: "bg-[#DC2626]", // Solid Crimson Red
        },
        {
          id: "academy",
          label: "Academy & Extension",
          icon: GraduationCap,
          badgeBg: "bg-[#2563EB]", // Solid Deep Blue
        },
        {
          id: "news",
          label: "Agritech News CMS",
          icon: Newspaper,
          badgeBg: "bg-[#0D9488]", // Solid Deep Teal
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#3CBDA8] border-r border-[#2DAA96] h-[calc(100vh-4rem)] flex flex-col justify-between py-4 fixed left-0 top-16 z-40 select-none overflow-y-auto">
      <div className="space-y-4 px-3">
        <div className="px-3 text-[12px] font-mono font-black uppercase tracking-widest text-[#041E1C]">
          MENU
        </div>

        {groups.map((group, groupIdx) => {
          if (group.items.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              <div className="px-3 text-[11px] font-mono uppercase tracking-widest text-[#041E1C] font-black pt-2 pb-1 border-t border-[#31B09E]/50">
                {group.groupName}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isSubscriptionItem = item.id === "subscriptions";

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        if (isSubscriptionItem) {
                          if (activeTab === "subscriptions") {
                            setIsSubsOpen((prev) => !prev);
                          } else {
                            setIsSubsOpen(true);
                            setActiveTab("subscriptions");
                          }
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      onMouseEnter={() => handlePreload(item.id)}
                      onFocus={() => handlePreload(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[6px] text-[13px] font-extrabold transition duration-150 cursor-pointer text-left active:scale-[0.98] ${
                        isActive
                          ? "bg-[#145248] text-white shadow-sm font-black border-l-4 border-[#031514]"
                          : "text-[#041E1C] hover:bg-[#1D6C60] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Strong Solid Color Badge Box with White Icon */}
                        <div
                          className={`h-7 w-7 rounded-[4px] flex items-center justify-center shrink-0 shadow-xs ${item.badgeBg}`}
                        >
                          <Icon className="h-4.5 w-4.5 stroke-[2.5] text-white" />
                        </div>
                        <span className="truncate tracking-tight">{item.label}</span>
                      </div>

                      {isSubscriptionItem && (
                        <div
                          className={`p-1 rounded hover:bg-black/10 transition-transform duration-200 ${
                            isSubsOpen ? "rotate-180" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSubsOpen((prev) => !prev);
                          }}
                        >
                          <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                        </div>
                      )}
                    </button>

                    {/* Expandable Submenu for Subscriptions */}
                    {isSubscriptionItem && isSubsOpen && (
                      <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-[#145248]/30 ml-4 animate-in fade-in duration-200">
                        {SUBSCRIPTION_SUB_CATEGORIES.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive =
                            activeTab === "subscriptions" && activeCategory === sub.id;

                          return (
                            <button
                              key={sub.id}
                              onClick={(e) => handleSelectCategory(sub.id, e)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] text-[11.5px] font-bold transition text-left cursor-pointer ${
                                isSubActive
                                  ? "bg-[#145248] text-white font-black shadow-xs"
                                  : "text-[#041E1C]/90 hover:bg-[#1D6C60]/70 hover:text-white"
                              }`}
                            >
                              <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="px-4 pt-4 border-t border-[#2DAA96] text-[11px] font-mono text-[#041E1C] font-extrabold flex items-center justify-between">
        <span>Vite + React 19</span>
        <span className="h-2.5 w-2.5 rounded-full bg-[#145248] animate-pulse" />
      </div>
    </aside>
  );
};
