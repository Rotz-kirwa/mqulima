import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { HomeHero } from "@/components/mqulima/HomeHero";
import { StatsBar } from "@/components/mqulima/StatsBar";
import { ShopPreview } from "@/components/mqulima/ShopPreview";
import { ServicesGrid } from "@/components/mqulima/ServicesGrid";
import { AICropDoctor } from "@/components/mqulima/AICropDoctor";
import { WeatherWidget } from "@/components/mqulima/WeatherWidget";
import { KnowledgeHub } from "@/components/mqulima/KnowledgeHub";
import { CommunitySection } from "@/components/mqulima/CommunitySection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mqulima — Kenya's #1 Digital Farming Ecosystem" },
      {
        name: "description",
        content:
          "Shop agrovet supplies, book vets & soil services, diagnose crops with AI, and join 5,000+ Kenyan farmers winning with Mqulima.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppLayout>
      <HomeHero />
      <StatsBar />
      <ShopPreview />
      <ServicesGrid />
      <AICropDoctor />
      <WeatherWidget />
      <KnowledgeHub />
      <CommunitySection />
    </AppLayout>
  );
}
