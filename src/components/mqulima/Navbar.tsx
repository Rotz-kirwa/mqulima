import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  ShoppingCart, Menu, X, User, Download, Search, Bell, ChevronDown,
  Home, ShoppingBag, Briefcase, BookOpen, Users as UsersIcon, FileText, Wrench, Sparkles,
  LogOut, LayoutDashboard, HelpCircle, ArrowRight, Check, ExternalLink
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { MqulimaLogo } from "./MqulimaLogo";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/lib/cart-context";
import { type ShopProduct } from "@/lib/shop-data";
import { searchProducts } from "@/lib/api/products.server";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type UserNotificationItem
} from "@/lib/api/user-notifications.server";

// Center Navigation Items
const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "AgroShop" },
  { to: "/academy", label: "Academy" },
  { to: "/blog", label: "News" },
  { to: "/community", label: "Forum" },
  { to: "/tools", label: "Tools" },
  { to: "/services", label: "Services" },
];

// Mobile Drawer Navigation Items with Brand Icons
const navWithIcons = [
  { to: "/", label: "Home", icon: Home, color: "text-emerald-400" },
  { to: "/shop", label: "AgroShop", icon: ShoppingBag, color: "text-amber-400" },
  { to: "/academy", label: "Academy", icon: BookOpen, color: "text-lime-400" },
  { to: "/blog", label: "Mqulima News", icon: FileText, color: "text-sky-400" },
  { to: "/community", label: "Mqulima Forum", icon: UsersIcon, color: "text-emerald-400" },
  { to: "/tools", label: "Mqulima Tools", icon: Wrench, color: "text-orange-400" },
  { to: "/services", label: "Services", icon: Briefcase, color: "text-[#85CC14]" },
];

