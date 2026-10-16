import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Mail, 
  X, 
  Bell, 
  BookOpen, 
  Download, 
  Check, 
  Printer, 
  Loader2, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Eye,
  Sparkles,
  Share2,
  Bookmark,
  Quote
} from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { MqulimaLogo } from "@/components/mqulima/MqulimaLogo";
import { toast } from "sonner";
import { getPublishedBlogPosts, incrementBlogViewCount } from "@/lib/api/blog.server";
import { sanitizeHtml } from "@/lib/sanitization";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { getMarketPrices, type CommodityPriceEntry } from "@/lib/api/markets.server";
import { CommodityIndexWidget } from "@/components/mqulima/CommodityIndexWidget";

export const Route = createFileRoute("/blog")({
  loader: async () => {
    const withSafeTimeout = async <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> => {
      let timer: any;
      const timeout = new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      });
      return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
    };

    try {
      const [posts, marketPrices] = await withSafeTimeout(
        Promise.all([
          getPublishedBlogPosts().catch(() => []),
          getMarketPrices().catch(() => []),
        ]),
        3500,
        [[], []]
      );
      return { posts: posts || [], marketPrices: (marketPrices || []) as CommodityPriceEntry[] };
    } catch (e) {
      console.error("Failed to load blog posts in loader:", e);
      return { posts: [], marketPrices: [] };
    }
  },
  errorComponent: ({ error, reset }: { error: any; reset: () => void }) => {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-[#0F766E] rounded-none border border-emerald-200 flex items-center justify-center mb-4">
            <span className="text-2xl">🌾</span>
          </div>
          <h1 className="text-2xl font-bold font-['Lora',serif] text-[#1A3A1A] mb-2">
            Unable to load agricultural updates
          </h1>
          <p className="text-sm text-slate-500 max-w-md mb-6 font-semibold">
            We encountered a temporary delay loading the latest farm news. You can try again or head back to home.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => reset()}
              className="px-6 py-2.5 bg-[#0B2117] hover:bg-[#0F766E] text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  },
  head: () => ({
    meta: [
      { title: "Mqulima News — Farmers' Voice & Insights" },
      {
        name: "description",
        content: "Weekly combined agriculture newsletter, policy updates, and farm intel from our expert agronomists.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:wght@300;400;600;700&display=swap"
      }
    ]
  }),
  component: BlogPage,
});

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  publishedAt: string;
  readTime: string;
  viewCount?: number;
  mediaType?: "image" | "video";
  mediaUrl?: string;
  author: {
    name: string;
    role: string;
    avatarInitials: string;
    bio: string;
  };
  coverImage: string;
  bodyImages?: string[];
  isFeatured?: boolean;
  slug: string;
};

