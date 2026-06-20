import { Link } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, Globe, User, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MqulimaLogo } from "./MqulimaLogo";
import { usePWA } from "@/hooks/usePWA";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/services", label: "Services" },
  { to: "/climate", label: "Climate" },
  { to: "/knowledge", label: "Knowledge Hub" },
  { to: "/community", label: "Community" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"EN" | "SW">("EN");
  const { isInstallable, triggerInstall } = usePWA();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <MqulimaLogo size={52} />
          <div className="leading-tight">
            <div className="text-2xl font-black tracking-tighter text-forest lowercase">mqulima</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground mt-0.5">Digital Farming</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-full px-4 py-2 text-sm font-semibold bg-primary/10 text-primary ring-1 ring-primary/20" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={triggerInstall}
              className="flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-xs font-bold text-gold-foreground transition duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
              aria-label="Install App"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
          )}
          <button
            onClick={() => setLang(lang === "EN" ? "SW" : "EN")}
            className="hidden items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-secondary md:flex"
            aria-label="Switch language"
          >
            <Globe className="h-3.5 w-3.5" /> {lang}
          </button>
          <Link to="/dashboard" className="hidden md:block">
            <Button variant="ghost" size="sm" className="gap-1.5"><User className="h-4 w-4" /> Account</Button>
          </Link>
          <Link to="/shop" aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-forest transition hover:bg-secondary/70">
            <ShoppingCart className="h-4.5 w-4.5" />
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">3</span>
          </Link>
          <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-forest lg:hidden" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="container-px mx-auto flex max-w-7xl flex-col py-3">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-secondary">
                {n.label}
              </Link>
            ))}
            <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-secondary">My Dashboard</Link>
            {isInstallable && (
              <button
                onClick={() => {
                  setOpen(false);
                  triggerInstall();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-bold text-gold hover:bg-secondary"
              >
                <Download className="h-4 w-4 text-gold" /> Install App
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
