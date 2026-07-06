import React, { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  role: "user" | "model";
  content: string;
};

export function FloatingAIChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Habari! 👋 Welcome to Mqulima AI!",
    },
    {
      role: "model",
      content: "I can help you diagnose crop symptoms, query market prices, check weather windows, or contact support. What are you looking for?",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, isOpen]);

  const suggestions = [
    { label: "🌿 Diagnose Crop", text: "How do I diagnose Sukuma Wiki leaves turning yellow?" },
    { label: "🌤️ Weather Forecast", text: "What is the optimal sowing window for maize based on local weather?" },
    { label: "📞 Contact Support", text: "How can I contact Mqulima team or get physical assistance?" },
    { label: "🛒 Shop Products", text: "What fertilizer brands are recommended for maize top dressing?" },
  ];

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isGenerating) return;

    if (!user) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: messageText },
        { role: "model", content: "Please sign in to access Mqulima AI. You can sign in via the button above." },
      ]);
      return;
    }

    const userMsg: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Map history for API
      const apiHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Placeholder for model output
      setMessages((prev) => [...prev, { role: "model", content: "" }]);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: messageText,
          history: apiHistory,
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to get response from AI";
        try {
          const errBody = await response.json();
          if (errBody && errBody.error) {
            errMsg = errBody.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Null reader");

      const decoder = new TextDecoder("utf-8");
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        accumulated += textChunk;

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "model") {
            last.content = accumulated;
          }
          return updated;
        });
      }
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "model" && !last.content) {
          last.content = e.message || "Pole, I ran into an error. Please try again in a moment.";
        }
        return updated;
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(prompt);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Mqulima AI Assistant"
        className="fixed bottom-36 md:bottom-24 right-6 z-40 flex items-center gap-2.5 rounded-full border border-[#2D6A4F]/30 bg-white px-5 py-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Sparkles className="h-5 w-5 text-[#F5A623] animate-pulse" />
        <span className="text-sm font-bold text-[#2D6A4F] whitespace-nowrap">Mqulima AI</span>
      </button>

      {/* Floating Chat Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-52 md:bottom-38 right-6 z-50 w-[360px] sm:w-[400px] h-[480px] sm:h-[520px] bg-white border border-[#0A1E0C]/10 shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex flex-col rounded-2xl overflow-hidden"
          >
            {/* Header: Magda-style Assistant details */}
            <div className="bg-[#FAF9F5] border-b border-[#0A1E0C]/10 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Brand Initial Avatar */}
                <div className="h-10 w-10 bg-[#C83F1B] rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm">
                  M
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0A1E0C] leading-none">Mqulima Assistant</h3>
                  <span className="text-[11px] font-bold text-[#2D6A4F] mt-1 block">Najibu Kiswahili & English</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
            >
              {/* Message Bubble List */}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#C83F1B] text-white rounded-2xl rounded-tr-none shadow-sm"
                        : "bg-[#F3F4F6] text-[#0A1E0C] rounded-2xl rounded-tl-none font-medium"
                    }`}
                  >
                    {msg.content || (
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 bg-[#0A1E0C] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 bg-[#0A1E0C] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 bg-[#0A1E0C] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Suggestion Pills */}
              {!isGenerating && messages.length <= 3 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                    Quick suggestions
                  </span>
                  <div className="flex flex-col gap-2">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(sug.text)}
                        className="w-full text-left rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:border-[#C83F1B]/40 hover:bg-[#C83F1B]/5 transition flex items-center justify-between group cursor-pointer"
                      >
                        <span>{sug.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#C83F1B]">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Input Area */}
            <div className="p-4 border-t border-[#0A1E0C]/10 bg-white">
              {!user ? (
                <div className="text-center py-1">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full inline-block text-center bg-[#C83F1B] hover:bg-[#b03415] text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-full transition shadow-sm"
                  >
                    Sign In to use Mqulima AI
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask in English or Swahili..."
                    disabled={isGenerating}
                    className="flex-1 rounded-full border border-[#C83F1B]/40 focus:border-[#C83F1B] bg-[#F9F9F9] px-5 py-3 text-xs text-[#0A1E0C] placeholder-gray-400 outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!prompt.trim() || isGenerating}
                    className="h-10 w-10 shrink-0 rounded-full bg-[#C83F1B] hover:bg-[#b03415] disabled:opacity-50 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                  >
                    <Send className="h-4.5 w-4.5 transform rotate-0" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
