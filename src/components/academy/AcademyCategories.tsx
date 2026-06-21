import React from "react";

interface AcademyCategoriesProps {
  onCategorySelect?: (slug: string) => void;
  activeCategory?: string;
}

export function AcademyCategories({ onCategorySelect, activeCategory }: AcademyCategoriesProps) {
  const categories = [
    { name: "Crop Farming", slug: "crop-farming", count: 12, icon: "🌽" },
    { name: "Livestock", slug: "livestock", count: 8, icon: "🐄" },
    { name: "Irrigation", slug: "irrigation", count: 5, icon: "💧" },
    { name: "Organic Farming", slug: "organic", count: 7, icon: "🌿" },
    { name: "Post-Harvest", slug: "post-harvest", count: 6, icon: "📦" },
    { name: "Agri-Business", slug: "agri-business", count: 9, icon: "📈" },
  ];

  return (
    <section className="py-12 md:py-16 bg-white border-t border-b border-gray-100 text-left">
      <div className="container-px mx-auto max-w-7xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#1a5c2f]">
          Browse by topic
        </span>
        <h2 className="mt-2 text-2xl font-black text-[#0c2e17] tracking-tight">
          What do you want to grow?
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => onCategorySelect?.(cat.slug)}
                className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 cursor-pointer w-full group ${
                  isActive
                    ? "border-[#1a5c2f] bg-[#1a5c2f]/5 shadow-sm"
                    : "border-black/[0.08] bg-white hover:border-[#1a5c2f] hover:-translate-y-0.5 hover:shadow-sm"
                }`}
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gray-50 text-2xl group-hover:scale-110 transition duration-200">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0c2e17] group-hover:text-[#1a5c2f] transition">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                    {cat.count} Courses
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
