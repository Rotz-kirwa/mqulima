// ============================================================================
// ai.tsx — Mqulima AI Dedicated Full-Page Workspace
//
// Route: /ai
//
// Features: Full-page layout, conversation history sidebar, pin/favorite,
// rename, delete, inline suggestions grid, markdown + table parser,
// file upload base64 parser, speech-to-text, text-to-speech, and exports.
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles, Plus, Pin, Star, Trash2, Edit2, Download, FileText, Share2,
  Mic, MicOff, Volume2, VolumeX, Paperclip, Send, Square, Check, X,
  Wrench, Calculator, TrendingUp, Compass, ArrowLeft, ArrowRight, CornerDownLeft,
  Menu, RotateCw
} from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

// Import server functions
import {
  getConversations,
  getConversationMessages,
  createConversation,
  renameConversation,
  deleteConversation,
  togglePinConversation,
  toggleFavoriteConversation,
  deleteMessage
} from "@/lib/api/ai.server";

import { fetchWeather } from "@/lib/api/weather";

// County coordinates dictionary
const countyCoords: Record<string, { lat: number; lon: number }> = {
  "Mombasa": { lat: -4.0547, lon: 39.6636 },
  "Kwale": { lat: -4.1812, lon: 39.4606 },
  "Kilifi": { lat: -3.5107, lon: 39.9093 },
  "Tana River": { lat: -1.4826, lon: 40.0129 },
  "Lamu": { lat: -2.2717, lon: 40.9020 },
  "Taita Taveta": { lat: -3.3152, lon: 38.4851 },
  "Garissa": { lat: -0.4532, lon: 39.6461 },
  "Wajir": { lat: 1.7471, lon: 40.0602 },
  "Mandera": { lat: 3.9368, lon: 41.8569 },
  "Marsabit": { lat: 2.3369, lon: 37.9900 },
  "Isiolo": { lat: 0.3524, lon: 37.5819 },
  "Meru": { lat: 0.0463, lon: 37.6536 },
  "Tharaka-Nithi": { lat: -0.2990, lon: 37.8970 },
  "Embu": { lat: -0.5311, lon: 37.4519 },
  "Kitui": { lat: -1.3688, lon: 38.0106 },
  "Machakos": { lat: -1.5177, lon: 37.2634 },
  "Makueni": { lat: -1.7841, lon: 37.6253 },
  "Nyandarua": { lat: -0.2798, lon: 36.3773 },
  "Nyeri": { lat: -0.4162, lon: 36.9510 },
  "Kirinyaga": { lat: -0.4996, lon: 37.3111 },
  "Murang'a": { lat: -0.7210, lon: 37.1500 },
  "Kiambu": { lat: -1.1714, lon: 36.8356 },
  "Turkana": { lat: 3.1147, lon: 35.5973 },
  "West Pokot": { lat: 1.5034, lon: 35.3582 },
  "Samburu": { lat: 1.2589, lon: 36.8124 },
  "Trans Nzoia": { lat: 1.0219, lon: 35.0023 },
  "Uasin Gishu": { lat: 0.5204, lon: 35.2698 },
  "Elgeyo-Marakwet": { lat: 0.8037, lon: 35.5414 },
  "Nandi": { lat: 0.1834, lon: 35.1269 },
  "Baringo": { lat: 0.4851, lon: 35.9322 },
  "Laikipia": { lat: 0.3606, lon: 36.7842 },
  "Nakuru": { lat: -0.3031, lon: 36.0800 },
  "Narok": { lat: -1.0784, lon: 35.8601 },
  "Kajiado": { lat: -2.0981, lon: 36.7818 },
  "Kericho": { lat: -0.3677, lon: 35.2825 },
  "Bomet": { lat: -0.7813, lon: 35.3416 },
  "Kakamega": { lat: 0.2827, lon: 34.7519 },
  "Vihiga": { lat: 0.0806, lon: 34.7228 },
  "Bungoma": { lat: 0.5695, lon: 34.5584 },
  "Busia": { lat: 0.4608, lon: 34.1115 },
  "Siaya": { lat: -0.0609, lon: 34.2882 },
  "Kisumu": { lat: -0.1022, lon: 34.7617 },
  "Homa Bay": { lat: -0.5273, lon: 34.4571 },
  "Migori": { lat: -1.0634, lon: 34.4731 },
  "Kisii": { lat: -0.6817, lon: 34.7717 },
  "Nyamira": { lat: -0.5636, lon: 34.9358 },
  "Nairobi": { lat: -1.2921, lon: 36.8219 }
};

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "🌱 Mqulima AI — Agricultural Intelligence Workspace" },
      {
        name: "description",
        content:
          "Professional Gemini-powered Farming Assistant with live weather, county, and marketplace records integration.",
      },
    ],
  }),
  component: MqulimaAIWorkspace,
});

