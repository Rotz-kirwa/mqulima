import { Link } from "@tanstack/react-router";
import { ShoppingCart, Menu, X, Globe, User, Download, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MqulimaLogo } from "./MqulimaLogo";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "../../lib/cart-context";
import { shopProducts, type ShopProduct } from "@/lib/shop-data";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const { cartItems, setCartOpen } = useCart();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ShopProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Account dropdown state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Handle live suggestions filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = shopProducts
      .filter((p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query))
      .slice(0, 5);
    setSuggestions(filtered);
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <MqulimaLogo size={48} />
          <div className="flex flex-col justify-center leading-none text-left">
            <div className="font-serif text-[20px] font-normal tracking-[0.08em] text-foreground uppercase">
              MQULIMA
            </div>
            <div className="text-[10px] font-medium tracking-normal text-[#2D6A4F] lowercase mt-0.5 italic">
              ...taking you first class
            </div>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{
                className:
                  "rounded-full px-4.5 py-2 text-sm font-bold bg-[#2D6A4F]/10 text-[#2D6A4F] ring-1 ring-[#2D6A4F]/20",
              }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Live Search Bar (Desktop) */}
        <div className="relative hidden xl:block w-56">
          <div className="relative">
            <input
              type="text"
              placeholder="Search produce..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full rounded-full border border-border bg-secondary/50 px-4 py-1.5 pl-9 text-xs outline-none focus:border-[#2D6A4F] focus:bg-white transition-all text-left"
            />
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          {/* Live Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute left-0 right-0 mt-2 rounded-xl border border-[#E8ECE9] bg-white p-2 shadow-lg z-50 text-left"
              >
                {suggestions.map((p) => (
                  <Link
                    key={p.id}
                    to="/shop/$productId"
                    params={{ productId: String(p.id) }}
                    onClick={() => setSearchQuery("")}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-secondary transition-colors"
                  >
                    <img src={p.image} className="w-8 h-8 rounded-md object-cover border border-[#E8ECE9]" alt={p.name} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#1A1A1A] truncate">{p.name}</div>
                      <div className="text-[10px] text-[#2D6A4F] font-semibold">KES {p.price.toLocaleString()}</div>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side actions */}
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={triggerInstall}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#F5A623] px-3.5 py-1.5 text-xs font-bold text-white transition duration-300 hover:scale-105 active:scale-95 shadow-sm"
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

          {/* Account Dropdown Wrapper */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-secondary cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">{user ? user.name.split(" ")[0] : "Account"}</span>
            </button>

            <AnimatePresence>
              {userDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-[#E8ECE9] bg-white p-2 shadow-lg z-50 text-left"
                >
                  {user ? (
                    <>
                      <div className="px-2.5 py-1.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                        Signed in as <br />
                        <span className="text-[#1A1A1A] normal-case font-extrabold">{user.email}</span>
                      </div>
                      <div className="h-px bg-[#E8ECE9] my-1" />
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-secondary text-[#1A1A1A]"
                      >
                        My Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          toast.success("Successfully logged out");
                          setTimeout(() => window.location.reload(), 800);
                        }}
                        className="w-full text-left rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-red-50 text-red-600"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-secondary text-[#1A1A1A]"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-secondary text-[#1A1A1A]"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Icon */}
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary text-forest transition hover:bg-secondary/70 cursor-pointer"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#F5A623] text-[10px] font-bold text-white animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburg Trigger */}
          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-forest lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Full-screen Mobile Hamburg Menu Slide-in */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 right-0 w-full max-w-xs bg-white p-6 shadow-2xl flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#E8ECE9] pb-4 mb-6">
                  <div className="font-serif text-lg font-bold tracking-wider text-[#1A1A1A]">MENU</div>
                  <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-secondary text-[#6B7280]">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Search input */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Search produce..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-border bg-secondary/50 px-4 py-2 pl-9 text-xs outline-none focus:border-[#2D6A4F] focus:bg-white transition-all text-left"
                  />
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 rounded-xl border border-[#E8ECE9] bg-white p-2 shadow-lg z-50">
                      {suggestions.map((p) => (
                        <Link
                          key={p.id}
                          to="/shop/$productId"
                          params={{ productId: String(p.id) }}
                          onClick={() => {
                            setSearchQuery("");
                            setOpen(false);
                          }}
                          className="flex items-center gap-2 py-1.5 hover:bg-secondary rounded-lg px-2"
                        >
                          <img src={p.image} className="w-6 h-6 rounded object-cover" />
                          <span className="text-[11px] font-bold text-[#1A1A1A] truncate flex-1">{p.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <nav className="flex flex-col gap-1">
                  {nav.map((n) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-secondary transition-colors"
                      activeProps={{
                        className: "rounded-lg px-4 py-2.5 text-sm font-bold bg-[#2D6A4F]/10 text-[#2D6A4F] border-l-4 border-[#2D6A4F]"
                      }}
                      activeOptions={{ exact: n.to === "/" }}
                    >
                      {n.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="border-t border-[#E8ECE9] pt-6 space-y-3">
                {user ? (
                  <>
                    <div className="text-[11px] text-[#6B7280]">Logged in as <strong className="text-[#1A1A1A]">{user.name}</strong></div>
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="block text-center rounded-lg bg-[#2D6A4F] py-2.5 text-xs font-bold text-white shadow-md"
                    >
                      My Dashboard
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block text-center rounded-lg bg-[#2D6A4F] py-2.5 text-xs font-bold text-white shadow-md animate-pulse"
                  >
                    Sign In
                  </Link>
                )}
                {isInstallable && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      triggerInstall();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#F5A623] py-2.5 text-xs font-bold text-[#1A1A1A] hover:bg-secondary"
                  >
                    <Download className="h-4 w-4 text-[#F5A623]" /> Install App
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
