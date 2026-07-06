import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect } from "react";
import { 
  MessageSquare, 
  Users, 
  Award, 
  Bell, 
  ShieldCheck, 
  ThumbsUp, 
  Send, 
  Check, 
  Search, 
  Globe, 
  Lock, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  PlusCircle, 
  Image as ImageIcon, 
  Tag, 
  Sparkles, 
  UserCheck, 
  Bookmark, 
  MessageCircle, 
  TrendingUp, 
  MapPin, 
  UserPlus,
  Download,
  Wifi,
  WifiOff,
  Database,
  FileText,
  Heart,
  Share2,
  RefreshCw,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/mqulima/Navbar";
import { getForumSnapshot } from "@/lib/api/community.server";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Mqulima Forum — Standalone Subdomain Console" },
      {
        name: "description",
        content: "Share moments at Mqulima Show, trade on Mqulima Soko, get updates on Mqulima Pulse, and message via Mqulima Konnekt.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap",
      },
    ],
  }),
  component: ForumSubdomainPage,
});

// Types Declarations
type FarmerProfile = {
  username: string;
  name: string;
  country: string;
  county: string;
  interests: string[];
  crops: string[];
  livestock: string[];
  yearsFarming: number;
  certifications: string[];
  reputationScore: number; // Computed dynamically or stored
  followers: string[]; // List of follower usernames
  avatar: string;
  coverImage: string;
};

type ShowPost = {
  id: string;
  author: FarmerProfile;
  title: string;
  body: string;
  type: "gallery" | "story" | "update";
  category: "Harvest" | "Moment" | "Tragedy" | "Learning";
  images: string[];
  likes: number;
  hasLiked?: boolean;
  relates: number; // tragedy relate reactions
  hasRelated?: boolean;
  comments: { authorName: string; text: string; time: string }[];
  tags: string[];
  createdAt: string;
};

type SokoListing = {
  id: string;
  author: FarmerProfile;
  commodity: string;
  type: "crop" | "livestock";
  price: number; // numerical price for filters
  quantity: string;
  location: string;
  images: string[];
  description: string;
  status: "available" | "sold";
  createdAt: string;
};

type PulsePost = {
  id: string;
  title: string;
  content: string;
  category: "Market Trend" | "Weather Alert" | "Policy Update" | "Agronomy Alert";
  source: string;
  date: string;
};

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  read: boolean;
};

type ChatSession = {
  id: string;
  name: string;
  isGroup: boolean;
  farmer?: FarmerProfile;
  log: ChatMessage[];
};

// Seed Databases
const initialFarmers: FarmerProfile[] = [
  {
    username: "@mqulima_samuel",
    name: "Dr. Samuel Kirwa",
    country: "Kenya",
    county: "Uasin Gishu",
    interests: ["Conservation Agriculture", "Smart Irrigation"],
    crops: ["Maize", "Wheat", "Canola"],
    livestock: ["Friesian Cows", "Poultry"],
    yearsFarming: 16,
    certifications: ["Certified Agronomist (KEPHIS)", "Organic Fertilizer Expert"],
    reputationScore: 4200,
    followers: ["@mqulima_wanjiku", "@mqulima_kiprono", "@mqulima_mutiso"],
    avatar: "SK",
    coverImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
  },
  {
    username: "@mqulima_wanjiku",
    name: "Mary Wanjiku",
    country: "Kenya",
    county: "Nyandarua",
    interests: ["Soil Diagnostics", "Cooperative Marketing"],
    crops: ["Shangi Potatoes", "Cabbages", "Peas"],
    livestock: ["Sheep"],
    yearsFarming: 8,
    certifications: ["Potato Multiplication Certificate (ADC)", "Horticultural Exporter"],
    reputationScore: 2150,
    followers: ["@mqulima_samuel", "@mqulima_mutiso"],
    avatar: "MW",
    coverImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"
  },
  {
    username: "@mqulima_kiprono",
    name: "David Kiprono",
    country: "Kenya",
    county: "Kericho",
    interests: ["Export Certification", "Water Harvesting"],
    crops: ["Tea", "Purple Tea"],
    livestock: ["Dairy Goats"],
    yearsFarming: 5,
    certifications: ["Smart Water Management (KALRO)"],
    reputationScore: 890,
    followers: ["@mqulima_samuel"],
    avatar: "DK",
    coverImage: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800"
  },
  {
    username: "@mqulima_mutiso",
    name: "Grace Mutiso",
    country: "Kenya",
    county: "Machakos",
    interests: ["Phytosanitary Safety", "Apiculture"],
    crops: ["Apple Mangoes", "Avocados", "French Beans"],
    livestock: ["Beekeeping"],
    yearsFarming: 12,
    certifications: ["EU Phytosanitary Inspector Cert", "Apiculture Specialist"],
    reputationScore: 3120,
    followers: ["@mqulima_wanjiku", "@mqulima_kiprono"],
    avatar: "GM",
    coverImage: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800"
  }
];

const initialShowPosts: ShowPost[] = [
  {
    id: "s1",
    author: initialFarmers[1], // Mary Wanjiku
    title: "Shangi Tuber Harvest - 45 bags from 0.5 Acres!",
    body: "Absolutely thrilled with this season's Shangi potato yields! Followed the nitrogen application alerts on Uasin Gishu Agronomy SMS block. The skin quality is perfect, ready for delivery to Nairobi markets.",
    type: "gallery",
    category: "Harvest",
    images: [
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800",
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800"
    ],
    likes: 42,
    relates: 5,
    comments: [
      { authorName: "@mqulima_samuel", text: "Stellar yields Mary! Did you apply potassium top-dressing?", time: "2h ago" },
      { authorName: "@mqulima_kiprono", text: "Amazing stuff, Shangi variety is truly high-yielding.", time: "1h ago" }
    ],
    tags: ["#harvest", "#lesson", "#hot"],
    createdAt: "3h ago"
  },
  {
    id: "s2",
    author: initialFarmers[3], // Grace Mutiso
    title: "Tragedy: Fruit Fly Infiltration in my orchards",
    body: "Woke up to find active fruit fly stings in my young mango orchards. Seeking urgent organic pheromone bait advice! I need to arrest this before they puncture the late-blooming fruits.",
    type: "story",
    category: "Tragedy",
    images: ["https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800"],
    likes: 18,
    relates: 14,
    hasRelated: true,
    comments: [
      { authorName: "@mqulima_samuel", text: "Grace, hang Biolure pheromone traps 1.5 meters high immediately. Keep weeding the floor to kill pupae.", time: "4h ago" }
    ],
    tags: ["#tragedy", "#lesson", "#not"],
    createdAt: "5h ago"
  },
  {
    id: "s3",
    author: initialFarmers[2], // David Kiprono
    title: "Quick Update: Purple Tea prune completed",
    body: "Pruning done. Expecting flushing in 3 weeks if the rains hold up in Kericho. #hot",
    type: "update",
    category: "Moment",
    images: [],
    likes: 9,
    relates: 1,
    comments: [],
    tags: ["#hot", "#lesson"],
    createdAt: "1d ago"
  }
];

const initialSokoListings: SokoListing[] = [
  {
    id: "t1",
    author: initialFarmers[1], // Mary Wanjiku
    commodity: "Irish Potatoes (Shangi)",
    type: "crop",
    price: 3200,
    quantity: "35 Bags",
    location: "Ol Kalou, Nyandarua",
    images: ["https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500"],
    description: "Grade 1 Shangi potatoes. Harvested today, clean skin, sorted by sizes. Delivery can be arranged to Nairobi or Nakuru.",
    status: "available",
    createdAt: "1h ago"
  },
  {
    id: "t2",
    author: initialFarmers[2], // David Kiprono
    commodity: "Organic Avocado (Fuerte)",
    type: "crop",
    price: 6500,
    quantity: "100 Kgs",
    location: "Kericho town",
    images: ["https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=500"],
    description: "Export quality Fuerte avocados. Hand-picked, natural ripening, pesticide-free certification ready.",
    status: "available",
    createdAt: "3h ago"
  }
];

const initialPulsePosts: PulsePost[] = [
  { 
    id: "p1", 
    title: "El Niño rains predicted to decline by mid-July", 
    content: "Met Department releases farm alerts advising North Rift grain farmers to plan dry-shelling facilities ahead of moisture surges.", 
    category: "Weather Alert", 
    source: "Kenya Meteorological Department Bulletin June 2026", 
    date: "June 26, 2026" 
  },
  { 
    id: "p2", 
    title: "National Fertilizer Subsidy phase-3 rollout starts", 
    content: "Farmers registered on the digital voucher system can collect NCPB bags in Nakuru, Eldoret, and Narok for KSh 2,500.", 
    category: "Policy Update", 
    source: "Ministry of Agriculture Digital Ledger System", 
    date: "June 24, 2026" 
  },
  { 
    id: "p3", 
    title: "Export duty drop on certified horticulture to EU", 
    content: "Kenya-EU EPA agreement takes action, removing tariff barriers for smallholders supplying French Beans and snow peas.", 
    category: "Market Trend", 
    source: "EU-East Africa Trade Agreement Documentation", 
    date: "June 20, 2026" 
  }
];

// Reputation Formula: (posts * 15) + (upvotes * 5) + (trades * 30) + (certs * 50)
const computeReputationScore = (
  username: string, 
  posts: ShowPost[], 
  listings: SokoListing[], 
  certsCount: number
) => {
  const postsCount = posts.filter(p => p.author.username === username).length;
  const upvotesCount = posts.filter(p => p.author.username === username).reduce((acc, p) => acc + p.likes, 0);
  const tradesCount = listings.filter(s => s.author.username === username).length;
  return (postsCount * 15) + (upvotesCount * 5) + (tradesCount * 30) + (certsCount * 50);
};

const getReputationTier = (score: number) => {
  if (score >= 4000) return { name: "Platinum Tier", color: "text-purple-400 border-purple-400 bg-purple-950/20" };
  if (score >= 1500) return { name: "Gold Tier", color: "text-[#F5A623] border-[#F5A623] bg-[#F5A623]/10" };
  if (score >= 500) return { name: "Silver Tier", color: "text-zinc-300 border-zinc-400 bg-zinc-400/10" };
  return { name: "Bronze Tier", color: "text-amber-600 border-amber-600 bg-amber-600/10" };
};

