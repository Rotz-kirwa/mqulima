import React, { useState } from "react";
import { ThumbsUp, MessageCircle, Share2, MapPin, Tag, ShieldCheck, Heart } from "lucide-react";
import { CommunityPost } from "../types/community.types";
import { resolveAvatar } from "@/shared/utils/avatar.utils";
import { CommentSection } from "./CommentSection";
import { toast } from "sonner";

interface Props {
  post: CommunityPost;
  currentUser: any;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
}

export const PostCard: React.FC<Props> = React.memo(({
  post,
  currentUser,
  onToggleLike,
  onAddComment,
}) => {
  const [showComments, setShowComments] = useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Post link copied to clipboard!");
    }
  };

  return (
    <article className="rounded-2xl border border-[#1B3627] bg-[#0C1510] p-4 sm:p-5 shadow-lg transition hover:border-[#2D6A4F]/60">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={resolveAvatar(post.author.avatarUrl, post.author.name)}
            alt={post.author.name}
            className="h-10 w-10 rounded-full object-cover border border-[#2D6A4F]/40"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white hover:text-[#4CAF50] transition-colors cursor-pointer">
                {post.author.name}
              </h3>
              <ShieldCheck className="h-4 w-4 text-[#4CAF50]" />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <span>{post.author.username}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-400" />
                {post.location || post.author.county || "Kenya"}
              </span>
              <span>•</span>
              <span>{post.createdAt}</span>
            </div>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
          {post.category}
        </span>
      </div>

      {/* Content Body */}
      <div className="mt-3.5 space-y-2">
        <h2 className="text-sm font-bold text-white/95 leading-snug">{post.title}</h2>
        <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{post.body}</p>
      </div>

      {/* Images Carousel / Grid */}
      {post.images && post.images.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl overflow-hidden">
          {post.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="Post Media"
              className="h-48 w-full object-cover rounded-xl border border-white/10 hover:opacity-95 transition-opacity cursor-pointer"
            />
          ))}
        </div>
      )}

      {/* Tag badges */}
      {((post.cropsTagged && post.cropsTagged.length > 0) || (post.livestockTagged && post.livestockTagged.length > 0)) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.cropsTagged?.map((crop, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-emerald-300 border border-white/10">
              <Tag className="h-2.5 w-2.5" />
              {crop}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-[#1B3627]/60 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onToggleLike(post.id)}
            className={`flex items-center gap-1.5 hover:text-red-400 transition-colors ${post.hasLiked ? "text-red-500 font-bold" : ""}`}
          >
            <Heart className={`h-4 w-4 ${post.hasLiked ? "fill-current" : ""}`} />
            <span>{post.likes}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-[#4CAF50] transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments?.length || 0} Comments</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Embedded Comments Section */}
      {showComments && (
        <CommentSection
          comments={post.comments || []}
          onAddComment={(text) => onAddComment(post.id, text)}
          currentUser={currentUser}
        />
      )}
    </article>
  );
});
PostCard.displayName = "PostCard";
