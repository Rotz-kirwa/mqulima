import React, { useState } from "react";
import { 
  X, 
  Settings, 
  Database, 
  ShieldCheck, 
  Zap, 
  Bell, 
  Trash2, 
  Check, 
  Server, 
  Cpu, 
  Globe, 
  RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import { clearAdminCache } from "../../lib/api";

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  userName = "Executive Admin",
  userRole = "SUPER ADMIN",
  userEmail = "mqulima@mqulima.com",
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "performance" | "security" | "notifications">("general");
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    return localStorage.getItem("mq_admin_sound_alerts") !== "false";
  });
  const [compactDensity, setCompactDensity] = useState<boolean>(() => {
    return localStorage.getItem("mq_admin_compact_tables") === "true";
  });
  const [syncInterval, setSyncInterval] = useState<string>(() => {
    return localStorage.getItem("mq_admin_sync_interval") || "60";
  });

  const handleSavePreferences = () => {
    localStorage.setItem("mq_admin_sound_alerts", String(soundAlerts));
    localStorage.setItem("mq_admin_compact_tables", String(compactDensity));
    localStorage.setItem("mq_admin_sync_interval", syncInterval);
    toast.success("Admin system preferences saved successfully");
    onClose();
  };

  const handlePurgeCache = () => {
    clearAdminCache();
    toast.success("All in-memory admin caches purged!", {
      description: "Next module visits will re-fetch freshly from PostgreSQL.",
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-[10px] shadow-2xl border border-[#CCE5E1] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#CCE5E1] bg-[#F7FCFB]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[6px] bg-[#278C7B] text-white flex items-center justify-center">
              <Settings className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F3D3C]">System & Operations Settings</h2>
              <p className="text-xs text-[#4A7C79]">Mqulima Agri-Hub Admin Infrastructure & Preferences</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-[#4A7C79] hover:text-[#0F3D3C] hover:bg-[#E8F4F1] rounded cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#CCE5E1] bg-[#E8F4F1]/60 px-6 gap-6 text-xs font-mono">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-3 font-bold border-b-2 transition cursor-pointer ${
              activeTab === "general"
                ? "border-[#278C7B] text-[#0F3D3C]"
                : "border-transparent text-[#4A7C79] hover:text-[#0F3D3C]"
            }`}
          >
            General & Display
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={`py-3 font-bold border-b-2 transition cursor-pointer ${
              activeTab === "performance"
                ? "border-[#278C7B] text-[#0F3D3C]"
                : "border-transparent text-[#4A7C79] hover:text-[#0F3D3C]"
            }`}
          >
            Performance & Cache
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`py-3 font-bold border-b-2 transition cursor-pointer ${
              activeTab === "security"
                ? "border-[#278C7B] text-[#0F3D3C]"
                : "border-transparent text-[#4A7C79] hover:text-[#0F3D3C]"
            }`}
          >
            Security & DB
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[440px] overflow-y-auto">
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-[#F7FCFB] border border-[#CCE5E1] rounded-[6px]">
                <div>
                  <h4 className="text-xs font-bold text-[#0F3D3C]">Audio Sound Alerts</h4>
                  <p className="text-[11px] text-[#4A7C79] mt-0.5">Play audio notification when high-value orders or farmer inquiries arrive</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={soundAlerts} 
                    onChange={(e) => setSoundAlerts(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#278C7B]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F7FCFB] border border-[#CCE5E1] rounded-[6px]">
                <div>
                  <h4 className="text-xs font-bold text-[#0F3D3C]">Compact Table Mode</h4>
                  <p className="text-[11px] text-[#4A7C79] mt-0.5">Reduce padding in CRM and Inventory tables to display more rows</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={compactDensity} 
                    onChange={(e) => setCompactDensity(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#278C7B]"></div>
                </label>
              </div>

              <div className="p-3.5 bg-[#F7FCFB] border border-[#CCE5E1] rounded-[6px] space-y-2">
                <label className="block text-xs font-bold text-[#0F3D3C]">Background Auto-Revalidation Interval</label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="w-full bg-white border border-[#CCE5E1] text-xs text-[#0F3D3C] px-3 py-2 rounded-[6px] focus:outline-none focus:border-[#278C7B]"
                >
                  <option value="30">Every 30 Seconds (Live High Frequency)</option>
                  <option value="60">Every 60 Seconds (Recommended Default)</option>
                  <option value="300">Every 5 Minutes (Bandwidth Saver)</option>
                </select>
                <p className="text-[10px] text-[#4A7C79]">Controls background silent data revalidation when browser tab is idle.</p>
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-4">
              <div className="p-4 bg-[#E8F4F1] border border-[#CCE5E1] rounded-[6px] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F3D3C]">
                  <Zap className="h-4 w-4 text-[#278C7B]" />
                  <span>SWR High-Speed Caching Engine: Active</span>
                </div>
                <p className="text-xs text-[#2C5E5B]">
                  Client memory caches records with 0ms instantaneous switching. Server caches heavy database summaries with 60-second in-memory TTL.
                </p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F7FCFB] border border-[#CCE5E1] rounded-[6px]">
                <div>
                  <h4 className="text-xs font-bold text-[#0F3D3C]">Purge Admin Cache Memory</h4>
                  <p className="text-[11px] text-[#4A7C79] mt-0.5">Flush in-flight client cache and force all modules to re-query the PostgreSQL cluster</p>
                </div>
                <button
                  onClick={handlePurgeCache}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-[6px] border border-rose-300 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Purge Cache
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-3">
              <div className="p-3.5 bg-[#F7FCFB] border border-[#CCE5E1] rounded-[6px] space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#CCE5E1]/60 pb-2">
                  <span className="text-[#4A7C79]">Active Administrator:</span>
                  <strong className="text-[#0F3D3C]">{userName}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-[#CCE5E1]/60 pb-2">
                  <span className="text-[#4A7C79]">Role Privilege:</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {userRole}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#CCE5E1]/60 pb-2">
                  <span className="text-[#4A7C79]">Email:</span>
                  <span className="font-mono text-[#0F3D3C]">{userEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4A7C79]">PostgreSQL Cluster:</span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-700 font-bold">
                    <Database className="h-3 w-3" /> Render Ohio (Connected)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-[#F7FCFB] border-t border-[#CCE5E1]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#4A7C79] hover:bg-[#E8F4F1] rounded-[6px] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePreferences}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#278C7B] hover:bg-[#1f7264] text-white rounded-[6px] shadow-xs transition cursor-pointer"
          >
            <Check className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
