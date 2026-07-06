import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  ShoppingCart, Menu, X, Globe, User, Download, Search, HelpCircle,
  Home, ShoppingBag, Briefcase, CloudSun, BookOpen, Users as UsersIcon, Info, Phone,
  Handshake, FileText, Wrench, Sparkles
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MqulimaLogo } from "./MqulimaLogo";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/lib/cart-context";
import { type ShopProduct } from "@/lib/shop-data";
import { searchProducts } from "@/lib/api/products.server";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/academy", label: "Academy" },
  { to: "/blog", label: "Mqulima News" },
  { to: "/community", label: "Mqulima Forum" },
  { to: "/tools", label: "Mqulima Tools" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const navWithIcons = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/academy", label: "Academy", icon: BookOpen },
  { to: "/blog", label: "Mqulima News", icon: FileText },
  { to: "/community", label: "Mqulima Forum", icon: UsersIcon },
  { to: "/tools", label: "Mqulima Tools", icon: Wrench },
  { to: "/ai", label: "🌱 Mqulima AI", icon: Sparkles },
  { to: "/services", label: "Services", icon: Briefcase },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Phone },
];

const subNavItems: Array<{
  label: string;
  search: {
    category?: string;
  };
  icon: string;
}> = [
  { label: "All Products", search: {}, icon: "📦" },
  { label: "Seeds & Seedlings", search: { category: "Seeds & Seedlings" }, icon: "🌾" },
  { label: "Crop Protection", search: { category: "Crop Protection" }, icon: "🛡️" },
  { label: "Fertilizers", search: { category: "Fertilizers" }, icon: "🍚" },
  { label: "Plant Growth & Boosters", search: { category: "Plant Growth & Boosters" }, icon: "🌱" },
  { label: "Harvest & Storage", search: { category: "Harvest & Storage" }, icon: "🧺" },
  { label: "Animal Farming", search: { category: "Animal Farming" }, icon: "🐄" },
  { label: "Farm Equipment", search: { category: "Farm Equipment" }, icon: "🚜" },
  { label: "Water & Sanitation", search: { category: "Water & Sanitation" }, icon: "🚰" }
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isShopPage = location.pathname.startsWith("/shop");

  const [open, setOpen] = useState(false);

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
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);

  // Category dropdown state & click outside ref
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle live suggestions filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const fetchSuggestions = async () => {
      try {
        const results = await searchProducts({ data: searchQuery });
        if (active) {
          setSuggestions(results.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions", err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    navigate({
      to: "/shop",
      search: {
        q: searchQuery || undefined,
        category: undefined,
        seller: undefined
      } as any
    });
  };

  const handleSubNavClick = (searchParams: any) => {
    navigate({
      to: "/shop",
      search: searchParams as any
    });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      {/* =========================================================================
         1. STANDARD MAIN NAVIGATION BAR (Always visible on all pages, including Shop)
         ========================================================================= */}
      <div className="container-px mx-auto flex h-16 max-w-7xl items-center justify-between gap-2">
        {/* Logo left */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <MqulimaLogo size={44} />
          <div className="flex flex-col justify-center leading-none text-left">
            <div className="font-serif text-[18px] font-normal tracking-[0.08em] text-foreground uppercase">
              MQULIMA
            </div>
            <div className="text-[9px] font-medium tracking-normal text-[#2D6A4F] lowercase mt-0.5 italic">
              ...taking you first class
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Items */}
        <nav className="hidden items-center gap-x-1.5 xl:gap-x-2.5 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-2 py-1.5 text-[11px] xl:text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground whitespace-nowrap"
              activeProps={{
                className:
                  "rounded-full px-2 py-1.5 text-[11px] xl:text-xs font-bold bg-[#2D6A4F]/10 text-[#2D6A4F] ring-1 ring-[#2D6A4F]/20 whitespace-nowrap",
              }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>



        {/* Actions right */}
        <div className="flex items-center gap-2 shrink-0">
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
                            <span className="text-[#1A1A1A] normal-case font-extrabold truncate block">{user.email}</span>
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

      {/* =========================================================================
         2. JUMIA-STYLE MARKETPLACE HEADER (Only visible on Shop routes, stacked below)
         ========================================================================= */}
      {isShopPage && (
        <div className="border-t border-gray-150 bg-[#F5F5F5] py-2.5 md:py-3.5">
          <div className="px-3 md:px-4 mx-auto max-w-7xl flex items-center justify-between gap-3 md:gap-6">
            {/* Marketplace Wide Search Bar */}
            <div className="relative flex-1 max-w-3xl">
              <form onSubmit={handleSearchSubmit} className="flex w-full items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products, categories, sellers..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                    className="w-full h-9 md:h-11 pl-9 pr-3 rounded-l-md border border-gray-300 bg-white text-xs md:text-sm focus:border-[#2D6A4F] outline-none transition-all text-left shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="h-9 md:h-11 px-4 md:px-8 rounded-r-md bg-[#F5A623] hover:bg-[#E0951F] text-white font-bold text-[11px] md:text-xs uppercase tracking-wider transition-colors shrink-0 shadow-xs"
                >
                  Search
                </button>
              </form>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 right-0 mt-1.5 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg z-50 text-left"
                  >
                    {suggestions.map((p) => (
                      <Link
                        key={p.id}
                        to="/shop/product/$slug"
                        params={{ slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || p.id }}
                        onClick={() => {
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                        className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src={p.image}
                          className="w-8 h-8 rounded object-cover border border-gray-150"
                          alt={p.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="100%" height="100%" fill="%23F4F6F4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-weight="bold" font-size="6" fill="%232D6A4F">MQ</text></svg>`;
                          }}
                        />
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

            {/* Help & Support menu (Desktop/Tablet only) */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setHelpDropdownOpen(!helpDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:text-[#2D6A4F] transition-colors cursor-pointer shadow-xs"
                >
                  <HelpCircle className="h-4.5 w-4.5 text-gray-500" />
                  <span>Help & Support</span>
                  <span className="text-[8px] text-gray-400">▼</span>
                </button>
                <AnimatePresence>
                  {helpDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white p-3 shadow-lg z-50 text-left"
                    >
                      <div className="text-xs font-bold text-gray-800">Mqulima Help Center</div>
                      <p className="text-[10px] text-gray-500 mt-1">Direct support and order assistance</p>
                      <div className="h-px bg-gray-150 my-2" />
                      <button
                        onClick={() => {
                          setHelpDropdownOpen(false);
                          toast.info("Call Center: 0723346134");
                        }}
                        className="w-full text-left text-xs font-semibold py-1 hover:text-[#2D6A4F]"
                      >
                        📞 Call Support: 0723 346134
                      </button>
                      <a
                        href="mailto:Mqulima001@gmail.com"
                        className="block text-xs font-semibold py-1 hover:text-[#2D6A4F]"
                      >
                        ✉️ Email: Mqulima001@gmail.com
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Navbar Category Dropdown (Only visible on Shop routes) */}
      {isShopPage && (() => {
        const activeCategory = (location.search as any)?.category || undefined;
        const currentCategoryItem = subNavItems.find(item => {
          if (!item.search.category) {
            return !activeCategory;
          }
          return activeCategory === item.search.category;
        }) || subNavItems[0];

        return (
          <div className="border-y border-gray-200 bg-[#F9FAF9] py-2 relative z-30">
            <div className="container-px mx-auto max-w-7xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-wider shrink-0 select-none">
                  Browse Categories:
                </span>
                <div className="relative inline-block text-left w-full sm:w-auto" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-200 hover:border-[#2D6A4F]/40 hover:text-[#2D6A4F] text-gray-700 text-xs font-bold transition-all duration-200 cursor-pointer w-full sm:min-w-[240px] select-none"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm shrink-0">{currentCategoryItem.icon}</span>
                      <span className="whitespace-nowrap shrink-0">{currentCategoryItem.label}</span>
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${
                        categoryDropdownOpen ? "rotate-180 text-[#2D6A4F]" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {categoryDropdownOpen && (
                    <div className="absolute left-0 right-0 sm:right-auto mt-1 sm:w-[260px] bg-white border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.15)] z-50 overflow-hidden">
                      <div className="py-1 max-h-[300px] overflow-y-auto category-scrollbar">
                        {subNavItems.map((item, idx) => {
                          const isActive = item.label === currentCategoryItem.label;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                handleSubNavClick(item.search);
                                setCategoryDropdownOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold transition-all duration-150 cursor-pointer ${
                                isActive
                                  ? "bg-[#2D6A4F] text-white font-extrabold"
                                  : "text-gray-700 hover:bg-[#2D6A4F]/5 hover:text-[#2D6A4F]"
                              }`}
                            >
                              <span className="text-sm shrink-0">{item.icon}</span>
                              <span className="whitespace-nowrap shrink-0">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </header>

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
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 right-0 w-full max-w-xs bg-[#121212] shadow-2xl p-6 flex flex-col justify-between text-left z-50 border-l border-white/5"
              style={{ backgroundColor: '#121212', opacity: 1 }}
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <MqulimaLogo size={28} />
                    <span className="font-serif text-base font-bold tracking-wider text-white uppercase">MQULIMA</span>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Search input */}
                <div className="relative mb-6">
                  <form onSubmit={handleSearchSubmit} className="flex w-full">
                    <input
                      type="text"
                      placeholder="Search produce..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-l-full border border-white/10 bg-white/5 px-4 py-2.5 pl-9 text-xs text-white outline-none focus:border-[#2D6A4F] focus:bg-white/10 transition-all text-left"
                    />
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                    <button
                      type="submit"
                      className="rounded-r-full bg-[#F5A623] px-4 text-xs text-white font-bold hover:bg-[#E0951F] transition-colors"
                    >
                      Go
                    </button>
                  </form>
                  
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 rounded-md border border-white/10 bg-[#1A1A1A] p-1.5 shadow-lg z-50">
                      {suggestions.map((p) => (
                        <Link
                          key={p.id}
                          to="/shop/product/$slug"
                          params={{ slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || p.id }}
                          onClick={() => {
                            setSearchQuery("");
                            setOpen(false);
                          }}
                          className="flex items-center gap-2 py-1.5 hover:bg-white/5 rounded px-2"
                        >
                          <img
                            src={p.image}
                            className="w-6 h-6 rounded object-cover"
                            alt={p.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><rect width="100%" height="100%" fill="%23F4F6F4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-weight="bold" font-size="5" fill="%232D6A4F">MQ</text></svg>`;
                            }}
                          />
                          <span className="text-[11px] font-bold text-white truncate flex-1">{p.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <nav className="flex flex-col gap-1.5">
                  {navWithIcons.map((n) => {
                    const Icon = n.icon;
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3.5 rounded-xl px-5 py-3.5 text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors whitespace-nowrap"
                        activeProps={{
                          className: "flex items-center gap-3.5 rounded-xl px-5 py-3.5 text-sm font-bold bg-[#2D6A4F]/20 text-[#4CAF50] border-l-4 border-[#2D6A4F] whitespace-nowrap"
                        }}
                        activeOptions={{ exact: n.to === "/" }}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{n.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/10 pt-6 space-y-3">
                {user ? (
                  <>
                    <div className="text-[11px] text-white/50">Logged in as <strong className="text-white">{user.name}</strong></div>
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="block text-center rounded-xl bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-md hover:bg-[#224f3b] transition-colors"
                    >
                      My Dashboard
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block text-center rounded-xl bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-md hover:bg-[#224f3b] transition-colors"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#F5A623] py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors"
                  >
                    <Download className="h-4 w-4 text-[#F5A623]" /> Install App
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
