import React, { useState } from "react";
import { PlusCircle, Search, Filter } from "lucide-react";
import { CommunityPost } from "../types/community.types";
import { PostCard } from "./PostCard";
import { communityService } from "../services/community.service";
import { toast } from "sonner";

interface Props {
  posts: CommunityPost[];
  currentUser: any;
  onRefresh: () => void;
  onToggleLike: (postId: string) => void;
}

export const ShowFeed: React.FC<Props> = ({
  posts,
  currentUser,
  onRefresh,
  onToggleLike,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Composer fields
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"Farm Progress" | "Harvest Update" | "Farming Tips" | "Question" | "Success Story">("Farm Progress");
  const [crops, setCrops] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please provide both a title and details for your post.");
      return;
    }

    setIsSubmitting(true);
    try {
      await communityService.addPost({
        title,
        body,
        category,
        cropsTagged: crops ? crops.split(",").map(s => s.trim()) : [],
      });
      toast.success("Post shared with Mqulima Community!");
      setTitle("");
      setBody("");
      setCrops("");
      setIsComposerOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to post update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (postId: string, text: string) => {
    try {
      await communityService.addComment(postId, text);
      toast.success("Comment added!");
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment");
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.body.toLowerCase().includes(search.toLowerCase()) ||
      post.author.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Create Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0C1510] p-4 rounded-2xl border border-[#1B3627]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farm updates, tips, or questions..."
            className="w-full pl-9 pr-4 py-2 bg-black/40 border border-[#1B3627] rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-[#4CAF50] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/40 border border-[#1B3627] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#4CAF50]"
          >
            <option value="all">All Categories</option>
            <option value="Farm Progress">Farm Progress</option>
            <option value="Harvest Update">Harvest Update</option>
            <option value="Farming Tips">Farming Tips</option>
            <option value="Question">Question</option>
            <option value="Success Story">Success Story</option>
          </select>

          <button
            onClick={() => setIsComposerOpen(!isComposerOpen)}
            className="flex items-center gap-1.5 bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#224f3b] transition-colors shrink-0 shadow-md"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* Composer Card */}
      {isComposerOpen && (
        <form onSubmit={handleCreatePost} className="bg-[#0C1510] border border-[#2D6A4F]/60 p-4 sm:p-5 rounded-2xl space-y-3">
          <h3 className="text-sm font-bold text-white">Share a Farm Update</h3>
          <input
            type="text"
            placeholder="Post Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
          />
          <textarea
            rows={3}
            placeholder="What's happening on your farm today?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50] resize-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
            >
              <option value="Farm Progress">Farm Progress</option>
              <option value="Harvest Update">Harvest Update</option>
              <option value="Farming Tips">Farming Tips</option>
              <option value="Question">Question</option>
              <option value="Success Story">Success Story</option>
            </select>

            <input
              type="text"
              placeholder="Crops tagged (e.g. Maize, Coffee)"
              value={crops}
              onChange={(e) => setCrops(e.target.value)}
              className="bg-black/40 border border-[#1B3627] rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#4CAF50]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsComposerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2D6A4F] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#224f3b] disabled:opacity-50"
            >
              {isSubmitting ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </form>
      )}

      {/* Feed List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-[#0C1510] border border-[#1B3627] rounded-2xl p-8 text-center text-white/50 text-xs">
            No community posts found matching your criteria.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onToggleLike={onToggleLike}
              onAddComment={handleAddComment}
            />
          ))
        )}
      </div>
    </div>
  );
};
