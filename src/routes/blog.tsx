import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, BookOpen, Clock, Calendar, ArrowRight, User } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { articles as rawArticles } from "@/lib/mqulima-data";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Agricultural Blog & Field Guides · Mqulima" },
      {
        name: "description",
        content: "Practical farming guides, crop agronomy tips, and livestock management practices written by verified veterinarians and agronomists.",
      },
    ],
  }),
  component: BlogPage,
});

// Enriched articles details
const blogDetails: Record<string, { date: string; author: { name: string; role: string; avatar: string }; related: { label: string; to: string }[] }> = {
  a1: {
    date: "June 15, 2026",
    author: { name: "Dr. Samuel Mwangi", role: "Chief Agronomist", avatar: "👨🏼‍🌾" },
    related: [
      { label: "Mavuno Planting Fertilizer", to: "/shop" },
      { label: "DK 8031 Hybrid Maize Seed", to: "/shop" },
      { label: "Soil Testing Service", to: "/services" },
    ],
  },
  a2: {
    date: "June 12, 2026",
    author: { name: "Dr. Faith Achieng", role: "Vet Services Specialist", avatar: "👩🏽‍⚕️" },
    related: [
      { label: "Vet Appointment Service", to: "/services" },
      { label: "Maclick Super Dewormer", to: "/shop" },
      { label: "Artificial Insemination", to: "/services" },
    ],
  },
  a3: {
    date: "June 08, 2026",
    author: { name: "Dr. Samuel Mwangi", role: "Chief Agronomist", avatar: "👨🏼‍🌾" },
    related: [
      { label: "Climate Intelligence Dashboard", to: "/climate" },
      { label: "Advisory Services Booking", to: "/services" },
    ],
  },
  a4: {
    date: "June 02, 2026",
    author: { name: "Brian Kiprono", role: "Business Lead", avatar: "👨🏾‍💼" },
    related: [
      { label: "Advisory Services Booking", to: "/services" },
      { label: "Mqulima Marketplace", to: "/shop" },
    ],
  },
};

const categories = ["All", "Crops", "Livestock", "Business", "Climate"];

function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const enrichedArticles = useMemo(() => {
    return rawArticles.map((a) => {
      const details = blogDetails[a.id] || {
        date: "June 01, 2026",
        author: { name: "Mqulima Editorial", role: "Agri-Advisor", avatar: "🌿" },
        related: [],
      };
      return { ...a, ...details };
    });
  }, []);

  const filteredArticles = useMemo(() => {
    return enrichedArticles.filter((a) => {
      const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            a.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [enrichedArticles, selectedCategory, searchQuery]);

  const featuredArticle = useMemo(() => {
    return enrichedArticles[0]; // Spotlight the first article as featured
  }, [enrichedArticles]);

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen font-sans">
        {/* Banner */}
        <section className="bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] py-16 text-white text-left">
          <div className="container-px mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A623]">
              <BookOpen className="h-4 w-4" /> Mqulima Blog & Guides
            </span>
            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl tracking-tight">
              Practical Agricultural Intelligence.
            </h1>
            <p className="mt-2 max-w-xl text-white/80 text-sm leading-relaxed">
              Field-tested guides, business strategies, and veterinarian advice curated for Kenyan farmers.
            </p>
          </div>
        </section>

        <section className="container-px mx-auto max-w-7xl py-12">
          {/* Spotlight / Featured Post (Only visible if no active search/category filter) */}
          {selectedCategory === "All" && !searchQuery && featuredArticle && (
            <div className="mb-12 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md transition hover:shadow-lg lg:flex">
              <div className="lg:w-1/2">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="h-72 w-full object-cover lg:h-full"
                />
              </div>
              <div className="p-8 lg:w-1/2 flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="rounded-full bg-[#2D6A4F]/10 px-2.5 py-1 text-[#2D6A4F]">
                      Featured · {featuredArticle.category}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {featuredArticle.readTime} read
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-extrabold text-[#1A3D2F] md:text-3xl leading-tight">
                    {featuredArticle.title}
                  </h2>
                  <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-2xl">
                        {featuredArticle.author.avatar}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1A1A1A]">{featuredArticle.author.name}</div>
                        <div className="text-[10px] text-gray-400 font-semibold">{featuredArticle.author.role}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {featuredArticle.date}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Categories Bar */}
          <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-6">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    c === selectedCategory
                      ? "border-[#2D6A4F] bg-[#2D6A4F] text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[#2D6A4F]/40 hover:bg-[#2D6A4F]/5"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-[#2D6A4F]"
              />
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid gap-8 lg:grid-cols-[2.5fr_1fr]">
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((a) => (
                  <article
                    key={a.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md text-left"
                  >
                    <div>
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={a.image}
                          alt={a.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-2.5 py-0.5 text-[9px] font-bold text-[#2D6A4F] shadow-sm">
                          {a.category}
                        </span>
                      </div>
                      
                      <div className="p-5">
                        <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> {a.date} · <Clock className="h-3 w-3" /> {a.readTime}
                        </div>
                        <h3 className="mt-2 text-base font-extrabold text-[#1A3D2F] group-hover:text-[#2D6A4F] transition duration-200">
                          {a.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500 leading-relaxed">
                          {a.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 p-5 bg-gray-50/50 flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-lg">
                        {a.author.avatar}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-[#1A1A1A]">{a.author.name}</div>
                        <div className="text-[9px] text-gray-400 font-semibold">{a.author.role}</div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-2 py-16 text-center text-gray-400 font-medium">
                  No articles found matching "{searchQuery}"
                </div>
              )}
            </div>

            {/* Sidebar Suggestions */}
            <aside className="space-y-6">
              {/* Highlight Box */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 text-left">
                <h3 className="text-sm font-extrabold text-[#1A3D2F] border-b border-gray-100 pb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#2D6A4F]" /> Contributor Network
                </h3>
                <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                  Our articles are written directly by licensed agricultural specialists, veterinary doctors, and experienced cooperative farm leaders to guarantee high reliability.
                </p>
              </div>

              {/* Related Resources for Active Filters */}
              <div className="rounded-3xl bg-forest p-6 text-forest-foreground text-left shadow-elegant">
                <h3 className="text-sm font-extrabold text-white">Recommended Inputs</h3>
                <p className="mt-1 text-xs text-white/60">Sourced items matching article advice:</p>
                
                <ul className="mt-4 space-y-2 text-xs">
                  {enrichedArticles.map((a) => 
                    a.related.map((r, i) => (
                      <li key={`${a.id}-${i}`}>
                        <Link
                          to={r.to as any}
                          className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-white/90 hover:bg-white/10 transition"
                        >
                          <span className="font-semibold">{r.label}</span>
                          <ArrowRight className="h-3 w-3 text-gold" />
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
