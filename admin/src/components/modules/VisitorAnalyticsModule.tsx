import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  Globe2,
  Smartphone,
  Laptop,
  Tablet,
  Compass,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Sparkles,
  CloudSun,
  BookOpen,
  MessageSquare,
  ArrowUpRight,
  Filter,
  X,
  Copy,
  Check,
} from "lucide-react";
import { adminFetch } from "../../lib/api";
import { toast } from "sonner";

type DatePreset = "today" | "7d" | "28d" | "30d" | "90d" | "custom";

interface MetricComparison {
  value: number;
  previousValue: number;
  changePercent: number;
}

interface OverviewMetrics {
  activeUsers: MetricComparison;
  totalUsers: MetricComparison;
  newUsers: MetricComparison;
  sessions: MetricComparison;
  screenPageViews: MetricComparison;
  engagedSessions: MetricComparison;
  engagementRate: MetricComparison;
  averageEngagementTimeSeconds: MetricComparison;
  conversions: MetricComparison;
  conversionRate: MetricComparison;
}

interface DailyTrendPoint {
  date: string;
  formattedDate: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
}

interface AcquisitionChannel {
  channel: string;
  sessions: number;
  users: number;
  engagementRate: number;
  conversions: number;
  percentage: number;
}

interface SourceMediumItem {
  sourceMedium: string;
  sessions: number;
  users: number;
}

interface PagePerformanceItem {
  path: string;
  title: string;
  views: number;
  uniqueUsers: number;
  avgDurationSeconds: number;
}

interface GeoItem {
  name: string;
  sessions: number;
  users: number;
}

interface TechItem {
  category: string;
  count: number;
  percentage: number;
}

interface FeatureConversionItem {
  eventName: string;
  count: number;
  users: number;
  category: "authentication" | "marketplace" | "agriculture" | "inquiry" | "general";
}

