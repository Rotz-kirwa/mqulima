import { useEffect, useState, useCallback } from "react";

const WISHLIST_STORAGE_KEY = "mqulima_wishlist";
const WISHLIST_EVENT = "mqulima-wishlist-updated";

export function readWishlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.map((id) => String(id).trim()).filter(Boolean)));
  } catch {
    return [];
  }
}

export function writeWishlistIds(ids: string[]): string[] {
  const unique = Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(unique));
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: unique }));
    } catch {}
  }
  return unique;
}

export function useWishlistIds() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readWishlistIds());
    const sync = () => setIds(readWishlistIds());
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const removeId = useCallback((id: string) => {
    const next = readWishlistIds().filter((x) => x !== id);
    writeWishlistIds(next);
    setIds(next);
  }, []);

  const toggleId = useCallback((id: string) => {
    const current = readWishlistIds();
    const exists = current.includes(id);
    const next = exists ? current.filter((x) => x !== id) : [...current, id];
    writeWishlistIds(next);
    setIds(next);
    return !exists;
  }, []);

  return { wishlistIds: ids, removeWishlistId: removeId, toggleWishlistId: toggleId };
}

