import React from "react";
import { Trash2, User, Sparkles, Paperclip } from "lucide-react";
import { Message } from "../types/ai.types";
import { AIResponseRenderer } from "./AIResponseRenderer";

interface Props {
  message: Message;
  userName: string;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onDeleteMessage?: () => void;
}

export const ChatMessage: React.FC<Props> = ({
  message,
  userName,
  isSpeaking,
  onToggleSpeech,
  onDeleteMessage,
}) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex w-full gap-3 p-4 transition-colors ${isUser ? "bg-transparent" : "bg-[#0F1B14] border-y border-[#1B3627]/40"}`}>
      <div className="shrink-0">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D6A4F] text-xs font-bold text-white shadow">
            {userName ? userName[0].toUpperCase() : <User className="h-4 w-4" />}
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600/20 text-[#4CAF50] border border-[#4CAF50]/30 shadow">
            <Sparkles className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-white/80">
            {isUser ? userName : "Mqulima AI Expert"}
          </span>
          {onDeleteMessage && message.id && (
            <button
              onClick={onDeleteMessage}
              className="text-white/30 hover:text-red-400 p-1 transition-colors"
              title="Delete message"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Attachments preview */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-white/70">
                <Paperclip className="h-3 w-3 text-[#4CAF50]" />
                <span className="truncate max-w-[120px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {isUser ? (
          <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <AIResponseRenderer
            content={message.content}
            isSpeaking={isSpeaking}
            onToggleSpeech={onToggleSpeech}
          />
        )}
      </div>
    </div>
  );
};
