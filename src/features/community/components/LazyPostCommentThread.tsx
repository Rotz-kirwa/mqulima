import React from "react";
import { X } from "lucide-react";

export interface LazyPostCommentThreadProps {
  post: any;
  replyToCommentId: string | null;
  commentInput: string;
  onSetCommentInput: (val: string) => void;
  onSetReplyToCommentId: (id: string | null) => void;
  onOpenReport: (type: "comment", id: string) => void;
  onAddComment: (postId: string) => void;
}

export default function LazyPostCommentThread({
  post,
  replyToCommentId,
  commentInput,
  onSetCommentInput,
  onSetReplyToCommentId,
  onOpenReport,
  onAddComment,
}: LazyPostCommentThreadProps) {
  return (
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
                      onSetReplyToCommentId(comm.id);
                      onSetCommentInput(`@${comm.authorName} `);
                    }}
                    className="text-[#1B4332] font-bold hover:underline"
                  >
                    Reply
                  </button>
                  {comm.id && (
                    <button
                      onClick={() => onOpenReport("comment", comm.id)}
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
              onSetReplyToCommentId(null);
              onSetCommentInput("");
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
          onChange={(e) => onSetCommentInput(e.target.value)}
          className="flex-1 bg-white border border-black/[0.06] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[#1B4332] transition-colors"
        />
        <button 
          onClick={() => onAddComment(post.id)}
          className="px-4 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-[12px] font-semibold transition-colors shadow-xs"
        >
          Publish
        </button>
      </div>
    </div>
  );
}
