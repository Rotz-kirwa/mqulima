import React from "react";

/**
 * Reusable shimmer pulse primitive
 */
function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/80 dark:bg-white/10 rounded-md ${className}`}
    />
  );
}

/**
 * Skeleton for the Home Page (/)
 */
export function HomeSkeleton() {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Hero section skeleton */}
      <div className="relative h-[90svh] min-h-[580px] w-full bg-[#0B2117] flex items-center px-4 sm:px-8">
        <div className="mx-auto max-w-7xl w-full flex flex-col justify-center space-y-6 pt-12">
          {/* Micro badge */}
          <SkeletonPulse className="h-6 w-36 rounded-full bg-white/20" />
          {/* Title */}
          <div className="space-y-3 max-w-2xl">
            <SkeletonPulse className="h-10 sm:h-14 w-full bg-white/20" />
            <SkeletonPulse className="h-10 sm:h-14 w-3/4 bg-white/20" />
          </div>
          {/* Subtitle */}
          <div className="space-y-2 max-w-xl">
            <SkeletonPulse className="h-4 w-full bg-white/15" />
            <SkeletonPulse className="h-4 w-5/6 bg-white/15" />
          </div>
          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <SkeletonPulse className="h-12 w-36 sm:w-44 rounded-xl bg-[#F5A623]/70" />
            <SkeletonPulse className="h-12 w-36 sm:w-44 rounded-xl bg-white/20" />
          </div>
        </div>
      </div>

      {/* Featured sections preview */}
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
        {/* Categories Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-20 rounded-2xl" />
          ))}
        </div>

        {/* Featured Products Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SkeletonPulse className="h-8 w-48" />
            <SkeletonPulse className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 border border-border/40 rounded-2xl space-y-3">
                <SkeletonPulse className="aspect-square w-full rounded-xl" />
                <SkeletonPulse className="h-4 w-3/4" />
                <SkeletonPulse className="h-5 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the AgroShop Page (/shop)
 */
export function ShopSkeleton() {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Secondary shop header bar skeleton */}
      <div className="border-b border-border/40 bg-muted/30 py-3 px-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <SkeletonPulse className="h-10 flex-1 max-w-xl rounded-lg" />
          <SkeletonPulse className="h-9 w-28 rounded-lg hidden sm:block" />
        </div>
      </div>

      {/* Categories scroller */}
      <div className="border-b border-border/30 bg-muted/10 py-2.5 px-4">
        <div className="mx-auto max-w-7xl flex items-center gap-3 overflow-hidden">
          <SkeletonPulse className="h-5 w-28 shrink-0" />
          <div className="flex gap-2 flex-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonPulse key={i} className="h-8 w-32 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between pb-6">
          <div className="space-y-1.5">
            <SkeletonPulse className="h-7 w-40" />
            <SkeletonPulse className="h-4 w-28" />
          </div>
          <SkeletonPulse className="h-9 w-36 rounded-lg" />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card p-3 sm:p-4 space-y-3 shadow-xs"
            >
              <SkeletonPulse className="aspect-square w-full rounded-xl" />
              <div className="space-y-1.5 pt-1">
                <SkeletonPulse className="h-3 w-16 rounded-full" />
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-2/3" />
              </div>
              <div className="pt-2 flex items-center justify-between">
                <SkeletonPulse className="h-5 w-20" />
                <SkeletonPulse className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Blog / News Page (/blog)
 */
export function BlogSkeleton() {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Blog header skeleton */}
      <div className="border-b border-border/40 bg-muted/20 py-10 px-4">
        <div className="mx-auto max-w-7xl space-y-3">
          <SkeletonPulse className="h-4 w-24 rounded-full" />
          <SkeletonPulse className="h-9 sm:h-12 w-80 max-w-full" />
          <SkeletonPulse className="h-4 w-96 max-w-full" />
          {/* Category tabs */}
          <div className="flex gap-2 pt-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonPulse key={i} className="h-9 w-28 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      </div>

      {/* Blog Cards Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card overflow-hidden space-y-4 pb-4 shadow-xs"
            >
              <SkeletonPulse className="aspect-video w-full" />
              <div className="px-4 space-y-2.5">
                <SkeletonPulse className="h-3.5 w-20 rounded-full" />
                <SkeletonPulse className="h-5 w-full" />
                <SkeletonPulse className="h-4 w-4/5" />
                <SkeletonPulse className="h-3.5 w-full" />
                <SkeletonPulse className="h-3.5 w-2/3" />
                <div className="pt-3 flex items-center gap-3">
                  <SkeletonPulse className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <SkeletonPulse className="h-3 w-24" />
                    <SkeletonPulse className="h-2.5 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Forum / Community Page (/community)
 */
export function CommunitySkeleton() {
  return (
    <div className="w-full min-h-screen bg-background">
      {/* Forum Subheader */}
      <div className="border-b border-border/40 bg-muted/20 py-4 px-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <SkeletonPulse className="h-6 w-32" />
            <SkeletonPulse className="h-3.5 w-64" />
          </div>
          <SkeletonPulse className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <SkeletonPulse className="h-48 rounded-2xl" />
          <SkeletonPulse className="h-64 rounded-2xl" />
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-6 space-y-4">
          {/* Post composer skeleton */}
          <div className="p-4 border border-border/50 rounded-2xl bg-card space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonPulse className="h-10 w-10 rounded-full" />
              <SkeletonPulse className="h-10 flex-1 rounded-xl" />
            </div>
            <div className="flex justify-between pt-2">
              <SkeletonPulse className="h-7 w-20 rounded-lg" />
              <SkeletonPulse className="h-7 w-24 rounded-lg" />
            </div>
          </div>

          {/* Posts list */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 border border-border/50 rounded-2xl bg-card space-y-3">
              <div className="flex items-center gap-3">
                <SkeletonPulse className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <SkeletonPulse className="h-4 w-32" />
                  <SkeletonPulse className="h-3 w-20" />
                </div>
              </div>
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-5/6" />
              <SkeletonPulse className="h-48 w-full rounded-xl" />
              <div className="flex gap-4 pt-2">
                <SkeletonPulse className="h-6 w-16 rounded-full" />
                <SkeletonPulse className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <SkeletonPulse className="h-56 rounded-2xl" />
          <SkeletonPulse className="h-72 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Tools Page (/tools)
 */
export function ToolsSkeleton() {
  return (
    <div className="w-full min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-2 max-w-xl">
          <SkeletonPulse className="h-4 w-20 rounded-full" />
          <SkeletonPulse className="h-9 sm:h-12 w-64" />
          <SkeletonPulse className="h-4 w-96 max-w-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 border border-border/50 rounded-2xl bg-card space-y-4">
              <SkeletonPulse className="h-12 w-12 rounded-xl" />
              <SkeletonPulse className="h-6 w-3/4" />
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-5/6" />
              <SkeletonPulse className="h-10 w-32 rounded-xl pt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Services Page (/services)
 */
export function ServicesSkeleton() {
  return (
    <div className="w-full min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-2 max-w-xl">
          <SkeletonPulse className="h-4 w-24 rounded-full" />
          <SkeletonPulse className="h-9 sm:h-12 w-72" />
          <SkeletonPulse className="h-4 w-96 max-w-full" />
        </div>

        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-9 w-32 rounded-full shrink-0" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 border border-border/50 rounded-2xl bg-card space-y-4">
              <div className="flex items-center gap-3">
                <SkeletonPulse className="h-12 w-12 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <SkeletonPulse className="h-4 w-36" />
                  <SkeletonPulse className="h-3 w-24" />
                </div>
              </div>
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-4/5" />
              <div className="flex justify-between items-center pt-3 border-t border-border/30">
                <SkeletonPulse className="h-5 w-24" />
                <SkeletonPulse className="h-8 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Academy Page (/academy)
 */
export function AcademySkeleton() {
  return (
    <div className="w-full min-h-screen bg-[#07160E] py-12 px-4 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="space-y-4 max-w-2xl text-center mx-auto">
          <SkeletonPulse className="h-6 w-36 rounded-full mx-auto bg-white/20" />
          <SkeletonPulse className="h-12 w-80 mx-auto bg-white/20" />
          <SkeletonPulse className="h-4 w-96 mx-auto bg-white/15" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 border border-white/10 rounded-2xl bg-white/5 space-y-4">
              <SkeletonPulse className="aspect-video w-full rounded-xl bg-white/10" />
              <SkeletonPulse className="h-5 w-3/4 bg-white/20" />
              <SkeletonPulse className="h-4 w-full bg-white/10" />
              <SkeletonPulse className="h-8 w-32 rounded-lg bg-[#85CC14]/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Product Detail Page (/shop/product/$slug)
 */
export function ProductDetailSkeleton() {
  return (
    <div className="w-full min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumbs */}
        <SkeletonPulse className="h-4 w-56" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery image */}
          <div className="space-y-3">
            <SkeletonPulse className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonPulse key={i} className="h-16 w-16 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5">
            <SkeletonPulse className="h-4 w-28 rounded-full" />
            <SkeletonPulse className="h-8 sm:h-10 w-full" />
            <SkeletonPulse className="h-8 w-36" />
            <div className="space-y-2 pt-2">
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-3/4" />
            </div>
            <div className="pt-4 flex gap-4">
              <SkeletonPulse className="h-12 w-32 rounded-xl" />
              <SkeletonPulse className="h-12 flex-1 rounded-xl bg-[#85CC14]/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Blog Detail Page (/blog/$slug)
 */
export function BlogDetailSkeleton() {
  return (
    <div className="w-full min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <SkeletonPulse className="h-4 w-28 rounded-full" />
        <SkeletonPulse className="h-10 sm:h-14 w-full" />
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-3 w-20" />
          </div>
        </div>
        <SkeletonPulse className="aspect-video w-full rounded-2xl" />
        <div className="space-y-3 pt-4">
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-5/6" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
