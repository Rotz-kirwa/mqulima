import { useMemo, useState } from "react";
import { type ShopProduct } from "@/lib/shop-data";

export type ProductSortKey = "relevance" | "price-low" | "price-high" | "rating" | "newest";

export interface ProductFilters {
  q: string;
  category: string;
  maxPrice: number;
  minRating: number;
  county: string;
  organic: boolean;
  verified: boolean;
  sortBy: ProductSortKey;
}

const SORTERS: Record<ProductSortKey, (a: ShopProduct, b: ShopProduct) => number> = {
  relevance: () => 0,
  "price-low": (a, b) => a.price - b.price,
  "price-high": (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => Number(b.badge === "NEW") - Number(a.badge === "NEW"),
};

export function useProductFilters(products: ShopProduct[]) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(30_000);
  const [minRating, setMinRating] = useState(0);
  const [county, setCounty] = useState("All");
  const [organic, setOrganic] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sortBy, setSortBy] = useState<ProductSortKey>("relevance");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return products
      .filter((product) => {
        if (category !== "All" && product.category !== category) return false;
        if (product.price > maxPrice) return false;
        if (product.rating < minRating) return false;
        if (county !== "All" && product.county !== county) return false;
        if (organic && !product.organic) return false;
        if (verified && !product.verifiedSeller) return false;
        if (!query) return true;
        const haystack = `${product.name} ${product.brand} ${product.description}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort(SORTERS[sortBy]);
  }, [products, q, category, maxPrice, minRating, county, organic, verified, sortBy]);

  const reset = () => {
    setQ("");
    setCategory("All");
    setMaxPrice(30_000);
    setMinRating(0);
    setCounty("All");
    setOrganic(false);
    setVerified(false);
    setSortBy("relevance");
  };

  return {
    filtered,
    filters: { q, category, maxPrice, minRating, county, organic, verified, sortBy },
    setters: {
      setQ,
      setCategory,
      setMaxPrice,
      setMinRating,
      setCounty,
      setOrganic,
      setVerified,
      setSortBy,
    },
    reset,
  };
}
