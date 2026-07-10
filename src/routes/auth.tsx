import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full font-['Inter',sans-serif] bg-[#DCF2D0] selection:bg-[#2D6A4F]/20 selection:text-[#2D6A4F]">
      {/* Split Screen Grid */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-12 min-h-screen">

        {/* Left: Illustration Panel (Visible on all, stacks on mobile) */}
        <section className="relative lg:col-span-5 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#52B788] p-8 lg:p-12 min-h-[340px] lg:min-h-screen shadow-xl z-10">
          {/* Subtle nature grid overlay */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="leaf-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="15" cy="15" r="1" fill="#fff" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#leaf-grid)" />
            </svg>
          </div>

          {/* Organic floating decorative circles */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-[#D8F3DC]/10 blur-3xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full my-auto">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-3 mb-6 lg:mb-8 group">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-white shadow-md shadow-[#1B4332]/20 transition-transform duration-300 group-hover:scale-105">
                <img src="/favicon.svg" alt="Mkulima Logo" className="h-6 w-6" />
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight font-sans">
                Mkulima<span className="text-[#F5A623]">.</span>
              </span>
            </Link>

            {/* Hero Illustration */}
            <div className="w-full max-w-[200px] sm:max-w-[240px] lg:max-w-sm mb-6 lg:mb-8 transition-transform duration-500 hover:scale-[1.02]">
              <img
                src="/images/auth_illustration.png"
                alt="Kenyan farm marketplace illustration showing farmers, fresh produce, and rolling green hills"
                className="w-full h-auto rounded-2xl border border-white/10 shadow-2xl bg-white/5 p-1 backdrop-blur-sm"
              />
            </div>

            {/* Brand Copy */}
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight mb-2">
              Fresh from the Farm,
              <br />
              <span className="text-[#F5A623] bg-gradient-to-r from-[#F5A623] to-[#FFC107] bg-clip-text text-transparent">Direct to You.</span>
            </h1>
            <p className="text-xs lg:text-sm text-white/80 leading-relaxed max-w-xs font-medium">
              Kenya's trusted marketplace connecting farmers with buyers. Quality produce, fair prices, verified sellers.
            </p>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 mt-6 lg:mt-8">
              <div className="flex flex-col items-center">
                <span className="text-xl lg:text-2xl font-extrabold text-white">2K+</span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold">Farmers</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex flex-col items-center">
                <span className="text-xl lg:text-2xl font-extrabold text-white">47</span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold">Counties</span>
              </div>
              <div className="w-px h-6 bg-white/20" />
              <div className="flex flex-col items-center">
                <span className="text-xl lg:text-2xl font-extrabold text-white">100%</span>
                <span className="text-[9px] uppercase tracking-wider text-white/60 font-bold">Verified</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer (Desktop) */}
          <div className="hidden lg:block absolute bottom-6 text-center w-full">
            <span className="text-[10px] text-white/40 font-semibold tracking-wide">
              © {new Date().getFullYear()} Mkulima Hub · All Rights Reserved
            </span>
          </div>
        </section>

        {/* Right: Form Panel */}
        <main className="lg:col-span-7 flex flex-col items-center justify-center py-10 lg:py-16 px-4 sm:px-8 lg:px-12 xl:px-16 overflow-y-auto bg-[#DCF2D0]">
          {/* Form Card styled like the template */}
          <div className="w-full max-w-md bg-[#0B6A47] rounded-[32px] overflow-hidden shadow-2xl transition-all duration-300">
            <Outlet />
          </div>

          {/* Bottom Footer (Mobile) */}
          <p className="mt-8 text-[10px] text-gray-500 text-center lg:hidden font-semibold">
            © {new Date().getFullYear()} Mkulima Hub · All Rights Reserved
          </p>
        </main>
      </div>
    </div>
  );
}

