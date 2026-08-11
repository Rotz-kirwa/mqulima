import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingCart,
  DollarSign,
  Wrench,
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Activity,
  Zap,
  Bell,
  RefreshCw,
} from "lucide-react";
import { AdminTab } from "../layout/Sidebar";
import { adminFetch } from "../../lib/api";

interface DashboardHomeModuleProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const DashboardHomeModule: React.FC<DashboardHomeModuleProps> = ({ onNavigateTab }) => {
  const [kpi, setKpi] = useState<any>({
    activeCustomers: 0,
    openOrders: 0,
    totalRevenueKsh: 0,
    pendingServices: 0,
    fulfilledCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    fulfilledPct: 0,
    monthlyTrend: [],
    weeklyVolume: [],
  });
  const [commodities, setCommodities] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(() => new Date()); // Dynamic current date
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());

  const fetchAnalytics = () => {
    setLoading(true);

    // 1. Fetch Live Production Analytics KPI & Platform Activities
    adminFetch("/api/admin/analytics")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response was not JSON");
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          if (data.kpis) setKpi(data.kpis);
          if (data.liveActivities) setActivities(data.liveActivities);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("Analytics fetch error:", e);
        setLoading(false);
      });

    // 2. Fetch Live Market Commodities
    adminFetch("/api/admin/market-prices")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response was not JSON");
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.commodities) {
          setCommodities(data.commodities);
        }
      })
      .catch((e) => console.error("Market prices fetch error:", e));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Compute dynamic SVG coordinates for Monthly Gross Revenue Area Chart
  const monthlyData: { month: string; revenue: number }[] =
    kpi.monthlyTrend && kpi.monthlyTrend.length > 0
      ? kpi.monthlyTrend
      : [
          { month: "Jan", revenue: 0 },
          { month: "Feb", revenue: 0 },
          { month: "Mar", revenue: 0 },
          { month: "Apr", revenue: 0 },
          { month: "May", revenue: 0 },
          { month: "Jun", revenue: 0 },
        ];

  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);
  const stepX = 100 / Math.max(monthlyData.length - 1, 1);

  const linePoints = monthlyData
    .map((m, i) => {
      const x = i * stepX;
      const y = 90 - (m.revenue / maxRevenue) * 75;
      return `${x},${y}`;
    })
    .join(" ");

  const polygonPoints = `0,100 ${linePoints} 100,100`;

  // Compute dynamic bar chart heights for Weekly Order Volume
  const weeklyData: { day: string; count: number }[] =
    kpi.weeklyVolume && kpi.weeklyVolume.length > 0
      ? kpi.weeklyVolume
      : [
          { day: "Mon", count: 0 },
          { day: "Tue", count: 0 },
          { day: "Wed", count: 0 },
          { day: "Thu", count: 0 },
          { day: "Fri", count: 0 },
          { day: "Sat", count: 0 },
          { day: "Sun", count: 0 },
        ];

  const maxWeeklyCount = Math.max(...weeklyData.map((w) => w.count), 1);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C] tracking-tight">
            Dashboard Operations Panel
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Real-time platform metrics across Commerce, Agronomy Services, Logistics, and Market Intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs bg-white border border-[#CCE5E1] px-3 py-1.5 rounded-[4px] text-[#0F3D3C] shadow-xs">
          <span className="h-2 w-2 rounded-full bg-[#278C7B] animate-pulse" />
          <span>System Status: <strong className="text-[#278C7B]">Optimal (Production DB)</strong></span>
        </div>
      </div>

      {/* ROW 1: 4 Stat Cards with DEEP SOLID COLORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Customers */}
        <div className="bg-[#17605E] rounded-[8px] p-5 text-left flex items-center justify-between shadow-md hover:brightness-105 transition text-white">
          <div>
            <div className="text-[11px] font-mono uppercase text-[#A8E6CF] font-bold tracking-wider">
              Total Active Customers
            </div>
            <div className="text-2xl font-serif font-bold text-white mt-1">
              {loading ? "..." : kpi.activeCustomers.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-[#80E2D0] mt-1 font-bold">
              Live Database Farmers
            </div>
          </div>
          <div className="h-12 w-12 rounded-[8px] bg-white/15 border border-white/20 text-white flex items-center justify-center shadow-inner">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Open Orders */}
        <div className="bg-[#B45309] rounded-[8px] p-5 text-left flex items-center justify-between shadow-md hover:brightness-105 transition text-white">
          <div>
            <div className="text-[11px] font-mono uppercase text-[#FDE68A] font-bold tracking-wider">
              Open Orders & Quotes
            </div>
            <div className="text-2xl font-serif font-bold text-white mt-1">
              {loading ? "..." : kpi.openOrders.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-[#FEF3C7] mt-1 font-bold">
              {kpi.pendingCount} pending fulfillment
            </div>
          </div>
          <div className="h-12 w-12 rounded-[8px] bg-white/15 border border-white/20 text-white flex items-center justify-center shadow-inner">
            <ShoppingCart className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Revenue */}
        <div className="bg-[#047857] rounded-[8px] p-5 text-left flex items-center justify-between shadow-md hover:brightness-105 transition text-white">
          <div>
            <div className="text-[11px] font-mono uppercase text-[#A7F3D0] font-bold tracking-wider">
              Revenue (Gross Total)
            </div>
            <div className="text-2xl font-serif font-bold text-white mt-1">
              {loading ? "..." : `KSh ${kpi.totalRevenueKsh.toLocaleString()}`}
            </div>
            <div className="text-[10px] font-mono text-[#D1FAE5] mt-1 font-bold">
              PostgreSQL Order Ledger
            </div>
          </div>
          <div className="h-12 w-12 rounded-[8px] bg-white/15 border border-white/20 text-white flex items-center justify-center shadow-inner">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Pending Service Requests */}
        <div className="bg-[#3730A3] rounded-[8px] p-5 text-left flex items-center justify-between shadow-md hover:brightness-105 transition text-white">
          <div>
            <div className="text-[11px] font-mono uppercase text-[#C7D2FE] font-bold tracking-wider">
              Pending Service Requests
            </div>
            <div className="text-2xl font-serif font-bold text-white mt-1">
              {loading ? "..." : kpi.pendingServices.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-[#E0E7FF] mt-1 font-bold">
              Agronomy field dispatch
            </div>
          </div>
          <div className="h-12 w-12 rounded-[8px] bg-white/15 border border-white/20 text-white flex items-center justify-center shadow-inner">
            <Wrench className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ROW 2: Revenue Trend Area Chart & Order Volume Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white border border-[#CCE5E1] rounded-[6px] p-5 space-y-4 text-left shadow-xs">
          <div className="flex items-center justify-between border-b border-[#CCE5E1]/60 pb-3">
            <div>
              <h2 className="text-sm font-serif font-bold text-[#0F3D3C]">Monthly Gross Revenue Trend</h2>
              <p className="text-[11px] text-[#4A7C79]">Marketplace transactions (PostgreSQL SQL Monthly Sum)</p>
            </div>
            <span className="text-[10px] font-mono text-[#278C7B] uppercase font-extrabold bg-[#E8F4F1] px-2 py-0.5 rounded-[2px]">
              Live SQL Trend
            </span>
          </div>

          <div className="h-48 w-full bg-white border border-[#CCE5E1] rounded-[4px] p-4 flex flex-col justify-between relative overflow-hidden">
            <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4AC4AF" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#4AC4AF" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <polygon points={polygonPoints} fill="url(#tealGrad)" />
              <polyline points={linePoints} fill="none" stroke="#278C7B" strokeWidth="2.5" />
            </svg>

            <div className="flex justify-between text-[10px] font-mono text-[#4A7C79] z-10">
              <span>{`KSh ${maxRevenue.toLocaleString()}`}</span>
              <span>{`KSh ${Math.round(maxRevenue * 0.66).toLocaleString()}`}</span>
              <span>{`KSh ${Math.round(maxRevenue * 0.33).toLocaleString()}`}</span>
              <span>KSh 0</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#2C5E5B] z-10 border-t border-[#CCE5E1] pt-2 font-medium">
              {monthlyData.map((m, i) => (
                <span key={i}>{m.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Order Volume Bar Chart */}
        <div className="bg-white border border-[#CCE5E1] rounded-[6px] p-5 space-y-4 text-left shadow-xs">
          <div className="flex items-center justify-between border-b border-[#CCE5E1]/60 pb-3">
            <h2 className="text-sm font-serif font-bold text-[#0F3D3C]">Weekly Order Volume</h2>
            <span className="text-[10px] font-mono text-[#278C7B] uppercase font-bold">SQL Day Count</span>
          </div>

          <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 font-mono text-xs">
            {weeklyData.map((bar, i) => {
              const heightPct = maxWeeklyCount > 0 && bar.count > 0 ? (bar.count / maxWeeklyCount) * 85 : 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[9px] text-[#278C7B] font-bold">{bar.count}</span>
                  <div
                    className="w-full bg-[#4AC4AF] hover:bg-[#278C7B] rounded-[2px] transition-all duration-300"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] text-[#4A7C79]">{bar.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 3: Top Commodities & Clean Operations Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Commodities Price Movement */}
        <div className="bg-white border border-[#CCE5E1] rounded-[6px] p-5 space-y-4 text-left shadow-xs">
          <div className="flex items-center justify-between border-b border-[#CCE5E1]/60 pb-3">
            <h2 className="text-sm font-serif font-bold text-[#0F3D3C] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#278C7B]" /> Top Commodities Price Movement
            </h2>
            <button
              onClick={() => onNavigateTab("commodity-trends")}
              className="text-[10px] font-mono text-[#278C7B] hover:underline cursor-pointer font-bold"
            >
              View All Prices →
            </button>
          </div>

          <div className="space-y-3">
            {commodities.length === 0 ? (
              <div className="text-xs font-mono text-[#4A7C79] p-4 text-center">Loading market commodities...</div>
            ) : (
              commodities.slice(0, 4).map((item, idx) => {
                const price = item.adminOverridePriceKsh || item.officialPriceKsh;
                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-[4px] bg-[#E8F4F1] border border-[#CCE5E1] text-xs">
                    <div>
                      <div className="font-semibold text-[#0F3D3C]">{item.commodityName}</div>
                      <div className="text-[10px] font-mono text-[#4A7C79]">
                        {item.adminOverridePriceKsh ? "Admin Override Applied" : "Official KAMIS Feed"}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-[#0F3D3C]">KSh {price.toLocaleString()}</div>
                      <span className="text-[10px] font-bold text-[#278C7B]">
                        {item.unit || "Unit"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Clean Operations Calendar Widget */}
        <div className="bg-white border border-[#CCE5E1] rounded-[6px] p-5 space-y-4 text-left shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#CCE5E1]/60 pb-3">
            <h2 className="text-sm font-serif font-bold text-[#0F3D3C] flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#278C7B]" /> Operations Calendar
            </h2>
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={prevMonth}
                className="p-1 rounded-[4px] bg-[#E8F4F1] hover:bg-[#278C7B] hover:text-white transition text-[#0F3D3C]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-bold text-[#0F3D3C] min-w-[100px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 rounded-[4px] bg-[#E8F4F1] hover:bg-[#278C7B] hover:text-white transition text-[#0F3D3C]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Month Day Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 text-center font-mono text-[10px] text-[#4A7C79] font-bold border-b border-[#CCE5E1]/40 pb-1">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            <div className="grid grid-cols-7 gap-1 font-mono text-xs text-center">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const now = new Date();
                const isToday =
                  now.getFullYear() === year &&
                  now.getMonth() === month &&
                  now.getDate() === dayNum;
                const isSelected = selectedDay === dayNum;

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`h-7 w-full rounded-[4px] flex items-center justify-center font-extrabold text-[11px] transition cursor-pointer ${
                      isToday
                        ? "bg-[#F59E0B] text-[#0A0F0D] font-black shadow-sm ring-1 ring-[#D97706]"
                        : isSelected
                        ? "bg-[#278C7B] text-white shadow-xs"
                        : "hover:bg-[#E8F4F1] text-[#0F3D3C]"
                    }`}
                  >
                    <span>{dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: Platform Live Activities & Audit Feed (Replaces Dispatch Schedule) */}
      <div className="bg-white border border-[#CCE5E1] rounded-[6px] p-5 space-y-4 text-left shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1]/60 pb-3">
          <div>
            <h2 className="text-sm font-serif font-bold text-[#0F3D3C] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#278C7B]" /> Platform Live Activities & Audit Feed
            </h2>
            <p className="text-[11px] text-[#4A7C79]">
              Real-time notifications of orders, farmer purchases, and admin updates across the entire site.
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-[4px] bg-[#E8F4F1] border border-[#CCE5E1] text-[#0F3D3C] hover:text-[#278C7B] font-bold cursor-pointer transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#278C7B] ${loading ? "animate-spin" : ""}`} />
            Refresh Stream
          </button>
        </div>

        {/* Live Activity Items Grid */}
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-xs font-mono text-[#4A7C79] p-4 text-center">
              Loading live platform activity notifications...
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="bg-[#E8F4F1] border border-[#CCE5E1] rounded-[6px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#278C7B] transition"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-1 rounded-[4px] text-white font-mono text-[10px] font-bold shrink-0 shadow-xs ${act.badgeBg || "bg-[#278C7B]"}`}
                  >
                    {act.type}
                  </span>
                  <div>
                    <div className="font-bold text-[#0F3D3C] text-xs sm:text-sm">{act.title}</div>
                    <div className="text-[11px] text-[#4A7C79] font-mono mt-0.5">{act.subtitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[10px]">
                  <span className="text-[#278C7B] font-bold">{act.time}</span>
                  <span className="px-2 py-0.5 rounded-[2px] bg-white border border-[#CCE5E1] text-[#0F3D3C] font-semibold">
                    {act.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
