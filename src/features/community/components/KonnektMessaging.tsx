import React, { useState } from "react";
import { Send, User, MessageCircle } from "lucide-react";
import { ChatSession } from "../types/community.types";
import { resolveAvatar } from "@/shared/utils/avatar.utils";
import { toast } from "sonner";

interface Props {
  currentUser: any;
}

export const KonnektMessaging: React.FC<Props> = ({ currentUser }) => {
  const [activeSessionId, setActiveSessionId] = useState("s1");
  const [inputMessage, setInputMessage] = useState("");

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "s1",
      name: "Abel Kibet (Agronomist)",
      isGroup: false,
      log: [
        { id: "m1", sender: "Abel Kibet", text: "Jambo! Have you sprayed your tomato crop for late blight after yesterday's rain?", timestamp: "10:14 AM", read: true },
        { id: "m2", sender: "Me", text: "Not yet, I was planning to use Copper Oxychloride this afternoon.", timestamp: "10:18 AM", read: true }
      ]
    },
    {
      id: "s2",
      name: "Uasin Gishu Grain Farmers Group",
      isGroup: true,
      log: [
        { id: "m3", sender: "Grace Wambui", text: "Maize prices in Eldoret National Cereals Board depot are holding at KES 3,600.", timestamp: "09:30 AM", read: true }
      ]
    }
  ]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: "Me",
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          log: [...s.log, newMsg]
        };
      }
      return s;
    }));

    setInputMessage("");
    toast.success("Message sent via Konnekt!");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px] bg-[#0C1510] border border-[#1B3627] rounded-2xl overflow-hidden">
      {/* Sessions List */}
      <div className="border-r border-[#1B3627] p-3 space-y-2 overflow-y-auto">
        <h3 className="text-xs font-bold text-white/80 px-2 py-1 uppercase tracking-wider">Mqulima Konnekt Chats</h3>
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSessionId(s.id)}
            className={`flex items-center gap-3 w-full p-3 rounded-xl text-left transition-colors ${
              s.id === activeSessionId
                ? "bg-[#2D6A4F]/20 border border-[#2D6A4F]/40 text-white font-semibold"
                : "hover:bg-white/5 text-white/70"
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {s.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate text-white">{s.name}</div>
              <div className="text-[11px] text-white/50 truncate">
                {s.log[s.log.length - 1]?.text || "No messages yet"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Conversation Window */}
      <div className="md:col-span-2 flex flex-col h-full bg-[#0A110D]">
        {/* Header */}
        <div className="p-3 border-b border-[#1B3627] bg-[#0C1510] flex items-center gap-3">
          <MessageCircle className="h-4 w-4 text-[#4CAF50]" />
          <span className="text-xs font-bold text-white">{activeSession?.name}</span>
        </div>

        {/* Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {activeSession?.log.map((msg) => {
            const isMe = msg.sender === "Me";
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-white/40 mb-1">{msg.sender} • {msg.timestamp}</span>
                <div
                  className={`max-w-xs sm:max-w-md rounded-2xl px-4 py-2.5 text-xs ${
                    isMe
                      ? "bg-[#2D6A4F] text-white"
                      : "bg-[#1B3627] text-white/90 border border-white/10"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-[#1B3627] bg-[#0C1510] flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Write direct message..."
            className="flex-1 bg-black/40 border border-[#1B3627] rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-[#4CAF50]"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#224f3b] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
