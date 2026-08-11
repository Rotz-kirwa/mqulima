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
import { Conversation, Message, Attachment, WeatherState } from "../types/ai.types";

export const aiService = {
  async fetchConversations(): Promise<Conversation[]> {
    const data = await getConversations();
    return data as unknown as Conversation[];
  },

  async fetchMessages(conversationId: string): Promise<Message[]> {
    const data = await getConversationMessages({ data: { conversationId } });
    return data as unknown as Message[];
  },

  async createNewConversation(title: string = "New Conversation"): Promise<Conversation> {
    const data = await createConversation({ data: { title } });
    return data as unknown as Conversation;
  },

  async renameConv(conversationId: string, title: string): Promise<Conversation> {
    const data = await renameConversation({ data: { conversationId, title } });
    return data as unknown as Conversation;
  },

  async deleteConv(conversationId: string): Promise<void> {
    await deleteConversation({ data: { conversationId } });
  },

  async deleteSingleMessage(messageId: string, conversationId: string): Promise<void> {
    await deleteMessage({ data: { messageId, conversationId } });
  },

  async togglePin(conversationId: string): Promise<void> {
    await togglePinConversation({ data: { conversationId } });
  },

  async toggleFav(conversationId: string): Promise<void> {
    await toggleFavoriteConversation({ data: { conversationId } });
  },

  async streamChatResponse({
    conversationId,
    message,
    history,
    attachments,
    weather,
    signal,
    onChunk
  }: {
    conversationId: string;
    message: string;
    history: Message[];
    attachments: Attachment[];
    weather?: WeatherState;
    signal?: AbortSignal;
    onChunk: (chunk: string) => void;
  }): Promise<string> {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        conversationId,
        message,
        history: history.map(m => ({ role: m.role, content: m.content, attachments: m.attachments })),
        attachments,
        weather: weather?.temp ? { temperature: weather.temp, description: weather.desc } : undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Failed to stream chat response.");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Null response stream reader");

    const decoder = new TextDecoder("utf-8");
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const textChunk = decoder.decode(value, { stream: true });
      accumulated += textChunk;
      onChunk(accumulated);
    }

    return accumulated;
  }
};
