import React from "react";
import {
  LayoutDashboard,
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
} from "lucide-react";

export type AdminTab =
  | "dashboard"
  | "customers"
  | "products"
  | "featured"
  | "orders"
  | "payments"
  | "services"
  | "commodity-trends"
  | "inquiries"
  | "forum"
  | "academy"
  | "news";

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
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
      <div className="space-y-5 px-3">
        <div className="px-3 text-[12px] font-mono font-black uppercase tracking-widest text-[#041E1C]">
          MENU
        </div>

        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="px-3 text-[11px] font-mono uppercase tracking-widest text-[#041E1C] font-black pt-2 pb-1 border-t border-[#31B09E]/50">
              {group.groupName}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-[13px] font-extrabold transition cursor-pointer text-left ${
                    isActive
                      ? "bg-[#145248] text-white shadow-sm font-black border-l-4 border-[#031514]"
                      : "text-[#041E1C] hover:bg-[#1D6C60] hover:text-white"
                  }`}
                >
                  {/* Strong Solid Color Badge Box with White Icon */}
                  <div
                    className={`h-7 w-7 rounded-[4px] flex items-center justify-center shrink-0 shadow-xs ${item.badgeBg}`}
                  >
                    <Icon className="h-4.5 w-4.5 stroke-[2.5] text-white" />
                  </div>
                  <span className="truncate tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="px-4 pt-4 border-t border-[#2DAA96] text-[11px] font-mono text-[#041E1C] font-extrabold flex items-center justify-between">
        <span>Vite + React 19</span>
        <span className="h-2.5 w-2.5 rounded-full bg-[#145248] animate-pulse" />
      </div>
    </aside>
  );
};
