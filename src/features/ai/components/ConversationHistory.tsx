import React, { useState } from "react";
import { Sparkles, Plus, Pin, Star, Trash2, Edit2, Check, X } from "lucide-react";
import { AIIcon } from "@/components/mqulima/AIIcon";
import { Conversation } from "../types/ai.types";
import { aiService } from "../services/ai.service";
import { toast } from "sonner";

interface Props {
  conversations: Conversation[];
  activeConvId: string | null;
  loadingConvs: boolean;
  isGenerating: boolean;
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRefreshList: () => void;
}

export const ConversationHistory: React.FC<Props> = ({
  conversations,
  activeConvId,
  loadingConvs,
  isGenerating,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
  onSelectConversation,
  onNewChat,
  onRefreshList
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const saveRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await aiService.renameConv(id, editTitle.trim());
      setEditingConvId(null);
      onRefreshList();
      toast.success("Chat renamed");
    } catch (e) {
      console.error(e);
      toast.error("Failed to rename chat");
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      try {
        await aiService.deleteConv(id);
        onRefreshList();
        toast.success("Conversation deleted");
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete conversation");
      }
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await aiService.togglePin(id);
      onRefreshList();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFav = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await aiService.toggleFav(id);
      onRefreshList();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => (
    <>
      <div className="p-4 border-b border-[#1B3627]">
        <button
          onClick={() => {
            onNewChat();
            onCloseMobileSidebar();
          }}
          disabled={isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:scale-102 disabled:opacity-50 cursor-pointer shadow-md"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>
      </div>

      <div className="px-4 py-2 border-b border-[#1B3627]/50">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-[#1B3627] bg-[#0A110D] px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#4CAF50] transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
        {loadingConvs ? (
          <div className="p-4 text-center text-xs text-white/40">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-white/30">No conversations found.</div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConvId === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onCloseMobileSidebar();
                }}
                className={`group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-left transition duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#2D6A4F]/20 border border-[#2D6A4F]/40 text-[#4CAF50] font-bold"
                    : "hover:bg-[#112519] border border-transparent text-white/70"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-12">
                  <Sparkles className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[#4CAF50]" : "text-white/40"}`} />
                  {editingConvId === conv.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(conv.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-black/40 text-xs px-1 border border-white/20 outline-none text-white rounded"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate text-xs">{conv.title}</span>
                  )}
                </div>

                <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingConvId === conv.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRename(conv.id);
                      }}
                      className="p-1 hover:text-[#4CAF50] transition-colors"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(conv.id);
                          setEditTitle(conv.title);
                        }}
                        className="p-1 hover:text-white transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleTogglePin(e, conv.id)}
                        className={`p-1 hover:text-white transition-colors ${conv.is_pinned ? "text-amber-400" : ""}`}
                      >
                        <Pin className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleToggleFav(e, conv.id)}
                        className={`p-1 hover:text-white transition-colors ${conv.is_favorite ? "text-yellow-400" : ""}`}
                      >
                        <Star className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(e, conv.id)}
                        className="p-1 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-[#0C1510] border-r border-[#1B3627] shrink-0">
        <div className="p-4 border-b border-[#1B3627] flex items-center gap-2">
          <AIIcon className="h-5 w-5" animated={true} />
          <span className="font-bold text-sm tracking-wide">Mqulima AI Chats</span>
        </div>
        {renderContent()}
      </aside>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
        isMobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}>
        <div onClick={onCloseMobileSidebar} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div className={`absolute inset-y-0 left-0 w-72 bg-[#0C1510] border-r border-[#1B3627] flex flex-col transition-transform duration-300 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-[#1B3627]">
            <div className="flex items-center gap-2">
              <AIIcon className="h-5 w-5" animated={true} />
              <span className="font-bold text-sm tracking-wide">Chat History</span>
            </div>
            <button onClick={onCloseMobileSidebar} className="p-1 text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
};
