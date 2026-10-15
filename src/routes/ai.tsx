// ============================================================================
// ai.tsx — Mqulima AI Dedicated Full-Page Workspace
// Route: /ai
// ============================================================================

import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { AuthPromptModal } from "@/components/mqulima/AuthPromptModal";
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
import { trackEvent } from "@/lib/events";

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

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalReason, setModalReason] = useState("use Mqulima AI");

  if (!user) {
    const samplePrompts = [
      {
        tag: "Plant Health",
        query: "How do I diagnose Fall Armyworm on 4-week maize leaves?",
        hint: "Optical pathology & local IPM treatments"
      },
      {
        tag: "Weather Advisories",
        query: "Is it safe to spray fungicide in Nakuru this afternoon?",
        hint: "Precipitation wash-off & wind velocity check"
      },
      {
        tag: "Agronomy Sowing",
        query: "What is the recommended seed rate for DK 777 maize per acre?",
        hint: "Soil nutrient requirements & plant population"
      },
      {
        tag: "Market Arbitrage",
        query: "What are the latest wholesale prices for dry maize in Eldoret?",
        hint: "KAMIS verified commodity price lookup"
      }
    ];

    const handlePromptClick = (queryText: string) => {
      setModalReason(`ask Mqulima AI: "${queryText}"`);
      setShowAuthModal(true);
    };

    return (
      <AppLayout>
        <div className="min-h-[85vh] bg-[#0A110D] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background glowing orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#85CC14]/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#1B4332]/25 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto w-full text-center relative z-10 space-y-8">
            {/* Engine Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#16382B] border border-[#85CC14]/40 text-[#85CC14] text-xs font-black uppercase tracking-wider shadow-lg">
              <Sparkles className="h-4 w-4 text-[#85CC14] animate-pulse" />
              <span>Next-Gen Gemini Agricultural Intelligence</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-['Outfit',sans-serif] leading-tight">
                Your 24/7 Intelligent Agronomist & Farm Advisor
              </h1>
              <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed">
                Localized for Kenya's 47 counties. Diagnoses crop diseases, provides spray windows, recommends certified agrochemicals, and tracks KAMIS market prices.
              </p>
            </div>

            {/* Feature Capability Highlights */}
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              <div className="p-5 rounded-2xl bg-[#121E16] border border-white/10 hover:border-[#85CC14]/40 transition space-y-2 shadow-md">
                <div className="w-9 h-9 rounded-xl bg-[#85CC14]/15 text-[#85CC14] flex items-center justify-center font-bold text-base">
                  🔬
                </div>
                <h3 className="text-sm font-black text-white">Visual Crop Pathology</h3>
                <p className="text-xs text-stone-400 leading-normal">
                  Upload leaf, stem, or fruit photos for instant pathology identification and organic/synthetic IPM advice.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#121E16] border border-white/10 hover:border-[#85CC14]/40 transition space-y-2 shadow-md">
                <div className="w-9 h-9 rounded-xl bg-[#85CC14]/15 text-[#85CC14] flex items-center justify-center font-bold text-base">
                  🌦️
                </div>
                <h3 className="text-sm font-black text-white">County Weather Windows</h3>
                <p className="text-xs text-stone-400 leading-normal">
                  Precipitation probabilities and wind analysis to ensure chemical sprays do not wash off or drift.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#121E16] border border-white/10 hover:border-[#85CC14]/40 transition space-y-2 shadow-md">
                <div className="w-9 h-9 rounded-xl bg-[#85CC14]/15 text-[#85CC14] flex items-center justify-center font-bold text-base">
                  📈
                </div>
                <h3 className="text-sm font-black text-white">Real-Time Soko Prices</h3>
                <p className="text-xs text-stone-400 leading-normal">
                  Authoritative commodity rates from wholesale markets in Nairobi, Eldoret, Nakuru, and Mombasa.
                </p>
              </div>
            </div>

            {/* Interactive Preview Simulator / Sample Questions */}
            <div className="p-6 rounded-3xl bg-[#0F291E]/90 border border-[#85CC14]/30 text-left space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#85CC14]">
                  <span>💬 Sample Agronomic Prompts</span>
                </div>
                <span className="text-[11px] text-stone-400 font-medium">Click any question to preview</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {samplePrompts.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePromptClick(s.query)}
                    className="p-3.5 rounded-xl bg-[#0B2117] hover:bg-[#16382B] border border-white/10 hover:border-[#85CC14]/50 text-left transition-all group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#85CC14] mb-1">
                      <span>{s.tag}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Launch →</span>
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-[#85CC14] transition-colors line-clamp-1">
                      "{s.query}"
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">{s.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/auth/sign-in"
                search={{ redirect: "/ai" } as any}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#85CC14]/20 cursor-pointer"
              >
                Sign In to Start Asking
              </Link>
              <Link
                to="/auth/sign-up"
                search={{ redirect: "/ai" } as any}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Create Free Account
              </Link>
            </div>
            
            <p className="text-[11px] text-stone-400">
              Free access for all registered Kenyan smallholders & commercial growers.
            </p>
          </div>

          {/* Auth Prompt Modal */}
          <AuthPromptModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            featureName={modalReason}
            redirectPath="/ai"
          />
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
            onSendMessage={(textToSend) => {
              trackEvent("ai_assistant_used", { feature_name: "chat_prompt" });
              handleSendMessage(textToSend);
            }}
            onStopGeneration={handleStopGeneration}
            onDeleteMessage={handleDeleteMessage}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />
        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}
