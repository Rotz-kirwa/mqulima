import React, { useState, useEffect } from "react";
import { Search, Settings, Grid, Bell, User, ShieldCheck, LogOut, Command } from "lucide-react";
import { AdminTab } from "./Sidebar";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { SystemSettingsModal } from "./SystemSettingsModal";
import { AppModulesMenu } from "./AppModulesMenu";
import { NotificationsTray } from "./NotificationsTray";
import { MqulimaLogo } from "../shared/MqulimaLogo";

interface TopbarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  onNavigateTab?: (tab: AdminTab) => void;
  activeTab?: AdminTab;
}

export const Topbar: React.FC<TopbarProps> = ({
  userRole = "SUPER ADMIN",
  userName = "Executive Admin",
  userEmail = "mqulima@mqulima.com",
  onLogout,
  onNavigateTab,
  activeTab = "dashboard",
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(3);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "Escape") {
        setIsModulesOpen(false);
        setIsNotificationsOpen(false);
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (tab: AdminTab) => {
    onNavigateTab?.(tab);
    setIsModulesOpen(false);
    setIsNotificationsOpen(false);
    setIsSearchOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#17605E] text-white flex items-center justify-between px-6 z-40 shadow-sm border-b border-[#12504E]">
        {/* Left: Brand Identity */}
        <div 
          onClick={() => handleNavigate("dashboard")}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="Return to Executive Dashboard"
        >
          <div className="h-10 w-10 rounded-[4px] bg-white/10 border border-white/30 flex items-center justify-center group-hover:bg-white/20 transition shadow-sm">
            <MqulimaLogo size={30} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-serif text-lg font-bold tracking-tight text-white leading-none">
              MQULIMA
            </span>
            <span className="text-[10px] font-mono tracking-widest text-teal-100 uppercase opacity-90">
              Admin Console
            </span>
          </div>
        </div>

        {/* Center: Search Bar Trigger */}
        <div className="hidden md:flex items-center max-w-md w-full mx-8">
          <div 
            onClick={() => setIsSearchOpen(true)}
            className="relative w-full cursor-pointer group"
          >
            <input
              type="text"
              readOnly
              placeholder="Search dashboard, orders, farmers, inventory..."
              className="w-full bg-[#12504E]/60 text-white placeholder-teal-100/70 text-xs px-4 py-2 pr-20 border border-white/40 rounded-[4px] group-hover:border-white group-hover:bg-[#12504E] transition cursor-pointer select-none"
            />
            <div className="absolute right-3 top-2 flex items-center gap-1.5 pointer-events-none">
              <span className="text-[10px] font-mono text-teal-100/80 bg-white/10 border border-white/20 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
              <Search className="h-4 w-4 text-white/80" />
            </div>
          </div>
        </div>

        {/* Right: Actions, User Info & Logout */}
        <div className="flex items-center gap-3 relative">
          {/* Settings Button */}
          <button
            onClick={() => {
              setIsSettingsOpen(true);
              setIsModulesOpen(false);
              setIsNotificationsOpen(false);
            }}
            title="System Settings & Database Info"
            className={`p-1.5 rounded-[4px] transition cursor-pointer ${
              isSettingsOpen 
                ? "bg-white/20 text-white" 
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* App Modules Launcher Button */}
          <button
            onClick={() => {
              setIsModulesOpen(!isModulesOpen);
              setIsNotificationsOpen(false);
            }}
            title="All System Modules Quick Switcher"
            className={`p-1.5 rounded-[4px] transition cursor-pointer ${
              isModulesOpen 
                ? "bg-white/20 text-white" 
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-white/20" />

          {/* Notifications Bell */}
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsModulesOpen(false);
            }}
            title="System Notifications"
            className={`relative p-1.5 rounded-[4px] transition cursor-pointer ${
              isNotificationsOpen 
                ? "bg-white/20 text-white" 
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-[#F5A623] rounded-full animate-pulse" />
            )}
          </button>

          {/* App Modules Menu Popover */}
          <AppModulesMenu
            isOpen={isModulesOpen}
            onClose={() => setIsModulesOpen(false)}
            onNavigateTab={handleNavigate}
            activeTab={activeTab}
          />

          {/* Notifications Tray Popover */}
          <NotificationsTray
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            onNavigateTab={handleNavigate}
            onUnreadCountChange={setUnreadCount}
          />

          {/* Logged in User Details */}
          <div className="flex items-center gap-3 pl-2 border-l border-white/20">
            <div className="h-8 w-8 rounded-[4px] bg-white text-[#17605E] font-bold flex items-center justify-center text-xs shadow-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {userName}
              </span>
              <span className="text-[9px] font-mono text-teal-100 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3 text-[#F5A623]" />
                {userRole}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Log Out of Admin Console"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-mono font-bold transition shadow-xs cursor-pointer ml-2 border border-rose-500"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Log Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Global Command / Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={handleNavigate}
        initialQuery={searchInitialQuery}
      />

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={userName}
        userRole={userRole}
        userEmail={userEmail}
      />
    </>
  );
};
