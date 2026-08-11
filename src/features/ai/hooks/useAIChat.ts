import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Conversation, Message, Attachment, WeatherState } from "../types/ai.types";
import { aiService } from "../services/ai.service";

export function useAIChat(user: any, weatherState: WeatherState) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);
    try {
      const data = await aiService.fetchConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load conversation history");
    } finally {
      setLoadingConvs(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const selectConversation = async (id: string) => {
    if (isGenerating) {
      toast.error("Please stop generation before switching chats.");
      return;
    }
    setActiveConvId(id);
    setLoadingMessages(true);
    try {
      const msgs = await aiService.fetchMessages(id);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const startNewChat = async () => {
    if (isGenerating) return;
    try {
      const newConv = await aiService.createNewConversation("New Conversation");
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setPrompt("");
      setAttachments([]);
    } catch (e) {
      console.error(e);
      toast.error("Could not start a new chat");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalPrompt = (textToSend || prompt).trim();
    if (!finalPrompt && attachments.length === 0) return;

    let currentConvId = activeConvId;

    if (!currentConvId) {
      try {
        const title = finalPrompt.substring(0, 30) + (finalPrompt.length > 30 ? "..." : "");
        const newConv = await aiService.createNewConversation(title);
        setConversations(prev => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        currentConvId = newConv.id;
      } catch (e) {
        console.error(e);
        toast.error("Could not initialize chat session.");
        return;
      }
    }

    const userMsg: Message = {
      role: "user",
      content: finalPrompt,
      attachments: attachments.map(att => ({
        name: att.name,
        mimeType: att.mimeType,
        size: att.size,
      })),
    };

    setMessages(prev => [...prev, userMsg]);
    setPrompt("");
    const messageAttachments = [...attachments];
    setAttachments([]);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setMessages(prev => [...prev, { role: "model", content: "" }]);

      await aiService.streamChatResponse({
        conversationId: currentConvId,
        message: finalPrompt,
        history: messages,
        attachments: messageAttachments,
        weather: weatherState,
        signal: controller.signal,
        onChunk: (accumulated) => {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === "model") {
              last.content = accumulated;
            }
            return updated;
          });
        }
      });

      loadConversations();
      if (currentConvId) {
        const msgs = await aiService.fetchMessages(currentConvId);
        setMessages(msgs);
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        toast.info("Generation halted.");
      } else {
        console.error(e);
        toast.error(e.message || "Something went wrong during generation.");
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeConvId) return;
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await aiService.deleteSingleMessage(msgId, activeConvId);
        setMessages(prev => prev.filter(m => m.id !== msgId));
        toast.success("Message deleted");
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete message");
      }
    }
  };

  return {
    conversations,
    setConversations,
    activeConvId,
    setActiveConvId,
    messages,
    setMessages,
    prompt,
    setPrompt,
    attachments,
    setAttachments,
    isGenerating,
    loadingConvs,
    loadingMessages,
    loadConversations,
    selectConversation,
    startNewChat,
    handleSendMessage,
    handleStopGeneration,
    handleDeleteMessage,
  };
}
