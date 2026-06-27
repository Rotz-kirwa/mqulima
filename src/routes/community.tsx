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
  Image, 
  Tag, 
  Sparkles, 
  UserCheck, 
  Bookmark, 
  MessageCircle, 
  TrendingUp, 
  MapPin, 
  UserPlus,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Mqulima Forum — Decentralized Farmer Subdomain" },
      {
        name: "description",
        content: "Share moments at Mqulima Show, trade on Mqulima Soko, get updates on Mqulima Pulse, and message via Mqulima Konnekt.",
      },
    ],
  }),
  component: ForumSubdomainPage,
});

// Seed Farmers / Users Database
// All usernames start with "mqulima"
type FarmerProfile = {
  username: string;
  name: string;
  country: string;
  county: string;
  interests: {
    crops: string[];
    livestock: string[];
  };
  yearsFarming: number;
  certifications: string[];
  reputationScore: number;
  followers: number;
  avatar: string;
};

const initialFarmers: FarmerProfile[] = [
  {
    username: "@mqulima_samuel",
    name: "Dr. Samuel Kirwa",
    country: "Kenya",
    county: "Uasin Gishu",
    interests: {
      crops: ["Maize", "Wheat", "Canola"],
      livestock: ["Friesian Cows", "Poultry"]
    },
    yearsFarming: 16,
    certifications: ["Certified Agronomist (KEPHIS)", "Organic Fertilizer Practitioner"],
    reputationScore: 4950,
    followers: 1240,
    avatar: "SK"
  },
  {
    username: "@mqulima_wanjiku",
    name: "Mary Wanjiku",
    country: "Kenya",
    county: "Nyandarua",
    interests: {
      crops: ["Shangi Potatoes", "Cabbages", "Peas"],
      livestock: ["Sheep"]
    },
    yearsFarming: 8,
    certifications: ["Potato Multiplication Certificate (ADC)"],
    reputationScore: 2840,
    followers: 890,
    avatar: "MW"
  },
  {
    username: "@mqulima_kiprono",
    name: "David Kiprono",
    country: "Kenya",
    county: "Kericho",
    interests: {
      crops: ["Tea", "Purple Tea"],
      livestock: ["Dairy Goats"]
    },
    yearsFarming: 5,
    certifications: ["Smart Water Management (KALRO)"],
    reputationScore: 1820,
    followers: 430,
    avatar: "DK"
  },
  {
    username: "@mqulima_mutiso",
    name: "Grace Mutiso",
    country: "Kenya",
    county: "Machakos",
    interests: {
      crops: ["Apple Mangoes", "Avocados", "French Beans"],
      livestock: ["Beekeeping"]
    },
    yearsFarming: 12,
    certifications: ["EU phytosanitary export inspector certification"],
    reputationScore: 3120,
    followers: 780,
    avatar: "GM"
  }
];

// Show posts seed database
type ShowPost = {
  id: string;
  author: FarmerProfile;
  title: string;
  body: string;
  category: "Harvest" | "Moment" | "Tragedy" | "Learning";
  image: string;
  likes: number;
  hasLiked?: boolean;
  repliesCount: number;
  comments: { authorName: string; text: string; time: string }[];
  createdAt: string;
};

const initialShowPosts: ShowPost[] = [
  {
    id: "s1",
    author: initialFarmers[1], // Mary Wanjiku
    title: "Shangi Tuber Harvest - 45 bags from 0.5 Acres!",
    body: "Absolutely thrilled with this season's Shangi potato yields! Followed the nitrogen application alerts on Uasin Gishu Agronomy SMS block. The skin quality is perfect, ready for delivery to Nairobi markets.",
    category: "Harvest",
    image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800",
    likes: 42,
    repliesCount: 3,
    comments: [
      { authorName: "@mqulima_samuel", text: "Stellar yields Mary! Did you apply potassium top-dressing?", time: "2h ago" },
      { authorName: "@mqulima_kiprono", text: "Amazing stuff, Shangi variety is truly high-yielding.", time: "1h ago" }
    ],
    createdAt: "3h ago"
  },
  {
    id: "s2",
    author: initialFarmers[3], // Grace Mutiso
    title: "Tragedy: Fruit Fly Infiltration in my orchards",
    body: "Woke up to find active fruit fly stings in my young mango orchards. Seeking urgent organic pheromone bait advice! I need to arrest this before they puncture the late-blooming fruits.",
    category: "Tragedy",
    image: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800",
    likes: 18,
    repliesCount: 1,
    comments: [
      { authorName: "@mqulima_samuel", text: "Grace, hang Biolure pheromone traps 1.5 meters high immediately. Keep weeding the floor to kill pupae.", time: "4h ago" }
    ],
    createdAt: "5h ago"
  }
];

// Soko Listings Seed
type SokoListing = {
  id: string;
  author: FarmerProfile;
  commodity: string;
  price: string;
  quantity: string;
  location: string;
  image: string;
  description: string;
  createdAt: string;
};