const subNavItems: Array<{
  label: string;
  search: { category?: string };
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
  { label: "Water & Sanitation", search: { category: "Water & Sanitation" }, icon: "🚰" },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isShopPage = location.pathname.startsWith("/shop");
  const isCommunityPage = location.pathname.startsWith("/community");

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Search Spotlight Modal State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ShopProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dropdown States & Notifications
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [selectedNotifDetails, setSelectedNotifDetails] = useState<UserNotificationItem | null>(null);

  // Category dropdown state
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const { isInstallable, triggerInstall } = usePWA();
  const { user, logout } = useAuth();
  const { cartItems, setCartOpen } = useCart();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate unread notifications only if logged in
  const unreadNotifCount = user ? notifications.filter((n) => !n.read).length : 0;

  // Fetch logged-in user notifications from DB
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    let active = true;
    const fetchUserNotifs = async () => {
      try {
        setLoadingNotifs(true);
        const list = await getUserNotifications();
        if (active) {
          setNotifications(list);
        }
      } catch (err) {
        console.error("Error fetching user notifications", err);
      } finally {
        if (active) setLoadingNotifs(false);
      }
    };

    fetchUserNotifs();
    const interval = setInterval(fetchUserNotifs, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, notifDropdownOpen]);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click Outside listeners for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut (Cmd+K / Ctrl+K) for Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch search suggestions
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
          setSuggestions(results.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions", err);
      }
    };
    const timer = setTimeout(fetchSuggestions, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setSearchModalOpen(false);
    navigate({
      to: "/shop",
      search: {
        q: searchQuery || undefined,
        category: undefined,
        seller: undefined,
      } as any,
    });
  };

  const handleSubNavClick = (searchParams: any) => {
    navigate({
      to: "/shop",
      search: searchParams as any,
    });
  };

  const markAllNotificationsReadLocal = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const isPathActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const markAllUserNotificationsRead = async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead({ data: {} });
      toast.success("All notifications marked as read");
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifItemClick = async (n: UserNotificationItem) => {
    if (!user) return;

    // Optimistically update read state
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );

    try {
      await markNotificationRead({ data: { notificationId: n.id } });
    } catch (err) {
      console.error(err);
    }

    if (n.details) {
      setSelectedNotifDetails(n);
      setNotifDropdownOpen(false);
    } else if (n.link) {
      setNotifDropdownOpen(false);
      navigate({ to: n.link as any });
    }
  };

  return (
    <>
      {/* =========================================================================
         PREMIUM GLASSMORPHISM STICKY NAVBAR CONTAINER
         ========================================================================= */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ease-out select-none py-3.5 ${
          scrolled
            ? "bg-white/90 dark:bg-[#0B2117]/95 backdrop-blur-2xl border-b border-[#0B2117]/10 dark:border-white/10 shadow-[0_8px_32px_rgba(11,33,23,0.08)]"
            : "bg-white/75 dark:bg-[#0B2117]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* =========================================================================
             LEFT SECTION: Logo, Brand Name & Tagline
             ========================================================================= */}
          <Link to="/" className="group flex items-center gap-3 shrink-0 cursor-pointer">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="relative flex items-center justify-center"
            >
              <MqulimaLogo size={50} />
            </motion.div>
            <div className="flex flex-col justify-center text-left">
              <span className="font-serif text-lg sm:text-xl font-black tracking-wider text-[#0B2117] dark:text-white uppercase leading-none group-hover:text-[#16A34A] dark:group-hover:text-[#85CC14] transition-colors duration-200">
                MQULIMA
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium tracking-normal text-[#16A34A] dark:text-[#85CC14] lowercase italic mt-0.5 leading-none hidden sm:block font-sans">
                ...taking you first class
              </span>
            </div>
          </Link>

          {/* =========================================================================
             CENTER SECTION: Navigation Links with Animated Active Indicator Capsule
             ========================================================================= */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#0B2117]/[0.03] dark:bg-white/[0.05] p-1.5 rounded-full border border-black/[0.05] dark:border-white/10 backdrop-blur-md">
            {navLinks.map((n) => {
              const active = isPathActive(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className="relative px-4 py-2 text-xs font-extrabold tracking-wide uppercase transition-colors duration-200 rounded-full whitespace-nowrap cursor-pointer"
                >
                  {/* Floating active pill highlight */}
                  {active && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-[#0B2117] dark:bg-white/15 rounded-full shadow-[0_4px_16px_rgba(11,33,23,0.2)] border border-[#85CC14]/40"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Micro-hover animation wrapper */}
                  <motion.span
                    whileHover={{ y: -1, scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className={`relative z-10 block font-extrabold ${
                      active
                        ? "text-[#85CC14]"
                        : "text-[#0B2117]/80 dark:text-white/80 hover:text-[#0B2117] dark:hover:text-white"
                    }`}
                  >
                    {n.label}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          {/* =========================================================================
             RIGHT SECTION: Search, Notifications, Cart, Profile Chip
             ========================================================================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* 1. Rounded Search Pill Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0B2117]/[0.04] dark:bg-white/10 hover:bg-[#16382B]/10 dark:hover:bg-white/15 border border-[#0B2117]/10 dark:border-white/15 text-xs font-bold text-[#0B2117]/70 dark:text-white/80 transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Search className="h-3.5 w-3.5 text-[#16A34A] dark:text-[#85CC14]" />
              <span>Search Mqulima...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white dark:bg-white/20 text-[#0B2117] dark:text-white rounded border border-gray-200 dark:border-white/20 shadow-2xs">
                ⌘K
              </kbd>
            </motion.button>

            {/* Mobile Search Icon button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSearchModalOpen(true)}
              aria-label="Search"
              className="flex md:hidden grid h-9 w-9 place-items-center rounded-full bg-[#0B2117]/[0.05] dark:bg-white/10 text-[#0B2117] dark:text-white cursor-pointer"
            >
              <Search className="h-4 w-4 text-[#16A34A] dark:text-[#85CC14]" />
            </motion.button>

            {/* 2. Notifications Bell Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                aria-label="Notifications"
                className="relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#0B2117]/[0.04] dark:bg-white/10 hover:bg-[#0B2117]/10 dark:hover:bg-white/20 text-[#0B2117] dark:text-white transition-all duration-200 cursor-pointer border border-[#0B2117]/10 dark:border-white/10"
              >
                <Bell className="h-4 w-4 text-[#0B2117] dark:text-white" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#F57016] ring-2 ring-white dark:ring-[#0B2117] animate-pulse" />
                )}
              </motion.button>

              <AnimatePresence>
                {notifDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0F291E] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] z-50 text-left"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[#16A34A] dark:text-[#85CC14]" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#0B2117] dark:text-white">
                          Notifications
                        </span>
                      </div>
                      {user && unreadNotifCount > 0 && (
                        <button
                          onClick={markAllUserNotificationsRead}
                          className="text-[10px] font-bold text-[#16A34A] dark:text-[#85CC14] hover:underline cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {!user ? (
                      /* LOGGED OUT STATE: Strictly visible only when logged in */
                      <div className="py-6 px-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-white/10 text-[#16A34A] dark:text-[#85CC14] flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-black text-[#0B2117] dark:text-white uppercase tracking-wider">
                          Sign In Required
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-300 mt-1 max-w-[240px] mx-auto leading-relaxed">
                          Product purchases, service bookings, and order tracking details are private and accessible only to logged-in users.
                        </p>
                        <Link
                          to="/auth/sign-in"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#85CC14] text-[#0B2117] text-xs font-black hover:bg-[#74B510] transition-colors shadow-md cursor-pointer"
                        >
                          <span>Sign In to View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : (
                      /* LOGGED IN STATE: Real User Notifications */
                      <div className="py-2 divide-y divide-gray-100 dark:divide-white/5 max-h-84 overflow-y-auto">
                        {loadingNotifs && notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs font-bold text-gray-400 animate-pulse">
                            Loading your updates...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-gray-400">
                            <span className="block text-xl mb-1">🌾</span>
                            No notifications found yet.
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Your product purchases and service bookings will appear here.
                            </p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotifItemClick(n)}
                              className={`block p-3 rounded-xl transition-all cursor-pointer border border-transparent ${
                                !n.read
                                  ? "bg-[#16382B]/10 dark:bg-white/10 border-emerald-500/20"
                                  : "hover:bg-gray-50 dark:hover:bg-white/5"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${n.tagClass || "bg-gray-100 text-gray-700"}`}>
                                  {n.tag || "Update"}
                                </span>
                                <span className="text-[9px] font-mono text-gray-400 shrink-0">{n.time}</span>
                              </div>
                              <span className="block text-xs font-extrabold text-[#0B2117] dark:text-white leading-snug">{n.title}</span>
                              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-normal">{n.desc}</p>
                              
                              {n.details && (
                                <div className="mt-2 text-[10px] font-bold text-[#16A34A] dark:text-[#85CC14] flex items-center gap-1 hover:underline">
                                  <span>View full breakdown & details</span>
                                  <ArrowRight className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Floating Rounded Cart Icon Button */}
            {!isCommunityPage && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setCartOpen(true)}
                aria-label="Cart"
                className="relative grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#16382B] text-[#85CC14] border border-[#85CC14]/40 shadow-[0_4px_16px_rgba(22,56,43,0.3)] transition-all duration-200 cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                <AnimatePresence>
                  {mounted && cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#F57016] text-[10px] font-black text-white shadow-md border-2 border-white dark:border-[#0B2117]"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}

            {/* 4. Premium Profile Chip */}
            <div className="relative hidden sm:block" ref={userDropdownRef}>
              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-white/10 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#0B2117] to-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-[#85CC14]/50">
                  {user ? user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
                </div>
                <span className="text-xs font-bold text-[#0B2117] dark:text-white max-w-[100px] truncate">
                  {user ? user.name.split(" ")[0] : "Account"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </motion.button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0F291E] p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] z-50 text-left"
                  >
                    {user ? (
                      <>
                        <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 mb-1.5">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Signed in as</div>
                          <div className="text-xs font-extrabold text-[#0B2117] dark:text-white truncate mt-0.5">{user.email}</div>
                        </div>
                        <Link
                          to="/shop"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-[#16382B]/10 dark:hover:bg-white/10 text-[#0B2117] dark:text-white transition-colors"
                        >
                          <ShoppingBag className="h-4 w-4 text-[#16A34A] dark:text-[#85CC14]" />
                          <span>Shop Orders</span>
                        </Link>
                        <Link
                          to="/services"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-[#16382B]/10 dark:hover:bg-white/10 text-[#0B2117] dark:text-white transition-colors"
                        >
                          <Briefcase className="h-4 w-4 text-[#16A34A] dark:text-[#85CC14]" />
                          <span>Booked Services</span>
                        </Link>
                        <button
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            await logout();
                            toast.success("Successfully logged out");
                            navigate({ to: "/" });
                          }}
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/auth/sign-in"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold hover:bg-[#16382B]/10 dark:hover:bg-white/10 text-[#0B2117] dark:text-white transition-colors"
                        >
                          <span>Sign In</span>
                        </Link>
                        <Link
                          to="/auth/sign-up"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-black bg-[#85CC14] text-[#0B2117] hover:bg-[#74B510] transition-colors mt-1"
                        >
                          <span>Create Account</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger Menu Toggle Trigger */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-[#0B2117]/[0.05] dark:bg-white/10 text-[#0B2117] dark:text-white xl:hidden border border-black/5 dark:border-white/10"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>

          </div>
        </div>

        {/* =========================================================================
           SECONDARY JUMIA-STYLE MARKETPLACE HEADER (Only visible on Shop routes)
           ========================================================================= */}
        {isShopPage && (
          <div className="border-t border-gray-150 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#0B2117]/90 py-2.5 md:py-3.5 mt-2">
            <div className="px-3 md:px-4 mx-auto max-w-7xl flex items-center justify-between gap-3 md:gap-6">
              {/* Marketplace Search Bar */}
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
                      className="w-full h-9 md:h-11 pl-9 pr-3 rounded-l-md border border-gray-300 dark:border-white/20 bg-white dark:bg-white/10 text-xs md:text-sm focus:border-[#2D6A4F] outline-none transition-all text-left shadow-xs text-[#0B2117] dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 md:h-11 px-4 md:px-8 rounded-r-md bg-[#F5A623] hover:bg-[#E0951F] text-white font-bold text-[11px] md:text-xs uppercase tracking-wider transition-colors shrink-0 shadow-xs cursor-pointer"
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

              {/* Help Support */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setHelpDropdownOpen(!helpDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 dark:border-white/20 bg-white dark:bg-white/10 text-xs font-bold text-gray-700 dark:text-white hover:text-[#2D6A4F] transition-colors cursor-pointer shadow-xs"
                  >
                    <HelpCircle className="h-4.5 w-4.5 text-gray-500 dark:text-gray-300" />
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
                        <p className="text-[10px] text-gray-500 mt-1">Direct support & order queries</p>
                        <div className="h-px bg-gray-150 my-2" />
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

        {/* Sub Navbar Category Dropdown (Shop only) */}
        {isShopPage && (() => {
          const activeCategory = (location.search as any)?.category || undefined;
          const currentCategoryItem = subNavItems.find(item => {
            if (!item.search.category) return !activeCategory;
            return activeCategory === item.search.category;
          }) || subNavItems[0];

          return (
            <div className="border-y border-gray-200 dark:border-white/10 bg-[#F9FAF9] dark:bg-[#0B2117]/80 py-2 relative z-30">
              <div className="container-px mx-auto max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                  <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-wider shrink-0 select-none">
                    Browse Categories:
                  </span>
                  <div className="relative inline-block text-left w-full sm:w-auto" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="flex items-center justify-between gap-3 px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 hover:border-[#2D6A4F]/40 hover:text-[#2D6A4F] text-gray-700 dark:text-white text-xs font-bold transition-all duration-200 cursor-pointer w-full sm:min-w-[240px] select-none"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm shrink-0">{currentCategoryItem.icon}</span>
                        <span className="whitespace-nowrap shrink-0">{currentCategoryItem.label}</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${categoryDropdownOpen ? "rotate-180 text-[#2D6A4F]" : ""}`} />
                    </button>

                    {categoryDropdownOpen && (
                      <div className="absolute left-0 right-0 sm:right-auto mt-1 sm:w-[260px] bg-white border border-gray-200 shadow-xl z-50 overflow-hidden">
                        <div className="py-1 max-h-[300px] overflow-y-auto">
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

      {/* =========================================================================
         SPOTLIGHT SEARCH MODAL OVERLAY (Triggered via ⌘K or Search Pill)
         ========================================================================= */}
      <AnimatePresence>
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0F291E] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-gray-200 dark:border-white/15 overflow-hidden z-50 text-left p-6"
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-gray-100 dark:border-white/10 pb-4">
                <Search className="h-6 w-6 text-[#16A34A] dark:text-[#85CC14] shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search produce, feeds, seeds, machinery or tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-base sm:text-lg font-bold bg-transparent outline-none text-[#0B2117] dark:text-white placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>

              {/* Suggestions inside Modal */}
              <div className="mt-4 max-h-80 overflow-y-auto">
                {suggestions.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Product Matches ({suggestions.length})
                    </span>
                    {suggestions.map((p) => (
                      <Link
                        key={p.id}
                        to="/shop/product/$slug"
                        params={{ slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || p.id }}
                        onClick={() => setSearchModalOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#16382B]/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <img src={p.image} className="w-10 h-10 rounded-xl object-cover border border-gray-200" alt={p.name} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-[#0B2117] dark:text-white truncate">{p.name}</div>
                          <div className="text-xs text-[#16A34A] dark:text-[#85CC14] font-bold">KES {p.price.toLocaleString()}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                ) : searchQuery.trim() !== "" ? (
                  <div className="py-8 text-center text-sm font-bold text-gray-400">
                    No matching products found. Press Enter to view full marketplace search.
                  </div>
                ) : (
                  <div className="py-4 text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                      Popular Direct Links
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {["Maize Seeds", "Organic Fertilizer", "Poultry Feeds", "Drip Irrigation"].map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setSearchQuery(term)}
                          className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-[#16382B]/10 text-xs font-bold text-[#0B2117] dark:text-white transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
         FULL-SCREEN MOBILE ANIMATED SLIDE-OUT DRAWER MENU
         ========================================================================= */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 xl:hidden select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="absolute inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-[#0B2117] shadow-2xl p-6 flex flex-col justify-between text-left z-50 border-l border-emerald-500/20"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <MqulimaLogo size={42} />
                    <span className="font-serif text-lg font-black tracking-wider text-white uppercase">MQULIMA</span>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-2 rounded-full bg-white/10 text-white/70 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Navigation List */}
                <nav className="flex flex-col gap-2">
                  {navWithIcons.map((n) => {
                    const Icon = n.icon;
                    const active = isPathActive(n.to);
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3.5 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                          active
                            ? "bg-[#16382B] text-[#85CC14] border-l-4 border-[#85CC14] shadow-md"
                            : "text-white/90 hover:bg-[#16382B]/60 hover:text-[#85CC14]"
                        }`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${n.color}`} />
                        <span>{n.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Bottom Actions */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                {user ? (
                  <>
                    <div className="text-xs text-white/60">Logged in as <strong className="text-white font-extrabold">{user.name}</strong></div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setOpen(false)}
                        className="block text-center rounded-2xl bg-[#16382B] py-3 text-xs font-black text-white shadow-md hover:bg-[#1C4636] transition-colors border border-[#85CC14]/30"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={async () => {
                          setOpen(false);
                          await logout();
                          toast.success("Successfully logged out");
                          navigate({ to: "/" });
                        }}
                        className="block text-center rounded-2xl bg-red-600/90 py-3 text-xs font-black text-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/auth/sign-in"
                    onClick={() => setOpen(false)}
                    className="block text-center rounded-2xl bg-[#85CC14] py-3.5 text-xs font-black text-[#0B2117] shadow-lg hover:bg-[#74B510] transition-colors uppercase tracking-wider"
                  >
                    Sign In to Account
                  </Link>
                )}
                {isInstallable && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      triggerInstall();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#85CC14] py-3 text-xs font-bold text-[#85CC14] hover:bg-[#16382B] transition-colors"
                  >
                    <Download className="h-4 w-4 text-[#F5A623]" /> Install App
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
         NOTIFICATION FULL DETAILS MODAL OVERLAY (Detailed breakdown for purchases & bookings)
         ========================================================================= */}
      <AnimatePresence>
        {selectedNotifDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotifDetails(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0F291E] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-gray-200 dark:border-white/15 overflow-hidden z-50 text-left p-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedNotifDetails.tagClass || "bg-emerald-50 text-emerald-700"}`}>
                    {selectedNotifDetails.tag}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {selectedNotifDetails.time}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNotifDetails(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Title & Desc */}
              <div className="my-4">
                <h3 className="text-base font-black text-[#0B2117] dark:text-white leading-snug">
                  {selectedNotifDetails.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                  {selectedNotifDetails.desc}
                </p>
              </div>

              {/* Product Purchase Breakdown */}
              {selectedNotifDetails.type === "product_purchase" && selectedNotifDetails.details && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-150 dark:border-white/10 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                    <span className="font-mono text-[11px] font-bold text-gray-500">Order ID: #{selectedNotifDetails.details.shortOrderId || selectedNotifDetails.details.orderId?.slice(0, 8)}</span>
                    <span className="font-extrabold text-[#16A34A] dark:text-[#85CC14]">
                      Total: KES {(selectedNotifDetails.details.total || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Purchased Items List */}
                  {Array.isArray(selectedNotifDetails.details.items) && (
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1.5">
                        Purchased Product Items
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {selectedNotifDetails.details.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white dark:bg-white/10 p-2 rounded-xl border border-gray-100 dark:border-white/5 text-xs">
                            <span className="font-bold text-[#0B2117] dark:text-white truncate max-w-[200px]">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-mono font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                              KES {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery & Shipping Info */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Recipient</span>
                      <span className="font-bold text-[#0B2117] dark:text-white block mt-0.5">{selectedNotifDetails.details.fullName}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] block">{selectedNotifDetails.details.phone}</span>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Destination</span>
                      <span className="font-bold text-[#0B2117] dark:text-white block mt-0.5">{selectedNotifDetails.details.town}, {selectedNotifDetails.details.county}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] block">{selectedNotifDetails.details.paymentMethod?.toUpperCase()} payment</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Booking Breakdown */}
              {selectedNotifDetails.type === "service_request_submitted" && selectedNotifDetails.details && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-150 dark:border-white/10 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
                    <span className="font-mono text-[11px] font-bold text-gray-500">Ref: {selectedNotifDetails.details.reference}</span>
                    <span className="font-extrabold text-[#16A34A] dark:text-[#85CC14]">
                      Est. Cost: KES {(selectedNotifDetails.details.estimatedCost || 2500).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Service Type</span>
                      <span className="font-bold text-[#0B2117] dark:text-white block mt-0.5">{selectedNotifDetails.details.subserviceName || selectedNotifDetails.details.serviceName}</span>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Scheduled Date</span>
                      <span className="font-bold text-[#0B2117] dark:text-white block mt-0.5">{selectedNotifDetails.details.scheduledDate}</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/5 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 text-[11px]">
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Farm Location & Scale</span>
                    <span className="font-bold text-[#0B2117] dark:text-white block mt-0.5">
                      {selectedNotifDetails.details.location} &middot; {selectedNotifDetails.details.farmScale}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-[10px] block mt-0.5">
                      Specialist Contact: {selectedNotifDetails.details.contactPhone} ({selectedNotifDetails.details.contactName})
                    </span>
                  </div>

                  {selectedNotifDetails.details.notes && (
                    <div className="text-[10px] text-gray-500 italic bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/40">
                      "* {selectedNotifDetails.details.notes}"
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                <button
                  onClick={() => setSelectedNotifDetails(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  to={selectedNotifDetails.link as any}
                  onClick={() => setSelectedNotifDetails(null)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#85CC14] text-[#0B2117] text-xs font-black hover:bg-[#74B510] transition-colors shadow-md cursor-pointer"
                >
                  <span>Open {selectedNotifDetails.type === "product_purchase" ? "Shop" : "Services"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
