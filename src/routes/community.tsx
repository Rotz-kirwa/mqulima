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
  Plus,
  Video,
  X,
  Menu,
  ChevronDown,
  BookOpen,
  Calendar,
  DollarSign,
  User,
  Sparkle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getForumSnapshot } from "@/lib/api/community.server";
import { AppLayout } from "@/components/mqulima/AppLayout";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Mqulima Forum — Premium Farmer Social Community" },
      {
        name: "description",
        content: "A beautiful, premium social community built specifically for farmers. Share moments at Mqulima Show, trade on Mqulima Soko, get updates on Mqulima Pulse, and message via Mqulima Konnekt.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
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
  reputationScore: number;
  followersCount: number;
  followers: string[];
  avatarUrl: string;
  coverImage: string;
};

type CommunityPost = {
  id: string;
  author: FarmerProfile;
  title: string;
  body: string;
  category: "Farm Progress" | "Harvest Update" | "Farming Tips" | "Question" | "Success Story" | "General";
  images: string[];
  videoUrl?: string;
  likes: number;
  hasLiked?: boolean;
  hasSaved?: boolean;
  comments: { authorName: string; text: string; time: string }[];
  cropsTagged: string[];
  livestockTagged: string[];
  location: string;
  createdAt: string;
};

type SokoListing = {
  id: string;
  author: FarmerProfile;
  commodity: string;
  type: "crop" | "livestock";
  price: number;
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
    interests: ["Conservation Agriculture", "Smart Irrigation", "Soil Testing"],
    crops: ["Maize", "Wheat", "Canola"],
    livestock: ["Friesian Cows", "Poultry"],
    yearsFarming: 16,
    certifications: ["Certified Agronomist (KEPHIS)", "Organic Fertilizer Expert"],
    reputationScore: 4200,
    followersCount: 384,
    followers: ["@mqulima_wanjiku", "@mqulima_kiprono", "@mqulima_mutiso", "@mqulima_nduku"],
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    coverImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
  },
  {
    username: "@mqulima_wanjiku",
    name: "Mary Wanjiku",
    country: "Kenya",
    county: "Nyandarua",
    interests: ["Soil Diagnostics", "Cooperative Marketing", "Organic Farming"],
    crops: ["Shangi Potatoes", "Cabbages", "Snow Peas"],
    livestock: ["Dairy Goats", "Dorper Sheep"],
    yearsFarming: 8,
    certifications: ["Potato Multiplication Certificate (ADC)", "Horticultural Exporter"],
    reputationScore: 2150,
    followersCount: 245,
    followers: ["@mqulima_samuel", "@mqulima_mutiso", "@mqulima_mwangi"],
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    coverImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"
  },
  {
    username: "@mqulima_kiprono",
    name: "David Kiprono",
    country: "Kenya",
    county: "Kericho",
    interests: ["Export Certification", "Water Harvesting", "Tea Processing"],
    crops: ["Purple Tea", "Hass Avocados"],
    livestock: ["Dairy Goats"],
    yearsFarming: 5,
    certifications: ["Smart Water Management (KALRO)"],
    reputationScore: 980,
    followersCount: 112,
    followers: ["@mqulima_samuel", "@mqulima_nduku"],
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    coverImage: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800"
  },
  {
    username: "@mqulima_mutiso",
    name: "Grace Mutiso",
    country: "Kenya",
    county: "Machakos",
    interests: ["Phytosanitary Safety", "Apiculture", "Dryland Farming"],
    crops: ["Apple Mangoes", "Avocados", "French Beans"],
    livestock: ["Beekeeping"],
    yearsFarming: 12,
    certifications: ["EU Phytosanitary Inspector Cert", "Apiculture Specialist"],
    reputationScore: 3120,
    followersCount: 198,
    followers: ["@mqulima_wanjiku", "@mqulima_kiprono"],
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    coverImage: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800"
  },
  {
    username: "@mqulima_nduku",
    name: "Catherine Nduku",
    country: "Kenya",
    county: "Machakos",
    interests: ["Drip Irrigation", "Greenhouse Tomatoes", "Seed Selection"],
    crops: ["Tomatoes", "Capsicum", "Onions"],
    livestock: ["Poultry (Kienyeji)"],
    yearsFarming: 7,
    certifications: ["Greenhouse Crop Production Specialist"],
    reputationScore: 1840,
    followersCount: 156,
    followers: ["@mqulima_samuel", "@mqulima_mutiso"],
    avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150",
    coverImage: "https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?w=800"
  },
  {
    username: "@mqulima_mwangi",
    name: "Benson Mwangi",
    country: "Kenya",
    county: "Nyandarua",
    interests: ["Organic Composting", "Horticulture", "Biopesticides"],
    crops: ["Onions", "Garlic", "Spinach"],
    livestock: ["None"],
    yearsFarming: 10,
    certifications: ["Permaculture Design Certificate"],
    reputationScore: 2500,
    followersCount: 189,
    followers: ["@mqulima_wanjiku", "@mqulima_samuel"],
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    coverImage: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800"
  }
];

const initialCommunityPosts: CommunityPost[] = [
  {
    id: "p1",
    author: initialFarmers[1], // Mary Wanjiku
    title: "Shangi Potato Tuber Harvest — 45 bags from 0.5 Acres!",
    body: "Absolutely thrilled with this season's Shangi potato yields! We followed the nitrogen top-dressing advisory precisely and synced irrigation schedules with the soil moisture monitor. The skin quality is pristine, and they are sorted, bagged, and ready for transit to Nairobi markets.",
    category: "Harvest Update",
    images: [
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800",
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800"
    ],
    likes: 54,
    hasLiked: true,
    hasSaved: false,
    comments: [
      { authorName: "@mqulima_samuel", text: "Stellar yields Mary! Did you apply potassium top-dressing near bloom?", time: "2h ago" },
      { authorName: "@mqulima_kiprono", text: "Amazing results! Shangi variety is truly responsive under smart irrigation.", time: "1h ago" }
    ],
    cropsTagged: ["Shangi Potatoes"],
    livestockTagged: [],
    location: "Ol Kalou, Nyandarua County",
    createdAt: "3 hours ago"
  },
  {
    id: "p2",
    author: initialFarmers[3], // Grace Mutiso
    title: "Urgent Advice Needed: Fruit Fly stings on young mango orchards",
    body: "Woke up to find active fruit fly stings in my young mango orchards. Seeking organic pheromone bait advice or companion planting techniques to arrest this. I need to handle this quickly before they puncture the late-blooming fruits.",
    category: "Question",
    images: ["https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=800"],
    likes: 22,
    hasLiked: false,
    hasSaved: true,
    comments: [
      { authorName: "@mqulima_samuel", text: "Grace, hang Biolure pheromone traps 1.5 meters high immediately. Keep weeding the orchard floor to kill pupae.", time: "4h ago" },
      { authorName: "@mqulima_mwangi", text: "Applying neem oil extracts early in the morning also repels them quite effectively.", time: "3h ago" }
    ],
    cropsTagged: ["Mangoes"],
    livestockTagged: [],
    location: "Masii, Machakos County",
    createdAt: "5 hours ago"
  },
  {
    id: "p3",
    author: initialFarmers[0], // Samuel Kirwa
    title: "Smart Irrigation Pipeline Installation Complete",
    body: "Installed our new solar-powered drip irrigation system across the main wheat and canola grids today. Soil moisture sensors are calibrated to trigger water release only when moisture drops below 40%. Ready to conserve water and maximize yields!",
    category: "Farm Progress",
    images: [
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800",
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
    ],
    likes: 98,
    hasLiked: false,
    hasSaved: false,
    comments: [
      { authorName: "@mqulima_nduku", text: "This is pure tech inspiration, Samuel! What was the solar pump rating?", time: "1d ago" }
    ],
    cropsTagged: ["Canola", "Wheat"],
    livestockTagged: [],
    location: "Moiben, Uasin Gishu County",
    createdAt: "1 day ago"
  },
  {
    id: "p4",
    author: initialFarmers[4], // Catherine Nduku
    title: "Tip: Overcoming Blossom End Rot in Greenhouse Tomatoes",
    body: "For anyone experiencing blossom end rot in tomatoes, check your soil calcium levels and water consistency. Fluctuations in moisture disrupt calcium uptake. Mulching has helped us maintain steady humidity. Hope this helps!",
    category: "Farming Tips",
    images: ["https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=800"],
    likes: 41,
    hasLiked: false,
    hasSaved: false,
    comments: [],
    cropsTagged: ["Tomatoes"],
    livestockTagged: [],
    location: "Mwala, Machakos County",
    createdAt: "2 days ago"
  },
  {
    id: "p5",
    author: initialFarmers[2], // David Kiprono
    title: "First Batch of Purple Tea Exported to European Market!",
    body: "A dream come true. Our cooperative just shipped the first batch of organically processed purple tea leaves to our European distributor. Thanks to the Mqulima community for the phyto-certification guidelines and cooperative support!",
    category: "Success Story",
    images: ["https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=800"],
    likes: 125,
    hasLiked: false,
    hasSaved: true,
    comments: [
      { authorName: "@mqulima_wanjiku", text: "Congratulations David! An amazing milestone for the Kericho cooperative.", time: "2d ago" },
      { authorName: "@mqulima_samuel", text: "Outstanding achievement. This sets the standard for smallholder exports.", time: "2d ago" }
    ],
    cropsTagged: ["Purple Tea"],
    livestockTagged: [],
    location: "Kapsoit, Kericho County",
    createdAt: "3 days ago"
  }
];

const initialSokoListings: SokoListing[] = [
  {
    id: "t1",
    author: initialFarmers[1], // Mary Wanjiku
    commodity: "Irish Potatoes (Shangi)",
    type: "crop",
    price: 3200,
    quantity: "35 Bags (90kg)",
    location: "Ol Kalou, Nyandarua",
    images: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500"],
    description: "Grade 1 Shangi potatoes. Freshly harvested, clean skin, sorted by sizes. Delivery can be arranged to Nairobi or Nakuru.",
    status: "available",
    createdAt: "2 hours ago"
  },
  {
    id: "t2",
    author: initialFarmers[2], // David Kiprono
    commodity: "Organic Avocado (Fuerte)",
    type: "crop",
    price: 6500,
    quantity: "100 Kgs",
    location: "Kericho town",
    images: ["https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500"],
    description: "Export quality Fuerte avocados. Hand-picked, natural ripening, pesticide-free certification ready.",
    status: "available",
    createdAt: "4 hours ago"
  },
  {
    id: "t3",
    author: initialFarmers[0], // Dr. Samuel Kirwa
    commodity: "Certified Friesian Bull Calves",
    type: "livestock",
    price: 18000,
    quantity: "2 Calves",
    location: "Moiben, Eldoret",
    images: ["https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=500"],
    description: "Purebred Friesian calves from high-yielding dams (30L+/day average). Veterinary records and breed lineage certifications included.",
    status: "available",
    createdAt: "1 day ago"
  }
];

