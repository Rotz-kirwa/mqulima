import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
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
    { 
      url: "https://x.com/_mqulima", 
      label: "X",
      bgClass: "bg-[#000000] text-white hover:bg-neutral-800 shadow-md",
      iconSvg: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    { 
      url: "https://tiktok.com/@_mqulima", 
      label: "TikTok",
      bgClass: "bg-[#010101] text-white hover:bg-neutral-900 shadow-md",
      iconSvg: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.17 2.27 1.99 3.73 2.3v3.91c-1.39-.01-2.76-.41-3.95-1.15-.71-.44-1.34-.99-1.84-1.65v7.2c-.07 1.83-.69 3.63-1.83 5.05-1.5 1.88-3.83 2.97-6.23 2.97-1.81.01-3.59-.57-5.06-1.65C1.19 19.98.24 18.06.05 16.03c-.26-2.82.97-5.63 3.19-7.35 1.62-1.25 3.66-1.89 5.71-1.78v4c-.75-.08-1.5.07-2.18.42-1.07.56-1.79 1.66-1.89 2.87-.14 1.55.76 3.05 2.19 3.63.81.33 1.7.35 2.52.05 1.09-.4 1.84-1.44 1.94-2.6.01-.22.01-6.73.01-15.26z"/>
        </svg>
      )
    },
    { 
      url: "https://linkedin.com/company/mqulima-hub", 
      label: "LinkedIn",
      bgClass: "bg-[#0077b5] text-white hover:bg-[#005e8e] shadow-md",
      iconSvg: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
        </svg>
      )
    },
  ];

  return (
    <footer className="bg-[#1A3D2F] text-white/80">
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
              {socialLinks.map(({ url, label, bgClass, iconSvg }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`grid h-9 w-9 place-items-center rounded-full transition-all duration-300 transform hover:scale-110 ${bgClass}`}
                  aria-label={label}
                  title={`Follow Mqulima on ${label}`}
                >
                  {iconSvg}
                </a>
              ))}
            </div>

            {/* Newsletter form - rendered after mount to prevent LastPass hydration mismatch */}
            {isMounted ? (
              <form onSubmit={handleSubscribe} className="mt-8 max-w-sm">
                <label htmlFor="newsletter-email" className="block text-[10px] font-bold uppercase tracking-wider text-[#F5A623] mb-2">
                  Subscribe to our newsletter
                </label>
                <div className="flex gap-2">
                  <input
                    id="newsletter-email"
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
              { to: "/academy", label: "Mqulima Academy" },
              { to: "/blog", label: "Mqulima News" },
              { to: "/community", label: "Mqulima Forum" },
              { to: "/tools", label: "Mqulima Tools" },
              { to: "/ai", label: "Mqulima AI" },
              { to: "/services", label: "Services" },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { to: "/about", label: "About Us" },
              { to: "/contact", label: "Contact Us" },
              { to: "/about", label: "Careers" },
              { to: "/about", label: "Insurance" },
            ]}
          />
          <FooterCol
            title="Support & Legal"
            links={[
              { to: "/terms", label: "Privacy Policy" },
              { to: "/terms", label: "Terms & Conditions" },
              { to: "/contact", label: "Support Helpdesk" },
            ]}
          />
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#F5A623]">Reach Us</h4>
            <ul className="mt-4 space-y-3 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-[#F5A623] shrink-0" />
                <a 
                  href="https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors"
                >
                  Junction, Eldoret–Iten Highway
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-[#F5A623] shrink-0" />
                <a href="tel:+254723346134" className="hover:text-white transition-colors font-semibold">
                  +254 723 346 134
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-[#F5A623] shrink-0" />
                <a href="mailto:Mqulima001@gmail.com" className="hover:text-white transition-colors font-semibold">
                  Mqulima001@gmail.com
                </a>
              </li>
            </ul>

            <div className="mt-5 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
              <Link
                to="/contact"
                className="w-full flex items-center justify-between bg-[#F5A623] hover:bg-[#E0951F] text-[#0F291E] font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
              >
                <span>Visit Contact Page</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-0.5" />
              </Link>
              <a
                href="https://wa.me/254723346134"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between bg-[#25D366] hover:bg-[#20BA56] text-white font-bold text-[10px] sm:text-xs px-2 sm:px-3 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
              >
                <span className="flex items-center gap-1">
                  <WhatsAppIcon className="h-3.5 w-3.5 text-white shrink-0" />
                  <span>WhatsApp Chat</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-0.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[11px] text-white/40 md:flex-row md:items-center">
          <p>© 2026 Mqulima Kenya Ltd. All rights reserved.</p>
          <p className="font-bold text-white/60">Engineered by Webmakers</p>
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
        {links.map((l, index) => (
          <li key={`${l.label}-${index}`}>
            <Link
              to={l.to as any}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-white/70 transition hover:text-[#F5A623] cursor-pointer inline-block py-0.5"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
