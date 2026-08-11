import React, { useState } from "react";
import { Send, User } from "lucide-react";
import { Comment } from "../types/community.types";
import { resolveAvatar } from "@/shared/utils/avatar.utils";

interface Props {
  comments: Comment[];
  onAddComment: (text: string) => void;
  currentUser: any;
}

export const CommentSection: React.FC<Props> = ({
  comments,
  onAddComment,
  currentUser,
}) => {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
  };

  return (
    <div className="mt-4 pt-4 border-t border-[#1B3627]/60 space-y-3">
      {/* Comments List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {comments.length === 0 ? (
          <p className="text-[11px] text-white/40 italic">No comments yet. Be the first to join the conversation!</p>
        ) : (
          comments.map((comment, idx) => (
            <div key={comment.id || idx} className="flex gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <img
                src={resolveAvatar(comment.author?.avatarUrl, comment.authorName || comment.author?.name || "Farmer")}
                alt="Avatar"
                className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/90 truncate">
                    {comment.authorName || comment.author?.name || "Farmer"}
                  </span>
                  <span className="text-[10px] text-white/40">{comment.time || comment.createdAt || "Just now"}</span>
                </div>
                <p className="text-xs text-white/80 mt-0.5 whitespace-pre-wrap">{comment.text || comment.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={currentUser ? "Write a comment..." : "Sign in to leave a comment..."}
          disabled={!currentUser}
          className="flex-1 bg-black/40 border border-[#1B3627] rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-[#4CAF50] transition-colors"
        />
        <button
          type="submit"
          disabled={!currentUser || !commentText.trim()}
          className="p-2 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#224f3b] disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
