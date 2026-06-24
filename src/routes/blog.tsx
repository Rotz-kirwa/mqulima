import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Clock, ArrowRight, Mail, X } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Mqulima Insights — The Pulse of East African Agriculture" },
      {
        name: "description",
        content: "Farm intelligence, market trends, cooperative insights, and agri-tech news straight from the fields of East Africa.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap"
      }
    ]
  }),
  component: BlogPage,
});

// Category definition
const categories = [
  "All",
  "Market Prices",
  "Farm Tips",
  "Cooperative News",
  "Agri-Tech",
  "Policy & Finance",
  "Success Stories"
];

// Rich product mock database (Zero Placeholder Lorem Ipsum)
type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  views: string;
  author: {
    name: string;
    role: string;
    avatarInitials: string;
  };
  coverImage: string;
  isFeatured?: boolean;
};

const mockBlogPosts: BlogPost[] = [
  {
    id: "f1",
    title: "Kenya's Maize Prices Hit 3-Year High — What Smallholder Farmers Must Do Now",
    excerpt: "Wholesale maize prices in Eldoret and Nakuru markets surged 34% this season, driven by erratic rainfall and export demand. Here's what cooperatives should do before the next planting window.",
    category: "Market Prices",
    publishedAt: "June 18, 2025",
    readTime: "5 min read",
    views: "2.4K views",
    author: {
      name: "James Mwangi",
      role: "Senior Agri-Analyst",
      avatarInitials: "JM"
    },
    coverImage: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800",
    isFeatured: true
  },
  {
    id: "g1",
    title: "How Uasin Gishu Cooperatives Increased Yields by 40% Using Mobile Agronomy",
    excerpt: "Using simple SMS and USSD alert systems, grain growers optimized planting windows and fertilizer inputs to achieve record harvest volumes.",
    category: "Agri-Tech",
    publishedAt: "June 12, 2025",
    readTime: "4 min read",
    views: "1.8K views",
    author: {
      name: "Jane Otieno",
      role: "Agri-Tech Lead",
      avatarInitials: "JO"
    },
    coverImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500"
  },
  {
    id: "g2",
    title: "Organic Ginger Export Guidelines for East African Farmers",
    excerpt: "A complete step-by-step walkthrough on obtaining pesticide-free certification and accessing European specialty herb markets.",
    category: "Farm Tips",
    publishedAt: "June 10, 2025",
    readTime: "6 min read",
    views: "950 views",
    author: {
      name: "Dr. Samuel Mwangi",
      role: "Chief Agronomist",
      avatarInitials: "SM"
    },
    coverImage: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500"
  },
  {
    id: "g3",
    title: "Understanding the New Agricultural Credit Policy of 2025",
    excerpt: "How the government's subsidized interest rate program affects loan applications for smallholder dairy cooperatives.",
    category: "Policy & Finance",
    publishedAt: "June 05, 2025",
    readTime: "5 min read",
    views: "1.2K views",
    author: {
      name: "Brian Kiprono",
      role: "Agri-Finance Advisor",
      avatarInitials: "BK"
    },
    coverImage: "https://images.unsplash.com/photo-1463171359079-3d9996683be2?w=500"
  },
  {
    id: "g4",
    title: "From 5 to 50 Cows: How Wambui Built a Dairy Empire in Kiambu",
    excerpt: "The story of one woman's journey from backyard milking to supplying regional processing hubs through smart cooperative membership.",
    category: "Success Stories",
    publishedAt: "May 28, 2025",
    readTime: "7 min read",
    views: "3.1K views",
    author: {
      name: "Faith Achieng",
      role: "Vet Services Specialist",
      avatarInitials: "FA"
    },
    coverImage: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=500"
  },
  {
    id: "g5",
    title: "Drip Irrigation vs Rain-fed: The Financial Breakdown",
    excerpt: "Detailed capital investment comparisons proving how drip systems pay off in under two seasons for French bean farmers.",
    category: "Farm Tips",
    publishedAt: "May 20, 2025",
    readTime: "4 min read",
    views: "2.0K views",
    author: {
      name: "Dr. Samuel Mwangi",
      role: "Chief Agronomist",
      avatarInitials: "SM"
    },
    coverImage: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=500"
  },
  {
    id: "g6",
    title: "Cooperative Bargaining: Securing Fertilizer Discounts in Bulk",
    excerpt: "How structural purchasing syndicates saved smallholders over 15% on NPK and DAP imports this planting season.",
    category: "Cooperative News",
    publishedAt: "May 15, 2025",
    readTime: "5 min read",
    views: "1.5K views",
    author: {
      name: "James Mwangi",
      role: "Senior Agri-Analyst",
      avatarInitials: "JM"
    },
    coverImage: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500"
  }
];

