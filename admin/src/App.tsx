import React, { useState, useEffect } from "react";
import { Topbar } from "./components/layout/Topbar";
import { Sidebar, AdminTab } from "./components/layout/Sidebar";
import { AdminLoginScreen } from "./components/auth/AdminLoginScreen";
import { clearAdminCache } from "./lib/api";

import { DashboardHomeModule } from "./components/modules/DashboardHomeModule";

const CustomersModule = React.lazy(() => import("./components/modules/CustomersModule").then(m => ({ default: m.CustomersModule })));
const ProductsStockModule = React.lazy(() => import("./components/modules/ProductsStockModule").then(m => ({ default: m.ProductsStockModule })));
const FeaturedCollectionModule = React.lazy(() => import("./components/modules/FeaturedCollectionModule").then(m => ({ default: m.FeaturedCollectionModule })));
const OrdersQuotationsModule = React.lazy(() => import("./components/modules/OrdersQuotationsModule").then(m => ({ default: m.OrdersQuotationsModule })));
const PaymentsModule = React.lazy(() => import("./components/modules/PaymentsModule").then(m => ({ default: m.PaymentsModule })));
const InquiriesModule = React.lazy(() => import("./components/modules/InquiriesModule").then(m => ({ default: m.InquiriesModule })));
const ForumModerationModule = React.lazy(() => import("./components/modules/ForumModerationModule").then(m => ({ default: m.ForumModerationModule })));
const AcademyExtensionModule = React.lazy(() => import("./components/modules/AcademyExtensionModule").then(m => ({ default: m.AcademyExtensionModule })));
const ServiceRequestsModule = React.lazy(() => import("./components/modules/ServiceRequestsModule").then(m => ({ default: m.ServiceRequestsModule })));
const NewsCMSModule = React.lazy(() => import("./components/modules/NewsCMSModule").then(m => ({ default: m.NewsCMSModule })));
const CommodityTrendsModule = React.lazy(() => import("./components/modules/CommodityTrendsModule").then(m => ({ default: m.CommodityTrendsModule })));

import { Toaster, toast } from "sonner";

interface AdminUserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Lightweight, elegant skeleton fallback matching Mqulima's design palette.
 * Avoids layout shifting and dark flashes.
 */
const ModuleLoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse text-left">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-[#d2e8e3] rounded-[6px]" />
        <div className="h-3 w-72 bg-[#d2e8e3]/70 rounded-[4px]" />
      </div>
      <div className="h-9 w-36 bg-[#278C7B]/20 rounded-[6px]" />
    </div>

    {/* Metrics / Cards Row Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="h-20 bg-white/70 border border-[#CCE5E1] rounded-[6px] p-4 space-y-2">
        <div className="h-3 w-20 bg-[#d2e8e3] rounded-[4px]" />
        <div className="h-6 w-16 bg-[#278C7B]/30 rounded-[4px]" />
      </div>
      <div className="h-20 bg-white/70 border border-[#CCE5E1] rounded-[6px] p-4 space-y-2">
        <div className="h-3 w-24 bg-[#d2e8e3] rounded-[4px]" />
        <div className="h-6 w-20 bg-[#278C7B]/30 rounded-[4px]" />
      </div>
      <div className="h-20 bg-white/70 border border-[#CCE5E1] rounded-[6px] p-4 space-y-2">
        <div className="h-3 w-28 bg-[#d2e8e3] rounded-[4px]" />
        <div className="h-6 w-14 bg-[#278C7B]/30 rounded-[4px]" />
      </div>
    </div>

    {/* Table / Content Skeleton */}
    <div className="bg-white border border-[#CCE5E1] rounded-[6px] p-4 space-y-3">
      <div className="h-8 bg-[#E8F4F1] rounded-[6px]" />
      <div className="space-y-2 pt-2">
        <div className="h-10 bg-[#f4faf9] rounded-[4px]" />
        <div className="h-10 bg-[#f4faf9] rounded-[4px]" />
        <div className="h-10 bg-[#f4faf9] rounded-[4px]" />
        <div className="h-10 bg-[#f4faf9] rounded-[4px]" />
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  const [adminSession, setAdminSession] = useState<AdminUserSession | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("mqulima_admin_user") || localStorage.getItem("mqulima_admin_user");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (_) {}
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [visitedTabs, setVisitedTabs] = useState<Set<AdminTab>>(() => new Set<AdminTab>(["dashboard"]));

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const handleLogout = () => {
    setAdminSession(null);
    setVisitedTabs(new Set(["dashboard"]));
    clearAdminCache();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("mqulima_admin_user");
      localStorage.removeItem("mqulima_admin_user");
      localStorage.removeItem("mqulima_admin_token");
      sessionStorage.removeItem("mqulima_admin_token");
      localStorage.removeItem("mqulima_admin_session");
      sessionStorage.removeItem("mqulima_admin_session");
      // Fire document cookie expiration for mq_session
      document.cookie = "mq_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    }
    toast.info("Logged out of Mqulima Admin Console.");
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
      toast.error("Session expired. Please log in again.");
    };
    window.addEventListener("admin_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("admin_unauthorized", handleUnauthorized);
  }, []);

  const handleLoginSuccess = (user: AdminUserSession) => {
    setAdminSession(user);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("mqulima_admin_user", JSON.stringify(user));
    }
    toast.success(`Welcome back, ${user.name}!`);
  };

  if (!adminSession) {
    return (
      <>
        <Toaster position="top-right" theme="light" />
        <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  const renderModuleTab = (tab: AdminTab) => {
    switch (tab) {
      case "dashboard":
        return <DashboardHomeModule onNavigateTab={setActiveTab} />;
      case "customers":
        return <CustomersModule />;
      case "products":
        return <ProductsStockModule />;
      case "featured":
        return <FeaturedCollectionModule />;
      case "orders":
        return <OrdersQuotationsModule />;
      case "payments":
        return <PaymentsModule />;
      case "inquiries":
        return <InquiriesModule />;
      case "forum":
        return <ForumModerationModule />;
      case "academy":
        return <AcademyExtensionModule />;
      case "services":
        return <ServiceRequestsModule />;
      case "news":
        return <NewsCMSModule />;
      case "commodity-trends":
        return <CommodityTrendsModule />;
      default:
        return <DashboardHomeModule onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#E8F4F1] text-[#0F3D3C] flex flex-col font-sans">
      <Toaster position="top-right" theme="light" />
      <Topbar
        userName={adminSession.name}
        userRole={adminSession.role}
        userEmail={adminSession.email}
        onLogout={handleLogout}
      />
      <div className="flex flex-1 pt-16">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 ml-60 p-6 overflow-y-auto min-h-[calc(100vh-4rem)] text-left">
          {Array.from(visitedTabs).map((tab) => (
            <div
              key={tab}
              style={{ display: tab === activeTab ? "block" : "none" }}
              className="w-full"
            >
              <React.Suspense fallback={<ModuleLoadingSkeleton />}>
                {renderModuleTab(tab)}
              </React.Suspense>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default App;
