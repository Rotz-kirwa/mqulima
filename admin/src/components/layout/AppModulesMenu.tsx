import React, { useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Wrench,
  LineChart,
  MessageSquare,
  ShieldAlert,
  Star,
  GraduationCap,
  Newspaper,
  ExternalLink,
  X
} from "lucide-react";
import { AdminTab } from "./Sidebar";

interface AppModulesMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: AdminTab) => void;
  activeTab?: AdminTab;
}

interface ModuleDef {
  id: AdminTab;
  label: string;
  desc: string;
  icon: React.ElementType;
  bg: string;
}

const MODULES: ModuleDef[] = [
  { id: "dashboard", label: "Executive Dashboard", desc: "Overview & key metrics", icon: LayoutDashboard, bg: "bg-[#F59E0B]" },
  { id: "customers", label: "Customer & Farmer CRM", desc: "IDs, locations, crops & KYC", icon: Users, bg: "bg-[#0D9488]" },
  { id: "products", label: "Products & Stock", desc: "Inventory & price management", icon: Package, bg: "bg-[#2563EB]" },
  { id: "featured", label: "Featured Collection", desc: "Promotions & hero banners", icon: Star, bg: "bg-[#D97706]" },
  { id: "orders", label: "Orders & Quotations", desc: "WhatsApp & online sales", icon: ShoppingCart, bg: "bg-[#EA580C]" },
  { id: "payments", label: "Payment Reconciliation", desc: "M-Pesa & Paystack records", icon: CreditCard, bg: "bg-[#16A34A]" },
  { id: "services", label: "Service Requests", desc: "Vet & soil bookings", icon: Wrench, bg: "bg-[#4F46E5]" },
  { id: "commodity-trends", label: "Commodity Trends", desc: "Market prices & wholesale", icon: LineChart, bg: "bg-[#0EA5E9]" },
  { id: "inquiries", label: "Support Inquiries", desc: "Farmer help tickets", icon: MessageSquare, bg: "bg-[#E11D48]" },
  { id: "forum", label: "Forum Moderation", desc: "Posts, flags & reports", icon: ShieldAlert, bg: "bg-[#DC2626]" },
  { id: "academy", label: "Academy & Extension", desc: "Agronomy guides & content", icon: GraduationCap, bg: "bg-[#3B82F6]" },
  { id: "news", label: "Agritech News CMS", desc: "Articles & press releases", icon: Newspaper, bg: "bg-[#0F766E]" },
];

export const AppModulesMenu: React.FC<AppModulesMenuProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  activeTab,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute right-12 top-14 w-[360px] sm:w-[480px] bg-white rounded-[10px] shadow-2xl border border-[#CCE5E1] p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#CCE5E1]">
        <div>
          <h3 className="text-xs font-mono font-black uppercase tracking-wider text-[#0F3D3C]">
            Mqulima System Modules
          </h3>
          <p className="text-[11px] text-[#4A7C79]">Instant navigation across all platform capabilities</p>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-[#4A7C79] hover:text-[#0F3D3C] hover:bg-[#E8F4F1] rounded cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-3 max-h-[360px] overflow-y-auto">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const isActive = activeTab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                onNavigateTab(m.id);
                onClose();
              }}
              className={`flex flex-col items-start p-2.5 rounded-[6px] transition text-left cursor-pointer border ${
                isActive
                  ? "bg-[#E8F4F1] border-[#278C7B] shadow-2xs"
                  : "border-transparent hover:bg-[#F7FCFB] hover:border-[#CCE5E1]"
              }`}
            >
              <div className={`h-7 w-7 rounded-[4px] flex items-center justify-center text-white mb-2 shadow-xs ${m.bg}`}>
                <Icon className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-[#0F3D3C] leading-snug line-clamp-1">{m.label}</span>
              <span className="text-[10px] text-[#4A7C79] line-clamp-1 mt-0.5">{m.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-[#CCE5E1] flex items-center justify-between">
        <a
          href="/shop"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-[#278C7B] hover:text-[#1e6f62] transition"
        >
          <span>Open Public Marketplace</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <span className="text-[10px] font-mono text-[#4A7C79]">Mqulima Hub</span>
      </div>
    </div>
  );
};
