import React, { useState, useEffect } from "react";
import { TrendingUp, Edit2, Check, X, Search, RefreshCw, Database } from "lucide-react";
import { adminFetch } from "../../lib/api";

export const MarketPricesModule: React.FC = () => {
  const [commodities, setCommodities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [overridePrice, setOverridePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchPrices = () => {
    setLoading(true);
    adminFetch("/api/admin/market-prices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCommodities(data.commodities || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const res = await adminFetch("/api/admin/commodity-trends", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("KAMIS market feed successfully re-synchronized with PostgreSQL.");
        setTimeout(() => setStatusMessage(null), 4000);
      }
      fetchPrices();
    } catch (err) {
      console.error("KAMIS Sync Error:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveOverride = async (customOverrideVal?: number | null) => {
    if (!editingItem) return;
    const finalVal = customOverrideVal !== undefined
      ? customOverrideVal
      : overridePrice ? parseFloat(overridePrice) : null;

    try {
      const res = await adminFetch("/api/admin/market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          commodityName: editingItem.commodityName,
          officialPriceKsh: editingItem.officialPriceKsh,
          adminOverridePriceKsh: finalVal,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        setOverridePrice("");
        setNotes("");
        setStatusMessage(`Updated price benchmark override for ${editingItem.commodityName}.`);
        setTimeout(() => setStatusMessage(null), 4000);
        fetchPrices();
      }
    } catch (e) {
      console.error("Save price override error:", e);
    }
  };

  const filteredCommodities = commodities.filter((c) =>
    c.commodityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.unit?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-[#0F3D3C] uppercase tracking-wider">
              <Database className="w-3 h-3 text-[#278C7B]" /> Official KAMIS Price Board
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {commodities.length} Commodities Tracked
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C]">Market Benchmark Prices (KAMIS)</h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Monitor official Ministry of Agriculture (KAMIS) market pricing standards across Kenyan trading hubs and configure admin overrides.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#278C7B] hover:bg-[#1D6F61] text-white text-xs font-bold font-mono transition shadow-xs cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Syncing KAMIS..." : "Trigger Live KAMIS Sync"}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Toolbar Search */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 border border-[#CCE5E1] rounded-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#4A7C79] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search commodity name or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAFDFD] border border-[#CCE5E1] rounded-md text-xs font-mono text-[#0F3D3C] outline-none focus:border-[#278C7B]"
          />
        </div>
        <div className="text-xs font-mono text-[#2C5E5B]">
          Showing {filteredCommodities.length} of {commodities.length} items
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#CCE5E1] rounded-[6px] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
            <tr>
              <th className="p-3">Commodity</th>
              <th className="p-3">Unit Standard</th>
              <th className="p-3">KAMIS Benchmark Price</th>
              <th className="p-3">Admin Override Price</th>
              <th className="p-3">Effective Display Price</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[#4A7C79] font-mono">
                  Loading live KAMIS market benchmark prices...
                </td>
              </tr>
            ) : filteredCommodities.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[#4A7C79] font-mono">
                  No matching commodities found.
                </td>
              </tr>
            ) : (
              filteredCommodities.map((item) => {
                const effective = item.adminOverridePriceKsh || item.officialPriceKsh;
                const hasOverride = item.adminOverridePriceKsh !== null && item.adminOverridePriceKsh !== undefined;
                return (
                  <tr key={item.id} className="hover:bg-[#E8F4F1]/50 transition">
                    <td className="p-3 font-semibold text-[#0F3D3C]">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-[#278C7B]" />
                        <span>{item.commodityName}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[#4A7C79]">{item.unit || "90kg Bag"}</td>
                    <td className="p-3 font-mono text-[#0F3D3C]">
                      KSh {item.officialPriceKsh?.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono">
                      {hasOverride ? (
                        <span className="inline-flex items-center gap-1 text-[#278C7B] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          KSh {item.adminOverridePriceKsh?.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[#4A7C79]">—</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#0F3D3C]">
                      KSh {effective?.toLocaleString()}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {hasOverride && (
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            handleSaveOverride(null);
                          }}
                          title="Reset to official KAMIS benchmark price"
                          className="px-2 py-1 text-xs bg-rose-50 text-rose-700 font-bold border border-rose-200 rounded-[4px] hover:bg-rose-100 cursor-pointer inline-flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Reset
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setOverridePrice(item.adminOverridePriceKsh?.toString() || "");
                          setNotes(item.notes || "");
                        }}
                        className="px-2.5 py-1 text-xs bg-[#278C7B] text-white font-bold rounded-[4px] hover:bg-[#1E6B5E] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Edit2 className="h-3 w-3" /> {hasOverride ? "Edit Override" : "Set Override"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white border border-[#CCE5E1] rounded-[6px] p-6 max-w-md w-full text-left space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#CCE5E1] pb-3">
              <h2 className="text-base font-serif font-bold text-[#0F3D3C]">
                Price Override: {editingItem.commodityName}
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#E8F4F1] rounded text-xs font-mono text-[#0F3D3C]">
              <span>Official KAMIS Benchmark: </span>
              <strong>KSh {editingItem.officialPriceKsh?.toLocaleString()}</strong> ({editingItem.unit || "90kg Bag"})
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#4A7C79] text-[10px] uppercase font-bold mb-1">
                  Override Price (KSh)
                </label>
                <input
                  type="number"
                  placeholder="Enter custom override price in KSh..."
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                  className="w-full bg-[#FAFDFD] border border-[#CCE5E1] p-2 rounded-[4px] text-[#0F3D3C] outline-none focus:border-[#278C7B]"
                />
              </div>

              <div>
                <label className="block text-[#4A7C79] text-[10px] uppercase font-bold mb-1">Reason / Admin Justification</label>
                <textarea
                  rows={2}
                  placeholder="Enter justification for market price override..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#FAFDFD] border border-[#CCE5E1] p-2 rounded-[4px] text-[#0F3D3C] outline-none focus:border-[#278C7B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#CCE5E1]">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 bg-[#E8F4F1] text-[#0F3D3C] text-xs font-semibold rounded-[4px] hover:bg-[#d5e8e4]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveOverride()}
                className="px-4 py-1.5 bg-[#278C7B] hover:bg-[#1D6F61] text-white text-xs font-bold rounded-[4px] cursor-pointer"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
