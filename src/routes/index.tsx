import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { HomeHero } from "@/components/mqulima/HomeHero";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Users, Globe, ShoppingBag, BookOpen, ChevronLeft, ChevronRight, ShieldAlert, Sparkles, Compass, HelpCircle } from "lucide-react";
import { articles } from "@/lib/mqulima-data";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedProducts } from "@/lib/api/products.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mqulima — Agriculture for the Future" },
      {
        name: "description",
        content:
          "Cutting through the noise to empower farmers with the right knowledge, authentic products, and premium services.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: dbFeaturedProducts } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: () => getFeaturedProducts()
  });

  const featuredProducts = dbFeaturedProducts || [];
  const featuredArticles = articles.slice(0, 3);

  // Horizontal scroll ref for the Farm Essentials slideshow/grid
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <AppLayout>
      <HomeHero />

      {/* ══════════════════════════════════════════
          1. VALUE PROPOSITION
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#F4F8F5] py-24 text-[#0A1E0C] lg:py-32 border-b border-[#0A1E0C]/5">
        {/* Glowing soft color accents */}
        <div className="absolute left-1/4 top-1/4 h-[350px] w-[350px] rounded-full bg-[#52B788]/20 blur-[130px] pointer-events-none" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-[#F5A623]/15 blur-[120px] pointer-events-none" />
        
        {/* Subtle grid line layer */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#0A1E0C 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        <div className="container-px mx-auto max-w-6xl relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
            
            {/* Left Header Column */}
            <div className="lg:col-span-5 flex flex-col items-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#52B788]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#52B788]">
                <Sparkles className="h-3 w-3" />
                Value Proposition
              </span>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[#0A1E0C]">
                Who is <br />
                <span className="text-[#52B788]">Mqulima</span>
              </h2>

              <p className="mt-4 text-sm text-[#0A1E0C]/60 max-w-sm">
                We exist to separate verified truth from farming hearsay, protecting your harvest and livelihood.
              </p>
              
              {/* Identity Tagline Box */}
              <div className="relative mt-8 overflow-hidden rounded-2xl border border-[#0A1E0C]/10 bg-white p-6 shadow-md">
                <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-[#F5A623]/10 blur-xl" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F5A623]">
                  Our Creed
                </span>
                <div className="mt-2 text-lg font-black tracking-wider text-[#0A1E0C]">
                  BOLD. RELIABLE. THE FUTURE.
                </div>
              </div>
            </div>

            {/* Right Interactive manifesto cards */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Card 1: The Challenge */}
              <div className="relative overflow-hidden rounded-2xl border border-red-500/10 bg-white p-6 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1 bg-red-500/60" />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0A1E0C] flex items-center gap-2">
                      Cutting Through the Noise
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-red-600">
                        99% is Gossip
                      </span>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#0A1E0C]/70">
                      There are 5 billion voices trying to shape how agriculture should be done. 99% is noise. Farmers rely on gossip, rumours, hearsay, outdated practices, and sometimes, outright lies.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: The Core Freedom */}
              <div className="relative overflow-hidden rounded-2xl border border-[#52B788]/10 bg-white p-6 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#52B788]/60" />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#52B788]/10 text-[#52B788]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0A1E0C] flex items-center gap-2">
                      Farming is Freedom
                      <span className="rounded-full bg-[#52B788]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#409c71]">
                        The Truth
                      </span>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#0A1E0C]/70">
                      We cut through the confusion to bring you the truth and light. We know Farming is freedom. We give you exactly that: **Freedom**.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: The Call to Action / Decision Card */}
              <div className="relative overflow-hidden rounded-2xl border border-[#F5A623]/10 bg-white p-6 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#F5A623]/60" />
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5A623]/10 text-[#F5A623]">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0A1E0C]">
                      The Right Decisions
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#0A1E0C]/70">
                      We set the record straight for you to access the right information, the best products, and premium services. We enable you to make the right decisions with absolute confidence.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. FEATURED COLLECTION (Farm Essentials)
      ══════════════════════════════════════════ */}
      <section className="bg-[#FAF9F5] py-24 text-[#0A1E0C] lg:py-32">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header Row with Navigation */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#52B788]">
                Featured Collection
              </span>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0A1E0C] sm:text-5xl">
                Farm Essentials
              </h2>
              <p className="mt-2 text-sm text-[#0A1E0C]/65">
                What’s popular? See what other farmers are getting.
              </p>
            </div>
            
            {/* Slider control arrows */}
            <div className="flex items-center gap-3">
              <button
                onClick={scrollLeft}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0A1E0C]/10 bg-white shadow-sm transition hover:bg-[#0A1E0C]/5 active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollRight}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0A1E0C]/10 bg-white shadow-sm transition hover:bg-[#0A1E0C]/5 active:scale-95"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Product Slideshow/Grid */}
          <div
            ref={sliderRef}
            className="no-scrollbar flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {featuredProducts.map((p) => (
              <article
                key={p.id}
                className="group w-[280px] shrink-0 snap-start flex flex-col overflow-hidden rounded-2xl border border-[#0A1E0C]/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#FAF9F5]">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {p.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#F5A623] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
                    {p.brand} · {p.category}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-bold text-[#0A1E0C] min-h-[40px]">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#0A1E0C]/60 line-clamp-2">
                    {p.description}
                  </p>
                  
                  <div className="mt-5 flex items-end justify-between pt-3 border-t border-[#0A1E0C]/5">
                    <div>
                      <div className="text-base font-extrabold text-[#0A1E0C]">
                        KES {p.price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#0A1E0C]/50">per {p.unit}</div>
                    </div>
                    <button
                      onClick={() => toast.success(`${p.name} added to cart`)}
                      aria-label="Add to cart"
                      className="flex items-center gap-1.5 rounded-lg bg-[#F5A623] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#e09520]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Centered Primary Action */}
          <div className="mt-12 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#e09520] hover:scale-[1.02] shadow-md shadow-[#F5A623]/25"
            >
              View our products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. BRAND STORY SNAPSHOT (Our Promise)
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-24 text-[#0A1E0C] lg:py-32 border-y border-[#0A1E0C]/5">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        
        <div className="container-px mx-auto max-w-4xl relative z-10 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#F5A623]">
            Brand Story Snapshot
          </span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0A1E0C] sm:text-5xl">
            Our Promise
          </h2>
          
          <div className="mt-8 space-y-6 text-[#0A1E0C]/80 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            <p>
              Agriculture is the future. It’s where freedom resides, yet farmers rely on fragmented information, unreliable suppliers, difficult to access services and unreachable knowledge hubs.
            </p>
            <p className="text-[#0A1E0C] font-semibold text-lg md:text-xl">
              We created Mqulima to cut through the noise and bring you to Paradise.
            </p>
            <p className="border-y border-[#0A1E0C]/10 py-6 text-sm uppercase tracking-wider text-[#52B788] font-bold">
              Our mission is Simple: To empower farmers with the right knowledge, authentic products and premium services.
            </p>
            <p>
              We believe that when farmers have access to reliable knowledge and modern systems, they can produce more, earn more, and transform their lives. The food system wins.
            </p>
            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-widest">
              This platform is not just an agrochemical market. It’s the future of farming.
            </p>
          </div>

          <div className="mt-12">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-[#F5A623]/20 transition hover:bg-[#e09520] hover:scale-[1.02]"
            >
              Be part of our Story
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. SOCIAL PROOF (Testimonials & Stats)
      ══════════════════════════════════════════ */}
      <section className="bg-[#FAF9F5] py-24 text-[#0A1E0C] lg:py-32">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#52B788]">
              Social Proof
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0A1E0C] sm:text-4xl">
              Loved by Farmers and adored by agricultural experts
            </h2>
          </div>

          {/* Testimonial Cards Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote: "Finally a platform where farmers can access reliable information and services under one roof.",
                author: "Agronomist, Nakuru",
              },
              {
                quote: "The search and headache is finally over. I have found the knowledge, quality products and a community all in one place. God bless Mqulima.",
                author: "Farmer, Uasin Gishu",
              },
              {
                quote: "This platform is what agriculture in Kenya has been missing.",
                author: "Livestock farmer, Baringo",
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-[#0A1E0C]/5 bg-white p-8 shadow-sm flex flex-col justify-between"
              >
                <span className="text-5xl text-[#52B788]/20 font-serif absolute top-4 left-4 pointer-events-none">
                  “
                </span>
                <p className="relative z-10 text-sm leading-relaxed text-[#0A1E0C]/80 italic">
                  {t.quote}
                </p>
                <div className="mt-6 pt-4 border-t border-[#0A1E0C]/5 text-xs font-bold text-[#0A1E0C]">
                  — {t.author}
                </div>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-20 rounded-3xl border border-[#0A1E0C]/5 bg-white p-8 md:p-12 text-[#0A1E0C] shadow-lg">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#0A1E0C]/10">
              {[
                { count: "5,000+", label: "Farmers Served", icon: Users, color: "#3B82F6" },
                { count: "20+", label: "Counties Reached", icon: Globe, color: "#F5A623" },
                { count: "317+", label: "Products Listed", icon: ShoppingBag, color: "#3B82F6" },
                { count: "150+", label: "Knowledge Articles", icon: BookOpen, color: "#F5A623" },
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center p-4 first:pt-0 md:first:pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A1E0C]/5 mb-3" style={{ color: s.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-3xl font-extrabold sm:text-4xl text-[#0A1E0C]">{s.count}</div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#0A1E0C]/50">
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. COMMUNITY & KNOWLEDGE HUB
      ══════════════════════════════════════════ */}
      <section className="bg-[#F4EFE6] py-24 text-[#0A1E0C] lg:py-32">
        <div className="container-px mx-auto max-w-7xl">
          
          {/* Header & Intro */}
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-12 items-end mb-16">
            <div className="lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#52B788]">
                Community and Knowledge Hub
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0A1E0C] sm:text-4xl leading-tight">
                Information that keeps farmers in the know and knowledge that moves them forward
              </h2>
            </div>
            <div className="lg:col-span-5 text-sm text-[#0A1E0C]/75 leading-relaxed">
              <p>
                The difference between success and losses in agriculture is information. Our Hub brings together practical insights from agronomists, market analysts, climate smart community, experts and experienced farmers under one roof.
              </p>
            </div>
          </div>

          {/* Blogs Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            {featuredArticles.map((a) => (
              <article
                key={a.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#0A1E0C]/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-white">
                  <img
                    src={a.image}
                    alt={a.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-[#0A1E0C] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                    {a.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span className="text-[10px] font-semibold text-[#0A1E0C]/50">{a.readTime} read</span>
                  <h3 className="mt-2 text-base font-bold text-[#0A1E0C] line-clamp-2 group-hover:text-[#3B82F6] transition">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#0A1E0C]/65 line-clamp-3 leading-relaxed flex-1">
                    {a.excerpt}
                  </p>
                  
                  <Link
                    to="/blog"
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:underline"
                  >
                    Read article <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Action Button */}
          <div className="mt-12 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-full bg-[#F5A623] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#e09520] hover:scale-[1.02] shadow-md shadow-[#F5A623]/25"
            >
              Check out our Hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. CONVERSION PATH
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#E8F3EF] via-[#FAF9F5] to-[#F3EFE6] py-24 text-[#0A1E0C] text-center border-t border-[#0A1E0C]/5">
        {/* Soft atmospheric gradient glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#52B788]/10 blur-[150px]" />
        
        <div className="container-px mx-auto max-w-4xl relative z-10">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#F5A623]">
            Conversion Path
          </span>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0A1E0C] sm:text-5xl">
            Join the future of farming
          </h2>
          
          <p className="mt-6 text-base leading-relaxed text-[#0A1E0C]/75 max-w-2xl mx-auto md:text-lg">
            Grab a comfortable seat and get access to first class agriculture, five-star services, modern knowledge and premium products. We are not only designed for winners, we power success.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#F5A623] px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#F5A623]/25 transition hover:bg-[#e09520] hover:scale-[1.02] active:scale-100"
            >
              View Shop
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2.5 rounded-full border border-[#0A1E0C]/20 bg-[#0A1E0C]/5 px-8 py-4 text-sm font-semibold text-[#0A1E0C] transition hover:bg-[#0A1E0C]/10"
            >
              Read Blog
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