interface GA4AnalyticsReport {
  isConfigured: boolean;
  propertyId?: string;
  dateRange: {
    preset: DatePreset;
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  overview: OverviewMetrics;
  trends: DailyTrendPoint[];
  channels: AcquisitionChannel[];
  sourceMediums: SourceMediumItem[];
  topPages: PagePerformanceItem[];
  topLandingPages: PagePerformanceItem[];
  countries: GeoItem[];
  cities: GeoItem[];
  devices: TechItem[];
  browsers: TechItem[];
  operatingSystems: TechItem[];
  featureEvents: FeatureConversionItem[];
  lastFetchedAt: string;
  cached: boolean;
}

interface GA4ConfigStatus {
  isConfigured: boolean;
  missingFields: string[];
  propertyId?: string;
  clientEmailConfigured: boolean;
  privateKeyConfigured: boolean;
  serviceAccountFileConfigured: boolean;
  base64KeyConfigured: boolean;
}

export const VisitorAnalyticsModule: React.FC = () => {
  const [preset, setPreset] = useState<DatePreset>("28d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [report, setReport] = useState<GA4AnalyticsReport | null>(null);
  const [configStatus, setConfigStatus] = useState<GA4ConfigStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTrendMetric, setActiveTrendMetric] = useState<"activeUsers" | "sessions" | "pageViews">("activeUsers");
  const [activeTab, setActiveTab] = useState<"overview" | "acquisition" | "pages" | "geo" | "features">("overview");

  const fetchAnalytics = async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set("preset", preset);
      if (preset === "custom" && customStart && customEnd) {
        params.set("startDate", customStart);
        params.set("endDate", customEnd);
      }
      if (forceRefresh) {
        params.set("refresh", "true");
      }

      const res = await adminFetch(`/api/admin/visitor-analytics?${params.toString()}`, {
        bypassCache: forceRefresh,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Administrative permission required. Please verify your role permissions.");
        }
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to load GA4 analytics data");
      }

      setReport(json.report);
      setConfigStatus(json.configStatus);
      if (forceRefresh) {
        toast.success("Analytics metrics refreshed from Google Analytics 4");
      }
    } catch (err: any) {
      console.error("Failed to load visitor analytics:", err);
      setErrorMsg(err.message || "Failed to fetch analytics metrics");
      toast.error(err.message || "Failed to fetch analytics metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(false);
  }, [preset, customStart, customEnd]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatSecondsToTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  // SVG Trend Chart Dimensions & Computations
  const trendChartData = useMemo(() => {
    if (!report || !report.trends || report.trends.length === 0) return null;
    const values = report.trends.map((t) => t[activeTrendMetric]);
    const maxVal = Math.max(...values, 10);
    const minVal = 0;
    const count = report.trends.length;

    const width = 800;
    const height = 220;
    const padX = 40;
    const padY = 24;

    const getX = (idx: number) => padX + (idx / Math.max(1, count - 1)) * (width - 2 * padX);
    const getY = (val: number) => height - padY - (val / maxVal) * (height - 2 * padY);

    const points = report.trends.map((t, idx) => ({
      x: getX(idx),
      y: getY(t[activeTrendMetric]),
      date: t.formattedDate,
      value: t[activeTrendMetric],
    }));

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

    return { width, height, points, pathD, areaD, maxVal, minVal, padX, padY };
  }, [report, activeTrendMetric]);

  return (
    <div className="space-y-6 text-left font-sans">
      {/* 1. HEADER SECTION */}
      <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0F3D3C] text-white flex items-center justify-center font-bold shadow-xs">
              <BarChart3 className="w-5 h-5 text-[#CCE5E1]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#0F3D3C] tracking-tight">
                  Visitor Analytics & GA4 Telemetry
                </h1>
                {report?.isConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F4F1] text-[#278C7B] border border-[#CCE5E1]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#278C7B] animate-pulse" />
                    GA4 Connected
                  </span>
                ) : (
                  <button
                    onClick={() => setShowSetupModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Setup Guide Needed
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Official Google Analytics 4 telemetry, traffic acquisition, engagement duration, and verified conversions.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS (Date Presets & Refresh) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-[#E8F4F1] rounded-xl border border-[#CCE5E1]">
            {(["today", "7d", "28d", "30d", "90d"] as DatePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  preset === p
                    ? "bg-[#0F3D3C] text-white shadow-xs"
                    : "text-[#0F3D3C] hover:bg-white/60"
                }`}
              >
                {p === "today" ? "Today" : p.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => setShowCustomModal(true)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                preset === "custom"
                  ? "bg-[#0F3D3C] text-white shadow-xs"
                  : "text-[#0F3D3C] hover:bg-white/60"
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Custom</span>
            </button>
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing || loading}
            title="Force refresh from Google Analytics 4 Data API"
            className="p-2.5 rounded-xl border border-[#CCE5E1] bg-white text-[#0F3D3C] hover:bg-[#E8F4F1] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#278C7B]" : ""}`} />
          </button>
        </div>
      </div>

      {/* REPORTING PERIOD SUMMARY BANNER */}
      {report && (
        <div className="bg-[#FAF9F6] border border-[#CCE5E1] rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F3D3C]">Reporting Period:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
              {report.dateRange.startDate} → {report.dateRange.endDate}
            </span>
            <span className="text-gray-400 font-medium">vs prior: {report.dateRange.previousStartDate} → {report.dateRange.previousEndDate}</span>
          </div>
          <div className="flex items-center gap-3">
            {report.cached && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Cache Active (5m TTL)
              </span>
            )}
            <span className="text-gray-400">
              Last synced: {new Date(report.lastFetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>
      )}

      {/* UNCONFIGURED SETUP NOTIFICATION */}
      {!report?.isConfigured && !loading && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-amber-950">
                Google Analytics 4 API Credentials Required
              </h2>
              <p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed max-w-3xl">
                The frontend visitor tracking script is initialized and tracking events with consent mode.
                To load live aggregated reports into this admin console, configure your server-side Google Analytics Data API credentials.
                <strong> Note: Mqulima strictly does not fabricate sample metrics or display mock numbers as real visitor data.</strong>
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSetupModal(true)}
              className="px-4 py-2 rounded-xl bg-[#0F3D3C] text-white font-bold text-xs hover:bg-[#165553] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#CCE5E1]" />
              <span>Open 3-Step Setup Assistant</span>
            </button>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Open Google Analytics Console</span>
              <ExternalLink className="w-3 h-3 text-amber-700" />
            </a>
          </div>
        </div>
      )}

      {/* 2. OVERVIEW KPI CARDS */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Users */}
          <div className="bg-white border border-[#CCE5E1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Total Visitors</span>
              <Users className="w-4 h-4 text-[#278C7B]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#0F3D3C]">
              {report.overview.totalUsers.value.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold">
              {report.overview.totalUsers.changePercent >= 0 ? (
                <span className="text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +{report.overview.totalUsers.changePercent}%
                </span>
              ) : (
                <span className="text-rose-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  {report.overview.totalUsers.changePercent}%
                </span>
              )}
              <span className="text-gray-400 font-normal">vs prev period</span>
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-white border border-[#CCE5E1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Total Sessions</span>
              <Compass className="w-4 h-4 text-[#0EA5E9]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#0F3D3C]">
              {report.overview.sessions.value.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold">
              {report.overview.sessions.changePercent >= 0 ? (
                <span className="text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +{report.overview.sessions.changePercent}%
                </span>
              ) : (
                <span className="text-rose-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  {report.overview.sessions.changePercent}%
                </span>
              )}
              <span className="text-gray-400 font-normal">vs prev period</span>
            </div>
          </div>

          {/* Page Views */}
          <div className="bg-white border border-[#CCE5E1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Page Views</span>
              <Eye className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#0F3D3C]">
              {report.overview.screenPageViews.value.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold">
              {report.overview.screenPageViews.changePercent >= 0 ? (
                <span className="text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +{report.overview.screenPageViews.changePercent}%
                </span>
              ) : (
                <span className="text-rose-600 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  {report.overview.screenPageViews.changePercent}%
                </span>
              )}
              <span className="text-gray-400 font-normal">vs prev period</span>
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="bg-white border border-[#CCE5E1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Engagement Rate</span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#0F3D3C]">
              {report.overview.engagementRate.value}%
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              Avg time: <span className="font-bold text-[#0F3D3C]">{formatSecondsToTime(report.overview.averageEngagementTimeSeconds.value)}</span>
            </div>
          </div>

          {/* Key Conversions */}
          <div className="bg-white border border-[#CCE5E1] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Conversions</span>
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#0F3D3C]">
              {report.overview.conversions.value.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              Conv. Rate: <span className="font-bold text-[#10B981]">{report.overview.conversionRate.value}%</span> of sessions
            </div>
          </div>
        </div>
      )}

      {/* 3. VISITOR TRENDS & DAILY CHART */}
      <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#0F3D3C] tracking-tight">
              Visitor & Traffic Volume Trends
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Daily telemetry over time. Hover over data nodes for daily totals.
            </p>
          </div>

          <div className="inline-flex p-1 bg-[#E8F4F1] rounded-xl border border-[#CCE5E1] self-start sm:self-auto">
            <button
              onClick={() => setActiveTrendMetric("activeUsers")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTrendMetric === "activeUsers"
                  ? "bg-[#0F3D3C] text-white"
                  : "text-[#0F3D3C] hover:bg-white/60"
              }`}
            >
              Active Users
            </button>
            <button
              onClick={() => setActiveTrendMetric("sessions")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTrendMetric === "sessions"
                  ? "bg-[#0F3D3C] text-white"
                  : "text-[#0F3D3C] hover:bg-white/60"
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTrendMetric("pageViews")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTrendMetric === "pageViews"
                  ? "bg-[#0F3D3C] text-white"
                  : "text-[#0F3D3C] hover:bg-white/60"
              }`}
            >
              Page Views
            </button>
          </div>
        </div>

        {/* SVG CHART */}
        {trendChartData && trendChartData.points.length > 0 ? (
          <div className="w-full overflow-x-auto pt-2 pb-2">
            <div className="min-w-[650px] relative">
              <svg
                viewBox={`0 0 ${trendChartData.width} ${trendChartData.height}`}
                className="w-full h-56 overflow-visible"
              >
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#278C7B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#278C7B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = trendChartData.height - trendChartData.padY - pct * (trendChartData.height - 2 * trendChartData.padY);
                  const val = Math.round(trendChartData.maxVal * pct);
                  return (
                    <g key={idx}>
                      <line
                        x1={trendChartData.padX}
                        y1={y}
                        x2={trendChartData.width - trendChartData.padX}
                        y2={y}
                        stroke="#CCE5E1"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={trendChartData.padX - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#6B7280"
                        className="font-mono"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Area */}
                <path d={trendChartData.areaD} fill="url(#trendGradient)" />

                {/* Main Stroke Line */}
                <path
                  d={trendChartData.pathD}
                  fill="none"
                  stroke="#278C7B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {trendChartData.points.map((pt, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#FFFFFF"
                      stroke="#0F3D3C"
                      strokeWidth="2.5"
                      className="transition-transform group-hover:scale-150"
                    />
                    {/* Tooltip on hover */}
                    <title>{`${pt.date}: ${pt.value.toLocaleString()} ${activeTrendMetric}`}</title>
                  </g>
                ))}

                {/* X-Axis Dates */}
                {trendChartData.points
                  .filter((_, idx) => idx % Math.ceil(trendChartData.points.length / 8) === 0 || idx === trendChartData.points.length - 1)
                  .map((pt, idx) => (
                    <text
                      key={idx}
                      x={pt.x}
                      y={trendChartData.height - 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#4B5563"
                      fontWeight="bold"
                    >
                      {pt.date}
                    </text>
                  ))}
              </svg>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 text-xs">
            No daily trend data available for the chosen date range.
          </div>
        )}
      </div>

      {/* 4. MODULE TABS (Acquisition, Top Pages, Geo/Devices, Feature Funnels) */}
      <div className="bg-white border border-[#CCE5E1] rounded-2xl shadow-xs overflow-hidden">
        <div className="border-b border-[#CCE5E1] px-6 pt-4 flex flex-wrap gap-2">
          {[
            { id: "overview", label: "Traffic Acquisition Channels", icon: Compass },
            { id: "pages", label: "Page Views & Landing Pages", icon: Eye },
            { id: "geo", label: "Geographic & Devices", icon: Globe2 },
            { id: "features", label: "Agricultural & Domain Events", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? "border-[#278C7B] text-[#0F3D3C]"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-[#278C7B]" : "text-gray-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* TAB 1: ACQUISITION CHANNELS */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-[#0F3D3C]">
                  Session Default Channel Group Breakdown
                </h3>
                <p className="text-xs text-gray-500">
                  Where Mqulima visitors originate (Organic search, Direct traffic, Social referrals, Campaigns).
                </p>
              </div>

              {report?.channels && report.channels.length > 0 ? (
                <div className="space-y-3">
                  {report.channels.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-gray-100 bg-[#FAF9F6] hover:bg-white hover:border-[#CCE5E1] transition-all"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-[#0F3D3C] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#278C7B]" />
                          {ch.channel}
                        </span>
                        <div className="flex items-center gap-4 text-gray-600">
                          <span>{ch.sessions.toLocaleString()} sessions</span>
                          <span className="font-bold text-[#0F3D3C]">{ch.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#278C7B] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, ch.percentage)}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Unique users: {ch.users.toLocaleString()}</span>
                        <span>Engagement rate: {ch.engagementRate}%</span>
                        <span>Conversions: {ch.conversions.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No channel traffic recorded for this period.
                </div>
              )}

              {/* Source / Medium Table */}
              {report?.sourceMediums && report.sourceMediums.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-black text-[#0F3D3C] uppercase tracking-wider mb-3">
                    Top Referring Source / Medium
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="pb-2 font-bold">Source / Medium</th>
                          <th className="pb-2 font-bold text-right">Sessions</th>
                          <th className="pb-2 font-bold text-right">Users</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {report.sourceMediums.map((sm, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-medium text-gray-800 font-mono text-[11px]">
                              {sm.sourceMedium}
                            </td>
                            <td className="py-2.5 text-right font-bold text-[#0F3D3C]">
                              {sm.sessions.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-right text-gray-600">
                              {sm.users.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOP PAGES */}
          {activeTab === "pages" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-[#0F3D3C]">
                  Most-Viewed Pages & Entry Points
                </h3>
                <p className="text-xs text-gray-500">
                  Aggregated views, unique visitors, and average engagement times by URL path.
                </p>
              </div>

              {report?.topPages && report.topPages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="pb-2 font-bold">Page Path & Title</th>
                        <th className="pb-2 font-bold text-right">Views</th>
                        <th className="pb-2 font-bold text-right">Unique Users</th>
                        <th className="pb-2 font-bold text-right">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.topPages.map((pg, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3">
                            <div className="font-bold text-[#0F3D3C] font-mono text-xs">{pg.path}</div>
                            <div className="text-[11px] text-gray-500 truncate max-w-md">{pg.title}</div>
                          </td>
                          <td className="py-3 text-right font-black text-[#0F3D3C]">
                            {pg.views.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-gray-600">
                            {pg.uniqueUsers.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-gray-600 font-mono">
                            {formatSecondsToTime(pg.avgDurationSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No page views recorded for this period.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GEOGRAPHIC & DEVICES */}
          {activeTab === "geo" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Countries */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#0F3D3C] uppercase tracking-wider flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-[#278C7B]" />
                    <span>Top Countries</span>
                  </h4>
                  {report?.countries && report.countries.length > 0 ? (
                    <div className="space-y-2">
                      {report.countries.map((c, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#FAF9F6]">
                          <span className="font-bold text-gray-800">{c.name}</span>
                          <span className="font-mono text-gray-600">{c.sessions.toLocaleString()} sessions</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 py-4 text-center">No country data available.</div>
                  )}
                </div>

                {/* Cities */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-[#0F3D3C] uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#278C7B]" />
                    <span>Top Cities</span>
                  </h4>
                  {report?.cities && report.cities.length > 0 ? (
                    <div className="space-y-2">
                      {report.cities.map((city, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#FAF9F6]">
                          <span className="font-bold text-gray-800">{city.name}</span>
                          <span className="font-mono text-gray-600">{city.sessions.toLocaleString()} sessions</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 py-4 text-center">No city data available.</div>
                  )}
                </div>
              </div>

              {/* Tech Breakdown */}
              <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Devices */}
                <div className="p-4 rounded-xl border border-gray-100 bg-[#FAF9F6] space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-[#0F3D3C]" />
                    <span>Device Categories</span>
                  </div>
                  {report?.devices && report.devices.length > 0 ? (
                    report.devices.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="capitalize text-gray-700">{d.category}</span>
                        <span className="font-bold text-[#0F3D3C]">{d.percentage}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400">Data unavailable</div>
                  )}
                </div>

                {/* Operating Systems */}
                <div className="p-4 rounded-xl border border-gray-100 bg-[#FAF9F6] space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Laptop className="w-3.5 h-3.5 text-[#0F3D3C]" />
                    <span>Operating Systems</span>
                  </div>
                  {report?.operatingSystems && report.operatingSystems.length > 0 ? (
                    report.operatingSystems.map((os, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{os.category}</span>
                        <span className="font-bold text-[#0F3D3C]">{os.percentage}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400">Data unavailable</div>
                  )}
                </div>

                {/* Browsers */}
                <div className="p-4 rounded-xl border border-gray-100 bg-[#FAF9F6] space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-[#0F3D3C]" />
                    <span>Browsers</span>
                  </div>
                  {report?.browsers && report.browsers.length > 0 ? (
                    report.browsers.map((b, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{b.category}</span>
                        <span className="font-bold text-[#0F3D3C]">{b.percentage}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400">Data unavailable</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEATURE & DOMAIN EVENTS */}
          {activeTab === "features" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-[#0F3D3C]">
                  Domain Feature Engagements & Verified Conversions
                </h3>
                <p className="text-xs text-gray-500">
                  Custom typed events emitted by Mqulima users (weather radars, AI crop doctor, cart additions, checkouts, and bookings).
                </p>
              </div>

              {report?.featureEvents && report.featureEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="pb-2 font-bold">Event Name</th>
                        <th className="pb-2 font-bold">Category</th>
                        <th className="pb-2 font-bold text-right">Event Count</th>
                        <th className="pb-2 font-bold text-right">Total Users</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.featureEvents.map((ev, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="py-3">
                            <span className="font-mono font-bold text-[#0F3D3C] bg-[#E8F4F1] px-2 py-0.5 rounded text-[11px]">
                              {ev.eventName}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="capitalize text-gray-600 text-xs">
                              {ev.category}
                            </span>
                          </td>
                          <td className="py-3 text-right font-black text-[#0F3D3C]">
                            {ev.count.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-gray-600">
                            {ev.users.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No custom domain events recorded in GA4 for this period yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. SESSION REPLAY & PRIVACY GOVERNANCE CARD */}
      <div className="bg-white border border-[#CCE5E1] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#278C7B]" />
            <h3 className="text-sm font-black text-[#0F3D3C]">
              Privacy Protection & Optional Session Replay (Microsoft Clarity)
            </h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
            Google Analytics 4 provides aggregate telemetry and does not store individual session screen recordings.
            For behavioral clickmaps, Microsoft Clarity is supported as an optional tool governed strictly by visitor consent mode.
            Sensitive passwords, payment pins, and phone numbers are scrubbed client-side.
          </p>
        </div>

        <a
          href="https://clarity.microsoft.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-[#E8F4F1] text-[#0F3D3C] font-bold text-xs hover:bg-[#d6ebe6] transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>Clarity Console</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#278C7B]" />
        </a>
      </div>

      {/* CUSTOM DATE RANGE MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#CCE5E1] p-6 max-w-md w-full shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#0F3D3C]">Select Custom Date Range</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#278C7B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#278C7B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!customStart || !customEnd) {
                    toast.error("Please pick both start and end dates");
                    return;
                  }
                  if (customStart > customEnd) {
                    toast.error("Start date must be before end date");
                    return;
                  }
                  setPreset("custom");
                  setShowCustomModal(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-[#0F3D3C] text-white rounded-xl hover:bg-[#165553] cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETUP ASSISTANT MODAL */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#CCE5E1] p-6 max-w-xl w-full shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F3D3C] text-white flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 text-[#CCE5E1]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0F3D3C]">Google Analytics 4 Setup Assistant</h3>
                  <p className="text-xs text-gray-500">Production-ready connection guide for Mqulima</p>
                </div>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-gray-200 space-y-2">
                <div className="font-black text-[#0F3D3C] flex items-center justify-between">
                  <span>Step 1: Obtain GA4 Property ID</span>
                  <span className="text-[10px] bg-[#E8F4F1] text-[#278C7B] px-2 py-0.5 rounded font-bold">Numeric ID</span>
                </div>
                <p>
                  In Google Analytics Admin, go to <strong>Property Settings &gt; Property Details</strong>.
                  Find your numeric <strong>Property ID</strong> (e.g. <code>429817263</code>).
                </p>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 font-mono text-[11px]">
                  <span>GA4_PROPERTY_ID=your_numeric_property_id</span>
                  <button
                    onClick={() => handleCopy("GA4_PROPERTY_ID=", "step1")}
                    className="text-[#278C7B] hover:text-[#0F3D3C] cursor-pointer"
                  >
                    {copiedKey === "step1" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-gray-200 space-y-2">
                <div className="font-black text-[#0F3D3C] flex items-center justify-between">
                  <span>Step 2: Google Cloud Service Account</span>
                  <span className="text-[10px] bg-[#E8F4F1] text-[#278C7B] px-2 py-0.5 rounded font-bold">Data API</span>
                </div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>In Google Cloud Console, enable the <strong>Google Analytics Data API</strong>.</li>
                  <li>Create a Service Account with role <strong>Viewer</strong>.</li>
                  <li>In Google Analytics Admin &gt; Property Access Management, add the Service Account email with <strong>Viewer</strong> permissions.</li>
                  <li>Create and download a JSON service account key.</li>
                </ol>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-gray-200 space-y-2">
                <div className="font-black text-[#0F3D3C] flex items-center justify-between">
                  <span>Step 3: Configure Environment Variables</span>
                  <span className="text-[10px] bg-[#E8F4F1] text-[#278C7B] px-2 py-0.5 rounded font-bold">Vercel & .env</span>
                </div>
                <p>Add the credentials to your Vercel Project Environment Variables:</p>
                <div className="bg-gray-900 text-gray-200 p-3 rounded-lg font-mono text-[11px] space-y-1">
                  <div>VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX</div>
                  <div>GA4_PROPERTY_ID=123456789</div>
                  <div>GOOGLE_SERVICE_ACCOUNT_EMAIL=sa@project.iam.gserviceaccount.com</div>
                  <div>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#0F3D3C] text-white text-xs font-bold hover:bg-[#165553] cursor-pointer"
              >
                Close Assistant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