const trendingTopics = [
  "🌽 Maize Prices",
  "🌿 Organic Certification",
  "💧 Drip Irrigation",
  "🐄 Dairy Cooperative Trends",
  "📱 M-Pesa for Farmers",
  "🌧 La Niña Impact",
  "🌻 Sunflower Export Markets",
  "🧪 Soil Testing"
];

const tags = [
  "Maize",
  "Irrigation",
  "Dairy",
  "M-Pesa",
  "Soil",
  "Export",
  "Cooperative",
  "Weather",
  "Seeds",
  "Loans"
];

const NairobiMarketPrices = [
  { crop: "🌽 Maize (90kg)", price: "KES 3,200", change: "+4.2%", trend: "up" },
  { crop: "🫘 Beans (90kg)", price: "KES 8,500", change: "-1.1%", trend: "down" },
  { crop: "🥑 Avocado (kg)", price: "KES 65", change: "+12.0%", trend: "up" },
  { crop: "🥛 Milk (litre)", price: "KES 55", change: "0.0%", trend: "flat" },
  { crop: "🌻 Sunflower (kg)", price: "KES 48", change: "+2.8%", trend: "up" }
];

const popularPosts = [
  {
    num: "01",
    title: "How to Register a Cooperative in Kenya: Legal & Operational Steps",
    reads: "3.2K reads"
  },
  {
    num: "02",
    title: "M-Pesa Daraja Integration for Agri-Sellers: Complete Developer Guide",
    reads: "2.8K reads"
  },
  {
    num: "03",
    title: "Top 5 Drought-Resistant Maize Varieties Approved for Semi-Arid Counties",
    reads: "1.9K reads"
  }
];

// Badge styling helper
const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case "Market Prices":
      return "bg-[#FDE68A] text-[#2C2416]"; // yellow
    case "Farm Tips":
      return "bg-[#D4E8DC] text-[#1B4332]"; // green
    case "Agri-Tech":
      return "bg-[#DBEAFE] text-[#1E3A5F]"; // blue
    case "Policy & Finance":
      return "bg-[#E5DDD0] text-[#2C2416]"; // sepia
    case "Success Stories":
      return "bg-[#2D6A4F] text-white"; // green solid
    default:
      return "bg-[#F5F0E8] text-[#8A7E6A]";
  }
};

