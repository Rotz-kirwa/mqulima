import React, { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, CheckCircle, MapPin, Database, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { adminFetch } from "../../lib/api";

export const CommodityTrendsModule: React.FC = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchTrends = (forceSync = false) => {
    setLoading(true);
    const endpoint = forceSync ? "/api/admin/commodity-trends?sync=true" : "/api/admin/commodity-trends";
    adminFetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTrends(data.trends || []);
          setSyncedAt(data.syncedAt ? new Date(data.syncedAt).toLocaleTimeString() : new Date().toLocaleTimeString());
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading KEMIS trends:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handleLiveKamisSync = async () => {
    try {
      setSyncing(true);
      const res = await adminFetch("/api/admin/commodity-trends", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`Live KEMIS Feed Synced: ${data.updatedCount || "All"} regional market prices updated!`);
        setTimeout(() => setSyncMessage(null), 4000);
      }
      fetchTrends(true);
    } catch (err) {
      console.error("KEMIS sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-[#0F3D3C] uppercase tracking-wider">
              <Database className="w-3 h-3 text-[#278C7B]" /> Live KEMIS / KAMIS Feed
            </span>
            {syncedAt && (
              <span className="text-[10px] text-gray-500 font-mono">
                Synced at {syncedAt}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C]">
            Historical Commodity Price Trends
          </h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Real-time market price trends & regional hub benchmarks fetched directly from the Kenya Agricultural Market Information System (KEMIS / KAMIS).
          </p>
        </div>

        <button
          onClick={handleLiveKamisSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#278C7B] hover:bg-[#1D6F61] text-white text-xs font-bold font-mono transition-all shadow-sm cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Syncing KEMIS..." : "Trigger KEMIS Live Sync"}</span>
        </button>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Main Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="p-12 text-center text-[#4A7C79] font-mono text-xs col-span-2 bg-white border border-[#CCE5E1] rounded-lg">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#278C7B]" />
            Fetching live KEMIS price feed across Kenyan hubs...
          </div>
        ) : trends.length === 0 ? (
          <div className="p-12 text-center text-[#4A7C79] font-mono text-xs col-span-2 bg-white border border-[#CCE5E1] rounded-lg">
            No live commodity data found. Click "Trigger KEMIS Live Sync" to populate live market prices.
          </div>
        ) : (
          trends.map((t, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#CCE5E1] rounded-lg p-5 space-y-4 shadow-xs hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-[#CCE5E1]/60 pb-3">
                <div>
                  <h2 className="text-base font-serif font-bold text-[#0F3D3C]">
                    {t.commodity}
                  </h2>
                  <span className="text-[10px] text-[#2C5E5B] block mt-0.5">
                    Unit: {t.unit} &middot; {t.source}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#0F3D3C] block">
                    KSh {t.currentPrice?.toLocaleString()}
                  </span>
                  <div className={`inline-flex items-center gap-0.5 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded mt-0.5 ${
                    t.changePercent >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {t.changePercent >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-rose-600" />
                    )}
                    <span>{t.changePercent >= 0 ? `+${t.changePercent}%` : `${t.changePercent}%`}</span>
                  </div>
                </div>
              </div>

              {/* 5-Month Trajectory Bar Graph */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#278C7B] uppercase font-bold mb-2">
                  <span>5-Month Trajectory</span>
                  <span>Range: KSh {t.minPrice} - KSh {t.maxPrice}</span>
                </div>

                <div className="h-36 w-full flex items-end justify-between gap-3 pt-4 font-mono text-xs bg-[#FAFDFD] p-3 rounded border border-[#CCE5E1]/40">
                  {t.history?.map((h: any, hIdx: number) => {
                    const heightPercent = t.maxPrice > 0
                      ? Math.min(100, Math.max(18, Math.round((h.price / t.maxPrice) * 100)))
                      : 40;
                    return (
                      <div key={hIdx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[9px] text-[#0F3D3C] font-bold">
                          {h.price}
                        </span>
                        <div
                          className="w-full bg-[#4AC4AF] hover:bg-[#278C7B] rounded-xs transition-all cursor-pointer relative group"
                          style={{ height: `${heightPercent}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#0F3D3C] text-white text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap pointer-events-none z-10">
                            KSh {h.price} ({h.month})
                          </div>
                        </div>
                        <span className="text-[10px] text-[#4A7C79] font-bold">{h.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Regional Hub Breakdown */}
              {Array.isArray(t.regions) && t.regions.length > 0 && (
                <div className="pt-2 border-t border-[#CCE5E1]/50 space-y-1.5 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#2C5E5B] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#278C7B]" /> Regional Hub Live Rates
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {t.regions.slice(0, 4).map((rg: any, rIdx: number) => (
                      <div key={rIdx} className="flex items-center justify-between bg-emerald-50/40 px-2 py-1 rounded text-[11px] font-mono border border-emerald-100">
                        <span className="text-[#0F3D3C] font-semibold truncate max-w-[110px]">{rg.region}</span>
                        <span className="font-bold text-[#278C7B] shrink-0">KSh {rg.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
