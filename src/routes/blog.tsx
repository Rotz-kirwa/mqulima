import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Mail, 
  X, 
  Bell, 
  BookOpen, 
  Download, 
  Check, 
  Printer,
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { toast } from "sonner";
import { getPublishedBlogPosts, incrementBlogViewCount } from "@/lib/api/blog.server";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Mqulima News — Farmers' Voice & Insights" },
      {
        name: "description",
        content: "Weekly combined agriculture newsletter, policy updates, and farm intel from our expert agronomists.",
      },
    ],
    links: [
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
  author: {
    name: string;
    role: string;
    avatarInitials: string;
    bio: string;
  };
  coverImage: string;
  bodyImages?: string[];
  isFeatured?: boolean;
};


function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [remindToggled, setRemindToggled] = useState(false);
  const [userName, setUserName] = useState("");

  // Newsletter Modal State
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);

  // Active Reading Post Modal State
  const [activeReadingPost, setActiveReadingPost] = useState<BlogPost | null>(null);

  // Load posts from the database
  useEffect(() => {
    setPostsLoading(true);
    getPublishedBlogPosts()
      .then((data) => {
        setPosts(data);
      })
      .catch((err) => {
        console.error("Failed to load blog posts:", err);
        toast.error("Could not load news articles.");
      })
      .finally(() => setPostsLoading(false));
  }, []);

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

  const handleToggleReminder = () => {
    setRemindToggled((prev) => {
      const next = !prev;
      if (next) {
        toast.success(
          userName 
            ? `Alerts activated! We will notify you, ${userName}, whenever new insights are published.`
            : "Alerts activated! Registered farmers will receive new blog push notifications."
        );
      } else {
        toast.info("Notifications deactivated.");
      }
      return next;
    });
  };

  const categories = ["All", "Market Prices", "Farm Tips", "Agri-Tech", "Policy & Finance"];

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.body.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [posts, selectedCategory, searchQuery]);

  // Featured Post is the first featured post, or the first post in the array
  const featuredPost = useMemo(() => {
    return filteredPosts.find((p) => p.isFeatured) || filteredPosts[0];
  }, [filteredPosts]);

  // Remaining posts in grid
  const gridPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-[#E8ECE7] via-[#FAF9F5] to-[#E4EAE1] min-h-screen text-[#263225] font-['Open_Sans'] antialiased text-left relative py-8">
        
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#1A5438_1px,transparent_0)] [background-size:20px_20px]" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">

          {/* Loading Skeleton */}
          {postsLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-10 w-10 text-[#1A5438] animate-spin" />
              <p className="text-sm text-[#5D6B5C] font-semibold">Loading latest agricultural news...</p>
            </div>
          )}

          {/* Main Content — shown when not loading */}
          {!postsLoading && (<>
          {/* Header Section */}
          <header className="border-b border-[#D4DDD0] pb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#0F766E] uppercase block mb-1">
                Mqulima News Desk
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold font-['Lora'] text-[#1A3A1A] tracking-tight">
                Mqulima News & insights
              </h1>
              <p className="text-xs sm:text-sm text-[#5D6B5C] font-semibold mt-2.5 max-w-xl">
                Read agricultural reports, market pricing trends, and certified agronomist instructions. Combine all updates into a single weekly digest newsletter.
              </p>
            </div>

            {/* Notification toggle & Newsletter download button */}
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={handleToggleReminder}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm ${
                  remindToggled 
                    ? "bg-[#0F766E] text-white" 
                    : "bg-white border border-[#D4DDD0] text-[#1A3A1A] hover:bg-[#FAF9F5]"
                }`}
              >
                <Bell className={`h-4 w-4 ${remindToggled ? "animate-swing" : ""}`} />
                <span>{remindToggled ? "News Alerts Enabled" : "Remind Me of New Posts"}</span>
              </button>

              <button
                onClick={() => setNewsletterModalOpen(true)}
                className="bg-[#F5A623] hover:bg-[#E0951F] text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm"
              >
                <BookOpen className="h-4 w-4" />
                <span>Weekly Newsletter Digest</span>
              </button>
            </div>
          </header>

          {/* Search & Categories Bar */}
          <div className="my-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#D4DDD0] pb-5">
            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === cat 
                      ? "bg-[#1A5438] text-white shadow-xs" 
                      : "text-[#5D6B5C] hover:text-[#1A3A1A]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5D6B5C]" />
              <input
                type="text"
                placeholder="Search news database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#D4DDD0] rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-[#1A5438] text-[#1A3A1A] font-semibold shadow-xs"
              />
            </div>
          </div>

          {/* Main Grid: Left is content, Right is Sidebar */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            
            {/* Left 8 Columns */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Featured Post Hero */}
              {featuredPost && !searchQuery && selectedCategory === "All" && (
                <div 
                  onClick={() => {
                  setActiveReadingPost(featuredPost);
                  incrementBlogViewCount({ data: { postId: featuredPost.id } }).catch(() => {});
                }}
                  className="bg-white border border-[#D4DDD0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                >
                  <div className="aspect-[21/9] w-full relative overflow-hidden bg-[#E2EADF]">
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-[1.01] transition duration-300"
                    />
                    <span className="absolute top-4 left-4 bg-[#0F766E] text-white text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                      Featured Report
                    </span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 text-[10px] text-[#5D6B5C] font-bold uppercase tracking-wider mb-3">
                      <span>{featuredPost.category}</span>
                      <span>•</span>
                      <span>{featuredPost.publishedAt}</span>
                      <span>•</span>
                      <span>{featuredPost.readTime}</span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-bold font-['Lora'] text-[#1A3A1A] leading-snug group-hover:text-[#1A5438] transition">
                      {featuredPost.title}
                    </h2>

                    <p className="mt-4 text-xs sm:text-sm text-[#5D6B5C] leading-relaxed font-semibold">
                      {featuredPost.excerpt}
                    </p>

                    <div className="mt-6 border-t border-[#E8ECE7] pt-5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#1A5438]/10 text-[#1A5438] flex items-center justify-center font-bold text-xs">
                          {featuredPost.author.avatarInitials}
                        </div>
                        <div>
                          <strong className="text-xs text-[#1A3A1A] block">{featuredPost.author.name}</strong>
                          <span className="text-[10px] text-[#5D6B5C] block font-semibold">{featuredPost.author.role}</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#1A5438] group-hover:underline">Read Full Story →</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed Grid */}
              {gridPosts.length === 0 && !featuredPost ? (
                <div className="border border-dashed border-[#D4DDD0] rounded-2xl p-16 text-center bg-white/60">
                  <span className="text-3xl">🌾</span>
                  <h3 className="text-sm font-bold text-[#1A3A1A] mt-3">No news matching query</h3>
                  <p className="text-xs text-[#5D6B5C] mt-1">Try searching another agricultural keyword.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {gridPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => {
                    setActiveReadingPost(post);
                    incrementBlogViewCount({ data: { postId: post.id } }).catch(() => {});
                  }}
                      className="bg-white border border-[#D4DDD0] rounded-2xl overflow-hidden hover:border-[#1A5438] hover:shadow-md transition duration-300 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="aspect-video w-full overflow-hidden bg-[#E2EADF] relative">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500";
                            }}
                          />
                          <span className="absolute top-3 left-3 bg-white/90 text-[#1A3A1A] text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-[#D4DDD0]">
                            {post.category}
                          </span>
                        </div>
                        <div className="p-5 text-left">
                          <span className="text-[9px] text-[#5D6B5C] font-bold block mb-1">{post.publishedAt} • {post.readTime}</span>
                          <h3 className="text-sm font-bold font-['Lora'] text-[#1A3A1A] leading-snug group-hover:text-[#1A5438] transition line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-[11px] text-[#5D6B5C] mt-2 line-clamp-2 font-semibold leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 border-t border-[#E8ECE7] bg-[#FAF9F5] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#1A5438]/10 text-[#1A5438] flex items-center justify-center font-bold text-[9px]">
                            {post.author.avatarInitials}
                          </div>
                          <span className="text-[10px] font-bold text-[#1A3A1A]">{post.author.name}</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#1A5438]">Read Article →</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}



            </div>

            {/* Right 4 Columns Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Newsletter Signup widget */}
              <div className="bg-[#1A5438] rounded-2xl p-6 text-white text-left shadow-sm">
                <span className="text-2xl block">📬</span>
                <h4 className="text-base font-extrabold font-['Lora'] text-white mt-2">Subscribe to Newsletters</h4>
                <p className="text-xs text-white/80 mt-1 mb-4 leading-relaxed font-semibold">
                  Subscribe to get the combined weekly newsletter summarizing all agricultural blogs directly.
                </p>
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="Your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-[#F5A623] font-semibold"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#F5A623] hover:bg-white text-[#1A3A1A] font-bold text-xs uppercase py-2.5 rounded-lg transition"
                  >
                    Subscribe Free
                  </button>
                </form>
              </div>


              {/* Nairobi Market price widget */}
              <div className="bg-white border border-[#D4DDD0] rounded-2xl p-5 text-left shadow-sm">
                <h4 className="text-xs font-black text-[#1A3A1A] uppercase tracking-wider border-b border-[#E8ECE7] pb-3 mb-3 flex items-center gap-1.5">
                  📈 Live Agricultural Index
                </h4>
                <div className="space-y-2.5 text-xs text-[#1A3A1A] font-semibold">
                  <div className="flex justify-between border-b border-gray-50 pb-1.5">
                    <span>🌽 Dry Maize (90kg bag)</span>
                    <strong className="text-[#1A5438]">KSh 3,200</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1.5">
                    <span>🥛 Fresh Milk (1L)</span>
                    <strong className="text-[#1A5438]">KSh 55</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-1.5">
                    <span>🫘 Rosecoco Beans (90kg)</span>
                    <strong className="text-[#1A5438]">KSh 8,500</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>🥑 Fuerte Avocados (kg)</span>
                    <strong className="text-[#1A5438]">KSh 65</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>

          </>)}

        </div>

      </div>

      {/* ══════════════════════════════════════════
          WEEKLY NEWSLETTER COMBINED VIEW MODAL
      ══════════════════════════════════════════ */}
      {newsletterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                className="p-1 hover:bg-gray-100 rounded-full transition text-[#5D6B5C] hover:text-[#1A3A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Newsletter compilation block */}
            <div id="printable-newsletter" className="bg-white border border-[#D4DDD0] rounded-xl p-6 sm:p-8 space-y-6 mt-4 text-[#1A3A1A]">
              
              {/* Newsletter brand banner */}
              <div className="text-center border-b-[3px] border-[#1A5438] pb-4">
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
                    <p className="text-[11px] text-[#5D6B5C] leading-relaxed mt-2.5 whitespace-pre-line font-medium">
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Newsletter footer */}
              <div className="border-t border-[#D4DDD0] pt-4 text-center text-[9px] text-[#5D6B5C]">
                <strong>Mqulima Ecosystem Ltd</strong> — P.O Box 100-20100, Nakuru, Kenya <br />
                For agro-support contact sales@mqulima.com or use the WhatsApp hotline.
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
                  className="px-4 py-2 border border-[#D4DDD0] rounded-lg text-xs font-bold text-[#5D6B5C] hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toast.success("Preparing PDF print format...");
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-4 py-2 bg-[#1A5438] hover:bg-[#113B26] rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ACTIVE ARTICLE READER MODAL
      ══════════════════════════════════════════ */}
      {activeReadingPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col text-left max-h-[90vh] overflow-y-auto">
            
            {/* Close */}
            <button 
              onClick={() => setActiveReadingPost(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition text-[#5D6B5C]"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Article Detail */}
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                <img
                  src={activeReadingPost.coverImage}
                  alt={activeReadingPost.title}
                  className="w-full h-full object-cover"
                />
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
                <div className="h-8 w-8 rounded-full bg-[#1A5438]/10 text-[#1A5438] font-bold text-xs flex items-center justify-center">
                  {activeReadingPost.author.avatarInitials}
                </div>
                <div>
                  <strong className="text-xs text-[#1A3A1A] block">{activeReadingPost.author.name}</strong>
                  <span className="text-[10px] text-[#5D6B5C] block font-semibold">{activeReadingPost.author.role}</span>
                </div>
              </div>

              {/* Article Content with Inline Images support */}
              <div className="text-xs sm:text-sm text-[#3E4C3D] leading-relaxed space-y-4 font-['Open_Sans'] whitespace-pre-line">
                <p>{activeReadingPost.body}</p>

                {/* Inline body images */}
                {activeReadingPost.bodyImages && activeReadingPost.bodyImages.length > 0 && (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 my-4">
                    {activeReadingPost.bodyImages.map((imgUrl, i) => (
                      <div key={i} className="aspect-video rounded-lg overflow-hidden border border-[#D4DDD0] bg-[#E2EADF]">
                        <img
                          src={imgUrl}
                          alt="Inline article visual"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Actions */}
            <div className="mt-6 border-t border-gray-150 pt-4 flex justify-end gap-2">
              <button
                onClick={() => setActiveReadingPost(null)}
                className="px-5 py-2 bg-[#1A5438] hover:bg-[#113B26] rounded-lg text-xs font-bold text-white transition"
              >
                Close Article
              </button>
            </div>

          </div>
        </div>
      )}

    </AppLayout>
  );
}