const initialPulsePosts: PulsePost[] = [
  { 
    id: "p1", 
    title: "El Niño Rains Predicted to Decline by Mid-July", 
    content: "The Meteorological Department has released farm alerts advising North Rift grain farmers to plan dry-shelling facilities and secure grain storage ahead of harvest seasons to prevent post-harvest moisture surges.", 
    category: "Weather Alert", 
    source: "Kenya Meteorological Department Bulletin June 2026", 
    date: "June 26, 2026" 
  },
  { 
    id: "p2", 
    title: "National Fertilizer Subsidy Phase-3 Rollout Starts", 
    content: "Farmers registered on the national digital voucher system can collect subsidized fertilizer bags at NCPB depots in Nakuru, Eldoret, and Narok for KSh 2,500 per bag. Ensure you have your verified SMS token code ready.", 
    category: "Policy Update", 
    source: "Ministry of Agriculture Digital Ledger System", 
    date: "June 24, 2026" 
  },
  { 
    id: "p3", 
    title: "Export Duty Dropped on Certified Horticulture to EU Markets", 
    content: "The Kenya-EU Economic Partnership Agreement takes immediate action, removing tariff barriers for smallholders supplying French Beans, snow peas, and organic avocados. Certifications can be obtained via Kephis desks.", 
    category: "Market Trend", 
    source: "EU-East Africa Trade Agreement Documentation", 
    date: "June 20, 2026" 
  }
];

