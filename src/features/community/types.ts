export interface FarmerProfile {
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
}

export interface PostComment {
  id?: string;
  authorName: string;
  text: string;
  time: string;
  author?: any;
  body?: string;
  createdAt?: string;
}

export interface CommunityPost {
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
  comments: PostComment[];
  cropsTagged: string[];
  livestockTagged: string[];
  location: string;
  createdAt: string;
}

export interface SokoListing {
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
}

export interface PulsePost {
  id: string;
  title: string;
  content: string;
  category: "Market Trend" | "Weather Alert" | "Policy Update" | "Agronomy Alert";
  source: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  read: boolean;
  image?: string;
}

export interface ChatSession {
  id: string;
  name: string;
  isGroup: boolean;
  farmer?: FarmerProfile;
  log: ChatMessage[];
  unreadCount?: number;
}
