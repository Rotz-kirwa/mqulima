// ============================================================================
// ai.tsx — Mqulima AI Dedicated Full-Page Workspace
// Route: /ai
// ============================================================================

import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { fetchWeather } from "@/lib/api/weather";
import {
  useAIChat,
  useSpeech,
  ConversationHistory,
  ChatWindow,
  WeatherState
} from "@/features/ai";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

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

function MqulimaAIWorkspace() {
  const { user } = useAuth();
  const [weatherState, setWeatherState] = useState<WeatherState>({});
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    conversations,
    activeConvId,
    messages,
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
  } = useAIChat(user, weatherState);

  const {
    isListening,
    isSpeaking,
    toggleSpeechInput,
    toggleSpeechOutput,
  } = useSpeech();

  useEffect(() => {
    if (!user?.county) return;
    const coords = countyCoords[user.county];
    if (!coords) return;
    fetchWeather({ data: coords })
      .then(res => {
        setWeatherState({
          temp: res.current.temperature_2m,
          desc: res.conditionLabel,
        });
      })
      .catch(e => console.warn("Failed to load county weather", e));
  }, [user?.county]);

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
            to="/auth/sign-in"
            className="mt-6 rounded-full bg-[#2D6A4F] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#224f3b] shadow-md"
          >
            Sign In to Start
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ErrorBoundary fallbackTitle="Mqulima AI Workspace Error">
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#0A110D] text-white">
          <ConversationHistory
            conversations={conversations}
            activeConvId={activeConvId}
            loadingConvs={loadingConvs}
            isGenerating={isGenerating}
            isMobileSidebarOpen={isMobileSidebarOpen}
            onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
            onSelectConversation={selectConversation}
            onNewChat={startNewChat}
            onRefreshList={loadConversations}
          />

          <ChatWindow
            user={user}
            messages={messages}
            conversations={conversations}
            activeConvId={activeConvId}
            loadingMessages={loadingMessages}
            isGenerating={isGenerating}
            prompt={prompt}
            setPrompt={setPrompt}
            attachments={attachments}
            setAttachments={setAttachments}
            weatherState={weatherState}
            isListening={isListening}
            isSpeaking={isSpeaking !== null}
            onToggleSpeechInput={() => toggleSpeechInput((text) => setPrompt(prompt ? `${prompt} ${text}` : text))}
            onToggleSpeechOutput={toggleSpeechOutput}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            onDeleteMessage={handleDeleteMessage}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}