function ForumSubdomainPage() {
  const [subpage, setSubpage] = useState<"show" | "soko" | "pulse" | "konnekt" | "profile">("show");

  // Database States
  const [farmers, setFarmers] = useState<FarmerProfile[]>(initialFarmers);
  const [showPosts, setShowPosts] = useState<ShowPost[]>(initialShowPosts);
  const [sokoListings, setSokoListings] = useState<SokoListing[]>(initialSokoListings);
  const [pulsePosts, setPulsePosts] = useState<PulsePost[]>(initialPulsePosts);
  const [communityDataSource, setCommunityDataSource] = useState<"loading" | "database" | "curated">("loading");

  // Profile View Config
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<"show" | "soko" | "pulse">("show");

  // Registration & User Setup
  const [currentUser, setCurrentUser] = useState<FarmerProfile | null>(null);
  const [isRegisteringProfile, setIsRegisteringProfile] = useState(false);
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regCounty, setRegCounty] = useState("Uasin Gishu");
  const [regCrops, setRegCrops] = useState("");
  const [regLivestock, setRegLivestock] = useState("");
  const [regInterests, setRegInterests] = useState("");
  const [regYears, setRegYears] = useState("3");

  // Mqulima Show Posting Form States
  const [isPostingShow, setIsPostingShow] = useState(false);
  const [showTitle, setShowTitle] = useState("");
  const [showBody, setShowBody] = useState("");
  const [showType, setShowType] = useState<"gallery" | "story" | "update">("update");
  const [showCategory, setShowCategory] = useState<"Harvest" | "Moment" | "Tragedy" | "Learning">("Moment");
  const [showImagesText, setShowImagesText] = useState(""); // comma separated URLs
  const [showTagsText, setShowTagsText] = useState("#moment"); // space or comma separated

  // Show Active image galleries track
  const [galleryIndexes, setGalleryIndexes] = useState<Record<string, number>>({});

  // Soko Listing States
  const [isListingSoko, setIsListingSoko] = useState(false);
  const [sokoCommodity, setSokoCommodity] = useState("");
  const [sokoType, setSokoType] = useState<"crop" | "livestock">("crop");
  const [sokoPrice, setSokoPrice] = useState("");
  const [sokoQty, setSokoQty] = useState("");
  const [sokoLoc, setSokoLoc] = useState("");
  const [sokoDesc, setSokoDesc] = useState("");
  const [sokoImgText, setSokoImgText] = useState("");

  // Search & Filter state for Soko
  const [sokoSearch, setSokoSearch] = useState("");
  const [sokoTypeFilter, setSokoTypeFilter] = useState<"all" | "crop" | "livestock">("all");
  const [sokoCountyFilter, setSokoCountyFilter] = useState("all");
  const [sokoMaxPrice, setSokoMaxPrice] = useState<number>(12000);

  // Show Feed filtering tags
  const [showTagFilter, setShowTagFilter] = useState<string | null>(null);

  // Mqulima Pulse Posting Form
  const [isPostingPulse, setIsPostingPulse] = useState(false);
  const [pulseTitle, setPulseTitle] = useState("");
  const [pulseContent, setPulseContent] = useState("");
  const [pulseCategory, setPulseCategory] = useState<"Market Trend" | "Weather Alert" | "Policy Update" | "Agronomy Alert">("Market Trend");
  const [pulseSource, setPulseSource] = useState("");

  // Konnekt Messages state
  const [activeChatId, setActiveChatId] = useState("g1");
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<ChatSession[]>([
    {
      id: "g1",
      name: "North Rift Grain Cooperative (Group)",
      isGroup: true,
      log: [
        { id: "m1", sender: "@mqulima_samuel", text: "Welcome to the County Grain Forum. NCPB fertilizer bags have landed in Eldoret. Get ready to sync vouchers.", timestamp: "08:15 AM", read: true },
        { id: "m2", sender: "@mqulima_wanjiku", text: "Great update. How long is the queue today?", timestamp: "08:45 AM", read: true }
      ]
    },
    {
      id: "d1",
      name: "Dr. Samuel Kirwa (DM)",
      isGroup: false,
      farmer: initialFarmers[0],
      log: [
        { id: "m3", sender: "@mqulima_samuel", text: "Hello! Welcome to Mqulima Konnekt. Let me know if you need help with soil moisture readings.", timestamp: "Yesterday", read: true }
      ]
    },
    {
      id: "d2",
      name: "Mary Wanjiku (DM)",
      isGroup: false,
      farmer: initialFarmers[1],
      log: [
        { id: "m4", sender: "@mqulima_wanjiku", text: "Saw your post on Soko. Let me know if you want to coordinate transport to Nairobi next week.", timestamp: "Yesterday", read: true }
      ]
    }
  ]);

  // Offline / Network Simulator States
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<{ chatId: string; text: string; timestamp: string }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // RLS Schema developer panel collapsable
  const [showRLSDashboard, setShowRLSDashboard] = useState(false);

  // Simulated KAMIS Ticker Prices
  const [billboardPrices, setBillboardPrices] = useState([
    { crop: "Dry Maize (90kg)", region: "Eldoret", price: 3200, prevPrice: 3180 },
    { crop: "Dry Maize (90kg)", region: "Nairobi", price: 3600, prevPrice: 3620 },
    { crop: "Shangi Potatoes (50kg)", region: "Nyandarua", price: 2800, prevPrice: 2750 },
    { crop: "Raw Milk (Litre)", region: "Nakuru", price: 55, prevPrice: 55 },
    { crop: "Avocados (Kg)", region: "Meru", price: 65, prevPrice: 62 },
  ]);

  // Handle KAMIS Billboard Fluctuation Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setBillboardPrices(prev => prev.map(p => {
        const change = (Math.random() - 0.5) * 40; // fluctuate by up to KSh 20
        const nextPrice = Math.max(10, Math.round(p.price + change));
        return {
          ...p,
          prevPrice: p.price,
          price: nextPrice
        };
      }));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getForumSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        const hasDatabaseContent = snapshot.showPosts.length > 0 || snapshot.sokoListings.length > 0 || snapshot.pulsePosts.length > 0;

        if (snapshot.showPosts.length > 0) setShowPosts(snapshot.showPosts as ShowPost[]);
        if (snapshot.sokoListings.length > 0) setSokoListings(snapshot.sokoListings as SokoListing[]);
        if (snapshot.pulsePosts.length > 0) setPulsePosts(snapshot.pulsePosts as PulsePost[]);
        setCommunityDataSource(hasDatabaseContent ? "database" : "curated");
      })
      .catch(() => {
        if (!cancelled) setCommunityDataSource("curated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync Offline Queue once network restored
  const triggerManualSync = () => {
    if (offlineQueue.length === 0) {
      toast.info("Offline queue is empty. No messages to sync.");
      return;
    }
    setIsSyncing(true);
    toast.loading("Syncing offline message queue to Supabase Realtime channel...");

    setTimeout(() => {
      // Flush queue into messages
      setChats(prevChats => {
        const nextChats = [...prevChats];
        offlineQueue.forEach(qMsg => {
          const chatIdx = nextChats.findIndex(c => c.id === qMsg.chatId);
          if (chatIdx !== -1) {
            nextChats[chatIdx].log.push({
              id: `sync_${Math.random()}`,
              sender: currentUser?.username || "@mqulima_guest",
              text: qMsg.text,
              timestamp: qMsg.timestamp,
              read: true
            });
          }
        });
        return nextChats;
      });

      setOfflineQueue([]);
      setIsSyncing(false);
      toast.dismiss();
      toast.success("Synchronized! All queued messages pushed successfully.");
    }, 2000);
  };

  // Auto sync if isOnline toggled to true
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      triggerManualSync();
    }
  }, [isOnline]);

  // Load user profile from localStorage if exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_forum_profile");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        const defaultGuest: FarmerProfile = {
          username: "@mqulima_guest",
          name: "Guest Farmer",
          country: "Kenya",
          county: "Nakuru",
          interests: ["Cooperative Ag", "Post-Harvest Care"],
          crops: ["Maize", "Beans"],
          livestock: ["Dairy Cows"],
          yearsFarming: 2,
          certifications: ["Mqulima Portal Member"],
          reputationScore: 120,
          followers: ["@mqulima_samuel", "@mqulima_wanjiku"],
          avatar: "GF",
          coverImage: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800"
        };
        setCurrentUser(defaultGuest);
        localStorage.setItem("mqulima_forum_profile", JSON.stringify(defaultGuest));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Update dynamic scores on farmers list
  const activeFarmers = useMemo(() => {
    return farmers.map(farmer => {
      const score = computeReputationScore(farmer.username, showPosts, sokoListings, farmer.certifications.length);
      return {
        ...farmer,
        reputationScore: score
      };
    });
  }, [farmers, showPosts, sokoListings]);

  // Get active viewing farmer details
  const viewingFarmer = useMemo(() => {
    if (!selectedProfileUsername) {
      return currentUser ? {
        ...currentUser,
        reputationScore: computeReputationScore(currentUser.username, showPosts, sokoListings, currentUser.certifications.length)
      } : null;
    }
    return activeFarmers.find(f => f.username === selectedProfileUsername) || null;
  }, [selectedProfileUsername, currentUser, activeFarmers, showPosts, sokoListings]);

  const handleRegisterProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim()) {
      toast.error("Please specify your name and username.");
      return;
    }

    // Enforce username starts with "mqulima_" (e.g. @mqulima_john)
    let rawHandle = regUsername.trim().toLowerCase();
    if (rawHandle.startsWith("@")) {
      rawHandle = rawHandle.slice(1);
    }
    if (!rawHandle.startsWith("mqulima_")) {
      if (rawHandle.startsWith("mqulima")) {
        rawHandle = "mqulima_" + rawHandle.slice(7);
      } else {
        rawHandle = "mqulima_" + rawHandle;
      }
    }
    const finalUsername = "@" + rawHandle;

    const newProfile: FarmerProfile = {
      username: finalUsername,
      name: regName.trim(),
      country: "Kenya",
      county: regCounty,
      interests: regInterests.split(",").map(i => i.trim()).filter(Boolean),
      crops: regCrops.split(",").map(c => c.trim()).filter(Boolean),
      livestock: regLivestock.split(",").map(l => l.trim()).filter(Boolean),
      yearsFarming: Number(regYears) || 1,
      certifications: ["Mqulima Verified Member", "Bio-safety certified"],
      reputationScore: 250,
      followers: ["@mqulima_samuel"],
      avatar: regName.substring(0, 2).toUpperCase(),
      coverImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
    };

    setCurrentUser(newProfile);
    localStorage.setItem("mqulima_forum_profile", JSON.stringify(newProfile));
    
    // Add to farmers database
    setFarmers((prev) => [newProfile, ...prev.filter(f => f.username !== newProfile.username)]);
    setIsRegisteringProfile(false);
    toast.success(`Profile registered successfully! Username: ${newProfile.username}`);
  };

  const handleCreateShowPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTitle.trim() || !showBody.trim()) {
      toast.error("Please fill in title and body.");
      return;
    }

    // parse tags
    const tagsParsed = showTagsText.split(/[\s,]+/).filter(t => t.startsWith("#"));

    // parse images
    const imagesParsed = showImagesText.split(",").map(url => url.trim()).filter(Boolean);
    if (showType === "gallery" && imagesParsed.length === 0) {
      imagesParsed.push("https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500");
    }

    const newPost: ShowPost = {
      id: String(Date.now()),
      author: currentUser || initialFarmers[0],
      title: showTitle.trim(),
      body: showBody.trim(),
      type: showType,
      category: showCategory,
      images: imagesParsed.length > 0 ? imagesParsed : ["https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500"],
      likes: 0,
      relates: 0,
      comments: [],
      tags: tagsParsed.length > 0 ? tagsParsed : ["#moment"],
      createdAt: "Just now"
    };

    setShowPosts([newPost, ...showPosts]);
    setIsPostingShow(false);
    setShowTitle("");
    setShowBody("");
    setShowImagesText("");
    setShowTagsText("#moment");
    toast.success("Show post added successfully!");
  };

  const handleCreateSokoListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sokoCommodity.trim() || !sokoPrice.trim() || !sokoQty.trim()) {
      toast.error("Please enter commodity details, pricing, and volume.");
      return;
    }

    const priceNum = parseFloat(sokoPrice.replace(/[^0-9]/g, "")) || 1000;
    const imagesParsed = sokoImgText.split(",").map(url => url.trim()).filter(Boolean);

    const newListing: SokoListing = {
      id: String(Date.now()),
      author: currentUser || initialFarmers[0],
      commodity: sokoCommodity.trim(),
      type: sokoType,
      price: priceNum,
      quantity: sokoQty.trim(),
      location: sokoLoc.trim() || "Unknown location",
      images: imagesParsed.length > 0 ? imagesParsed : ["https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500"],
      description: sokoDesc.trim(),
      status: "available",
      createdAt: "Just now"
    };

    setSokoListings([newListing, ...sokoListings]);
    setIsListingSoko(false);
    setSokoCommodity("");
    setSokoPrice("");
    setSokoQty("");
    setSokoLoc("");
    setSokoDesc("");
    setSokoImgText("");
    toast.success("Commodity trade listing published!");
  };

  const handleCreatePulsePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pulseTitle.trim() || !pulseContent.trim() || !pulseSource.trim()) {
      toast.error("Please specify a title, bulletin details, and source verification.");
      return;
    }

    const newPulse: PulsePost = {
      id: String(Date.now()),
      title: pulseTitle.trim(),
      content: pulseContent.trim(),
      category: pulseCategory,
      source: pulseSource.trim(),
      date: new Date().toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })
    };

    setPulsePosts([newPulse, ...pulsePosts]);
    setIsPostingPulse(false);
    setPulseTitle("");
    setPulseContent("");
    setPulseSource("");
    toast.success("Pulse dispatch published successfully with source verification!");
  };

  const handleLikePost = (postId: string) => {
    setShowPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextLiked = !p.hasLiked;
        return {
          ...p,
          hasLiked: nextLiked,
          likes: nextLiked ? p.likes + 1 : p.likes - 1
        };
      }
      return p;
    }));
  };

  const handleRelateTragedy = (postId: string) => {
    setShowPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextRelated = !p.hasRelated;
        return {
          ...p,
          hasRelated: nextRelated,
          relates: nextRelated ? p.relates + 1 : p.relates - 1
        };
      }
      return p;
    }));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const senderHandle = currentUser ? currentUser.username : "@mqulima_guest";
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!isOnline) {
      // Queue offline
      setOfflineQueue(prev => [...prev, { chatId: activeChatId, text: chatInput.trim(), timestamp: timestampStr }]);
      setChatInput("");
      toast.warning("Offline mode active: Message queued locally. Syncing will occur when network is restored.");
      return;
    }

    const newMessage: ChatMessage = {
      id: String(Date.now()),
      sender: senderHandle,
      text: chatInput.trim(),
      timestamp: timestampStr,
      read: true
    };

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          log: [...c.log, newMessage]
        };
      }
      return c;
    }));

    setChatInput("");

    // Simulate real-time replies after typing delay (only on DMs)
    const activeChat = chats.find(c => c.id === activeChatId);
    if (activeChat && !activeChat.isGroup) {
      setTimeout(() => {
        const replyMessage: ChatMessage = {
          id: String(Date.now() + 1),
          sender: activeChat.farmer?.username || "@mqulima_samuel",
          text: `Acknowledge. Let's arrange terms for transport/supplies on our cooperative list.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: true
        };
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              log: [...c.log, replyMessage]
            };
          }
          return c;
        }));
      }, 2000);
    }
  };

  const handleFollowFarmer = (username: string) => {
    if (currentUser?.username === username) {
      toast.error("You cannot follow yourself.");
      return;
    }
    setFarmers(prev => prev.map(f => {
      if (f.username === username) {
        const isFollowing = f.followers.includes(currentUser?.username || "");
        return {
          ...f,
          followers: isFollowing 
            ? f.followers.filter(u => u !== currentUser?.username)
            : [...f.followers, currentUser?.username || ""]
        };
      }
      return f;
    }));
    toast.success("Follower state toggled!");
  };

  // Gallery slider control
  const cycleGalleryImage = (postId: string, imagesLength: number, direction: number) => {
    setGalleryIndexes(prev => {
      const current = prev[postId] || 0;
      let next = current + direction;
      if (next < 0) next = imagesLength - 1;
      if (next >= imagesLength) next = 0;
      return {
        ...prev,
        [postId]: next
      };
    });
  };

  // Filter Soko items
  const filteredSokoListings = useMemo(() => {
    return sokoListings.filter(listing => {
      const matchSearch = listing.commodity.toLowerCase().includes(sokoSearch.toLowerCase()) || 
                          listing.description.toLowerCase().includes(sokoSearch.toLowerCase());
      const matchType = sokoTypeFilter === "all" || listing.type === sokoTypeFilter;
      const matchCounty = sokoCountyFilter === "all" || listing.location.toLowerCase().includes(sokoCountyFilter.toLowerCase());
      const matchPrice = listing.price <= sokoMaxPrice;
      return matchSearch && matchType && matchCounty && matchPrice;
    });
  }, [sokoListings, sokoSearch, sokoTypeFilter, sokoCountyFilter, sokoMaxPrice]);

  // Filter Show items by tags
  const filteredShowPosts = useMemo(() => {
    if (!showTagFilter) return showPosts;
    return showPosts.filter(post => post.tags.includes(showTagFilter));
  }, [showPosts, showTagFilter]);

  // Get active chat session
  const activeChat = useMemo(() => {
    return chats.find(c => c.id === activeChatId) || chats[0];
  }, [chats, activeChatId]);

  return (
    <div 
      className="bg-[#0A0F0D] text-[#FAF9F5] min-h-screen font-sans antialiased selection:bg-[#F5A623] selection:text-[#0A0F0D]" 
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Navbar />

      <div className="py-6">
        {/* 1. STANDALONE SUBDOMAIN SHELL NAV BAR */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#2D6A4F]/30 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-[#2D6A4F] flex items-center justify-center border border-[#F5A623] font-bold text-xl text-[#FAF9F5] shadow-md font-serif">
              M
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-widest uppercase font-serif text-[#F5A623] flex items-center gap-1.5">
                Mqulima Forum
              </h1>
              <span className="text-[10px] text-[#FAF9F5]/40 font-mono block">Node: forum.mqulima.com</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 flex-1 sm:flex-none">
            <div className="flex items-center gap-2 bg-[#051108]/90 border border-[#2D6A4F]/60 px-3 py-1.5 rounded-none text-xs">
              <Database className="h-3.5 w-3.5 text-[#F5A623]" />
              <span className="text-[9px] font-mono text-[#FAF9F5]/40">SOURCE:</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                communityDataSource === "database"
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                  : communityDataSource === "loading"
                    ? "bg-slate-900 text-slate-300 border-slate-700"
                    : "bg-amber-950/60 text-[#F5A623] border-amber-800"
              }`}>
                {communityDataSource === "database" ? "Live DB" : communityDataSource === "loading" ? "Loading" : "Curated Seed"}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-[#051108]/90 border border-[#2D6A4F]/60 px-3 py-1.5 rounded-none text-xs">
              <span className="text-[9px] font-mono text-[#FAF9F5]/40">QUEUE:</span>
              <button 
                onClick={() => setIsOnline(!isOnline)} 
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[10px] font-bold transition uppercase ${
                  isOnline 
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800" 
                    : "bg-red-950 text-red-400 border border-red-900"
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3" /> Online
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" /> Offline
                  </>
                )}
              </button>
            </div>

            <a 
              href="/" 
              className="text-[10px] font-extrabold uppercase tracking-wider text-[#FAF9F5]/60 hover:text-[#F5A623] transition px-3 py-2 border border-[#2D6A4F]/40 hover:border-[#F5A623] bg-transparent"
            >
              ← Exit to Main Site
            </a>
          </div>
        </div>
      </header>

      {/* Main Console Grid Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Subdomain Chrome Browser Container Wrapper (Visual Rewrites indicator) */}
        <div className="w-full bg-[#051108] border border-[#2D6A4F]/40 shadow-2xl transition-all duration-300">
          
          {/* Browser Chrome Header Top Bar */}
          <div className="bg-[#0A0F0D] border-b border-[#2D6A4F]/30 px-4 py-2.5 flex items-center justify-between gap-4 select-none">
            {/* browser dots */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60 block" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60 block" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/60 block" />
            </div>

            {/* Address Bar */}
            <div className="flex-1 max-w-xl mx-auto">
              <div className="w-full bg-[#051108] border border-[#2D6A4F]/40 rounded-lg py-1 px-3 flex items-center gap-2 text-xs font-semibold text-[#FAF9F5]/60 shadow-inner">
                <Lock className="h-3 w-3 text-[#F5A623]" />
                <span className="text-[#F5A623] font-bold font-mono">https://forum.mqulima.com</span>
                <span className="text-[#FAF9F5]/40 font-mono">/{subpage}</span>
              </div>
            </div>

            {/* Sync Alert Badge */}
            <div className="shrink-0 flex items-center gap-2">
              {offlineQueue.length > 0 && (
                <button 
                  onClick={triggerManualSync}
                  className="bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-[#F5A623] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none flex items-center gap-1 animate-pulse"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{offlineQueue.length} Queued</span>
                </button>
              )}
              <span className="hidden sm:inline bg-[#2D6A4F]/30 text-emerald-400 text-[8px] font-mono uppercase px-2 py-0.5 border border-[#2D6A4F]/60">
                SSL Secure
              </span>
            </div>
          </div>

          {/* Subdomain Content Split Grid */}
          <div className="grid lg:grid-cols-[260px_1fr] min-h-[720px]">
            
            {/* LEFT BAR navigation */}
            <div className="bg-[#0A0F0D] border-r border-[#2D6A4F]/30 p-6 flex flex-col justify-between text-left">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-extrabold tracking-widest text-[#FAF9F5]/40 uppercase block mb-3 font-serif">
                    Subpage Navigation
                  </h3>
                  <nav className="space-y-1">
                    {[
                      { id: "show", label: "Mqulima Show", icon: "📸" },
                      { id: "soko", label: "Mqulima Soko", icon: "🌾" },
                      { id: "pulse", label: "Mqulima Pulse", icon: "📈" },
                      { id: "konnekt", label: "Mqulima Konnekt", icon: "💬" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSubpage(item.id as any);
                          setSelectedProfileUsername(null);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-none text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
                          subpage === item.id && !selectedProfileUsername
                            ? "bg-[#2D6A4F] border-[#F5A623] text-[#FAF9F5] shadow-md font-serif" 
                            : "border-transparent text-[#FAF9F5]/60 hover:bg-[#2D6A4F]/20 hover:text-[#FAF9F5]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </span>
                        {item.id === "konnekt" && (
                          <span className="h-2 w-2 rounded-full bg-[#F5A623] animate-pulse" />
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Farmer Profile Panel Link */}
                <div className="border-t border-[#2D6A4F]/20 pt-6">
                  <h3 className="text-[10px] font-extrabold tracking-widest text-[#FAF9F5]/40 uppercase block mb-3 font-serif">
                    Logged In Identity
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedProfileUsername(null);
                      setSubpage("profile");
                    }}
                    className={`w-full flex items-center gap-3 p-3 transition border rounded-none text-left cursor-pointer ${
                      subpage === "profile" && !selectedProfileUsername
                        ? "bg-[#2D6A4F] border-[#F5A623] text-[#FAF9F5]" 
                        : "bg-[#051108]/90 border-[#2D6A4F]/30 text-[#FAF9F5]/80 hover:bg-[#2D6A4F]/10"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-none bg-[#2D6A4F] text-[#FAF9F5] border border-[#F5A623] font-bold text-xs flex items-center justify-center shrink-0">
                      {currentUser ? currentUser.avatar : "GF"}
                    </div>
                    <div className="min-w-0">
                      <strong className="block truncate text-xs font-bold">{currentUser ? currentUser.name : "Guest Farmer"}</strong>
                      <span className="block truncate text-[10px] text-[#FAF9F5]/40 font-mono">{currentUser ? currentUser.username : "@mqulima_guest"}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sidebar footer metrics */}
              <div className="mt-8 pt-6 border-t border-[#2D6A4F]/20 text-[10px] text-[#FAF9F5]/40 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span>Coop Nodes:</span>
                  <strong className="text-[#F5A623]">4 Active</strong>
                </div>
                <div className="flex justify-between">
                  <span>Simulated RLS:</span>
                  <button 
                    onClick={() => setShowRLSDashboard(!showRLSDashboard)}
                    className="text-[#F5A623] hover:underline font-bold"
                  >
                    {showRLSDashboard ? "Hide Schema" : "Show Schema"}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE viewport */}
            <div className="p-6 sm:p-8 bg-[#051108] overflow-y-auto max-h-[85vh] text-left">
              
              {/* ══════════════════════════════════════════
                  SUBPAGE VIEW: INTERACTION MODULES
                  ══════════════════════════════════════════ */}
              
              {/* IF VIEWING AN INDIVIDUAL PROFILE (Override subpage viewport) */}
              {selectedProfileUsername || subpage === "profile" ? (
                viewingFarmer ? (
                  <div className="space-y-6">
                    
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D6A4F]/30 pb-5">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#FAF9F5]">
                          👤 Mqulima Profile — {viewingFarmer.username}
                        </h2>
                        <p className="text-xs text-[#FAF9F5]/60 mt-1">
                          Decentralized Cooperative ID, farming statistics, and verified credentials.
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Only show edit on currentUser's own profile */}
                        {(!selectedProfileUsername || selectedProfileUsername === currentUser?.username) ? (
                          <button
                            onClick={() => setIsRegisteringProfile(!isRegisteringProfile)}
                            className="bg-[#2D6A4F] border border-[#2D6A4F] hover:border-[#F5A623] text-[#FAF9F5] px-4 py-2 rounded-none text-xs font-bold uppercase transition shadow-sm"
                          >
                            Edit Registration
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFollowFarmer(viewingFarmer.username)}
                            className={`border px-4 py-2 rounded-none text-xs font-bold uppercase transition ${
                              viewingFarmer.followers.includes(currentUser?.username || "")
                                ? "bg-[#2D6A4F]/30 border-[#2D6A4F] text-[#FAF9F5]/80"
                                : "bg-[#2D6A4F] border-[#F5A623] text-[#FAF9F5] hover:bg-[#2D6A4F]/80"
                            }`}
                          >
                            {viewingFarmer.followers.includes(currentUser?.username || "") ? "✓ Following" : "+ Follow"}
                          </button>
                        )}
                        {selectedProfileUsername && (
                          <button
                            onClick={() => setSelectedProfileUsername(null)}
                            className="border border-[#2D6A4F]/40 px-3 py-2 text-xs font-bold uppercase hover:bg-[#2D6A4F]/20 text-[#FAF9F5]/80"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Edit Form */}
                    {isRegisteringProfile && (!selectedProfileUsername || selectedProfileUsername === currentUser?.username) && (
                      <form onSubmit={handleRegisterProfile} className="bg-[#0A0F0D] border border-[#2D6A4F]/40 p-5 space-y-4">
                        <h3 className="text-xs font-black text-[#F5A623] uppercase tracking-wider border-b border-[#2D6A4F]/30 pb-2">
                          Edit Profile Details
                        </h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Samuel Kirwa"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] transition"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Desired Username</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. samuel"
                              value={regUsername}
                              onChange={(e) => setRegUsername(e.target.value)}
                              className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] transition"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Region / County</label>
                            <input
                              type="text"
                              value={regCounty}
                              onChange={(e) => setRegCounty(e.target.value)}
                              className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] transition"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Crops Grown (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="Maize, Wheat"
                              value={regCrops}
                              onChange={(e) => setRegCrops(e.target.value)}
                              className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] transition"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Livestock Grown (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="Dairy Cows, Poultry"
                              value={regLivestock}
                              onChange={(e) => setRegLivestock(e.target.value)}
                              className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] transition"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Farming Interests (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="Irrigation, Hydroponics"
                              value={regInterests}
                              onChange={(e) => setRegInterests(e.target.value)}
                              className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] transition"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Years Farming</label>
                            <input
                              type="number"
                              min="0"
                              value={regYears}
                              onChange={(e) => setRegYears(e.target.value)}
                              className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] transition"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setIsRegisteringProfile(false)}
                            className="border border-[#2D6A4F]/40 px-4 py-2 rounded-none text-xs font-bold text-[#FAF9F5]/60 hover:bg-[#2D6A4F]/20"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-[#F5A623] hover:bg-[#d68e1a] text-[#0A0F0D] px-4 py-2 rounded-none text-xs font-extrabold uppercase tracking-wider"
                          >
                            Save Details
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Immersive Profile Card Shell */}
                    <div className="bg-[#0A0F0D] border border-[#2D6A4F]/40 rounded-none overflow-hidden shadow-2xl">
                      
                      {/* Cover Photo */}
                      <div className="h-40 bg-slate-800 relative">
                        <img 
                          src={viewingFarmer.coverImage} 
                          alt="Cover" 
                          className="w-full h-full object-cover opacity-60" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F0D] via-transparent to-transparent" />
                      </div>

                      {/* Header Avatar / Details */}
                      <div className="px-6 pb-6 relative -mt-10 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#2D6A4F]/20 pb-5">
                          <div className="flex items-end gap-4">
                            <div className="h-20 w-20 rounded-none bg-[#2D6A4F] text-[#FAF9F5] border-4 border-[#0A0F0D] shadow-lg font-black text-3xl flex items-center justify-center font-serif">
                              {viewingFarmer.avatar}
                            </div>
                            <div className="text-left pb-1">
                              <h3 className="text-xl font-bold font-serif text-[#FAF9F5] flex items-center gap-2">
                                {viewingFarmer.name}
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border ${
                                  getReputationTier(viewingFarmer.reputationScore).color
                                }`}>
                                  {getReputationTier(viewingFarmer.reputationScore).name}
                                </span>
                              </h3>
                              <span className="text-xs text-[#FAF9F5]/40 font-mono">{viewingFarmer.username}</span>
                            </div>
                          </div>

                          <div className="flex gap-6 text-xs text-left">
                            <div>
                              <span className="block text-[10px] text-[#FAF9F5]/40 font-bold uppercase">Reputation score</span>
                              <strong className="text-[#F5A623] text-base font-mono">{viewingFarmer.reputationScore} pts</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-[#FAF9F5]/40 font-bold uppercase">Followers</span>
                              <strong className="text-[#FAF9F5] text-base font-mono">{viewingFarmer.followers.length}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Fields List */}
                        <div className="grid gap-6 sm:grid-cols-2 text-xs text-left">
                          <div className="space-y-4">
                            <div>
                              <span className="text-[#FAF9F5]/40 font-bold block text-[9px] uppercase tracking-wider">Country</span>
                              <span className="font-semibold text-[#FAF9F5] text-sm">{viewingFarmer.country}</span>
                            </div>
                            <div>
                              <span className="text-[#FAF9F5]/40 font-bold block text-[9px] uppercase tracking-wider">County/Region</span>
                              <span className="font-semibold text-[#FAF9F5] text-sm">{viewingFarmer.county}</span>
                            </div>
                            <div>
                              <span className="text-[#FAF9F5]/40 font-bold block text-[9px] uppercase tracking-wider">Years farming</span>
                              <span className="font-semibold text-[#FAF9F5] text-sm">{viewingFarmer.yearsFarming} Years</span>
                            </div>
                            <div>
                              <span className="text-[#FAF9F5]/40 font-bold block text-[9px] uppercase tracking-wider mb-2">Followers List</span>
                              {viewingFarmer.followers.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {viewingFarmer.followers.map(followerName => (
                                    <button
                                      key={followerName}
                                      onClick={() => setSelectedProfileUsername(followerName)}
                                      className="bg-[#051108]/90 border border-[#2D6A4F]/40 hover:border-[#F5A623] text-[9px] px-2 py-0.5 font-mono text-[#FAF9F5]/70"
                                    >
                                      {followerName}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#FAF9F5]/30 block italic">No followers yet</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <span className="text-[#FAF9F5]/40 font-bold block text-[9px] uppercase tracking-wider mb-1.5">Farming interests</span>
                              <div className="space-y-2 pl-3 border-l border-[#2D6A4F]/60">
                                <div>
                                  <span className="text-[#FAF9F5]/50 block text-[9px] uppercase font-bold">General Interests</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {viewingFarmer.interests && viewingFarmer.interests.map((int, idx) => (
                                      <span key={idx} className="bg-amber-950/20 text-[#F5A623] text-[9px] font-bold px-2 py-0.5 border border-[#F5A623]/30">
                                        {int}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[#FAF9F5]/50 block text-[9px] uppercase font-bold">Crops</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {viewingFarmer.crops.map((crop, idx) => (
                                      <span key={idx} className="bg-emerald-950/40 text-emerald-400 text-[9px] font-bold px-2 py-0.5 border border-emerald-900/60 uppercase">
                                        {crop}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[#FAF9F5]/50 block text-[9px] uppercase font-bold">Livestock</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {viewingFarmer.livestock.map((l, idx) => (
                                      <span key={idx} className="bg-blue-950/40 text-blue-400 text-[9px] font-bold px-2 py-0.5 border border-blue-900/60 uppercase">
                                        {l}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="text-[#FAF9F5]/40 font-bold block text-[9px] uppercase tracking-wider">Certifications earned</span>
                              <div className="space-y-1.5 mt-2">
                                {viewingFarmer.certifications.map((cert, idx) => (
                                  <span key={idx} className="text-[#F5A623] text-[10px] font-bold block flex items-center gap-1.5 bg-[#2D6A4F]/10 border border-[#2D6A4F]/40 p-1.5">
                                    <Award className="h-3.5 w-3.5 text-[#F5A623] shrink-0" />
                                    <span>{cert}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tabs within profile: Show posts, Soko listings, Pulse contributions */}
                        <div className="pt-6 border-t border-[#2D6A4F]/20">
                          <div className="flex border-b border-[#2D6A4F]/20 mb-4">
                            {[
                              { id: "show", label: "Show Posts", icon: "📸" },
                              { id: "soko", label: "Soko Listings", icon: "🌾" },
                              { id: "pulse", label: "Pulse Contributions", icon: "📈" }
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setProfileTab(tab.id as any)}
                                className={`px-4 py-2 border-b-2 text-xs font-bold uppercase tracking-wider transition ${
                                  profileTab === tab.id
                                    ? "border-[#F5A623] text-[#F5A623] bg-[#2D6A4F]/10"
                                    : "border-transparent text-[#FAF9F5]/40 hover:text-[#FAF9F5]"
                                }`}
                              >
                                {tab.icon} {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Profile Tab Feed View */}
                          <div className="grid gap-4">
                            {profileTab === "show" && (
                              showPosts.filter(p => p.author.username === viewingFarmer.username).length > 0 ? (
                                showPosts.filter(p => p.author.username === viewingFarmer.username).map(post => (
                                  <div key={post.id} className="bg-[#051108] border border-[#2D6A4F]/30 p-4 flex justify-between items-center gap-4 text-left">
                                    <div>
                                      <span className="text-[8px] bg-[#2D6A4F]/40 text-emerald-400 border border-[#2D6A4F]/60 px-1.5 py-0.5 uppercase tracking-wider">{post.category}</span>
                                      <h4 className="text-sm font-bold font-serif mt-1">{post.title}</h4>
                                      <span className="text-[9px] text-[#FAF9F5]/40 font-mono">{post.createdAt}</span>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setSubpage("show");
                                        setSelectedProfileUsername(null);
                                      }}
                                      className="text-xs text-[#F5A623] hover:underline shrink-0"
                                    >
                                      View Feed →
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-[#FAF9F5]/40 italic py-4">No moments posted on Mqulima Show</p>
                              )
                            )}

                            {profileTab === "soko" && (
                              sokoListings.filter(s => s.author.username === viewingFarmer.username).length > 0 ? (
                                sokoListings.filter(s => s.author.username === viewingFarmer.username).map(listing => (
                                  <div key={listing.id} className="bg-[#051108] border border-[#2D6A4F]/30 p-4 flex justify-between items-center gap-4 text-left">
                                    <div>
                                      <h4 className="text-sm font-bold font-serif">{listing.commodity}</h4>
                                      <span className="text-xs text-emerald-400 font-mono mt-0.5 block">KES {listing.price} • {listing.quantity}</span>
                                      <span className="text-[9px] text-[#FAF9F5]/40 font-mono mt-0.5 block">{listing.location}</span>
                                    </div>
                                    <span className="text-[9px] uppercase font-bold text-amber-500 border border-amber-800 px-1.5 py-0.5">
                                      {listing.status}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-[#FAF9F5]/40 italic py-4">No trade listings put up for sale</p>
                              )
                            )}

                            {profileTab === "pulse" && (
                              <p className="text-xs text-[#FAF9F5]/40 italic py-4">No verified agronomy dispatch pulse contributions yet.</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-[#FAF9F5]/40 italic py-10">Loading farmer profile credentials...</p>
                )
              ) : null}

              {/* 📸 MQULIMA SHOW MODULE */}
              {subpage === "show" && !selectedProfileUsername && (
                <div className="space-y-6">
                  
                  {/* Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D6A4F]/30 pb-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#FAF9F5] flex items-center gap-2">
                        📸 Mqulima Show Feed
                      </h2>
                      <p className="text-xs text-[#FAF9F5]/60 mt-1">
                        Instagram/Reddit hybrid feed: farmers showcasing harvests, stories, tragedies, and lessons.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setIsPostingShow(!isPostingShow)}
                      className="bg-[#2D6A4F] border border-[#F5A623] hover:bg-[#2D6A4F]/80 text-[#FAF9F5] px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Share Moment
                    </button>
                  </div>

                  {/* Tag Filter Bar */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-[#2D6A4F]/20 pb-4">
                    <span className="text-[10px] text-[#FAF9F5]/40 font-mono uppercase mr-2">Filter Tags:</span>
                    <button
                      onClick={() => setShowTagFilter(null)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-none border transition ${
                        !showTagFilter 
                          ? "bg-[#F5A623] text-[#0A0F0D] border-[#F5A623]" 
                          : "border-[#2D6A4F]/40 text-[#FAF9F5]/60 hover:text-[#FAF9F5]"
                      }`}
                    >
                      All Posts
                    </button>
                    {["#harvest", "#tragedy", "#lesson", "#hot", "#not"].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setShowTagFilter(tag)}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-none border transition ${
                          showTagFilter === tag
                            ? "bg-[#F5A623] text-[#0A0F0D] border-[#F5A623]" 
                            : "border-[#2D6A4F]/40 text-[#FAF9F5]/60 hover:text-[#FAF9F5]"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Posting Form */}
                  {isPostingShow && (
                    <form onSubmit={handleCreateShowPost} className="bg-[#0A0F0D] border border-[#2D6A4F]/40 p-5 space-y-4">
                      <h3 className="text-xs font-black text-[#F5A623] uppercase tracking-wider border-b border-[#2D6A4F]/30 pb-2">
                        Post Farm Moment / Show Detail
                      </h3>
                      
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Post Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tomato yield success!"
                            value={showTitle}
                            onChange={(e) => setShowTitle(e.target.value)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Post Type</label>
                          <select
                            value={showType}
                            onChange={(e) => setShowType(e.target.value as any)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] cursor-pointer"
                          >
                            <option value="update">Quick Update (Micro)</option>
                            <option value="gallery">Image Gallery (Slideshow)</option>
                            <option value="story">Story (Long Article)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Category</label>
                          <select
                            value={showCategory}
                            onChange={(e) => setShowCategory(e.target.value as any)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] cursor-pointer"
                          >
                            <option value="Moment">Moment</option>
                            <option value="Harvest">Harvest Win</option>
                            <option value="Tragedy">Tragedy / Failure</option>
                            <option value="Learning">Learning Moment</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Image URLs (comma-separated for Gallery)</label>
                        <input
                          type="text"
                          placeholder="e.g. https://images.unsplash.com/photo-1, https://images.unsplash.com/photo-2"
                          value={showImagesText}
                          onChange={(e) => setShowImagesText(e.target.value)}
                          className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Hashtags (space separated, e.g. #harvest #hot)</label>
                        <input
                          type="text"
                          value={showTagsText}
                          onChange={(e) => setShowTagsText(e.target.value)}
                          className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Story/Body details</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Write long details, learning observations, or explain what's hot and what's not..."
                          value={showBody}
                          onChange={(e) => setShowBody(e.target.value)}
                          className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3.5 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsPostingShow(false)}
                          className="border border-[#2D6A4F]/40 px-4 py-2 rounded-none text-xs font-bold text-[#FAF9F5]/60 hover:bg-[#2D6A4F]/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-[#F5A623] hover:bg-[#d68e1a] text-[#0A0F0D] px-4 py-2 rounded-none text-xs font-extrabold uppercase tracking-wider"
                        >
                          Publish Post
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Show Feed Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {filteredShowPosts.map((post) => {
                      const activeImgIdx = galleryIndexes[post.id] || 0;
                      const activeImg = post.images[activeImgIdx] || "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500";

                      return (
                        <div 
                          key={post.id} 
                          className="bg-[#0A0F0D] border border-[#2D6A4F]/45 rounded-none overflow-hidden shadow-lg flex flex-col justify-between hover:border-[#F5A623] transition duration-300"
                        >
                          <div>
                            {/* Author row */}
                            <div className="p-4 border-b border-[#2D6A4F]/30 bg-[#051108]/90 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <button 
                                  onClick={() => setSelectedProfileUsername(post.author.username)}
                                  className="h-8 w-8 rounded-none bg-[#2D6A4F] text-[#FAF9F5] font-black text-xs flex items-center justify-center border border-[#F5A623] hover:opacity-80 transition shrink-0"
                                >
                                  {post.author.avatar}
                                </button>
                                <div className="text-left">
                                  <button
                                    onClick={() => setSelectedProfileUsername(post.author.username)}
                                    className="text-xs text-[#FAF9F5] block font-bold hover:text-[#F5A623] transition"
                                  >
                                    {post.author.name}
                                  </button>
                                  <span className="text-[9px] text-[#FAF9F5]/40 font-mono block">{post.author.username}</span>
                                </div>
                              </div>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-none border ${
                                post.category === "Tragedy" 
                                  ? "bg-red-950/40 text-red-400 border-red-900/60" 
                                  : post.category === "Harvest"
                                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                                  : "bg-blue-950/40 text-blue-400 border-blue-900/60"
                              }`}>
                                {post.category}
                              </span>
                            </div>

                            {/* Post gallery or cover image */}
                            {post.images.length > 0 && (
                              <div className="aspect-video w-full overflow-hidden bg-[#051108] relative">
                                <img
                                  src={activeImg}
                                  alt={post.title}
                                  className="w-full h-full object-cover opacity-85 hover:opacity-100 transition duration-300"
                                />
                                {/* gallery overlay controls */}
                                {post.images.length > 1 && (
                                  <div className="absolute inset-0 flex items-center justify-between px-2">
                                    <button 
                                      onClick={() => cycleGalleryImage(post.id, post.images.length, -1)}
                                      className="bg-black/60 border border-[#2D6A4F] text-[#FAF9F5] p-1 hover:bg-[#2D6A4F] transition"
                                    >
                                      <ArrowLeft className="h-3 w-3" />
                                    </button>
                                    <span className="bg-black/80 border border-[#2D6A4F] text-[#FAF9F5] text-[9px] font-mono px-2 py-0.5">
                                      {activeImgIdx + 1}/{post.images.length}
                                    </span>
                                    <button 
                                      onClick={() => cycleGalleryImage(post.id, post.images.length, 1)}
                                      className="bg-black/60 border border-[#2D6A4F] text-[#FAF9F5] p-1 hover:bg-[#2D6A4F] transition"
                                    >
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Content Body based on type */}
                            <div className="p-5 text-left space-y-3">
                              
                              {/* Story Post styling */}
                              {post.type === "story" ? (
                                <article className="space-y-2">
                                  <h3 className="text-base font-extrabold font-serif text-[#F5A623] leading-snug tracking-wide">
                                    {post.title}
                                  </h3>
                                  <p className="text-[11px] text-[#FAF9F5]/80 leading-relaxed font-semibold pl-3 border-l-2 border-[#2D6A4F]/60 first-letter:text-2xl first-letter:font-bold first-letter:text-[#F5A623] first-letter:mr-1">
                                    {post.body}
                                  </p>
                                </article>
                              ) : (
                                <>
                                  <h3 className="text-sm font-bold font-serif text-[#FAF9F5] leading-snug">
                                    {post.title}
                                  </h3>
                                  <p className="text-[11px] text-[#FAF9F5]/70 leading-relaxed font-semibold">
                                    {post.body}
                                  </p>
                                </>
                              )}

                              {/* Tags display */}
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {post.tags.map((tag, i) => (
                                  <span key={i} className="text-[9px] font-mono text-[#F5A623]/80">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Action footer */}
                          <div className="px-5 py-3 bg-[#051108]/90 border-t border-[#2D6A4F]/25 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleLikePost(post.id)}
                                className={`flex items-center gap-1 text-[10px] font-black uppercase transition cursor-pointer ${
                                  post.hasLiked ? "text-emerald-400" : "text-[#FAF9F5]/60 hover:text-[#FAF9F5]"
                                }`}
                              >
                                <Heart className={`h-3.5 w-3.5 ${post.hasLiked ? "fill-current" : ""}`} />
                                <span>{post.likes}</span>
                              </button>

                              {/* Tragedy "Relate" Reaction */}
                              {post.category === "Tragedy" && (
                                <button
                                  onClick={() => handleRelateTragedy(post.id)}
                                  className={`flex items-center gap-1.5 text-[10px] font-black uppercase transition cursor-pointer border px-2 py-0.5 ${
                                    post.hasRelated 
                                      ? "bg-[#2D6A4F]/30 border-[#2D6A4F] text-[#F5A623]" 
                                      : "border-transparent text-[#FAF9F5]/50 hover:text-[#FAF9F5]"
                                  }`}
                                  title="This happened to me too"
                                >
                                  🤝 Relate ({post.relates})
                                </button>
                              )}
                            </div>

                            <span className="text-[9px] text-[#FAF9F5]/40 font-mono">
                              {post.comments.length} comments • {post.createdAt}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* 🌾 MQULIMA SOKO MODULE */}
              {subpage === "soko" && !selectedProfileUsername && (
                <div className="space-y-6">
                  
                  {/* Header Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D6A4F]/30 pb-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#FAF9F5] flex items-center gap-2">
                        🌾 Mqulima Soko (Trade exchange)
                      </h2>
                      <p className="text-xs text-[#FAF9F5]/60 mt-1">
                        Trade boards: farmers list agricultural commodities for sale.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setIsListingSoko(!isListingSoko)}
                      className="bg-[#2D6A4F] border border-[#F5A623] hover:bg-[#2D6A4F]/80 text-[#FAF9F5] px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> List Commodity
                    </button>
                  </div>

                  {/* PERSISTENT COMMODITY PRICE BILLBOARD TICKER */}
                  <div className="bg-[#0A0F0D] border border-[#2D6A4F]/40 p-4 text-left relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#2D6A4F]/20 pb-2 mb-3">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#F5A623] flex items-center gap-1">
                        📊 Live Commodity Prices Billboard (KES Market Index)
                      </span>
                      <span className="text-[8px] font-mono text-[#FAF9F5]/30">
                        SOURCE: SIMULATED KAMIS API FEED
                      </span>
                    </div>

                    <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                      {billboardPrices.map((bill, idx) => {
                        const priceChange = bill.price - bill.prevPrice;
                        const direction = priceChange > 0 ? "up" : priceChange < 0 ? "down" : "steady";
                        return (
                          <div key={idx} className="bg-[#051108] border border-[#2D6A4F]/30 p-2.5 shadow-xs font-mono text-left">
                            <span className="text-[9px] text-[#FAF9F5]/40 block font-bold uppercase tracking-tight truncate">{bill.crop}</span>
                            <span className="text-[8px] text-[#F5A623] block">{bill.region}</span>
                            <div className="flex items-center justify-between mt-1">
                              <strong className="text-xs text-[#FAF9F5] font-bold">KES {bill.price}</strong>
                              <span className={`text-[9px] font-black ${
                                direction === "up" ? "text-emerald-400" : direction === "down" ? "text-red-400" : "text-[#FAF9F5]/40"
                              }`}>
                                {direction === "up" ? `+${Math.round(priceChange)}` : Math.round(priceChange)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SOKO SEARCH FILTERS */}
                  <div className="bg-[#0A0F0D] border border-[#2D6A4F]/30 p-4 grid gap-4 sm:grid-cols-4 text-xs text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#FAF9F5]/40 uppercase tracking-widest block">Search commodity</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="e.g. Potatoes..." 
                          value={sokoSearch}
                          onChange={(e) => setSokoSearch(e.target.value)}
                          className="w-full bg-[#051108] border border-[#2D6A4F]/35 rounded-none px-3 py-1.5 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                        />
                        <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#FAF9F5]/30" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#FAF9F5]/40 uppercase tracking-widest block">Commodity type</label>
                      <select 
                        value={sokoTypeFilter}
                        onChange={(e) => setSokoTypeFilter(e.target.value as any)}
                        className="w-full bg-[#051108] border border-[#2D6A4F]/35 rounded-none px-3 py-1.5 text-xs text-[#FAF9F5] cursor-pointer"
                      >
                        <option value="all">All commodities</option>
                        <option value="crop">Crops / Vegetables</option>
                        <option value="livestock">Livestock / Beekeeping</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#FAF9F5]/40 uppercase tracking-widest block">County/Location</label>
                      <select
                        value={sokoCountyFilter}
                        onChange={(e) => setSokoCountyFilter(e.target.value)}
                        className="w-full bg-[#051108] border border-[#2D6A4F]/35 rounded-none px-3 py-1.5 text-xs text-[#FAF9F5] cursor-pointer"
                      >
                        <option value="all">All Counties</option>
                        <option value="Nyandarua">Nyandarua</option>
                        <option value="Kericho">Kericho</option>
                        <option value="Uasin Gishu">Uasin Gishu</option>
                        <option value="Machakos">Machakos</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#FAF9F5]/40 uppercase tracking-widest block flex justify-between">
                        <span>Max Price Limit:</span>
                        <strong className="text-[#F5A623] font-mono">KES {sokoMaxPrice}</strong>
                      </label>
                      <input 
                        type="range"
                        min="1000"
                        max="20000"
                        step="500"
                        value={sokoMaxPrice}
                        onChange={(e) => setSokoMaxPrice(Number(e.target.value))}
                        className="w-full h-1 bg-[#051108] rounded-lg appearance-none cursor-pointer accent-[#F5A623]"
                      />
                    </div>
                  </div>

                  {/* Trade Listing Form */}
                  {isListingSoko && (
                    <form onSubmit={handleCreateSokoListing} className="bg-[#0A0F0D] border border-[#2D6A4F]/40 p-5 space-y-4">
                      <h3 className="text-xs font-black text-[#F5A623] uppercase tracking-wider border-b border-[#2D6A4F]/30 pb-2">
                        Put up Commodity for Sale
                      </h3>
                      
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Commodity name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dry Maize, Grade A Milk"
                            value={sokoCommodity}
                            onChange={(e) => setSokoCommodity(e.target.value)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Commodity Type</label>
                          <select
                            value={sokoType}
                            onChange={(e) => setSokoType(e.target.value as any)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] cursor-pointer"
                          >
                            <option value="crop">Crops / Grain / Veg</option>
                            <option value="livestock">Livestock / Animals</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Unit Price (KES)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 3200 per bag"
                            value={sokoPrice}
                            onChange={(e) => setSokoPrice(e.target.value)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Available Volume</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 45 Bags"
                            value={sokoQty}
                            onChange={(e) => setSokoQty(e.target.value)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Location (County/Region)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Eldoret, Uasin Gishu"
                            value={sokoLoc}
                            onChange={(e) => setSokoLoc(e.target.value)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Product Image URL</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={sokoImgText}
                            onChange={(e) => setSokoImgText(e.target.value)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Trade Description & Quality Specs</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="NPK application details, size sort, moisture content etc..."
                          value={sokoDesc}
                          onChange={(e) => setSokoDesc(e.target.value)}
                          className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3.5 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsListingSoko(false)}
                          className="border border-[#2D6A4F]/40 px-4 py-2 rounded-none text-xs font-bold text-[#FAF9F5]/60 hover:bg-[#2D6A4F]/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-[#F5A623] hover:bg-[#d68e1a] text-[#0A0F0D] px-4 py-2 rounded-none text-xs font-extrabold uppercase tracking-wider"
                        >
                          List Commodity
                        </button>
                      </div>
                    </form>
                  )}

                  {/* listings feed display */}
                  <div className="space-y-4">
                    {filteredSokoListings.map((listing) => (
                      <div 
                        key={listing.id} 
                        className="bg-[#0A0F0D] border border-[#2D6A4F]/35 rounded-none p-5 shadow-xs flex flex-col md:flex-row gap-5 hover:border-[#F5A623] transition duration-300"
                      >
                        <div className="h-32 w-full md:w-44 rounded-none overflow-hidden bg-slate-900 border border-[#2D6A4F]/30 shrink-0">
                          <img
                            src={listing.images[0]}
                            alt={listing.commodity}
                            className="w-full h-full object-cover opacity-85 hover:opacity-100 transition"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between text-left">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[#F5A623] font-bold flex items-center gap-1 font-mono">
                                <MapPin className="h-3.5 w-3.5" /> {listing.location}
                              </span>
                              <span className="text-[9px] text-[#FAF9F5]/40 font-mono">{listing.createdAt}</span>
                            </div>
                            <h3 className="text-base font-extrabold font-serif text-[#FAF9F5] mt-1.5">
                              {listing.commodity}
                            </h3>
                            <p className="text-xs text-[#FAF9F5]/70 mt-2">
                              {listing.description}
                            </p>
                            <div className="flex gap-6 mt-3.5 text-xs font-semibold">
                              <div>
                                <span className="text-[#FAF9F5]/40 font-bold block text-[9px] uppercase tracking-wider">Unit Pricing</span>
                                <strong className="text-emerald-400 font-mono text-sm">KES {listing.price}</strong>
                              </div>
                              <div>
                                <span className="text-[#FAF9F5]/40 font-bold block text-[9px] uppercase tracking-wider">Available Volume</span>
                                <strong className="text-[#FAF9F5] font-mono text-sm">{listing.quantity}</strong>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-[#2D6A4F]/20 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <span className="text-[10px] text-[#FAF9F5]/40 font-semibold">
                              Seller profile:{" "}
                              <button 
                                onClick={() => setSelectedProfileUsername(listing.author.username)}
                                className="text-[#FAF9F5]/80 font-mono hover:text-[#F5A623] hover:underline"
                              >
                                {listing.author.username}
                              </button>
                            </span>
                            
                            <button
                              onClick={() => {
                                // Locate chat session or launch new
                                const sessIdx = chats.findIndex(c => c.farmer?.username === listing.author.username);
                                if (sessIdx !== -1) {
                                  setActiveChatId(chats[sessIdx].id);
                                } else {
                                  const newId = `d_${Date.now()}`;
                                  const newSession: ChatSession = {
                                    id: newId,
                                    name: `${listing.author.name} (DM)`,
                                    isGroup: false,
                                    farmer: listing.author,
                                    log: [
                                      { id: "s_init", sender: listing.author.username, text: `Hello! I noticed you are inspecting my trade offer for ${listing.commodity}. Let me know if you need to transact.`, timestamp: "Just now", read: true }
                                    ]
                                  };
                                  setChats(prev => [newSession, ...prev]);
                                  setActiveChatId(newId);
                                }
                                setSubpage("konnekt");
                                toast.success(`Chat opened with ${listing.author.name}`);
                              }}
                              className="bg-[#2D6A4F] border border-[#F5A623] hover:bg-[#2D6A4F]/85 text-[#FAF9F5] px-4 py-2 rounded-none text-xs font-bold uppercase transition cursor-pointer"
                            >
                              Message Seller
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* 📈 MQULIMA PULSE NEWS & INSIGHTS */}
              {subpage === "pulse" && !selectedProfileUsername && (
                <div className="space-y-6">
                  
                  {/* Header Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D6A4F]/30 pb-5">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#FAF9F5] flex items-center gap-2">
                        📈 Mqulima Pulse (Verified Insights)
                      </h2>
                      <p className="text-xs text-[#FAF9F5]/60 mt-1">
                        Agronomic insights feed, market trends, policy reviews. Mandatory source attribution enforced.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsPostingPulse(!isPostingPulse)}
                      className="bg-[#2D6A4F] border border-[#F5A623] hover:bg-[#2D6A4F]/80 text-[#FAF9F5] px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Publish Dispatch
                    </button>
                  </div>

                  {/* Dispatch Form */}
                  {isPostingPulse && (
                    <form onSubmit={handleCreatePulsePost} className="bg-[#0A0F0D] border border-[#2D6A4F]/40 p-5 space-y-4">
                      <h3 className="text-xs font-black text-[#F5A623] uppercase tracking-wider border-b border-[#2D6A4F]/30 pb-2">
                        Publish News Dispatch / Pulse Contribution
                      </h3>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Article Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. EU exports policy regulations revised"
                            value={pulseTitle}
                            onChange={(e) => setPulseTitle(e.target.value)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Category</label>
                          <select
                            value={pulseCategory}
                            onChange={(e) => setPulseCategory(e.target.value as any)}
                            className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] cursor-pointer"
                          >
                            <option value="Market Trend">Market Trend</option>
                            <option value="Weather Alert">Weather Alert</option>
                            <option value="Policy Update">Policy Update</option>
                            <option value="Agronomy Alert">Agronomy Alert</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase flex items-center gap-1">
                          <span>Verified Source Attribution</span>
                          <span className="text-red-400 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Source: KALRO Horticultural Research, Nairobi Division"
                          value={pulseSource}
                          onChange={(e) => setPulseSource(e.target.value)}
                          className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-[#FAF9F5]/40 uppercase">Bulletin content / Report body</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Details of the report..."
                          value={pulseContent}
                          onChange={(e) => setPulseContent(e.target.value)}
                          className="w-full bg-[#051108] border border-[#2D6A4F]/45 rounded-none px-3.5 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsPostingPulse(false)}
                          className="border border-[#2D6A4F]/40 px-4 py-2 rounded-none text-xs font-bold text-[#FAF9F5]/60 hover:bg-[#2D6A4F]/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-[#F5A623] hover:bg-[#d68e1a] text-[#0A0F0D] px-4 py-2 rounded-none text-xs font-extrabold uppercase tracking-wider"
                        >
                          Publish
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Pulse dispatches card list */}
                  <div className="grid gap-6 md:grid-cols-3">
                    {pulsePosts.map((pulse) => (
                      <div 
                        key={pulse.id} 
                        className="bg-[#0A0F0D] border border-[#2D6A4F]/30 p-5 shadow-lg flex flex-col justify-between hover:border-[#F5A623]/60 transition duration-300"
                      >
                        <div>
                          <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 font-black px-2.5 py-0.5 rounded-none uppercase tracking-wider">
                            {pulse.category}
                          </span>
                          <h3 className="text-sm font-extrabold font-serif text-[#FAF9F5] mt-4 leading-snug">
                            {pulse.title}
                          </h3>
                          <p className="text-[11px] text-[#FAF9F5]/70 mt-2.5 leading-relaxed font-semibold">
                            {pulse.content}
                          </p>
                        </div>
                        
                        <div className="mt-4 border-t border-[#2D6A4F]/20 pt-2.5 text-[9px] font-mono text-[#FAF9F5]/40 flex flex-col gap-1 text-left">
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            ✓ {pulse.source}
                          </span>
                          <span>Published: {pulse.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* PDF Dispatch block */}
                  <div className="bg-gradient-to-r from-[#051108] via-[#0A0F0D] to-[#2D6A4F]/20 border border-[#2D6A4F]/60 p-6 flex flex-col md:flex-row justify-between items-center gap-5">
                    <div>
                      <span className="text-[#F5A623] text-[9px] font-black uppercase tracking-wider block">Agronomist Dispatch Bulletin</span>
                      <h3 className="text-base font-bold font-serif mt-1 text-[#FAF9F5]">Download June Soil & Fertilizer Bulletins</h3>
                      <p className="text-xs text-[#FAF9F5]/80 mt-1 leading-relaxed max-w-lg">
                        Comprehensive cooperative guides on NPK ratios, compost layering and Smart irrigation routines formulated by KALRO researchers.
                      </p>
                    </div>
                    <button
                      onClick={() => toast.success("Downloading PDF Soil Bulletin (5.2 MB)...")}
                      className="bg-[#F5A623] hover:bg-[#d68e1a] text-[#0A0F0D] font-extrabold text-xs px-5 py-3 rounded-none flex items-center gap-2 transition shrink-0 uppercase tracking-wider"
                    >
                      <Download className="h-4 w-4" /> Download Bulletin PDF
                    </button>
                  </div>

                </div>
              )}

              {/* 💬 MQULIMA KONNEKT MODULE */}
              {subpage === "konnekt" && !selectedProfileUsername && (
                <div className="space-y-6">
                  
                  {/* Header Title */}
                  <div className="border-b border-[#2D6A4F]/30 pb-5 text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#FAF9F5] flex items-center gap-2">
                        💬 Mqulima Konnekt (In-app Messenger)
                      </h2>
                      <p className="text-xs text-[#FAF9F5]/60 mt-1">
                        Encrypted messaging synced via simulated Supabase Realtime channels.
                      </p>
                    </div>

                    {/* Network widget shortcut in Konnekt */}
                    {offlineQueue.length > 0 && (
                      <button 
                        onClick={triggerManualSync}
                        className="bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-[#F5A623] text-xs px-4 py-2 font-bold uppercase tracking-wider flex items-center gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        <span>Force Sync ({offlineQueue.length} Queued)</span>
                      </button>
                    )}
                  </div>

                  {/* Chat Grid Window */}
                  <div className="grid md:grid-cols-12 border border-[#2D6A4F]/30 bg-[#0A0F0D] min-h-[500px]">
                    
                    {/* Left Channels list (4 columns) */}
                    <div className="md:col-span-4 bg-[#051108]/90 border-r border-[#2D6A4F]/25 p-4 text-left space-y-3">
                      <span className="text-[9px] font-black text-[#FAF9F5]/40 uppercase tracking-widest block font-mono">Channels & DMs</span>
                      <div className="space-y-1.5">
                        {chats.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => setActiveChatId(session.id)}
                            className={`w-full flex items-center gap-2.5 p-3 rounded-none transition border text-left cursor-pointer ${
                              activeChatId === session.id
                                ? "bg-[#2D6A4F]/40 border-[#F5A623] text-[#FAF9F5] shadow-xs" 
                                : "border-transparent text-[#FAF9F5]/70 hover:bg-[#2D6A4F]/10 hover:text-[#FAF9F5]"
                            }`}
                          >
                            <div className="h-7 w-7 rounded-none bg-[#2D6A4F] text-[#FAF9F5] font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#F5A623]/40 relative">
                              {session.isGroup ? "GP" : session.farmer?.avatar}
                              {/* Green online dot simulation */}
                              {!session.isGroup && (
                                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border border-[#0A0F0D]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <strong className="text-xs text-[#FAF9F5] block truncate font-bold">{session.name}</strong>
                              <span className="text-[9px] text-[#FAF9F5]/40 block truncate font-mono">
                                {session.isGroup ? "Supabase Realtime Channel" : session.farmer?.username}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Queue Status Visualizer widget for offline-tolerant queueing */}
                      <div className="border-t border-[#2D6A4F]/20 pt-4 mt-4 space-y-2">
                        <span className="text-[9px] font-black text-[#FAF9F5]/40 uppercase tracking-widest block font-mono">Offline Sync Queue</span>
                        <div className="bg-[#051108] border border-[#2D6A4F]/30 p-2.5 text-[10px] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#FAF9F5]/50">Status:</span>
                            <strong className={isOnline ? "text-emerald-400" : "text-amber-500"}>
                              {isOnline ? "Network Connected" : "Local Queueing Only"}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#FAF9F5]/50">Pending Payloads:</span>
                            <strong>{offlineQueue.length} messages</strong>
                          </div>
                          {offlineQueue.length > 0 && (
                            <button
                              onClick={triggerManualSync}
                              disabled={!isOnline || isSyncing}
                              className="w-full mt-2 bg-[#2D6A4F] disabled:opacity-40 text-[#FAF9F5] text-[9px] font-bold uppercase tracking-wider py-1 border border-[#F5A623]/40 hover:border-[#F5A623]"
                            >
                              {isSyncing ? "Syncing..." : "Sync Payloads Now"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right chat logs viewport (8 columns) */}
                    <div className="md:col-span-8 flex flex-col justify-between min-h-[400px]">
                      {/* Active Chat Header */}
                      <div className="p-4 border-b border-[#2D6A4F]/25 bg-[#051108] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-none bg-[#2D6A4F] text-[#FAF9F5] font-black text-xs flex items-center justify-center border border-[#F5A623]">
                            {activeChat.isGroup ? "GP" : activeChat.farmer?.avatar}
                          </div>
                          <div className="text-left">
                            <strong className="text-xs text-[#FAF9F5] block font-bold">{activeChat.name}</strong>
                            <span className="text-[9px] text-[#FAF9F5]/40 font-mono block">
                              {activeChat.isGroup ? "Realtime channel: active" : "Supabase user session"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block animate-pulse" />
                          <span className="text-[9px] text-[#FAF9F5]/40 font-mono uppercase">Sync Active</span>
                        </div>
                      </div>

                      {/* Logs scrollbox */}
                      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[300px] bg-[#051108]/40">
                        {activeChat.log.map((msg, i) => {
                          const isMe = msg.sender === (currentUser ? currentUser.username : "@mqulima_guest");
                          return (
                            <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                              <div className={`max-w-[75%] rounded-none px-4 py-2.5 text-xs border ${
                                isMe 
                                  ? "bg-[#2D6A4F] border-[#F5A623]/40 text-[#FAF9F5] text-right" 
                                  : "bg-[#0A0F0D] border border-[#2D6A4F]/40 text-[#FAF9F5] text-left"
                              }`}>
                                <p className="font-semibold">{msg.text}</p>
                              </div>
                              <span className="text-[8px] text-[#FAF9F5]/40 font-mono block mt-1 px-1">
                                {msg.sender} • {msg.timestamp} {isMe && "• Read ✓"}
                              </span>
                            </div>
                          );
                        })}

                        {/* Typing indicator simulation on DMs */}
                        {!isOnline && (
                          <div className="text-[9px] text-amber-500 font-mono italic">
                            ⚠️ Outbox queue active. Messages will sync to Supabase once network re-connects.
                          </div>
                        )}
                      </div>

                      {/* Text Input */}
                      <form onSubmit={handleSendMessage} className="p-3 bg-[#0A0F0D] border-t border-[#2D6A4F]/25 flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder={
                            isOnline 
                              ? `Send message to ${activeChat.name.split(" ")[0]}...`
                              : "Outbox Queue: enter message to save locally..."
                          }
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="flex-1 bg-[#051108] border border-[#2D6A4F]/35 rounded-none px-4 py-2 text-xs text-[#FAF9F5] outline-none focus:border-[#F5A623] transition"
                        />
                        <button
                          type="submit"
                          className="bg-[#F5A623] hover:bg-[#d68e1a] text-[#0A0F0D] px-4 py-2 rounded-none text-xs font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 shrink-0"
                        >
                          <span>Send</span>
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>

                    </div>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* ══════════════════════════════════════════
            3. DEVELOPER DASHBOARD: SUPABASE SCHEMA & RLS
            ══════════════════════════════════════════ */}
        <AnimatePresence>
          {showRLSDashboard && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="mt-6 bg-[#051108] border border-[#2D6A4F] p-6 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-[#2D6A4F]/40 pb-3 mb-4">
                <div className="flex items-center gap-2 text-[#F5A623] font-bold text-sm font-serif">
                  <Database className="h-4 w-4" />
                  <span>Supabase Schema & Row-Level Security (RLS) policies</span>
                </div>
                <button 
                  onClick={() => setShowRLSDashboard(false)}
                  className="text-xs text-[#FAF9F5]/40 hover:text-[#FAF9F5] font-extrabold border border-[#2D6A4F]/30 px-2 py-0.5"
                >
                  Close Panel
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 font-mono text-[10px]">
                {[
                  {
                    table: "profiles",
                    fields: "id (UUID), username (text), name (text), country (text), county (text), interests (array), years_farming (int), certifications (array), reputation_score (int), followers (array)",
                    rls: "1. SELECT: Allow public read. \n2. UPDATE: auth.uid() === id. \n3. INSERT: Authenticated signup only."
                  },
                  {
                    table: "posts",
                    fields: "id (UUID), author_id (UUID), title (text), body (text), type (text), category (text), images (array), likes (int), relates (int), tags (array), created_at (timestamp)",
                    rls: "1. SELECT: Allow public read. \n2. ALL: auth.uid() === author_id."
                  },
                  {
                    table: "listings",
                    fields: "id (UUID), author_id (UUID), commodity (text), type (text), price (numeric), quantity (text), location (text), images (array), status (text), created_at (timestamp)",
                    rls: "1. SELECT: Allow public read. \n2. ALL: auth.uid() === author_id."
                  },
                  {
                    table: "messages",
                    fields: "id (UUID), channel_id (text), sender (text), text (text), timestamp (text), read (boolean)",
                    rls: "1. SELECT: Allow authenticated users in channel. \n2. INSERT: sender === auth.username."
                  }
                ].map((schema, idx) => (
                  <div key={idx} className="bg-[#0A0F0D] border border-[#2D6A4F]/40 p-4 space-y-3">
                    <span className="text-[#F5A623] font-bold block border-b border-[#2D6A4F]/20 pb-1 uppercase tracking-wider">
                      Table: {schema.table}
                    </span>
                    <div>
                      <strong className="text-[#FAF9F5]/50 block uppercase text-[8px] tracking-widest">Columns:</strong>
                      <p className="text-[#FAF9F5]/70 leading-relaxed mt-0.5">{schema.fields}</p>
                    </div>
                    <div>
                      <strong className="text-[#FAF9F5]/50 block uppercase text-[8px] tracking-widest">RLS Constraints:</strong>
                      <pre className="text-emerald-400 mt-1 whitespace-pre-wrap leading-normal font-sans text-[9px]">
                        {schema.rls}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </div>
    </div>
  );
}
