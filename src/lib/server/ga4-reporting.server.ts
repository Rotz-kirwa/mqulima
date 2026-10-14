import type { BetaAnalyticsDataClient } from "@google-analytics/data";
import { getServerConfig } from "@/lib/config.server";

export type DateRangePreset = "today" | "7d" | "28d" | "30d" | "90d" | "custom";

export interface DateRangeQuery {
  preset: DateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface MetricComparison {
  value: number;
  previousValue: number;
  changePercent: number; // e.g. +14.5 or -5.2
}

export interface OverviewMetrics {
  activeUsers: MetricComparison;
  totalUsers: MetricComparison;
  newUsers: MetricComparison;
  sessions: MetricComparison;
  screenPageViews: MetricComparison;
  engagedSessions: MetricComparison;
  engagementRate: MetricComparison; // percentage (0 - 100)
  averageEngagementTimeSeconds: MetricComparison;
  conversions: MetricComparison;
  conversionRate: MetricComparison; // conversions / sessions %
}

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD
  formattedDate: string; // "Oct 12"
  activeUsers: number;
  sessions: number;
  pageViews: number;
}

export interface AcquisitionChannel {
  channel: string;
  sessions: number;
  users: number;
  engagementRate: number;
  conversions: number;
  percentage: number;
}

export interface SourceMediumItem {
  sourceMedium: string;
  sessions: number;
  users: number;
}

export interface PagePerformanceItem {
  path: string;
  title: string;
  views: number;
  uniqueUsers: number;
  avgDurationSeconds: number;
}

export interface GeoItem {
  name: string; // country or city
  sessions: number;
  users: number;
}

export interface TechItem {
  category: string; // Device or OS or Browser
  count: number;
  percentage: number;
}

export interface FeatureConversionItem {
  eventName: string;
  count: number;
  users: number;
  category: "authentication" | "marketplace" | "agriculture" | "inquiry" | "general";
}

export interface GA4AnalyticsReport {
  isConfigured: boolean;
  propertyId?: string;
  dateRange: {
    preset: DateRangePreset;
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
  quota?: {
    tokensConsumed?: number;
    tokensRemaining?: number;
  };
}

export interface GA4ConfigStatus {
  isConfigured: boolean;
  missingFields: string[];
  propertyId?: string;
  clientEmailConfigured: boolean;
  privateKeyConfigured: boolean;
  serviceAccountFileConfigured: boolean;
  base64KeyConfigured: boolean;
}

// In-memory cache with 5-minute TTL to respect GA4 Data API quotas
interface CacheEntry {
  timestamp: number;
  data: GA4AnalyticsReport;
}

const reportCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Determine Google Credentials configuration status
 */
export function getGA4ConfigStatus(): GA4ConfigStatus {
  const config = getServerConfig();
  const propertyId = config.GA4_PROPERTY_ID || process.env.GA4_PROPERTY_ID || "";
  const clientEmail = config.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
  const privateKey = config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
  const credsFile = config.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
  const base64Key = config.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 || "";

  const missing: string[] = [];
  if (!propertyId) missing.push("GA4_PROPERTY_ID");

  const hasKey = Boolean(credsFile || (clientEmail && privateKey) || base64Key);
  if (!hasKey) {
    missing.push("Google Cloud Service Account Credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS)");
  }

  return {
    isConfigured: missing.length === 0,
    missingFields: missing,
    propertyId: propertyId || undefined,
    clientEmailConfigured: Boolean(clientEmail),
    privateKeyConfigured: Boolean(privateKey),
    serviceAccountFileConfigured: Boolean(credsFile),
    base64KeyConfigured: Boolean(base64Key),
  };
}

/**
 * Initialize the official GA4 Data API Client
 */
async function createAnalyticsClient(): Promise<BetaAnalyticsDataClient | null> {
  const status = getGA4ConfigStatus();
  if (!status.isConfigured) return null;

  const config = getServerConfig();
  const credsFile = config.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const base64Key = config.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  const clientEmail = config.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  try {
    const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
    if (base64Key) {
      const decoded = Buffer.from(base64Key, "base64").toString("utf-8");
      const credentials = JSON.parse(decoded);
      return new BetaAnalyticsDataClient({ credentials });
    }

    if (clientEmail && privateKey) {
      // Fix escaped newlines in env variables
      if (privateKey.includes("\\n")) {
        privateKey = privateKey.replace(/\\n/g, "\n");
      }
      return new BetaAnalyticsDataClient({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
      });
    }

    if (credsFile) {
      return new BetaAnalyticsDataClient({ keyFilename: credsFile });
    }

    // Fall back to default application credentials if running in GCP
    return new BetaAnalyticsDataClient();
  } catch (err) {
    console.error("[GA4 Reporting Service] Failed to initialize BetaAnalyticsDataClient:", err);
    return null;
  }
}

/**
 * Calculate date ranges for primary and comparison periods
 */
function resolveDateRanges(query: DateRangeQuery): {
  startDate: string;
  endDate: string;
  prevStartDate: string;
  prevEndDate: string;
} {
  const now = new Date();
  const toIsoDate = (d: Date) => d.toISOString().split("T")[0];

  const preset = query.preset || "28d";

  if (preset === "custom" && query.startDate && query.endDate) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const prevStart = new Date(prevEnd.getTime() - diffDays * 24 * 60 * 60 * 1000);

    return {
      startDate: query.startDate,
      endDate: query.endDate,
      prevStartDate: toIsoDate(prevStart),
      prevEndDate: toIsoDate(prevEnd),
    };
  }

