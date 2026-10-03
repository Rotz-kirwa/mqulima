import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Check, 
  X, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  MessageSquare, 
  CheckCheck,
  ChevronRight
} from "lucide-react";
import { AdminTab } from "./Sidebar";
import { adminCache } from "../../lib/cache";
import { adminFetch } from "../../lib/api";

interface NotificationsTrayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: AdminTab) => void;
  onUnreadCountChange?: (count: number) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: "orders" | "farmers" | "payments" | "system";
  tab: AdminTab;
  isRead: boolean;
  icon: React.ElementType;
  iconBg: string;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New Farmer Account Registered",
    description: "KIPCHUMBA KIPRUTO registered from Elgeyo-Marakwet (ID: 36011184).",
    timestamp: "10m ago",
    category: "farmers",
    tab: "customers",
    isRead: false,
    icon: Users,
    iconBg: "bg-teal-600",
  },
  {
    id: "notif-2",
    title: "M-Pesa Payment Reconciled",
    description: "M-Pesa Daraja payment of KES 8,450 confirmed for fertilizer & seeds.",
    timestamp: "25m ago",
    category: "payments",
    tab: "payments",
    isRead: false,
    icon: CreditCard,
    iconBg: "bg-emerald-600",
  },
  {
    id: "notif-3",
    title: "New WhatsApp Quotation Request",
    description: "Farmer Kosgei requested quotation for 50 bags DAP fertilizer in Labot.",
    timestamp: "1h ago",
    category: "orders",
    tab: "orders",
    isRead: false,
    icon: ShoppingCart,
    iconBg: "bg-amber-600",
  },
  {
    id: "notif-4",
    title: "PostgreSQL Database Cluster Active",
    description: "Cloud database connection healthy on Render Ohio. Query latency optimal.",
    timestamp: "2h ago",
    category: "system",
    tab: "dashboard",
    isRead: true,
    icon: ShieldCheck,
    iconBg: "bg-blue-600",
  },
  {
    id: "notif-5",
    title: "Farmer Agronomy Support Request",
    description: "Inquiry received: Maize fall armyworm diagnosis requested in Bungoma.",
    timestamp: "3h ago",
    category: "system",
    tab: "inquiries",
    isRead: true,
    icon: MessageSquare,
    iconBg: "bg-rose-600",
  },
];

export const NotificationsTray: React.FC<NotificationsTrayProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onUnreadCountChange,
}) => {
  const trayRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<"all" | "orders" | "farmers" | "system">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem("mq_admin_read_notifs");
      if (stored) {
        const readIds = new Set(JSON.parse(stored));
        return DEFAULT_NOTIFICATIONS.map((n) => ({
          ...n,
          isRead: readIds.has(n.id) || n.isRead,
        }));
      }
    } catch (_) {}
    return DEFAULT_NOTIFICATIONS;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    try {
      localStorage.setItem("mq_admin_read_notifs", JSON.stringify(updated.map((n) => n.id)));
    } catch (_) {}
  };

  const handleNotificationClick = (item: NotificationItem) => {
    const updated = notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    try {
      const readIds = updated.filter((n) => n.isRead).map((n) => n.id);
      localStorage.setItem("mq_admin_read_notifs", JSON.stringify(readIds));
    } catch (_) {}
    onNavigateTab(item.tab);
    onClose();
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "orders") return n.category === "orders" || n.category === "payments";
    if (filter === "farmers") return n.category === "farmers";
    if (filter === "system") return n.category === "system";
    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      ref={trayRef}
      className="absolute right-6 top-14 w-[350px] sm:w-[420px] bg-white rounded-[10px] shadow-2xl border border-[#CCE5E1] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#CCE5E1] bg-[#F7FCFB]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-4 w-4 text-[#278C7B]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-[#F5A623] rounded-full" />
            )}
          </div>
          <h3 className="text-xs font-mono font-black uppercase tracking-wider text-[#0F3D3C]">
            Notifications ({unreadCount} unread)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-mono font-bold text-[#278C7B] hover:text-[#1d6b5e] cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1 text-[#4A7C79] hover:text-[#0F3D3C] hover:bg-[#E8F4F1] rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#CCE5E1] bg-[#E8F4F1]/40 px-3 gap-2 py-1.5 text-[11px] font-mono">
        {(["all", "orders", "farmers", "system"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-2.5 py-1 rounded-[4px] capitalize transition cursor-pointer font-bold ${
              filter === tab
                ? "bg-[#278C7B] text-white shadow-2xs"
                : "text-[#4A7C79] hover:bg-white hover:text-[#0F3D3C]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="max-h-[350px] overflow-y-auto divide-y divide-[#CCE5E1]/50">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-[#4A7C79]">
            <Bell className="h-6 w-6 mx-auto text-[#CCE5E1] mb-2" />
            <p className="text-xs font-semibold">No notifications in this category</p>
          </div>
        ) : (
          filtered.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`flex items-start gap-3 p-3 transition cursor-pointer hover:bg-[#F7FCFB] ${
                  !item.isRead ? "bg-[#E8F4F1]/50" : ""
                }`}
              >
                <div className={`h-7 w-7 rounded-[4px] flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5 ${item.iconBg}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold truncate ${!item.isRead ? "text-[#0F3D3C]" : "text-[#4A7C79]"}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-mono text-[#4A7C79] shrink-0">{item.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#2C5E5B] mt-0.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-mono font-bold text-[#278C7B]">
                    <span>View in {item.tab}</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
                {!item.isRead && (
                  <span className="h-2 w-2 rounded-full bg-[#F5A623] shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#F7FCFB] border-t border-[#CCE5E1] text-center">
        <span className="text-[11px] font-mono text-[#4A7C79]">
          Real-time Mqulima operations alerts
        </span>
      </div>
    </div>
  );
};
