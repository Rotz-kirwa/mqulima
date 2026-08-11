import React from "react";
import { Search, Settings, Grid, Bell, User, ShieldCheck, LogOut } from "lucide-react";

interface TopbarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  userRole = "SUPER ADMIN",
  userName = "Executive Admin",
  userEmail,
  onLogout,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#17605E] text-white flex items-center justify-between px-6 z-50 shadow-sm border-b border-[#12504E]">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-white/10 border border-white/30 rounded-[4px] flex items-center justify-center font-serif font-bold text-lg text-white">
          M
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

      {/* Center: Search Bar */}
      <div className="hidden md:flex items-center max-w-md w-full mx-8">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search dashboard, orders, farmers..."
            className="w-full bg-[#12504E]/60 text-white placeholder-teal-100/70 text-xs px-4 py-2 pr-10 border border-white/40 rounded-[2px] focus:outline-none focus:border-white focus:bg-[#12504E] transition"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-white/80" />
        </div>
      </div>

      {/* Right: Actions, User Info & Logout */}
      <div className="flex items-center gap-3">
        <button
          title="System Settings"
          className="p-1.5 rounded-[2px] text-white/90 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <Settings className="h-4 w-4" />
        </button>

        <button
          title="App Modules"
          className="p-1.5 rounded-[2px] text-white/90 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <Grid className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-white/20" />

        {/* Notifications */}
        <button
          title="Notifications"
          className="relative p-1.5 rounded-[2px] text-white/90 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-[#F5A623] rounded-full" />
        </button>

        {/* Logged in User Details */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/20">
          <div className="h-8 w-8 rounded-[2px] bg-white text-[#17605E] font-bold flex items-center justify-center text-xs shadow-xs">
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
  );
};
