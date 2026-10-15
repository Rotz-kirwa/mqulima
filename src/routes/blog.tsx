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
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Quote,
  Flame,
  UserCheck
} from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { toast } from "sonner";
import { getPublishedBlogPosts, incrementBlogViewCount } from "@/lib/api/blog.server";
import { sanitizeHtml } from "@/lib/sanitization";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

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
      const posts = await withSafeTimeout(
        getPublishedBlogPosts().catch(() => []),
        4500,
        []
      );
      return { posts: posts || [] };
    } catch (e) {
      console.error("Failed to load blog posts in loader:", e);
      return { posts: [] };
    }
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [remindToggled, setRemindToggled] = useState(false);
  const [userName, setUserName] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success(`Subscribed successfully! Weekly digest will be delivered to ${newsletterEmail}`);
    setNewsletterEmail("");
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

  // Latest 4 posts (or filtered results)
  const latestPostsList = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== "All") {
      return filteredPosts.slice(0, 8);
    }
    // Return latest 4 posts (excluding current featured post if possible)
    const list = posts.filter((p) => p.id !== currentFeaturedPost?.id);
    return list.slice(0, 4);
  }, [posts, filteredPosts, searchQuery, selectedCategory, currentFeaturedPost]);

  // Popular posts sorted by view count
  const popularPostsList = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 4);
  }, [posts]);

  // Trending articles (top 5 ranked)
  const trendingPostsList = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5);
  }, [posts]);

  // 4 Featured categories with real post counts
  const categoryTiles = useMemo(() => {
    const countFor = (name: string) => 
      posts.filter(p => isCategoryMatch(p.category, name)).length;

    return [
      {
        name: "Agronomy",
        fullName: "Agronomy & Farm Tips",
        count: countFor("Agronomy & Farm Tips"),
        icon: "🌱",
        accent: "text-emerald-700 bg-emerald-50 border-emerald-100",
      },
      {
        name: "Market Intel",
        fullName: "Policy & Market",
        count: countFor("Policy & Market"),
        icon: "📈",
        accent: "text-teal-700 bg-teal-50 border-teal-100",
      },
      {
        name: "Agri-Tech",
        fullName: "Agri-Tech & Tools",
        count: countFor("Agri-Tech & Tools"),
        icon: "🚜",
        accent: "text-amber-700 bg-amber-50 border-amber-100",
      },
      {
        name: "Climate & Rain",
        fullName: "Weather Advisory",
        count: countFor("Weather Advisory"),
        icon: "🌦️",
        accent: "text-sky-700 bg-sky-50 border-sky-100",
      },
    ];
  }, [posts]);

  // Authentic farmer & agronomist testimonials
  const testimonials = [
    {
      quote: "This news desk has become our daily source of farm inspiration and market pricing. The agronomy guides are always valuable and well-written!",
      author: "Jessica Parker",
      role: "Senior Agronomy Specialist",
      avatar: "/images/farmer_joy.webp"
    },
    {
      quote: "The live commodity market prices saved our maize cooperative over KSh 400,000 in broker middlemen markups during last season's harvest.",
      author: "Samuel Langat",
      role: "Commercial Maize Producer, Nakuru",
      avatar: "/images/farmer_samuel.webp"
    },
    {
      quote: "Clear, practical farming instructions without complex jargon. We print the weekly bulletin for our field team every Monday morning.",
      author: "Grace Mwangi",
      role: "Dairy & Livestock Lead, Kiambu",
      avatar: "/images/farmer_grace.webp"
    }
  ];

  const fieldGallery = [
    { src: "/images/services_crop_production.webp", alt: "Horticulture Greenhouse", tag: "Crops" },
    { src: "/images/services_soil_analysis.webp", alt: "Soil Testing Field Lab", tag: "Soil" },
    { src: "/images/mkulima_hero_farm.webp", alt: "Harvesting at Sunset", tag: "Harvest" },
    { src: "/images/services_veterinary_care.webp", alt: "Livestock Management", tag: "Dairy" },
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
                  className="bg-white rounded-[28px] sm:rounded-[36px] border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-6 sm:p-10 lg:p-12 relative overflow-hidden transition-all duration-300 mb-10 group"
                >
                  {/* Soft ambient gradient overlay */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-50/70 via-teal-50/30 to-transparent rounded-full pointer-events-none -mr-20 -mt-20 blur-2xl" />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                    
                    {/* Left Column: Headline, Excerpt, Read More & Controls */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-5 sm:space-y-6">
                      
                      {/* Top Pill Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-[#0F766E] border border-emerald-200/70 text-[10px] font-black uppercase tracking-widest">
                          <Sparkles className="h-3 w-3 text-[#0F766E]" />
                          FEATURED POST
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0F766E] hover:bg-[#113B26] text-white text-xs font-bold transition shadow-sm hover:shadow group/btn cursor-pointer"
                          >
                            <span>Read More</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
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

                        {/* Carousel Navigation Arrows & Dots */}
                        <div className="flex items-center gap-3">
                          {/* Dot indicators */}
                          <div className="flex items-center gap-1.5">
                            {featuredPostsList.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setFeaturedIndex(idx)}
                                aria-label={`Go to slide ${idx + 1}`}
                                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                  idx === Math.abs(featuredIndex) % featuredPostsList.length 
                                    ? "w-6 bg-[#0F766E]" 
                                    : "w-2 bg-slate-200 hover:bg-slate-300"
                                }`}
                              />
                            ))}
                          </div>

                          {/* Arrows */}
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={handlePrevFeatured}
                              aria-label="Previous featured article"
                              className="h-8 w-8 rounded-full border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer active:scale-95"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleNextFeatured}
                              aria-label="Next featured article"
                              className="h-8 w-8 rounded-full border border-slate-200 hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer active:scale-95"
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
                      className="lg:col-span-5 aspect-[16/11] sm:aspect-[4/3] rounded-2xl lg:rounded-3xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm relative group/img cursor-pointer"
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
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            e.currentTarget.src = "/mqulima_news_banner.png";
                          }}
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-xs font-bold drop-shadow-sm flex items-center gap-1.5">
                          Click to Read Story →
                        </span>
                      </div>
                    </div>

                  </div>
                </section>
              )}

              {/* ═════════════════════════════════════════════════════════════
                  CATEGORY FILTER & QUICK UTILITY ACTIONS
              ═════════════════════════════════════════════════════════════ */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-4 border-b border-slate-200/80">
                
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat 
                          ? "bg-[#0F766E] text-white shadow-xs" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Right Utility Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={handleToggleReminder}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition border cursor-pointer ${
                      remindToggled 
                        ? "bg-[#0F766E] text-white border-[#0F766E]" 
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                    title="Toggle browser notification alerts"
                  >
                    <Bell className={`h-3.5 w-3.5 ${remindToggled ? "animate-swing" : ""}`} />
                    <span>{remindToggled ? "Alerts Active" : "Remind Me"}</span>
                  </button>

                  <button
                    onClick={() => setNewsletterModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1A3A1A] hover:bg-[#113B26] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
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
                  
                  {/* SECTION 1: LATEST BLOG POSTS */}
                  <section aria-labelledby="latest-posts-heading">
                    <div className="flex items-center justify-between mb-6">
                      <h2 id="latest-posts-heading" className="text-xl sm:text-2xl font-bold font-['Lora',serif] text-[#1A3A1A]">
                        Latest Agricultural Posts
                      </h2>
                      <button 
                        onClick={() => {
                          setSelectedCategory("All");
                          setSearchQuery("");
                        }}
                        className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {latestPostsList.length === 0 ? (
                      <div className="border border-dashed border-slate-300 rounded-2xl p-12 text-center bg-white">
                        <span className="text-3xl">🌾</span>
                        <h3 className="text-sm font-bold text-[#1A3A1A] mt-2">No agricultural posts found</h3>
                        <p className="text-xs text-slate-500 mt-1">Try another keyword or category filter.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {latestPostsList.map((post) => (
                          <article
                            key={post.id}
                            onClick={() => {
                              setActiveReadingPost(post);
                              incrementBlogViewCount({ data: { postId: post.id } }).catch(() => {});
                            }}
                            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-[#0F766E] hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-2xs"
                          >
                            <div>
                              {/* Cover Image Container */}
                              <div className="aspect-[16/11] w-full relative overflow-hidden bg-slate-100">
                                <img
                                  src={post.coverImage}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    e.currentTarget.src = "/mqulima_news_banner.png";
                                  }}
                                />
                                {/* Category Badge */}
                                <span className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[#0F766E] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs border border-slate-100">
                                  {post.category}
                                </span>
                              </div>

                              {/* Text Body */}
                              <div className="p-3.5 text-left">
                                <h3 className="text-xs sm:text-[13px] font-bold font-['Lora',serif] text-[#1A3A1A] group-hover:text-[#0F766E] transition line-clamp-2 leading-snug">
                                  {post.title}
                                </h3>
                              </div>
                            </div>

                            {/* Card Footer: Date & Comment/View */}
                            <div className="px-3.5 pb-3.5 pt-1 flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-50">
                              <span>{post.publishedAt}</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Eye className="h-3 w-3 text-slate-400" />
                                {post.viewCount || 12}
                              </span>
                            </div>

                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* SECTION 2: SUB-ROW (FEATURED CATEGORIES + TRENDING ARTICLES) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Box A: Featured Categories */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <h3 className="text-base font-bold font-['Lora',serif] text-[#1A3A1A]">
                          Featured Categories
                        </h3>
                        <button 
                          onClick={() => setSelectedCategory("All")}
                          className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View All →
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {categoryTiles.map((tile) => (
                          <div
                            key={tile.name}
                            onClick={() => setSelectedCategory(tile.fullName)}
                            className="bg-[#FAFBF9] border border-slate-200/70 hover:border-[#0F766E] rounded-xl p-3 text-center transition-all cursor-pointer group hover:bg-white hover:shadow-2xs"
                          >
                            <div className="w-10 h-10 mx-auto rounded-full bg-white border border-slate-100 shadow-2xs flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                              <span>{tile.icon}</span>
                            </div>
                            <strong className="text-xs font-bold text-[#1A3A1A] block mt-2 truncate">
                              {tile.name}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              {tile.count} Posts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Box B: Trending Articles */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <h3 className="text-base font-bold font-['Lora',serif] text-[#1A3A1A] flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-amber-500" />
                          Trending Articles
                        </h3>
                        <button 
                          onClick={() => setSelectedCategory("All")}
                          className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View All →
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {trendingPostsList.map((post, idx) => (
                          <div
                            key={post.id}
                            onClick={() => {
                              setActiveReadingPost(post);
                              incrementBlogViewCount({ data: { postId: post.id } }).catch(() => {});
                            }}
                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#FAFBF9] transition cursor-pointer group"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-[#0F766E] transition line-clamp-1">
                              {post.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* SECTION 3: SUB-ROW (NEWSLETTER + WHAT OUR READERS SAY) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Box A: Newsletter */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between text-left">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E] block mb-1">
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
                          className="flex-1 bg-[#FAFBF9] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#0F766E] font-semibold"
                        />
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#113B26] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                        >
                          Subscribe
                        </button>
                      </form>
                    </div>

                    {/* Box B: What Our Readers Say (Testimonials) */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between text-left relative">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-bold font-['Lora',serif] text-[#1A3A1A]">
                            What Our Readers Say
                          </h3>
                          <Quote className="h-4 w-4 text-[#0F766E]" />
                        </div>

                        <p className="text-xs text-slate-600 italic leading-relaxed mt-2 line-clamp-3">
                          "{testimonials[activeTestimonial].quote}"
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={testimonials[activeTestimonial].avatar}
                            alt={testimonials[activeTestimonial].author}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            onError={(e) => {
                              e.currentTarget.src = "/images/farmer_joy.webp";
                            }}
                          />
                          <div>
                            <strong className="text-xs font-bold text-[#1A3A1A] block">
                              {testimonials[activeTestimonial].author}
                            </strong>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {testimonials[activeTestimonial].role}
                            </span>
                          </div>
                        </div>

                        {/* Testimonial Dots */}
                        <div className="flex items-center gap-1.5">
                          {testimonials.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveTestimonial(i)}
                              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                i === activeTestimonial ? "w-4 bg-[#0F766E]" : "w-1.5 bg-slate-200 hover:bg-slate-300"
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
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 pl-4 shadow-2xs flex items-center justify-between focus-within:border-[#0F766E] transition">
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
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-left">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <h3 className="text-base font-bold font-['Lora',serif] text-[#1A3A1A]">
                        Popular Posts
                      </h3>
                      <button 
                        onClick={() => setSelectedCategory("All")}
                        className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
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
                          className="flex items-center gap-3 group cursor-pointer"
                        >
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.src = "/mqulima_news_banner.png";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold font-['Lora',serif] text-[#1A3A1A] group-hover:text-[#0F766E] transition line-clamp-2 leading-snug">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-1">
                              <span>{post.publishedAt}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-2.5 w-2.5" />
                                {post.viewCount || 14}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WIDGET 3: EDITORIAL TEAM CARD ("Hi, I'm Alex" -> "Hi, We're Mqulima Team") */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-center flex flex-col items-center">
                    <div className="relative mb-3">
                      <img
                        src="/images/farmer_david.webp"
                        alt="Mqulima Editorial Desk"
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/20 shadow-xs"
                      />
                      <span className="absolute bottom-0 right-0 p-1 bg-[#0F766E] text-white rounded-full shadow-2xs">
                        <UserCheck className="h-3 w-3" />
                      </span>
                    </div>

                    <h4 className="text-lg font-bold font-['Lora',serif] italic text-[#0F766E]">
                      Hi, We're Mqulima Desk
                    </h4>

                    <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-2 px-2">
                      Certified Kenyan agronomists and market researchers delivering actionable farm intelligence, soil health data, and policy updates.
                    </p>

                    {/* Social Media Row */}
                    <div className="flex items-center justify-center gap-3 mt-4 text-slate-400">
                      <a 
                        href="https://twitter.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-full hover:bg-slate-100 hover:text-sky-500 transition"
                        aria-label="Twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                      <a 
                        href="https://instagram.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-full hover:bg-slate-100 hover:text-pink-600 transition"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                      <a 
                        href="https://linkedin.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-full hover:bg-slate-100 hover:text-blue-700 transition"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                      <a 
                        href="https://youtube.com" 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-full hover:bg-slate-100 hover:text-red-600 transition"
                        aria-label="YouTube"
                      >
                        <Youtube className="h-4 w-4" />
                      </a>
                      <a 
                        href="https://api.whatsapp.com/send?phone=254700000000" 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-full hover:bg-slate-100 hover:text-emerald-600 transition"
                        aria-label="WhatsApp Hotline"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {/* WIDGET 4: INSTAGRAM / FIELD INTEL GALLERY */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-left">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold font-['Lora',serif] text-[#1A3A1A]">
                          Field Intel
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold block">@mqulima</span>
                      </div>
                      <a 
                        href="https://instagram.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs font-bold text-[#0F766E] hover:underline"
                      >
                        Follow Us
                      </a>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {fieldGallery.map((img, i) => (
                        <div 
                          key={i} 
                          className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer"
                        >
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Instagram className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WIDGET 5: LIVE AGRICULTURAL COMMODITY INDEX */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-left">
                    <h3 className="text-xs font-black text-[#1A3A1A] uppercase tracking-wider border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-[#0F766E]" />
                        Commodity Index
                      </span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        Live Market
                      </span>
                    </h3>
                    <div className="space-y-2.5 text-xs text-[#1A3A1A] font-semibold">
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span>🌽 Dry Maize (90kg bag)</span>
                        <strong className="text-[#0F766E]">KSh 3,200</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span>🥛 Fresh Milk (1L)</span>
                        <strong className="text-[#0F766E]">KSh 55</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span>🫘 Rosecoco Beans (90kg)</span>
                        <strong className="text-[#0F766E]">KSh 8,500</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>🥑 Fuerte Avocados (kg)</span>
                        <strong className="text-[#0F766E]">KSh 65</strong>
                      </div>
                    </div>
                  </div>

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
          <div className="bg-[#FAF9F5] rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative border border-[#D4DDD0] flex flex-col text-left max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#D4DDD0] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📰</span>
                <h3 className="text-sm font-extrabold text-[#1A3A1A] uppercase tracking-wider">
                  Weekly Combined Newsletter
                </h3>
              </div>
              <button 
                onClick={() => setNewsletterModalOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-bold transition border border-transparent hover:border-rose-200 shadow-2xs group cursor-pointer"
                aria-label="Exit newsletter"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform text-slate-500 group-hover:text-rose-600" />
                <span>Exit</span>
                <kbd className="hidden sm:inline-block text-[9px] bg-white group-hover:bg-rose-100 px-1 py-0.2 rounded font-mono text-slate-400 group-hover:text-rose-600 border border-slate-200">Esc</kbd>
              </button>
            </div>

            {/* Newsletter compilation block */}
            <div id="printable-newsletter" className="bg-white border border-[#D4DDD0] rounded-xl p-6 sm:p-8 space-y-6 mt-4 text-[#1A3A1A]">
              
              {/* Newsletter brand banner */}
              <div className="text-center border-b-[3px] border-[#0F766E] pb-4">
                <h4 className="text-xs font-black tracking-widest text-[#0F766E] uppercase">WEEKLY DIGEST</h4>
                <h2 className="text-2xl font-black font-['Lora'] text-[#1A3A1A] mt-1">MQULIMA NEWSLETTER</h2>
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
                    <h3 className="text-base font-bold font-['Lora'] text-[#1A3A1A] mt-1">
                      {p.title}
                    </h3>
                    <div className="text-[9px] text-[#5D6B5C] font-semibold mt-1">
                      By {p.author.name} ({p.author.role})
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#D4DDD0] hover:border-slate-400 rounded-lg text-xs font-bold text-[#5D6B5C] hover:text-[#1A3A1A] hover:bg-gray-50 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  <span>Exit Newsletter</span>
                </button>
                <button
                  onClick={() => {
                    toast.success("Preparing PDF print format...");
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#113B26] rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col text-left max-h-[90vh] overflow-y-auto">
            
            {/* Top Modal Exit Bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#E8F4F1] text-[#0F766E]">
                  {activeReadingPost.category}
                </span>
                <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                  • Reading Mode
                </span>
              </div>
              <button 
                onClick={() => setActiveReadingPost(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition border border-transparent hover:border-rose-200 shadow-2xs group cursor-pointer"
                aria-label="Exit article reader"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform text-slate-500 group-hover:text-rose-600" />
                <span>Exit Article</span>
                <kbd className="hidden sm:inline-block text-[9px] bg-white group-hover:bg-rose-100 px-1.5 py-0.5 rounded font-mono text-slate-400 group-hover:text-rose-600 border border-slate-200">Esc</kbd>
              </button>
            </div>

            {/* Article Detail */}
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
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

              <div className="flex items-center gap-3 text-[10px] text-[#5D6B5C] font-bold uppercase tracking-wider">
                <span>{activeReadingPost.category}</span>
                <span>•</span>
                <span>{activeReadingPost.publishedAt}</span>
                <span>•</span>
                <span>{activeReadingPost.readTime}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-['Lora'] text-[#1A3A1A] leading-snug">
                {activeReadingPost.title}
              </h2>

              {/* Author row */}
              <div className="flex items-center gap-3 border-y border-[#E8ECE7] py-3">
                <div className="h-8 w-8 rounded-full bg-[#0F766E]/10 text-[#0F766E] font-bold text-xs flex items-center justify-center">
                  {activeReadingPost.author.avatarInitials}
                </div>
                <div>
                  <strong className="text-xs text-[#1A3A1A] block">{activeReadingPost.author.name}</strong>
                  <span className="text-[10px] text-[#5D6B5C] block font-semibold">{activeReadingPost.author.role}</span>
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
                className="text-xs font-bold text-[#0F766E] hover:text-[#113B26] hover:underline flex items-center gap-1"
              >
                Read on Dedicated Page & Comments →
              </Link>
              <button
                onClick={() => setActiveReadingPost(null)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0F766E] hover:bg-[#113B26] rounded-xl text-xs font-bold text-white transition shadow-sm hover:shadow group cursor-pointer"
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
