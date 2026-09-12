import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SproutLogo } from "@/components/auth/AuthMockupAssets";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between font-sans text-gray-900 select-none overflow-x-hidden relative py-6 px-4 sm:px-6">
      
      {/* FULL-BLEED LUSH CORNFIELD SUNRISE BACKGROUND IMAGE */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20 transform scale-100 transition-transform duration-1000"
        style={{
          backgroundImage: "url('/images/auth_bg.jpg'), url('https://i.pinimg.com/1200x/d9/bb/e7/d9bbe7615180cc0221fffb7306826580.jpg')",
        }}
      />

      {/* SOFT CINEMATIC AMBIENT OVERLAY */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/55 backdrop-blur-[1.5px] -z-10" />

      {/* TOP FLOATING NAV BAR */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between z-10 mb-4 sm:mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/40 text-xs font-bold text-gray-800 hover:text-[#056B3A] shadow-lg transition-all cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Marketplace</span>
        </Link>

        {/* LOGO LINK */}
        <Link to="/" className="inline-flex items-center gap-2.5 group cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md">
            <SproutLogo className="w-6 h-6" />
          </div>
          <span className="text-base font-black tracking-tight text-white font-mono hidden sm:inline-block uppercase drop-shadow-md">
            MQULIMA<span className="text-[#80E6A7]">HUB</span>
          </span>
        </Link>
      </header>

      {/* CENTERED PHONE-CARD CONTAINER */}
      <main className="w-full flex-1 flex items-center justify-center py-2 sm:py-4 z-10">
        <Outlet />
      </main>

      {/* MINIMAL FOOTER */}
      <footer className="w-full max-w-4xl mx-auto text-center pt-6 pb-2 text-xs font-medium text-white/85 drop-shadow flex items-center justify-center gap-4 z-10">
        <span>© {new Date().getFullYear()} Mqulima Hub Kenya</span>
        <span>•</span>
        <Link to="/terms" className="text-[#80E6A7] hover:underline font-semibold">Terms & Privacy</Link>
      </footer>

    </div>
  );
}