  let days = 28;
  if (preset === "today") days = 0;
  else if (preset === "7d") days = 7;
  else if (preset === "28d") days = 28;
  else if (preset === "30d") days = 30;
  else if (preset === "90d") days = 90;

  if (days === 0) {
    // Today
    const todayStr = toIsoDate(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = toIsoDate(yesterday);
    return {
      startDate: todayStr,
      endDate: todayStr,
      prevStartDate: yesterdayStr,
      prevEndDate: yesterdayStr,
    };
  }

  const end = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday (complete data)
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
    prevStartDate: toIsoDate(prevStart),
    prevEndDate: toIsoDate(prevEnd),
  };
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10;
}

/**
 * Fetch a full production GA4 Analytics report
 */
export async function fetchGA4AnalyticsReport(
  query: DateRangeQuery,
  forceRefresh: boolean = false
): Promise<GA4AnalyticsReport> {
  const configStatus = getGA4ConfigStatus();
  const ranges = resolveDateRanges(query);
  const cacheKey = `${query.preset}_${ranges.startDate}_${ranges.endDate}`;

  // Check cache
  if (!forceRefresh) {
    const cached = reportCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { ...cached.data, cached: true };
    }
  }

  // If not configured, return zeroed report with setup guide metadata (never crash or fake data)
  if (!configStatus.isConfigured || !configStatus.propertyId) {
    return createUnconfiguredReport(query, ranges);
  }

  const client = await createAnalyticsClient();
  if (!client) {
    return createUnconfiguredReport(query, ranges);
  }

  const property = `properties/${configStatus.propertyId.replace(/^properties\//, "")}`;

  try {
    // 1. Run Core Overview & Comparison Report
    const [overviewResponse] = await client.runReport({
      property,
      dateRanges: [
        { startDate: ranges.startDate, endDate: ranges.endDate },
        { startDate: ranges.prevStartDate, endDate: ranges.prevEndDate },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
        { name: "userEngagementDuration" },
        { name: "conversions" },
      ],
    });

    // 2. Run Daily Trends Report
    const [trendsResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    });

    // 3. Run Acquisition Channels Report
    const [channelsResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "engagementRate" },
        { name: "conversions" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });

    // 4. Run Source/Medium Report
    const [sourceMediumResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });

    // 5. Run Top Pages Report
    const [pagesResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "userEngagementDuration" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    });

    // 6. Run Top Landing Pages Report
    const [landingPagesResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "conversions" },
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });

    // 7. Run Geographic Breakdown (Countries & Cities)
    const [countriesResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });

    const [citiesResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "city" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });

    // 8. Run Tech Breakdown (Devices, Browsers, OS)
    const [devicesResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });

    const [browsersResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "browser" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 6,
    });

    const [osResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "operatingSystem" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 6,
    });

    // 9. Run Custom Feature & Conversion Events Report
    const [eventsResponse] = await client.runReport({
      property,
      dateRanges: [{ startDate: ranges.startDate, endDate: ranges.endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 30,
    });

    // Parse Overview & Comparisons
    const currentRows = overviewResponse.rows?.[0]?.metricValues || [];
    const prevRows = overviewResponse.rows?.[1]?.metricValues || [];

    const getMetricVal = (rows: any[], index: number) => Number(rows[index]?.value || 0);

    const activeUsersCur = getMetricVal(currentRows, 0);
    const activeUsersPrev = getMetricVal(prevRows, 0);

    const totalUsersCur = getMetricVal(currentRows, 1);
    const totalUsersPrev = getMetricVal(prevRows, 1);

    const newUsersCur = getMetricVal(currentRows, 2);
    const newUsersPrev = getMetricVal(prevRows, 2);

    const sessionsCur = getMetricVal(currentRows, 3);
    const sessionsPrev = getMetricVal(prevRows, 3);

    const pageViewsCur = getMetricVal(currentRows, 4);
    const pageViewsPrev = getMetricVal(prevRows, 4);

    const engagedSessionsCur = getMetricVal(currentRows, 5);
    const engagedSessionsPrev = getMetricVal(prevRows, 5);

    const engagementRateCur = Math.round(getMetricVal(currentRows, 6) * 1000) / 10;
    const engagementRatePrev = Math.round(getMetricVal(prevRows, 6) * 1000) / 10;

    const avgDurationCur = sessionsCur > 0 ? Math.round(getMetricVal(currentRows, 7) / sessionsCur) : 0;
    const avgDurationPrev = sessionsPrev > 0 ? Math.round(getMetricVal(prevRows, 7) / sessionsPrev) : 0;

    const conversionsCur = getMetricVal(currentRows, 8);
    const conversionsPrev = getMetricVal(prevRows, 8);

    const conversionRateCur = sessionsCur > 0 ? Math.round((conversionsCur / sessionsCur) * 1000) / 10 : 0;
    const conversionRatePrev = sessionsPrev > 0 ? Math.round((conversionsPrev / sessionsPrev) * 1000) / 10 : 0;

    const overview: OverviewMetrics = {
      activeUsers: {
        value: activeUsersCur,
        previousValue: activeUsersPrev,
        changePercent: calculatePercentChange(activeUsersCur, activeUsersPrev),
      },
      totalUsers: {
        value: totalUsersCur,
        previousValue: totalUsersPrev,
        changePercent: calculatePercentChange(totalUsersCur, totalUsersPrev),
      },
      newUsers: {
        value: newUsersCur,
        previousValue: newUsersPrev,
        changePercent: calculatePercentChange(newUsersCur, newUsersPrev),
      },
      sessions: {
        value: sessionsCur,
        previousValue: sessionsPrev,
        changePercent: calculatePercentChange(sessionsCur, sessionsPrev),
      },
      screenPageViews: {
        value: pageViewsCur,
        previousValue: pageViewsPrev,
        changePercent: calculatePercentChange(pageViewsCur, pageViewsPrev),
      },
      engagedSessions: {
        value: engagedSessionsCur,
        previousValue: engagedSessionsPrev,
        changePercent: calculatePercentChange(engagedSessionsCur, engagedSessionsPrev),
      },
      engagementRate: {
        value: engagementRateCur,
        previousValue: engagementRatePrev,
        changePercent: calculatePercentChange(engagementRateCur, engagementRatePrev),
      },
      averageEngagementTimeSeconds: {
        value: avgDurationCur,
        previousValue: avgDurationPrev,
        changePercent: calculatePercentChange(avgDurationCur, avgDurationPrev),
      },
      conversions: {
        value: conversionsCur,
        previousValue: conversionsPrev,
        changePercent: calculatePercentChange(conversionsCur, conversionsPrev),
      },
      conversionRate: {
        value: conversionRateCur,
        previousValue: conversionRatePrev,
        changePercent: calculatePercentChange(conversionRateCur, conversionRatePrev),
      },
    };

    // Parse Daily Trends
    const trends: DailyTrendPoint[] = (trendsResponse.rows || []).map((row) => {
      const rawDate = row.dimensionValues?.[0]?.value || "";
      const year = rawDate.slice(0, 4);
      const month = rawDate.slice(4, 6);
      const day = rawDate.slice(6, 8);
      const iso = `${year}-${month}-${day}`;
      const d = new Date(iso);
      const formattedDate = !isNaN(d.getTime())
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : rawDate;

      return {
        date: iso,
        formattedDate,
        activeUsers: Number(row.metricValues?.[0]?.value || 0),
        sessions: Number(row.metricValues?.[1]?.value || 0),
        pageViews: Number(row.metricValues?.[2]?.value || 0),
      };
    });

    // Parse Acquisition Channels
    const totalChannelSessions = (channelsResponse.rows || []).reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0),
      0
    );

    const channels: AcquisitionChannel[] = (channelsResponse.rows || []).map((row) => {
      const sess = Number(row.metricValues?.[0]?.value || 0);
      return {
        channel: row.dimensionValues?.[0]?.value || "Unassigned",
        sessions: sess,
        users: Number(row.metricValues?.[1]?.value || 0),
        engagementRate: Math.round(Number(row.metricValues?.[2]?.value || 0) * 1000) / 10,
        conversions: Number(row.metricValues?.[3]?.value || 0),
        percentage: totalChannelSessions > 0 ? Math.round((sess / totalChannelSessions) * 1000) / 10 : 0,
      };
    });

    // Parse Source Mediums
    const sourceMediums: SourceMediumItem[] = (sourceMediumResponse.rows || []).map((row) => ({
      sourceMedium: row.dimensionValues?.[0]?.value || "(direct) / (none)",
      sessions: Number(row.metricValues?.[0]?.value || 0),
      users: Number(row.metricValues?.[1]?.value || 0),
    }));

    // Parse Top Pages
    const topPages: PagePerformanceItem[] = (pagesResponse.rows || []).map((row) => {
      const views = Number(row.metricValues?.[0]?.value || 0);
      const totalDur = Number(row.metricValues?.[2]?.value || 0);
      return {
        path: row.dimensionValues?.[0]?.value || "/",
        title: row.dimensionValues?.[1]?.value || "Untitled",
        views,
        uniqueUsers: Number(row.metricValues?.[1]?.value || 0),
        avgDurationSeconds: views > 0 ? Math.round(totalDur / views) : 0,
      };
    });

    // Parse Top Landing Pages
    const topLandingPages: PagePerformanceItem[] = (landingPagesResponse.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "/",
      title: row.dimensionValues?.[0]?.value || "/",
      views: Number(row.metricValues?.[0]?.value || 0),
      uniqueUsers: Number(row.metricValues?.[1]?.value || 0),
      avgDurationSeconds: 0,
    }));

    // Parse Countries & Cities
    const countries: GeoItem[] = (countriesResponse.rows || []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || "(not set)",
      sessions: Number(row.metricValues?.[0]?.value || 0),
      users: Number(row.metricValues?.[1]?.value || 0),
    }));

    const cities: GeoItem[] = (citiesResponse.rows || []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || "(not set)",
      sessions: Number(row.metricValues?.[0]?.value || 0),
      users: Number(row.metricValues?.[1]?.value || 0),
    }));

    // Parse Devices, Browsers, OS
    const parseTechList = (rows: any[] | undefined | null): TechItem[] => {
      const total = (rows || []).reduce((sum, r) => sum + Number(r.metricValues?.[0]?.value || 0), 0);
      return (rows || []).map((r) => {
        const count = Number(r.metricValues?.[0]?.value || 0);
        return {
          category: r.dimensionValues?.[0]?.value || "Unknown",
          count,
          percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        };
      });
    };

    const devices = parseTechList(devicesResponse.rows);
    const browsers = parseTechList(browsersResponse.rows);
    const operatingSystems = parseTechList(osResponse.rows);

    // Parse Custom Feature Events
    const featureEvents: FeatureConversionItem[] = (eventsResponse.rows || []).map((row) => {
      const name = row.dimensionValues?.[0]?.value || "unknown";
      let category: FeatureConversionItem["category"] = "general";

      if (name.includes("login") || name.includes("sign_up") || name.includes("password")) {
        category = "authentication";
      } else if (name.includes("cart") || name.includes("purchase") || name.includes("product") || name.includes("shop") || name.includes("checkout")) {
        category = "marketplace";
      } else if (name.includes("weather") || name.includes("market_price") || name.includes("agricultural") || name.includes("academy") || name.includes("community") || name.includes("ai_assistant")) {
        category = "agriculture";
      } else if (name.includes("contact") || name.includes("quotation")) {
        category = "inquiry";
      }

      return {
        eventName: name,
        count: Number(row.metricValues?.[0]?.value || 0),
        users: Number(row.metricValues?.[1]?.value || 0),
        category,
      };
    });

    const report: GA4AnalyticsReport = {
      isConfigured: true,
      propertyId: configStatus.propertyId,
      dateRange: {
        preset: query.preset,
        startDate: ranges.startDate,
        endDate: ranges.endDate,
        previousStartDate: ranges.prevStartDate,
        previousEndDate: ranges.prevEndDate,
      },
      overview,
      trends,
      channels,
      sourceMediums,
      topPages,
      topLandingPages,
      countries,
      cities,
      devices,
      browsers,
      operatingSystems,
      featureEvents,
      lastFetchedAt: new Date().toISOString(),
      cached: false,
    };

    // Save to cache
    reportCache.set(cacheKey, { timestamp: Date.now(), data: report });

    return report;
  } catch (error: any) {
    console.error("[GA4 Reporting Service] Error querying Google Analytics Data API:", error);
    // If permission or quota or invalid property ID, return unconfigured structure with error notice
    const unconfigured = createUnconfiguredReport(query, ranges);
    return {
      ...unconfigured,
      isConfigured: false,
    };
  }
}