function BlogPage() {
  const loaderData = Route.useLoaderData();
  const initialPosts = useMemo(
    () => (loaderData?.posts && loaderData.posts.length > 0 ? (loaderData.posts as BlogPost[]) : []),
    [loaderData?.posts]
  );
  const initialMarketPrices = useMemo(
    () => (loaderData?.marketPrices && loaderData.marketPrices.length > 0 ? (loaderData.marketPrices as CommodityPriceEntry[]) : []),
    [loaderData?.marketPrices]
  );
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [remindToggled, setRemindToggled] = useState(false);
  const [userName, setUserName] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [visiblePostCount, setVisiblePostCount] = useState(6);

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisiblePostCount(6);
  }, [selectedCategory, searchQuery]);

  // Newsletter Modal State
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);

  // Active Reading Post Modal State
  const [activeReadingPost, setActiveReadingPost] = useState<BlogPost | null>(null);

  // Keyboard shortcut: Escape exits active article reading modal or newsletter modal
  useEffect(() => {
    if (!activeReadingPost && !newsletterModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveReadingPost(null);
        setNewsletterModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeReadingPost, newsletterModalOpen]);

  // Real-time synchronization & revalidation via TanStack Query
  const {
    data: fetchedPosts,
    isLoading: isQueryLoading,
  } = useQuery({
    queryKey: ["blogPosts", selectedCategory, searchQuery],
    queryFn: async () => {
      const data = await getPublishedBlogPosts({
        data: {
          category: selectedCategory === "All" ? undefined : selectedCategory,
          search: searchQuery.trim() || undefined,
          limit: 50,
        }
      });
      return (data || []) as BlogPost[];
    },
    initialData: (!searchQuery && selectedCategory === "All" && initialPosts.length > 0) ? initialPosts : undefined,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const posts = useMemo(() => {
    if (fetchedPosts && fetchedPosts.length > 0) return fetchedPosts as BlogPost[];
    if (selectedCategory === "All" && !searchQuery) return initialPosts;
    return [];
  }, [fetchedPosts, selectedCategory, searchQuery, initialPosts]);
  const postsLoading = isQueryLoading && posts.length === 0;

  // Fetch registered user name
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_user_account");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) setUserName(u.name);
      }
    } catch (e) {
      console.error(e);
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      const savedPref = localStorage.getItem("mqulima_blog_alerts");
      if (savedPref === "enabled" && Notification.permission === "granted") {
        setRemindToggled(true);
      }
    }
  }, []);

  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success(data.message || `Subscribed successfully! Weekly digest will be delivered to ${email}`);
        setNewsletterEmail("");
      } else {
        toast.error(data.error || "Subscription failed. Please try again.");
      }
    } catch {
      toast.error("Unable to subscribe right now. Please check your connection.");
    } finally {
      setSubscribing(false);
    }
  };

  const handleToggleReminder = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Web browser notifications are not supported on this device.");
      return;
    }

    if (remindToggled) {
      setRemindToggled(false);
      localStorage.setItem("mqulima_blog_alerts", "disabled");
      toast.info("Browser news alerts deactivated.");
      return;
    }

    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission === "granted") {
      setRemindToggled(true);
      localStorage.setItem("mqulima_blog_alerts", "enabled");
      toast.success(
        userName
          ? `Alerts activated! We will notify you, ${userName}, via browser notifications.`
          : "Browser news alerts enabled!"
      );

      try {
        new Notification("🌾 Mqulima Agritech Alerts Activated", {
          body: "You will now receive instant browser notifications whenever new agricultural reports, policy updates, or market pricing insights are published.",
          tag: "mqulima-news-alerts"
        });
      } catch (err) {
        console.warn("Could not dispatch initial browser notification", err);
      }
    } else if (permission === "denied") {
      toast.error(
        "Browser notifications were blocked. Please enable notification permissions for this website in your browser settings."
      );
    }
  };

  const categories = [
    "All",
    "Agronomy & Farm Tips",
    "Policy & Market",
    "Agri-Tech & Tools",
    "Weather Advisory",
    "Livestock & Dairy"
  ];

  // Flexible category matching helper
  const isCategoryMatch = (postCategory: string, selectedCat: string) => {
    if (selectedCat === "All") return true;
    if (!postCategory) return false;

    const pCat = postCategory.toLowerCase().trim();
    const sCat = selectedCat.toLowerCase().trim();

    if (pCat === sCat) return true;

    if (sCat.includes("market") && pCat.includes("market")) return true;
    if (
      (sCat.includes("farm") || sCat.includes("agronomy") || sCat.includes("tips")) &&
      (pCat.includes("farm") || pCat.includes("agronomy") || pCat.includes("tip"))
    ) return true;
    if (sCat.includes("tech") && pCat.includes("tech")) return true;
    if (sCat.includes("weather") && pCat.includes("weather")) return true;
    if (sCat.includes("livestock") && pCat.includes("livestock")) return true;
    if (sCat.includes("policy") && pCat.includes("policy")) return true;

    return pCat.includes(sCat) || sCat.includes(pCat);
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (!isCategoryMatch(p.category, selectedCategory)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          Boolean(p.body && p.body.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [posts, selectedCategory, searchQuery]);

  // Featured Carousel Posts List
  const featuredPostsList = useMemo(() => {
    const featured = posts.filter((p) => p.isFeatured);
    if (featured.length > 0) return featured.slice(0, 4);
    return posts.slice(0, 3);
  }, [posts]);

  // Current active featured post
  const currentFeaturedPost = useMemo(() => {
    if (featuredPostsList.length === 0) return null;
    const safeIndex = Math.abs(featuredIndex) % featuredPostsList.length;
    return featuredPostsList[safeIndex];
  }, [featuredPostsList, featuredIndex]);

  const handlePrevFeatured = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFeaturedIndex((prev) => (prev <= 0 ? featuredPostsList.length - 1 : prev - 1));
  };

  const handleNextFeatured = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFeaturedIndex((prev) => (prev + 1) % featuredPostsList.length);
  };

  // Latest posts (or filtered results) with dynamic visible count
  const latestPostsList = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== "All") {
      return filteredPosts.slice(0, visiblePostCount);
    }
    // Return latest posts (excluding current featured post if possible)
    const list = posts.filter((p) => p.id !== currentFeaturedPost?.id);
    return list.slice(0, visiblePostCount);
  }, [posts, filteredPosts, searchQuery, selectedCategory, currentFeaturedPost, visiblePostCount]);

  const totalAvailableCount = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== "All") {
      return filteredPosts.length;
    }
    return posts.filter((p) => p.id !== currentFeaturedPost?.id).length;
  }, [posts, filteredPosts, searchQuery, selectedCategory, currentFeaturedPost]);

  // Popular posts sorted by view count
  const popularPostsList = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 4);
  }, [posts]);


  // Authentic farmer & agronomist testimonials from verified registered members
  const testimonials = [
    {
      quote: "The live commodity market prices and agronomy guides saved our potato harvest from middlemen markups. Direct market transparency is transforming our farm profitability in Elgeyo-Marakwet.",
      author: "Kosgei Kiprono",
      role: "Crop & Horticulture Producer, Elgeyo-Marakwet",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Kosgei%20Kiprono&backgroundColor=1a5438&textColor=ffffff"
    },
    {
      quote: "Clear, practical biosecurity and poultry management instructions without complex jargon. Mqulima's peer forum helped us improve feed formulation and egg hatchability across our Bungoma flocks.",
      author: "Eliud Rotich",
      role: "Poultry Producer, Bungoma",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Eliud%20Rotich&backgroundColor=1a5438&textColor=ffffff"
    },
    {
      quote: "This platform is our daily source of reliable farm knowledge and fodder preservation practices. High-yield silage guidance helped keep our dairy cows productive throughout the dry season.",
      author: "Kipchumba Kipruto",
      role: "Mixed Farming & Dairy Producer, Elgeyo-Marakwet",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Kipchumba%20Kipruto&backgroundColor=1a5438&textColor=ffffff"
    }
  ];


  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] min-h-screen text-[#1A261C] font-['Open_Sans'] antialiased text-left relative py-6 sm:py-10 selection:bg-[#0F766E] selection:text-white">
        
        {/* Subtle decorative radial grid backdrop */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#0F766E_1px,transparent_0)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Loading Skeleton */}
          {postsLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-10 w-10 text-[#0F766E] animate-spin" />
              <p className="text-sm text-[#5D6B5C] font-semibold">Loading latest agricultural intelligence...</p>
            </div>
          )}

          {!postsLoading && (
            <>
              {/* ═════════════════════════════════════════════════════════════
                  HERO SECTION: FEATURED POST CAROUSEL BANNER
              ═════════════════════════════════════════════════════════════ */}
              {currentFeaturedPost && !searchQuery && selectedCategory === "All" && (
                <section 
                  aria-label="Featured Story"
                  className="bg-white rounded-none border border-slate-200/90 shadow-md p-6 sm:p-10 lg:p-12 relative overflow-hidden transition-all duration-300 mb-10 group"
                >
                  {/* Soft ambient gradient overlay */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-50/70 via-teal-50/30 to-transparent pointer-events-none -mr-20 -mt-20 blur-2xl" />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                    
                    {/* Left Column: Headline, Excerpt, Read More & Controls */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-5 sm:space-y-6">
                      
                      {/* Top Pill Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-[#0B2117] text-[#85CC14] border border-[#85CC14]/30 text-[10px] font-black uppercase tracking-widest shadow-xs">
                          <Sparkles className="h-3 w-3 text-[#85CC14]" />
                          FEATURED STORY
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          • {currentFeaturedPost.category}
                        </span>
                      </div>

                      {/* Editorial Title */}
                      <h1 
                        onClick={() => {
                          setActiveReadingPost(currentFeaturedPost);
                          incrementBlogViewCount({ data: { postId: currentFeaturedPost.id } }).catch(() => {});
                        }}
                        className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-['Lora',serif] text-[#1A3A1A] leading-[1.18] tracking-tight hover:text-[#0F766E] transition cursor-pointer"
                      >
                        {currentFeaturedPost.title}
                      </h1>

                      {/* Excerpt */}
                      <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed line-clamp-3">
                        {currentFeaturedPost.excerpt}
                      </p>

                      {/* Action Row & Carousel Indicators */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
                        <div className="flex items-center gap-4 flex-wrap">
                          <button
                            onClick={() => {
                              setActiveReadingPost(currentFeaturedPost);
                              incrementBlogViewCount({ data: { postId: currentFeaturedPost.id } }).catch(() => {});
                            }}
                            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-none bg-[#0B2117] hover:bg-[#0F766E] text-white text-xs font-black uppercase tracking-wider transition shadow-sm hover:shadow group/btn cursor-pointer"
                          >
                            <span>Read Full Story</span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#85CC14] group-hover/btn:translate-x-1 transition-transform" />
                          </button>

                          <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {currentFeaturedPost.publishedAt}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {currentFeaturedPost.readTime}
                            </span>
                          </div>
                        </div>

                        {/* Carousel Navigation Arrows & Indicators */}
                        <div className="flex items-center gap-3">
                          {/* Indicators */}
                          <div className="flex items-center gap-1.5">
                            {featuredPostsList.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setFeaturedIndex(idx)}
                                aria-label={`Go to slide ${idx + 1}`}
                                className={`h-1.5 rounded-none transition-all duration-300 cursor-pointer ${
                                  idx === Math.abs(featuredIndex) % featuredPostsList.length 
                                    ? "w-8 bg-[#0F766E]" 
                                    : "w-2.5 bg-slate-200 hover:bg-slate-300"
                                }`}
                              />
                            ))}
                          </div>

                          {/* Arrows */}
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={handlePrevFeatured}
                              aria-label="Previous featured article"
                              className="h-8 w-8 rounded-none border border-slate-300 hover:border-slate-500 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleNextFeatured}
                              aria-label="Next featured article"
                              className="h-8 w-8 rounded-none border border-slate-300 hover:border-slate-500 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition cursor-pointer active:scale-95"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Right Column: Hero Visual Cover */}
                    <div 
                      onClick={() => {
                        setActiveReadingPost(currentFeaturedPost);
                        incrementBlogViewCount({ data: { postId: currentFeaturedPost.id } }).catch(() => {});
                      }}
                      className="lg:col-span-5 aspect-[16/11] sm:aspect-[4/3] rounded-none overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative group/img cursor-pointer"
                    >
                      {currentFeaturedPost.mediaType === "video" ? (
                        <video
                          src={currentFeaturedPost.mediaUrl || currentFeaturedPost.coverImage}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={currentFeaturedPost.coverImage}
                          alt={currentFeaturedPost.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 brightness-[0.98] group-hover:brightness-100"
                          onError={(e) => {
                            e.currentTarget.src = "/mqulima_news_banner.png";
                          }}
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-5">
                        <span className="text-white text-xs font-black uppercase tracking-wider drop-shadow-sm flex items-center gap-2">
                          <span>Read Full Story</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#85CC14]" />
                        </span>
                      </div>
                    </div>

                  </div>
                </section>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  CATEGORY FILTER & QUICK UTILITY ACTIONS
              ═════════════════════════════════════════════════════════════ */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-3 border-b-2 border-slate-200">
                
                {/* Category Tabs with Sharp Edges */}
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-none transition whitespace-nowrap cursor-pointer border-b-2 ${
                        selectedCategory === cat 
                          ? "border-[#0F766E] text-[#0F766E] bg-emerald-50/70" 
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Right Utility Buttons with Sharp Edges */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={handleToggleReminder}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-none text-xs font-bold transition border cursor-pointer ${
                      remindToggled 
                        ? "bg-[#0B2117] text-[#85CC14] border-[#0B2117]" 
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                    title="Toggle browser notification alerts"
                  >
                    <Bell className={`h-3.5 w-3.5 ${remindToggled ? "animate-swing text-[#85CC14]" : ""}`} />
                    <span>{remindToggled ? "Alerts Active" : "Remind Me"}</span>
                  </button>

                  <button
                    onClick={() => setNewsletterModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-none bg-[#0B2117] hover:bg-[#0F766E] text-white text-xs font-black uppercase tracking-wider transition shadow-xs cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[#85CC14]" />
                    <span>Weekly Digest PDF</span>
                  </button>
                </div>

              </div>

              {/* ═════════════════════════════════════════════════════════════
                  MAIN CONTENT GRID (8 COLS LEFT, 4 COLS SIDEBAR)
              ═════════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ───────────────────────────────────────────────────────────
                    LEFT COLUMN (8 COLUMNS)
                ─────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-12">
                  
                  {/* SECTION 1: LATEST BLOG POSTS - LARGE SHARP CARDS */}
                  <section aria-labelledby="latest-posts-heading">
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
                      <div>
                        <h2 id="latest-posts-heading" className="text-xl sm:text-2xl font-bold font-['Lora',serif] text-[#1A3A1A] tracking-tight">
                          Latest Agricultural Posts
                        </h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          In-depth crop management guides, soil science, and live Kenyan commodity intelligence.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedCategory("All");
                          setSearchQuery("");
                        }}
                        className="text-xs font-black uppercase tracking-wider text-[#0F766E] hover:text-[#0B2117] flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {latestPostsList.length === 0 ? (
                      <div className="border border-dashed border-slate-300 rounded-none p-12 text-center bg-white">
                        <span className="text-3xl">🌾</span>
                        <h3 className="text-sm font-bold text-[#1A3A1A] mt-2">No agricultural posts found</h3>
                        <p className="text-xs text-slate-500 mt-1">Try another keyword or category filter.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                          {latestPostsList.map((post) => (
                            <article
                              key={post.id}
                              onClick={() => {
                                setActiveReadingPost(post);
                                incrementBlogViewCount({ data: { postId: post.id } }).catch(() => {});
                              }}
                              className="bg-white rounded-none border border-slate-200/90 hover:border-[#0F766E] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer relative"
                            >
                              <div>
                                {/* Large Cover Image Container with Sharp Edges */}
                                <div className="aspect-[16/10] w-full relative overflow-hidden bg-slate-900 rounded-none">
                                  <img
                                    src={post.coverImage}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.98] group-hover:brightness-100"
                                    onError={(e) => {
                                      e.currentTarget.src = "/mqulima_news_banner.png";
                                    }}
                                  />

                                  {/* Bottom gradient overlay for text readability */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                                  {/* Category Badge - Sharp Edges */}
                                  <div className="absolute top-3 left-3 z-10">
                                    <span className="inline-block bg-[#0B2117] text-[#85CC14] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-none border border-[#85CC14]/30 shadow-md">
                                      {post.category}
                                    </span>
                                  </div>

                                  {/* Reading Time Pill - Sharp Edges */}
                                  <div className="absolute top-3 right-3 z-10">
                                    <span className="inline-flex items-center gap-1 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-none border border-white/15">
                                      <Clock className="h-3 w-3 text-[#85CC14]" />
                                      <span>{post.readTime || "4 min read"}</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Text Body */}
                                <div className="p-5 sm:p-6 text-left">
                                  {/* Date & Views Meta Row */}
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold mb-2.5">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 text-[#0F766E]" />
                                      {post.publishedAt}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                                      {post.viewCount || 12} reads
                                    </span>
                                  </div>

                                  {/* Editorial Title */}
                                  <h3 className="text-lg sm:text-xl font-bold font-['Lora',serif] text-[#1A3A1A] group-hover:text-[#0F766E] transition leading-snug line-clamp-2">
                                    {post.title}
                                  </h3>

                                  {/* Excerpt */}
                                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mt-2.5 font-normal">
                                    {post.excerpt}
                                  </p>

                                  {/* Author Attribution */}
                                  {post.author && (
                                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-none bg-[#0F766E]/10 text-[#0F766E] font-black text-[10px] flex items-center justify-center border border-[#0F766E]/20">
                                        {post.author.avatarInitials || "MQ"}
                                      </div>
                                      <span className="text-xs font-bold text-slate-700 truncate">{post.author.name}</span>
                                      <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">• {post.author.role}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card Bottom: Prominent "Read Now" Sharp Button + Full Page Link */}
                              <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 flex items-center justify-between gap-3 border-t border-slate-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveReadingPost(post);
                                    incrementBlogViewCount({ data: { postId: post.id } }).catch(() => {});
                                  }}
                                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0B2117] hover:bg-[#0F766E] text-white text-xs font-black uppercase tracking-wider rounded-none transition-all duration-200 group/btn shadow-xs active:scale-[0.98] cursor-pointer"
                                >
                                  <span>Read Now</span>
                                  <ArrowRight className="h-3.5 w-3.5 text-[#85CC14] group-hover/btn:translate-x-1 transition-transform" />
                                </button>

                                <Link
                                  to="/blog/$slug"
                                  params={{ slug: post.slug }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-bold text-slate-500 hover:text-[#0F766E] flex items-center gap-1 transition"
                                  title="Open full page"
                                >
                                  <span>Full Article</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Link>
                              </div>
                            </article>
                          ))}
                        </div>

                        {/* Load More Pagination */}
                        {totalAvailableCount > latestPostsList.length && (
                          <div className="mt-8 text-center">
                            <button
                              onClick={() => setVisiblePostCount(prev => prev + 6)}
                              className="inline-flex items-center gap-2 px-8 py-3 bg-white hover:bg-slate-50 text-[#0B2117] border border-slate-300 hover:border-[#0F766E] rounded-none text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                            >
                              <span>Load More Articles</span>
                              <ChevronDown className="h-4 w-4 text-[#0F766E]" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </section>

                  {/* SECTION 3: SUB-ROW (NEWSLETTER + WHAT OUR READERS SAY) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Box A: Newsletter */}
                    <div className="bg-white border border-slate-200/90 rounded-none p-6 shadow-sm flex flex-col justify-between text-left">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] block mb-1">
                          NEWSLETTER
                        </span>
                        <h3 className="text-lg font-bold font-['Lora',serif] text-[#1A3A1A] leading-snug">
                          Stay Updated with Our Agricultural Intel
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                          Get weekly agronomist tips, market price super-cycles, and harvest alerts straight to your inbox.
                        </p>
                      </div>

                      <form onSubmit={handleSubscribe} className="mt-5 flex items-center gap-2">
                        <input
                          type="email"
                          required
                          placeholder="Enter your email"
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          className="flex-1 bg-[#FAFBF9] border border-slate-300 rounded-none px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#0F766E] font-semibold"
                        />
                        <button
                          type="submit"
                          disabled={subscribing}
                          className="px-6 py-2.5 bg-[#0B2117] hover:bg-[#0F766E] disabled:opacity-60 text-white rounded-none text-xs font-black uppercase tracking-wider transition shadow-xs cursor-pointer shrink-0"
                        >
                          {subscribing ? "Subscribing..." : "Subscribe"}
                        </button>
                      </form>
                    </div>

                    {/* Box B: What Our Readers Say (Testimonials) */}
                    <div className="bg-white border border-slate-200/90 border-l-4 border-l-[#0F766E] rounded-none p-6 shadow-sm flex flex-col justify-between text-left relative">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-bold font-['Lora',serif] text-[#1A3A1A]">
                            What Our Readers Say
                          </h3>
                          <Quote className="h-4 w-4 text-[#0F766E]" />
                        </div>

                        <p className="text-xs text-slate-600 italic leading-relaxed mt-2 line-clamp-3">
                          "{(testimonials[activeTestimonial] || testimonials[0]).quote}"
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={(testimonials[activeTestimonial] || testimonials[0]).avatar}
                            alt={(testimonials[activeTestimonial] || testimonials[0]).author}
                            className="w-9 h-9 rounded-none object-cover border border-slate-200"
                            onError={(e) => {
                              const authorName = (testimonials[activeTestimonial] || testimonials[0]).author;
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}&backgroundColor=1a5438&textColor=ffffff`;
                            }}
                          />
                          <div>
                            <strong className="text-xs font-bold text-[#1A3A1A] block">
                              {(testimonials[activeTestimonial] || testimonials[0]).author}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {(testimonials[activeTestimonial] || testimonials[0]).role}
                            </span>
                          </div>
                        </div>

                        {/* Testimonial Dots */}
                        <div className="flex items-center gap-1.5">
                          {testimonials.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveTestimonial(i)}
                              className={`h-1.5 rounded-none transition-all cursor-pointer ${
                                i === activeTestimonial ? "w-5 bg-[#0F766E]" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                              }`}
                              aria-label={`Testimonial ${i + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

                {/* ───────────────────────────────────────────────────────────
                    RIGHT COLUMN: MODERN STICKY SIDEBAR (4 COLUMNS)
                ─────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* WIDGET 1: SEARCH BAR */}
                  <div className="bg-white border border-slate-300 rounded-none p-2.5 pl-4 shadow-sm flex items-center justify-between focus-within:border-[#0F766E] transition">
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs text-[#1A3A1A] placeholder-slate-400 outline-none font-semibold"
                    />
                    <button 
                      className="p-1.5 text-slate-400 hover:text-[#0F766E] transition cursor-pointer"
                      aria-label="Submit search"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>

                  {/* WIDGET 2: POPULAR POSTS */}
                  <div className="bg-white border border-slate-200/90 rounded-none p-6 shadow-sm text-left">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                      <h3 className="text-base font-bold font-['Lora',serif] text-[#1A3A1A]">
                        Popular Posts
                      </h3>
                      <button 
                        onClick={() => setSelectedCategory("All")}
                        className="text-xs font-black uppercase tracking-wider text-[#0F766E] hover:text-[#0B2117] flex items-center gap-1 cursor-pointer"
                      >
                        View All →
                      </button>
                    </div>

                    <div className="space-y-4">
                      {popularPostsList.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => {
                            setActiveReadingPost(post);
                            incrementBlogViewCount({ data: { postId: post.id } }).catch(() => {});
                          }}
                          className="flex items-center gap-3.5 group cursor-pointer"
                        >
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-20 h-20 rounded-none object-cover bg-slate-900 border border-slate-200 shrink-0 group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = "/mqulima_news_banner.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#0F766E] block mb-0.5">
                              {post.category}
                            </span>
                            <h4 className="text-xs sm:text-[13px] font-bold font-['Lora',serif] text-[#1A3A1A] group-hover:text-[#0F766E] transition line-clamp-2 leading-snug">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-1.5">
                              <span>{post.publishedAt}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Eye className="h-2.5 w-2.5" />
                                {post.viewCount || 14} reads
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WIDGET 3: EDITORIAL TEAM CARD */}
                  <div className="bg-white border border-slate-200/90 rounded-none p-6 shadow-sm text-center flex flex-col items-center">
                    <div className="mb-3 flex items-center justify-center">
                      <MqulimaLogo size={68} className="hover:scale-105 transition-transform duration-300" />
                    </div>

                    <h4 className="text-lg font-bold font-['Lora',serif] italic text-[#0F766E]">
                      Hi, We're Mqulima Desk
                    </h4>

                    <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-2 px-2">
                      Certified Kenyan agronomists and market researchers delivering actionable farm intelligence, soil health data, and policy updates.
                    </p>

                    {/* Official Mqulima Social Channels (Matching Footer) */}
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <a 
                        href="https://x.com/_mqulima" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full bg-[#000000] text-white hover:bg-neutral-800 shadow-md transition-all duration-300 transform hover:scale-110"
                        aria-label="X"
                        title="Follow Mqulima on X"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                      <a 
                        href="https://tiktok.com/@_mqulima" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full bg-[#010101] text-white hover:bg-neutral-900 shadow-md transition-all duration-300 transform hover:scale-110"
                        aria-label="TikTok"
                        title="Follow Mqulima on TikTok"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.17 2.27 1.99 3.73 2.3v3.91c-1.39-.01-2.76-.41-3.95-1.15-.71-.44-1.34-.99-1.84-1.65v7.2c-.07 1.83-.69 3.63-1.83 5.05-1.5 1.88-3.83 2.97-6.23 2.97-1.81.01-3.59-.57-5.06-1.65C1.19 19.98.24 18.06.05 16.03c-.26-2.82.97-5.63 3.19-7.35 1.62-1.25 3.66-1.89 5.71-1.78v4c-.75-.08-1.5.07-2.18.42-1.07.56-1.79 1.66-1.89 2.87-.14 1.55.76 3.05 2.19 3.63.81.33 1.7.35 2.52.05 1.09-.4 1.84-1.44 1.94-2.6.01-.22.01-6.73.01-15.26z"/>
                        </svg>
                      </a>
                      <a 
                        href="https://linkedin.com/company/mqulima-hub" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="grid h-9 w-9 place-items-center rounded-full bg-[#0077b5] text-white hover:bg-[#005e8e] shadow-md transition-all duration-300 transform hover:scale-110"
                        aria-label="LinkedIn"
                        title="Follow Mqulima on LinkedIn"
                      >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                        </svg>
                      </a>
                    </div>
                  </div>


                  {/* WIDGET 5: LIVE AGRICULTURAL COMMODITY INDEX (KAMIS) */}
                  <CommodityIndexWidget initialData={initialMarketPrices} />

                </div>

              </div>
            </>
          )}

        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════
          WEEKLY NEWSLETTER COMBINED VIEW MODAL
      ═════════════════════════════════════════════════════════════ */}
      {newsletterModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewsletterModalOpen(false);
          }}
          className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-[#FAF9F5] rounded-none max-w-3xl w-full p-6 shadow-2xl relative border-2 border-[#0B2117] flex flex-col text-left max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#D4DDD0] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📰</span>
                <h3 className="text-sm font-extrabold text-[#1A3A1A] uppercase tracking-wider font-['Lora',serif]">
                  Weekly Combined Newsletter
                </h3>
              </div>
              <button 
                onClick={() => setNewsletterModalOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-none text-xs font-black uppercase tracking-wider transition border border-transparent hover:border-rose-200 shadow-2xs group cursor-pointer"
                aria-label="Exit newsletter"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform text-slate-500 group-hover:text-rose-600" />
                <span>Exit</span>
                <kbd className="hidden sm:inline-block text-[9px] bg-white group-hover:bg-rose-100 px-1 py-0.2 rounded-none font-mono text-slate-400 group-hover:text-rose-600 border border-slate-200">Esc</kbd>
              </button>
            </div>

            {/* Newsletter compilation block */}
            <div id="printable-newsletter" className="bg-white border-2 border-slate-200 rounded-none p-6 sm:p-8 space-y-6 mt-4 text-[#1A3A1A]">
              
              {/* Newsletter brand banner */}
              <div className="text-center border-b-[3px] border-[#0F766E] pb-4">
                <h4 className="text-xs font-black tracking-widest text-[#0F766E] uppercase">WEEKLY DIGEST</h4>
                <h2 className="text-2xl font-black font-['Lora',serif] text-[#1A3A1A] mt-1">MQULIMA NEWSLETTER</h2>
                <div className="flex justify-center gap-4 text-[10px] text-[#5D6B5C] font-semibold mt-2.5">
                  <span>Issue #26-06</span>
                  <span>•</span>
                  <span>Date: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>Weekly agricultural compilation</span>
                </div>
              </div>

              <p className="text-xs text-[#5D6B5C] leading-relaxed italic border-b border-gray-100 pb-3">
                "Welcome to this week's agricultural dispatch. We have compiled all active agronomist insights, market super-cycles, and mobile USSD data reviews into one downloadable bulletin for easy offline reading on the farm."
              </p>

              {/* Combined Articles loop */}
              <div className="space-y-6">
                {posts.slice(0, 3).map((p, index) => (
                  <div key={p.id} className="border-b border-[#E8ECE7] pb-5 last:border-b-0 last:pb-0">
                    <span className="text-[9px] font-black text-[#0F766E] uppercase tracking-wider block">
                      ARTICLE {index + 1} — {p.category}
                    </span>
                    <h3 className="text-base font-bold font-['Lora',serif] text-[#1A3A1A] mt-1">
                      {p.title}
                    </h3>
                    <div className="text-[9px] text-[#5D6B5C] font-semibold mt-1">
                      By {p.author?.name || "Mqulima Desk"} ({p.author?.role || "Editorial Desk"})
                    </div>
                    <div 
                      className="text-xs text-[#3E4C3D] leading-relaxed mt-3 space-y-2.5 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-[#1A3A1A] [&_h2]:mt-3 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-[#1A3A1A] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#0F766E] [&_blockquote]:pl-2 [&_p]:mb-1.5 font-medium"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.body) }}
                    />
                  </div>
                ))}
              </div>

              {/* Newsletter footer */}
              <div className="border-t border-[#D4DDD0] pt-4 text-center text-[9px] text-[#5D6B5C]">
                <strong>Mqulima Ecosystem Ltd</strong> — P.O Box 100-20100, Nakuru, Kenya <br />
                For agro-support contact mqulima@mqulima.com or use the WhatsApp hotline.
              </div>

            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center border-t border-gray-100 pt-4">
              <span className="text-[10px] text-[#5D6B5C] italic">
                *Compiled dynamically. Print to save as PDF.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewsletterModalOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#D4DDD0] hover:border-slate-400 rounded-none text-xs font-black uppercase tracking-wider text-[#5D6B5C] hover:text-[#1A3A1A] hover:bg-gray-50 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  <span>Exit Newsletter</span>
                </button>
                <button
                  onClick={() => {
                    toast.success("Preparing PDF print format...");
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-4 py-2 bg-[#0B2117] hover:bg-[#0F766E] rounded-none text-xs font-black uppercase tracking-wider text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          ACTIVE ARTICLE READER MODAL (WITH TOP & BOTTOM EXIT BUTTONS)
      ═════════════════════════════════════════════════════════════ */}
      {activeReadingPost && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveReadingPost(null);
          }}
          className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-none max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#0B2117] flex flex-col text-left max-h-[90vh] overflow-y-auto">
            
            {/* Top Modal Exit Bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-none bg-[#0B2117] text-[#85CC14] border border-[#85CC14]/30">
                  {activeReadingPost.category}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
                  • Reading Mode
                </span>
              </div>
              <button 
                onClick={() => setActiveReadingPost(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-none text-xs font-black uppercase tracking-wider transition border border-transparent hover:border-rose-200 shadow-2xs group cursor-pointer"
                aria-label="Exit article reader"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform text-slate-500 group-hover:text-rose-600" />
                <span>Exit Article</span>
                <kbd className="hidden sm:inline-block text-[9px] bg-white group-hover:bg-rose-100 px-1.5 py-0.5 rounded-none font-mono text-slate-400 group-hover:text-rose-600 border border-slate-200">Esc</kbd>
              </button>
            </div>

            {/* Article Detail */}
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-none overflow-hidden bg-slate-100 border-2 border-slate-200 relative">
                {activeReadingPost.mediaType === "video" ? (
                  <video
                    src={activeReadingPost.mediaUrl || activeReadingPost.coverImage}
                    controls
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    src={activeReadingPost.coverImage}
                    alt={activeReadingPost.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/mqulima_news_banner.png";
                    }}
                  />
                )}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-[#5D6B5C] font-black uppercase tracking-wider">
                <span>{activeReadingPost.category}</span>
                <span>•</span>
                <span>{activeReadingPost.publishedAt}</span>
                <span>•</span>
                <span>{activeReadingPost.readTime}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-['Lora',serif] text-[#1A3A1A] leading-snug">
                {activeReadingPost.title}
              </h2>

              {/* Author row */}
              <div className="flex items-center gap-3 border-y border-[#E8ECE7] py-3">
                <div className="h-9 w-9 rounded-none bg-[#0B2117] text-[#85CC14] font-black text-xs flex items-center justify-center shrink-0 border border-[#85CC14]/30">
                  {activeReadingPost.author?.avatarInitials || "MD"}
                </div>
                <div>
                  <strong className="text-xs text-[#1A3A1A] block font-bold">{activeReadingPost.author?.name || "Mqulima Desk"}</strong>
                  <span className="text-[10px] text-[#5D6B5C] block font-semibold">{activeReadingPost.author?.role || "Editorial Desk"}</span>
                </div>
              </div>

              {/* Article Content with Rich Text HTML rendering */}
              <div 
                className="text-xs sm:text-sm text-[#3E4C3D] space-y-3 font-['Open_Sans'] leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#1A3A1A] [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#1A3A1A] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0F766E] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-[#E8F4F1]/60 [&_blockquote]:py-2 [&_a]:text-[#0F766E] [&_a]:underline font-medium"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeReadingPost.body) }}
              />

            </div>

            {/* Actions */}
            <div className="mt-6 border-t border-gray-150 pt-4 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/blog/$slug"
                params={{ slug: activeReadingPost.slug }}
                className="text-xs font-black uppercase tracking-wider text-[#0F766E] hover:text-[#0B2117] hover:underline flex items-center gap-1.5"
              >
                Read on Dedicated Page & Comments →
              </Link>
              <button
                onClick={() => setActiveReadingPost(null)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0B2117] hover:bg-[#0F766E] rounded-none text-xs font-black uppercase tracking-wider text-white transition shadow-sm hover:shadow group cursor-pointer"
                aria-label="Exit article reader"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span>Exit Article</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </AppLayout>
  );
}
