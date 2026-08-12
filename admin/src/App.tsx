import React, { useState, useEffect } from "react";
import { Topbar } from "./components/layout/Topbar";
import { Sidebar, AdminTab } from "./components/layout/Sidebar";
import { AdminLoginScreen } from "./components/auth/AdminLoginScreen";

import { DashboardHomeModule } from "./components/modules/DashboardHomeModule";

const CustomersModule = React.lazy(() => import("./components/modules/CustomersModule").then(m => ({ default: m.CustomersModule })));
const ProductsStockModule = React.lazy(() => import("./components/modules/ProductsStockModule").then(m => ({ default: m.ProductsStockModule })));
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

const ModuleLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
    <div className="w-8 h-8 border-3 border-[#278C7B] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-mono text-[#2C5E5B] font-bold">Loading Module...</span>
  </div>
);

export const App: React.FC = () => {
  const [adminSession, setAdminSession] = useState<AdminUserSession | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mqulima_admin_session") || sessionStorage.getItem("mqulima_admin_session");
      const token = localStorage.getItem("mqulima_admin_token") || sessionStorage.getItem("mqulima_admin_token");
      if (stored && token) {
        try {
          return JSON.parse(stored);
        } catch (_) {}
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const handleLogout = () => {
    setAdminSession(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mqulima_admin_session");
      sessionStorage.removeItem("mqulima_admin_session");
      localStorage.removeItem("mqulima_admin_token");
      sessionStorage.removeItem("mqulima_admin_token");
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
      localStorage.setItem("mqulima_admin_session", JSON.stringify(user));
      sessionStorage.setItem("mqulima_admin_session", JSON.stringify(user));
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

  const renderModule = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHomeModule onNavigateTab={setActiveTab} />;
      case "customers":
        return <CustomersModule />;
      case "products":
        return <ProductsStockModule />;
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
          <React.Suspense fallback={<ModuleLoadingFallback />}>
            {renderModule()}
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;