function BlogPage() {
  const [selectedTab, setSelectedTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Search completed for "${searchQuery}"`);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    toast.success(`Subscribed successfully! Intel sent weekly to ${newsletterEmail}`);
    setNewsletterEmail("");
  };

  // Featured Post
  const featuredPost = mockBlogPosts.find(p => p.isFeatured) || mockBlogPosts[0];

  // Grid Posts
  const filteredGridPosts = useMemo(() => {
    return mockBlogPosts
      .filter((p) => !p.isFeatured) // grid has non-featured posts
      .filter((p) => {
        if (selectedTab !== "All" && p.category !== selectedTab) return false;
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.excerpt.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [selectedTab, searchQuery]);

  return (
    <AppLayout>
      {/* Styles for CSS scrolling marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="bg-[#F5F0E8] text-[#2C2416] min-h-screen font-sans antialiased relative overflow-hidden">
        {/* Subtle noise pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[radial-gradient(#2C2416_1px,transparent_0)] [background-size:16px_16px]" />

        {/* SECTION 1 — PAGE HERO */}
        <header className="relative border-b border-[#E5DDD0] py-8 sm:py-12 bg-[#F5F0E8] z-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Left Column */}
            <div className="text-left max-w-xl">
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#2D6A4F] uppercase block mb-2">
                MQULIMA INSIGHTS
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-serif text-[#2C2416] leading-[1.1] mb-3">
                The Pulse of East <br />
                <span className="border-b-[3px] border-[#F5A623] pb-1">African Agriculture.</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#8A7E6A] font-medium leading-relaxed mt-4">
                Farm intelligence, market trends, cooperative insights, and agri-tech news — straight from the field.
              </p>
            </div>

            {/* Right Column: Search */}
            <form onSubmit={handleSearchSubmit} className="w-full md:max-w-xs flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7E6A]" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E5DDD0] rounded-xl pl-9 pr-4 py-3 text-xs outline-none focus:border-[#2D6A4F] text-[#2C2416] font-medium shadow-xs transition"
                />
              </div>
              <button
                type="submit"
                className="bg-[#F5A623] hover:bg-[#2D6A4F] text-[#2C2416] hover:text-white font-bold text-xs px-5 py-3 rounded-xl transition duration-200 cursor-pointer shadow-xs"
              >
                Search
              </button>
            </form>

          </div>
        </header>

        {/* SECTION 2 — CATEGORY FILTER TABS */}
        <nav className="border-b border-[#E5DDD0] bg-white/60 sticky top-[72px] backdrop-blur-sm z-30 overflow-x-auto scrollbar-none py-3">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 whitespace-nowrap min-w-max">
            {categories.map((tab) => {
              const isActive = selectedTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`text-xs font-bold px-5 py-2.5 transition duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#2D6A4F] text-white rounded-full shadow-xs"
                      : "text-[#8A7E6A] hover:text-[#2C2416]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 z-10 relative">
          
          {/* SECTION 3 — FEATURED POST (Hero Card) */}
          <AnimatePresence mode="wait">
            {selectedTab === "All" && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4 }}
                className="mb-12 rounded-2xl border border-[#E5DDD0] bg-[#FDFAF4] overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 lg:flex"
              >
                {/* Left Column: Image with badges */}
                <div className="lg:w-3/5 h-64 lg:h-auto relative overflow-hidden bg-[#D4E8DC] flex items-center justify-center min-h-[300px]">
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  
                  {/* Badges */}
                  <span className="absolute top-4 left-4 bg-[#2D6A4F] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    FEATURED
                  </span>
                  <span className="absolute top-4 right-4 bg-[#FDE68A] text-[#2C2416] text-[10px] font-bold px-3 py-1 rounded-full shadow-xs">
                    {featuredPost.category}
                  </span>
                </div>

                {/* Right Column: Content */}
                <div className="lg:w-2/5 p-6 sm:p-8 flex flex-col justify-between text-left">
                  <div>
                    {/* Meta */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8A7E6A] font-semibold uppercase tracking-wider mb-3">
                      <span>📅 {featuredPost.publishedAt}</span>
                      <span>•</span>
                      <span>⏱ {featuredPost.readTime}</span>
                      <span>•</span>
                      <span>👁 {featuredPost.views}</span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-[#2C2416] leading-snug mb-4">
                      {featuredPost.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-xs sm:text-sm text-[#8A7E6A] leading-relaxed mb-6 font-medium">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  {/* Author & Button */}
                  <div className="border-t border-[#E5DDD0] pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        {featuredPost.author.avatarInitials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2C2416]">{featuredPost.author.name}</div>
                        <div className="text-[10px] text-[#8A7E6A] font-semibold">{featuredPost.author.role}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => toast.success(`Loading full article: ${featuredPost.title}`)}
                      className="bg-[#F5A623] hover:bg-[#2D6A4F] text-[#2C2416] hover:text-white font-bold text-xs px-5 py-3 rounded-xl transition duration-200 cursor-pointer uppercase tracking-wider shadow-xs"
                    >
                      Read Full Article →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECTION 4 — TRENDING TOPICS STRIP */}
          <div className="relative bg-[#2D6A4F] py-3 rounded-xl overflow-hidden mb-12 flex items-center shadow-xs">
            {/* Sticky Label */}
            <div className="absolute left-0 top-0 bottom-0 bg-[#2D6A4F] px-4 flex items-center z-10 border-r border-[#1B4332] shadow-md">
              <span className="text-[#F5A623] font-bold text-xs uppercase tracking-wider">TRENDING:</span>
            </div>
            {/* Marquee Body */}
            <div className="pl-32 pr-4 overflow-hidden flex items-center w-full">
              <div className="animate-marquee gap-8">
                {trendingTopics.map((topic, i) => (
                  <span key={i} className="text-white text-xs sm:text-sm font-medium hover:text-[#F5A623] transition duration-250 cursor-pointer">
                    {topic}
                  </span>
                ))}
                {/* Duplicate for infinite loop */}
                {trendingTopics.map((topic, i) => (
                  <span key={`dup-${i}`} className="text-white text-xs sm:text-sm font-medium hover:text-[#F5A623] transition duration-250 cursor-pointer">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 5 & 6 — MAIN LAYOUT GRID (Articles + Sidebar) */}
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
            
            {/* Main Articles List */}
            <div className="space-y-8">
              {filteredGridPosts.length === 0 ? (
                <div className="border border-dashed border-[#E5DDD0] rounded-2xl p-12 text-center bg-[#FDFAF4]">
                  <span className="text-2xl block mb-2">🌿</span>
                  <span className="text-xs font-bold text-[#2C2416]">No articles found</span>
                  <p className="text-[11px] text-[#8A7E6A] mt-1">Try modifying your query or category filters.</p>
                </div>
              ) : (
                <motion.div
                  variants={{
                    show: {
                      transition: {
                        staggerChildren: 0.08
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                  className="grid gap-6 sm:grid-cols-2"
                >
                  {filteredGridPosts.map((post) => (
                    <motion.article
                      key={post.id}
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0 }
                      }}
                      transition={{ duration: 0.3 }}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5DDD0] bg-[#FDFAF4] hover:border-[#2D6A4F] hover:-translate-y-1 hover:shadow-md transition-all duration-250 text-left cursor-pointer"
                      onClick={() => toast.success(`Loading article: ${post.title}`)}
                    >
                      <div>
                        {/* Image */}
                        <div className="h-44 overflow-hidden relative bg-[#D4E8DC] flex items-center justify-center">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                          {/* Category Badge overlay */}
                          <span className={`absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs ${getCategoryBadgeClass(post.category)}`}>
                            {post.category}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                          <div className="text-[10px] text-[#8A7E6A] font-bold flex items-center gap-1">
                            <Calendar size={10} /> <span>{post.publishedAt}</span>
                            <span className="text-gray-300">•</span>
                            <Clock size={10} /> <span>{post.readTime}</span>
                          </div>
                          
                          <h3 className="mt-2 text-base font-bold font-serif text-[#2C2416] leading-snug group-hover:text-[#2D6A4F] transition-colors">
                            {post.title}
                          </h3>
                          
                          <p className="mt-2 text-xs text-[#8A7E6A] font-medium leading-relaxed line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>

                      {/* Author row */}
                      <div className="border-t border-[#E5DDD0] p-4 bg-[#FDFAF4]/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                            {post.author.avatarInitials}
                          </div>
                          <span className="text-xs font-bold text-[#2C2416]">{post.author.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#2D6A4F] group-hover:text-[#F5A623] group-hover:underline transition duration-200">
                          Read More →
                        </span>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}

              {/* SECTION 8 — LOAD MORE */}
              {filteredGridPosts.length > 0 && (
                <div className="pt-6 flex justify-center">
                  <button
                    onClick={() => toast.info("No further articles to display.")}
                    className="bg-[#F5A623] hover:bg-[#2D6A4F] text-[#2C2416] hover:text-white font-bold text-xs px-8 py-3.5 rounded-xl transition duration-200 cursor-pointer uppercase tracking-wider shadow-xs"
                  >
                    Load More Articles
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 6 — SIDEBAR (Sticky ≥ 1024px) */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              
              {/* Widget 1 — Newsletter Signup */}
              <div className="bg-[#2D6A4F] rounded-2xl p-6 text-white text-left shadow-xs">
                <span className="text-xl block mb-1">🌿</span>
                <h4 className="text-base font-bold uppercase tracking-wide">Get Farm Intel Weekly</h4>
                <p className="text-xs text-white/80 mt-1 mb-4 leading-relaxed font-light">
                  The best agri-market insights, delivered every Tuesday morning.
                </p>
                <form onSubmit={handleSubscribe} className="space-y-2.5">
                  <input
                    type="email"
                    placeholder="Your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-3.5 py-3 text-xs outline-none focus:border-[#F5A623] font-medium"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#F5A623] hover:bg-white text-[#2C2416] font-bold text-xs uppercase py-3 rounded-xl transition duration-200 cursor-pointer tracking-wider shadow-sm"
                  >
                    Subscribe Free →
                  </button>
                </form>
                <span className="text-[10px] text-white/50 font-medium block mt-3 text-center">
                  No spam. Unsubscribe anytime.
                </span>
              </div>

              {/* Widget 2 — Market Price Ticker */}
              <div className="bg-[#FDFAF4] border border-[#E5DDD0] rounded-2xl p-5 text-left shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E5DDD0] pb-3 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wide">📊 Live Market Prices</h4>
                    <span className="text-[10px] text-[#8A7E6A] font-semibold flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Nairobi, updated today
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {NairobiMarketPrices.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-[#E5DDD0]/50 last:border-b-0">
                      <span className="font-semibold text-[#2C2416]">{item.crop}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#2C2416]">{item.price}</span>
                        <span className={`font-bold text-[10px] ${
                          item.trend === "up"
                            ? "text-[#2D6A4F]"
                            : item.trend === "down"
                            ? "text-red-600"
                            : "text-[#8A7E6A]"
                        }`}>
                          {item.trend === "up" ? "▲" : item.trend === "down" ? "▼" : "→"} {item.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/shop"
                  className="block text-center text-xs font-bold text-[#2D6A4F] hover:underline mt-4 uppercase tracking-wider"
                >
                  View Full Market Data →
                </Link>
              </div>

              {/* Widget 3 — Popular Posts */}
              <div className="bg-[#FDFAF4] border border-[#E5DDD0] rounded-2xl p-5 text-left shadow-xs">
                <h4 className="text-xs font-bold text-[#2C2416] uppercase tracking-wide border-b border-[#E5DDD0] pb-3 mb-4">
                  🔥 Popular This Week
                </h4>
                <div className="space-y-4">
                  {popularPosts.map((post, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-start cursor-pointer group"
                      onClick={() => toast.success(`Loading popular article: ${post.title}`)}
                    >
                      <span className="font-serif text-2xl font-bold text-[#E5DDD0] leading-none group-hover:text-[#2D6A4F] transition-colors">
                        {post.num}
                      </span>
                      <div className="text-left">
                        <h5 className="text-[12px] font-bold text-[#2C2416] group-hover:text-[#2D6A4F] transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h5>
                        <span className="text-[10px] text-[#8A7E6A] font-semibold block mt-0.5">{post.reads}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 4 — Tags Cloud */}
              <div className="bg-[#FDFAF4] border border-[#E5DDD0] rounded-2xl p-5 text-left shadow-xs">
                <h4 className="text-xs font-bold text-[#2C2416] uppercase tracking-wide border-b border-[#E5DDD0] pb-3 mb-3.5">
                  Browse by Topic
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        toast.success(`Filtering by tag: #${tag}`);
                      }}
                      className="bg-[#F5F0E8] border border-[#E5DDD0] hover:bg-[#2D6A4F] hover:text-white hover:border-[#2D6A4F] rounded-full px-3 py-1 text-[11px] font-semibold text-[#8A7E6A] transition cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

            </aside>
          </div>

        </main>

        {/* SECTION 7 — BLUE EDITORIAL SPOTLIGHT */}
        <section className="bg-[#1E3A5F] py-16 text-white relative overflow-hidden mt-12">
          {/* Abstract visualization SVG in bg */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none hidden md:block">
            <svg width="100%" height="100%" viewBox="0 0 400 400" className="text-blue-300">
              <path d="M50 200 L150 100 L250 300 L350 150" stroke="currentColor" strokeWidth="3" fill="none" />
              <circle cx="50" cy="200" r="6" fill="currentColor" />
              <circle cx="150" cy="100" r="6" fill="currentColor" />
              <circle cx="250" cy="300" r="6" fill="currentColor" />
              <circle cx="350" cy="150" r="6" fill="currentColor" />
              <path d="M50 200 L150 250 L250 120 L350 300" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" fill="none" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10 text-left">
            <span className="text-[#F5A623] font-bold text-xs uppercase tracking-widest block mb-2">
              EDITOR'S PICK
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white max-w-2xl leading-tight mb-4">
              The Hidden Cost of Skipping Crop Insurance
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/80 max-w-xl leading-relaxed mb-6 font-medium">
              A deep dive into how uninsured smallholder losses wiped out 3 seasons of gains across Western Kenya.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 max-w-xl border-t border-white/10 pt-6">
              <span className="text-xs text-white/70 font-semibold">
                Reported by <strong className="text-white">James Mwangi</strong>
              </span>
              <button
                onClick={() => toast.success("Loading Investigation Report...")}
                className="bg-[#F5A623] hover:bg-white hover:text-[#1E3A5F] text-[#1E3A5F] font-bold text-xs px-6 py-3 rounded-xl transition duration-200 cursor-pointer uppercase tracking-wider shadow-sm"
              >
                Read the Investigation →
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 9 — FOOTER CTA BAND */}
        <section className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] py-16 text-white text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl sm:text-4xl font-bold font-serif text-white leading-tight mb-6">
              Stay ahead of East Africa's agri-market.
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => {
                  setNewsletterEmail("farmer@example.com");
                  toast.success("Ready to subscribe! Enter your email in the newsletter widget.");
                }}
                className="bg-[#F5A623] hover:bg-white text-[#2C2416] font-bold text-xs uppercase px-8 py-3.5 rounded-xl transition duration-200 cursor-pointer tracking-wider shadow-md"
              >
                Subscribe to Weekly Intel
              </button>
              <button
                onClick={() => {
                  setSelectedTab("All");
                  window.scrollTo({ top: 400, behavior: "smooth" });
                  toast.success("Browsing all topics");
                }}
                className="border border-white/30 hover:border-white hover:bg-white/10 text-white font-bold text-xs uppercase px-8 py-3.5 rounded-xl transition duration-200 cursor-pointer tracking-wider"
              >
                Browse All Topics
              </button>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
