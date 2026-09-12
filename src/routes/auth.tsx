import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";
import { SproutLogo } from "@/components/auth/AuthMockupAssets";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between font-sans bg-[#DCECCD] text-gray-900 select-none overflow-x-hidden relative py-6 px-4 sm:px-6">
      
      {/* TOP FLOATING NAV BAR */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between z-10 mb-4 sm:mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/40 text-xs font-bold text-gray-700 hover:text-[#056B3A] shadow-xs transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Marketplace</span>
        </Link>

        {/* LOGO LINK */}
        <Link to="/" className="inline-flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center shadow-xs">
            <SproutLogo className="w-6 h-6" />
          </div>
          <span className="text-sm font-black tracking-tight text-gray-900 font-mono hidden sm:inline-block uppercase">
            MQULIMA<span className="text-[#056B3A]">HUB</span>
          </span>
        </Link>
      </header>

      {/* CENTERED PHONE-CARD CONTAINER */}
      <main className="w-full flex-1 flex items-center justify-center py-2 sm:py-4">
        <Outlet />
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="w-full max-w-4xl mx-auto text-center pt-6 pb-2 text-[11px] font-medium text-emerald-900/60 flex items-center justify-center gap-4">
        <span>© {new Date().getFullYear()} Mqulima Hub Kenya</span>
        <span>•</span>
        <Link to="/terms" className="hover:underline hover:text-emerald-950">Terms & Privacy</Link>
      </footer>

    </div>
  );
}
