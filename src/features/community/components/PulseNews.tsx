import React, { useState } from "react";
import { TrendingUp, CloudRain, ShieldAlert, Newspaper } from "lucide-react";
import { PulsePost } from "../types/community.types";

interface Props {
  pulsePosts: PulsePost[];
}

export const PulseNews: React.FC<Props> = ({ pulsePosts }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const defaultPulse: PulsePost[] = [
    {
      id: "p1",
      title: "Ministry Issues Fall Armyworm Warning for Rift Valley Maize Belt",
      content: "Farmers in Uasin Gishu, Trans Nzoia, and Nandi are advised to inspect young maize crops daily following early rains.",
      category: "Agronomy Alert",
      source: "KALRO Extension Service",
      date: "Today"
    },
    {
      id: "p2",
      title: "Dry Maize Wholesale Prices Surge 8% in Nairobi Markets",
      content: "Increasing demand from urban millers has driven wholesale price per 90kg bag to KES 3,800 in Wakulima Market.",
      category: "Market Trend",
      source: "Mqulima Market Intelligence",
      date: "Yesterday"
    },
    {
      id: "p3",
      title: "KEPHIS Releases 4 New Drought-Tolerant Hybrid Bean Varieties",
      content: "Certified seed distributors across Central and Eastern regions will begin stocking KAT-B16 starting next week.",
      category: "Policy Update",
      source: "KEPHIS Official Bulletin",
      date: "2 days ago"
    }
  ];

  const itemsToRender = pulsePosts && pulsePosts.length > 0 ? pulsePosts : defaultPulse;

  const filteredItems = itemsToRender.filter(item =>
    categoryFilter === "all" || item.category === categoryFilter
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Market Trend":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case "Weather Alert":
        return <CloudRain className="h-4 w-4 text-blue-400" />;
      case "Agronomy Alert":
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      default:
        return <Newspaper className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0C1510] p-3 rounded-2xl border border-[#1B3627]">
        {["all", "Market Trend", "Weather Alert", "Agronomy Alert", "Policy Update"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              categoryFilter === cat
                ? "bg-[#2D6A4F] text-white shadow"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of news items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-[#1B3627] bg-[#0C1510] p-5 shadow-lg hover:border-[#2D6A4F]/60 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {getCategoryIcon(item.category)}
                  {item.category}
                </span>
                <span className="text-[11px] text-white/40">{item.date}</span>
              </div>

              <h3 className="text-sm font-bold text-white mt-2 leading-snug">{item.title}</h3>
              <p className="text-xs text-white/70 mt-2 leading-relaxed">{item.content}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1B3627] flex items-center justify-between text-[11px] text-white/50">
              <span>Source: <strong className="text-white/80">{item.source}</strong></span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
