import React, { useState, useEffect } from "react";
import { Star, ArrowUp, ArrowDown } from "lucide-react";
import { adminFetch } from "../../lib/api";

export const FeaturedCollectionModule: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatured = () => {
    setLoading(true);
    adminFetch("/api/admin/featured")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.featuredItems);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  const handleReorder = async (id: string, newPosition: number) => {
    try {
      const res = await adminFetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, displayOrder: newPosition }),
      });
      const data = await res.json();
      if (data.success) fetchFeatured();
    } catch (e) {
      console.error("Reorder error:", e);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#CCE5E1] pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0F3D3C]">Featured Homepage Collections</h1>
          <p className="text-xs text-[#2C5E5B] mt-1">
            Reorder featured marketplace products, academy spotlight courses, and promotional banners.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#CCE5E1] rounded-[6px] p-5 space-y-3 shadow-xs">
        {loading ? (
          <div className="p-6 text-center text-[#4A7C79] font-mono text-xs">Loading featured collection...</div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-[#E8F4F1] border border-[#CCE5E1] rounded-[4px] text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-[2px] bg-[#278C7B] text-white font-mono font-bold flex items-center justify-center">
                  #{item.displayOrder}
                </span>
                <div>
                  <div className="font-bold text-[#0F3D3C]">{item.title}</div>
                  <div className="text-[10px] text-[#4A7C79] font-mono capitalize">
                    {item.entityType} • {item.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={idx === 0}
                  onClick={() => handleReorder(item.id, item.displayOrder - 1)}
                  className="p-1.5 bg-white border border-[#CCE5E1] text-[#0F3D3C] rounded-[4px] disabled:opacity-40 cursor-pointer"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={idx === items.length - 1}
                  onClick={() => handleReorder(item.id, item.displayOrder + 1)}
                  className="p-1.5 bg-white border border-[#CCE5E1] text-[#0F3D3C] rounded-[4px] disabled:opacity-40 cursor-pointer"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
