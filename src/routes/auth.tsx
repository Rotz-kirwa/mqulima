import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Sprout, Users, Map, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex font-sans bg-[#F8FAF6] text-gray-800 select-none overflow-x-hidden">
      {/* Split Screen Grid */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* LEFT PANEL: EDITORIAL FARM HERO & BRANDING (DESKTOP/TABLET) */}
        <section className="relative lg:col-span-5 flex flex-col justify-between overflow-hidden bg-[#042619] p-8 lg:p-12 min-h-[360px] lg:min-h-screen shadow-xl z-10 border-r border-[#0B6A47]/30">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60 scale-105 transition-transform duration-1000"
            style={{ backgroundImage: "url('/images/mkulima_hero_farm.png')" }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#031E14] via-[#042619]/80 to-[#042619]/50" />

          {/* TOP BRAND LOGO */}
          <div className="relative z-10 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-2xl bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/30 transition-transform duration-300 group-hover:scale-105">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white font-mono uppercase">MQULIMA<span className="text-[#10B981]">HUB</span></span>
                <span className="text-[10px] font-bold tracking-widest text-[#99D98C] uppercase block">Kenya's Farm Network</span>
              </div>
            </Link>
          </div>

          {/* CENTER HERO CONTENT */}
          <div className="relative z-10 my-auto space-y-6 max-w-md text-left pt-8 pb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold">
              <span className="text-[#10B981]">●</span> Direct Agricultural Marketplace & Community
            </div>

            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
              Fresh from the Farm, <br />
              <span className="text-[#99D98C] italic">Direct to You.</span>
            </h1>

            <p className="text-xs lg:text-sm text-gray-200 leading-relaxed font-medium">
              Connect directly with verified farmers, access daily wholesale commodity market prices, and order fresh produce across all 47 counties of Kenya.
            </p>

            {/* KEY STATS ROW */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
                <div className="flex items-center gap-1.5 text-[#99D98C] mb-0.5">
                  <Users className="h-4 w-4" />
                  <span className="font-extrabold text-base text-white">2K+</span>
                </div>
                <span className="text-[10px] text-gray-300 font-medium">Farmers Joined</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
                <div className="flex items-center gap-1.5 text-[#99D98C] mb-0.5">
                  <Map className="h-4 w-4" />
                  <span className="font-extrabold text-base text-white">47</span>
                </div>
                <span className="text-[10px] text-gray-300 font-medium">Counties Covered</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left">
                <div className="flex items-center gap-1.5 text-[#99D98C] mb-0.5">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="font-extrabold text-base text-white">100%</span>
                </div>
                <span className="text-[10px] text-gray-300 font-medium">Verified Traders</span>
              </div>
            </div>
          </div>

          {/* FOOTER COPYRIGHT */}
          <div className="relative z-10 text-[11px] text-gray-400 font-medium">
            © {new Date().getFullYear()} Mqulima Hub. All Rights Reserved. Empowering Kenyan Agriculture.
          </div>
        </section>

        {/* RIGHT PANEL: OUTLET CONTENT CONTAINER (SIGN IN / SIGN UP) */}
        <main className="lg:col-span-7 flex flex-col justify-center items-center py-8 lg:py-12 px-4 sm:px-8 lg:px-12 xl:px-16 overflow-y-auto bg-[#F8FAF6] min-h-screen">
          <div className="w-full max-w-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