type Attachment = {
  name: string;
  mimeType: string;
  size: number;
  base64: string;
};

type Message = {
  id?: string;
  role: "user" | "model";
  content: string;
  attachments?: Omit<Attachment, "base64">[];
  created_at?: string;
};

type Conversation = {
  id: string;
  title: string;
  is_pinned: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

function MqulimaAIWorkspace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if unauthorized
  if (!user) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4 text-center">
          <Sparkles className="h-12 w-12 text-[#2D6A4F] animate-pulse mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Welcome to Mqulima AI</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Sign in to access your intelligent farming assistant, county diagnostics, and market records.
          </p>
          <Link
            to="/login"
            className="mt-6 rounded-full bg-[#2D6A4F] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#224f3b] shadow-md"
          >
            Sign In to Start
          </Link>
        </div>
      </AppLayout>
    );
  }

  // State managers
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null); // message text content or null
  const [searchQuery, setSearchQuery] = useState("");
  const [weatherState, setWeatherState] = useState<{ temp?: number; desc?: string }>({});
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  
  // Modals / Renames
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Refs
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // 1. Initial Load: Conversations & Weather
  useEffect(() => {
    loadConversations();
    loadLiveWeather();
  }, [user.county]);

  // 2. Scroll to bottom when messages load/update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // 3. Load conversations
  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const data = (await getConversations()) as unknown as Conversation[];
      setConversations(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load conversation history");
    } finally {
      setLoadingConvs(false);
    }
  };

  // 4. Load weather based on county coords
  const loadLiveWeather = async () => {
    if (!user.county) {
      setLoadingWeather(false);
      return;
    }
    const coords = countyCoords[user.county];
    if (!coords) {
      setLoadingWeather(false);
      return;
    }
    try {
      setLoadingWeather(true);
      const res = await fetchWeather({ data: coords });
      setWeatherState({
        temp: res.current.temperature_2m,
        desc: res.conditionLabel,
      });
    } catch (e) {
      console.warn("Could not retrieve live county weather for context", e);
      setWeatherState({ desc: "offline" });
    } finally {
      setLoadingWeather(false);
    }
  };

  // 5. Select a conversation
  const selectConversation = async (id: string) => {
    if (isGenerating) {
      toast.error("Please stop generation before switching chats.");
      return;
    }
    setActiveConvId(id);
    setLoadingMessages(true);
    try {
      const msgs = (await getConversationMessages({ data: { conversationId: id } })) as unknown as Message[];
      setMessages(msgs);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };
  // 6. Start new chat
  const handleNewChat = async () => {
    if (isGenerating) return;
    try {
      const newConv = (await createConversation({ data: { title: "New Conversation" } })) as Conversation;
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setPrompt("");
      setAttachments([]);
      setLastFailedPrompt(null);
    } catch (e) {
      console.error(e);
      toast.error("Could not start a new chat");
    }
  };

  // 7. Rename Conversation
  const saveRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const updated = (await renameConversation({ data: { conversationId: id, title: editTitle.trim() } })) as Conversation;
      setConversations(prev => prev.map(c => (c.id === id ? updated : c)));
      setEditingConvId(null);
      toast.success("Chat renamed successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to rename conversation");
    }
  };

  // 8. Delete Conversation
  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation({ data: { conversationId: id } });
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConvId === id) {
          setActiveConvId(null);
          setMessages([]);
        }
        toast.success("Conversation deleted");
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete conversation");
      }
    }
  };

  // Delete individual message
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeConvId) return;
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage({ data: { messageId: msgId, conversationId: activeConvId } });
        setMessages(prev => prev.filter(m => m.id !== msgId));
        toast.success("Message deleted");
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete message");
      }
    }
  };

  // Auto-growing textarea logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [prompt]);

  // 9. Toggle Pin
  const handleTogglePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await togglePinConversation({ data: { conversationId: id } });
      loadConversations();
      toast.success("Pin preference updated");
    } catch (e) {
      console.error(e);
    }
  };

  // 10. Toggle Favorite
  const handleToggleFav = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await toggleFavoriteConversation({ data: { conversationId: id } });
      loadConversations();
      toast.success("Favorite preference updated");
    } catch (e) {
      console.error(e);
    }
  };

  // File Upload base64 Conversion
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type,
            size: file.size,
            base64: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Speech-to-Text Voice Input Toggle
  const toggleSpeechInput = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(prev => (prev ? prev + " " + transcript : transcript));
      setIsListening(false);
      toast.success("Voice transcribed successfully!");
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
  };

  // Text-to-Speech Voice Output
  const toggleSpeechOutput = (text: string) => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech output is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    const cleanText = text.replace(/[*#`_\-]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);

    setIsSpeaking(text);
    window.speechSynthesis.speak(utterance);
  };

  // Send Message & Stream Response
  const handleSendMessage = async (textToSend?: string) => {
    const finalPrompt = (textToSend || prompt).trim();
    if (!finalPrompt && attachments.length === 0) return;

    let currentConvId = activeConvId;

    // 1. If no active conversation, create one automatically
    if (!currentConvId) {
      try {
        const newConv = (await createConversation({
          data: {
            title: finalPrompt.substring(0, 30) + (finalPrompt.length > 30 ? "..." : ""),
          }
        })) as Conversation;
        setConversations(prev => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        currentConvId = newConv.id;
      } catch (e) {
        console.error(e);
        toast.error("Could not initialize chat session.");
        return;
      }
    }

    // Prepare message structures
    const userMsg: Message = {
      role: "user",
      content: finalPrompt,
      attachments: attachments.map(att => ({
        name: att.name,
        mimeType: att.mimeType,
        size: att.size,
      })),
    };

    // Update screen state immediately
    setMessages(prev => [...prev, userMsg]);
    setPrompt("");
    setLastFailedPrompt(null);
    const messageAttachments = [...attachments];
    setAttachments([]);
    setIsGenerating(true);

    // Setup Abort Controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Map history for API
      const apiHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments,
      }));

      // Initiate streaming fetch request
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          conversationId: currentConvId,
          message: finalPrompt,
          history: apiHistory,
          attachments: messageAttachments,
          weather: weatherState.temp
            ? { temperature: weatherState.temp, description: weatherState.desc }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to start streaming context.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Null response stream reader");

      // Add a placeholder assistant message
      setMessages(prev => [...prev, { role: "model", content: "" }]);

      const decoder = new TextDecoder("utf-8");
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        accumulatedResponse += textChunk;

        // Update the last message in real-time
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "model") {
            last.content = accumulatedResponse;
          }
          return updated;
        });
      }

      setLastFailedPrompt(null);

      // Reload conversations list so updated timestamps / titles align
      loadConversations();

      // Reload messages to get proper database IDs for deletion
      if (currentConvId) {
        const msgs = (await getConversationMessages({ data: { conversationId: currentConvId } })) as unknown as Message[];
        setMessages(msgs);
      }

    } catch (e: any) {
      if (e.name === "AbortError") {
        toast.info("Generation halted.");
      } else {
        console.error(e);
        setLastFailedPrompt(finalPrompt);
        toast.error(e.message || "Something went wrong during generation.");
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop current stream generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Trigger quick suggestions action
  const handleSuggestionClick = (promptText: string) => {
    setPrompt(promptText);
  };

  // Export Chat: Markdown
  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    const activeConv = conversations.find(c => c.id === activeConvId);
    const title = activeConv ? activeConv.title : "Mqulima AI Chat";

    let mdText = `# ${title}\nGenerated on ${new Date().toLocaleDateString()} via Mqulima AI\n\n---\n\n`;
    for (const msg of messages) {
      const label = msg.role === "user" ? "Farmer" : "Mqulima AI";
      mdText += `### **${label}**\n${msg.content}\n\n`;
    }

    const blob = new Blob([mdText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Markdown exported successfully");
  };

  // Export Chat: JSON
  const handleExportJSON = () => {
    if (messages.length === 0) return;
    const activeConv = conversations.find(c => c.id === activeConvId);
    const title = activeConv ? activeConv.title : "Mqulima AI Chat";

    const payload = {
      title,
      exportedAt: new Date().toISOString(),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("JSON exported successfully");
  };

  // Export Chat: PDF
  const handleExportPDF = () => {
    if (messages.length === 0) return;
    const activeConv = conversations.find(c => c.id === activeConvId);
    const title = activeConv ? activeConv.title : "Mqulima AI Chat";

    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 47, 32); // Forest Green
      doc.text(title, 20, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on ${new Date().toLocaleDateString()} from Mqulima AI`, 20, 28);
      doc.line(20, 32, 190, 32);

      let y = 42;
      doc.setFontSize(10);
      for (const msg of messages) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        const roleText = msg.role === "user" ? `${user.name} (Farmer)` : "Mqulima AI Expert";
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(msg.role === "user" ? 45 : 17, msg.role === "user" ? 106 : 47, msg.role === "user" ? 79 : 32);
        doc.text(`${roleText}:`, 20, y);
        y += 6;

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(30, 30, 30);
        // Stripping basic markdown characters for simpler PDF printing
        const cleanContent = msg.content.replace(/[*#`_\-]/g, "").trim();
        const splitContent = doc.splitTextToSize(cleanContent, 170);
        for (const line of splitContent) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 5.5;
        }
        y += 6; // Separation padding
      }
      doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF export.");
    }
  };

  // Filter conversations list by search query
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#0A110D] text-white">
        
        {/* Mobile Sidebar / Drawer (Slide-in overlay) */}
        <div className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isMobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}>
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          {/* Drawer container */}
          <div className={`absolute inset-y-0 left-0 w-72 bg-[#0C1510] border-r border-[#1B3627] p-1 flex flex-col transition-transform duration-300 transform ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
            {/* Close button & Title */}
            <div className="flex items-center justify-between p-4 border-b border-[#1B3627]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#4CAF50]" />
                <span className="font-bold text-sm tracking-wide">Chat History</span>
              </div>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 hover:bg-white/5 rounded text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar content (cloned from desktop sidebar, but closed when clicking conversation) */}
            {/* New Chat Button */}
            <div className="p-4 border-b border-[#1B3627]">
              <button
                onClick={() => {
                  handleNewChat();
                  setIsMobileSidebarOpen(false);
                }}
                disabled={isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:scale-102 hover:shadow-lg disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </button>
            </div>

            {/* Search bar */}
            <div className="px-4 py-2 border-b border-[#1B3627]/50">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#1B3627] bg-[#0A110D] px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#4CAF50] transition-colors"
              />
            </div>

            {/* List area */}
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
                        selectConversation(conv.id);
                        setIsMobileSidebarOpen(false);
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

                      {/* Quick utilities */}
                      <div className="absolute right-2 flex items-center gap-1 opacity-100 transition-opacity">
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
                              title="Rename"
                              className="p-1 hover:text-white transition-colors"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleTogglePin(e, conv.id)}
                              title={conv.is_pinned ? "Unpin" : "Pin"}
                              className={`p-1 transition-colors ${conv.is_pinned ? "text-gold hover:text-white" : "hover:text-[#4CAF50]"}`}
                            >
                              <Pin className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleToggleFav(e, conv.id)}
                              title={conv.is_favorite ? "Unfavorite" : "Favorite"}
                              className={`p-1 transition-colors ${conv.is_favorite ? "text-gold hover:text-white" : "hover:text-gold"}`}
                            >
                              <Star className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteChat(e, conv.id)}
                              title="Delete"
                              className="p-1 hover:text-red-500 transition-colors"
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

            {/* Profile brief */}
            <div className="p-4 border-t border-[#1B3627] bg-[#0A110D]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#2D6A4F] grid place-items-center text-xs font-bold font-mono">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-bold truncate">{user.name}</div>
                  <div className="text-[10px] text-[#4CAF50] truncate">{user.county} County</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
           1. SIDEBAR: Chat List & History Controls
           ========================================================================= */}
        <aside className="hidden md:flex w-72 flex-col border-r border-[#1B3627] bg-[#0C1510] shrink-0">
          
          {/* New Chat Button */}
          <div className="p-4 border-b border-[#1B3627]">
            <button
              onClick={handleNewChat}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:scale-102 hover:shadow-lg disabled:opacity-50 cursor-pointer shadow-md"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </button>
          </div>

          {/* Search bar */}
          <div className="px-4 py-2 border-b border-[#1B3627]/50">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#1B3627] bg-[#0A110D] px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#4CAF50] transition-colors"
            />
          </div>

          {/* List area */}
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
                    onClick={() => selectConversation(conv.id)}
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

                    {/* Quick utilities */}
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
                            title="Rename"
                            className="p-1 hover:text-white transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleTogglePin(e, conv.id)}
                            title={conv.is_pinned ? "Unpin" : "Pin"}
                            className={`p-1 transition-colors ${conv.is_pinned ? "text-gold hover:text-white" : "hover:text-[#4CAF50]"}`}
                          >
                            <Pin className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleToggleFav(e, conv.id)}
                            title={conv.is_favorite ? "Unfavorite" : "Favorite"}
                            className={`p-1 transition-colors ${conv.is_favorite ? "text-gold hover:text-white" : "hover:text-gold"}`}
                          >
                            <Star className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteChat(e, conv.id)}
                            title="Delete"
                            className="p-1 hover:text-red-500 transition-colors"
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
          
          {/* User profile brief */}
          <div className="p-4 border-t border-[#1B3627] bg-[#0A110D]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#2D6A4F] grid place-items-center text-xs font-bold font-mono">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-bold truncate">{user.name}</div>
                <div className="text-[10px] text-[#4CAF50] truncate">{user.county} County</div>
              </div>
            </div>
          </div>
        </aside>

        {/* =========================================================================
           2. MAIN WORKSPACE: Active chat window
           ========================================================================= */}
        <section className="flex flex-1 flex-col bg-[#0A110D]">
          
          {/* Workspace Header */}
          <header className="flex h-14 items-center justify-between border-b border-[#1B3627] px-4 md:px-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="md:hidden p-1.5 rounded hover:bg-white/5 mr-1 cursor-pointer text-white/60 hover:text-white"
                title="Open Chat History"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/tools" className="md:hidden p-1 rounded hover:bg-white/5 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-2 w-2 rounded-full bg-[#4CAF50] animate-pulse" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                {activeConvId
                  ? conversations.find(c => c.id === activeConvId)?.title || "Active Conversation"
                  : "🌱 Mqulima AI Advisor"}
              </h2>
              <span className="text-[10px] bg-[#2D6A4F]/20 text-[#4CAF50] border border-[#2D6A4F]/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ml-2 font-mono">
                Gemini 2.5 Flash
              </span>
            </div>

            {/* Export options */}
            {messages.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportPDF}
                  title="Export PDF"
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleExportMarkdown}
                  title="Export Markdown"
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={handleExportJSON}
                  title="Export JSON"
                  className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </header>

          {/* Active messages list / suggestions */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 && !loadingMessages ? (
              
              // --------------------------------------------------------------
              // Suggestions / Empty State Panel
              // --------------------------------------------------------------
              <div className="mx-auto max-w-2xl py-8 md:py-16 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-[#4CAF50] mb-6">
                  <Sparkles className="h-7 w-7 animate-pulse" />
                </div>
                <h1 className="text-2xl font-extrabold text-white leading-tight">
                  Intelligent Agricultural Advisor
                </h1>
                <p className="mt-2 text-sm text-white/50 max-w-md mx-auto">
                  Hi {user.name.split(" ")[0]}, ask me anything about your farm in {user.county} County. I am integrated with live weather, market pricing, and diagnostics logs.
                </p>

                {/* Suggestions Grid */}
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <SuggestionCard
                    icon={Wrench}
                    title="Crop/Livestock Doctor"
                    desc="Check crop symptoms, dewormers, or identify livestock disease."
                    prompt="I notice yellowing spots on my potato leaves. Based on my location in Uasin Gishu, what is the most likely disease and how can I treat it organically?"
                    onClick={handleSuggestionClick}
                  />
                  <SuggestionCard
                    icon={Calculator}
                    title="NPK Fertilizer Calculator"
                    desc="Calculate organic and chemical NPK soil demands."
                    prompt="My soil test results show mild nitrogen deficiency for maize planting. Calculate the exact planting fertilizer bags (Mavuno or DAP) required for my 4 acres."
                    onClick={handleSuggestionClick}
                  />
                  <SuggestionCard
                    icon={TrendingUp}
                    title="Yield Predictor"
                    desc="Estimate harvest metrics from inputs and rain outlook."
                    prompt="Predict the average yield per acre for dry beans in Uasin Gishu if we experience moderate rains this planting season."
                    onClick={handleSuggestionClick}
                  />
                  <SuggestionCard
                    icon={Compass}
                    title="Crop Rotation Planner"
                    desc="Sustainable crop sequence sequencing."
                    prompt="Suggest a 3-year sustainable crop rotation plan for my 4 acres where maize was harvested last season, incorporating nitrogen-fixing crops."
                    onClick={handleSuggestionClick}
                  />
                </div>
              </div>

            ) : loadingMessages ? (
              <div className="flex h-full items-center justify-center text-white/40 text-xs">
                Loading conversation messages...
              </div>
            ) : (

              // --------------------------------------------------------------
              // Chronological Chat Render
              // --------------------------------------------------------------
              <div className="space-y-6 max-w-3xl mx-auto">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={index}
                      className={`flex gap-4 ${isUser ? "justify-end text-right" : "justify-start text-left"}`}
                    >
                      {/* Avatar for bot */}
                      {!isUser && (
                        <div className="h-8 w-8 rounded-full bg-[#1B3627] border border-[#2D6A4F]/40 grid place-items-center text-[#4CAF50] shrink-0 font-bold font-mono">
                          🌱
                        </div>
                      )}

                      <div className="max-w-[85%] flex flex-col space-y-1.5">
                        
                        {/* Message box */}
                        <div
                          className={`rounded-2xl px-4 py-3.5 shadow-sm text-sm border ${
                            isUser
                              ? "bg-[#2D6A4F] border-[#2D6A4F] text-white rounded-br-none"
                              : "bg-[#0E1712] border-[#1B3627] text-white/95 rounded-bl-none"
                          }`}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</p>
                          ) : (
                            <MarkdownRenderer content={msg.content} />
                          )}

                          {/* Show user message attachment previews */}
                          {isUser && msg.attachments && (
                            (() => {
                              const attArray = Array.isArray(msg.attachments)
                                ? msg.attachments
                                : typeof msg.attachments === "string"
                                  ? (() => {
                                      try {
                                        const parsed = JSON.parse(msg.attachments);
                                        return Array.isArray(parsed) ? parsed : [];
                                      } catch (e) {
                                        return [];
                                      }
                                    })()
                                  : [];
                              if (attArray.length === 0) return null;
                              return (
                                <div className="mt-3 flex flex-wrap gap-2 justify-end">
                                  {attArray.map((att: any, attIdx: number) => (
                                    <div
                                      key={attIdx}
                                      className="flex items-center gap-1.5 rounded-lg bg-black/20 border border-white/5 px-2.5 py-1 text-[10px] text-white/80"
                                    >
                                      <Paperclip className="h-3 w-3" />
                                      <span className="truncate max-w-[120px]">{att.name}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()
                          )}
                        </div>

                        {/* Show user message controls: delete */}
                        {isUser && msg.id && (
                          <div className="flex items-center gap-2.5 justify-end pr-1.5 text-xs text-white/40">
                            <button
                              onClick={() => handleDeleteMessage(msg.id!)}
                              className="hover:text-red-400 text-red-500/60 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        )}

                        {/* Bot inline controls: copy, speak */}
                        {!isUser && msg.content && (
                          <div className="flex items-center gap-2.5 pl-1.5 text-xs text-white/40">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                toast.success("Message copied to clipboard!");
                              }}
                              className="hover:text-white transition-colors cursor-pointer"
                            >
                              Copy
                            </button>
                            <span>·</span>
                            <button
                              onClick={() => toggleSpeechOutput(msg.content)}
                              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {isSpeaking === msg.content ? (
                                <>
                                  <VolumeX className="h-3 w-3" /> Stop Speech
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3 w-3" /> Speak Tip
                                </>
                              )}
                            </button>
                            {msg.id && (
                              <>
                                <span>·</span>
                                <button
                                  onClick={() => handleDeleteMessage(msg.id!)}
                                  className="hover:text-red-400 text-red-500/60 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Avatar for user */}
                      {isUser && (
                        <div className="h-8 w-8 rounded-full bg-[#2D6A4F] grid place-items-center text-white shrink-0 font-bold font-mono text-xs">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Stream loader indicator */}
                {isGenerating && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-4 justify-start">
                    <div className="h-8 w-8 rounded-full bg-[#1B3627] border border-[#2D6A4F]/40 grid place-items-center text-[#4CAF50] shrink-0 font-bold font-mono">
                      🌱
                    </div>
                    <div className="rounded-2xl px-4 py-3.5 bg-[#0E1712] border border-[#1B3627] text-white/40 text-xs flex items-center gap-2 rounded-bl-none">
                      <div className="h-2 w-2 bg-[#4CAF50] rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-[#4CAF50] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 bg-[#4CAF50] rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span>Formulating expert agricultural response...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          {/* =========================================================================
             3. PROMPT EDITOR & INPUT
             ========================================================================= */}
          <footer className="p-4 border-t border-[#1B3627] bg-[#0C1510] max-w-3xl w-full mx-auto rounded-t-2xl shadow-2xl">
            {lastFailedPrompt && !isGenerating && (
              <div className="mb-3 flex flex-col gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-left sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-100">The last response did not complete.</p>
                  <p className="truncate text-[10px] text-amber-100/60">{lastFailedPrompt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendMessage(lastFailedPrompt)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0A110D] transition hover:bg-amber-400"
                >
                  <RotateCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}
            
            {/* Attachment previews before sending */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-black/40 border border-[#1B3627] px-3 py-1.5 text-xs text-white"
                  >
                    {file.mimeType.startsWith("image/") ? (
                      <img src={file.base64} alt="preview" className="h-6 w-6 rounded object-cover" />
                    ) : (
                      <FileText className="h-4.5 w-4.5 text-[#4CAF50]" />
                    )}
                    <div className="min-w-0 text-left">
                      <div className="truncate max-w-[120px] font-semibold text-white/80">{file.name}</div>
                      <div className="text-[9px] text-white/40">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="p-0.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Main Input Textarea bar */}
            <div className="flex items-end gap-2 bg-[#0A110D] border border-[#1B3627] rounded-2xl p-2 focus-within:border-[#4CAF50] transition-colors">
              
              {/* Attachment selector */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach crop image or document (PDF/Spreadsheet)"
                className="p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*,application/pdf,text/plain,text/csv"
                onChange={handleFileAttach}
                className="hidden"
              />

              {/* Speech Recognition input */}
              <button
                type="button"
                onClick={toggleSpeechInput}
                title="Voice Input (Speech-to-Text)"
                className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                  isListening 
                    ? "bg-red-500/20 text-red-500 animate-pulse" 
                    : "hover:bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                <Mic className="h-4.5 w-4.5" />
              </button>

              {/* Text box */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Mqulima AI... (e.g. crop health symptoms, deworming, fertilizer bags)"
                rows={1}
                className="flex-1 max-h-40 min-h-[36px] bg-transparent border-0 outline-none text-white text-sm placeholder-white/30 resize-none py-1.5 px-2 text-left"
              />

              {/* Send / Stop button */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  title="Stop Generating"
                  className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors shrink-0 cursor-pointer shadow-md"
                >
                  <Square className="h-4 w-4" fill="white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!prompt.trim() && attachments.length === 0}
                  title="Send Prompt"
                  className="p-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#224f3b] text-white disabled:opacity-30 disabled:hover:bg-[#2D6A4F] transition-colors shrink-0 cursor-pointer shadow-md"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Context status note */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-white/35 px-1 font-mono">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#4CAF50]" />
                <span>
                  Integrated Context: {user.county} Weather (
                  {weatherState.temp !== undefined
                    ? `${weatherState.temp}°C`
                    : loadingWeather
                      ? "Loading..."
                      : "Unavailable"}
                  )
                </span>
              </div>
              <div>Press Enter to send, Shift+Enter for new line</div>
            </div>
          </footer>
        </section>
      </div>
    </AppLayout>
  );
}

// ------------------------------------------------------------------
// Sub-components: Suggestion Card
// ------------------------------------------------------------------
type SuggestionCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  prompt: string;
  onClick: (prompt: string) => void;
};

function SuggestionCard({ icon: Icon, title, desc, prompt, onClick }: SuggestionCardProps) {
  return (
    <div
      onClick={() => onClick(prompt)}
      className="group rounded-2xl border border-[#1B3627] bg-[#0E1712] p-4 text-left transition duration-300 hover:border-[#4CAF50]/40 hover:bg-[#112318] hover:scale-101 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 p-2.5 text-[#4CAF50] transition group-hover:scale-105">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
      </div>
      <p className="mt-2 text-xs text-white/55 leading-relaxed">{desc}</p>
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-components: Custom Markdown + Table Renderer
// ------------------------------------------------------------------
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm text-white/90 leading-relaxed font-sans text-left">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          // Extract language and code
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);

          return (
            <div key={index} className="relative my-4 rounded-xl overflow-hidden bg-black/90 border border-white/10 font-mono text-xs text-white">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-white/50 text-[10px] uppercase font-bold tracking-wider">
                <span>{lang || "code"}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code.trim());
                    toast.success("Code copied to clipboard!");
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-left whitespace-pre">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        // Parse line by line for other blocks
        const lines = part.split("\n");
        const renderedBlocks: React.ReactNode[] = [];
        let listItems: string[] = [];
        let inTable = false;
        let tableHeaders: string[] = [];
        let tableRows: string[][] = [];

        const renderInlineStyles = (text: string): React.ReactNode => {
          if (!text) return "";

          // Regex to match markdown links: [text](url), bold: **text**, italics: *text* or _text_, and inline code: `text`
          const regex = /(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(\*.*?\*)|(_.*?_)|(`.*?`)/g;

          const parts = text.split(regex);
          return parts.map((part, i) => {
            if (!part) return null;

            // Check if it's a link [text](url)
            if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
              const match = part.match(/\[(.*?)\]\((.*?)\)/);
              if (match) {
                const [, label, url] = match;
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4CAF50] underline hover:text-[#5dbb63] transition-colors font-semibold"
                  >
                    {label}
                  </a>
                );
              }
            }

            // Check if it's bold **text**
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-extrabold text-[#4CAF50]">
                  {part.slice(2, -2)}
                </strong>
              );
            }

            // Check if it's italic *text* or _text_
            if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
              return (
                <em key={i} className="italic text-white/90">
                  {part.slice(1, -1)}
                </em>
              );
            }

            // Check if it's inline code `text`
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 font-mono text-xs text-[#4CAF50]"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }

            return part;
          });
        };

        const flushList = (key: number) => {
          if (listItems.length > 0) {
            renderedBlocks.push(
              <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1">
                {listItems.map((li, idx) => (
                  <li key={idx} className="text-white/85">{renderInlineStyles(li)}</li>
                ))}
              </ul>
            );
            listItems = [];
          }
        };

        const flushTable = (key: number) => {
          if (inTable && (tableHeaders.length > 0 || tableRows.length > 0)) {
            renderedBlocks.push(
              <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-[#1B3627]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#2D6A4F]/20 border-b border-[#1B3627]">
                      {tableHeaders.map((header, idx) => (
                        <th key={idx} className="p-3 font-bold text-[#4CAF50] uppercase tracking-wider">{header.trim()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-[#1B3627]/40 hover:bg-white/5 transition">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 text-white/80 font-medium">{renderInlineStyles(cell.trim())}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            tableHeaders = [];
            tableRows = [];
            inTable = false;
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // 1. Table support
          if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
            flushList(i);
            const cells = line.split("|").slice(1, -1);
            if (!inTable) {
              inTable = true;
              tableHeaders = cells;
            } else {
              const isSeparator = cells.every(cell => cell.trim().match(/^-+$/));
              if (!isSeparator) {
                tableRows.push(cells);
              }
            }
            continue;
          } else {
            flushTable(i);
          }

          // 2. Headings
          if (line.startsWith("# ")) {
            flushList(i);
            renderedBlocks.push(
              <h1 key={i} className="text-base font-black text-[#4CAF50] mt-4 mb-2">
                {renderInlineStyles(line.slice(2))}
              </h1>
            );
          } else if (line.startsWith("## ")) {
            flushList(i);
            renderedBlocks.push(
              <h2 key={i} className="text-sm font-bold text-[#4CAF50] mt-3.5 mb-2">
                {renderInlineStyles(line.slice(3))}
              </h2>
            );
          } else if (line.startsWith("### ")) {
            flushList(i);
            renderedBlocks.push(
              <h3 key={i} className="text-xs font-bold text-white/90 mt-3 mb-1.5">
                {renderInlineStyles(line.slice(4))}
              </h3>
            );
          }
          // 3. Lists
          else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const content = line.trim().slice(2);
            listItems.push(content);
          }
          // 4. Empty lines
          else if (!line.trim()) {
            flushList(i);
            renderedBlocks.push(<div key={i} className="h-2" />);
          }
          // 5. Normal paragraphs
          else {
            flushList(i);
            renderedBlocks.push(
              <p key={i} className="my-1.5 text-white/80 leading-relaxed font-normal">
                {renderInlineStyles(line)}
              </p>
            );
          }
        }

        flushList(lines.length);
        flushTable(lines.length);

        return <div key={index}>{renderedBlocks}</div>;
      })}
    </div>
  );
}
