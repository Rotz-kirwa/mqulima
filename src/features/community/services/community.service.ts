import {
  getForumSnapshot,
  getCurrentFarmerProfile,
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
  submitForumConsultation
} from "@/lib/api/community.server";
import { getMarketPrices } from "@/lib/api/markets.server";
import { getCsrfTokenFromCookie } from "@/lib/csrf-client";
import { CommunityPost, SokoListing, PulsePost, FarmerProfile } from "../types/community.types";

export const communityService = {
  async fetchSnapshot() {
    return await getForumSnapshot();
  },

  async fetchCurrentUser(): Promise<FarmerProfile | null> {
    const profile = await getCurrentFarmerProfile();
    return profile as FarmerProfile | null;
  },

  async fetchMarketPrices() {
    return await getMarketPrices();
  },

  async addPost({
    title,
    body,
    category,
    images = [],
    videoUrl,
    location,
    cropsTagged = [],
    livestockTagged = []
  }: {
    title: string;
    body: string;
    category: string;
    images?: string[];
    videoUrl?: string;
    location?: string;
    cropsTagged?: string[];
    livestockTagged?: string[];
  }) {
    const csrfToken = getCsrfTokenFromCookie();
    return await createCommunityPost({
      data: {
        title,
        body,
        category,
        images,
        tags: cropsTagged,
        csrfToken
      }
    });
  },

  async addComment(postId: string, text: string) {
    const csrfToken = getCsrfTokenFromCookie();
    return await createComment({
      data: {
        postId,
        body: text,
        csrfToken
      }
    });
  },

  async toggleLike(postId: string) {
    const csrfToken = getCsrfTokenFromCookie();
    return await toggleLikePost({
      data: {
        postId,
        csrfToken
      }
    });
  },

  async addSokoListing({
    commodity,
    type,
    price,
    quantity,
    location,
    images = [],
    description,
    phone
  }: {
    commodity: string;
    type: "crop" | "livestock" | "fruit";
    price: number;
    quantity: string;
    location: string;
    images?: string[];
    description: string;
    phone?: string;
  }) {
    const csrfToken = getCsrfTokenFromCookie();
    return await createSokoListing({
      data: {
        commodityName: commodity,
        type,
        price,
        quantity,
        location,
        images,
        description,
        phone,
        csrfToken
      }
    });
  },

  async requestConsultation(ticketData: any) {
    const csrfToken = getCsrfTokenFromCookie();
    return await submitForumConsultation({
      data: {
        ...ticketData,
        csrfToken
      }
    });
  }
};