const initialSokoListings: SokoListing[] = [
  {
    id: "t1",
    author: initialFarmers[1], // Mary Wanjiku
    commodity: "Irish Potatoes (Shangi)",
    price: "KSh 3,200 per 90kg bag",
    quantity: "35 Bags available",
    location: "Ol Kalou, Nyandarua",
    image: "/mqulima_soko_crop.png",
    description: "Grade 1 Shangi potatoes. Harvested today, clean skin, sorted by sizes. Delivery can be arranged to Nairobi or Nakuru.",
    createdAt: "1h ago"
  },
  {
    id: "t2",
    author: initialFarmers[2], // David Kiprop
    commodity: "Organic Avocado (Fuerte)",
    price: "KSh 65 per kg",
    quantity: "400 Kgs available",
    location: "Kericho town",
    image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=500",
    description: "Export quality Fuerte avocados. Hand-picked, natural ripening, pesticide-free certification ready.",
    createdAt: "3h ago"
  }
];

// Pulse Billboards Seed
const pulseUpdates = [
  { id: 1, title: "El Niño rains predicted to decline by mid-July", content: "Met Department releases farm alerts advising North Rift grain farmers to plan dry-shelling facilities ahead of moisture surges.", category: "Weather Alert", date: "June 26, 2026" },
  { id: 2, title: "National Fertilizer Subsidy phase-3 rollout starts", content: "Farmers registered on the digital voucher system can collect NCPB bags in Nakuru, Eldoret, and Narok for KSh 2,500.", category: "Policy & Inputs", date: "June 24, 2026" },
  { id: 3, title: "Export duty drop on certified horticulture to EU", content: "Kenya-EU EPA agreement takes action, removing tariff barriers for smallholders supplying French Beans and snow peas.", category: "Trade Index", date: "June 20, 2026" }
];

// Konnekt Messages Seed
type ChatMessage = {
  sender: string;
  text: string;
  timestamp: string;
};

type ChatSession = {
  farmer: FarmerProfile;
  log: ChatMessage[];
};

