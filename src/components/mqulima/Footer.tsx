import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { MqulimaLogo } from "./MqulimaLogo";

export function Footer() {
  return (
    <footer className="mt-24 bg-forest text-forest-foreground">
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex flex-col items-start gap-2.5">
              <MqulimaLogo size={60} />
              <div className="text-3xl font-black tracking-tighter text-white lowercase">mqulima</div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-forest-foreground/70">
              Kenya's #1 digital farming ecosystem. From seed to sale — agrovet shop, expert services and AI intelligence built for every farmer, every county.
            </p>
            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-blue hover:text-blue-foreground" aria-label="social">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Platform" links={[
            { to: "/shop", label: "Agrovet Shop" },
            { to: "/services", label: "Services" },
            { to: "/climate", label: "Climate Info" },
            { to: "/knowledge", label: "Knowledge Hub" },
            { to: "/community", label: "Community" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/about", label: "About Us" },
            { to: "/about", label: "Careers" },
            { to: "/about", label: "Insurance" },
            { to: "/contact", label: "Contact" },
          ]} />
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gold">Reach Us</h4>
            <ul className="mt-4 space-y-3 text-sm text-forest-foreground/80">
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-gold" /> Eldoret HQ, Uasin Gishu</li>
              <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-gold" /> +254 711 222 333</li>
              <li className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-gold" /> hello@mqulima.co.ke</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-forest-foreground/60 md:flex-row md:items-center">
          <p>© 2026 Mqulima Kenya Ltd. All rights reserved.</p>
          <p>Made in Eldoret with ❤️ for African farmers.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-wider text-gold">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-forest-foreground/80 transition hover:text-gold">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
