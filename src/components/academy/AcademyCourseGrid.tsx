import React, { useState, useMemo } from "react";
import { Star, Clock, BookOpen, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AcademyImagePlaceholder } from "./AcademyImagePlaceholder";

interface AcademyCourseGridProps {
  onEnrollClick?: (courseId: string, price: number) => void;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export const initialCourses = [
  {
    id: "poultry",
    slug: "poultry-production",
    category: "livestock",
    level: "Beginner",
    title: "Commercial Broiler & Layer Production",
    price_kes: 950,
    rating: 4.8,
    review_count: 142,
    duration_hours: 5.5,
    instructor_name: "Samuel Otieno",
    brief: "Inside a well-managed poultry shed, rows of healthy white broilers. Clean floor. Good lighting. Kenyan setting."
  },
  {
    id: "drip",
    slug: "drip-irrigation",
    category: "irrigation",
    level: "Beginner",
    title: "Drip Irrigation Design & Maintenance",
    price_kes: 850,
    rating: 4.9,
    review_count: 86,
    duration_hours: 4.0,
    instructor_name: "Dr. Miriam Wanjiku",
    brief: "Ground-level shot of drip irrigation tape running between rows of healthy vegetables. Water droplets on leaves."
  },
  {
    id: "greenhouse",
    slug: "greenhouse-tomatoes",
    category: "crop-farming",
    level: "Advanced",
    title: "Greenhouse Tomato Disease Protocol",
    price_kes: 1500,
    rating: 4.7,
    review_count: 64,
    duration_hours: 8.0,
    instructor_name: "Dr. Miriam Wanjiku",
    brief: "Interior of a greenhouse full of tomato plants in full fruit, farmer visible in background checking plants."
  },
  {
    id: "market",
    slug: "agribusiness-negotiation",
    category: "agri-business",
    level: "Advanced",
    title: "Negotiating with Wholesale Offtakers",
    price_kes: 1100,
    rating: 4.9,
    review_count: 98,
    duration_hours: 3.5,
    instructor_name: "Amina Hassan",
    brief: "Vibrant Kenyan open-air market scene, fresh produce displayed, farmer/seller in foreground. Busy, colourful, real."
  }
];

const filterTabs = [
  { label: "All", slug: "All" },
  { label: "Crop Farming", slug: "crop-farming" },
  { label: "Livestock", slug: "livestock" },
  { label: "Irrigation", slug: "irrigation" },
  { label: "Organic", slug: "organic" },
  { label: "Post-Harvest", slug: "post-harvest" },
  { label: "Agri-Business", slug: "agri-business" }
];

export function AcademyCourseGrid({ onEnrollClick, activeFilter = "All", onFilterChange }: AcademyCourseGridProps) {
  const [localFilter, setLocalFilter] = useState("All");

  const currentFilter = onFilterChange ? activeFilter : localFilter;
  const setFilter = onFilterChange ? onFilterChange : setLocalFilter;

  const filteredCourses = useMemo(() => {
    if (currentFilter === "All") return initialCourses;
    return initialCourses.filter((c) => c.category === currentFilter);
  }, [currentFilter]);

  return (
    <section className="py-12 md:py-16 bg-[#FAF9F6] text-left">
      <div className="container-px mx-auto max-w-7xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1a5c2f]">
          All courses
        </span>

        {/* Filter bar */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-gray-200 pb-4 overflow-x-auto scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = currentFilter === tab.slug;
            return (
              <button
                key={tab.slug}
                onClick={() => setFilter(tab.slug)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#1a5c2f] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-[#1a5c2f]/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Course Grid container */}
        <motion.div
          layout
          className="mt-8 grid gap-6 md:grid-cols-2"
        >
          <AnimatePresence mode="popLayout">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((c) => (
                <motion.article
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group relative overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Image Container */}
                    <div className="h-44 overflow-hidden relative">
                      <AcademyImagePlaceholder
                        brief={c.brief}
                        aspect="w-full h-full"
                        className="transition-transform duration-200 group-hover:scale-103"
                      />
                      {/* Level Badge top-right */}
                      <span className={`absolute top-3 right-3 z-20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        c.level === "Beginner"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {c.level}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#1a5c2f]">
                        {c.category.replace("-", " ")}
                      </span>
                      <h3 className="mt-2 text-base font-extrabold text-[#0c2e17] leading-snug group-hover:text-[#1a5c2f] transition">
                        {c.title}
                      </h3>
                      
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 font-semibold">
                        <span>Instructor: <strong className="text-gray-600">{c.instructor_name}</strong></span>
                        <span>·</span>
                        <span>{c.duration_hours} hrs</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating + Price Bottom Bar */}
                  <div className="border-t border-gray-100 p-5 bg-gray-50/50 flex items-center justify-between relative overflow-hidden">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" /> {c.rating}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold">({c.review_count} reviews)</span>
                    </div>
                    <div className="text-sm font-extrabold text-[#1a5c2f]">
                      KSh {c.price_kes.toLocaleString()}
                    </div>

                    {/* Hover Overlay Button */}
                    <div className="absolute inset-0 bg-[#1a5c2f] text-white flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-200 pointer-events-none group-hover:pointer-events-auto">
                      <button
                        onClick={() => onEnrollClick?.(c.id, c.price_kes)}
                        className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest cursor-pointer py-full w-full h-full justify-center"
                      >
                        <span>Enroll Now — KSh {c.price_kes}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="col-span-2 py-16 text-center text-gray-400 font-medium text-xs">
                No courses found in this category.
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
