import React, { useRef, useEffect } from "react";
import { Sparkles, Menu, ArrowRight } from "lucide-react";
import { AIIcon } from "@/components/mqulima/AIIcon";
import { Message, Conversation, WeatherState, Attachment } from "../types/ai.types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ExportPDF } from "./ExportPDF";
import { LoadingState } from "@/shared/components/LoadingState";

interface Props {
  user: any;
  messages: Message[];
  conversations: Conversation[];
  activeConvId: string | null;
  loadingMessages: boolean;
  isGenerating: boolean;
  prompt: string;
  setPrompt: (v: string) => void;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  weatherState: WeatherState;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleSpeechInput: () => void;
  onToggleSpeechOutput: (text: string) => void;
  onSendMessage: (textToSend?: string) => void;
  onStopGeneration: () => void;
  onDeleteMessage: (msgId: string) => void;
  onOpenMobileSidebar: () => void;
}

export const ChatWindow: React.FC<Props> = ({
  user,
  messages,
  conversations,
  activeConvId,
  loadingMessages,
  isGenerating,
  prompt,
  setPrompt,
  attachments,
  setAttachments,
  weatherState,
  isListening,
  isSpeaking,
  onToggleSpeechInput,
  onToggleSpeechOutput,
  onSendMessage,
  onStopGeneration,
  onDeleteMessage,
  onOpenMobileSidebar,
}) => {
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const activeConversation = conversations.find(c => c.id === activeConvId);

  const quickSuggestions = [
    "What pesticide effectively eliminates fall armyworm on maize?",
    "Calculate fertilizer requirements for 2 acres of potatoes in Nakuru.",
    "Current wholesale prices for dry maize in Eldoret vs Nairobi?",
    "How to manage early tomato blight organically using neem leaves?"
  ];

  return (
    <div className="flex flex-1 flex-col h-full bg-[#0A110D] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1B3627] bg-[#0C1510]">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-1.5 rounded-lg bg-white/5 text-white/70 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <AIIcon className="h-5 w-5" animated={isGenerating} />
            <h1 className="text-xs md:text-sm font-bold truncate max-w-[200px] md:max-w-md">
              {activeConversation ? activeConversation.title : "Mqulima AI Workspace"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {weatherState.temp && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span>{user?.county || "Kenya"}: {weatherState.temp}°C</span>
              <span className="capitalize">({weatherState.desc})</span>
            </div>
          )}

          <ExportPDF
            messages={messages}
            activeConversation={activeConversation}
            userName={user?.name || "Farmer"}
          />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {loadingMessages ? (
          <LoadingState message="Fetching conversation messages..." />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center max-w-2xl mx-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#4CAF50] mb-4">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Habari, {user?.name || "Farmer"}!</h2>
            <p className="text-xs text-white/60 mb-6">
              I am your Mqulima AI assistant, ready to assist with crop diagnostics, weather advisories, market trends, and livestock management.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {quickSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(sug)}
                  className="flex items-start justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-[#1B3627] hover:border-[#4CAF50]/40 transition-all text-left group"
                >
                  <span>{sug}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#4CAF50]" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#1B3627]/30 pb-4">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id || idx}
                message={msg}
                userName={user?.name || "Farmer"}
                isSpeaking={isSpeaking}
                onToggleSpeech={() => onToggleSpeechOutput(msg.content)}
                onDeleteMessage={msg.id ? () => onDeleteMessage(msg.id!) : undefined}
              />
            ))}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      {/* Input controls */}
      <ChatInput
        prompt={prompt}
        setPrompt={setPrompt}
        attachments={attachments}
        setAttachments={setAttachments}
        isGenerating={isGenerating}
        isListening={isListening}
        onSendMessage={() => onSendMessage()}
        onStopGeneration={onStopGeneration}
        onToggleSpeechInput={onToggleSpeechInput}
      />
    </div>
  );
};