/**
 * Empty response when GA4 is not configured
 * Explicitly documents that data is not fabricated
 */
function createUnconfiguredReport(
  query: DateRangeQuery,
  ranges: ReturnType<typeof resolveDateRanges>
): GA4AnalyticsReport {
  const zeroMetric: MetricComparison = { value: 0, previousValue: 0, changePercent: 0 };

  return {
    isConfigured: false,
    propertyId: undefined,
    dateRange: {
      preset: query.preset,
      startDate: ranges.startDate,
      endDate: ranges.endDate,
      previousStartDate: ranges.prevStartDate,
      previousEndDate: ranges.prevEndDate,
    },
    overview: {
      activeUsers: zeroMetric,
      totalUsers: zeroMetric,
      newUsers: zeroMetric,
      sessions: zeroMetric,
      screenPageViews: zeroMetric,
      engagedSessions: zeroMetric,
      engagementRate: zeroMetric,
      averageEngagementTimeSeconds: zeroMetric,
      conversions: zeroMetric,
      conversionRate: zeroMetric,
    },
    trends: [],
    channels: [],
    sourceMediums: [],
    topPages: [],
    topLandingPages: [],
    countries: [],
    cities: [],
    devices: [],
    browsers: [],
    operatingSystems: [],
    featureEvents: [],
    lastFetchedAt: new Date().toISOString(),
    cached: false,
  };
}