function ForumSubdomainPage() {
  const [subpage, setSubpage] = useState<"show" | "soko" | "pulse" | "konnekt" | "profile">("show");

  // Database States
  const [farmers, setFarmers] = useState<FarmerProfile[]>(initialFarmers);
  const [showPosts, setShowPosts] = useState<ShowPost[]>(initialShowPosts);
  const [sokoListings, setSokoListings] = useState<SokoListing[]>(initialSokoListings);

  // Profile Viewer / Registration State
  const [currentUser, setCurrentUser] = useState<FarmerProfile | null>(null);
  const [isRegisteringProfile, setIsRegisteringProfile] = useState(false);

  // Profile Fields
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regCounty, setRegCounty] = useState("Uasin Gishu");
  const [regCrops, setRegCrops] = useState("");
  const [regLivestock, setRegLivestock] = useState("");
  const [regYears, setRegYears] = useState("3");

  // Create Show Post State
  const [isPostingShow, setIsPostingShow] = useState(false);
  const [showTitle, setShowTitle] = useState("");
  const [showBody, setShowBody] = useState("");
  const [showCategory, setShowCategory] = useState<"Harvest" | "Moment" | "Tragedy" | "Learning">("Moment");
  const [showImage, setShowImage] = useState("");

  // Create Soko Listing State
  const [isListingSoko, setIsListingSoko] = useState(false);
  const [sokoCommodity, setSokoCommodity] = useState("");
  const [sokoPrice, setSokoPrice] = useState("");
  const [sokoQty, setSokoQty] = useState("");
  const [sokoLoc, setSokoLoc] = useState("");
  const [sokoDesc, setSokoDesc] = useState("");
  const [sokoImg, setSokoImg] = useState("");

  // Konnekt Direct Messaging Chat State
  const [activeChatIndex, setActiveChatIndex] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<ChatSession[]>([
    {
      farmer: initialFarmers[0], // Dr. Samuel Kirwa
      log: [
        { sender: "@mqulima_samuel", text: "Hello! Welcome to Mqulima Konnekt. Let me know if you need help with your soil testing queries.", timestamp: "10:15 AM" }
      ]
    },
    {
      farmer: initialFarmers[1], // Mary Wanjiku
      log: [
        { sender: "@mqulima_wanjiku", text: "Hi, saw your listing request on Soko. Do you want to coordinate transport to Nairobi next week?", timestamp: "Yesterday" }
      ]
    }
  ]);

  // Load user profile from localStorage if exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_forum_profile");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        // Default guest user
        const guest: FarmerProfile = {
          username: "@mqulima_guest",
          name: "John Doe",
          country: "Kenya",
          county: "Nakuru",
          interests: { crops: ["Maize"], livestock: ["Dairy Cows"] },
          yearsFarming: 2,
          certifications: ["Mqulima Portal Member"],
          reputationScore: 120,
          followers: 12,
          avatar: "G"
        };
        setCurrentUser(guest);
        localStorage.setItem("mqulima_forum_profile", JSON.stringify(guest));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleRegisterProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim()) {
      toast.error("Please specify your name and username.");
      return;
    }

    // Enforce username starts with "mqulima"
    let userHandle = regUsername.trim().toLowerCase();
    if (!userHandle.startsWith("mqulima")) {
      userHandle = "mqulima_" + userHandle;
    }
    // Prefix with @ if missing
    if (!userHandle.startsWith("@")) {
      userHandle = "@" + userHandle;
    }

    const newProfile: FarmerProfile = {
      username: userHandle,
      name: regName.trim(),
      country: "Kenya",
      county: regCounty,
      interests: {
        crops: regCrops.split(",").map(c => c.trim()).filter(Boolean),
        livestock: regLivestock.split(",").map(l => l.trim()).filter(Boolean)
      },
      yearsFarming: Number(regYears) || 1,
      certifications: ["Mqulima Verified Profile"],
      reputationScore: 250,
      followers: 1,
      avatar: regName.substring(0, 2).toUpperCase()
    };

    setCurrentUser(newProfile);
    localStorage.setItem("mqulima_forum_profile", JSON.stringify(newProfile));
    
    // Add to farmers database if not already there
    setFarmers((prev) => [newProfile, ...prev.filter(f => f.username !== newProfile.username)]);
    
    setIsRegisteringProfile(false);
    toast.success(`Profile registered! Your username is ${newProfile.username}`);
  };

  const handleCreateShowPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTitle.trim() || !showBody.trim()) {
      toast.error("Please fill in title and body.");
      return;
    }

    const newPost: ShowPost = {
      id: String(Date.now()),
      author: currentUser || initialFarmers[0],
      title: showTitle.trim(),
      body: showBody.trim(),
      category: showCategory,
      image: showImage.trim() || "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500",
      likes: 0,
      repliesCount: 0,
      comments: [],
      createdAt: "Just now"
    };

    setShowPosts([newPost, ...showPosts]);
    setIsPostingShow(false);
    setShowTitle("");
    setShowBody("");
    setShowImage("");
    toast.success("Moment posted to Mqulima Show feed!");
  };

  const handleCreateSokoListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sokoCommodity.trim() || !sokoPrice.trim() || !sokoQty.trim()) {
      toast.error("Please enter commodity details, pricing, and volume.");
      return;
    }

    const newListing: SokoListing = {
      id: String(Date.now()),
      author: currentUser || initialFarmers[0],
      commodity: sokoCommodity.trim(),
      price: sokoPrice.trim(),
      quantity: sokoQty.trim(),
      location: sokoLoc.trim() || "Unknown location",
      description: sokoDesc.trim(),
      image: sokoImg.trim() || "/mqulima_soko_crop.png",
      createdAt: "Just now"
    };

    setSokoListings([newListing, ...sokoListings]);
    setIsListingSoko(false);
    setSokoCommodity("");
    setSokoPrice("");
    setSokoQty("");
    setSokoLoc("");
    setSokoDesc("");
    setSokoImg("");
    toast.success("Commodity put up for sale on Mqulima Soko trade board!");
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const senderHandle = currentUser ? currentUser.username : "@mqulima_guest";
    const newMessage: ChatMessage = {
      sender: senderHandle,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChats = [...chats];
    const activeSession = updatedChats[activeChatIndex];
    activeSession.log.push(newMessage);
    setChats(updatedChats);
    setChatInput("");

    // Simulate agronomy reply
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        sender: activeSession.farmer.username,
        text: `Hey, this is ${activeSession.farmer.name.split(" ")[0]}. Thank you for the message. I will check the farming schedules and get back to you shortly!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updatedWithReply = [...chats];
      updatedWithReply[activeChatIndex].log.push(replyMsg);
      setChats(updatedWithReply);
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="bg-[#FAF9F5] text-[#2C332A] min-h-screen py-6 font-['Open_Sans'] antialiased">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* ════════════════════════════════════════════════════════
              DECISION 1 — VIRTUAL BROWSER CHROMIUM CHROME WINDOW WRAPPER
              ════════════════════════════════════════════════════════ */}
          <div className="w-full bg-white border border-[#D4DDD0] rounded-2xl overflow-hidden shadow-lg transition-all duration-300">
            
            {/* 1. Browser Chrome Header Bar */}
            <div className="bg-[#EAECE8] border-b border-[#D4DDD0] px-4 py-2 flex items-center justify-between gap-4 select-none">
              
              {/* Left dots */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-3 w-3 rounded-full bg-red-400 block" />
                <span className="h-3 w-3 rounded-full bg-yellow-400 block" />
                <span className="h-3 w-3 rounded-full bg-green-400 block" />
              </div>

              {/* Navigation arrows & Refresh */}
              <div className="hidden sm:flex items-center gap-3 text-gray-400 shrink-0">
                <ArrowLeft className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                <ArrowRight className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                <RotateCw className="h-4 w-4 cursor-pointer hover:text-gray-600" />
              </div>

              {/* Verified Domain bar representing Subdomain */}
              <div className="flex-1 max-w-xl mx-auto relative">
                <div className="w-full bg-white border border-[#D4DDD0] rounded-lg py-1 px-3 flex items-center gap-2 text-xs font-semibold text-gray-500 shadow-inner">
                  <Lock className="h-3.5 w-3.5 text-emerald-600 fill-current" />
                  <span className="text-emerald-700 font-bold select-all">forum.mqulima.com</span>
                  <span className="text-[#A2AAA0]">/{subpage}</span>
                </div>
              </div>

              {/* Right Side Info badge */}
              <div className="shrink-0">
                <span className="bg-[#1A5438]/10 text-[#1A5438] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-[#1A5438]/10">
                  Subdomain Active
                </span>
              </div>
            </div>

            {/* 2. Subdomain Inner Layout (Left Navigation Panel & Main Interface) */}
            <div className="grid lg:grid-cols-[240px_1fr] min-h-[680px]">
              
              {/* Left Subdomain Navigation Panel */}
              <div className="bg-[#F3F5F2] border-r border-[#D4DDD0] p-5 flex flex-col justify-between text-left">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black tracking-widest text-[#5D6B5C] uppercase block mb-3">
                      Forum Modules
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
                          onClick={() => setSubpage(item.id as any)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            subpage === item.id 
                              ? "bg-[#1A5438] text-white shadow-xs" 
                              : "text-[#5D6B5C] hover:bg-[#EAECE8] hover:text-[#1A3A1A]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </span>
                          {item.id === "konnekt" && (
                            <span className="h-2 w-2 rounded-full bg-[#F5A623] animate-ping" />
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="border-t border-[#D4DDD0] pt-4">
                    <h3 className="text-[10px] font-black tracking-widest text-[#5D6B5C] uppercase block mb-3">
                      Personal Panel
                    </h3>
                    <button
                      onClick={() => setSubpage("profile")}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        subpage === "profile" 
                          ? "bg-[#1A5438] text-white shadow-xs" 
                          : "text-[#5D6B5C] hover:bg-[#EAECE8] hover:text-[#1A3A1A]"
                      }`}
                    >
                      <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-emerald-200">
                        {currentUser ? currentUser.avatar : "G"}
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-xs">{currentUser ? currentUser.name : "Guest Farmer"}</strong>
                        <span className="block truncate text-[9px] text-[#5D6B5C]/80 font-semibold">{currentUser ? currentUser.username : "@mqulima_guest"}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Subdomain Footer statistics */}
                <div className="mt-8 pt-5 border-t border-[#D4DDD0] text-[10px] text-[#5D6B5C] space-y-1.5 font-semibold">
                  <div className="flex justify-between">
                    <span>Active Farmers:</span>
                    <strong className="text-[#1A5438]">5,420</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Commodities Sold:</span>
                    <strong className="text-[#1A5438]">1,890 Tons</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Subdomain SSL:</span>
                    <strong className="text-emerald-700 flex items-center gap-0.5">Secure ✓</strong>
                  </div>
                </div>
              </div>

              {/* Right Interface Container */}
              <div className="p-6 sm:p-8 overflow-y-auto max-h-[85vh] text-left">
                
                {/* ══════════════════════════════════════════
                    SUBPAGE 1: MQULIMA SHOW (Post showcase boards)
                    ══════════════════════════════════════════ */}
                {subpage === "show" && (
                  <div className="space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold font-['Lora'] text-[#1A3A1A]">
                          📸 Mqulima Show
                        </h2>
                        <p className="text-xs text-[#5D6B5C] mt-1 font-semibold">
                          Farmers showcase their farm moments, harvests, stories, tragedies, and what’s hot or not.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsPostingShow(!isPostingShow)}
                        className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Post Farm Moment</span>
                      </button>
                    </div>

                    {/* Show Post creation form */}
                    {isPostingShow && (
                      <form onSubmit={handleCreateShowPost} className="bg-[#FAF9F5] border border-[#D4DDD0] rounded-xl p-5 space-y-4">
                        <h3 className="text-xs font-black text-[#1A3A1A] uppercase tracking-wider">Create Moment Post</h3>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Post Title</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. My bumper maize harvest in Kitale!"
                              value={showTitle}
                              onChange={(e) => setShowTitle(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Category</label>
                            <select
                              value={showCategory}
                              onChange={(e) => setShowCategory(e.target.value as any)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438] cursor-pointer font-bold"
                            >
                              <option value="Moment">Farm Moment</option>
                              <option value="Harvest">Harvest Yield</option>
                              <option value="Tragedy">Farm Tragedy / Pest</option>
                              <option value="Learning">Learning / Guide</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Realistic Crop Photo URL (Optional)</label>
                          <input
                            type="url"
                            placeholder="e.g. https://images.unsplash.com/photo-..."
                            value={showImage}
                            onChange={(e) => setShowImage(e.target.value)}
                            className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Post Body & Story</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Share what's hot and what's not on the farm today..."
                            value={showBody}
                            onChange={(e) => setShowBody(e.target.value)}
                            className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3.5 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438] resize-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setIsPostingShow(false)}
                            className="border border-[#D4DDD0] px-4 py-2 rounded-lg text-xs font-bold text-[#5D6B5C] hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2 rounded-lg text-xs font-bold"
                          >
                            Publish Post
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Posts list grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {showPosts.map((post) => (
                        <div 
                          key={post.id} 
                          className="bg-white border border-[#D4DDD0] rounded-xl overflow-hidden shadow-xs hover:border-[#1A5438] transition flex flex-col justify-between"
                        >
                          <div>
                            {/* Author row */}
                            <div className="p-4 border-b border-gray-50 bg-[#FAF9F5] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[9px] flex items-center justify-center border border-emerald-200">
                                  {post.author.avatar}
                                </div>
                                <div>
                                  <strong className="text-xs text-[#1A3A1A] block">{post.author.name}</strong>
                                  <span className="text-[9px] text-[#5D6B5C] font-bold block">{post.author.username}</span>
                                </div>
                              </div>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                post.category === "Tragedy" 
                                  ? "bg-red-100 text-red-800" 
                                  : post.category === "Harvest"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {post.category}
                              </span>
                            </div>

                            {/* Crop image */}
                            <div className="aspect-video w-full overflow-hidden bg-gray-50">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500";
                                }}
                              />
                            </div>

                            {/* Content body */}
                            <div className="p-4 sm:p-5 text-left">
                              <h3 className="text-sm font-extrabold font-['Lora'] text-[#1A3A1A] leading-snug">
                                {post.title}
                              </h3>
                              <p className="text-[11px] text-[#5D6B5C] mt-2 leading-relaxed font-semibold">
                                {post.body}
                              </p>
                            </div>
                          </div>

                          {/* Action row (Likes, Comments) */}
                          <div className="px-4 py-3 bg-[#FAF9F5] border-t border-[#D4DDD0] flex items-center justify-between">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className={`flex items-center gap-1.5 text-[10px] font-black uppercase transition ${
                                post.hasLiked ? "text-emerald-700" : "text-[#5D6B5C] hover:text-[#1A3A1A]"
                              }`}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              <span>{post.likes} Likes</span>
                            </button>
                            <span className="text-[10px] text-[#5D6B5C] font-semibold">
                              {post.comments.length} replies • {post.createdAt}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* ══════════════════════════════════════════
                    SUBPAGE 2: MQULIMA SOKO (Commodity exchange board)
                    ══════════════════════════════════════════ */}
                {subpage === "soko" && (
                  <div className="space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold font-['Lora'] text-[#1A3A1A]">
                          🌾 Mqulima Soko (Trade Exchange)
                        </h2>
                        <p className="text-xs text-[#5D6B5C] mt-1 font-semibold">
                          Farmers put up crop and livestock commodities for sale. View the agricultural indices below.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsListingSoko(!isListingSoko)}
                        className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Tag className="h-4 w-4" />
                        <span>List Commodity</span>
                      </button>
                    </div>

                    {/* Ticker / Price Billboard */}
                    <div className="bg-[#FAF9F5] border border-[#D4DDD0] rounded-xl p-4 text-left">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#1A5438] block mb-2">
                        📊 Live Market Billboards (KES Exchange Index)
                      </span>
                      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                        {[
                          { crop: "🌽 Dry Maize (90kg)", price: "KES 3,200", change: "+2.5%" },
                          { crop: "🥛 Raw Milk (Litre)", price: "KES 55", change: "0.0%" },
                          { crop: "🫘 Beans (90kg bag)", price: "KES 8,500", change: "-1.1%" },
                          { crop: "🥔 Irish Potato (bag)", price: "KES 3,200", change: "+4.2%" }
                        ].map((bill, i) => (
                          <div key={i} className="bg-white border border-[#D4DDD0] rounded-lg p-2.5 shadow-xs">
                            <span className="text-[10px] text-gray-500 font-bold block">{bill.crop}</span>
                            <strong className="text-xs text-[#1A3A1A] block mt-0.5">{bill.price}</strong>
                            <span className="text-[9px] text-[#1A5438] font-bold block">{bill.change}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Soko Item submission */}
                    {isListingSoko && (
                      <form onSubmit={handleCreateSokoListing} className="bg-[#FAF9F5] border border-[#D4DDD0] rounded-xl p-5 space-y-4">
                        <h3 className="text-xs font-black text-[#1A3A1A] uppercase tracking-wider">List Commodity for Sale</h3>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Commodity / Crop Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Dry Maize, Fresh Spinach"
                              value={sokoCommodity}
                              onChange={(e) => setSokoCommodity(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Target Price (KES)</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. KSh 3,200 per 90kg bag"
                              value={sokoPrice}
                              onChange={(e) => setSokoPrice(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438]"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Available Volume</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 50 Bags"
                              value={sokoQty}
                              onChange={(e) => setSokoQty(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Location</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Eldoret, Kenya"
                              value={sokoLoc}
                              onChange={(e) => setSokoLoc(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Photo URL (Optional)</label>
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/photo-..."
                              value={sokoImg}
                              onChange={(e) => setSokoImg(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Description & Quality specs</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Specify moisture contents, sorting details, fertilizer type used..."
                            value={sokoDesc}
                            onChange={(e) => setSokoDesc(e.target.value)}
                            className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3.5 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438] resize-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setIsListingSoko(false)}
                            className="border border-[#D4DDD0] px-4 py-2 rounded-lg text-xs font-bold text-[#5D6B5C] hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2 rounded-lg text-xs font-bold"
                          >
                            Post Sale
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Listings feed */}
                    <div className="space-y-4">
                      {sokoListings.map((listing) => (
                        <div 
                          key={listing.id} 
                          className="bg-white border border-[#D4DDD0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row gap-5 hover:border-[#1A5438] transition"
                        >
                          <div className="h-32 w-full md:w-44 rounded-lg overflow-hidden bg-emerald-50 shrink-0 border border-[#D4DDD0]">
                            <img
                              src={listing.image}
                              alt={listing.commodity}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between text-left">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-[#1A5438] font-bold flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" /> {listing.location}
                                </span>
                                <span className="text-[9px] text-[#5D6B5C] font-semibold">{listing.createdAt}</span>
                              </div>
                              <h3 className="text-base font-extrabold font-['Lora'] text-[#1A3A1A] mt-1.5">
                                {listing.commodity}
                              </h3>
                              <p className="text-xs text-[#5D6B5C] mt-2 font-semibold">
                                {listing.description}
                              </p>
                              <div className="flex gap-4 mt-3 text-xs">
                                <div>
                                  <span className="text-gray-400 font-bold block text-[9px] uppercase">Price</span>
                                  <strong className="text-[#1A5438]">{listing.price}</strong>
                                </div>
                                <div>
                                  <span className="text-gray-400 font-bold block text-[9px] uppercase">Available Volume</span>
                                  <strong className="text-[#1A3A1A]">{listing.quantity}</strong>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-between gap-3">
                              <span className="text-[10px] text-gray-400 font-semibold">
                                Seller: <strong className="text-gray-600">{listing.author.username}</strong>
                              </span>
                              <button
                                onClick={() => {
                                  // Open Konnekt with this farmer
                                  const idx = farmers.findIndex(f => f.username === listing.author.username);
                                  if (idx !== -1) {
                                    // Check if chat session exists
                                    const chatIdx = chats.findIndex(c => c.farmer.username === listing.author.username);
                                    if (chatIdx !== -1) {
                                      setActiveChatIndex(chatIdx);
                                    } else {
                                      const newSession: ChatSession = {
                                        farmer: farmers[idx],
                                        log: [{ sender: listing.author.username, text: `Hello! I saw your interest in my ${listing.commodity}. How many bags do you need?`, timestamp: "Just now" }]
                                      };
                                      setChats([newSession, ...chats]);
                                      setActiveChatIndex(0);
                                    }
                                    setSubpage("konnekt");
                                    toast.success(`Chat opened with ${listing.author.name}`);
                                  } else {
                                    toast.error("Seller profile not found.");
                                  }
                                }}
                                className="bg-[#FAF9F5] border border-[#1A5438] hover:bg-[#1A5438] hover:text-white text-[#1A5438] px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                Contact Seller via Konnekt
                              </button>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* ══════════════════════════════════════════
                    SUBPAGE 3: MQULIMA PULSE (Market news bulletin)
                    ══════════════════════════════════════════ */}
                {subpage === "pulse" && (
                  <div className="space-y-6">
                    
                    {/* Header */}
                    <div className="border-b border-gray-100 pb-5">
                      <h2 className="text-xl sm:text-2xl font-bold font-['Lora'] text-[#1A3A1A]">
                        📈 Mqulima Pulse
                      </h2>
                      <p className="text-xs text-[#5D6B5C] mt-1 font-semibold">
                        Agronomic index updates, weather warnings, and direct trading updates county by county.
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                      {pulseUpdates.map((pulse) => (
                        <div key={pulse.id} className="bg-white border border-[#D4DDD0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] bg-teal-50 text-teal-800 border border-teal-100 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                              {pulse.category}
                            </span>
                            <h3 className="text-sm font-extrabold font-['Lora'] text-[#1A3A1A] mt-3 leading-snug">
                              {pulse.title}
                            </h3>
                            <p className="text-[11px] text-[#5D6B5C] mt-2 leading-relaxed font-semibold">
                              {pulse.content}
                            </p>
                          </div>
                          <span className="text-[10px] text-gray-400 font-semibold block mt-4 border-t border-gray-50 pt-2.5">
                            {pulse.date}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Agronomy PDF bulletin mockup */}
                    <div className="bg-[#1A5438] rounded-xl p-6 text-white text-left flex flex-col md:flex-row justify-between items-center gap-5">
                      <div>
                        <span className="text-[#F5A623] text-[9px] font-black uppercase tracking-wider">Agronomist Dispatch</span>
                        <h3 className="text-base font-bold font-['Lora'] mt-1 text-white">Download June Soil & Fertilizer Bulletins</h3>
                        <p className="text-xs text-white/80 mt-1 leading-relaxed max-w-lg font-semibold">
                          Comprehensive cooperative guide on chemical NPK vs Organic compost blends compiled by our expert agronomists.
                        </p>
                      </div>
                      <button
                        onClick={() => toast.success("Downloading PDF Soil Bulletin (5.2 MB)...")}
                        className="bg-[#F5A623] hover:bg-white hover:text-[#1A5438] text-white font-bold text-xs px-5 py-3 rounded-lg flex items-center gap-2 transition shrink-0"
                      >
                        <Download className="h-4 w-4" /> Download Bulletin PDF
                      </button>
                    </div>

                  </div>
                )}

                {/* ══════════════════════════════════════════
                    SUBPAGE 4: MQULIMA KONNEKT (In-app Messenger)
                    ══════════════════════════════════════════ */}
                {subpage === "konnekt" && (
                  <div className="space-y-6">
                    
                    {/* Header */}
                    <div className="border-b border-gray-100 pb-5">
                      <h2 className="text-xl sm:text-2xl font-bold font-['Lora'] text-[#1A3A1A]">
                        💬 Mqulima Konnekt
                      </h2>
                      <p className="text-xs text-[#5D6B5C] mt-1 font-semibold">
                        Real-time encrypted messaging channel between registered agronomists and cooperative growers.
                      </p>
                    </div>

                    {/* Chat grid */}
                    <div className="grid md:grid-cols-12 border border-[#D4DDD0] rounded-xl overflow-hidden bg-white min-h-[460px]">
                      
                      {/* Left Chat contacts (4 Columns) */}
                      <div className="md:col-span-4 bg-[#F3F5F2] border-r border-[#D4DDD0] p-4 text-left space-y-3">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Active Conversations</span>
                        <div className="space-y-1">
                          {chats.map((session, idx) => (
                            <button
                              key={session.farmer.username}
                              onClick={() => setActiveChatIndex(idx)}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition text-left cursor-pointer ${
                                activeChatIndex === idx 
                                  ? "bg-white border border-[#D4DDD0] shadow-xs" 
                                  : "hover:bg-[#EAECE8]"
                              }`}
                            >
                              <div className="h-7 w-7 rounded-full bg-[#1A5438]/10 text-[#1A5438] font-bold text-[10px] flex items-center justify-center shrink-0">
                                {session.farmer.avatar}
                              </div>
                              <div className="min-w-0">
                                <strong className="text-xs text-[#1A3A1A] block truncate">{session.farmer.name}</strong>
                                <span className="text-[9px] text-[#5D6B5C] block truncate font-semibold">{session.farmer.username}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right Active chat window (8 Columns) */}
                      <div className="md:col-span-8 flex flex-col justify-between min-h-[380px]">
                        {/* Selected Contact Header */}
                        <div className="p-4 border-b border-gray-150 bg-[#FAF9F5] flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-[#1A5438]/15 text-[#1A5438] font-black text-xs flex items-center justify-center">
                            {chats[activeChatIndex].farmer.avatar}
                          </div>
                          <div>
                            <strong className="text-xs text-[#1A3A1A] block">{chats[activeChatIndex].farmer.name}</strong>
                            <span className="text-[9px] text-[#5D6B5C] font-extrabold block">{chats[activeChatIndex].farmer.username}</span>
                          </div>
                        </div>

                        {/* Message Log */}
                        <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[300px] bg-slate-50/50">
                          {chats[activeChatIndex].log.map((msg, i) => {
                            const isMe = msg.sender === (currentUser ? currentUser.username : "@mqulima_guest");
                            return (
                              <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs font-semibold ${
                                  isMe 
                                    ? "bg-[#1A5438] text-white rounded-tr-none" 
                                    : "bg-white border border-[#D4DDD0] text-[#2C332A] rounded-tl-none"
                                }`}>
                                  <p>{msg.text}</p>
                                </div>
                                <span className="text-[8px] text-gray-400 font-bold block mt-1 px-1">
                                  {msg.sender} • {msg.timestamp}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Message Input form */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-[#FAF9F5] border-t border-gray-150 flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder={`Message ${chats[activeChatIndex].farmer.name.split(" ")[0]}...`}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="flex-1 bg-white border border-[#D4DDD0] rounded-xl px-4 py-2 text-xs text-[#1A3A1A] outline-none focus:border-[#1A5438]"
                          />
                          <button
                            type="submit"
                            className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                          >
                            <span>Send</span>
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </form>

                      </div>

                    </div>

                  </div>
                )}

                {/* ══════════════════════════════════════════
                    SUBPAGE 5: MQULIMA PROFILE (Farmer Profile card)
                    ══════════════════════════════════════════ */}
                {subpage === "profile" && (
                  <div className="space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold font-['Lora'] text-[#1A3A1A]">
                          👤 Mqulima Profile Panel
                        </h2>
                        <p className="text-xs text-[#5D6B5C] mt-1 font-semibold">
                          View details, verified certificates, and update your decentralized agricultural ID.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsRegisteringProfile(!isRegisteringProfile)}
                        className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Edit Profile Details</span>
                      </button>
                    </div>

                    {/* Registration edit form */}
                    {isRegisteringProfile && (
                      <form onSubmit={handleRegisterProfile} className="bg-[#FAF9F5] border border-[#D4DDD0] rounded-xl p-5 space-y-4">
                        <h3 className="text-xs font-black text-[#1A3A1A] uppercase tracking-wider border-b border-gray-150 pb-2">
                          Edit Farmer Profile Form
                        </h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. John Kiprono"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Desired Username (Must start with mqulima)</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. mqulima_john"
                              value={regUsername}
                              onChange={(e) => setRegUsername(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Region / County</label>
                            <select
                              value={regCounty}
                              onChange={(e) => setRegCounty(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none cursor-pointer font-bold"
                            >
                              <option value="Uasin Gishu">Uasin Gishu</option>
                              <option value="Nyandarua">Nyandarua</option>
                              <option value="Kericho">Kericho</option>
                              <option value="Machakos">Machakos</option>
                              <option value="Nakuru">Nakuru</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Crops Grown (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Maize, Potatoes"
                              value={regCrops}
                              onChange={(e) => setRegCrops(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Livestock (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="e.g. Dairy Cows, Poultry"
                              value={regLivestock}
                              onChange={(e) => setRegLivestock(e.target.value)}
                              className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 w-full sm:max-w-xs">
                          <label className="text-[10px] font-black text-[#5D6B5C] uppercase">Years Farming</label>
                          <input
                            type="number"
                            min="1"
                            value={regYears}
                            onChange={(e) => setRegYears(e.target.value)}
                            className="w-full bg-white border border-[#D4DDD0] rounded-lg px-3 py-2 text-xs text-[#1A3A1A] outline-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-3">
                          <button
                            type="button"
                            onClick={() => setIsRegisteringProfile(false)}
                            className="border border-[#D4DDD0] px-4 py-2 rounded-lg text-xs font-bold text-[#5D6B5C] hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2 rounded-lg text-xs font-bold"
                          >
                            Save Profile
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Active Profile details card layout */}
                    {currentUser && (
                      <div className="bg-white border border-[#D4DDD0] rounded-xl overflow-hidden shadow-xs">
                        
                        {/* Banner backing */}
                        <div className="h-28 bg-gradient-to-r from-[#1A5438] to-[#103D27] p-5 flex items-end justify-between">
                          <span className="text-[9px] font-black tracking-widest text-[#F5A623] uppercase">
                            Mqulima Ecosystem Member Card
                          </span>
                          <span className="text-white/60 text-[9px] font-bold">ID: {currentUser.username}</span>
                        </div>

                        {/* Details grid */}
                        <div className="p-6 sm:p-8 space-y-6">
                          
                          {/* Avatar row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 rounded-full bg-emerald-100 text-[#1A5438] border-[3px] border-[#FAF9F5] -mt-12 shadow-sm font-black text-lg flex items-center justify-center">
                                {currentUser.avatar}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold font-['Lora'] text-[#1A3A1A]">{currentUser.name}</h3>
                                <span className="text-xs text-[#5D6B5C] font-semibold">{currentUser.username}</span>
                              </div>
                            </div>

                            <div className="flex gap-4 text-xs font-semibold text-gray-500">
                              <div className="text-center">
                                <span className="block text-[10px] text-gray-400 font-bold uppercase">Reputation</span>
                                <strong className="text-[#1A5438] text-sm">{currentUser.reputationScore} pts</strong>
                              </div>
                              <div className="text-center">
                                <span className="block text-[10px] text-gray-400 font-bold uppercase">Followers</span>
                                <strong className="text-[#1A3A1A] text-sm">{currentUser.followers}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Profile Fields List */}
                          <div className="grid gap-6 sm:grid-cols-2 text-xs text-left">
                            
                            <div className="space-y-4">
                              <div>
                                <span className="text-gray-400 font-bold block text-[9px] uppercase">Country</span>
                                <span className="font-semibold text-[#1A3A1A]">{currentUser.country}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 font-bold block text-[9px] uppercase">County/Region</span>
                                <span className="font-semibold text-[#1A3A1A]">{currentUser.county}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 font-bold block text-[9px] uppercase">Years Farming</span>
                                <span className="font-semibold text-[#1A3A1A]">{currentUser.yearsFarming} Years</span>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <span className="text-gray-400 font-bold block text-[9px] uppercase">Crops Interests</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {currentUser.interests.crops.map((c, i) => (
                                    <span key={i} className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400 font-bold block text-[9px] uppercase">Livestock Interests</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {currentUser.interests.livestock.map((l, i) => (
                                    <span key={i} className="bg-blue-50 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100">
                                      {l}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400 font-bold block text-[9px] uppercase">Earned Certifications</span>
                                <div className="space-y-1 mt-1">
                                  {currentUser.certifications.map((cert, i) => (
                                    <span key={i} className="text-[#1A5438] text-[10px] font-bold block">
                                      ✓ {cert}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      </div>
    </AppLayout>
  );
}
