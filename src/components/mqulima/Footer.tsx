import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { MqulimaLogo } from "./MqulimaLogo";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Subscribed successfully!", {
      description: "You will receive our weekly farming tips and agrovet offers.",
    });
    setEmail("");
  };

  const socialLinks = [
    { Icon: Facebook, url: "https://facebook.com/mqulimake", label: "Facebook" },
    { Icon: Instagram, url: "https://instagram.com/mqulima", label: "Instagram" },
    { Icon: Twitter, url: "https://twitter.com/mqulimake", label: "Twitter" },
  ];

  return (
    <footer className="mt-24 bg-[#1A3D2F] text-white/80">
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 text-left">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <MqulimaLogo size={52} />
              <div className="flex flex-col justify-center leading-none text-white">
                <div className="font-serif text-[22px] font-normal tracking-[0.08em] uppercase">
                  MQULIMA
                </div>
                <div className="text-[10px] font-medium tracking-normal text-[#F5A623] lowercase mt-0.5 italic">
                  ...taking you first class
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-white/60">
              Kenya's #1 digital farming ecosystem. From seed to sale — agrovet shop, expert services and AI intelligence built for every farmer, every county.
            </p>
            
            {/* Social handles with real URLs */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ Icon, url, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-[#F5A623] hover:text-white"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Newsletter form - rendered after mount to prevent LastPass hydration mismatch */}
            {isMounted ? (
              <form onSubmit={handleSubscribe} className="mt-8 max-w-sm">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#F5A623] mb-2">
                  Subscribe to our newsletter
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-lpignore="true"
                    className="flex-1 rounded-[8px] bg-white/10 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none focus:border-[#F5A623] transition-all"
                  />
                  <button
                    type="submit"
                    className="rounded-[8px] bg-[#F5A623] hover:bg-[#E0951F] px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-8 h-[76px] max-w-sm bg-white/5 rounded-[8px] animate-pulse" />
            )}
          </div>

          <FooterCol
            title="Platform"
            links={[
              { to: "/shop", label: "Agrovet Shop" },
              { to: "/services", label: "Services" },
              { to: "/climate", label: "Climate Info" },
              { to: "/knowledge", label: "Knowledge Hub" },
              { to: "/community", label: "Community" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { to: "/about", label: "About Us" },
              { to: "/about", label: "Careers" },
              { to: "/about", label: "Insurance" },
              { to: "/contact", label: "Contact" },
            ]}
          />
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#F5A623]">Reach Us</h4>
            <ul className="mt-4 space-y-3 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-[#F5A623]" /> Eldoret HQ, Uasin Gishu
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-[#F5A623]" /> +254 711 222 333
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-[#F5A623]" /> hello@mqulima.co.ke
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-white/40 md:flex-row md:items-center">
          <p>© 2026 Mqulima Kenya Ltd. All rights reserved.</p>
          <p className="font-bold text-white/60">Built by Webmakers with ❤️ — Empowering African farmers with next-gen digital tools.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-wider text-[#F5A623]">{title}</h4>
      <ul className="mt-4 space-y-2 text-xs">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-white/70 transition hover:text-[#F5A623]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
