import { Link } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, Leaf, Globe, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/services", label: "Services" },
  { to: "/knowledge", label: "Knowledge Hub" },
  { to: "/community", label: "Community" },
  { to: "/about", label: "About" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"EN" | "SW">("EN");
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-card">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight text-forest">Mqulima</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Digital Farming</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-full px-4 py-2 text-sm font-semibold bg-secondary text-forest" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
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
          </nav>
        </div>
      )}
    </header>
  );
}