function ForumSubdomainPage() {
  const [subpage, setSubpage] = useState<"home" | "show" | "soko" | "pulse" | "konnekt" | "saved" | "profile">("home");

  // Database States
  const [farmers, setFarmers] = useState<FarmerProfile[]>(initialFarmers);
  const [posts, setPosts] = useState<CommunityPost[]>(initialCommunityPosts);
  const [sokoListings, setSokoListings] = useState<SokoListing[]>(initialSokoListings);
  const [pulsePosts, setPulsePosts] = useState<PulsePost[]>(initialPulsePosts);
  const [communityDataSource, setCommunityDataSource] = useState<"loading" | "database" | "curated">("loading");

  // Active viewing profile username
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string | null>(null);
  
  // Custom dropdown / panels states
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  // Registration Profile State
  const [currentUser, setCurrentUser] = useState<FarmerProfile | null>(null);
  const [isRegisteringProfile, setIsRegisteringProfile] = useState(false);
  
  // Search state for Feed/Soko
  const [globalSearch, setGlobalSearch] = useState("");
  
  // Active inline profile detail tracker on posts
  const [expandedProfilePostId, setExpandedProfilePostId] = useState<string | null>(null);
  
  // Active comments viewer tracker on posts
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");

  // Edit / Register Profile Form States
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regCounty, setRegCounty] = useState("Uasin Gishu");
  const [regCrops, setRegCrops] = useState("");
  const [regLivestock, setRegLivestock] = useState("");
  const [regInterests, setRegInterests] = useState("");
  const [regYears, setRegYears] = useState("5");

  // Post Creation States
  const [createBody, setCreateBody] = useState("");
  const [createCategory, setCreateCategory] = useState<"Farm Progress" | "Harvest Update" | "Farming Tips" | "Question" | "Success Story">("Farm Progress");
  const [createImagesText, setCreateImagesText] = useState("");
  const [createVideoUrl, setCreateVideoUrl] = useState("");
  const [createLocation, setCreateLocation] = useState("Eldoret, Uasin Gishu");
  const [createCrops, setCreateCrops] = useState("");
  const [createLivestock, setCreateLivestock] = useState("");
  const [showMediaFields, setShowMediaFields] = useState(false);
  const [showTagFields, setShowTagFields] = useState(false);

  // Soko Listing States
  const [isListingSoko, setIsListingSoko] = useState(false);
  const [sokoCommodity, setSokoCommodity] = useState("");
  const [sokoType, setSokoType] = useState<"crop" | "livestock">("crop");
  const [sokoPrice, setSokoPrice] = useState("");
  const [sokoQty, setSokoQty] = useState("");
  const [sokoLoc, setSokoLoc] = useState("");
  const [sokoDesc, setSokoDesc] = useState("");
  const [sokoImgText, setSokoImgText] = useState("");

  // Soko Filters
  const [sokoSearch, setSokoSearch] = useState("");
  const [sokoTypeFilter, setSokoTypeFilter] = useState<"all" | "crop" | "livestock">("all");
  const [sokoCountyFilter, setSokoCountyFilter] = useState("all");
  const [sokoMaxPrice, setSokoMaxPrice] = useState<number>(20000);

  // Pulse Post creator
  const [isPostingPulse, setIsPostingPulse] = useState(false);
  const [pulseTitle, setPulseTitle] = useState("");
  const [pulseContent, setPulseContent] = useState("");
  const [pulseCategory, setPulseCategory] = useState<"Market Trend" | "Weather Alert" | "Policy Update" | "Agronomy Alert">("Market Trend");
  const [pulseSource, setPulseSource] = useState("");

  // Notifications List
  const [notifications, setNotifications] = useState([
    { id: "n1", text: "Mary Wanjiku (@mqulima_wanjiku) liked your potato harvest post.", time: "10 mins ago", read: false },
    { id: "n2", text: "Dr. Samuel Kirwa (@mqulima_samuel) posted a new Soil Irrigation Tip.", time: "2 hours ago", read: false },
    { id: "n3", text: "David Kiprono (@mqulima_kiprono) updated their purple tea commodity listing.", time: "1 day ago", read: true }
  ]);

  // Konnekt messaging states
  const [activeChatId, setActiveChatId] = useState("g1");
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<ChatSession[]>([
    {
      id: "g1",
      name: "Rift Valley Grain Co-operative (Group)",
      isGroup: true,
      log: [
        { id: "m1", sender: "@mqulima_samuel", text: "Welcome to the Rift Valley Grain Channel. NCPB fertilizer bags have landed in Eldoret depots. Sync your digital vouchers.", timestamp: "08:15 AM", read: true },
        { id: "m2", sender: "@mqulima_wanjiku", text: "Thank you for the update Samuel. What is the queues like today?", timestamp: "08:45 AM", read: true },
        { id: "m3", sender: "@mqulima_samuel", text: "Moving quickly. About 15 minutes processing time if details match.", timestamp: "09:00 AM", read: true }
      ]
    },
    {
      id: "d1",
      name: "Dr. Samuel Kirwa (DM)",
      isGroup: false,
      farmer: initialFarmers[0],
      log: [
        { id: "m4", sender: "@mqulima_samuel", text: "Hello! If you need soil diagnostic tips for your Machakos plot, let me know.", timestamp: "Yesterday", read: true }
      ]
    },
    {
      id: "d2",
      name: "Mary Wanjiku (DM)",
      isGroup: false,
      farmer: initialFarmers[1],
      log: [
        { id: "m5", sender: "@mqulima_wanjiku", text: "Hi Mary, I saw your potato harvest. Let me know if you would like to pool transit resources to Nairobi next week.", timestamp: "Yesterday", read: true }
      ]
    }
  ]);

  // Offline / Network Simulator States
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<{ chatId: string; text: string; timestamp: string }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRLSDashboard, setShowRLSDashboard] = useState(false);

  // Simulated live commodity price billboard
  const [billboardPrices, setBillboardPrices] = useState([
    { crop: "Dry Maize (90kg)", region: "Eldoret", price: 3200, prevPrice: 3180 },
    { crop: "Dry Maize (90kg)", region: "Nairobi", price: 3600, prevPrice: 3620 },
    { crop: "Shangi Potatoes (50kg)", region: "Nyandarua", price: 2800, prevPrice: 2750 },
    { crop: "Raw Milk (Litre)", region: "Nakuru", price: 55, prevPrice: 55 },
    { crop: "Avocados (Kg)", region: "Meru", price: 65, prevPrice: 62 },
  ]);

  // Handle Commodity Price Ticker Fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setBillboardPrices(prev => prev.map(p => {
        const change = (Math.random() - 0.5) * 40;
        const nextPrice = Math.max(10, Math.round(p.price + change));
        return {
          ...p,
          prevPrice: p.price,
          price: nextPrice
        };
      }));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Sync DB snapshot if available
  useEffect(() => {
    let cancelled = false;
    getForumSnapshot()
      .then((snapshot) => {
        if (cancelled) return;
        const hasDBContent = snapshot.showPosts.length > 0 || snapshot.sokoListings.length > 0 || snapshot.pulsePosts.length > 0;
        
        // Map database posts to CommunityPost interface if they exist
        if (snapshot.showPosts.length > 0) {
          const mappedPosts: CommunityPost[] = (snapshot.showPosts as any[]).map(sp => {
            const authorRecord = initialFarmers.find(f => f.username === sp.author.username) || {
              ...initialFarmers[0],
              username: sp.author.username || "@mqulima_unknown",
              name: sp.author.name || "Unknown Farmer"
            };
            return {
              id: sp.id,
              author: authorRecord,
              title: sp.title || "Farm update",
              body: sp.body,
              category: (sp.category === "Tragedy" ? "Question" : sp.category === "Harvest" ? "Harvest Update" : "Farm Progress") as any,
              images: sp.images || [],
              likes: sp.likes || 0,
              hasLiked: sp.hasLiked,
              comments: sp.comments || [],
              cropsTagged: sp.tags || [],
              livestockTagged: [],
              location: "Kenya",
              createdAt: sp.createdAt || "Recently"
            };
          });
          setPosts(mappedPosts);
        }
        
        if (snapshot.sokoListings.length > 0) {
          const mappedSoko: SokoListing[] = (snapshot.sokoListings as any[]).map(sl => {
            const authorRecord = initialFarmers.find(f => f.username === sl.author.username) || {
              ...initialFarmers[0],
              username: sl.author.username || "@mqulima_unknown",
              name: sl.author.name || "Unknown Farmer"
            };
            return {
              ...sl,
              author: authorRecord
            };
          });
          setSokoListings(mappedSoko);
        }

        if (snapshot.pulsePosts.length > 0) {
          setPulsePosts(snapshot.pulsePosts as PulsePost[]);
        }
        setCommunityDataSource(hasDBContent ? "database" : "curated");
      })
      .catch(() => {
        if (!cancelled) setCommunityDataSource("curated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Offline message queue synchronization
  const triggerManualSync = () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    toast.loading("Synchronizing outbox payload to Supabase Realtime channel...");

    setTimeout(() => {
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
      toast.success("All offline payloads pushed and synchronized!");
    }, 1500);
  };

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      triggerManualSync();
    }
  }, [isOnline]);

  // Load / Setup Logged in User Profile
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_forum_profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Safely parse crops, livestock, and interests which could be arrays, strings, or missing
        parsed.crops = Array.isArray(parsed.crops)
          ? parsed.crops
          : (typeof parsed.crops === "string" ? parsed.crops.split(",").map((s: any) => String(s).trim()).filter(Boolean) : []);
        parsed.livestock = Array.isArray(parsed.livestock)
          ? parsed.livestock
          : (typeof parsed.livestock === "string" ? parsed.livestock.split(",").map((s: any) => String(s).trim()).filter(Boolean) : []);
        parsed.interests = Array.isArray(parsed.interests)
          ? parsed.interests
          : (typeof parsed.interests === "string" ? parsed.interests.split(",").map((s: any) => String(s).trim()).filter(Boolean) : []);
        parsed.certifications = Array.isArray(parsed.certifications) ? parsed.certifications : [];
        parsed.followers = Array.isArray(parsed.followers) ? parsed.followers : [];
        setCurrentUser(parsed);
      } else {
        const defaultGuest: FarmerProfile = {
          username: "@mqulima_guest",
          name: "Guest Farmer",
          country: "Kenya",
          county: "Nakuru",
          interests: ["Cooperative Ag", "Post-Harvest Care", "Beekeeping"],
          crops: ["Maize", "Dry Beans"],
          livestock: ["Dairy Cows"],
          yearsFarming: 3,
          certifications: ["Mqulima Portal Member"],
          reputationScore: 180,
          followersCount: 42,
          followers: ["@mqulima_samuel", "@mqulima_wanjiku"],
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          coverImage: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800"
        };
        setCurrentUser(defaultGuest);
        localStorage.setItem("mqulima_forum_profile", JSON.stringify(defaultGuest));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Update dynamic scores
  const activeFarmers = useMemo(() => {
    return farmers.map(farmer => {
      const pCount = posts.filter(p => p.author.username === farmer.username).length;
      const lCount = posts.filter(p => p.author.username === farmer.username).reduce((acc, curr) => acc + curr.likes, 0);
      const sCount = sokoListings.filter(s => s.author.username === farmer.username).length;
      const calculatedScore = (pCount * 20) + (lCount * 5) + (sCount * 35) + (farmer.certifications.length * 50);
      return {
        ...farmer,
        reputationScore: calculatedScore
      };
    });
  }, [farmers, posts, sokoListings]);

  // Active viewing farmer details
  const viewingFarmer = useMemo(() => {
    if (selectedProfileUsername) {
      return activeFarmers.find(f => f.username === selectedProfileUsername) || null;
    }
    return currentUser ? {
      ...currentUser,
      reputationScore: activeFarmers.find(f => f.username === currentUser.username)?.reputationScore || currentUser.reputationScore
    } : null;
  }, [selectedProfileUsername, currentUser, activeFarmers]);

  // Handle Edit/Register profile submission
  const handleRegisterProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim()) {
      toast.error("Please fill in both Name and Username.");
      return;
    }

    // Force @mqulima_ prefix
    let handle = regUsername.trim().toLowerCase();
    if (handle.startsWith("@")) handle = handle.slice(1);
    if (!handle.startsWith("mqulima_")) {
      handle = handle.startsWith("mqulima") ? "mqulima_" + handle.slice(7) : "mqulima_" + handle;
    }
    const finalUsername = "@" + handle;

    const updatedProfile: FarmerProfile = {
      username: finalUsername,
      name: regName.trim(),
      country: "Kenya",
      county: regCounty,
      interests: regInterests.split(",").map(i => i.trim()).filter(Boolean),
      crops: regCrops.split(",").map(c => c.trim()).filter(Boolean),
      livestock: regLivestock.split(",").map(l => l.trim()).filter(Boolean),
      yearsFarming: Number(regYears) || 1,
      certifications: currentUser?.certifications || ["Mqulima Verified Member"],
      reputationScore: currentUser?.reputationScore || 250,
      followersCount: currentUser?.followersCount || 10,
      followers: currentUser?.followers || ["@mqulima_samuel"],
      avatarUrl: currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      coverImage: currentUser?.coverImage || "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800"
    };

    setCurrentUser(updatedProfile);
    localStorage.setItem("mqulima_forum_profile", JSON.stringify(updatedProfile));
    
    // Add or update in general list
    setFarmers(prev => {
      const filtered = prev.filter(f => f.username !== updatedProfile.username);
      return [updatedProfile, ...filtered];
    });

    setIsRegisteringProfile(false);
    toast.success(`Profile set: ${updatedProfile.username}`);
  };

  // Pre-populate profile editing forms
  useEffect(() => {
    if (currentUser) {
      setRegName(currentUser.name || "");
      setRegUsername(currentUser.username || "");
      setRegCounty(currentUser.county || "");

      const cropsList = Array.isArray(currentUser.crops)
        ? currentUser.crops
        : (typeof currentUser.crops === "string" ? [currentUser.crops] : []);
      setRegCrops(cropsList.join(", "));

      const livestockList = Array.isArray(currentUser.livestock)
        ? currentUser.livestock
        : (typeof currentUser.livestock === "string" ? [currentUser.livestock] : []);
      setRegLivestock(livestockList.join(", "));

      const interestsList = Array.isArray(currentUser.interests)
        ? currentUser.interests
        : (typeof currentUser.interests === "string" ? [currentUser.interests] : []);
      setRegInterests(interestsList.join(", "));

      setRegYears(String(currentUser.yearsFarming || ""));
    }
  }, [currentUser]);

  // Create Post Handler
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBody.trim()) {
      toast.error("Please enter some text for your post.");
      return;
    }

    const imagesParsed = createImagesText.split(",").map(url => url.trim()).filter(Boolean);
    const cropTags = createCrops.split(",").map(c => c.trim()).filter(Boolean);
    const livestockTags = createLivestock.split(",").map(l => l.trim()).filter(Boolean);

    const newPost: CommunityPost = {
      id: `p_${Date.now()}`,
      author: currentUser || initialFarmers[0],
      title: createBody.slice(0, 50) + (createBody.length > 50 ? "..." : ""),
      body: createBody.trim(),
      category: createCategory,
      images: imagesParsed,
      videoUrl: createVideoUrl.trim() || undefined,
      likes: 0,
      hasLiked: false,
      hasSaved: false,
      comments: [],
      cropsTagged: cropTags,
      livestockTagged: livestockTags,
      location: createLocation.trim() || "Kenya",
      createdAt: "Just now"
    };

    setPosts([newPost, ...posts]);
    setCreateBody("");
    setCreateImagesText("");
    setCreateVideoUrl("");
    setCreateCrops("");
    setCreateLivestock("");
    setShowMediaFields(false);
    setShowTagFields(false);
    toast.success("Agricultural moment shared with the community!");
  };

  // Create Soko Listing Handler
  const handleCreateSokoListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sokoCommodity.trim() || !sokoPrice.trim() || !sokoQty.trim()) {
      toast.error("Please specify commodity details, pricing, and volume.");
      return;
    }

    const priceNum = parseFloat(sokoPrice.replace(/[^0-9]/g, "")) || 1000;
    const imagesParsed = sokoImgText.split(",").map(url => url.trim()).filter(Boolean);

    const newListing: SokoListing = {
      id: `t_${Date.now()}`,
      author: currentUser || initialFarmers[0],
      commodity: sokoCommodity.trim(),
      type: sokoType,
      price: priceNum,
      quantity: sokoQty.trim(),
      location: sokoLoc.trim() || "Unknown Location",
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
    toast.success("Commodity trade list published on Soko!");
  };

  // Create Pulse Post Handler
  const handleCreatePulsePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pulseTitle.trim() || !pulseContent.trim() || !pulseSource.trim()) {
      toast.error("Please specify title, report body, and verified source attribution.");
      return;
    }

    const newPulse: PulsePost = {
      id: `pl_${Date.now()}`,
      title: pulseTitle.trim(),
      content: pulseContent.trim(),
      category: pulseCategory,
      source: pulseSource.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    };

    setPulsePosts([newPulse, ...pulsePosts]);
    setIsPostingPulse(false);
    setPulseTitle("");
    setPulseContent("");
    setPulseSource("");
    toast.success("Pulse dispatch published with source verification!");
  };

  // Like Toggle Handler
  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.hasLiked;
        return {
          ...p,
          hasLiked: liked,
          likes: liked ? p.likes + 1 : p.likes - 1
        };
      }
      return p;
    }));
  };

  // Bookmark/Save Toggle Handler
  const handleSavePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const saved = !p.hasSaved;
        toast.success(saved ? "Post saved to bookmarks" : "Post removed from bookmarks");
        return {
          ...p,
          hasSaved: saved
        };
      }
      return p;
    }));
  };

  // Direct Message Sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const senderHandle = currentUser ? currentUser.username : "@mqulima_guest";
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (!isOnline) {
      setOfflineQueue(prev => [...prev, { chatId: activeChatId, text: chatInput.trim(), timestamp: timeStr }]);
      setChatInput("");
      toast.warning("Message queued locally. It will sync once internet is restored.");
      return;
    }

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: senderHandle,
      text: chatInput.trim(),
      timestamp: timeStr,
      read: true
    };

    setChats(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          log: [...c.log, newMsg]
        };
      }
      return c;
    }));

    setChatInput("");

    // Simulate response on direct messages
    const activeChat = chats.find(c => c.id === activeChatId);
    if (activeChat && !activeChat.isGroup) {
      setTimeout(() => {
        const reply: ChatMessage = {
          id: String(Date.now() + 1),
          sender: activeChat.farmer?.username || "@mqulima_samuel",
          text: `Acknowledge. Let's arrange coordinates and terms for transport/supplies on our cooperative list.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: true
        };
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              log: [...c.log, reply]
            };
          }
          return c;
        }));
      }, 1500);
    }
  };

  // Add Comment Handler
  const handleAddComment = (postId: string) => {
    if (!commentInput.trim()) return;
    const authorHandle = currentUser ? currentUser.username : "@mqulima_guest";
    
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, { authorName: authorHandle, text: commentInput.trim(), time: "Just now" }]
        };
      }
      return p;
    }));

    setCommentInput("");
  };

  // Follow Specialist Handler
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
          followersCount: isFollowing ? f.followersCount - 1 : f.followersCount + 1,
          followers: isFollowing 
            ? f.followers.filter(u => u !== currentUser?.username)
            : [...f.followers, currentUser?.username || ""]
        };
      }
      return f;
    }));
    toast.success("Follower state updated!");
  };

  // Filter posts based on search bar & subpage selection
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Subpage category filtering
    if (subpage === "show") {
      // Show focuses heavily on posts with images
      result = result.filter(p => p.images && p.images.length > 0);
    } else if (subpage === "saved") {
      result = result.filter(p => p.hasSaved);
    } else if (subpage === "profile") {
      result = result.filter(p => p.author.username === currentUser?.username);
    }

    // Global Search filters
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.body.toLowerCase().includes(q) || 
        p.author.name.toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.cropsTagged.some(c => c.toLowerCase().includes(q)) ||
        p.livestockTagged.some(l => l.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, subpage, globalSearch, currentUser]);

  // Soko Listings filter
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

  const activeChat = useMemo(() => {
    return chats.find(c => c.id === activeChatId) || chats[0];
  }, [chats, activeChatId]);

  return (
    <AppLayout>
      <div 
        className="bg-[#FAF9F6] text-stone-800 min-h-screen font-sans antialiased selection:bg-[#1A5438] selection:text-white"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
      >
        
        {/* ══════════════════════════════════════════
            STICKY TOP NAVIGATION
            ══════════════════════════════════════════ */}
        <nav className="bg-white/80 backdrop-blur-md sticky top-16 z-30 border-b border-stone-200/80 shadow-xs px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 bg-[#1A5438] rounded-xl flex items-center justify-center text-white font-bold font-serif shadow-xs">
              M
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#1A3A1A] block font-serif">Mqulima Forum</span>
              <span className="text-[9px] text-stone-400 font-mono block -mt-0.5">community.mqulima.com</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-2.5" />
            <input 
              type="text" 
              placeholder="Search farm updates, crops, locations..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200/80 focus:border-[#1A5438] focus:bg-white rounded-full pl-10 pr-4 py-2 text-xs text-stone-700 outline-none transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Actions controls */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Messages tab link */}
            <button 
              onClick={() => {
                setSubpage("konnekt");
                setSelectedProfileUsername(null);
              }}
              className="relative p-2 text-stone-600 hover:text-[#1A5438] hover:bg-stone-50 rounded-full transition-colors"
              title="Mqulima Konnekt"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="absolute top-1 right-1 bg-[#1A5438] text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">1</span>
            </button>

            {/* Notifications panel toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-stone-600 hover:text-[#1A5438] hover:bg-stone-50 rounded-full transition-colors"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">2</span>
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-80 bg-white border border-stone-250/90 rounded-2xl shadow-xl z-50 p-4 text-left space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                      <strong className="text-xs text-stone-800 uppercase tracking-wider font-bold">Notifications</strong>
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                        className="text-[10px] text-[#1A5438] hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-2.5 divide-y divide-stone-50 max-h-60 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="pt-2 text-xs text-stone-600 space-y-1">
                          <p className={notif.read ? "text-stone-500" : "text-stone-800 font-medium"}>
                            {notif.text}
                          </p>
                          <span className="text-[9px] text-stone-400 block font-mono">{notif.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 hover:bg-stone-50 p-1.5 rounded-full transition text-left"
              >
                <img 
                  src={currentUser ? currentUser.avatarUrl : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover border border-[#1A5438]/20"
                />
                <ChevronDown className="h-3.5 w-3.5 text-stone-500" />
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-3 w-56 bg-white border border-stone-250/90 rounded-2xl shadow-xl z-50 py-2.5 text-left"
                  >
                    <div className="px-4 py-2 border-b border-stone-100">
                      <strong className="text-xs text-stone-800 block truncate">{currentUser ? currentUser.name : "Guest Farmer"}</strong>
                      <span className="text-[10px] text-stone-400 font-mono block truncate">{currentUser ? currentUser.username : "@mqulima_guest"}</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setSubpage("profile");
                        setSelectedProfileUsername(null);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 transition"
                    >
                      My Profile
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsRegisteringProfile(true);
                        setSubpage("profile");
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 transition"
                    >
                      Edit Profile Details
                    </button>
                    
                    <a 
                      href="/"
                      className="block text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition border-t border-stone-50"
                    >
                      Exit to Mqulima Hub
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>
      </nav>

      {/* ══════════════════════════════════════════
          MAIN BODY LAYOUT
          ══════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ══════════════════════════════════════════
              LEFT SIDEBAR: QUICK NAVIGATION
              ══════════════════════════════════════════ */}
          <aside className="lg:col-span-3 space-y-6 text-left">
            
            {/* Nav Card */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs">
              <strong className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-3 font-mono px-2">Navigation Links</strong>
              <nav className="space-y-1">
                {[
                  { id: "home", label: "Home", icon: "🏠", subtitle: "Community posts" },
                  { id: "show", label: "Mqulima Show", icon: "📸", subtitle: "Visual harvest highlights" },
                  { id: "soko", label: "Mqulima Soko", icon: "🌾", subtitle: "Market trade boards" },
                  { id: "pulse", label: "Mqulima Pulse", icon: "📈", subtitle: "Verified agronomy dispatches" },
                  { id: "konnekt", label: "Mqulima Konnekt", icon: "💬", subtitle: "Chat messaging logs" },
                  { id: "saved", label: "Saved Posts", icon: "🔖", subtitle: "Your bookmarks list" },
                  { id: "profile", label: "My Profile", icon: "👤", subtitle: "Co-op statistics & settings" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSubpage(item.id as any);
                      setSelectedProfileUsername(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-300 border ${
                      subpage === item.id && !selectedProfileUsername
                        ? "bg-[#1A5438]/10 border-[#1A5438]/30 text-[#1A5438] shadow-xs" 
                        : "border-transparent text-stone-600 hover:bg-stone-50 hover:text-[#1A5438]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-left">
                        <span className="block">{item.label}</span>
                        <span className="text-[9px] font-medium text-stone-400 block -mt-0.5">{item.subtitle}</span>
                      </span>
                    </span>
                    {item.id === "konnekt" && offlineQueue.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Specialist Profile Quick Stats */}
            {currentUser && (
              <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1.5 w-full bg-[#1A5438]" />
                <div className="flex items-center gap-3">
                  <img 
                    src={currentUser.avatarUrl} 
                    alt="avatar" 
                    className="h-10 w-10 rounded-full object-cover border border-[#1A5438]/15" 
                  />
                  <div>
                    <strong className="text-xs font-bold text-stone-800 block leading-tight">{currentUser.name}</strong>
                    <span className="text-[10px] text-stone-400 font-mono block">{currentUser.username}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-3.5 border-t border-stone-100 text-xs">
                  <div>
                    <span className="text-[9px] text-stone-400 block font-bold uppercase tracking-wider">Reputation</span>
                    <strong className="text-[#1A5438] text-sm font-mono">{currentUser.reputationScore} pts</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-stone-400 block font-bold uppercase tracking-wider">Experience</span>
                    <strong className="text-stone-700 text-sm font-mono">{currentUser.yearsFarming} Years</strong>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedProfileUsername(null);
                    setSubpage("profile");
                  }}
                  className="w-full mt-4 bg-stone-50 hover:bg-stone-100 text-[#1A5438] text-xs font-bold uppercase py-2 rounded-xl border border-stone-200/40 tracking-wider transition-colors block text-center"
                >
                  View Details
                </button>
              </div>
            )}

            {/* Developers / Database RLS controls */}
            <div className="bg-stone-100/60 border border-stone-200/60 rounded-2xl p-4 space-y-2.5 text-xs text-stone-500">
              <span className="text-[9px] text-stone-400 font-black uppercase font-mono block tracking-wider">Developer Debug Panel</span>
              <div className="space-y-1.5 text-[10px] font-mono leading-tight">
                <div className="flex justify-between">
                  <span>Simulated Channel:</span>
                  <strong className="text-[#1A5438]">Live Channel</strong>
                </div>
                <div className="flex justify-between">
                  <span>Supabase RLS Status:</span>
                  <button 
                    onClick={() => setShowRLSDashboard(!showRLSDashboard)}
                    className="text-[#1A5438] hover:underline font-bold"
                  >
                    {showRLSDashboard ? "Hide Schema" : "Show Schema"}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <button 
                    onClick={() => setIsOnline(!isOnline)}
                    className={`font-bold transition uppercase ${isOnline ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {isOnline ? "✓ Online" : "✗ Offline"}
                  </button>
                </div>
              </div>
            </div>

          </aside>

          {/* ══════════════════════════════════════════
              CENTER FEED: DYNAMIC VIEWS
              ══════════════════════════════════════════ */}
          <main className="lg:col-span-6 space-y-6">
            
            {/* Search filter indicator on mobile */}
            <div className="block md:hidden relative bg-white p-3 border border-stone-200/60 rounded-2xl shadow-xs">
              <Search className="h-4 w-4 text-stone-400 absolute left-6 top-5.5" />
              <input 
                type="text" 
                placeholder="Search farm updates, crops, locations..." 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200/60 rounded-full pl-10 pr-4 py-2 text-xs outline-none"
              />
            </div>

            {/* PROFILE DETAILS SUBPAGE */}
            {(selectedProfileUsername || subpage === "profile") && viewingFarmer && (
              <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-xs text-left">
                
                {/* Cover Image */}
                <div className="h-32 bg-stone-200 relative">
                  <img 
                    src={viewingFarmer.coverImage} 
                    alt="cover" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    {(!selectedProfileUsername || selectedProfileUsername === currentUser?.username) ? (
                      <button
                        onClick={() => setIsRegisteringProfile(!isRegisteringProfile)}
                        className="bg-white/95 hover:bg-white text-stone-800 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full shadow-xs transition"
                      >
                        {isRegisteringProfile ? "Close Editor" : "Edit Profile"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollowFarmer(viewingFarmer.username)}
                        className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full shadow-xs transition ${
                          viewingFarmer.followers.includes(currentUser?.username || "")
                            ? "bg-[#1A5438] text-white"
                            : "bg-white hover:bg-stone-50 text-stone-850"
                        }`}
                      >
                        {viewingFarmer.followers.includes(currentUser?.username || "") ? "✓ Following" : "+ Follow"}
                      </button>
                    )}
                    {selectedProfileUsername && (
                      <button
                        onClick={() => setSelectedProfileUsername(null)}
                        className="bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>

                {/* Avatar Info Row */}
                <div className="px-6 pb-6 relative -mt-8 space-y-5">
                  <div className="flex items-end gap-3.5 border-b border-stone-100 pb-4">
                    <img 
                      src={viewingFarmer.avatarUrl} 
                      alt="avatar" 
                      className="h-16 w-16 rounded-2xl object-cover border-4 border-white shadow-md relative z-10 bg-white" 
                    />
                    <div className="pb-1 text-left">
                      <h2 className="text-base sm:text-lg font-bold font-serif text-stone-850 flex items-center gap-2">
                        {viewingFarmer.name}
                        {viewingFarmer.reputationScore >= 3000 && (
                          <span className="bg-[#E2EADF] text-[#1A5438] text-[8px] font-bold font-mono px-2 py-0.5 rounded-full border border-[#1A5438]/20 uppercase">
                            Platinum Tier
                          </span>
                        )}
                        {viewingFarmer.reputationScore < 3000 && viewingFarmer.reputationScore >= 1500 && (
                          <span className="bg-amber-50 text-amber-600 text-[8px] font-bold font-mono px-2 py-0.5 rounded-full border border-amber-500/25 uppercase">
                            Gold Tier
                          </span>
                        )}
                        {viewingFarmer.reputationScore < 1500 && (
                          <span className="bg-stone-50 text-stone-600 text-[8px] font-bold font-mono px-2 py-0.5 rounded-full border border-stone-200 uppercase">
                            Bronze Tier
                          </span>
                        )}
                      </h2>
                      <span className="text-[11px] text-stone-400 font-mono block">{viewingFarmer.username}</span>
                    </div>
                  </div>

                  {/* Profile Edit Form */}
                  {isRegisteringProfile && (!selectedProfileUsername || selectedProfileUsername === currentUser?.username) && (
                    <form onSubmit={handleRegisterProfile} className="bg-stone-50 border border-stone-200/60 p-4 rounded-xl space-y-3.5">
                      <strong className="text-xs text-[#1A5438] font-bold uppercase tracking-wider block border-b border-stone-100 pb-1.5">Edit Profile details</strong>
                      
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Full Name</label>
                          <input 
                            type="text" 
                            required 
                            value={regName} 
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Username Handle</label>
                          <input 
                            type="text" 
                            required 
                            value={regUsername} 
                            onChange={(e) => setRegUsername(e.target.value)}
                            className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">County / Region</label>
                          <input 
                            type="text" 
                            value={regCounty} 
                            onChange={(e) => setRegCounty(e.target.value)}
                            className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Years Farming</label>
                          <input 
                            type="number" 
                            value={regYears} 
                            onChange={(e) => setRegYears(e.target.value)}
                            className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Interests (comma-split)</label>
                          <input 
                            type="text" 
                            value={regInterests} 
                            onChange={(e) => setRegInterests(e.target.value)}
                            className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Crops Cultivated (comma-split)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Maize, Wheat" 
                            value={regCrops} 
                            onChange={(e) => setRegCrops(e.target.value)}
                            className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Livestock Kept (comma-split)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Dairy Cows" 
                            value={regLivestock} 
                            onChange={(e) => setRegLivestock(e.target.value)}
                            className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60">
                        <button 
                          type="button" 
                          onClick={() => setIsRegisteringProfile(false)}
                          className="px-3.5 py-1.5 border border-stone-200 text-stone-600 rounded-lg text-xs hover:bg-stone-100"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-4 py-1.5 bg-[#1A5438] hover:bg-[#113B26] text-white rounded-lg text-xs font-bold uppercase"
                        >
                          Save changes
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Profile Metrics Grid */}
                  <div className="grid grid-cols-4 gap-4 text-center py-2 text-stone-600">
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                      <span className="text-[8px] uppercase font-bold text-stone-400 block tracking-wider">Reputation</span>
                      <strong className="text-[#1A5438] text-sm font-mono">{viewingFarmer.reputationScore}</strong>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                      <span className="text-[8px] uppercase font-bold text-stone-400 block tracking-wider">Followers</span>
                      <strong className="text-stone-850 text-sm font-mono">{viewingFarmer.followersCount}</strong>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                      <span className="text-[8px] uppercase font-bold text-stone-400 block tracking-wider">Farming Years</span>
                      <strong className="text-stone-850 text-sm font-mono">{viewingFarmer.yearsFarming} yrs</strong>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl">
                      <span className="text-[8px] uppercase font-bold text-stone-400 block tracking-wider">County</span>
                      <strong className="text-stone-850 text-xs block truncate mt-0.5">{viewingFarmer.county}</strong>
                    </div>
                  </div>

                  {/* Profile Tags Spec */}
                  <div className="space-y-3.5 text-xs text-stone-700">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 tracking-widest block mb-1">Crops Cultivated</span>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingFarmer.crops.map((c, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{c}</span>
                        ))}
                        {viewingFarmer.crops.length === 0 && <span className="text-stone-400 italic">No crops listed</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 tracking-widest block mb-1">Livestock Kept</span>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingFarmer.livestock.map((l, i) => (
                          <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{l}</span>
                        ))}
                        {viewingFarmer.livestock.length === 0 && <span className="text-stone-400 italic">No livestock listed</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-stone-400 tracking-widest block mb-1">Farming Interests</span>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingFarmer.interests.map((int, i) => (
                          <span key={i} className="bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{int}</span>
                        ))}
                      </div>
                    </div>
                    {viewingFarmer.certifications.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-stone-400 tracking-widest block mb-1">Certifications & Achievements</span>
                        <div className="space-y-1.5">
                          {viewingFarmer.certifications.map((cert, i) => (
                            <div key={i} className="flex items-center gap-2 bg-stone-50 border border-stone-200/40 p-2 rounded-xl text-stone-700 font-bold text-[10px] leading-tight">
                              <Award className="h-4 w-4 text-amber-500 shrink-0" />
                              <span>{cert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* 🌾 SOKO COMMODITY MARKETPLACE TAB VIEW */}
            {subpage === "soko" && !selectedProfileUsername && (
              <div className="space-y-6">
                
                {/* Soko Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-4 text-left">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-serif text-[#1A3A1A] flex items-center gap-2">
                      🌾 Mqulima Soko (Trade exchange)
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Direct trade boards: connect, barter, and secure sales with other farmers.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setIsListingSoko(!isListingSoko)}
                    className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Plus className="h-4 w-4" /> List Commodity
                  </button>
                </div>

                {/* Soko Price Billboard Slider */}
                <div className="bg-white border border-stone-200/80 p-4 rounded-2xl text-left shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      📊 Live Commodity Prices Billboard (KES Index)
                    </span>
                    <span className="text-[8px] font-mono text-stone-400">
                      SOURCE: SIMULATED KAMIS API
                    </span>
                  </div>

                  <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
                    {billboardPrices.map((bill, i) => {
                      const change = bill.price - bill.prevPrice;
                      return (
                        <div key={i} className="bg-stone-50 border border-stone-200/30 p-2.5 rounded-xl shadow-inner font-mono text-left space-y-1">
                          <span className="text-[9px] text-stone-400 block font-bold truncate">{bill.crop}</span>
                          <span className="text-[8px] text-amber-600 block">{bill.region}</span>
                          <div className="flex items-center justify-between mt-1">
                            <strong className="text-xs text-stone-800 font-bold">KES {bill.price}</strong>
                            <span className={`text-[9px] font-bold ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-500" : "text-stone-400"}`}>
                              {change > 0 ? `+${Math.round(change)}` : Math.round(change)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Soko Filters Panel */}
                <div className="bg-white border border-stone-200/85 p-4 rounded-2xl grid gap-4 sm:grid-cols-4 text-xs text-left shadow-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block tracking-wider">Search Listing</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="e.g. Potatoes..." 
                        value={sokoSearch}
                        onChange={(e) => setSokoSearch(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                      />
                      <Search className="absolute right-2 top-2 h-3.5 w-3.5 text-stone-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block tracking-wider">Commodity type</label>
                    <select 
                      value={sokoTypeFilter}
                      onChange={(e) => setSokoTypeFilter(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none cursor-pointer font-bold"
                    >
                      <option value="all">All commodities</option>
                      <option value="crop">Crops / Grains</option>
                      <option value="livestock">Livestock / Bees</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block tracking-wider">County / Region</label>
                    <select
                      value={sokoCountyFilter}
                      onChange={(e) => setSokoCountyFilter(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none cursor-pointer font-bold"
                    >
                      <option value="all">All regions</option>
                      <option value="Nyandarua">Nyandarua</option>
                      <option value="Kericho">Kericho</option>
                      <option value="Eldoret">Eldoret</option>
                      <option value="Machakos">Machakos</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block flex justify-between tracking-wider">
                      <span>Max Price:</span>
                      <strong className="text-emerald-700 font-mono">KES {sokoMaxPrice}</strong>
                    </label>
                    <input 
                      type="range"
                      min="1000"
                      max="30000"
                      step="1000"
                      value={sokoMaxPrice}
                      onChange={(e) => setSokoMaxPrice(Number(e.target.value))}
                      className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#1A5438] mt-2.5"
                    />
                  </div>
                </div>

                {/* Soko Create Form */}
                {isListingSoko && (
                  <form onSubmit={handleCreateSokoListing} className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-4 text-left shadow-md">
                    <strong className="text-xs text-[#1A5438] font-bold uppercase tracking-wider block border-b border-stone-100 pb-2">Put up Commodity for Sale</strong>
                    
                    <div className="grid gap-3.5 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Commodity Name</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Grade A Potatoes"
                          value={sokoCommodity}
                          onChange={(e) => setSokoCommodity(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Type</label>
                        <select
                          value={sokoType}
                          onChange={(e) => setSokoType(e.target.value as any)}
                          className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none cursor-pointer font-bold"
                        >
                          <option value="crop">Crops / Grains</option>
                          <option value="livestock">Livestock / Animals</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Unit Price (KES)</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. 3200"
                          value={sokoPrice}
                          onChange={(e) => setSokoPrice(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Volume / Quantity</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. 40 Bags"
                          value={sokoQty}
                          onChange={(e) => setSokoQty(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Location</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Eldoret"
                          value={sokoLoc}
                          onChange={(e) => setSokoLoc(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Product Image URL</label>
                        <input 
                          type="url" 
                          placeholder="Paste image link..."
                          value={sokoImgText}
                          onChange={(e) => setSokoImgText(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#1A5438] uppercase">Listing Details & Specifications</label>
                      <textarea 
                        required 
                        rows={3} 
                        placeholder="Harvest moisture levels, chemical application specs, size grades..."
                        value={sokoDesc}
                        onChange={(e) => setSokoDesc(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1A5438] resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                      <button 
                        type="button" 
                        onClick={() => setIsListingSoko(false)}
                        className="px-3.5 py-1.5 border border-stone-200 text-stone-600 rounded-xl text-xs hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-1.5 bg-[#1A5438] hover:bg-[#113B26] text-white rounded-xl text-xs font-bold uppercase"
                      >
                        List Product
                      </button>
                    </div>
                  </form>
                )}

                {/* Soko List */}
                <div className="space-y-4">
                  {filteredSokoListings.map((listing) => (
                    <div 
                      key={listing.id} 
                      className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-5 hover:border-[#1A5438] transition-all duration-300 hover:shadow-md text-left"
                    >
                      <div className="h-32 w-full md:w-44 rounded-xl overflow-hidden bg-stone-100 border border-stone-100 shrink-0">
                        <img 
                          src={listing.images[0]} 
                          alt="listing" 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {listing.location}
                            </span>
                            <span className="text-[9px] text-stone-400 font-mono">{listing.createdAt}</span>
                          </div>
                          <h3 className="text-base font-bold font-serif text-stone-850">{listing.commodity}</h3>
                          <p className="text-xs text-stone-600 leading-relaxed font-medium">{listing.description}</p>
                          
                          <div className="flex gap-6 pt-1 text-xs">
                            <div>
                              <span className="text-stone-400 block text-[9px] uppercase font-bold">Price</span>
                              <strong className="text-emerald-700 font-mono text-sm">KES {listing.price}</strong>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[9px] uppercase font-bold">Quantity</span>
                              <strong className="text-stone-700 font-mono text-sm">{listing.quantity}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-stone-400">
                            Seller:{" "}
                            <button 
                              onClick={() => setSelectedProfileUsername(listing.author.username)}
                              className="text-stone-600 font-mono hover:text-[#1A5438] font-bold"
                            >
                              {listing.author.username}
                            </button>
                          </span>

                          <button 
                            onClick={() => {
                              const sessionIdx = chats.findIndex(c => c.farmer?.username === listing.author.username);
                              if (sessionIdx !== -1) {
                                setActiveChatId(chats[sessionIdx].id);
                              } else {
                                const newId = `chat_${Date.now()}`;
                                const newSession: ChatSession = {
                                  id: newId,
                                  name: `${listing.author.name} (DM)`,
                                  isGroup: false,
                                  farmer: listing.author,
                                  log: [
                                    { id: "s_init", sender: listing.author.username, text: `Hello! I noticed you are viewing my trade listing for ${listing.commodity}. Let me know if you would like to arrange purchase.`, timestamp: "Just now", read: true }
                                  ]
                                };
                                setChats(prev => [newSession, ...prev]);
                                setActiveChatId(newId);
                              }
                              setSubpage("konnekt");
                              toast.success(`Chat session established with ${listing.author.name}`);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-[#1A5438] px-3.5 py-1.5 rounded-lg border border-[#1A5438]/20 font-bold uppercase text-[10px]"
                          >
                            Message Seller
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredSokoListings.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-6">No matching commodity listings found.</p>
                  )}
                </div>

              </div>
            )}

            {/* 📈 MQULIMA PULSE DISPATCHES TAB VIEW */}
            {subpage === "pulse" && !selectedProfileUsername && (
              <div className="space-y-6">
                
                {/* Pulse Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 pb-4 text-left">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-serif text-[#1A3A1A] flex items-center gap-2">
                      📈 Mqulima Pulse (Agronomy reports)
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Verified news, market summaries, policy updates, and expert agronomist dispatches.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsPostingPulse(!isPostingPulse)}
                    className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Publish Dispatch
                  </button>
                </div>

                {/* Dispatch Form */}
                {isPostingPulse && (
                  <form onSubmit={handleCreatePulsePost} className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-4 text-left shadow-md">
                    <strong className="text-xs text-[#1A5438] font-bold uppercase tracking-wider block border-b border-stone-100 pb-2">Publish Agronomic Bulletin</strong>
                    
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Article Title</label>
                        <input 
                          type="text" 
                          required 
                          value={pulseTitle} 
                          onChange={(e) => setPulseTitle(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-400 uppercase">Category</label>
                        <select 
                          value={pulseCategory}
                          onChange={(e) => setPulseCategory(e.target.value as any)}
                          className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none cursor-pointer font-bold"
                        >
                          <option value="Market Trend">Market Trend</option>
                          <option value="Weather Alert">Weather Alert</option>
                          <option value="Policy Update">Policy Update</option>
                          <option value="Agronomy Alert">Agronomy Alert</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#1A5438] uppercase">Source / Verified Publisher Authority</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. KALRO Entomology Department, Machakos Division"
                        value={pulseSource} 
                        onChange={(e) => setPulseSource(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#1A5438] uppercase">Bulletin Details</label>
                      <textarea 
                        required 
                        rows={4} 
                        value={pulseContent} 
                        onChange={(e) => setPulseContent(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1A5438] resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                      <button 
                        type="button" 
                        onClick={() => setIsPostingPulse(false)}
                        className="px-3.5 py-1.5 border border-stone-200 text-stone-600 rounded-xl text-xs hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-1.5 bg-[#1A5438] hover:bg-[#113B26] text-white rounded-xl text-xs font-bold uppercase"
                      >
                        Publish Report
                      </button>
                    </div>
                  </form>
                )}

                {/* Dispatches List */}
                <div className="grid gap-6 md:grid-cols-2">
                  {pulsePosts.map((pulse) => (
                    <div 
                      key={pulse.id} 
                      className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs hover:border-[#1A5438] transition-all duration-300 hover:shadow-md flex flex-col justify-between text-left"
                    >
                      <div>
                        <span className="bg-[#E2EADF] text-[#1A5438] border border-[#1A5438]/10 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-3.5">
                          {pulse.category}
                        </span>
                        <h3 className="text-sm font-bold font-serif text-stone-850 mt-1 leading-snug">{pulse.title}</h3>
                        <p className="text-xs text-stone-600 mt-2.5 leading-relaxed font-medium">{pulse.content}</p>
                      </div>

                      <div className="border-t border-stone-100 pt-3 mt-4 text-[9px] font-mono text-stone-400 flex flex-col gap-1 text-left">
                        <span className="text-[#1A5438] font-bold">✓ Source: {pulse.source}</span>
                        <span>Date: {pulse.date}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Download PDF Card */}
                <div className="bg-gradient-to-r from-[#1A5438] to-[#2D6A4F] border border-[#1A5438]/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-5 text-white text-left">
                  <div>
                    <span className="text-amber-400 text-[9px] font-bold uppercase tracking-wider block">Agronomist Dispatch Bulletin</span>
                    <h3 className="text-base font-bold font-serif mt-1">Download Soil & Fertilizer Bulletins</h3>
                    <p className="text-xs text-white/80 mt-1 leading-relaxed max-w-lg">
                      Full digital manuals for composting routines, soil sample calibration tests, and crop rot plans published by local extension desks.
                    </p>
                  </div>

                  <button 
                    onClick={() => toast.success("Downloading PDF Soil Bulletin (5.2 MB)...")}
                    className="bg-white hover:bg-stone-50 text-[#1A5438] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition uppercase tracking-wider shrink-0"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </button>
                </div>

              </div>
            )}

            {/* 💬 MQULIMA KONNEKT CHAT MESSENGER TAB VIEW */}
            {subpage === "konnekt" && !selectedProfileUsername && (
              <div className="space-y-6">
                
                {/* Konnekt Header */}
                <div className="border-b border-stone-200/60 pb-4 text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-serif text-[#1A3A1A] flex items-center gap-2">
                      💬 Mqulima Konnekt (Direct Messaging)
                    </h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Live text dispatches and group co-ops synced via simulated Supabase Realtime channels.
                    </p>
                  </div>

                  {offlineQueue.length > 0 && (
                    <button 
                      onClick={triggerManualSync}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 text-xs px-4 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                      <span>Sync outbox ({offlineQueue.length})</span>
                    </button>
                  )}
                </div>

                {/* Chat Console Panel */}
                <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden grid md:grid-cols-12 min-h-[480px] shadow-xs">
                  
                  {/* Channels List (Left column) */}
                  <div className="md:col-span-4 bg-stone-50/50 border-r border-stone-150 p-4 text-left space-y-3">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block font-mono">Channels & DMs</span>
                    
                    <div className="space-y-1.5">
                      {chats.map((sess) => (
                        <button
                          key={sess.id}
                          onClick={() => setActiveChatId(sess.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition border text-left cursor-pointer ${
                            activeChatId === sess.id
                              ? "bg-white border-[#1A5438]/25 text-[#1A5438] shadow-xs"
                              : "border-transparent text-stone-600 hover:bg-stone-100/50"
                          }`}
                        >
                          <div className="h-8 w-8 rounded-full bg-[#1A5438]/10 text-[#1A5438] font-bold text-xs flex items-center justify-center border border-[#1A5438]/10 shrink-0 relative font-serif">
                            {sess.isGroup ? "GP" : sess.farmer?.avatarUrl ? (
                              <img src={sess.farmer.avatarUrl} alt="avatar" className="h-full w-full rounded-full object-cover" />
                            ) : "F"}
                            {!sess.isGroup && (
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <strong className="text-xs text-stone-850 block truncate font-bold">{sess.name}</strong>
                            <span className="text-[9px] text-stone-400 block truncate font-mono">
                              {sess.isGroup ? "Realtime co-op channel" : sess.farmer?.username}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Sync visualizer */}
                    <div className="border-t border-stone-200/60 pt-4 mt-4 space-y-2">
                      <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block font-mono">Local Sync Engine</span>
                      <div className="bg-white border border-stone-200/65 rounded-xl p-3 text-[10px] space-y-1 text-stone-500">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <strong className={isOnline ? "text-emerald-600" : "text-amber-600"}>{isOnline ? "Network Connected" : "Local Outbox Active"}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Outbox Queue:</span>
                          <strong>{offlineQueue.length} messages</strong>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Logs & Input (Right column) */}
                  <div className="md:col-span-8 flex flex-col justify-between min-h-[400px] bg-white">
                    
                    {/* Active Chat Info Header */}
                    <div className="p-4 border-b border-stone-100 bg-stone-50/20 flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#1A5438]/15 text-[#1A5438] font-bold text-xs flex items-center justify-center font-serif">
                          {activeChat.isGroup ? "GP" : activeChat.farmer?.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-xs text-stone-850 block font-bold">{activeChat.name}</strong>
                          <span className="text-[9px] text-stone-400 font-mono block">
                            {activeChat.isGroup ? "Supabase Realtime Channel" : "Direct Message Outbox"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 block animate-pulse" />
                        <span>SYNCED</span>
                      </div>
                    </div>

                    {/* Messages Scroll viewport */}
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[320px] bg-stone-50/10">
                      {activeChat.log.map((msg, i) => {
                        const isMe = msg.sender === (currentUser ? currentUser.username : "@mqulima_guest");
                        return (
                          <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                              isMe 
                                ? "bg-[#1A5438] text-white rounded-br-none text-right"
                                : "bg-stone-100 text-stone-800 rounded-bl-none text-left"
                            }`}>
                              <p>{msg.text}</p>
                            </div>
                            <span className="text-[8px] text-stone-400 font-mono block mt-1 px-1">
                              {msg.sender} • {msg.timestamp} {isMe && "• Delivered"}
                            </span>
                          </div>
                        );
                      })}
                      {!isOnline && (
                        <div className="text-[9px] text-amber-600 font-mono italic text-center bg-amber-50 p-2 rounded-lg">
                          ⚠️ Connection simulator Offline: Messages will buffer in outbox queue until reconnected.
                        </div>
                      )}
                    </div>

                    {/* Text Input Footer */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-stone-50/50 border-t border-stone-100 flex gap-2">
                      <input 
                        type="text" 
                        required 
                        placeholder={isOnline ? `Send message...` : "Outbox Buffer: message will queue..."}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                      />
                      <button 
                        type="submit"
                        className="bg-[#1A5438] hover:bg-[#113B26] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 shrink-0"
                      >
                        <span>Send</span>
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>

                  </div>

                </div>

              </div>
            )}

            {/* 🏠 HOME COMMUNITY FEED & 📸 SHOW TABS VIEW */}
            {(subpage === "home" || subpage === "show" || subpage === "saved") && !selectedProfileUsername && (
              <div className="space-y-6">
                
                {/* Create Post Section Card */}
                {currentUser && (
                  <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4 text-left">
                    <div className="flex items-center gap-3">
                      <img 
                        src={currentUser.avatarUrl} 
                        alt="avatar" 
                        className="h-10 w-10 rounded-full object-cover border border-[#1A5438]/10" 
                      />
                      <div className="flex-1">
                        <strong className="text-xs text-stone-800 block">Share with the Mqulima Community</strong>
                        <span className="text-[9px] text-stone-400 block -mt-0.5 font-mono">Publishing from {createLocation}</span>
                      </div>
                    </div>

                    <form onSubmit={handleCreatePost} className="space-y-3.5">
                      <textarea 
                        required
                        rows={3} 
                        placeholder="Write a post... What's progress on your farm? Share harvest metrics or questions."
                        value={createBody}
                        onChange={(e) => setCreateBody(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/80 focus:border-[#1A5438] rounded-xl px-4 py-2.5 text-xs text-stone-700 outline-none focus:bg-white resize-none transition-all duration-300"
                      />

                      {/* Image/Video inputs */}
                      {showMediaFields && (
                        <div className="grid gap-3 sm:grid-cols-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-500 uppercase">Image URLs (comma separated)</label>
                            <input 
                              type="text" 
                              placeholder="Paste photo links..."
                              value={createImagesText}
                              onChange={(e) => setCreateImagesText(e.target.value)}
                              className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-500 uppercase">Video URL (Optional)</label>
                            <input 
                              type="text" 
                              placeholder="Paste video address..."
                              value={createVideoUrl}
                              onChange={(e) => setCreateVideoUrl(e.target.value)}
                              className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Crop/Livestock tags inputs */}
                      {showTagFields && (
                        <div className="grid gap-3 sm:grid-cols-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-500 uppercase">Tag Crops</label>
                            <input 
                              type="text" 
                              placeholder="Maize, Wheat..."
                              value={createCrops}
                              onChange={(e) => setCreateCrops(e.target.value)}
                              className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-500 uppercase">Tag Livestock</label>
                            <input 
                              type="text" 
                              placeholder="Dairy Cows..."
                              value={createLivestock}
                              onChange={(e) => setCreateLivestock(e.target.value)}
                              className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-500 uppercase">Farm Location</label>
                            <input 
                              type="text" 
                              value={createLocation}
                              onChange={(e) => setCreateLocation(e.target.value)}
                              className="w-full bg-white border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs text-stone-700 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Creator actions */}
                      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                        <div className="flex items-center gap-3">
                          
                          <button 
                            type="button" 
                            onClick={() => setShowMediaFields(!showMediaFields)}
                            className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
                              showMediaFields ? "bg-emerald-50 text-[#1A5438]" : "text-stone-600 hover:bg-stone-50"
                            }`}
                          >
                            <ImageIcon className="h-4 w-4 text-emerald-600" />
                            <span className="hidden sm:inline">Images</span>
                          </button>

                          <button 
                            type="button" 
                            onClick={() => setShowMediaFields(!showMediaFields)}
                            className="p-2 text-stone-600 hover:bg-stone-50 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
                          >
                            <Video className="h-4 w-4 text-blue-500" />
                            <span className="hidden sm:inline">Video</span>
                          </button>

                          <button 
                            type="button" 
                            onClick={() => setShowTagFields(!showTagFields)}
                            className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
                              showTagFields ? "bg-amber-50 text-amber-700" : "text-stone-600 hover:bg-stone-50"
                            }`}
                          >
                            <Tag className="h-4 w-4 text-amber-600" />
                            <span className="hidden sm:inline">Tags & Loc</span>
                          </button>

                        </div>

                        <div className="flex items-center gap-2">
                          <select 
                            value={createCategory}
                            onChange={(e) => setCreateCategory(e.target.value as any)}
                            className="bg-stone-50 border border-stone-200 text-stone-700 text-[10px] font-bold px-2 py-1.5 rounded-lg outline-none cursor-pointer"
                          >
                            <option value="Farm Progress">Farm Progress</option>
                            <option value="Harvest Update">Harvest Update</option>
                            <option value="Farming Tips">Farming Tips</option>
                            <option value="Question">Question</option>
                            <option value="Success Story">Success Story</option>
                          </select>

                          <button 
                            type="submit"
                            className="bg-[#1A5438] hover:bg-[#113B26] text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs uppercase tracking-wider"
                          >
                            Publish Post
                          </button>
                        </div>

                      </div>
                    </form>
                  </div>
                )}

                {/* Subpage title */}
                <div className="text-left border-b border-stone-200/60 pb-2">
                  <h2 className="text-base font-bold font-serif text-stone-850 uppercase tracking-wide">
                    {subpage === "home" ? "Community Discussion Feed" : subpage === "show" ? "📸 Mqulima Show Visual Gallery" : "Bookmarks"}
                  </h2>
                </div>

                {/* Posts Feed */}
                <div className="space-y-6">
                  {filteredPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 space-y-4 text-left"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={post.author.avatarUrl} 
                            alt="author" 
                            className="h-10 w-10 rounded-full object-cover border border-[#1A5438]/10" 
                          />
                          
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => setSelectedProfileUsername(post.author.username)}
                                className="text-xs font-bold text-stone-800 hover:text-[#1A5438] transition"
                              >
                                {post.author.name}
                              </button>
                              
                              {/* Inline Profile Dropdown toggle */}
                              <button 
                                onClick={() => setExpandedProfilePostId(expandedProfilePostId === post.id ? null : post.id)}
                                className="p-0.5 hover:bg-stone-50 rounded-full transition"
                                title="View compact farmer bio"
                              >
                                <ChevronDown className="h-3 w-3 text-stone-400" />
                              </button>
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono block -mt-0.5">{post.author.username}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-stone-400">{post.createdAt}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${
                            post.category === "Harvest Update" ? "bg-emerald-50 text-emerald-700 border-emerald-250/30" :
                            post.category === "Question" ? "bg-red-50 text-red-600 border-red-200/40" :
                            post.category === "Farming Tips" ? "bg-amber-50 text-amber-700 border-amber-200/45" :
                            "bg-blue-50 text-blue-700 border-blue-200/40"
                          }`}>
                            {post.category}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Farmer Bio Panel */}
                      {expandedProfilePostId === post.id && (
                        <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-4 space-y-3.5 text-xs text-stone-600 relative">
                          <button 
                            onClick={() => setExpandedProfilePostId(null)}
                            className="absolute top-3 right-3 text-stone-400 hover:text-stone-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          
                          <div className="flex gap-4 items-center">
                            <img src={post.author.avatarUrl} alt="author" className="h-12 w-12 rounded-xl object-cover border border-stone-200" />
                            <div>
                              <strong className="text-stone-850 block">{post.author.name}</strong>
                              <span className="text-[10px] text-stone-400 font-mono block">{post.author.username}</span>
                              <span className="text-[10px] block mt-0.5 text-stone-500 font-medium">📍 {post.author.county}, {post.author.country}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5 text-center text-[10px] pt-1.5 border-t border-stone-200/40">
                            <div>
                              <span className="text-stone-400 font-bold block">REPUTATION</span>
                              <strong className="text-[#1A5438] font-mono text-xs">{post.author.reputationScore} pts</strong>
                            </div>
                            <div>
                              <span className="text-stone-400 font-bold block">EXPERIENCE</span>
                              <strong className="text-stone-700 font-mono text-xs">{post.author.yearsFarming} Yrs</strong>
                            </div>
                            <div>
                              <span className="text-stone-400 font-bold block">FOLLOWERS</span>
                              <strong className="text-stone-700 font-mono text-xs">{post.author.followersCount}</strong>
                            </div>
                          </div>

                          <div className="text-[10px] space-y-1.5">
                            <div>
                              <strong className="text-stone-400 uppercase text-[9px] block">Crops grown:</strong>
                              <p className="font-semibold text-emerald-800">{post.author.crops.join(", ")}</p>
                            </div>
                            <div>
                              <strong className="text-stone-400 uppercase text-[9px] block">Livestock kept:</strong>
                              <p className="font-semibold text-blue-800">{post.author.livestock.join(", ") || "None"}</p>
                            </div>
                            <div>
                              <strong className="text-stone-400 uppercase text-[9px] block">Main Interests:</strong>
                              <p className="font-semibold text-amber-700">{post.author.interests.join(", ")}</p>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2 border-t border-stone-200/40">
                            <button
                              onClick={() => {
                                handleFollowFarmer(post.author.username);
                              }}
                              className="px-3.5 py-1 bg-[#1A5438] text-white text-[10px] font-bold uppercase rounded-lg shadow-xs hover:bg-[#113B26]"
                            >
                              {post.author.followers.includes(currentUser?.username || "") ? "Unfollow" : "Follow Farmer"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Post Content */}
                      <div className="space-y-3">
                        <p className="text-stone-700 text-xs sm:text-sm leading-relaxed font-sans font-medium whitespace-pre-wrap">
                          {post.body}
                        </p>

                        {/* Location pin */}
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-semibold font-mono">
                          <MapPin className="h-3 w-3 text-stone-400" />
                          <span>{post.location}</span>
                        </div>

                        {/* Crops/Livestock tags */}
                        {(post.cropsTagged.length > 0 || post.livestockTagged.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {post.cropsTagged.map((c, idx) => (
                              <span key={idx} className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">
                                🌾 {c}
                              </span>
                            ))}
                            {post.livestockTagged.map((l, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                                🐄 {l}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Post Images Slideshow */}
                        {post.images && post.images.length > 0 && (
                          <div className="aspect-video w-full overflow-hidden rounded-xl bg-stone-50 border border-stone-100 relative">
                            <img 
                              src={post.images[0]} 
                              alt="Post attach" 
                              className="w-full h-full object-cover" 
                            />
                            {post.images.length > 1 && (
                              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                                +{post.images.length - 1} photos
                              </span>
                            )}
                          </div>
                        )}

                        {/* Post Video */}
                        {post.videoUrl && (
                          <div className="aspect-video w-full overflow-hidden rounded-xl bg-stone-900 border border-stone-100 relative flex items-center justify-center">
                            <video src={post.videoUrl} controls className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Post Actions Row */}
                      <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-stone-500 text-xs font-bold uppercase">
                        
                        <button 
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1.5 transition ${
                            post.hasLiked ? "text-red-500" : "hover:text-[#1A5438]"
                          }`}
                        >
                          <Heart className={`h-4.5 w-4.5 ${post.hasLiked ? "fill-current" : ""}`} />
                          <span>{post.likes}</span>
                        </button>

                        <button 
                          onClick={() => setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id)}
                          className="flex items-center gap-1.5 hover:text-[#1A5438] transition"
                        >
                          <MessageCircle className="h-4.5 w-4.5 text-stone-500" />
                          <span>{post.comments.length} comments</span>
                        </button>

                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Post URL copied to clipboard!");
                          }}
                          className="flex items-center gap-1.5 hover:text-[#1A5438] transition"
                        >
                          <Share2 className="h-4.5 w-4.5 text-stone-500" />
                          <span>Share</span>
                        </button>

                        <button 
                          onClick={() => handleSavePost(post.id)}
                          className={`flex items-center gap-1.5 transition ${
                            post.hasSaved ? "text-amber-500" : "hover:text-[#1A5438]"
                          }`}
                        >
                          <Bookmark className={`h-4.5 w-4.5 ${post.hasSaved ? "fill-current" : ""}`} />
                          <span>{post.hasSaved ? "Saved" : "Save"}</span>
                        </button>

                      </div>

                      {/* Comments Drawer / Section */}
                      {expandedCommentsPostId === post.id && (
                        <div className="bg-stone-50 border-t border-stone-100 rounded-b-2xl p-4 space-y-3">
                          <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider font-mono block">Comments</span>
                          
                          <div className="space-y-3.5 max-h-48 overflow-y-auto divide-y divide-stone-100/50">
                            {post.comments.map((comm, idx) => (
                              <div key={idx} className="pt-2 text-left space-y-1">
                                <div className="flex justify-between items-center text-[10px]">
                                  <strong className="text-stone-850 font-mono font-bold">{comm.authorName}</strong>
                                  <span className="text-stone-400 font-mono">{comm.time}</span>
                                </div>
                                <p className="text-xs text-stone-600 leading-normal font-medium">{comm.text}</p>
                              </div>
                            ))}
                            {post.comments.length === 0 && (
                              <p className="text-[11px] text-stone-400 italic py-2">No comments yet. Write one below!</p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-stone-200/50">
                            <input 
                              type="text" 
                              required 
                              placeholder="Write a comment..." 
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#1A5438]"
                            />
                            <button 
                              onClick={() => handleAddComment(post.id)}
                              className="px-3.5 py-1.5 bg-[#1A5438] text-white rounded-lg text-xs font-bold uppercase"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                  {filteredPosts.length === 0 && (
                    <p className="text-xs text-stone-400 italic py-10">No community discussions found matching the query.</p>
                  )}
                </div>

              </div>
            )}

          </main>

          {/* ══════════════════════════════════════════
              RIGHT SIDEBAR: EXTRA WIDGETS
              ══════════════════════════════════════════ */}
          <aside className="lg:col-span-3 space-y-6 text-left">
            
            {/* Suggested Farmers to Follow */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-4.5 shadow-xs space-y-3.5">
              <strong className="text-[10px] font-black text-stone-400 uppercase tracking-widest block font-mono">Farmers to follow</strong>
              
              <div className="space-y-3">
                {farmers.filter(f => f.username !== currentUser?.username).slice(0, 3).map((f) => (
                  <div key={f.username} className="flex gap-2.5 items-center justify-between border-b border-stone-50 pb-3 last:border-0 last:pb-0">
                    <button 
                      onClick={() => setSelectedProfileUsername(f.username)}
                      className="flex items-center gap-2 w-2/3"
                    >
                      <img src={f.avatarUrl} alt="avatar" className="h-8 w-8 rounded-full object-cover border border-[#1A5438]/10" />
                      <div className="min-w-0 text-left">
                        <strong className="text-[11px] text-stone-850 block truncate leading-tight font-bold hover:text-[#1A5438]">{f.name}</strong>
                        <span className="text-[9px] text-stone-400 font-mono block truncate">{f.username}</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => handleFollowFarmer(f.username)}
                      className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border transition shrink-0 ${
                        f.followers.includes(currentUser?.username || "")
                          ? "bg-[#1A5438] text-white border-[#1A5438]"
                          : "border-stone-300 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {f.followers.includes(currentUser?.username || "") ? "✓ Following" : "+ Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Farming Discussions */}
            <div className="bg-white border border-[#D4DDD0] rounded-2xl p-4.5 shadow-xs space-y-3">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest block font-mono">Trending Topics</h4>
              
              <div className="space-y-2">
                {[
                  { tag: "#armyworm-control", postsCount: 52, trend: "up" },
                  { tag: "#NPK-subsidy", postsCount: 30, trend: "up" },
                  { tag: "#hass-avocado-export", postsCount: 18, trend: "steady" },
                  { tag: "#smart-drip-irrigation", postsCount: 24, trend: "up" }
                ].map((trend) => (
                  <button 
                    key={trend.tag}
                    onClick={() => {
                      setGlobalSearch(trend.tag);
                      setSubpage("home");
                      setSelectedProfileUsername(null);
                      toast.info(`Filtering feed by ${trend.tag}`);
                    }}
                    className="w-full flex items-center justify-between text-xs py-1 hover:bg-stone-50 px-1 rounded transition text-left"
                  >
                    <span className="font-bold text-[#1A5438]">{trend.tag}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{trend.postsCount} dispatches</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div className="bg-white border border-[#D4DDD0] rounded-2xl p-4.5 shadow-xs space-y-3.5">
              <strong className="text-[10px] font-black text-stone-400 uppercase tracking-widest block font-mono">Upcoming Events</strong>
              
              <div className="space-y-3">
                {[
                  { title: "Nairobi Agribusiness Expo", date: "July 15, 2026", details: "Main Exhibition Grounds" },
                  { title: "Dryland Apiculture Workshop", date: "July 20, 2026", details: "Mwala Extension Center" },
                  { title: "Precision Maize Seeding Webinar", date: "July 28, 2026", details: "Zoom Coop Room" }
                ].map((evt, i) => (
                  <div key={i} className="text-xs space-y-0.5 border-l-2 border-[#1A5438]/60 pl-2.5">
                    <strong className="text-stone-850 block leading-tight font-bold">{evt.title}</strong>
                    <span className="text-[10px] text-[#1A5438] font-semibold block">{evt.date}</span>
                    <span className="text-[9px] text-stone-400 block font-medium">{evt.details}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest News */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-4.5 shadow-xs space-y-3">
              <strong className="text-[10px] font-black text-stone-400 uppercase tracking-widest block font-mono">Agricultural News</strong>
              
              <div className="space-y-3">
                {[
                  { title: "Ministry shifts fertilizer bags storage online for verification", date: "Today", category: "Policy" },
                  { title: "Kephis reports purple tea certification requests increase", date: "Yesterday", category: "Export" },
                  { title: "Met alerts dry-shelling storage necessity for grain farmers", date: "2 days ago", category: "Weather" }
                ].map((news, i) => (
                  <div key={i} className="text-xs space-y-1 border-b border-stone-50 pb-2.5 last:border-0 last:pb-0">
                    <span className="text-[8px] bg-stone-100 text-stone-500 font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">{news.category}</span>
                    <h5 className="text-[11px] text-stone-800 leading-tight font-bold mt-1">{news.title}</h5>
                    <span className="text-[9px] text-stone-400 font-mono block">{news.date}</span>
                  </div>
                ))}
              </div>
            </div>

          </aside>

        </div>

        {/* ══════════════════════════════════════════
            SUPABASE DATABASE AND RLS SCHEMA DASHBOARD PANEL
            ══════════════════════════════════════════ */}
        <AnimatePresence>
          {showRLSDashboard && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="mt-8 bg-white border border-stone-200 shadow-xl rounded-2xl p-6 text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-2">
                <div className="flex items-center gap-2 text-[#1A5438] font-bold text-sm font-serif">
                  <Database className="h-4.5 w-4.5" />
                  <span>Supabase Schema & Row-Level Security (RLS) Policies</span>
                </div>
                <button 
                  onClick={() => setShowRLSDashboard(false)}
                  className="text-xs text-stone-400 hover:text-stone-700 font-bold border border-stone-200 px-3 py-1 rounded-xl"
                >
                  Close Panel
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 font-mono text-[10px]">
                {[
                  {
                    table: "profiles",
                    fields: "id (UUID), username (text), name (text), country (text), county (text), interests (array), years_farming (int), certifications (array), reputation_score (int), followers (array)",
                    rls: `1. SELECT: Allow public read.
2. UPDATE: auth.uid() === id.
3. INSERT: Authenticated signup only.`
                  },
                  {
                    table: "posts",
                    fields: "id (UUID), author_id (UUID), title (text), body (text), category (text), images (array), video_url (text), likes (int), crops_tagged (array), livestock_tagged (array), created_at (timestamp)",
                    rls: `1. SELECT: Allow public read.
2. ALL: auth.uid() === author_id.`
                  },
                  {
                    table: "listings",
                    fields: "id (UUID), author_id (UUID), commodity (text), type (text), price (numeric), quantity (text), location (text), images (array), status (text), created_at (timestamp)",
                    rls: `1. SELECT: Allow public read.
2. ALL: auth.uid() === author_id.`
                  },
                  {
                    table: "messages",
                    fields: "id (UUID), channel_id (text), sender (text), text (text), timestamp (text), read (boolean)",
                    rls: `1. SELECT: Allow authenticated users in channel.
2. INSERT: sender === auth.username.`
                  }
                ].map((schema, idx) => (
                  <div key={idx} className="bg-stone-50 border border-stone-200/50 p-4 rounded-xl space-y-2 text-stone-600">
                    <span className="text-[#1A5438] font-bold block border-b border-stone-150 pb-1 uppercase tracking-wider">
                      Table: {schema.table}
                    </span>
                    <div>
                      <strong className="text-stone-400 block uppercase text-[8px] tracking-widest font-mono">Columns:</strong>
                      <p className="text-stone-700 leading-relaxed mt-0.5 font-mono">{schema.fields}</p>
                    </div>
                    <div>
                      <strong className="text-stone-400 block uppercase text-[8px] tracking-widest font-mono">RLS Constraints:</strong>
                      <pre className="text-emerald-700 mt-1 whitespace-pre-wrap leading-normal font-sans text-[9px]">
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
    </AppLayout>
  );
}
