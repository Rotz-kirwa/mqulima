import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState, useMemo, useEffect, useRef } from "react";
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
  LogIn,
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
  Sparkle,
  ShoppingBag,
  Edit,
  BellOff,
  Camera,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  Stethoscope,
  PhoneCall,
  Flame,
  Phone,
  Mail,
  Info,
  Smile,
  CheckCheck,
  CheckCircle2,
  Filter,
  SlidersHorizontal,
  Trash2,
  Paperclip
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getForumSnapshot,
  getCurrentFarmerProfile,
  updateFarmerProfile,
  createCommunityPost,
  createComment,
  toggleLikePost,
  toggleBookmarkPost,
  deleteCommunityPost,
  deleteComment,
  reportCommunityContent,
  createSokoListing,
  sendDirectMessage,
  getDirectMessages,
  getCommunityNotifications,
  markCommunityNotificationRead,
  markAllCommunityNotificationsRead,
  submitForumConsultation
} from "@/lib/api/community.server";
import { getPublishedBlogPosts } from "@/lib/api/blog.server";
import { getMarketPrices } from "@/lib/api/markets.server";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";
import { AppLayout } from "@/components/mqulima/AppLayout";
import "@/styles/community-forum.css";

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
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap",
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
  natureOfAgriculture?: string;
  interests: string[];
  crops: string[];
  livestock: string[];
  yearsFarming: number;
  certifications: string[];
  reputationScore: number;
  followersCount: number;
  followers: string[];
  avatarUrl?: string;
  coverImage?: string;
  bio?: string;
  website?: string;
  phone?: string;
  email?: string;
  farmingActivities?: string;
  farmingPhotos?: string[];
  joinedDate?: string;
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
  comments: { id?: string; authorName: string; text: string; time: string; author?: any; body?: string; createdAt?: string }[];
  cropsTagged: string[];
  livestockTagged: string[];
  location: string;
  createdAt: string;
};

type SokoListing = {
  id: string;
  author: FarmerProfile;
  commodity: string;
  type: "crop" | "livestock" | "fruit";
  price: number;
  quantity: string;
  location: string;
  images: string[];
  description: string;
  phone?: string;
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
  image?: string;
};

type ChatSession = {
  id: string;
  name: string;
  isGroup: boolean;
  farmer?: FarmerProfile;
  log: ChatMessage[];
  unreadCount?: number;
};

// Seed Databases
const defaultGuestFarmer: FarmerProfile = {
  username: "@mqulima_farmer",
  name: "Mqulima Farmer",
  country: "Kenya",
  county: "Uasin Gishu",
  interests: ["Smart Agriculture"],
  crops: [],
  livestock: [],
  yearsFarming: 1,
  certifications: [],
  reputationScore: 100,
  followersCount: 0,
  followers: [],
  avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Mqulima%20Farmer&backgroundColor=1a5438&textColor=ffffff",
  coverImage: ""
};

const initialFarmers: FarmerProfile[] = [];
const initialCommunityPosts: CommunityPost[] = [];
const initialSokoListings: SokoListing[] = [];
const initialPulsePosts: PulsePost[] = [];

function isUsernameMatch(u1?: string | null, u2?: string | null): boolean {
  if (!u1 || !u2) return false;
  const c1 = u1.replace(/^@/, "").trim().toLowerCase();
  const c2 = u2.replace(/^@/, "").trim().toLowerCase();
  return c1 === c2;
}

function isPostByFarmer(post: CommunityPost, farmer?: FarmerProfile | null): boolean {
  if (!post || !post.author || !farmer) return false;
  if (isUsernameMatch(post.author.username, farmer.username)) return true;
  if (post.author.name && farmer.name && post.author.name.trim().toLowerCase() === farmer.name.trim().toLowerCase()) return true;
  return false;
}

function ForumSubdomainPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [subpage, setSubpageState] = useState<"posts" | "soko" | "consult" | "konnekt" | "saved" | "profile" | "network">("posts");

  const setSubpage = (page: "posts" | "soko" | "consult" | "konnekt" | "saved" | "profile" | "network") => {
    setSubpageState(page);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("mq_community_subpage", page);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", page);
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["posts", "soko", "consult", "konnekt", "saved", "profile", "network"].includes(tab)) {
        setSubpageState(tab as any);
      }

      const handlePopState = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab && ["posts", "soko", "consult", "konnekt", "saved", "profile", "network"].includes(tab)) {
          setSubpageState(tab as any);
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, []);

  // Farmers Network Directory state
  const [networkSearch, setNetworkSearch] = useState("");
  const [networkCountyFilter, setNetworkCountyFilter] = useState("all");
  const [networkFocusFilter, setNetworkFocusFilter] = useState("all");

  // Messenger features state
  const [mobileChatView, setMobileChatView] = useState<"list" | "chat">("list");
  const [chatImageAttachment, setChatImageAttachment] = useState<string | null>(null);
  const [showPartnerDrawer, setShowPartnerDrawer] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageReactions, setMessageReactions] = useState<{ [msgId: string]: string }>({});

  // Mqulima Consult State & Modal
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultName, setConsultName] = useState("");
  const [consultPhone, setConsultPhone] = useState("");
  const [consultEmail, setConsultEmail] = useState("");
  const [consultCounty, setConsultCounty] = useState("Uasin Gishu");
  const [consultSpecialty, setConsultSpecialty] = useState("Crop & Soil Agronomy");
  const [consultChannel, setConsultChannel] = useState<"call" | "whatsapp" | "visit">("whatsapp");
  const [consultUrgency, setConsultUrgency] = useState<"normal" | "urgent" | "emergency">("normal");
  const [consultMessage, setConsultMessage] = useState("");
  const [consultSubmittedTicket, setConsultSubmittedTicket] = useState<any | null>(null);
  const [isSubmittingConsult, setIsSubmittingConsult] = useState(false);

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultPhone || !consultMessage) {
      toast.error("Please provide a phone number and describe your farm issue.");
      return;
    }

    setIsSubmittingConsult(true);
    try {
      const csrfToken = getCsrfTokenFromCookie();
      const clientName = consultName || currentUser?.name || "Farmer Client";
      const clientEmail = consultEmail || currentUser?.email || "";
      const clientCounty = consultCounty || currentUser?.county || "Uasin Gishu";

      const res = await submitForumConsultation({
        data: {
          name: clientName,
          phone: consultPhone,
          email: clientEmail,
          county: clientCounty,
          specialty: consultSpecialty,
          channel: consultChannel,
          urgency: consultUrgency,
          message: consultMessage,
          csrfToken
        }
      });

      const ticketId = res.ticketId;
      const ticket = {
        id: ticketId,
        name: clientName,
        phone: consultPhone,
        email: clientEmail || "Not provided",
        county: clientCounty,
        specialty: consultSpecialty,
        channel: consultChannel,
        urgency: consultUrgency,
        message: consultMessage,
        assignedConsultant: consultSpecialty.includes("Livestock") 
          ? "Mqulima Veterinary Extension Desk" 
          : consultSpecialty.includes("Irrigation")
          ? "Mqulima Irrigation Engineering Team"
          : "Mqulima Senior Agronomy Helpdesk",
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConsultSubmittedTicket(ticket);
      setIsSubmittingConsult(false);
      toast.success(`Consultation dispatch ${ticketId} registered! Details forwarded to Admin Desk.`);
    } catch (err: any) {
      setIsSubmittingConsult(false);
      console.error("Consultation submission error:", err);
      toast.error(err?.message || "Failed to transmit consultation ticket. Please try again.");
    }
  };

  // Database States
  const [farmers, setFarmers] = useState<FarmerProfile[]>(initialFarmers);
  const [posts, setPosts] = useState<CommunityPost[]>(initialCommunityPosts);
  const [sokoListings, setSokoListings] = useState<SokoListing[]>(initialSokoListings);
  const [pulsePosts, setPulsePosts] = useState<PulsePost[]>(initialPulsePosts);
  const [communityDataSource, setCommunityDataSource] = useState<"loading" | "database" | "curated">("loading");
  const [realNewsPosts, setRealNewsPosts] = useState<any[]>([]);

  // Active viewing profile username & tab navigation states
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<"posts" | "about" | "farm" | "products" | "media">("posts");
  
  // Social Follow state tracking with validation against live farmers
  const [followedUsernames, setFollowedUsernames] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mqulima_followed_users");
        // Clear old testing fallback strings if present
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const validFollowedUsernames = useMemo(() => {
    return followedUsernames.filter((u) =>
      farmers.some((f) => {
        const fUser = f.username.startsWith("@") ? f.username : `@${f.username}`;
        return fUser.toLowerCase() === u.toLowerCase();
      })
    );
  }, [followedUsernames, farmers]);

  // Custom dropdown / panels states
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [socialModalType, setSocialModalType] = useState<"followers" | "following" | null>(null);
  
  // Registration Profile State
  const [currentUser, setCurrentUser] = useState<FarmerProfile | null>(null);
  const [isRegisteringProfile, setIsRegisteringProfile] = useState(false);
  
  // Auth Required Modal State
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState("participate in discussions");

  const requireAuth = (reason: string = "interact with the community"): boolean => {
    if (!currentUser) {
      setAuthModalReason(reason);
      setIsAuthRequiredModalOpen(true);
      return false;
    }
    return true;
  };

  const handleToggleFollow = async (targetUsername: string) => {
    if (!requireAuth("follow other farmers in the community")) return;

    const cleanUsername = targetUsername.startsWith("@") ? targetUsername : `@${targetUsername}`;
    const isCurrentlyFollowing = followedUsernames.includes(cleanUsername);
    const newFollowedList = isCurrentlyFollowing
      ? followedUsernames.filter((u) => u !== cleanUsername)
      : [...followedUsernames, cleanUsername];

    setFollowedUsernames(newFollowedList);
    if (typeof window !== "undefined") {
      localStorage.setItem("mqulima_followed_users", JSON.stringify(newFollowedList));
    }

    // Dynamically update followersCount in farmers state
    setFarmers((prevFarmers: FarmerProfile[]) =>
      prevFarmers.map((f: FarmerProfile) => {
        if (f.username.toLowerCase() === cleanUsername.toLowerCase()) {
          const delta = isCurrentlyFollowing ? -1 : 1;
          return {
            ...f,
            followersCount: Math.max(0, (f.followersCount || 0) + delta),
            followers: isCurrentlyFollowing
              ? (f.followers || []).filter((u: string) => u !== currentUser?.username)
              : [...(f.followers || []), currentUser?.username || "@user"],
          };
        }
        return f;
      })
    );

    toast.success(
      isCurrentlyFollowing
        ? `You unfollowed ${cleanUsername}`
        : `🎉 You are now following ${cleanUsername}!`
    );

    try {
      const csrfToken = getCsrfTokenFromCookie();
      const { toggleFollowFarmer } = await import("../lib/api/community.server");
      await toggleFollowFarmer({
        data: {
          targetUsername: cleanUsername,
          csrfToken,
        },
      });
    } catch {
      // Fallback silently if offline or unauthenticated
    }
  };
  
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
  const [regBio, setRegBio] = useState("");
  const [regWebsite, setRegWebsite] = useState("");
  const [regAvatarUrl, setRegAvatarUrl] = useState("");
  const [regCoverImage, setRegCoverImage] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCrops, setRegCrops] = useState("");
  const [regLivestock, setRegLivestock] = useState("");
  const [regFarmingActivities, setRegFarmingActivities] = useState("");
  const [regFarmingPhotos, setRegFarmingPhotos] = useState<string[]>([]);

  // Search, Sidebar & Tab filters
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(["armyworm", "organic pesticide", "drip irrigation", "kiambu"]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [feedFilterTab, setFeedFilterTab] = useState<"trending" | "latest" | "near_you">("latest");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  // Post Creation & Modal States
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postAudience, setPostAudience] = useState<"Everyone" | "Mqulima Community">("Everyone");
  const [showEmojiShortcutBar, setShowEmojiShortcutBar] = useState(false);

  const [createBody, setCreateBody] = useState("");
  const [createCategory, setCreateCategory] = useState<"Farm Progress" | "Harvest Update" | "Farming Tips" | "Question" | "Success Story">("Farm Progress");
  const [createImagesText, setCreateImagesText] = useState("");
  const [createVideoUrl, setCreateVideoUrl] = useState("");
  const [createLocation, setCreateLocation] = useState("Eldoret, Uasin Gishu");
  const [createCrops, setCreateCrops] = useState("");
  const [createLivestock, setCreateLivestock] = useState("");
  const [showMediaFields, setShowMediaFields] = useState(false);
  const [showTagFields, setShowTagFields] = useState(false);

  // Device file attachment states
  const [postMediaFiles, setPostMediaFiles] = useState<{ url: string; name: string; type: "image" | "video" }[]>([]);
  const [sokoMediaFiles, setSokoMediaFiles] = useState<{ url: string; name: string }[]>([]);

  // Load post draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDraft = localStorage.getItem("mqulima_post_draft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.body) setCreateBody(parsed.body);
          if (parsed.category) setCreateCategory(parsed.category);
          if (parsed.crops) setCreateCrops(parsed.crops);
          if (parsed.livestock) setCreateLivestock(parsed.livestock);
          if (parsed.location) setCreateLocation(parsed.location);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, []);

  // Save post draft to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (createBody.trim() || createCrops || createLivestock) {
        localStorage.setItem("mqulima_post_draft", JSON.stringify({
          body: createBody,
          category: createCategory,
          crops: createCrops,
          livestock: createLivestock,
          location: createLocation
        }));
      }
    }
  }, [createBody, createCategory, createCrops, createLivestock, createLocation]);

  const clearPostDraft = () => {
    setCreateBody("");
    setCreateCrops("");
    setCreateLivestock("");
    setCreateImagesText("");
    setCreateVideoUrl("");
    setPostMediaFiles([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mqulima_post_draft");
    }
    toast.info("Draft cleared.");
  };

  // Device file upload handler for forum posts
  const handlePostMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let hasErrors = false;
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum file size is 10MB.`);
        hasErrors = true;
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const isVideo = file.type.startsWith("video/");
        setPostMediaFiles((prev) => [
          ...prev,
          {
            url: base64String,
            name: file.name,
            type: isVideo ? "video" : "image"
          }
        ]);
        toast.success(`Attached ${file.name} from your device`);
      };
      reader.readAsDataURL(file);
    });

    if (!hasErrors) {
      setShowMediaFields(true);
    }
    e.target.value = "";
  };


  const handleRemovePostMedia = (index: number) => {
    setPostMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Soko Listing States
  const [isListingSoko, setIsListingSoko] = useState(false);
  const [sokoCommodity, setSokoCommodity] = useState("");
  const [sokoType, setSokoType] = useState<"crop" | "livestock" | "fruit">("crop");
  const [sokoPrice, setSokoPrice] = useState("");
  const [sokoQty, setSokoQty] = useState("");
  const [sokoLoc, setSokoLoc] = useState("");
  const [sokoDesc, setSokoDesc] = useState("");
  const [sokoImgText, setSokoImgText] = useState("");
  const [sokoPhone, setSokoPhone] = useState("");

  // Soko Filters
  const [sokoSearch, setSokoSearch] = useState("");
  const [sokoTypeFilter, setSokoTypeFilter] = useState<"all" | "crop" | "livestock" | "fruit">("all");
  const [sokoCountyFilter, setSokoCountyFilter] = useState("all");
  const [sokoMaxPrice, setSokoMaxPrice] = useState<number>(20000);

  // Pulse Post creator
  const [isPostingPulse, setIsPostingPulse] = useState(false);
  const [pulseTitle, setPulseTitle] = useState("");
  const [pulseContent, setPulseContent] = useState("");
  const [pulseCategory, setPulseCategory] = useState<"Market Trend" | "Weather Alert" | "Policy Update" | "Agronomy Alert">("Market Trend");
  const [pulseSource, setPulseSource] = useState("");

  // Notifications List & Unread Counter
  const [notifications, setNotifications] = useState<any[]>([]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Konnekt messaging states
  const [activeChatId, setActiveChatId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<ChatSession[]>([]);

  // Offline / Network Simulator States
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<{ chatId: string; text: string; timestamp: string }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRLSDashboard, setShowRLSDashboard] = useState(false);

  // Commodity price billboard loaded from database
  const [billboardPrices, setBillboardPrices] = useState<{ crop: string; region: string; price: number; prevPrice: number }[]>([]);

  const reloadForum = () => {
    getForumSnapshot()
      .then((snapshot) => {
        if (snapshot.showPosts && snapshot.showPosts.length > 0) {
          const mappedPosts: CommunityPost[] = (snapshot.showPosts as any[]).map(sp => {
            const authorRecord = {
              username: "@mqulima_guest",
              name: "Guest Farmer",
              country: "Kenya",
              county: "Nakuru",
              interests: [],
              crops: [],
              livestock: [],
              yearsFarming: 0,
              certifications: [],
              reputationScore: 0,
              followersCount: 0,
              followers: [],
              avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Guest%20Farmer&backgroundColor=1a5438&textColor=ffffff",
              coverImage: null,
              ...sp.author
            };
            return {
              id: sp.id,
              author: authorRecord,
              title: sp.title || "Farm update",
              body: sp.body,
              category: (sp.category || "Farm Progress") as any,
              images: sp.images || [],
              likes: sp.likes || 0,
              hasLiked: sp.hasLiked,
              comments: sp.comments || [],
              cropsTagged: sp.tags || [],
              livestockTagged: [],
              location: sp.author.county || "Kenya",
              createdAt: sp.createdAt || "Recently"
            };
          });
          setPosts(mappedPosts);
        } else {
          setPosts([]);
        }
        
        if (snapshot.sokoListings && snapshot.sokoListings.length > 0) {
          const mappedSoko: SokoListing[] = (snapshot.sokoListings as any[]).map(sl => {
            const authorRecord = {
              username: "@mqulima_guest",
              name: "Guest Farmer",
              country: "Kenya",
              county: "Nakuru",
              interests: [],
              crops: [],
              livestock: [],
              yearsFarming: 0,
              certifications: [],
              reputationScore: 0,
              followersCount: 0,
              followers: [],
              avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Guest%20Farmer&backgroundColor=1a5438&textColor=ffffff",
              coverImage: null,
              ...sl.author
            };
            return {
              ...sl,
              author: authorRecord
            };
          });
          setSokoListings(mappedSoko);
        } else {
          setSokoListings([]);
        }

        if (snapshot.pulsePosts && snapshot.pulsePosts.length > 0) {
          setPulsePosts(snapshot.pulsePosts as PulsePost[]);
        } else {
          setPulsePosts([]);
        }

        if (snapshot.suggestedFarmers && snapshot.suggestedFarmers.length > 0) {
          setFarmers(snapshot.suggestedFarmers as FarmerProfile[]);
        } else {
          setFarmers([]);
        }
        setCommunityDataSource("database");
      })
      .catch((e) => {
        console.error("Error loading forum snapshot:", e);
      });
  };

  // Sync DB snapshot and load live market prices
  useEffect(() => {
    let cancelled = false;

    getMarketPrices()
      .then((data) => {
        if (cancelled) return;
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
      })
      .catch((e) => {
        console.error("Error loading market prices:", e);
      });

    reloadForum();

    getCurrentFarmerProfile().then((profile) => {
      if (cancelled) return;
      if (profile) {
        setCurrentUser(profile as FarmerProfile);
      } else if (authUser) {
        setCurrentUser({
          username: `@${(authUser.name || "farmer").toLowerCase().replace(/\s+/g, "_")}`,
          name: authUser.name || "Mqulima Farmer",
          country: "Kenya",
          county: authUser.county || "Kenya",
          natureOfAgriculture: "",
          interests: [],
          crops: authUser.crops ? authUser.crops.split(",").map(s => s.trim()) : [],
          livestock: authUser.livestock ? authUser.livestock.split(",").map(s => s.trim()) : [],
          yearsFarming: 0,
          certifications: [],
          reputationScore: 0,
          followersCount: 0,
          followers: [],
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.name || "Farmer")}&backgroundColor=1a5438&textColor=ffffff`,
          coverImage: "",
          bio: "",
          website: "",
          phone: "",
          email: authUser.email || "",
          farmingActivities: "",
          farmingPhotos: [],
          joinedDate: "2024-01-01"
        });
      } else {
        setCurrentUser(null);
      }
    }).catch(() => {
      if (!cancelled && authUser) {
        setCurrentUser({
          username: `@${(authUser.name || "farmer").toLowerCase().replace(/\s+/g, "_")}`,
          name: authUser.name || "Mqulima Farmer",
          country: "Kenya",
          county: authUser.county || "Kenya",
          natureOfAgriculture: "",
          interests: [],
          crops: authUser.crops ? authUser.crops.split(",").map(s => s.trim()) : [],
          livestock: authUser.livestock ? authUser.livestock.split(",").map(s => s.trim()) : [],
          yearsFarming: 0,
          certifications: [],
          reputationScore: 0,
          followersCount: 0,
          followers: [],
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.name || "Farmer")}&backgroundColor=1a5438&textColor=ffffff`,
          coverImage: "",
          bio: "",
          website: "",
          phone: "",
          email: authUser.email || "",
          farmingActivities: "",
          farmingPhotos: [],
          joinedDate: "2024-01-01"
        });
      }
    });

    getCommunityNotifications()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(() => {
        // Silently catch for unauthenticated/guest state
      });

    getPublishedBlogPosts()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setRealNewsPosts(data);
        }
      })
      .catch((e) => console.error("Error loading blog posts:", e));

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  // Poll & sync direct messages from PostgreSQL database
  useEffect(() => {
    if (!currentUser) return;
    const activeChat = chats.find(c => c.id === activeChatId);
    const recipientUsername = activeChat?.farmer?.username;

    const syncMessages = async () => {
      // Pause polling if document is hidden or if not in messaging context
      if (typeof document !== "undefined" && document.hidden) return;
      if (subpage !== "konnekt" && !activeChatId) return;

      try {
        const res = await getDirectMessages({
          data: {
            otherUsername: recipientUsername || undefined
          }
        });

        if (res.conversations && res.conversations.length > 0) {
          setChats(prev => {
            const merged = [...prev];
            for (const dbConv of res.conversations) {
              const existingIdx = merged.findIndex(c => c.farmer?.username === dbConv.farmer.username);
              if (existingIdx >= 0) {
                merged[existingIdx] = {
                  ...merged[existingIdx],
                  farmer: dbConv.farmer,
                  unreadCount: dbConv.unreadCount
                };
              } else {
                merged.push({
                  id: dbConv.id,
                  name: dbConv.name,
                  isGroup: false,
                  farmer: dbConv.farmer,
                  unreadCount: dbConv.unreadCount,
                  log: []
                });
              }
            }
            return merged;
          });
        }

        if (res.messages && res.messages.length > 0 && activeChatId) {
          setChats(prev => prev.map(c => {
            if (c.id === activeChatId) {
              return {
                ...c,
                log: res.messages
              };
            }
            return c;
          }));
        }
      } catch (err) {
        // Silent catch for background polling
      }
    };

    syncMessages();
    const interval = setInterval(syncMessages, subpage === "konnekt" ? 3000 : 10000);
    return () => clearInterval(interval);
  }, [currentUser, activeChatId, subpage]);


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



  // Update dynamic scores
  const activeFarmers = useMemo(() => {
    return farmers.map(farmer => {
      const pCount = posts.filter(p => isPostByFarmer(p, farmer)).length;
      const lCount = posts.filter(p => isPostByFarmer(p, farmer)).reduce((acc, curr) => acc + curr.likes, 0);
      const sCount = sokoListings.filter(s => isUsernameMatch(s.author.username, farmer.username)).length;
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
      return activeFarmers.find(f => isUsernameMatch(f.username, selectedProfileUsername)) || null;
    }
    return currentUser ? {
      ...currentUser,
      reputationScore: activeFarmers.find(f => isUsernameMatch(f.username, currentUser.username))?.reputationScore || currentUser.reputationScore
    } : null;
  }, [selectedProfileUsername, currentUser, activeFarmers]);

  const viewingFarmerFollowersList = useMemo(() => {
    if (!viewingFarmer) return [];
    const cleanViewingUsername = viewingFarmer.username.startsWith("@") ? viewingFarmer.username : `@${viewingFarmer.username}`;
    
    // Find all active farmers who follow viewingFarmer
    const followers = activeFarmers.filter(f => {
      if (f.username === viewingFarmer.username) return false;
      const cleanFUser = f.username.startsWith("@") ? f.username : `@${f.username}`;
      return f.followers?.some(u => u.toLowerCase() === viewingFarmer.username.toLowerCase() || u.toLowerCase() === cleanViewingUsername.toLowerCase());
    });

    // If currentUser is following viewingFarmer and not already in array, add currentUser
    if (currentUser && currentUser.username !== viewingFarmer.username) {
      const isCurrentFollowing = validFollowedUsernames.some(u => u.toLowerCase() === cleanViewingUsername.toLowerCase());
      if (isCurrentFollowing && !followers.some(f => f.username === currentUser.username)) {
        followers.unshift(currentUser);
      }
    }

    return followers;
  }, [viewingFarmer, activeFarmers, currentUser, validFollowedUsernames]);

  const viewingFarmerFollowingList = useMemo(() => {
    if (!viewingFarmer) return [];
    if (viewingFarmer.username === currentUser?.username) {
      return activeFarmers.filter(f =>
        validFollowedUsernames.some(u => u.toLowerCase() === f.username.toLowerCase() || u.toLowerCase() === `@${f.username.replace(/^@/, '')}`.toLowerCase())
      );
    }
    return [];
  }, [viewingFarmer, activeFarmers, currentUser, validFollowedUsernames]);
  // Notification Handlers
  const handleNotificationClick = async (notif: any) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setIsNotifOpen(false);

    const csrfToken = getCsrfTokenFromCookie();
    markCommunityNotificationRead({
      data: { notificationId: notif.id, csrfToken }
    }).catch(() => {});

    if (notif.linkType === "chat" || notif.type === "message") {
      setSubpage("konnekt");
      if (notif.senderUsername) {
        const partner = farmers.find(f => f.username.toLowerCase() === notif.senderUsername.toLowerCase());
        if (partner) {
          handleStartChat(partner);
        }
      }
    } else if (notif.linkType === "post" || notif.postId) {
      setSubpage("posts");
      if (notif.postId) {
        setTimeout(() => {
          const el = document.getElementById(`post-${notif.postId}`);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const csrfToken = getCsrfTokenFromCookie();
    markAllCommunityNotificationsRead({
      data: { csrfToken }
    }).catch(() => {});
  };



  // Share Profile Link Handler
  const handleShareProfile = (farmer: FarmerProfile) => {
    const profileUrl = `${window.location.origin}/community?tab=profile&user=${farmer.username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      toast.success(`Copied ${farmer.name}'s profile link to clipboard!`);
    } else {
      toast.info(`Profile link: ${profileUrl}`);
    }
  };

  // Handle profile image file changes (base64 reader & auto-save)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const csrfToken = getCsrfTokenFromCookie();

      if (type === "avatar") {
        setRegAvatarUrl(base64String);
        if (currentUser) {
          setCurrentUser(prev => prev ? { ...prev, avatarUrl: base64String } : null);
          setFarmers(prev => prev.map(f => f.username === currentUser.username ? { ...f, avatarUrl: base64String } : f));
          try {
            toast.loading("Saving avatar...");
            const res = await updateFarmerProfile({
              data: {
                name: currentUser.name,
                username: currentUser.username,
                county: currentUser.county || "Kenya",
                bio: currentUser.bio || "",
                website: currentUser.website || "",
                avatarUrl: base64String,
                coverImage: currentUser.coverImage || "",
                phone: currentUser.phone || "",
                email: currentUser.email || "",
                farmingActivities: currentUser.farmingActivities || "",
                farmingPhotos: currentUser.farmingPhotos || [],
                csrfToken
              }
            });
            toast.dismiss();
            if (res.success) {
              toast.success("Profile avatar updated successfully!");
              reloadForum();
            }
          } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "Failed to save avatar");
          }
        }
      } else {
        setRegCoverImage(base64String);
        if (currentUser) {
          setCurrentUser(prev => prev ? { ...prev, coverImage: base64String } : null);
          setFarmers(prev => prev.map(f => f.username === currentUser.username ? { ...f, coverImage: base64String } : f));
          try {
            toast.loading("Saving cover photo...");
            const res = await updateFarmerProfile({
              data: {
                name: currentUser.name,
                username: currentUser.username,
                county: currentUser.county || "Kenya",
                bio: currentUser.bio || "",
                website: currentUser.website || "",
                avatarUrl: currentUser.avatarUrl || "",
                coverImage: base64String,
                phone: currentUser.phone || "",
                email: currentUser.email || "",
                farmingActivities: currentUser.farmingActivities || "",
                farmingPhotos: currentUser.farmingPhotos || [],
                csrfToken
              }
            });
            toast.dismiss();
            if (res.success) {
              toast.success("Cover photo updated successfully!");
              reloadForum();
            }
          } catch (err: any) {
            toast.dismiss();
            toast.error(err.message || "Failed to save cover photo");
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Edit/Register profile submission
  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim()) {
      toast.error("Please fill in both Name and Username.");
      return;
    }

    const csrfToken = getCsrfTokenFromCookie();

    const parsedCrops = regCrops.split(",").map(c => c.trim()).filter(Boolean);
    const parsedLivestock = regLivestock.split(",").map(l => l.trim()).filter(Boolean);

    try {
      const res = await updateFarmerProfile({
        data: {
          name: regName.trim(),
          username: regUsername.trim(),
          county: regCounty,
          bio: regBio.trim(),
          website: regWebsite.trim(),
          avatarUrl: regAvatarUrl || "",
          coverImage: regCoverImage || "",
          phone: regPhone.trim(),
          email: regEmail.trim(),
          crops: parsedCrops,
          livestock: parsedLivestock,
          farmingActivities: regFarmingActivities.trim(),
          farmingPhotos: regFarmingPhotos,
          csrfToken
        }
      });
      if (res.success) {
        toast.success(`Profile updated to username: ${res.username}`);
        const updatedProfile = await getCurrentFarmerProfile();
        if (updatedProfile) {
          setCurrentUser(updatedProfile);
        }
        setIsRegisteringProfile(false);
        reloadForum();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile. Are you logged in?");
    }
  };

  // Pre-populate profile editing forms
  useEffect(() => {
    if (currentUser) {
      setRegName(currentUser.name || "");
      setRegUsername(currentUser.username || "");
      setRegCounty(currentUser.county || "");
      setRegBio(currentUser.bio || "");
      setRegWebsite(currentUser.website || "");
      setRegAvatarUrl(currentUser.avatarUrl || "");
      setRegCoverImage(currentUser.coverImage || "");
      setRegPhone(currentUser.phone || "");
      setRegEmail(currentUser.email || "");
      setRegCrops((currentUser.crops || []).join(", "));
      setRegLivestock((currentUser.livestock || []).join(", "));
      setRegFarmingActivities(currentUser.farmingActivities || "");
      setRegFarmingPhotos(currentUser.farmingPhotos || []);
    }
  }, [currentUser]);

  // Create Post Handler
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth("create community posts")) {
      setIsPostComposerOpen(false);
      return;
    }
    if (!createBody.trim()) {
      toast.error("Please enter some text for your post.");
      return;
    }

    setIsSubmittingPost(true);
    const csrfToken = getCsrfTokenFromCookie();
    const typedImages = createImagesText.split(",").map(url => url.trim()).filter(Boolean);
    const uploadedImages = postMediaFiles.filter(m => m.type === "image").map(m => m.url);
    const imagesParsed = [...uploadedImages, ...typedImages];
    const cropTags = [
      ...createCrops.split(",").map(c => c.trim()).filter(Boolean),
      ...createLivestock.split(",").map(l => l.trim()).filter(Boolean)
    ];
    if (createLocation && !cropTags.includes(`📍 ${createLocation}`)) {
      cropTags.push(`📍 ${createLocation}`);
    }

    try {
      const res = await createCommunityPost({
        data: {
          title: createBody.slice(0, 50) + (createBody.length > 50 ? "..." : ""),
          body: createBody.trim(),
          category: createCategory,
          images: imagesParsed,
          tags: cropTags,
          csrfToken
        }
      });
      if (res.success) {
        toast.success("Post published successfully!");
        
        const newPostItem: CommunityPost = {
          id: res.postId || `post_${Date.now()}`,
          author: currentUser ? {
            username: currentUser.username || "@mqulima_farmer",
            name: currentUser.name || "Mqulima Farmer",
            country: "Kenya",
            county: currentUser.county || "Kenya",
            avatarUrl: currentUser.avatarUrl,
            interests: [],
            crops: [],
            livestock: [],
            yearsFarming: 1,
            certifications: [],
            reputationScore: 10,
            followersCount: 0,
            followers: [],
            coverImage: ""
          } : {
            username: "@mqulima_farmer",
            name: "Mqulima Farmer",
            country: "Kenya",
            county: "Kenya",
            avatarUrl: defaultGuestFarmer.avatarUrl,
            interests: [],
            crops: [],
            livestock: [],
            yearsFarming: 1,
            certifications: [],
            reputationScore: 10,
            followersCount: 0,
            followers: [],
            coverImage: ""
          },
          title: createBody.slice(0, 50) + (createBody.length > 50 ? "..." : ""),
          body: createBody.trim(),
          category: createCategory as any,
          images: imagesParsed,
          likes: 0,
          hasLiked: false,
          comments: [],
          cropsTagged: cropTags,
          livestockTagged: [],
          location: currentUser?.county || "Kenya",
          createdAt: "Just now"
        };

        setPosts(prev => [newPostItem, ...prev.filter(p => p.id !== newPostItem.id)]);
        setCreateBody("");
        setCreateImagesText("");
        setCreateVideoUrl("");
        setCreateCrops("");
        setCreateLivestock("");
        setPostMediaFiles([]);
        setShowMediaFields(false);
        setShowTagFields(false);
        setIsPostComposerOpen(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("mqulima_post_draft");
        }
        setTimeout(() => reloadForum(), 600);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to share post. Are you logged in?");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Create Soko Listing Handler
  const handleCreateSokoListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sokoCommodity.trim() || !sokoPrice.trim() || !sokoQty.trim()) {
      toast.error("Please specify commodity details, pricing, and volume.");
      return;
    }

    const priceNum = parseFloat(sokoPrice.replace(/[^0-9]/g, "")) || 1000;
    const imagesParsed = sokoImgText.split(",").map(url => url.trim()).filter(Boolean);
    const csrfToken = getCsrfTokenFromCookie();

    try {
      const res = await createSokoListing({
        data: {
          commodityName: sokoCommodity.trim(),
          type: sokoType,
          price: priceNum,
          quantity: sokoQty.trim(),
          location: sokoLoc.trim() || "Unknown Location",
          description: sokoDesc.trim(),
          images: imagesParsed,
          phone: sokoPhone.trim() || "",
          csrfToken
        }
      });
      if (res.success) {
        toast.success("Commodity trade list published on Soko!");
        setIsListingSoko(false);
        setSokoCommodity("");
        setSokoPrice("");
        setSokoQty("");
        setSokoLoc("");
        setSokoDesc("");
        setSokoImgText("");
        setSokoPhone("");
        reloadForum();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to publish listing. Are you logged in?");
    }
  };

  const handleSokoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setSokoImgText(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
  const handleLikePost = async (postId: string) => {
    if (!requireAuth("like posts")) return;

    // Optimistically toggle state in UI
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const currentlyLiked = p.hasLiked;
        return {
          ...p,
          hasLiked: !currentlyLiked,
          likes: currentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1
        };
      }
      return p;
    }));

    const csrfToken = getCsrfTokenFromCookie();
    try {
      const res = await toggleLikePost({
        data: {
          postId,
          csrfToken
        }
      });
      if (res && res.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              hasLiked: res.liked
            };
          }
          return p;
        }));
      }
    } catch (err: any) {
      // Revert state on error
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const currentlyLiked = p.hasLiked;
          return {
            ...p,
            hasLiked: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1
          };
        }
        return p;
      }));
      toast.error(err.message || "Failed to update like. Are you logged in?");
    }
  };

  // Bookmark/Save Toggle Handler
  const handleSavePost = async (postId: string) => {
    if (!requireAuth("bookmark posts")) return;
    const csrfToken = getCsrfTokenFromCookie();
    try {
      const res = await toggleBookmarkPost({
        data: {
          postId,
          csrfToken
        }
      });
      if (res.success) {
        toast.success(res.saved ? "Post saved to bookmarks" : "Post removed from bookmarks");
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, hasSaved: res.saved } : p));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save post. Are you logged in?");
    }
  };

  // Delete Post Handler
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const csrfToken = getCsrfTokenFromCookie();
    try {
      const res = await deleteCommunityPost({
        data: { postId, csrfToken }
      });
      if (res.success) {
        toast.success("Post removed.");
        reloadForum();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post.");
    }
  };

  // Delete Comment Handler
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const csrfToken = getCsrfTokenFromCookie();
    try {
      const res = await deleteComment({
        data: { commentId, csrfToken }
      });
      if (res.success) {
        toast.success("Comment removed.");
        reloadForum();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete comment.");
    }
  };

  // Report Submission Handler
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportContentType, setReportContentType] = useState<"post" | "comment" | "profile">("post");
  const [reportContentId, setReportContentId] = useState<string>("");
  const [reportReason, setReportReason] = useState<"spam" | "harassment" | "false_information" | "scam" | "inappropriate_content" | "violence" | "copyright" | "other">("spam");
  const [reportDetails, setReportDetails] = useState("");

  const handleOpenReport = (type: "post" | "comment" | "profile", id: string) => {
    if (!requireAuth("report content")) return;
    setReportContentType(type);
    setReportContentId(id);
    setReportReason("spam");
    setReportDetails("");
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const csrfToken = getCsrfTokenFromCookie();
    try {
      const res = await reportCommunityContent({
        data: {
          contentType: reportContentType,
          contentId: reportContentId,
          reason: reportReason,
          details: reportDetails.trim(),
          csrfToken
        }
      });
      if (res.success) {
        toast.success("Report submitted. Our moderation team will review this promptly.");
        setReportModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report.");
    }
  };

  // Lightbox Image State
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Comment reply state
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);

  // Direct Message Sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth("send messages")) return;
    if (!chatInput.trim() && !chatImageAttachment) return;

    const senderHandle = currentUser ? currentUser.username : "@mqulima_guest";
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (!isOnline) {
      setOfflineQueue(prev => [...prev, { chatId: activeChatId, text: chatInput.trim() || "📷 Photo", timestamp: timeStr }]);
      setChatInput("");
      setChatImageAttachment(null);
      toast.warning("Message queued locally. It will sync once internet is restored.");
      return;
    }

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: senderHandle,
      text: chatInput.trim(),
      timestamp: timeStr,
      read: false,
      image: chatImageAttachment || undefined
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

    const activeChat = chats.find(c => c.id === activeChatId);
    const recipientUsername = activeChat?.farmer?.username;

    if (recipientUsername) {
      const csrfToken = getCsrfTokenFromCookie();
      sendDirectMessage({
        data: {
          recipientUsername,
          body: chatInput.trim(),
          imageUrl: chatImageAttachment || undefined,
          csrfToken
        }
      }).catch(err => {
        toast.error("Failed to sync message to server: " + (err.message || "Unknown error"));
      });
    }

    setChatInput("");
    setChatImageAttachment(null);
  };

  const handleStartChat = (farmer: FarmerProfile) => {
    if (!requireAuth(`chat with ${farmer.name}`)) return;
    if (farmer.username === currentUser?.username) {
      toast.info("You cannot start a direct chat with yourself.");
      return;
    }
    const existing = chats.find(c => !c.isGroup && c.farmer?.username === farmer.username);
    if (existing) {
      setActiveChatId(existing.id);
    } else {
      const newChatId = `dm_${Date.now()}`;
      const newChat: ChatSession = {
        id: newChatId,
        name: farmer.name,
        isGroup: false,
        farmer,
        log: []
      };
      setChats(prev => [...prev, newChat]);
      setActiveChatId(newChatId);
    }
    setMobileChatView("chat");
    setSubpage("konnekt");
    setSelectedProfileUsername(null);
    toast.success(`Opened 1-on-1 chat with ${farmer.name}`);
  };

  // Add Comment Handler
  const handleAddComment = async (postId: string) => {
    if (!requireAuth("comment on posts")) return;
    if (!commentInput.trim()) return;

    const textToSubmit = commentInput.trim();
    const parentId = replyToCommentId || undefined;
    const authorName = currentUser ? (currentUser.name || "Mqulima Farmer") : "Mqulima Farmer";
    const authorUsername = currentUser ? currentUser.username : "@mqulima_farmer";
    const avatarUrl = currentUser ? currentUser.avatarUrl : defaultGuestFarmer.avatarUrl;

    const tempCommentId = `temp_comm_${Date.now()}`;
    const newCommentItem = {
      id: tempCommentId,
      parentId: parentId || null,
      userId: currentUser ? currentUser.username || "guest" : "guest",
      authorName,
      authorUsername,
      authorAvatar: avatarUrl,
      text: textToSubmit,
      time: "Just now",
      createdAt: new Date().toISOString()
    };

    // Optimistically append comment to UI post state immediately
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newCommentItem]
        };
      }
      return p;
    }));

    setCommentInput("");
    setReplyToCommentId(null);
    toast.success("Comment published!");

    const csrfToken = getCsrfTokenFromCookie();
    try {
      const res = await createComment({
        data: {
          postId,
          parentId,
          body: textToSubmit,
          csrfToken
        }
      });
      if (res && res.success) {
        setTimeout(() => reloadForum(), 600);
      }
    } catch (err: any) {
      // Revert optimistic comment on failure
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== tempCommentId)
          };
        }
        return p;
      }));
      toast.error(err.message || "Failed to add comment. Are you logged in?");
    }
  };



  // Filter posts based on search bar & subpage selection
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Subpage category filtering
    if (subpage === "saved") {
      result = result.filter(p => p.hasSaved);
    } else if (subpage === "profile") {
      result = result.filter(p => isPostByFarmer(p, currentUser));
    }

    // Category Chip Filter
    if (selectedCategoryFilter) {
      result = result.filter(p => p.category === selectedCategoryFilter);
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
        (p.livestockTagged && p.livestockTagged.some(l => l.toLowerCase().includes(q)))
      );
    }

    // Feed Filter Tab sorting/filtering
    if (feedFilterTab === "trending") {
      result = [...result].sort((a, b) => {
        const scoreA = (a.likes || 0) + (a.comments?.length || 0);
        const scoreB = (b.likes || 0) + (b.comments?.length || 0);
        return scoreB - scoreA;
      });
    } else if (feedFilterTab === "near_you") {
      if (currentUser?.county) {
        const userCounty = currentUser.county.toLowerCase();
        result = result.filter(p => 
          (p.location && p.location.toLowerCase().includes(userCounty)) ||
          (p.author.county && p.author.county.toLowerCase().includes(userCounty))
        );
      }
    }

    return result;
  }, [posts, subpage, globalSearch, currentUser, selectedCategoryFilter, feedFilterTab, farmers]);

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

  const partner = activeChat?.farmer;  return (
    <AppLayout>
      <div 
        className="forum-page min-h-screen antialiased selection:bg-[#0B2117] selection:text-[#85CC14] relative"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", backgroundColor: '#FAFBF9' }}
      >

        {/* ══════════════════════════════════════════
            COMMUNITY PAGE HEADER & SEARCH BAR
            ══════════════════════════════════════════ */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs relative z-20">
          <div className="max-w-[1400px] mx-auto flex flex-row flex-wrap items-center justify-between gap-3 md:gap-5">
            
            {/* Header: Community Feed title */}
            <div className="text-left shrink-0">
              <h1 className="text-lg font-black text-[#0B2117] tracking-tight leading-tight" style={{ letterSpacing: '-0.02em' }}>Community Feed</h1>
              <p className="text-xs text-[#475569] font-medium hidden sm:block" style={{ marginTop: '-1px' }}>Share progress, ask questions, connect with fellow farmers</p>
            </div>

            {/* Search bar */}
            <div className="order-last md:order-none w-full md:flex-1 max-w-lg relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                ref={searchInputRef}
                placeholder="Search crops, farmers, posts..." 
                value={globalSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="mq-search pr-16"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono text-slate-400 select-none pointer-events-none hidden sm:inline-block">
                Ctrl+K
              </kbd>

              {/* Recent/Trending searches popover */}
              <AnimatePresence>
                {isSearchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-4 text-left space-y-3"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Recent Searches</span>
                      <div className="space-y-1">
                        {recentSearches.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setGlobalSearch(s);
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-left flex items-center gap-2 py-1 px-1.5 hover:bg-slate-50 rounded-lg text-xs text-slate-700 font-medium"
                          >
                            <Clock className="h-3 w-3 text-slate-400" />
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-2.5">
                      <span className="text-[10px] font-extrabold text-[#0B2117] uppercase tracking-wider block mb-1.5">Trending Topics</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["#armyworm", "#NPKsubsidy", "#avocadoExport", "#dripirrigation"].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setGlobalSearch(tag);
                              setIsSearchFocused(false);
                            }}
                            className="bg-[#EDF7E2] text-[#1A380A] border border-[#D8EBC4] text-[11px] font-bold px-2.5 py-1 rounded-full hover:bg-[#85CC14] hover:text-[#0B2117] transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions controls */}
            <div className="flex items-center gap-2 shrink-0">

              {/* New Post quick action */}
              <button
                onClick={() => {
                  if (!requireAuth("create a new post")) return;
                  setSubpage("posts");
                  setIsPostComposerOpen(true);
                  setSelectedProfileUsername(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-extrabold bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] transition-all duration-150 active:scale-[0.98] shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#0B2117] stroke-[3]" />
                <span>New Post</span>
              </button>
              
              {/* Messages tab link */}
              <button 
                onClick={() => {
                  setSubpage("konnekt");
                  setSelectedProfileUsername(null);
                }}
                className="relative p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-blue-50/60 rounded-xl transition-all duration-200"
                title="Messages"
                aria-label="Open messages"
              >
                <MessageSquare className="h-5 w-5 text-blue-600 fill-blue-600" />
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">1</span>
              </button>

              {/* Notifications panel toggle */}
              <div className="relative">
                <button 
                  onClick={() => {
                    const nextState = !isNotifOpen;
                    setIsNotifOpen(nextState);
                    if (nextState) {
                      getCommunityNotifications().then(data => {
                        if (Array.isArray(data)) setNotifications(data);
                      }).catch(() => {});
                    }
                  }}
                  className="relative p-2.5 text-[#1B4332] hover:text-[#2D6A4F] hover:bg-emerald-50/70 bg-white border border-stone-200/80 rounded-xl transition-all duration-200 shadow-2xs cursor-pointer"
                  title="Notifications"
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5 text-[#1B4332]" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-xs font-mono">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsNotifOpen(false)} 
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-200 rounded-2xl z-50 p-4 text-left space-y-3 shadow-xl"
                      >
                        <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs sm:text-sm text-stone-900 font-bold font-serif flex items-center gap-1.5">
                              <Bell className="h-4 w-4 text-[#1B4332]" />
                              <span>Notifications</span>
                            </strong>
                            {unreadNotifCount > 0 && (
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                                {unreadNotifCount} new
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {unreadNotifCount > 0 && (
                              <button 
                                onClick={handleMarkAllNotificationsRead}
                                className="text-[11px] text-[#1B4332] hover:underline font-bold cursor-pointer"
                              >
                                Mark all read
                              </button>
                            )}
                            <button 
                              onClick={() => setIsNotifOpen(false)}
                              className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                              title="Exit Notifications"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3 text-[12px] rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2 border ${
                                notif.read 
                                  ? "bg-white border-stone-150 text-stone-600 hover:bg-stone-50" 
                                  : "bg-emerald-50/60 border-emerald-200/80 text-stone-900 font-semibold hover:bg-emerald-50 shadow-2xs"
                              }`}
                            >
                              <div className="space-y-1 flex-1">
                                <p className="leading-snug text-xs font-sans text-stone-850">{notif.text}</p>
                                <span className="text-[9px] text-stone-400 block font-mono">{notif.time}</span>
                              </div>
                              {!notif.read && (
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shrink-0 mt-1 shadow-2xs" />
                              )}
                            </div>
                          ))}

                          {notifications.length === 0 && (
                            <div className="py-8 text-center text-xs text-stone-400 font-medium">
                              No notifications right now
                            </div>
                          )}
                        </div>

                        {/* Exit / Close Notifications Footer */}
                        <div className="border-t border-stone-100 pt-2 text-center">
                          <button
                            onClick={() => setIsNotifOpen(false)}
                            className="w-full py-1.5 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition flex items-center justify-center gap-1.5 font-medium cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Exit Notifications</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 hover:bg-black/[0.02] p-1.5 rounded-xl transition-all duration-200 text-left cursor-pointer"
                >
                  <div className="relative">
                    <img 
                      src={currentUser?.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=Guest&backgroundColor=1a5438&textColor=ffffff"} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full object-cover border border-black/[0.06]"
                    />
                    <span className="mq-online-dot" />
                  </div>
                  <span className="hidden sm:block text-[13px] font-semibold text-[#2D3436] max-w-[100px] truncate">{currentUser ? currentUser.name.split(' ')[0] : "Guest"}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#636E72]" />
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsProfileMenuOpen(false)} 
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 mt-2 w-60 bg-white border border-black/[0.06] rounded-2xl z-50 py-1.5 text-left overflow-hidden shadow-xl"
                        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)' }}
                      >
                        <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-between">
                          <div className="min-w-0">
                            <strong className="text-[13px] text-[#2D3436] block truncate font-semibold">{currentUser ? currentUser.name : "Guest Farmer"}</strong>
                            <span className="text-[12px] text-[#636E72] block truncate">{currentUser ? currentUser.username : "@mqulima_guest"}</span>
                          </div>
                          <button 
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg transition shrink-0"
                            title="Close Menu"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => {
                            setSubpage("profile");
                            setSelectedProfileUsername(null);
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-[13px] text-[#2D3436] hover:bg-black/[0.02] transition font-medium flex items-center gap-2.5 cursor-pointer"
                        >
                          <User className="h-4 w-4 text-[#636E72]" />
                          <span>My Profile</span>
                        </button>
                        
                        <button 
                          onClick={() => {
                            setIsRegisteringProfile(true);
                            setSubpage("profile");
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-[13px] text-[#2D3436] hover:bg-black/[0.02] transition font-medium flex items-center gap-2.5 cursor-pointer"
                        >
                          <FileText className="h-4 w-4 text-[#636E72]" />
                          <span>Settings</span>
                        </button>
                        
                        <div className="border-t border-black/[0.04] mt-1 pt-1">
                          <a 
                            href="/"
                            className="flex items-center gap-2.5 text-left px-4 py-2.5 text-[13px] text-[#E63946] hover:bg-red-50/50 transition font-medium"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Exit to Mqulima Hub</span>
                          </a>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>
        </header>

      {/* ══════════════════════════════════════════
          MAIN BODY LAYOUT
          ══════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ══════════════════════════════════════════
              LEFT SIDEBAR: QUICK NAVIGATION
              ══════════════════════════════════════════ */}
          <aside className={`space-y-5 text-left mq-hide-md-down transition-all duration-300 ${isSidebarCollapsed ? "lg:col-span-1" : "lg:col-span-3"}`} style={{ position: 'sticky', top: '88px' }}>
            


            {/* Navigation Links */}
            <div className="mq-card-static p-3 space-y-1">
              
              {/* Header with collapse button */}
              <div className="flex items-center justify-between px-3 pt-1 pb-1">
                {!isSidebarCollapsed && <p className="mq-section-label m-0">Discover</p>}
                <button 
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                  className={`p-1.5 rounded-lg hover:bg-black/[0.04] text-stone-500 hover:text-stone-850 transition ${isSidebarCollapsed ? "mx-auto" : ""}`}
                  title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
              </div>

              {[
                { 
                  id: "posts", 
                  label: "Posts", 
                  icon: MessageSquare,
                  activeClass: "bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-600 shadow-2xs",
                  activeIconClass: "text-emerald-800 fill-emerald-600/50",
                  inactiveIconClass: "text-emerald-700 fill-emerald-600/30",
                  hoverClass: "hover:bg-emerald-50/60 text-stone-700 hover:text-emerald-900"
                },
                { 
                  id: "soko", 
                  label: "Mqulima Soko", 
                  icon: ShoppingBag,
                  activeClass: "bg-amber-50 text-amber-950 font-bold border-l-4 border-amber-500 shadow-2xs",
                  activeIconClass: "text-amber-700 fill-amber-500/50",
                  inactiveIconClass: "text-amber-600 fill-amber-500/30",
                  hoverClass: "hover:bg-amber-50/60 text-stone-700 hover:text-amber-900"
                },
                { 
                  id: "consult", 
                  label: "Mqulima Consult", 
                  icon: Stethoscope,
                  activeClass: "bg-purple-50 text-purple-950 font-bold border-l-4 border-purple-600 shadow-2xs",
                  activeIconClass: "text-purple-800 fill-purple-600/50",
                  inactiveIconClass: "text-purple-600 fill-purple-600/30",
                  hoverClass: "hover:bg-purple-50/60 text-stone-700 hover:text-purple-900"
                },
              ].map((item) => {
                const isActive = subpage === item.id && !selectedProfileUsername;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSubpage(item.id as any);
                      setSelectedProfileUsername(null);
                    }}
                    className={`mq-nav-item flex items-center gap-2.5 w-full p-2.5 rounded-xl transition ${
                      isActive 
                        ? item.activeClass + " pl-2" 
                        : item.hoverClass
                    }`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <IconComponent className={`h-[18px] w-[18px] shrink-0 ${isActive ? item.activeIconClass : item.inactiveIconClass}`} />
                    {!isSidebarCollapsed && <span className="text-left flex-1 text-xs font-medium">{item.label}</span>}
                  </button>
                );
              })}

              {/* Connect Section */}
              {!isSidebarCollapsed && <p className="mq-section-label px-3 pt-3 pb-1 text-stone-400 font-mono text-[10px] uppercase font-bold tracking-wider">Connect</p>}
              {[
                { 
                  id: "network", 
                  label: "Farmers Network", 
                  icon: Users,
                  activeClass: "bg-teal-50 text-teal-950 font-bold border-l-4 border-teal-600 shadow-2xs",
                  activeIconClass: "text-teal-800 fill-teal-600/50",
                  inactiveIconClass: "text-teal-600 fill-teal-600/30",
                  hoverClass: "hover:bg-teal-50/60 text-stone-700 hover:text-teal-900"
                },
                { 
                  id: "konnekt", 
                  label: "Messages", 
                  icon: Send,
                  activeClass: "bg-blue-50 text-blue-950 font-bold border-l-4 border-blue-600 shadow-2xs",
                  activeIconClass: "text-blue-800 fill-blue-600/50",
                  inactiveIconClass: "text-blue-600 fill-blue-600/30",
                  hoverClass: "hover:bg-blue-50/60 text-stone-700 hover:text-blue-900"
                },
                { 
                  id: "saved", 
                  label: "Saved Posts", 
                  icon: Bookmark,
                  activeClass: "bg-orange-50 text-orange-950 font-bold border-l-4 border-orange-500 shadow-2xs",
                  activeIconClass: "text-orange-800 fill-orange-500/50",
                  inactiveIconClass: "text-orange-600 fill-orange-500/30",
                  hoverClass: "hover:bg-orange-50/60 text-stone-700 hover:text-orange-900"
                },
                { 
                  id: "profile", 
                  label: "Mqulima Profile", 
                  icon: User,
                  activeClass: "bg-[#EDF7E2] text-[#0B2117] font-bold border-l-4 border-[#85CC14] shadow-2xs",
                  activeIconClass: "text-[#0B2117] fill-[#85CC14]/50",
                  inactiveIconClass: "text-[#0B2117] fill-[#85CC14]/30",
                  hoverClass: "hover:bg-[#EDF7E2]/60 text-slate-700 hover:text-[#0B2117]"
                },
              ].map((item) => {
                const isActive = subpage === item.id && !selectedProfileUsername;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSubpage(item.id as any);
                      setSelectedProfileUsername(null);
                    }}
                    className={`mq-nav-item flex items-center gap-2.5 w-full p-2.5 rounded-xl transition relative ${
                      isActive 
                        ? item.activeClass + " pl-2" 
                        : item.hoverClass
                    }`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <IconComponent className={`h-[18px] w-[18px] shrink-0 ${isActive ? item.activeIconClass : item.inactiveIconClass}`} />
                    {!isSidebarCollapsed && <span className="text-left flex-1 text-xs font-medium">{item.label}</span>}
                    {item.id === "konnekt" && offlineQueue.length > 0 && (
                      <span className={`bg-blue-600 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white ${isSidebarCollapsed ? "absolute -top-1 -right-1" : "ml-auto"}`}>
                        {offlineQueue.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </aside>
          {/* ══════════════════════════════════════════
              CENTER FEED: DYNAMIC VIEWS
              ========================================== */}
          <main className={`space-y-6 transition-all duration-300 min-w-0 ${isSidebarCollapsed ? "lg:col-span-8" : "lg:col-span-6"}`}>
            {(selectedProfileUsername || subpage === "profile") && viewingFarmer && (
              <div className="space-y-6 text-left">
                
                {/* ══════════════════════════════════════════════════════════════
                    1. VISUALLY STRONG SOCIAL PROFILE HEADER (Facebook / Instagram Style)
                   ══════════════════════════════════════════════════════════════ */}
                <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-xs">
                  
                  {/* High-Resolution Cover Image with Overlay */}
                  <div className="h-44 sm:h-56 relative overflow-hidden bg-gradient-to-r from-[#0B2117] via-[#16382B] to-[#0F291E]">
                    {viewingFarmer.coverImage ? (
                      <img 
                        src={viewingFarmer.coverImage} 
                        alt="cover" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="absolute inset-0 bg-radial from-emerald-800/40 via-transparent to-black/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    
                    {/* Top Right Quick Header Actions */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                      {(!selectedProfileUsername || selectedProfileUsername === currentUser?.username) ? (
                        <>
                          <label className="bg-black/50 hover:bg-black/70 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer shadow-xs">
                            <Camera className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Change Cover</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileChange(e, "cover")} 
                            />
                          </label>
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                navigate({ to: "/auth/sign-up", search: { redirect: "/community" } as any });
                              } else {
                                setIsRegisteringProfile(!isRegisteringProfile);
                              }
                            }}
                            className="bg-white hover:bg-stone-50 text-stone-850 text-[11px] font-bold uppercase px-3.5 py-1.5 rounded-full shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5 text-[#1B4332]" />
                            <span>{isRegisteringProfile ? "Close Editor" : "Edit Profile"}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedProfileUsername(null)}
                          className="bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md transition cursor-pointer flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Close</span>
                        </button>
                      )}
                    </div>

                    {/* Cover Bottom Info Snippet */}
                    {viewingFarmer.county && (
                      <div className="absolute bottom-3 left-6 items-center justify-between text-white text-xs font-medium z-10 hidden sm:flex">
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                          <MapPin className="h-3.5 w-3.5 text-amber-400" />
                          <span>Based in <strong>{viewingFarmer.county}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Identity & Action Bar */}
                  <div className="px-6 pb-6 pt-3 relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-100 pb-5">
                      
                      {/* Avatar + Main Details */}
                      <div className="flex items-end gap-4">
                        <div className="-mt-14 sm:-mt-16 relative z-10 shrink-0">
                          <div className="relative group">
                            <img 
                              src={viewingFarmer.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(viewingFarmer.name || "User")}&backgroundColor=1a5438&textColor=ffffff`} 
                              alt="avatar" 
                              className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-4 border-white shadow-xl bg-white" 
                            />
                            <span className="mq-online-dot h-4 w-4 right-1 bottom-1 border-2 border-white" />
                            {(!selectedProfileUsername || selectedProfileUsername === currentUser?.username) && (
                              <label className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white">
                                <Camera className="h-6 w-6" />
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileChange(e, "avatar")} 
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 text-left">
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 leading-tight">
                              {viewingFarmer.name}
                            </h2>
                            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-1">
                            <span className="font-mono font-semibold text-stone-600">{viewingFarmer.username}</span>
                            <span>•</span>
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/80 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Verified Member</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Social Actions Cluster */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        {(!selectedProfileUsername || selectedProfileUsername === currentUser?.username) ? (
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                navigate({ to: "/auth/sign-up", search: { redirect: "/community" } as any });
                              } else {
                                setIsRegisteringProfile(!isRegisteringProfile);
                              }
                            }}
                            className="px-4 py-2 bg-stone-100 hover:bg-stone-200/80 text-stone-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit Social Bio</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleFollow(viewingFarmer.username)}
                              className={`px-4 py-2 text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
                                followedUsernames.includes(viewingFarmer.username.startsWith("@") ? viewingFarmer.username : `@${viewingFarmer.username}`)
                                  ? "bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              {followedUsernames.includes(viewingFarmer.username.startsWith("@") ? viewingFarmer.username : `@${viewingFarmer.username}`) ? (
                                <>
                                  <UserCheck className="h-4 w-4 text-emerald-300" />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4" />
                                  <span>Follow</span>
                                </>
                              )}
                            </button>

                            {currentUser && (
                              <button
                                onClick={() => handleStartChat(viewingFarmer)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <MessageSquare className="h-4 w-4 fill-white text-white" />
                                <span>Message</span>
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => handleShareProfile(viewingFarmer)}
                          className="p-2.5 bg-stone-100 hover:bg-stone-200/80 text-stone-700 rounded-xl transition cursor-pointer"
                          title="Share Profile"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>

                    {/* Bio Highlight */}
                    {viewingFarmer.bio && (
                      <p className="text-xs sm:text-sm text-stone-650 leading-relaxed pt-3 font-sans max-w-3xl">
                        {viewingFarmer.bio}
                      </p>
                    )}

                    {/* Social Stats Highlights Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileActiveTab("posts");
                          const postsEl = document.getElementById("profile-tabs-content");
                          if (postsEl) postsEl.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="bg-stone-50 hover:bg-stone-100/90 border border-stone-200/60 hover:border-stone-300 p-3 rounded-2xl transition cursor-pointer group text-left shadow-2xs"
                        title="Click to view published posts"
                      >
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono group-hover:text-stone-600 transition-colors">Published Posts</span>
                        <span className="text-base font-bold text-stone-850 block mt-0.5">
                          {posts.filter(p => isPostByFarmer(p, viewingFarmer)).length}
                        </span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSocialModalType("followers")}
                        className="bg-emerald-50/40 hover:bg-emerald-50/80 border border-emerald-200/60 hover:border-emerald-300 p-3 rounded-2xl transition cursor-pointer group text-left shadow-2xs"
                        title="Click to view followers list"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block font-mono group-hover:text-emerald-800 transition-colors">Followers</span>
                          <Users className="h-3.5 w-3.5 text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-base font-bold text-emerald-800 block mt-0.5">
                          {viewingFarmerFollowersList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSocialModalType("following")}
                        className="bg-stone-50 hover:bg-stone-100/90 border border-stone-200/60 hover:border-stone-300 p-3 rounded-2xl transition cursor-pointer group text-left shadow-2xs"
                        title="Click to view following list"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono group-hover:text-stone-600 transition-colors">Following</span>
                          <UserCheck className="h-3.5 w-3.5 text-stone-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-base font-bold text-stone-850 block mt-0.5">
                          {viewingFarmerFollowingList.length}
                        </span>
                      </button>
                      <div className="bg-stone-50 border border-stone-200/60 p-3 rounded-2xl">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono">Farming Focus</span>
                        <span className="text-base font-bold text-[#1B4332] truncate block" title={
                          [viewingFarmer.natureOfAgriculture, ...(viewingFarmer.crops || []), ...(viewingFarmer.livestock || []), ...(viewingFarmer.interests || [])].filter(Boolean).join(", ")
                        }>
                          {(() => {
                            const focusItems = [
                              viewingFarmer.natureOfAgriculture,
                              ...(viewingFarmer.crops || []),
                              ...(viewingFarmer.livestock || []),
                              ...(viewingFarmer.interests || [])
                            ].filter(Boolean);
                            if (focusItems.length > 0) return focusItems.slice(0, 2).join(", ");
                            if (viewingFarmer.farmingActivities?.trim()) return viewingFarmer.farmingActivities.trim();
                            return "Not Specified";
                          })()}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* ══════════════════════════════════════════════════════════════
                      2. CLEAN PROFILE NAVIGATION BAR (Tabs)
                     ══════════════════════════════════════════════════════════════ */}
                  <div className="border-t border-stone-200/80 px-4 bg-stone-50/50 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {[
                        { id: "posts", label: "Posts", icon: <MessageSquare className="h-4 w-4" />, count: posts.filter(p => isPostByFarmer(p, viewingFarmer)).length },
                        { id: "about", label: "About", icon: <User className="h-4 w-4" /> },
                        { id: "farm", label: "Farm & Crops", icon: <Sparkles className="h-4 w-4" />, count: viewingFarmer.crops.length },
                        { id: "products", label: "Products", icon: <ShoppingBag className="h-4 w-4" />, count: sokoListings.filter(s => isUsernameMatch(s.author.username, viewingFarmer.username)).length },
                        { id: "media", label: "Media", icon: <ImageIcon className="h-4 w-4" /> },
                      ].map((tab) => {
                        const isActive = profileActiveTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setProfileActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition border-b-2 whitespace-nowrap cursor-pointer ${
                              isActive
                                ? "border-[#1B4332] text-[#1B4332] bg-white shadow-2xs"
                                : "border-transparent text-stone-500 hover:text-stone-850 hover:bg-stone-100/60"
                            }`}
                          >
                            {tab.icon}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && tab.count > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-[#1B4332] text-white" : "bg-stone-200 text-stone-700"}`}>
                                {tab.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* ══════════════════════════════════════════════════════════════
                    3. TAB CONTENT VIEWS & MULTI-COLUMN DESKTOP LAYOUT
                   ══════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Quick Farmer Summary & Farm Details */}
                  <div className="lg:col-span-4 space-y-5">
                    
                    {/* Quick Info Card */}
                    <div className="bg-white border border-stone-200/80 p-5 rounded-3xl space-y-4 shadow-2xs text-left">
                      <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 font-mono">
                        Farmer Details
                      </h3>
                      
                      <div className="space-y-3 text-xs text-stone-600">
                        {viewingFarmer.natureOfAgriculture && (
                          <div className="flex items-center gap-2.5">
                            <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span>Primary Agriculture: <strong>{viewingFarmer.natureOfAgriculture}</strong></span>
                          </div>
                        )}
                        {viewingFarmer.county && (
                          <div className="flex items-center gap-2.5">
                            <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span>Based in <strong>{viewingFarmer.county}</strong>, Kenya</span>
                          </div>
                        )}
                        {viewingFarmer.joinedDate && (
                          <div className="flex items-center gap-2.5">
                            <Calendar className="h-4 w-4 text-stone-400 shrink-0" />
                            <span>Member since <strong>{viewingFarmer.joinedDate}</strong></span>
                          </div>
                        )}
                        {viewingFarmer.website && (
                          <div className="flex items-center gap-2.5">
                            <Globe className="h-4 w-4 text-blue-600 shrink-0" />
                            <a href={viewingFarmer.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                              {viewingFarmer.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Crops & Produce Card */}
                    <div className="bg-white border border-stone-200/80 p-5 rounded-3xl space-y-3 shadow-2xs text-left">
                      <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 font-mono">
                        Crops & Produce
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingFarmer.crops.map((crop, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-900 border border-emerald-200/70 text-xs font-bold px-2.5 py-1 rounded-xl">
                            🌱 {crop}
                          </span>
                        ))}
                        {viewingFarmer.crops.length === 0 && viewingFarmer.natureOfAgriculture && (
                          <span className="bg-emerald-50 text-emerald-900 border border-emerald-200/70 text-xs font-bold px-2.5 py-1 rounded-xl">
                            🌾 {viewingFarmer.natureOfAgriculture}
                          </span>
                        )}
                        {viewingFarmer.crops.length === 0 && !viewingFarmer.natureOfAgriculture && (
                          <span className="text-stone-400 text-xs italic">No specific produce added yet</span>
                        )}
                      </div>
                    </div>

                    {/* Certifications Card */}
                    {viewingFarmer.certifications && viewingFarmer.certifications.length > 0 && (
                      <div className="bg-white border border-stone-200/80 p-5 rounded-3xl space-y-3 shadow-2xs text-left">
                        <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 font-mono">
                          Certifications
                        </h3>
                        <div className="space-y-2">
                          {viewingFarmer.certifications.map((cert, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-stone-750 font-medium">
                              <Award className="h-4 w-4 text-amber-500 shrink-0" />
                              <span>{cert}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Right Main Column: Tab Views */}
                  <div className="lg:col-span-8 space-y-5">
                    
                    {/* TAB 1: POSTS */}
                    {profileActiveTab === "posts" && (
                      <div className="space-y-4">
                        {posts.filter(p => isPostByFarmer(p, viewingFarmer)).length === 0 ? (
                          <div className="bg-white border border-stone-200/80 p-8 rounded-3xl text-center space-y-2">
                            <MessageSquare className="h-8 w-8 text-stone-300 mx-auto" />
                            <p className="text-sm text-stone-500 font-medium">No published posts yet.</p>
                          </div>
                        ) : (
                          posts
                            .filter(p => isPostByFarmer(p, viewingFarmer))
                            .map(post => (
                              <div key={post.id} className="bg-white border border-stone-200/80 p-5 rounded-3xl space-y-3.5 text-left shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <img src={post.author.avatarUrl} alt="author" className="h-10 w-10 rounded-full object-cover border border-stone-200" />
                                    <div>
                                      <strong className="text-xs font-bold text-stone-850 block">{post.author.name}</strong>
                                      <span className="text-[11px] text-stone-400 font-mono">{post.createdAt}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">{post.category}</span>
                                    {currentUser && (isUsernameMatch(currentUser.username, post.author.username) || isUsernameMatch(viewingFarmer.username, currentUser.username)) && (
                                      <button onClick={() => handleDeletePost(post.id)} className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition" title="Delete post">
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">{post.body}</p>

                                {post.images && post.images.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden pt-1">
                                    {post.images.map((img, idx) => (
                                      <img key={idx} src={img} alt="post media" className="w-full h-44 object-cover rounded-xl border border-stone-200/60" />
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
                                  <div className="flex items-center gap-4">
                                    <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1.5 hover:text-emerald-700 font-semibold transition cursor-pointer">
                                      <ThumbsUp className={`h-4 w-4 ${post.hasLiked ? "text-emerald-700 fill-emerald-700" : ""}`} />
                                      <span>{post.likes}</span>
                                    </button>
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <MessageCircle className="h-4 w-4" />
                                      <span>{post.comments.length} comments</span>
                                    </span>
                                  </div>
                                  <button onClick={() => handleSavePost(post.id)} className="hover:text-stone-850 p-1">
                                    <Bookmark className={`h-4 w-4 ${post.hasSaved ? "text-amber-600 fill-amber-600" : ""}`} />
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    )}

                    {/* TAB 2: ABOUT */}
                    {profileActiveTab === "about" && (
                      <div className="bg-white border border-stone-200/80 p-6 rounded-3xl space-y-5 text-left shadow-2xs">
                        <h3 className="text-sm font-bold font-serif text-stone-900 border-b border-stone-100 pb-3">
                          About {viewingFarmer.name}
                        </h3>
                        <p className="text-xs text-stone-650 leading-relaxed whitespace-pre-line">
                          {viewingFarmer.bio || "No detailed biography written yet."}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100 text-xs">
                          {viewingFarmer.phone && (
                            <div className="flex items-center gap-2 text-stone-700">
                              <Phone className="h-4 w-4 text-emerald-700" />
                              <span>Phone: <strong>{viewingFarmer.phone}</strong></span>
                            </div>
                          )}
                          {viewingFarmer.email && (
                            <div className="flex items-center gap-2 text-stone-700">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span>Email: <strong>{viewingFarmer.email}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: FARM */}
                    {profileActiveTab === "farm" && (
                      <div className="bg-white border border-stone-200/80 p-6 rounded-3xl space-y-5 text-left shadow-2xs">
                        <h3 className="text-sm font-bold font-serif text-stone-900 border-b border-stone-100 pb-3">
                          Agricultural Activities & Experience
                        </h3>
                        <p className="text-xs text-stone-650 leading-relaxed whitespace-pre-line">
                          {viewingFarmer.farmingActivities || "No farming methods specified."}
                        </p>

                        {viewingFarmer.farmingPhotos && viewingFarmer.farmingPhotos.length > 0 && (
                          <div className="space-y-3 pt-3 border-t border-stone-100">
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono">Farm Showcase Gallery</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {viewingFarmer.farmingPhotos.map((photo, idx) => (
                                <img key={idx} src={photo} alt={`Farm gallery ${idx}`} className="w-full h-32 object-cover rounded-2xl border border-stone-200" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: PRODUCTS */}
                    {profileActiveTab === "products" && (
                      <div className="space-y-4">
                        {sokoListings.filter(s => isUsernameMatch(s.author.username, viewingFarmer.username)).length === 0 ? (
                          <div className="bg-white border border-stone-200/80 p-8 rounded-3xl text-center space-y-2">
                            <ShoppingBag className="h-8 w-8 text-stone-300 mx-auto" />
                            <p className="text-sm text-stone-500 font-medium">No marketplace products listed yet.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {sokoListings
                              .filter(s => isUsernameMatch(s.author.username, viewingFarmer.username))
                              .map(product => (
                                <div key={product.id} className="bg-white border border-stone-200/80 p-4 rounded-3xl space-y-3 text-left shadow-2xs">
                                  {product.images && product.images.length > 0 && (
                                    <img src={product.images[0]} alt={product.commodity} className="w-full h-36 object-cover rounded-2xl border border-stone-100" />
                                  )}
                                  <div className="space-y-1">
                                    <strong className="text-xs font-bold text-stone-850 block">{product.commodity}</strong>
                                    <span className="text-xs font-black text-emerald-800 block">KES {product.price.toLocaleString()}</span>
                                    <p className="text-[11px] text-stone-500 line-clamp-2">{product.description}</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 5: MEDIA */}
                    {profileActiveTab === "media" && (
                      <div className="bg-white border border-stone-200/80 p-6 rounded-3xl space-y-4 text-left shadow-2xs">
                        <h3 className="text-sm font-bold font-serif text-stone-900 border-b border-stone-100 pb-3">
                          Published Photos & Media
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {posts
                            .filter(p => isPostByFarmer(p, viewingFarmer) && p.images && p.images.length > 0)
                            .flatMap(p => p.images!)
                            .map((img, idx) => (
                              <img key={idx} src={img} alt={`Media ${idx}`} className="w-full h-32 object-cover rounded-2xl border border-stone-200" />
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
                <div className="flex items-center justify-between gap-3 border-b border-stone-200/60 pb-3 text-left">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl font-bold font-serif text-[#1A3A1A] flex items-center gap-2 truncate">
                      🌾 Mqulima Soko Marketplace
                    </h2>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                      Buy, sell, and trade farm produce directly with verified growers across Kenya — transparent, fair, and direct.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setIsListingSoko(true)}
                    className="bg-[#1A5438] hover:bg-[#113B26] active:scale-95 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>List Commodity</span>
                  </button>
                </div>

                {/* 📊 Soko Price Billboard Slider - Vibrant & High Contrast */}
                <div className="bg-gradient-to-br from-emerald-950 via-[#1B4332] to-teal-950 p-4 sm:p-5 rounded-2xl text-left shadow-lg border border-emerald-800/80 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <strong className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-200 font-sans flex items-center gap-2">
                        <span>📊 LIVE COMMODITY PRICES INDEX</span>
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                          KES REALTIME
                        </span>
                      </strong>
                    </div>
                    
                    <Link
                      to="/tools"
                      search={{ tab: "markets" }}
                      className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                    >
                      <span>See More Prices</span>
                      <ChevronRight className="h-3.5 w-3.5 stroke-[3]" />
                    </Link>
                  </div>

                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    {billboardPrices.slice(0, 4).map((bill, i) => {
                      const change = bill.price - bill.prevPrice;
                      const isUp = change > 0;
                      const isDown = change < 0;

                      return (
                        <div 
                          key={i} 
                          className="bg-white border border-stone-200/90 p-3 rounded-xl shadow-md text-left transition-all hover:scale-[1.02] hover:shadow-xl flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-xs font-black text-stone-900 block truncate font-sans leading-tight mb-1" title={bill.crop}>
                              {bill.crop}
                            </span>
                            <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-sans">
                              📍 {bill.region}
                            </span>
                          </div>

                          <div className="flex items-end justify-between pt-2.5 mt-2 border-t border-stone-150">
                            <div>
                              <span className="text-[9px] font-bold text-stone-400 uppercase block font-mono">Price / Unit</span>
                              <strong className="text-sm font-black text-[#1B4332] font-mono block tracking-tight">
                                KES {bill.price.toLocaleString()}
                              </strong>
                            </div>

                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono flex items-center gap-0.5 shadow-2xs ${
                              isUp 
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                                : isDown 
                                ? "bg-rose-100 text-rose-800 border border-rose-300" 
                                : "bg-stone-100 text-stone-700 border border-stone-200"
                            }`}>
                              <span>{isUp ? "▲" : isDown ? "▼" : "•"}</span>
                              <span>{isUp ? `+${Math.round(change)}` : isDown ? `${Math.round(change)}` : "0"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Soko Filters Panel */}
                <div className="bg-white border border-stone-200/85 p-4 rounded-2xl grid gap-4 sm:grid-cols-2 text-xs text-left shadow-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block tracking-wider">Search Listing</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="e.g. Potatoes..." 
                        value={sokoSearch}
                        onChange={(e) => setSokoSearch(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1A5438]"
                      />
                      <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-stone-400 uppercase block tracking-wider">Commodity type</label>
                    <select 
                      value={sokoTypeFilter}
                      onChange={(e) => setSokoTypeFilter(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200/60 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none cursor-pointer font-bold"
                    >
                      <option value="all">All commodities</option>
                      <option value="crop">Crops / Grains</option>
                      <option value="fruit">Fruits / Produce</option>
                      <option value="livestock">Livestock / Bees</option>
                    </select>
                  </div>
                </div>

                {/* Soko Create Modal Overlay (Semi-Page Drawer) */}
                {isListingSoko && (
                  <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white border border-stone-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto text-left relative flex flex-col max-h-[90vh]">
                      
                      {/* Modal Header */}
                      <div className="flex items-center justify-between border-b border-emerald-900/40 p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-[#1B4332] to-emerald-900 text-white shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                            <ShoppingBag className="h-5 w-5 text-emerald-300" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-emerald-100 font-sans">
                              Put Up Commodity for Sale
                            </h3>
                            <p className="text-[10px] text-emerald-300/80 font-mono">
                              Publish directly on Mqulima Soko marketplace
                            </p>
                          </div>
                        </div>

                        <button 
                          type="button" 
                          onClick={() => setIsListingSoko(false)}
                          className="p-2 rounded-full hover:bg-white/15 text-emerald-200 hover:text-white transition cursor-pointer"
                          aria-label="Close modal"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Modal Body / Form */}
                      <form onSubmit={handleCreateSokoListing} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-600 uppercase">Commodity Name *</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. Grade A Potatoes"
                              value={sokoCommodity}
                              onChange={(e) => setSokoCommodity(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#1A5438]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-600 uppercase">Commodity Type *</label>
                            <select
                              value={sokoType}
                              onChange={(e) => setSokoType(e.target.value as any)}
                              className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none cursor-pointer font-bold"
                            >
                              <option value="crop">Crops / Grains</option>
                              <option value="fruit">Fruits / Produce</option>
                              <option value="livestock">Livestock / Animals</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-600 uppercase">Unit Price (KES) *</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. 3200"
                              value={sokoPrice}
                              onChange={(e) => setSokoPrice(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#1A5438]"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-600 uppercase">Volume / Quantity *</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. 40 Bags"
                              value={sokoQty}
                              onChange={(e) => setSokoQty(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#1A5438]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-600 uppercase">Location *</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. Eldoret"
                              value={sokoLoc}
                              onChange={(e) => setSokoLoc(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#1A5438]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#1A5438] uppercase flex items-center gap-1">
                              <PhoneCall className="h-3 w-3 text-emerald-600" /> Phone / WhatsApp
                            </label>
                            <input 
                              type="tel" 
                              placeholder="e.g. +254 712 345 678"
                              value={sokoPhone}
                              onChange={(e) => setSokoPhone(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#1A5438]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-stone-600 uppercase flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[#1A5438]">
                              <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Upload Product Image</span>
                            </span>
                            {sokoImgText && (
                              <button 
                                type="button" 
                                onClick={() => setSokoImgText("")}
                                className="text-[10px] text-red-500 hover:underline font-normal cursor-pointer"
                              >
                                Remove image
                              </button>
                            )}
                          </label>

                          {sokoImgText ? (
                            <div className="relative rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50/40 p-2.5 flex items-center gap-3">
                              <img src={sokoImgText} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-stone-200 shrink-0" />
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-bold text-stone-800 truncate">Product Image Attached</p>
                                <p className="text-[10px] text-emerald-700 font-medium">Ready for publication</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSokoImgText("")}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-white transition cursor-pointer shrink-0"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              {/* Mobile Small Button View */}
                              <label className="sm:hidden border border-stone-200 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 bg-stone-50 hover:bg-emerald-50/30 active:bg-stone-100 transition cursor-pointer text-xs font-bold text-stone-700 w-full shadow-2xs">
                                <Upload className="h-4 w-4 text-[#1A5438]" />
                                <span>Choose Product Photo</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleSokoImageUpload}
                                  className="hidden" 
                                />
                              </label>

                              {/* Desktop Dropzone View */}
                              <label className="hidden sm:flex border-2 border-dashed border-stone-200 hover:border-emerald-500 rounded-xl p-4 flex-col items-center justify-center gap-1.5 cursor-pointer bg-stone-50/50 hover:bg-emerald-50/20 transition text-center group">
                                <Upload className="h-5 w-5 text-stone-400 group-hover:text-[#1A5438] transition" />
                                <span className="text-xs font-semibold text-stone-600 group-hover:text-[#1A5438]">Click to select product image from your device</span>
                                <span className="text-[10px] text-stone-400">PNG, JPG, WEBP up to 5MB</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleSokoImageUpload}
                                  className="hidden" 
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-600 uppercase">Listing Details & Specifications</label>
                          <textarea 
                            required 
                            rows={3} 
                            placeholder="Harvest moisture levels, chemical application specs, size grades..."
                            value={sokoDesc}
                            onChange={(e) => setSokoDesc(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200/80 rounded-xl px-3 py-2 text-xs text-stone-800 outline-none focus:border-[#1A5438] resize-none"
                          />
                        </div>

                        {/* Form Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 shrink-0">
                          <button 
                            type="button" 
                            onClick={() => setIsListingSoko(false)}
                            className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-100 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-5 py-2 bg-[#1A5438] hover:bg-[#113B26] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
                          >
                            <span>Publish Listing</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
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

                        <div className="border-t border-stone-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-stone-400">
                              Seller:{" "}
                              <button 
                                onClick={() => setSelectedProfileUsername(listing.author.username)}
                                className="text-stone-600 font-mono hover:text-[#1A5438] font-bold"
                              >
                                {listing.author.username}
                              </button>
                            </span>
                            {listing.phone && (
                              <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200 flex items-center gap-1">
                                📞 {listing.phone}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {listing.phone && (
                              <>
                                <a 
                                  href={`tel:${listing.phone.replace(/\s+/g, '')}`}
                                  className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-300/60 font-bold uppercase text-[10px] transition-colors"
                                  title="Direct Call Seller"
                                >
                                  <PhoneCall className="h-3.5 w-3.5 text-amber-700" />
                                  <span>Call Direct</span>
                                </a>
                                
                                <a 
                                  href={`https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Habari ${listing.author.name}! I saw your Mqulima Soko trade listing for ${listing.commodity} (${listing.quantity}) at KES ${listing.price}. Is it still available?`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] transition-colors shadow-xs"
                                  title="Text on WhatsApp"
                                >
                                  <WhatsAppIcon className="h-3.5 w-3.5 text-white" />
                                  <span>WhatsApp</span>
                                </a>
                              </>
                            )}

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
                    </div>
                  ))}
                  {filteredSokoListings.length === 0 && (
                    <div className="text-center py-16 bg-white border border-stone-200/60 rounded-2xl p-8 space-y-4 col-span-full w-full">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-[#1A5438]/50">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-stone-850">No marketplace listings found</h3>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          There are currently no active crop or livestock trade listings on Soko matching your search criteria.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 🩺 MQULIMA CONSULT TAB VIEW */}
            {subpage === "consult" && !selectedProfileUsername && (
              <div className="space-y-5 text-left">
                
                {/* Consult Banner */}
                <div className="bg-gradient-to-br from-[#0B2117] via-[#16382B] to-[#0F291E] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#85CC14]/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 space-y-2.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/20 text-[11px] font-bold text-[#85CC14]">
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>Certified Extension Services</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight font-serif text-white">
                      Mqulima Extension Consult Desk 🌾
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl font-sans">
                      Connect directly with expert agronomists, soil scientists, and certified veterinary extension officers across Kenya.
                    </p>
                  </div>
                </div>

                {/* Quick Interactive Specialty Selection Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { title: "Crop Agronomy", icon: "🌱", val: "Crop & Soil Agronomy" },
                    { title: "Vet Care", icon: "🐄", val: "Livestock & Veterinary Health" },
                    { title: "Pest Emergency", icon: "🐛", val: "Pest & Disease Emergency" },
                    { title: "Irrigation & Water", icon: "💧", val: "Drip Irrigation & Water" }
                  ].map((chip) => {
                    const isSelected = consultSpecialty === chip.val;
                    return (
                      <button
                        key={chip.title}
                        type="button"
                        onClick={() => setConsultSpecialty(chip.val)}
                        className={`p-3 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? "bg-[#1B4332] text-white border-[#1B4332] shadow-md"
                            : "bg-white border-stone-200/90 text-stone-700 hover:border-[#1B4332]/40"
                        }`}
                      >
                        <span className="text-base">{chip.icon}</span>
                        <span className="text-[11px] font-bold truncate leading-tight">{chip.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Consultation Form Card */}
                <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-7 space-y-5 text-left shadow-sm">
                  
                  {consultSubmittedTicket ? (
                    <div className="bg-emerald-50/80 border border-emerald-300 p-6 rounded-2xl space-y-4 text-center">
                      <div className="w-14 h-14 bg-[#1B4332] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                        <Check className="h-7 w-7" />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block font-mono">
                          Ticket Dispatched to Admin Desk
                        </span>
                        <h3 className="text-lg font-black text-stone-900 font-serif">Ticket #{consultSubmittedTicket.id}</h3>
                        <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                          Assigned to <strong className="text-[#1B4332] font-bold">{consultSubmittedTicket.assignedConsultant}</strong>. Our officer will contact <strong className="text-stone-900 font-bold">{consultSubmittedTicket.phone}</strong> via {consultSubmittedTicket.channel} shortly.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                        <a 
                          href={`https://wa.me/254723346134?text=Hello%20Mqulima%20Consult%20Desk,%20inquiry%20reference%20${consultSubmittedTicket.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold hover:bg-[#20ba5a] transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <WhatsAppIcon className="h-4 w-4 text-white" />
                          <span>Chat Helpdesk on WhatsApp</span>
                        </a>
                        <button 
                          onClick={() => setConsultSubmittedTicket(null)}
                          className="px-5 py-2.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl text-xs font-bold transition"
                        >
                          Submit Another Inquiry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateConsultation} className="space-y-4">
                      <div className="border-b border-stone-150 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-stone-900 font-serif">Consultation Intake Form</h3>
                          <p className="text-[11px] text-stone-500">Provide details for certified agronomy or veterinary dispatch</p>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md hidden sm:inline-block">
                          Direct Admin Dispatch
                        </span>
                      </div>

                      <div className="grid gap-3.5 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Your Name *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. John Kamau"
                            value={consultName}
                            onChange={(e) => setConsultName(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200/90 focus:border-[#1B4332] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none font-medium transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Phone / WhatsApp Number *</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="+254 7XX XXX XXX"
                            value={consultPhone}
                            onChange={(e) => setConsultPhone(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200/90 focus:border-[#1B4332] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none font-bold transition"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">County / Farm Location</label>
                          <select 
                            value={consultCounty}
                            onChange={(e) => setConsultCounty(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200/90 focus:border-[#1B4332] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none cursor-pointer font-medium"
                          >
                            {["Uasin Gishu", "Nakuru", "Kiambu", "Trans Nzoia", "Machakos", "Meru", "Kakamega", "Nyeri", "Narok", "Kilifi", "Kisumu", "Nyandarua"].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Specialty Required</label>
                          <select 
                            value={consultSpecialty}
                            onChange={(e) => setConsultSpecialty(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200/90 focus:border-[#1B4332] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none cursor-pointer font-medium"
                          >
                            <option value="Crop & Soil Agronomy">🌱 Crop & Soil Agronomy</option>
                            <option value="Livestock & Veterinary Health">🐄 Livestock & Veterinary Care</option>
                            <option value="Pest & Disease Emergency">🐛 Pest & Disease Emergency</option>
                            <option value="Drip Irrigation & Water">💧 Drip Irrigation & Water</option>
                            <option value="Agribusiness & Produce Marketing">📈 Agribusiness & Produce Marketing</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Preferred Contact Method</label>
                          <select 
                            value={consultChannel}
                            onChange={(e) => setConsultChannel(e.target.value as any)}
                            className="w-full bg-stone-50 border border-stone-200/90 focus:border-[#1B4332] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none cursor-pointer font-medium"
                          >
                            <option value="whatsapp">💬 WhatsApp Message</option>
                            <option value="call">📞 Phone Call</option>
                            <option value="visit">🏡 On-Farm Extension Visit</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Urgency Level</label>
                          <select 
                            value={consultUrgency}
                            onChange={(e) => setConsultUrgency(e.target.value as any)}
                            className="w-full bg-stone-50 border border-stone-200/90 focus:border-[#1B4332] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-stone-900 outline-none cursor-pointer font-medium"
                          >
                            <option value="normal">🟢 Normal Inquiry (Within 24 Hours)</option>
                            <option value="urgent">🟡 High Priority (Within 4 Hours)</option>
                            <option value="emergency">🔴 Field Outbreak Emergency (Immediate)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">Describe Your Question or Field Issue *</label>
                        <textarea 
                          required
                          rows={4}
                          placeholder="e.g. Yellow spots appearing on maize leaves after heavy rain in Moiben..."
                          value={consultMessage}
                          onChange={(e) => setConsultMessage(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200/90 focus:border-[#1B4332] focus:bg-white rounded-xl p-3.5 text-xs text-stone-900 outline-none resize-none font-medium transition"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingConsult}
                          className="w-full sm:w-auto px-7 py-3 bg-[#1B4332] hover:bg-[#113B26] text-white rounded-xl text-xs sm:text-sm font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isSubmittingConsult ? <RotateCw className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4 text-[#F4A261]" />}
                          <span>{isSubmittingConsult ? "Transmitting Ticket..." : "Submit Consultation Request"}</span>
                        </button>
                      </div>
                    </form>
                  )}

                </div>

              </div>
            )}

            {/* 🌾 MQULIMA FARMERS NETWORK DIRECTORY VIEW */}
            {subpage === "network" && !selectedProfileUsername && (
              <div className="space-y-6">
                
                {/* Network Banner Header */}
                <div className="bg-gradient-to-r from-[#0B2117] via-[#16382B] to-[#0F291E] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg text-left">
                  <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10 pointer-events-none">
                    <Users className="h-64 w-64" />
                  </div>
                  <div className="relative z-10 space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold">
                      <Sparkles className="h-3.5 w-3.5 text-[#85CC14]" />
                      <span>{farmers.length} Verified Community Farmers</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
                      Mqulima Farmers Directory
                    </h2>
                    <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
                      Browse all farmers, agronomists, and agricultural experts in the forum. View their profiles, inspect their farm specialties, and connect 1-on-1 instantly.
                    </p>
                  </div>
                </div>

                {/* Filter and Search Bar Controls */}
                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 space-y-4 shadow-xs text-left">
                  <div className="grid gap-3 sm:grid-cols-12 items-center">
                    {/* Search Field */}
                    <div className="sm:col-span-7 relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search by farmer name, @handle, county, or crop..."
                        value={networkSearch}
                        onChange={(e) => setNetworkSearch(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-800 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                      />
                      {networkSearch && (
                        <button 
                          onClick={() => setNetworkSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* County Filter Dropdown */}
                    <div className="sm:col-span-5">
                      <select
                        value={networkCountyFilter}
                        onChange={(e) => setNetworkCountyFilter(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] cursor-pointer"
                      >
                        <option value="all">📍 All Counties / Regions</option>
                        <option value="Uasin Gishu">Uasin Gishu (Eldoret)</option>
                        <option value="Kiambu">Kiambu</option>
                        <option value="Machakos">Machakos</option>
                        <option value="Kisumu">Kisumu</option>
                        <option value="Nakuru">Nakuru</option>
                        <option value="Trans Nzoia">Trans Nzoia (Kitale)</option>
                        <option value="Meru">Meru</option>
                        <option value="Nyeri">Nyeri</option>
                      </select>
                    </div>
                  </div>

                  {/* Specialty Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-stone-100 no-scrollbar">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1 font-mono">Specialty:</span>
                    {[
                      { id: "all", label: "All Farmers", icon: "👩‍🌾" },
                      { id: "crops", label: "Crop Growers", icon: "🌾" },
                      { id: "livestock", label: "Livestock & Dairy", icon: "🐄" },
                      { id: "mixed", label: "Mixed Farming", icon: "🧺" },
                    ].map((pill) => {
                      const count = farmers.filter((f) => {
                        const q = networkSearch.toLowerCase().trim();
                        const matchSearch = !q || (
                          f.name.toLowerCase().includes(q) ||
                          f.username.toLowerCase().includes(q) ||
                          f.county.toLowerCase().includes(q) ||
                          f.crops.some(c => c.toLowerCase().includes(q)) ||
                          f.livestock.some(l => l.toLowerCase().includes(q)) ||
                          (f.bio && f.bio.toLowerCase().includes(q)) ||
                          (f.farmingActivities && f.farmingActivities.toLowerCase().includes(q))
                        );
                        const matchCounty = networkCountyFilter === "all" || f.county.toLowerCase().includes(networkCountyFilter.toLowerCase());
                        
                        const haystack = `${f.crops?.join(" ")} ${f.livestock?.join(" ")} ${f.certifications?.join(" ")} ${f.interests?.join(" ")} ${f.bio || ""} ${f.farmingActivities || ""}`.toLowerCase();
                        
                        const matchPill = pill.id === "all"
                          ? true
                          : pill.id === "crops"
                          ? (f.crops?.length > 0 || /crop|maize|bean|wheat|coffee|tea|vegetable|tomato|potato|avocado|fruit|horticulture|grain|sugarcane/i.test(haystack))
                          : pill.id === "livestock"
                          ? (f.livestock?.length > 0 || /livestock|dairy|cattle|cow|poultry|chicken|goat|sheep|pig|bee|aquaculture|fish/i.test(haystack))
                          : ((f.crops?.length > 0 && f.livestock?.length > 0) || /mixed|integrated/i.test(haystack));

                        return matchSearch && matchCounty && matchPill;
                      }).length;

                      const isActive = networkFocusFilter === pill.id;

                      return (
                        <button
                          key={pill.id}
                          onClick={() => setNetworkFocusFilter(pill.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? "bg-[#1B4332] text-white shadow-xs scale-102"
                              : "bg-stone-100 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900"
                          }`}
                        >
                          <span>{pill.icon}</span>
                          <span>{pill.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            isActive ? "bg-emerald-700/90 text-white" : "bg-stone-200 text-stone-700"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Farmers Grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 text-left">
                  {(() => {
                    const matchedFarmers = farmers
                      .filter((f) => {
                        const q = networkSearch.toLowerCase().trim();
                        const matchSearch = !q || (
                          f.name.toLowerCase().includes(q) ||
                          f.username.toLowerCase().includes(q) ||
                          f.county.toLowerCase().includes(q) ||
                          f.crops.some(c => c.toLowerCase().includes(q)) ||
                          f.livestock.some(l => l.toLowerCase().includes(q)) ||
                          (f.bio && f.bio.toLowerCase().includes(q)) ||
                          (f.farmingActivities && f.farmingActivities.toLowerCase().includes(q))
                        );
                        const matchCounty = networkCountyFilter === "all" || f.county.toLowerCase().includes(networkCountyFilter.toLowerCase());
                        
                        const haystack = `${f.crops?.join(" ")} ${f.livestock?.join(" ")} ${f.certifications?.join(" ")} ${f.interests?.join(" ")} ${f.bio || ""} ${f.farmingActivities || ""}`.toLowerCase();
                        
                        const matchFocus = networkFocusFilter === "all"
                          ? true
                          : networkFocusFilter === "crops"
                          ? (f.crops?.length > 0 || /crop|maize|bean|wheat|coffee|tea|vegetable|tomato|potato|avocado|fruit|horticulture|grain|sugarcane/i.test(haystack))
                          : networkFocusFilter === "livestock"
                          ? (f.livestock?.length > 0 || /livestock|dairy|cattle|cow|poultry|chicken|goat|sheep|pig|bee|aquaculture|fish/i.test(haystack))
                          : networkFocusFilter === "mixed"
                          ? ((f.crops?.length > 0 && f.livestock?.length > 0) || /mixed|integrated/i.test(haystack))
                          : true;

                        return matchSearch && matchCounty && matchFocus;
                      });

                    if (matchedFarmers.length === 0) {
                      return (
                        <div className="col-span-full py-12 text-center bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs space-y-3">
                          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto text-xl font-bold">
                            🌾
                          </div>
                          <h4 className="text-base font-bold font-serif text-stone-900">No Farmers Found</h4>
                          <p className="text-xs text-stone-500 max-w-sm mx-auto">
                            No community members match your selected specialty filter or search term. Try resetting your filter.
                          </p>
                          <button
                            onClick={() => {
                              setNetworkFocusFilter("all");
                              setNetworkSearch("");
                            }}
                            className="px-4 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#2D6A4F] transition shadow-xs cursor-pointer"
                          >
                            Reset Specialty Filter
                          </button>
                        </div>
                      );
                    }

                    return matchedFarmers.map((farmer) => (
                      <div 
                        key={farmer.username}
                        className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left group hover:-translate-y-1 relative"
                      >
                        <div>
                          {/* Banner & Cover Image */}
                          <div className="h-28 relative bg-gradient-to-r from-[#0B2117] via-[#16382B] to-[#0F291E] p-3 flex justify-between items-start">
                            {farmer.coverImage && (
                              <img src={farmer.coverImage} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                            )}
                            <div className="relative z-10 bg-black/40 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20">
                              <MapPin className="h-3 w-3 text-emerald-300" />
                              <span>{farmer.county || "Kenya"}</span>
                            </div>

                            <span className="relative z-10 bg-emerald-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-xs">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                              <span>Verified</span>
                            </span>
                          </div>

                          <div className="px-5 pt-0 pb-3 relative">
                            {/* Avatar */}
                            <div className="flex justify-between items-end -mt-12 mb-3">
                              <div className="relative group-hover:scale-105 transition-transform">
                                <img
                                  src={farmer.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(farmer.name)}&backgroundColor=1a5438&textColor=ffffff`}
                                  alt={farmer.name}
                                  className="h-20 w-20 rounded-2xl object-cover border-4 border-white shadow-lg bg-white"
                                />
                                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Active" />
                              </div>

                              <div className="text-right">
                                <span className="inline-block text-[11px] font-black font-serif text-[#1B4332] bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full shadow-2xs">
                                  🏆 {farmer.reputationScore < 400 ? "Rising Farmer" : farmer.reputationScore < 800 ? "Gold Farmer" : "Master Farmer"}
                                </span>
                              </div>
                            </div>

                             {/* Name & Handle */}
                            <div className="space-y-0.5 mt-1">
                              <h3 className="text-lg font-black font-serif text-stone-900 leading-snug group-hover:text-[#1B4332] transition-colors">
                                {farmer.name}
                              </h3>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-stone-500 font-mono font-medium block">{farmer.username}</span>
                                <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                  {(() => {
                                    const cleanUsername = farmer.username.startsWith("@") ? farmer.username : `@${farmer.username}`;
                                    const isFollowedByMe = validFollowedUsernames.some(u => isUsernameMatch(u, cleanUsername));
                                    const baseCount = farmer.followersCount || 0;
                                    const totalCount = baseCount + (isFollowedByMe ? 1 : 0);
                                    return `${totalCount} ${totalCount === 1 ? 'Follower' : 'Followers'}`;
                                  })()}
                                </span>
                              </div>
                            </div>

                            {/* Bio */}
                            <p className="text-xs text-stone-600 mt-2.5 line-clamp-2 leading-relaxed font-normal min-h-[36px]">
                              {farmer.bio || "Active community farmer sharing tips and harvest progress on Mqulima Hub."}
                            </p>


                            {/* Tags (Crops / Livestock) */}
                            {(farmer.crops.length > 0 || farmer.livestock.length > 0) && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {farmer.crops.slice(0, 3).map((c, i) => (
                                  <span key={i} className="text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">
                                    🌾 {c}
                                  </span>
                                ))}
                                {farmer.livestock.slice(0, 2).map((l, i) => (
                                  <span key={i} className="text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200/80 px-2.5 py-0.5 rounded-md">
                                    🐄 {l}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Certifications Badges */}
                            {farmer.certifications.length > 0 && (
                              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                                <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">{farmer.certifications.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="p-3 grid grid-cols-3 gap-1.5 border-t border-stone-100 mt-2 bg-stone-50/50">
                          <button
                            onClick={() => handleToggleFollow(farmer.username)}
                            className={`py-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                              followedUsernames.includes(farmer.username.startsWith("@") ? farmer.username : `@${farmer.username}`)
                                ? "bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                                : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                            }`}
                          >
                            {followedUsernames.includes(farmer.username.startsWith("@") ? farmer.username : `@${farmer.username}`) ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3.5 w-3.5 text-emerald-700" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setSelectedProfileUsername(farmer.username)}
                            className="py-2 bg-white hover:bg-stone-100 text-stone-800 font-bold text-[11px] rounded-xl border border-stone-200/80 transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <User className="h-3.5 w-3.5 text-stone-600" />
                            <span>Profile</span>
                          </button>
                          
                          <button
                            onClick={() => handleStartChat(farmer)}
                            className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5 fill-white text-white" />
                            <span>Chat</span>
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

              </div>
            )}

            {/* 💬 MQULIMA KONNEKT CHAT MESSENGER TAB VIEW (WhatsApp & Instagram Style) */}
            {subpage === "konnekt" && !selectedProfileUsername && (
              <div className="space-y-4 text-left pb-16 sm:pb-6">
                
                {/* Main Messenger Console Grid */}
                <div className="bg-white border border-stone-200/90 rounded-2xl sm:rounded-3xl overflow-hidden grid md:grid-cols-12 min-h-[480px] sm:min-h-[560px] shadow-lg">
                  
                  {/* Conversations List Column (Left 4 cols) - Hidden on mobile when chat is open */}
                  <div className={`${mobileChatView === "chat" ? "hidden md:flex" : "flex"} md:col-span-4 bg-gradient-to-b from-stone-50 via-emerald-50/20 to-stone-50 border-r border-stone-200/70 p-3 sm:p-4 flex-col justify-between space-y-2 sm:space-y-3`}>
                    <div className="space-y-2 sm:space-y-3 w-full">
                      
                      {/* Search & Inbox Header */}
                      <div className="flex items-center justify-between px-0.5">
                        <h3 className="text-xs sm:text-sm font-black text-stone-900 font-serif flex items-center gap-1.5">
                          <div className="p-1 sm:p-1.5 bg-[#1B4332] text-white rounded-xl shadow-2xs">
                            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                          <span className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] bg-clip-text text-transparent">Direct Messages</span>
                        </h3>
                        <span className="text-[9px] sm:text-[10px] font-mono font-extrabold bg-[#1B4332] text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-2xs">
                          {chats.length} Active
                        </span>
                      </div>

                      {/* Active Farmers Carousel Strip (Integrated Inside Card - Compressed) */}
                      <div className="bg-emerald-900/5 border border-emerald-900/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-2xs">
                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-900 uppercase tracking-widest shrink-0 font-mono px-1.5 py-0.5 bg-emerald-100/80 rounded-lg border border-emerald-200/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active:</span>
                        </div>
                        {farmers.filter(f => f.username !== currentUser?.username).map(f => (
                          <button
                            key={f.username}
                            onClick={() => {
                              handleStartChat(f);
                              setMobileChatView("chat");
                            }}
                            className="flex flex-col items-center shrink-0 group cursor-pointer transition-transform active:scale-95"
                          >
                            <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-500 via-[#2D6A4F] to-[#1B4332] group-hover:scale-105 transition-all duration-200 shadow-2xs relative">
                              <img 
                                src={f.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.name)}&backgroundColor=1a5438&textColor=ffffff`} 
                                alt={f.name} 
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border border-white" 
                              />
                              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white shadow-2xs" />
                            </div>
                            <span className="text-[9px] font-bold text-stone-800 truncate max-w-[46px] mt-0.5 group-hover:text-[#1B4332] transition-colors">
                              {f.name.split(" ")[0]}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Chat Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Search conversations..."
                          value={chatSearch}
                          onChange={(e) => setChatSearch(e.target.value)}
                          className="w-full bg-white border border-stone-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-emerald-500/20 transition shadow-2xs font-medium"
                        />
                      </div>

                      {/* Chats List */}
                      <div className="space-y-1 max-h-[420px] overflow-y-auto pr-0.5 custom-scrollbar">
                        {chats
                          .filter(c => !chatSearch || c.name.toLowerCase().includes(chatSearch.toLowerCase()) || c.farmer?.username.toLowerCase().includes(chatSearch.toLowerCase()))
                          .map((sess) => {
                            const lastMsg = sess.log[sess.log.length - 1];
                            const isActive = activeChatId === sess.id;
                            return (
                              <button
                                key={sess.id}
                                onClick={() => {
                                  setActiveChatId(sess.id);
                                  setMobileChatView("chat");
                                }}
                                className={`w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all border text-left cursor-pointer ${
                                  isActive
                                    ? "bg-emerald-900/10 border-l-4 border-l-[#1B4332] border-stone-200 text-[#1B4332] shadow-xs font-semibold"
                                    : "border-transparent text-stone-600 hover:bg-stone-200/60 hover:border-stone-200/60"
                                }`}
                              >
                                <div className="relative shrink-0">
                                  <img 
                                    src={sess.farmer?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sess.name)}&backgroundColor=1a5438&textColor=ffffff`} 
                                    alt={sess.name} 
                                    className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border ${isActive ? "border-[#1B4332] ring-2 ring-emerald-500/30" : "border-stone-200"}`} 
                                  />
                                  {!sess.isGroup && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                                  )}
                                </div>
                                
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-baseline">
                                    <strong className={`text-xs block truncate ${isActive ? "text-[#1B4332] font-black" : "text-stone-900 font-bold"}`}>
                                      {sess.name}
                                    </strong>
                                    {lastMsg && (
                                      <span className="text-[9px] text-stone-400 font-mono shrink-0 ml-1">{lastMsg.timestamp}</span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] sm:text-[11px] block truncate mt-0.5 ${isActive ? "text-emerald-950 font-medium" : "text-stone-500"}`}>
                                    {lastMsg ? (lastMsg.image ? "📷 Sent an image" : lastMsg.text) : (sess.farmer?.county ? `📍 ${sess.farmer.county}` : "Connected Farmer")}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>

                    </div>

                    {/* Sync engine status */}
                    <div className="bg-white border border-emerald-900/10 rounded-2xl p-3 text-[10px] space-y-1 text-stone-600 shadow-2xs mt-2">
                      <div className="flex justify-between items-center font-mono">
                        <span className="flex items-center gap-1.5 font-bold text-stone-700">
                          <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse shadow-2xs" : "bg-amber-500"}`} />
                          <span>Realtime Sync:</span>
                        </span>
                        <strong className={`px-2 py-0.5 rounded-md ${isOnline ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200" : "bg-amber-50 text-amber-700 font-bold border border-amber-200"}`}>
                          {isOnline ? "Active" : "Outbox Mode"}
                        </strong>
                      </div>
                    </div>

                  </div>

                  {/* Active Chat Conversation Area (Right 8 cols) - Hidden on mobile when list is open */}
                  {!activeChat ? (
                    <div className={`${mobileChatView === "list" ? "hidden md:flex" : "flex"} md:col-span-8 flex-col items-center justify-center p-8 bg-gradient-to-b from-emerald-50/30 to-white text-center space-y-4 min-h-[480px]`}>
                      <div className="h-16 w-16 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-3xl font-bold shadow-md">
                        💬
                      </div>
                      <h4 className="text-lg font-black font-serif text-stone-900">No Conversation Selected</h4>
                      <p className="text-xs text-stone-600 max-w-sm leading-relaxed">
                        Select a farmer from the direct message list to launch a private end-to-end conversation.
                      </p>
                      <button
                        onClick={() => setSubpage("network")}
                        className="px-5 py-2.5 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#113B26] transition shadow-md cursor-pointer"
                      >
                        Browse Farmers Directory
                      </button>
                    </div>
                  ) : (
                    <div className={`${mobileChatView === "list" ? "hidden md:flex" : "flex"} md:col-span-8 flex-col justify-between bg-white relative ${showPartnerDrawer ? "lg:col-span-5" : ""}`}>
                        
                        {/* WhatsApp / Instagram Style Header Bar */}
                        <div className="p-2.5 sm:p-3 px-3 sm:px-4 border-b border-stone-200/80 bg-stone-50 flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-2">
                            
                            {/* Mobile Back Button */}
                            <button
                              type="button"
                              onClick={() => setMobileChatView("list")}
                              className="md:hidden p-1.5 text-stone-700 hover:bg-stone-200 rounded-xl transition cursor-pointer"
                              title="Back to conversations list"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>

                            <div className="relative cursor-pointer" onClick={() => partner && setSelectedProfileUsername(partner.username)}>
                              <img 
                                src={partner?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeChat?.name || "Farmer")}&backgroundColor=1a5438&textColor=ffffff`} 
                                alt="avatar" 
                                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-white shadow-2xs" 
                              />
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                            </div>

                            <div className="text-left min-w-0">
                              <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 font-serif leading-tight flex items-center gap-1 truncate">
                                <span className="truncate">{activeChat?.name || "Mqulima Direct Chat"}</span>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline shrink-0" />
                              </h3>
                              <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5 truncate">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span>Active Now</span>
                                {partner?.county && (
                                  <>
                                    <span className="text-stone-300">•</span>
                                    <span className="text-stone-500 font-mono truncate">📍 {partner.county}</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions Header */}
                          <div className="flex items-center gap-1 shrink-0">
                            {partner && (
                              <button
                                onClick={() => setSelectedProfileUsername(partner.username)}
                                className="p-1.5 sm:p-2 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer shadow-2xs"
                                title="View Full Profile"
                              >
                                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </button>
                            )}

                            {partner?.phone && (
                              <a
                                href={`tel:${partner.phone}`}
                                className="p-1.5 sm:p-2 text-[#1B4332] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer shadow-2xs"
                                title="Call Farmer"
                              >
                                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </a>
                            )}

                            <button
                              onClick={() => setShowPartnerDrawer(!showPartnerDrawer)}
                              className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer shadow-2xs ${
                                showPartnerDrawer ? "bg-[#1B4332] text-white" : "text-stone-600 bg-stone-100 hover:bg-stone-200/80"
                              }`}
                              title="Partner Info Drawer"
                            >
                              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>

                        {/* WhatsApp / iMessage Chat Stream Wallpaper */}
                        <div className="flex-1 p-3 sm:p-5 space-y-3 overflow-y-auto min-h-[260px] max-h-[360px] sm:max-h-[400px] md:max-h-[440px] bg-[#efeae2]/30 bg-[radial-gradient(#1b4332_0.4px,transparent_0.4px)] [background-size:16px_16px]">
                          
                          {/* Welcome Security Badge */}
                          <div className="text-center py-1">
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-emerald-900 bg-white/90 border border-emerald-900/15 px-3 py-1 rounded-full shadow-2xs font-bold">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Direct 1-on-1 end-to-end conversation on Mqulima Konnekt</span>
                            </span>
                          </div>

                          {(activeChat?.log || []).map((msg, i) => {
                            const isMe = msg.sender === (currentUser ? currentUser.username : "@mqulima_guest");
                            const reaction = messageReactions[msg.id];
                            return (
                              <div key={msg.id || i} className={`flex gap-2 items-end ${isMe ? "justify-end" : "justify-start"} group`}>
                                {!isMe && (
                                  <img
                                    src={partner?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.sender)}`}
                                    alt="avatar"
                                    className="h-6 w-6 rounded-full object-cover shrink-0 mb-1 border border-stone-200 shadow-2xs"
                                  />
                                )}

                                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%] sm:max-w-[70%]`}>
                                  
                                  {/* WhatsApp / Instagram Style Chat Bubble */}
                                  <div className={`relative px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs transition-all ${
                                    isMe 
                                      ? "bg-[#005C4B] text-white rounded-tr-xs text-left" 
                                      : "bg-white text-stone-900 rounded-tl-xs text-left border border-stone-200/80 shadow-xs"
                                  }`}>
                                    {msg.image && (
                                      <img src={msg.image} alt="attachment" className="rounded-xl max-h-48 w-full object-cover mb-2 border border-black/10 shadow-2xs" />
                                    )}
                                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                                    {/* Quick Reaction Pill */}
                                    {reaction && (
                                      <span className="absolute -bottom-2 right-2 bg-white border border-stone-200 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm animate-bounce">
                                        {reaction}
                                      </span>
                                    )}
                                  </div>

                                  {/* Quick Emoji Reaction Buttons Bar (Hover) */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 text-[11px] bg-white border border-stone-200 rounded-full px-2 py-0.5 shadow-sm">
                                    {["❤️", "👍", "🔥", "😂", "👏"].map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => setMessageReactions(prev => ({ ...prev, [msg.id]: prev[msg.id] === emoji ? "" : emoji }))}
                                        className="hover:scale-125 transition-transform px-0.5 cursor-pointer"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Timestamp & WhatsApp Double Checkmark */}
                                  <span className="text-[9px] text-stone-400 font-mono block mt-0.5 px-1 flex items-center gap-1">
                                    <span>{msg.timestamp}</span>
                                    {isMe && (
                                      msg.read ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-sky-400 inline font-bold" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5 text-stone-300 inline" />
                                      )
                                    )}
                                  </span>

                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Image Preview attachment Bar */}
                        {chatImageAttachment && (
                          <div className="p-3 px-4 bg-emerald-50/90 border-t border-emerald-200/80 flex items-center justify-between text-left shadow-inner">
                            <div className="flex items-center gap-3">
                              <img src={chatImageAttachment} alt="preview" className="h-11 w-11 rounded-xl object-cover border-2 border-white shadow-2xs" />
                              <div>
                                <span className="text-xs text-emerald-950 font-bold block">Photo Attached</span>
                                <span className="text-[10px] text-emerald-700">Ready to send with your message</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => setChatImageAttachment(null)}
                              className="text-emerald-700 hover:text-emerald-950 p-1 bg-white rounded-lg shadow-2xs cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* Emoji Picker Popover */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-20 left-4 bg-white border border-stone-200/90 rounded-2xl p-3 shadow-xl z-20 grid grid-cols-6 gap-2 text-xl animate-in fade-in zoom-in-95 duration-150">
                            {["🌽", "🍅", "🥑", "🚜", "💧", "🌱", "🐄", "👍", "❤️", "🔥", "👏", "😊"].map(e => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => {
                                  setChatInput(prev => prev + e);
                                  setShowEmojiPicker(false);
                                }}
                                className="hover:scale-125 transition p-1.5 hover:bg-emerald-50 rounded-xl cursor-pointer"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* WhatsApp / Instagram Floating Input Footer Bar */}
                        <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 px-3 sm:px-4 bg-white border-t border-stone-200/80 flex items-center gap-2 shrink-0 rounded-b-2xl sm:rounded-b-3xl">
                          
                          {/* Image Upload Button */}
                          <label className="p-2 text-stone-500 hover:text-[#1B4332] hover:bg-stone-100 rounded-full transition cursor-pointer shrink-0">
                            <ImageIcon className="h-5 w-5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setChatImageAttachment(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          {/* Emoji Trigger Button */}
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-stone-500 hover:text-amber-600 hover:bg-stone-100 rounded-full transition cursor-pointer shrink-0"
                          >
                            <Smile className="h-5 w-5" />
                          </button>

                          {/* Input text */}
                          <input 
                            type="text" 
                            placeholder={`Message ${activeChat?.name || "farmer"}...`}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            className="flex-1 bg-stone-100 focus:bg-white border border-stone-200/90 rounded-full px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-[#1B4332] transition font-medium"
                          />

                          {/* WhatsApp Style Circular Green Send Button */}
                          <button 
                            type="submit"
                            className="bg-[#00A884] hover:bg-[#008f70] text-white p-2.5 rounded-full transition-all active:scale-95 flex items-center justify-center shrink-0 shadow-md cursor-pointer"
                            title="Send message"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </form>

                      </div>
                    )}

                  {/* Partner Info Right Drawer (3 cols when open) */}
                  {showPartnerDrawer && activeChat?.farmer && (
                    <div className="md:col-span-3 border-l border-stone-200/60 bg-gradient-to-b from-stone-50 via-emerald-50/10 to-stone-50 p-4 text-left space-y-4">
                      <div className="flex justify-between items-center border-b border-stone-200/80 pb-2.5">
                        <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-[#1B4332]" />
                          <span>Farmer Details</span>
                        </h4>
                        <button 
                          onClick={() => setShowPartnerDrawer(false)}
                          className="text-stone-400 hover:text-stone-700 text-xs p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-center space-y-2">
                        <div className="relative inline-block">
                          <img
                            src={activeChat.farmer.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeChat.farmer.name)}`}
                            alt={activeChat.farmer.name}
                            className="h-20 w-20 rounded-2xl object-cover border-2 border-white shadow-md mx-auto"
                          />
                          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                        </div>
                        <div>
                          <strong className="text-sm font-black text-stone-900 block leading-tight">{activeChat.farmer.name}</strong>
                          <span className="text-xs text-emerald-800 font-mono block mt-0.5 font-semibold">{activeChat.farmer.username}</span>
                        </div>
                        <span className="inline-block text-[10px] font-bold bg-emerald-100/80 text-emerald-900 px-3 py-1 rounded-full shadow-2xs border border-emerald-200/60">
                          📍 {activeChat.farmer.county}, Kenya
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs text-stone-700 border-t border-stone-200/80 pt-3">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono">Member Status:</span>
                          <p className="font-bold text-[#1B4332] flex items-center gap-1.5 mt-0.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                            <span>Verified Mqulima Farmer</span>
                          </p>
                        </div>
                        
                        {activeChat.farmer.crops.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono">Main Crops:</span>
                            <p className="text-emerald-900 font-bold mt-0.5">{activeChat.farmer.crops.join(", ")}</p>
                          </div>
                        )}

                        {activeChat.farmer.bio && (
                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono">Bio:</span>
                            <p className="text-stone-600 text-[11px] leading-relaxed mt-0.5">{activeChat.farmer.bio}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 space-y-2">
                        <button
                          onClick={() => handleToggleFollow(activeChat.farmer!.username)}
                          className={`w-full py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                            followedUsernames.includes(activeChat.farmer!.username.startsWith("@") ? activeChat.farmer!.username : `@${activeChat.farmer!.username}`)
                              ? "bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {followedUsernames.includes(activeChat.farmer!.username.startsWith("@") ? activeChat.farmer!.username : `@${activeChat.farmer!.username}`) ? (
                            <>
                              <UserCheck className="h-4 w-4 text-emerald-300" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4" />
                              <span>Follow Farmer</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedProfileUsername(activeChat.farmer!.username)}
                          className="w-full py-2 bg-white border border-emerald-900/20 hover:bg-emerald-50 text-[#1B4332] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <User className="h-4 w-4" />
                          <span>View Full Profile</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* 🏠 POSTS COMMUNITY FEED & SAVED TABS VIEW */}
            {(subpage === "posts" || subpage === "saved") && !selectedProfileUsername && (
              <div className="space-y-6">
                
                {/* 1. Spacious Interactive Inline Post Composer */}
                <div className="bg-white border border-stone-250/90 rounded-3xl p-5 shadow-sm hover:border-emerald-700/40 text-left space-y-4 transition-all duration-200">
                  
                  {/* Header: Farmer Info & Category Dropdown */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={currentUser ? currentUser.avatarUrl : defaultGuestFarmer.avatarUrl} 
                        alt="avatar" 
                        className="h-11 w-11 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-2xs" 
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
                          {currentUser ? currentUser.name : "Mqulima Farmer"}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/60">
                            <Globe className="h-3 w-3" />
                            Everyone
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                            <MapPin className="h-3 w-3 text-stone-400" />
                            {currentUser?.county || "Uasin Gishu"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Category Pill Selector */}
                    <select
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value as any)}
                      className="bg-stone-50 border border-stone-200 hover:border-emerald-700 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl outline-none transition cursor-pointer"
                    >
                      <option value="Farm Progress">🌱 Farm Progress</option>
                      <option value="Harvest Update">🌾 Harvest Update</option>
                      <option value="Farming Tips">💡 Farming Tips</option>
                      <option value="Question">❓ Question</option>
                      <option value="Success Story">🏆 Success Story</option>
                    </select>
                  </div>

                  {/* Spacious Text Area for Direct Typing */}
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={createBody}
                      onFocus={() => {
                        if (!currentUser) requireAuth("share post updates");
                      }}
                      onChange={(e) => setCreateBody(e.target.value)}
                      placeholder={currentUser ? `What's happening on your farm, ${currentUser.name.split(' ')[0]}? Share updates, ask questions, or celebrate a harvest...` : "Share an update, milestone, or question with the community..."}
                      className="w-full bg-stone-50/80 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-2xl p-4 text-xs sm:text-sm text-stone-850 placeholder:text-stone-400 outline-none resize-none leading-relaxed transition-all duration-200"
                    />

                    {/* Attached Media Thumbnails */}
                    {postMediaFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {postMediaFiles.map((m, idx) => (
                          <div key={idx} className="relative h-16 w-16 rounded-xl overflow-hidden border border-stone-200 bg-stone-900 group">
                            {m.type === "image" ? (
                              <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-emerald-400 text-xs font-bold">
                                <Video className="h-5 w-5" />
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePostMedia(idx)}
                              className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5 transition cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Controls & Publish Button Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Device Photo / Video Attachment */}
                      <label className="py-2 px-3 hover:bg-emerald-50/80 rounded-xl text-stone-600 hover:text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-stone-50/60 border border-stone-200/60">
                        <ImageIcon className="h-4 w-4 text-emerald-600" />
                        <span className="hidden sm:inline">Add Media</span>
                        <span className="sm:hidden">Media</span>
                        <input 
                          type="file" 
                          accept="image/*,video/*" 
                          multiple 
                          onChange={handlePostMediaUpload} 
                          className="hidden" 
                        />
                      </label>

                      {/* Emoji Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiShortcutBar(!showEmojiShortcutBar)}
                        className="py-2 px-3 hover:bg-amber-50/80 rounded-xl text-stone-600 hover:text-amber-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-stone-50/60 border border-stone-200/60"
                      >
                        <Smile className="h-4 w-4 text-amber-600" />
                        <span className="hidden sm:inline">Emoji</span>
                      </button>

                      {/* Full Modal Pop-out Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!requireAuth("create post")) return;
                          setIsPostComposerOpen(true);
                        }}
                        className="py-2 px-3 hover:bg-blue-50/80 rounded-xl text-stone-600 hover:text-blue-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-stone-50/60 border border-stone-200/60"
                        title="Open full composer modal"
                      >
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span className="hidden sm:inline">Full Modal</span>
                      </button>
                    </div>

                    {/* Direct Publish Post Button */}
                    <button
                      type="button"
                      disabled={isSubmittingPost || !createBody.trim()}
                      onClick={handleCreatePost}
                      className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-md ${
                        createBody.trim() && !isSubmittingPost
                          ? "bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] hover:scale-105 active:scale-95"
                          : "bg-stone-200 text-stone-400 cursor-not-allowed"
                      }`}
                    >
                      {isSubmittingPost ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 fill-current" />
                          <span>Publish Post</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Emoji Shortcut Panel (if open) */}
                  {showEmojiShortcutBar && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-2xl border border-stone-200/70 text-base">
                      {["🌾", "🌽", "🍅", "🥛", "🐮", "🚜", "🌱", "☀️", "🌧️", "💚", "🎯", "🏷️", "📍", "💡"].map((emoji, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCreateBody(prev => prev + " " + emoji)}
                          className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                </div>

                {/* 2. DEDICATED SOCIAL POST COMPOSER MODAL */}
                <AnimatePresence>
                  {isPostComposerOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-xl border border-stone-250/60 text-left relative my-auto max-h-[90vh] flex flex-col"
                      >
                        {/* Header Bar */}
                        <div className="px-5 py-4 border-b border-stone-150 flex items-center justify-between bg-stone-50/60 shrink-0">
                          <div>
                            <h3 className="text-base font-bold text-stone-900 font-serif">Create Post</h3>
                            <p className="text-[11px] text-stone-400 font-medium">Share with the Mqulima agricultural community</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsPostComposerOpen(false)}
                            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition cursor-pointer"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1">
                          
                          {/* User Identity & Category Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={currentUser ? currentUser.avatarUrl : defaultGuestFarmer.avatarUrl}
                                alt="Avatar"
                                className="h-10 w-10 rounded-xl object-cover border border-stone-200 shadow-2xs"
                              />
                              <div>
                                <h4 className="text-xs font-bold text-stone-900 leading-tight">
                                  {currentUser ? currentUser.name : "Mqulima Farmer"}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/60">
                                    <Globe className="h-3 w-3" />
                                    {postAudience}
                                  </span>
                                  {createLocation && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                                      <MapPin className="h-3 w-3 text-stone-400" />
                                      {createLocation}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Category Selector */}
                            <select
                              value={createCategory}
                              onChange={(e) => setCreateCategory(e.target.value as any)}
                              className="bg-stone-50 border border-stone-200 hover:border-emerald-700 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-xl outline-none transition cursor-pointer"
                            >
                              <option value="Farm Progress">🌱 Farm Progress</option>
                              <option value="Harvest Update">🌾 Harvest Update</option>
                              <option value="Farming Tips">💡 Farming Tips</option>
                              <option value="Question">❓ Question</option>
                              <option value="Success Story">🏆 Success Story</option>
                            </select>
                          </div>

                          {/* Large Text Editor Area */}
                          <div className="space-y-2">
                            <textarea
                              rows={5}
                              value={createBody}
                              onChange={(e) => setCreateBody(e.target.value)}
                              placeholder={`Share a farm update, ask a question, or tell the community what's happening on your farm, ${currentUser ? currentUser.name.split(' ')[0] : 'farmer'}...`}
                              className="w-full bg-transparent text-sm text-stone-850 placeholder:text-stone-400 outline-none resize-none leading-relaxed font-normal"
                              autoFocus
                            />

                            {/* Emoji Shortcuts Bar (Collapsible) */}
                            {showEmojiShortcutBar && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-2xl border border-stone-200/70 text-base">
                                {["🌾", "🌽", "🍅", "🥛", "🐮", "🚜", "🌱", "☀️", "🌧️", "💚", "🎯", "🏷️", "📍", "💡"].map((emoji, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCreateBody(prev => prev + " " + emoji)}
                                    className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer hover:scale-125"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Attached Media Gallery Preview */}
                          {postMediaFiles.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                                <span>Attached Media ({postMediaFiles.length})</span>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                                {postMediaFiles.map((media, idx) => (
                                  <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-2xs">
                                    {media.type === "image" ? (
                                      <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center text-white text-[9px] p-2 text-center">
                                        <Video className="h-6 w-6 text-emerald-400 mb-1" />
                                        <span className="truncate w-full font-mono">{media.name}</span>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePostMedia(idx)}
                                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition shadow-xs cursor-pointer"
                                      title="Remove item"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expandable Agricultural Fields (Crops, Livestock, Location, Links) */}
                          {(showTagFields || showMediaFields) && (
                            <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-3">
                              {showTagFields && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Crop Tags</label>
                                    <input
                                      type="text"
                                      placeholder="Maize, Tomatoes..."
                                      value={createCrops}
                                      onChange={(e) => setCreateCrops(e.target.value)}
                                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Livestock Tags</label>
                                    <input
                                      type="text"
                                      placeholder="Dairy Cattle, Poultry..."
                                      value={createLivestock}
                                      onChange={(e) => setCreateLivestock(e.target.value)}
                                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Farm Location</label>
                                    <input
                                      type="text"
                                      placeholder="Nakuru, Kenya"
                                      value={createLocation}
                                      onChange={(e) => setCreateLocation(e.target.value)}
                                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                                    />
                                  </div>
                                </div>
                              )}

                              {showMediaFields && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Direct Image Link</label>
                                    <input
                                      type="text"
                                      placeholder="https://example.com/photo.jpg"
                                      value={createImagesText}
                                      onChange={(e) => setCreateImagesText(e.target.value)}
                                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Direct Video Address</label>
                                    <input
                                      type="text"
                                      placeholder="https://example.com/video.mp4"
                                      value={createVideoUrl}
                                      onChange={(e) => setCreateVideoUrl(e.target.value)}
                                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-700"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* "Add to Your Post" Toolbar */}
                          <div className="p-3 bg-stone-50/60 rounded-2xl border border-stone-200/70 flex items-center justify-between gap-2 overflow-x-auto">
                            <span className="text-xs font-bold text-stone-700 shrink-0 pl-1">Add to post:</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              
                              <label className="p-2 hover:bg-emerald-100/70 text-emerald-800 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold" title="Upload Photo/Video">
                                <ImageIcon className="h-4 w-4 text-emerald-600" />
                                <span className="hidden sm:inline">Photo/Video</span>
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  multiple
                                  onChange={handlePostMediaUpload}
                                  className="hidden"
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() => setShowTagFields(!showTagFields)}
                                className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                                  showTagFields ? "bg-amber-100 text-amber-900" : "hover:bg-stone-200/60 text-stone-700"
                                }`}
                                title="Tag Crops & Location"
                              >
                                <Tag className="h-4 w-4 text-amber-600" />
                                <span className="hidden sm:inline">Tags & Location</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowMediaFields(!showMediaFields)}
                                className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                                  showMediaFields ? "bg-blue-100 text-blue-900" : "hover:bg-stone-200/60 text-stone-700"
                                }`}
                                title="Add Links"
                              >
                                <Globe className="h-4 w-4 text-blue-600" />
                                <span className="hidden sm:inline">Link</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowEmojiShortcutBar(!showEmojiShortcutBar)}
                                className="p-2 hover:bg-stone-200/60 text-stone-700 rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1"
                                title="Insert Emoji"
                              >
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <span className="hidden sm:inline">Emojis</span>
                              </button>

                            </div>
                          </div>

                        </div>

                        {/* Modal Footer / Publish Actions */}
                        <div className="px-5 py-3.5 border-t border-stone-150 bg-stone-50/80 flex items-center justify-between gap-3 shrink-0">
                          <div className="flex items-center gap-2">
                            {(createBody || createCrops || postMediaFiles.length > 0) && (
                              <button
                                type="button"
                                onClick={clearPostDraft}
                                className="text-[11px] font-bold text-stone-400 hover:text-red-600 transition cursor-pointer"
                              >
                                Clear Draft
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">
                              {createBody.length} chars
                            </span>
                            <button
                              type="button"
                              onClick={handleCreatePost}
                              disabled={!createBody.trim() || isSubmittingPost}
                              className={`px-6 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer ${
                                !createBody.trim() || isSubmittingPost
                                  ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                                  : "bg-[#1B4332] hover:bg-[#2D6A4F] text-white active:scale-95"
                              }`}
                            >
                              {isSubmittingPost ? (
                                <>
                                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                                  <span>Publishing...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5" />
                                  <span>Publish Post</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Refined Premium Onboarding Experience for Guests */}
                {!currentUser && subpage === "posts" && (
                  <div className="bg-gradient-to-b from-[#FBFDFB] via-[#F4F7F4] to-[#EAEFEA] rounded-3xl p-6 sm:p-8 text-left border border-stone-200/90 shadow-xs relative overflow-hidden space-y-6">
                    
                    {/* Subtle background glow pattern */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl -z-0 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl -z-0 pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                      
                      {/* Top Header Row: Eyebrow + Community Avatar Stack */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200/70 text-[#1B4332] text-[11px] font-bold tracking-wider uppercase self-start sm:self-auto">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Mqulima Agricultural Community</span>
                        </div>
                      </div>

                      {/* Editorial Headline & Description */}
                      <div className="space-y-2 max-w-xl">
                        <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-stone-900 tracking-tight leading-snug">
                          Where Farmers Connect, Share, and Grow Together
                        </h2>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
                          Join Kenya’s dedicated farming identity platform. Share real-time crop & harvest updates, discover verified agricultural practices, and build lasting professional connections with fellow farmers.
                        </p>
                      </div>

                      {/* Prominent CTA Button & Micro-copy */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUser) {
                              navigate({ to: "/auth/sign-up", search: { redirect: "/community" } as any });
                            } else {
                              setIsRegisteringProfile(true);
                            }
                          }}
                          className="px-7 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white active:scale-[0.98] rounded-full text-xs font-bold transition-all shadow-md shadow-[#1B4332]/20 flex items-center gap-2 cursor-pointer"
                        >
                          <UserCheck className="h-4 w-4 text-emerald-400" />
                          <span>Create Your Farmer Profile</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </button>

                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Set up in under a minute • Free forever</span>
                        </div>
                      </div>

                      {/* Elegant 01 -> 02 -> 03 Journey Flow */}
                      <div className="border-t border-stone-250/70 pt-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
                          
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-serif font-bold text-emerald-800 bg-emerald-100/70 rounded-lg px-2 py-1 shrink-0">
                              01
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-emerald-700" />
                                <span>Build Your Profile</span>
                              </h4>
                              <p className="text-[11px] text-stone-500 leading-relaxed">
                                Share details about your farm, location, and main agricultural focus areas.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <span className="text-xs font-serif font-bold text-emerald-800 bg-emerald-100/70 rounded-lg px-2 py-1 shrink-0">
                              02
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                                <span>Share Your Journey</span>
                              </h4>
                              <p className="text-[11px] text-stone-500 leading-relaxed">
                                Post farm progress, harvest achievements, crop photos, and ask questions.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <span className="text-xs font-serif font-bold text-emerald-800 bg-emerald-100/70 rounded-lg px-2 py-1 shrink-0">
                              03
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                                <span>Grow Your Network</span>
                              </h4>
                              <p className="text-[11px] text-stone-500 leading-relaxed">
                                Connect with buyers, agronomists, and peers to earn community reputation.
                              </p>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                )}



                {/* Subpage title */}
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-[15px] font-bold text-[#2D3436]" style={{ letterSpacing: '-0.02em' }}>
                    {subpage === "posts" ? "Community Discussion & Posts" : "Saved Posts"}
                  </h2>
                  <span className="text-[12px] text-[#636E72] font-medium">{filteredPosts.length} posts</span>
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                  {filteredPosts.map((post, postIdx) => (
                    <div 
                      key={post.id} 
                      className="mq-card p-5 space-y-3.5 text-left"
                      style={{ animationDelay: `${postIdx * 0.08}s` }}
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={post.author.avatarUrl} 
                            alt="author" 
                            className="h-10 w-10 rounded-full object-cover border border-black/[0.06]" 
                          />
                          
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => setSelectedProfileUsername(post.author.username)}
                                className="text-[13px] font-semibold text-[#2D3436] hover:text-[#1B4332] transition"
                              >
                                {post.author.name}
                              </button>
                              <span className="text-[12px] text-[#636E72]">{post.author.username}</span>
                              <span className="text-[#636E72]">·</span>
                              <span className="text-[12px] text-[#636E72]">{post.createdAt}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg inline-block mt-0.5 border ${
                              post.category === "Harvest Update" ? "bg-amber-100/90 text-amber-900 border-amber-200" :
                              post.category === "Question" ? "bg-sky-100/90 text-sky-900 border-sky-200" :
                              post.category === "Farming Tips" ? "bg-teal-100/90 text-teal-900 border-teal-200" :
                              post.category === "Success Story" ? "bg-yellow-100/90 text-yellow-900 border-yellow-300" :
                              "bg-emerald-100/90 text-emerald-900 border-emerald-200"
                            }`}>
                              {post.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {currentUser && (isPostByFarmer(post, currentUser) || post.author.username === "@mqulima_farmer" || post.author.username === "@mqulima_guest") && (
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                              title="Delete this post"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => setExpandedProfilePostId(expandedProfilePostId === post.id ? null : post.id)}
                            className="p-1.5 hover:bg-black/[0.03] rounded-lg transition text-[#636E72] cursor-pointer"
                            title="Author Info"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Farmer Bio Panel */}
                      {expandedProfilePostId === post.id && (
                        <div className="bg-[#FAFBF9] border border-[#E2EADF] rounded-2xl p-5 space-y-3.5 text-xs text-stone-600 relative shadow-sm">
                          <button 
                            onClick={() => setExpandedProfilePostId(null)}
                            className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1 hover:bg-stone-100 rounded-lg transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          
                          <div className="flex gap-4 items-center">
                            <img src={post.author.avatarUrl} alt="author" className="h-12 w-12 rounded-xl object-cover border border-[#1A5438]/15 shadow-xs" />
                            <div>
                              <strong className="text-stone-850 block font-bold">{post.author.name}</strong>
                              <span className="text-[10px] text-stone-400 font-mono block">{post.author.username}</span>
                              <span className="text-[10px] block mt-0.5 text-stone-500 font-medium">📍 {post.author.county}, {post.author.country}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 text-center text-[10px] pt-2.5 border-t border-stone-200/40">
                            <div>
                              <span className="text-stone-400 font-bold uppercase tracking-wider block font-mono text-[9px]">REPUTATION</span>
                              <strong className="text-[#1A5438] font-mono text-xs font-black">{post.author.reputationScore} pts</strong>
                            </div>
                            <div>
                              <span className="text-stone-400 font-bold uppercase tracking-wider block font-mono text-[9px]">CROPS</span>
                              <strong className="text-stone-750 font-mono text-xs font-black">{post.author.crops.length} Types</strong>
                            </div>
                          </div>

                          <div className="text-[10px] space-y-1.5 pt-2 border-t border-stone-200/20">
                            <div>
                              <strong className="text-stone-400 uppercase text-[9px] font-mono tracking-wider block">Crops grown:</strong>
                              <p className="font-bold text-emerald-800">{post.author.crops.join(", ")}</p>
                            </div>
                            <div>
                              <strong className="text-stone-400 uppercase text-[9px] font-mono tracking-wider block">Livestock kept:</strong>
                              <p className="font-bold text-blue-800">{post.author.livestock.join(", ") || "None"}</p>
                            </div>
                            <div>
                              <strong className="text-stone-400 uppercase text-[9px] font-mono tracking-wider block">Main Interests:</strong>
                              <p className="font-bold text-amber-700">{post.author.interests.join(", ")}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Post Content */}
                      <div className="space-y-3">
                        {/* Post Video (First) */}
                        {post.videoUrl && (
                          <div className="mq-media-frame">
                            <video src={post.videoUrl} controls className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Post Images (First) */}
                        {post.images && post.images.length > 0 && (
                          <div 
                            className="mq-media-frame cursor-pointer" 
                            style={{ maxHeight: '400px' }}
                            onClick={() => setActiveLightboxImage(post.images[0])}
                          >
                            <img 
                              src={post.images[0]} 
                              alt="Post media" 
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                              loading="lazy"
                            />
                            {post.images.length > 1 && (
                              <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1 rounded-lg">
                                +{post.images.length - 1} more photos
                              </span>
                            )}
                          </div>
                        )}

                        {/* Post Text Body */}
                        <p className="text-[#2D3436] text-[14px] leading-relaxed whitespace-pre-wrap">
                          {post.body}
                        </p>

                        {/* Location pill */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#636E72] font-medium">
                          <MapPin className="h-3.5 w-3.5 text-[#2D6A4F]" />
                          <span>{post.location}</span>
                        </div>

                        {/* Crops/Livestock tags */}
                        {(post.cropsTagged.length > 0 || post.livestockTagged.length > 0) && (
                          <div className="flex flex-wrap gap-1.5">
                            {post.cropsTagged.map((c, idx) => (
                              <span key={idx} className="mq-tag mq-tag-green">#{String(c).replace(/^#+/, "")}</span>
                            ))}
                            {post.livestockTagged.map((l, idx) => (
                              <span key={idx} className="mq-tag mq-tag-blue">#{String(l).replace(/^#+/, "")}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Actions Row */}
                      <div className="flex items-center justify-between border-t border-black/[0.04] pt-3">
                        
                        <button 
                          onClick={() => handleLikePost(post.id)}
                          className={`mq-engage-btn ${post.hasLiked ? 'liked' : ''}`}
                        >
                          <Heart className={`h-4 w-4 ${post.hasLiked ? 'fill-current heart-pop' : ''}`} />
                          <span>{post.likes}</span>
                        </button>

                        <button 
                          onClick={() => setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id)}
                          className="mq-engage-btn"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments.length}</span>
                        </button>

                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Link copied!");
                          }}
                          className="mq-engage-btn"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>Share</span>
                        </button>

                        <button 
                          onClick={() => handleSavePost(post.id)}
                          className={`mq-engage-btn ${post.hasSaved ? 'saved' : ''}`}
                        >
                          <Bookmark className={`h-4 w-4 ${post.hasSaved ? 'fill-current' : ''}`} />
                          <span>{post.hasSaved ? 'Saved' : 'Save'}</span>
                        </button>

                        {/* Report / Delete dropdown button */}
                        <div className="relative">
                          <button
                            onClick={() => handleOpenReport("post", post.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded-lg transition"
                            title="Report Post"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                        </div>

                      </div>

                      {/* Nested Comments Section */}
                      {expandedCommentsPostId === post.id && (
                        <div className="border-t border-black/[0.04] pt-3 space-y-3">
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {post.comments.map((comm: any, idx: number) => {
                              const isReply = Boolean(comm.parentId);
                              return (
                                <div 
                                  key={comm.id || idx} 
                                  className={`text-left space-y-1 ${isReply ? "mq-comment-reply-indent bg-emerald-50/20 p-2.5 rounded-xl" : "border-b border-stone-100/60 pb-2.5"}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      {comm.authorAvatar && (
                                        <img src={comm.authorAvatar} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                                      )}
                                      <div>
                                        <strong className="text-[12px] text-[#2D3436] font-bold">{comm.authorName}</strong>
                                        <span className="text-[10px] text-stone-400 font-mono ml-1.5">{comm.authorUsername}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                      <span className="text-stone-400">{comm.time}</span>
                                      <button
                                        onClick={() => {
                                          setReplyToCommentId(comm.id);
                                          setCommentInput(`@${comm.authorName} `);
                                        }}
                                        className="text-[#1B4332] font-bold hover:underline"
                                      >
                                        Reply
                                      </button>
                                      {comm.id && (
                                        <button
                                          onClick={() => handleOpenReport("comment", comm.id)}
                                          className="text-stone-400 hover:text-red-500"
                                        >
                                          Report
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-[12.5px] text-[#636E72] leading-relaxed pl-1">{comm.text}</p>
                                </div>
                              );
                            })}
                            {post.comments.length === 0 && (
                              <p className="text-[12px] text-[#636E72] py-2 italic text-center">No comments yet. Start the conversation!</p>
                            )}
                          </div>

                          {/* Reply Indicator Pill */}
                          {replyToCommentId && (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800 font-medium">
                              <span>Replying to comment thread...</span>
                              <button 
                                onClick={() => {
                                  setReplyToCommentId(null);
                                  setCommentInput("");
                                }} 
                                className="text-stone-500 hover:text-stone-800"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              required 
                              placeholder={replyToCommentId ? "Write your reply..." : "Write a comment..."} 
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              className="flex-1 bg-white border border-black/[0.06] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#1B4332] transition-colors"
                            />
                            <button 
                              onClick={() => handleAddComment(post.id)}
                              className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-[12px] font-semibold transition-colors shadow-xs"
                            >
                              Publish
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                  {filteredPosts.length === 0 && (
                    <div className="mq-card-static text-center py-16 px-8 space-y-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: '#E9F5EC' }}>
                        <MessageSquare className="h-6 w-6 text-[#1B4332]" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-[15px] font-bold text-[#2D3436]">No posts yet</h3>
                        <p className="text-[13px] text-[#636E72] max-w-sm mx-auto">
                          Be the first to share a farm update, ask a question, or celebrate a harvest!
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile/Tablet Stacked Content (Hidden on desktop) */}
                <div className="space-y-6 pt-6 border-t border-stone-200/60 mt-8">
                  
                  {/* 1. Mobile Profile Card (Only shown on < 768px when Left Sidebar is hidden) */}
                  {currentUser && (
                    <div className="block md:hidden space-y-4">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block px-1">My Farm Profile</span>
                      <div className="mq-card-static p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img 
                              src={currentUser.avatarUrl} 
                              alt="avatar" 
                              className="h-14 w-14 rounded-2xl object-cover border border-black/[0.06]" 
                            />
                            <span className="mq-online-dot" />
                          </div>
                          <div className="min-w-0 text-left">
                            <strong className="text-[14px] font-bold text-[#2D3436] block truncate leading-tight">{currentUser.name}</strong>
                            <span className="text-[12px] text-[#636E72] block truncate">{currentUser.username}</span>
                          </div>
                        </div>
                        
                        {/* Reputation badge & progress */}
                        <div className="space-y-2 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-[#636E72]">
                              {currentUser.reputationScore < 500 ? "New Farmer" : currentUser.reputationScore < 1500 ? "Rising Farmer" : currentUser.reputationScore < 3000 ? "Gold Farmer" : "Platinum Farmer"}
                            </span>
                            <span className="text-[12px] font-bold text-[#1B4332]">{currentUser.reputationScore} pts</span>
                          </div>
                          <div className="mq-progress-bar">
                            <div className="mq-progress-bar-fill" style={{ width: `${Math.min(100, (currentUser.reputationScore / 3000) * 100)}%` }} />
                          </div>
                        </div>

                        <div className="flex gap-3 text-center border-t border-black/[0.04] pt-3">
                          <div className="flex-1">
                            <span className="text-[13px] font-bold text-[#1B4332] block truncate">{currentUser.county || "Kenya"}</span>
                            <span className="text-[11px] text-[#636E72] font-medium">Location</span>
                          </div>
                          <div className="flex-1 border-l border-black/[0.04]">
                            <span className="text-[16px] font-bold text-[#1B4332] block">{currentUser.crops.length}</span>
                            <span className="text-[11px] text-[#636E72] font-medium">Crops</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Mobile Widgets (Only shown on < 1024px when Right Sidebar is hidden) */}
                  <div className="block lg:hidden space-y-6">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block px-1">Community Highlights</span>
                    
                    {/* Agri Network */}
                    <div className="mq-card-static p-5 space-y-3.5">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <h4 className="text-[13px] font-black uppercase tracking-wider font-serif">
                          <span className="bg-gradient-to-r from-[#1B4332] to-[#40916C] bg-clip-text text-transparent">Agri Network</span>
                        </h4>
                        <button 
                          onClick={() => {
                            setSubpage("network");
                            setSelectedProfileUsername(null);
                          }}
                          className="text-[11px] font-semibold text-[#1B4332] hover:underline"
                        >
                          See All ({farmers.length})
                        </button>
                      </div>
                      <div className="space-y-3">
                        {farmers.filter(f => f.username !== currentUser?.username).slice(0, 5).map((f) => (
                          <div key={f.username} className="flex gap-2.5 items-center justify-between group">
                            <button 
                              onClick={() => setSelectedProfileUsername(f.username)}
                              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition text-left cursor-pointer"
                            >
                              <div className="relative shrink-0">
                                <img src={f.avatarUrl} alt="avatar" className="h-9 w-9 rounded-full object-cover border border-black/[0.06] shadow-2xs" />
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                              </div>
                              <div className="min-w-0 text-left">
                                <strong className="text-[13px] text-[#2D3436] block truncate leading-tight font-semibold group-hover:text-[#1B4332] transition-colors">{f.name}</strong>
                                <span className="text-[11px] text-[#636E72] block truncate">📍 {f.county || "Kenya"}</span>
                              </div>
                            </button>
                            <button
                              onClick={() => handleStartChat(f)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] rounded-lg transition shrink-0 cursor-pointer"
                              title={`Send message to ${f.name}`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </main>

          {/* ══════════════════════════════════════════
              RIGHT SIDEBAR: EXTRA WIDGETS
              ══════════════════════════════════════════ */}
          <aside className="lg:col-span-3 space-y-5 text-left mq-right-sidebar mq-hide-lg-down">
            
            {/* Agri Network to Follow */}
            <div className="mq-card-static p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h4 className="text-[13px] font-black uppercase tracking-wider font-serif">
                  <span className="bg-gradient-to-r from-[#1B4332] to-[#40916C] bg-clip-text text-transparent">Agri Network</span>
                </h4>
                <button 
                  onClick={() => {
                    setSubpage("network");
                    setSelectedProfileUsername(null);
                  }}
                  className="text-[11px] font-semibold text-[#1B4332] hover:underline flex items-center gap-1"
                >
                  <span>See All ({farmers.length})</span>
                  <UserPlus className="h-3.5 w-3.5 text-[#1B4332]" />
                </button>
              </div>
              
              <div className="space-y-3">
                {farmers.filter(f => f.username !== currentUser?.username).slice(0, 5).map((f) => (
                  <div key={f.username} className="flex gap-2.5 items-center justify-between group">
                    <button 
                      onClick={() => setSelectedProfileUsername(f.username)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition text-left cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <img src={f.avatarUrl} alt="avatar" className="h-9 w-9 rounded-full object-cover border border-black/[0.06] shadow-2xs" />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
                      </div>
                      <div className="min-w-0 text-left">
                        <strong className="text-[13px] text-[#2D3436] block truncate leading-tight font-semibold group-hover:text-[#1B4332] transition-colors">{f.name}</strong>
                        <span className="text-[10px] text-emerald-800 font-mono block truncate">📍 {f.county || "Kenya"}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleFollow(f.username)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
                          followedUsernames.includes(f.username.startsWith("@") ? f.username : `@${f.username}`)
                            ? "bg-[#1B4332] text-white"
                            : "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                        }`}
                        title={followedUsernames.includes(f.username.startsWith("@") ? f.username : `@${f.username}`) ? "Following" : "Follow farmer"}
                      >
                        {followedUsernames.includes(f.username.startsWith("@") ? f.username : `@${f.username}`) ? (
                          <UserCheck className="h-3 w-3 text-emerald-300" />
                        ) : (
                          <UserPlus className="h-3 w-3 text-emerald-700" />
                        )}
                        <span>{followedUsernames.includes(f.username.startsWith("@") ? f.username : `@${f.username}`) ? "Following" : "Follow"}</span>
                      </button>
                      <button
                        onClick={() => handleStartChat(f)}
                        className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition cursor-pointer"
                        title={`Send message to ${f.name}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Agri News */}
            <div className="mq-card-static p-5 space-y-3.5">
              <Link to="/blog" className="flex items-center justify-between border-b border-stone-100 pb-2.5 group cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-700 group-hover:scale-110 transition-transform" />
                  <h4 className="text-sm font-black font-serif text-teal-950 tracking-tight group-hover:text-teal-700 transition-colors">Latest Agri News</h4>
                </div>
                <span className="text-[11px] font-bold text-teal-800 group-hover:underline">See All →</span>
              </Link>
              
              <div className="space-y-3">
                {realNewsPosts.length > 0 ? (
                  realNewsPosts.slice(0, 3).map((news) => {
                    const categoryStyle = news.category === "Policy & Finance" 
                      ? "bg-blue-100 text-blue-900 border border-blue-200"
                      : news.category === "Agri-Tech"
                      ? "bg-purple-100 text-purple-900 border border-purple-200"
                      : news.category === "Market Prices"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      : news.category === "Farm Tips"
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : "bg-teal-100 text-teal-900 border border-teal-200";

                    return (
                      <Link 
                        key={news.id} 
                        to="/blog"
                        className="block space-y-1.5 pb-3 border-b border-black/[0.04] last:border-0 last:pb-0 hover:bg-stone-50/80 p-1.5 rounded-lg transition text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${categoryStyle}`}>{news.category}</span>
                          <span className="text-[11px] text-[#636E72]">{news.publishedAt || "Recent"}</span>
                        </div>
                        <h5 className="text-[13px] text-[#2D3436] group-hover:text-teal-900 leading-snug font-medium transition-colors line-clamp-2">{news.title}</h5>
                      </Link>
                    );
                  })
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-stone-500 font-medium italic">No news published yet.</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 text-center">
                <Link to="/blog" className="text-[11px] font-bold text-teal-800 hover:text-teal-950 hover:underline">
                  View All Mqulima News & Insights →
                </Link>
              </div>
            </div>

            {/* Mqulima AI Promo Card */}
            <div className="p-5 space-y-3.5 bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#143D2B] text-white shadow-md rounded-3xl border border-emerald-700/50 relative overflow-hidden">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                  <Sparkles className="h-5 w-5 text-amber-300 fill-amber-300/20" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-white tracking-tight">Mqulima AI</h4>
                  <p className="text-[11px] text-emerald-200 font-medium">Instant farming advice</p>
                </div>
              </div>
              <p className="text-[12px] text-emerald-100/90 leading-relaxed font-normal">
                Get personalized crop recommendations, pest identification, and market insights via WhatsApp.
              </p>
              <button 
                onClick={() => setSubpage("consult")}
                className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-all bg-amber-400 hover:bg-amber-300 text-stone-900 shadow-sm cursor-pointer"
              >
                Chat Now
              </button>
            </div>

          </aside>

        </div>

        {/* ══════════════════════════════════════════
            SUPABASE DATABASE AND RLS SCHEMA DASHBOARD PANEL
            ══════════════════════════════════════════ */}
        <AnimatePresence>
          {showRLSDashboard && (
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className="mt-8 bg-white/90 backdrop-blur-lg border border-[#E2EADF] shadow-2xl rounded-3xl p-6 text-left space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-2">
                <div className="flex items-center gap-2 text-[#1A5438] font-bold text-sm font-serif">
                  <Database className="h-4.5 w-4.5" />
                  <span>Supabase Schema & Row-Level Security (RLS) Policies</span>
                </div>
                <button 
                  onClick={() => setShowRLSDashboard(false)}
                  className="text-xs text-[#1A5438] hover:bg-[#1A5438]/5 font-black border border-[#E2EADF] px-4 py-1.5 rounded-xl transition"
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
                  <div key={idx} className="bg-stone-50 border border-stone-200/50 p-4 rounded-2xl space-y-2 text-stone-600">
                    <span className="text-[#1A5438] font-bold block border-b border-stone-150 pb-1 uppercase tracking-wider">
                      Table: {schema.table}
                    </span>
                    <div>
                      <strong className="text-stone-400 block uppercase text-[8px] tracking-widest font-mono">Columns:</strong>
                      <p className="text-stone-700 leading-relaxed mt-0.5 font-mono">{schema.fields}</p>
                    </div>
                    <div>
                      <strong className="text-stone-400 block uppercase text-[8px] tracking-widest font-mono">RLS Constraints:</strong>
                      <pre className="text-emerald-800 mt-1 whitespace-pre-wrap leading-normal font-sans text-[9px] font-medium">
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

      {/* 🧩 Centered Profile Editor Modal */}
      <AnimatePresence>
        {isRegisteringProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg border border-stone-250/60 relative text-left"
            >
              {/* Cover/Banner Upload Zone */}
              <div className="h-32 relative bg-gradient-to-r from-emerald-800 to-teal-700 overflow-hidden group">
                {regCoverImage ? (
                  <img src={regCoverImage} alt="banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50 text-xs font-semibold">
                    No banner image selected
                  </div>
                )}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white text-[11px] font-semibold gap-1">
                  <Camera className="h-5 w-5" />
                  Click to upload banner
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "cover")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Avatar Ring Upload Zone */}
              <div className="relative px-6 pb-4">
                <div className="absolute -top-10 left-6 h-20 w-20 rounded-2xl overflow-hidden border-4 border-white bg-stone-50 shadow-md group relative">
                  <img
                    src={regAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(regName || "User")}&backgroundColor=1a5438&textColor=ffffff`}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "avatar")}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="pt-12">
                  <h3 className="text-base font-bold text-stone-850">Edit Profile Details</h3>
                  <p className="text-xs text-stone-400">Update your farming persona and location info</p>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleRegisterProfile} className="p-6 pt-2 space-y-4">
                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                        placeholder="e.g. Grace Cherono"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Username Handle</label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                        placeholder="e.g. @mqulima_grace"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">County / Region</label>
                    <input
                      type="text"
                      value={regCounty}
                      onChange={(e) => setRegCounty(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                      placeholder="e.g. Uasin Gishu"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Bio</label>
                      <span className={`text-[9px] font-bold ${regBio.length > 160 ? "text-red-500" : "text-stone-400"}`}>
                        {regBio.length}/160
                      </span>
                    </div>
                    <textarea
                      value={regBio}
                      onChange={(e) => {
                        if (e.target.value.length <= 160) {
                          setRegBio(e.target.value);
                        }
                      }}
                      rows={2}
                      placeholder="Write a brief introduction about your farm, experience, and interests..."
                      className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition resize-none"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Website URL</label>
                    <input
                      type="text"
                      value={regWebsite}
                      placeholder="e.g. webmakers.co.ke"
                      onChange={(e) => setRegWebsite(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                    />
                  </div>

                  {/* Contact Info (Phone & Email) */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Contact Phone</label>
                      <input
                        type="tel"
                        value={regPhone}
                        placeholder="e.g. +254 712 345678"
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Contact Email</label>
                      <input
                        type="email"
                        value={regEmail}
                        placeholder="e.g. contact@farm.com"
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                      />
                    </div>
                  </div>

                  {/* Crops & Livestock (Type of Farming / Produce) */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Crops & Produce (Comma separated)</label>
                      <input
                        type="text"
                        value={regCrops}
                        placeholder="e.g. Maize, Beans, Potatoes, Tomatoes"
                        onChange={(e) => setRegCrops(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Livestock & Animals (Comma separated)</label>
                      <input
                        type="text"
                        value={regLivestock}
                        placeholder="e.g. Dairy Cows, Poultry, Goats"
                        onChange={(e) => setRegLivestock(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition"
                      />
                    </div>
                  </div>

                  {/* Farming Activities */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Farming Activities (What you do)</label>
                    <textarea
                      value={regFarmingActivities}
                      onChange={(e) => setRegFarmingActivities(e.target.value)}
                      rows={3}
                      placeholder="Describe your farming activities, methods, machinery, livestock care, etc."
                      className="w-full bg-stone-50 border border-stone-250/65 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/10 transition resize-none"
                    />
                  </div>

                  {/* Farming Photos Gallery Upload */}
                  <div className="space-y-2 text-left pb-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Farming Work Photos</label>
                    <div className="grid grid-cols-4 gap-2">
                      {regFarmingPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 group">
                          <img src={photo} alt={`Farming preview ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setRegFarmingPhotos(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-0.5 rounded-full transition cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {regFarmingPhotos.length < 8 && (
                        <label className="flex flex-col items-center justify-center border border-dashed border-stone-300 hover:border-[#1B4332] hover:bg-emerald-50/20 aspect-square rounded-lg cursor-pointer transition text-stone-400">
                          <Plus className="h-5 w-5" />
                          <span className="text-[9px] font-semibold mt-1">Add Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              files.forEach(file => {
                                if (file.size > 2 * 1024 * 1024) {
                                  toast.error("Each image must be under 2MB.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setRegFarmingPhotos(prev => [...prev, reader.result as string].slice(0, 8));
                                };
                                reader.readAsDataURL(file);
                              });
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsRegisteringProfile(false)}
                    className="px-4 py-2 border border-stone-250 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-50 transition active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1B4332] hover:bg-[#113B26] text-white rounded-xl text-xs font-bold transition active:scale-[0.98] shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🖼️ Media Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mq-modal-overlay"
            onClick={() => setActiveLightboxImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center p-4">
              <button
                onClick={() => setActiveLightboxImage(null)}
                className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition z-50"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={activeLightboxImage}
                alt="Full size media preview"
                className="mq-lightbox-img"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚩 Report Content Moderation Modal */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="mq-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-base font-bold text-stone-850 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  <span>Report Content</span>
                </h3>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none cursor-pointer font-medium"
                  >
                    <option value="spam">Spam / Excessive Promotion</option>
                    <option value="harassment">Harassment or Hate Speech</option>
                    <option value="false_information">False / Misleading Agricultural Information</option>
                    <option value="scam">Scam / Fraudulent Listing</option>
                    <option value="inappropriate_content">Inappropriate / Unsafe Media</option>
                    <option value="violence">Threats or Dangerous Advice</option>
                    <option value="other">Other Violation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Additional Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide specific details to assist our moderation team..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700 outline-none resize-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* 🩺 Mqulima Consult Modal Overlay */}
      <AnimatePresence>
        {isConsultModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 text-left shadow-2xl relative border border-stone-200 my-8 max-h-[90vh] overflow-y-auto scrollbar-none"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100/80 rounded-2xl text-[#1B4332]">
                    <Stethoscope className="h-6 w-6 text-[#1B4332]" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#2D3436]">Mqulima Consult Desk</h3>
                    <p className="text-xs text-[#636E72]">Direct connection to verified agronomists & veterinary specialists</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsConsultModalOpen(false);
                    setConsultSubmittedTicket(null);
                  }}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Consultation Form or Ticket Confirmation */}
              {consultSubmittedTicket ? (
                <div className="bg-emerald-50 border border-emerald-300 p-6 sm:p-8 rounded-2xl space-y-4 text-center">
                  <div className="w-14 h-14 bg-[#1B4332] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="h-7 w-7" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Dispatch Confirmed</span>
                    <h3 className="text-lg font-extrabold text-[#2D3436]">Ticket Reference #{consultSubmittedTicket.id}</h3>
                    <p className="text-xs text-[#636E72] max-w-md mx-auto leading-relaxed">
                      Assigned to <strong className="text-[#1B4332]">{consultSubmittedTicket.assignedConsultant}</strong>. An agronomist will contact <strong className="text-[#2D3436]">{consultSubmittedTicket.phone}</strong> via {consultSubmittedTicket.channel} shortly.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        setIsConsultModalOpen(false);
                        setConsultSubmittedTicket(null);
                      }}
                      className="px-6 py-2.5 bg-[#1B4332] text-white rounded-full text-xs font-bold hover:bg-[#2D6A4F] transition shadow-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateConsultation} className="space-y-4">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#636E72]">Your Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Mary Wanjiku"
                        value={consultName}
                        onChange={(e) => setConsultName(e.target.value)}
                        className="w-full bg-[#F5F5F0] border border-black/[0.06] focus:border-[#1B4332] rounded-xl px-3.5 py-2 text-xs text-[#2D3436] outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#636E72]">Phone / WhatsApp Number *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+254 7XX XXX XXX"
                        value={consultPhone}
                        onChange={(e) => setConsultPhone(e.target.value)}
                        className="w-full bg-[#F5F5F0] border border-black/[0.06] focus:border-[#1B4332] rounded-xl px-3.5 py-2 text-xs text-[#2D3436] outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#636E72]">County / Location</label>
                      <select 
                        value={consultCounty}
                        onChange={(e) => setConsultCounty(e.target.value)}
                        className="w-full bg-[#F5F5F0] border border-black/[0.06] focus:border-[#1B4332] rounded-xl px-3.5 py-2 text-xs text-[#2D3436] outline-none cursor-pointer"
                      >
                        {["Uasin Gishu", "Nakuru", "Kiambu", "Trans Nzoia", "Machakos", "Meru", "Kakamega", "Nyeri", "Narok", "Kilifi", "Kisumu", "Nyandarua"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#636E72]">Specialty Needed</label>
                      <select 
                        value={consultSpecialty}
                        onChange={(e) => setConsultSpecialty(e.target.value)}
                        className="w-full bg-[#F5F5F0] border border-black/[0.06] focus:border-[#1B4332] rounded-xl px-3.5 py-2 text-xs text-[#2D3436] outline-none cursor-pointer"
                      >
                        <option value="Crop & Soil Agronomy">🌱 Crop & Soil Agronomy</option>
                        <option value="Livestock & Veterinary Health">🐄 Livestock & Veterinary Care</option>
                        <option value="Pest & Disease Emergency">🐛 Pest & Disease Emergency</option>
                        <option value="Drip Irrigation & Water">💧 Drip Irrigation & Water</option>
                        <option value="Agribusiness & Produce Marketing">📈 Agribusiness & Produce Marketing</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#636E72]">Preferred Contact Channel</label>
                      <select 
                        value={consultChannel}
                        onChange={(e) => setConsultChannel(e.target.value as any)}
                        className="w-full bg-[#F5F5F0] border border-black/[0.06] focus:border-[#1B4332] rounded-xl px-3.5 py-2 text-xs text-[#2D3436] outline-none cursor-pointer"
                      >
                        <option value="whatsapp">💬 WhatsApp Message</option>
                        <option value="call">📞 Direct Phone Call</option>
                        <option value="visit">🏡 On-Farm Extension Visit</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[#636E72]">Urgency</label>
                      <select 
                        value={consultUrgency}
                        onChange={(e) => setConsultUrgency(e.target.value as any)}
                        className="w-full bg-[#F5F5F0] border border-black/[0.06] focus:border-[#1B4332] rounded-xl px-3.5 py-2 text-xs text-[#2D3436] outline-none cursor-pointer"
                      >
                        <option value="normal">🟢 Normal Inquiry (Within 24 Hours)</option>
                        <option value="urgent">🟡 High Priority (Within 4 Hours)</option>
                        <option value="emergency">🔴 Emergency Field Outbreak (Immediate Call)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#636E72]">Describe Your Agricultural Question or Issue *</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Detail your question or field symptoms (e.g., crop leaves curling, cow milk drop, soil testing request)..."
                      value={consultMessage}
                      onChange={(e) => setConsultMessage(e.target.value)}
                      className="w-full bg-[#F5F5F0] border border-black/[0.06] focus:border-[#1B4332] rounded-xl p-3.5 text-xs text-[#2D3436] outline-none resize-none"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsConsultModalOpen(false)}
                      className="px-4 py-2 border border-stone-200 text-stone-600 rounded-full text-xs font-semibold hover:bg-stone-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingConsult}
                      className="px-6 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-full text-xs font-bold transition shadow-md flex items-center gap-2"
                    >
                      {isSubmittingConsult ? <RotateCw className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4 text-[#F4A261]" />}
                      <span>{isSubmittingConsult ? "Sending..." : "Submit Consultation Request"}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          AUTHENTICATION REQUIRED POPUP MODAL
          ══════════════════════════════════════════ */}
      <AnimatePresence>
        {isAuthRequiredModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 text-left relative overflow-hidden"
            >
              {/* Background gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#52B788]" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsAuthRequiredModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-[#E9F5EC] border border-[#1B4332]/20 flex items-center justify-center text-[#1B4332] shrink-0 shadow-xs">
                  <Lock className="h-6 w-6 text-[#1B4332]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2D3436] tracking-tight">Sign In Required</h2>
                  <p className="text-xs text-stone-500 font-medium">Join Mqulima Hub to {authModalReason}</p>
                </div>
              </div>

              {/* Modal Body */}
              <p className="text-sm text-stone-600 mb-5 leading-relaxed">
                You must be logged into an active Mqulima account to <span className="font-semibold text-stone-900">{authModalReason}</span> on the forum. Log in or create a free account in seconds!
              </p>

              {/* Benefits list */}
              <div className="space-y-2.5 bg-[#F8F9FA] rounded-2xl p-4 border border-stone-200/80 mb-6 text-xs text-stone-700 font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span>Post farm updates, questions & harvest results</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span>Like, bookmark, and reply to posts across Kenya</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span>Trade produce directly on Mqulima Soko</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthRequiredModalOpen(false);
                    navigate({ to: "/auth/sign-in", search: { redirect: "/community" } as any });
                  }}
                  className="w-full py-3.5 px-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log In to Your Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAuthRequiredModalOpen(false);
                    navigate({ to: "/auth/sign-up", search: { redirect: "/community" } as any });
                  }}
                  className="w-full py-3.5 px-4 bg-stone-100 hover:bg-stone-200 text-[#1B4332] rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-stone-200"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Free Account (Sign Up)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuthRequiredModalOpen(false)}
                  className="w-full py-2 text-stone-500 hover:text-stone-700 text-xs font-semibold transition text-center cursor-pointer"
                >
                  Continue Browsing as Guest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Social Connections Modal (Followers / Following) */}
      {socialModalType && viewingFarmer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-150 flex items-center justify-between bg-stone-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100/80 rounded-xl text-emerald-800">
                  {socialModalType === "followers" ? <Users className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    {socialModalType === "followers" ? "Followers" : "Following"}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    {viewingFarmer.name} ({viewingFarmer.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSocialModalType(null)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal List Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {(() => {
                const list = socialModalType === "followers" ? viewingFarmerFollowersList : viewingFarmerFollowingList;
                if (list.length === 0) {
                  return (
                    <div className="py-10 px-6 text-center space-y-3">
                      <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400 border border-stone-200">
                        {socialModalType === "followers" ? <Users className="h-8 w-8 stroke-[1.5]" /> : <UserCheck className="h-8 w-8 stroke-[1.5]" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-800">
                          {socialModalType === "followers" ? "No followers yet" : "Not following any farmers yet"}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                          {socialModalType === "followers"
                            ? "When other verified farmers follow this profile, they will appear here in real-time."
                            : "Explore the Agri Network tab to discover verified agronomists and peer farmers across Kenya."}
                        </p>
                      </div>
                      {socialModalType === "following" && viewingFarmer.username === currentUser?.username && (
                        <button
                          type="button"
                          onClick={() => {
                            setSocialModalType(null);
                            setSubpage("network");
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B4332] hover:bg-[#113B26] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                        >
                          <Users className="h-4 w-4" />
                          Browse Agri Network
                        </button>
                      )}
                    </div>
                  );
                }

                return list.map((farmer) => {
                  const cleanUser = farmer.username.startsWith("@") ? farmer.username : `@${farmer.username}`;
                  const isFollowing = validFollowedUsernames.some(u => u.toLowerCase() === cleanUser.toLowerCase());
                  const isSelf = farmer.username === currentUser?.username;

                  return (
                    <div
                      key={farmer.username}
                      className="p-3 bg-stone-50/70 hover:bg-emerald-50/40 border border-stone-200/70 rounded-2xl transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={farmer.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(farmer.name)}`}
                          alt={farmer.name}
                          className="h-10 w-10 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-stone-900 group-hover:text-emerald-900 truncate">
                              {farmer.name}
                            </h4>
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          </div>
                          <p className="text-[11px] text-stone-500 font-mono truncate">{cleanUser}</p>
                          {farmer.county && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-medium mt-0.5">
                              <MapPin className="h-3 w-3 text-stone-400" />
                              {farmer.county}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSocialModalType(null);
                            setSelectedProfileUsername(farmer.username);
                            setSubpage("profile");
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition cursor-pointer shadow-2xs"
                        >
                          View
                        </button>
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleToggleFollow(farmer.username)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs ${
                              isFollowing
                                ? "bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 border border-stone-200"
                                : "bg-[#1B4332] hover:bg-[#113B26] text-white"
                            }`}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="mq-mobile-nav">
        {[
          { id: "posts", label: "Posts", icon: MessageSquare, iconClass: "text-emerald-700 fill-emerald-600/35" },
          { id: "soko", label: "Soko", icon: ShoppingBag, iconClass: "text-amber-600 fill-amber-500/35" },
          { id: "consult", label: "Consult", icon: Stethoscope, iconClass: "text-purple-600 fill-purple-600/35" },
          { id: "konnekt", label: "Messages", icon: Send, iconClass: "text-blue-600 fill-blue-600/35" },
          { id: "profile", label: "Profile", icon: User, iconClass: "text-[#1B4332] fill-[#1B4332]/35" }
        ].map((item) => {
          const isActive = subpage === item.id && !selectedProfileUsername;
          const IconComp = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setSubpage(item.id as any);
                setSelectedProfileUsername(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={isActive ? 'active' : ''}
            >
              <IconComp className={`h-5 w-5 ${item.iconClass}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </AppLayout>
  );
}
