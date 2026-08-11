import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CommunityPost, SokoListing, PulsePost, FarmerProfile } from "../types/community.types";
import { communityService } from "../services/community.service";

export function useCommunityData(authUser: any) {
  const [currentUser, setCurrentUser] = useState<FarmerProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [sokoListings, setSokoListings] = useState<SokoListing[]>([]);
  const [pulsePosts, setPulsePosts] = useState<PulsePost[]>([]);
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [billboardPrices, setBillboardPrices] = useState<{ crop: string; region: string; price: number; prevPrice: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await communityService.fetchSnapshot();

      if (snapshot.showPosts && snapshot.showPosts.length > 0) {
        const mappedPosts: CommunityPost[] = (snapshot.showPosts as any[]).map(sp => ({
          id: sp.id,
          author: {
            username: "@mqulima_farmer",
            name: "Farmer Client",
            country: "Kenya",
            county: "Nakuru",
            interests: [],
            crops: [],
            livestock: [],
            yearsFarming: 1,
            certifications: [],
            reputationScore: 10,
            followersCount: 0,
            followers: [],
            ...sp.author
          },
          title: sp.title || "Farm update",
          body: sp.body,
          category: sp.category || "Farm Progress",
          images: sp.images || [],
          likes: sp.likes || 0,
          hasLiked: sp.hasLiked,
          comments: sp.comments || [],
          cropsTagged: sp.tags || [],
          livestockTagged: [],
          location: sp.author?.county || "Kenya",
          createdAt: sp.createdAt || "Recently"
        }));
        setPosts(mappedPosts);
      }

      if (snapshot.sokoListings && snapshot.sokoListings.length > 0) {
        setSokoListings(snapshot.sokoListings as SokoListing[]);
      }
      if (snapshot.pulsePosts && snapshot.pulsePosts.length > 0) {
        setPulsePosts(snapshot.pulsePosts as PulsePost[]);
      }
      if (snapshot.suggestedFarmers && snapshot.suggestedFarmers.length > 0) {
        setFarmers(snapshot.suggestedFarmers as FarmerProfile[]);
      }
    } catch (e) {
      console.error("Error loading community snapshot:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMarketPrices = useCallback(async () => {
    try {
      const data = await communityService.fetchMarketPrices();
      const fetchedPrices: any[] = [];
      data.forEach(item => {
        (item.entries || []).forEach(entry => {
          fetchedPrices.push({
            crop: `${item.name} (${item.unit})`,
            region: entry.region,
            price: entry.price,
            prevPrice: entry.price
          });
        });
      });
      if (fetchedPrices.length > 0) {
        setBillboardPrices(fetchedPrices);
      }
    } catch (e) {
      console.error("Error loading market prices:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadMarketPrices();

    communityService.fetchCurrentUser()
      .then(profile => {
        if (profile) {
          setCurrentUser(profile);
        } else if (authUser) {
          setCurrentUser({
            username: `@${(authUser.name || "farmer").toLowerCase().replace(/\s+/g, "_")}`,
            name: authUser.name || "Mqulima Farmer",
            country: "Kenya",
            county: authUser.county || "Kenya",
            interests: [],
            crops: authUser.crops ? authUser.crops.split(",").map((s: string) => s.trim()) : [],
            livestock: authUser.livestock ? authUser.livestock.split(",").map((s: string) => s.trim()) : [],
            yearsFarming: 1,
            certifications: [],
            reputationScore: 100,
            followersCount: 0,
            followers: [],
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.name || "Farmer")}&backgroundColor=1a5438&textColor=ffffff`,
            email: authUser.email || "",
          });
        }
      })
      .catch(e => console.error(e));
  }, [authUser, loadData, loadMarketPrices]);

  const toggleLike = async (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasLiked = !post.hasLiked;
        return {
          ...post,
          hasLiked,
          likes: hasLiked ? post.likes + 1 : Math.max(0, post.likes - 1)
        };
      }
      return post;
    }));

    try {
      await communityService.toggleLike(postId);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    currentUser,
    posts,
    setPosts,
    sokoListings,
    setSokoListings,
    pulsePosts,
    farmers,
    setFarmers,
    billboardPrices,
    loading,
    loadData,
    toggleLike,
  };
}
