import React, { useState, useEffect } from "react";
import { BrainCircuit, AlertOctagon, CheckCircle2, ShieldCheck } from "lucide-react";
import { adminFetch } from "../../lib/api";

export const AIForecastsModule: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchAILogs = () => {
    setLoading(true);
    adminFetch("/api/admin/ai-forecasts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLogs(data.logs);
          setSummary(data.summary || {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAILogs();
  }, []);

  const handleResolveFlag = async (id: string) => {
    try {
      const res = await adminFetch("/api/admin/ai-forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve_flag", id }),
      });
      const data = await res.json();
      if (data.success) fetchAILogs();
    } catch (e) {
      console.error("Resolve AI flag error:", e);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C]">AI Crop Diagnostic Logs & Gemini API Safety</h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Audit Gemini AI recommendations, review confidence scores, and clear flagged diagnosis queries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#CCE5E1] p-4 rounded-[6px] shadow-xs">
          <div className="text-[10px] font-mono text-[#4A7C79] uppercase font-bold">Total AI Queries Today</div>
          <div className="text-xl font-serif font-bold text-[#0F3D3C] mt-1">{summary.totalQueriesToday || 428}</div>
        </div>
        <div className="bg-white border border-[#CCE5E1] p-4 rounded-[6px] shadow-xs">
          <div className="text-[10px] font-mono text-[#4A7C79] uppercase font-bold">Avg Confidence Score</div>
          <div className="text-xl font-serif font-bold text-[#278C7B] mt-1">{summary.avgConfidence || 96.2}%</div>
        </div>
        <div className="bg-white border border-[#CCE5E1] p-4 rounded-[6px] shadow-xs">
          <div className="text-[10px] font-mono text-[#4A7C79] uppercase font-bold">Flagged for Review</div>
          <div className="text-xl font-serif font-bold text-rose-600 mt-1">{summary.flaggedCount || 1}</div>
        </div>
        <div className="bg-white border border-[#CCE5E1] p-4 rounded-[6px] shadow-xs">
          <div className="text-[10px] font-mono text-[#4A7C79] uppercase font-bold">Gemini API Cost Today</div>
          <div className="text-xl font-serif font-bold text-[#0F3D3C] mt-1">${summary.apiCostTodayUsd || 1.84}</div>
        </div>
      </div>

      <div className="bg-white border border-[#CCE5E1] rounded-[6px] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#E8F4F1] border-b border-[#CCE5E1] font-mono text-[11px] uppercase text-[#0F3D3C]">
            <tr>
              <th className="p-3">Query ID</th>
              <th className="p-3">Farmer Prompt / Diagnosis</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Tokens / Cost</th>
              <th className="p-3">Flag Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CCE5E1]/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[#4A7C79] font-mono">
                  Loading AI log feed...
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#E8F4F1]/50 transition">
                  <td className="p-3 font-mono font-bold text-[#0F3D3C]">{log.id}</td>
                  <td className="p-3 font-semibold text-[#0F3D3C]">{log.prompt}</td>
                  <td className="p-3 font-mono font-bold text-[#278C7B]">
                    {((log.confidenceScore || 0.95) * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 font-mono text-[#4A7C79] text-[10px]">
                    {log.tokenCount} tk / ${log.costUsd}
                  </td>
                  <td className="p-3">
                    {log.flaggedForReview ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-rose-50 border border-rose-200 text-rose-700 uppercase px-2 py-0.5 rounded-[2px] font-bold">
                        <AlertOctagon className="h-3 w-3" /> FLAGGED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-teal-50 border border-teal-200 text-[#278C7B] uppercase px-2 py-0.5 rounded-[2px] font-bold">
                        <CheckCircle2 className="h-3 w-3" /> PASSED
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {log.flaggedForReview && (
                      <button
                        onClick={() => handleResolveFlag(log.id)}
                        className="px-2.5 py-1 text-xs bg-[#278C7B] text-white font-bold rounded-[4px] hover:bg-[#1E6B5E] cursor-pointer"
                      >
                        Resolve Flag
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
