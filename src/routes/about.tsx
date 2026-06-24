import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { AboutHero } from "@/components/about/AboutHero";
import { AboutOrigin } from "@/components/about/AboutOrigin";
import { AboutMission } from "@/components/about/AboutMission";
import { AboutStats } from "@/components/about/AboutStats";
import { AboutPhotoEssay } from "@/components/about/AboutPhotoEssay";
import { AboutTeam } from "@/components/about/AboutTeam";
import { AboutPartners } from "@/components/about/AboutPartners";
import { AboutRoadmap } from "@/components/about/AboutRoadmap";
import { AboutJoinUs } from "@/components/about/AboutJoinUs";
import { AboutCTA } from "@/components/about/AboutCTA";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Mqulima" },
      {
        name: "description",
        content:
          "Our mission: build the most farmer-friendly digital agriculture ecosystem in Kenya.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen font-sans">
        
        {/* SECTION 1 — HERO */}
        <AboutHero />

        {/* SECTION 2 — ORIGIN STORY */}
        <AboutOrigin />

        {/* SECTION 3 — MISSION & VALUES */}
        <AboutMission />

        {/* SECTION 4 — BY THE NUMBERS */}
        <AboutStats />

        {/* SECTION 5 — PHOTO ESSAY */}
        <AboutPhotoEssay />

        {/* SECTION 6 — TEAM */}
        <AboutTeam />

        {/* SECTION 7 — PARTNERS & PRESS */}
        <AboutPartners />

        {/* SECTION 8 — ROADMAP */}
        <AboutRoadmap />

        {/* SECTION 9 — OPEN ROLES / JOIN US */}
        <AboutJoinUs />

        {/* SECTION 10 — FINAL CTA */}
        <AboutCTA />

      </div>
    </AppLayout>
  );
}
