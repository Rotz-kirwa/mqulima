import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Users, TrendingUp, Award } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { CommunitySection } from "@/components/mqulima/CommunitySection";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community · Mqulima" },
      {
        name: "description",
        content: "Join 5,000+ Kenyan farmers swapping wins, lessons and tips county by county.",
      },
    ],
  }),
  component: Community,
});

const topics = [
  {
    county: "Uasin Gishu",
    crop: "Maize",
    title: "Best top-dressing window this season?",
    replies: 42,
    last: "2h ago",
  },
  {
    county: "Nyandarua",
    crop: "Potatoes",
    title: "Anyone tried Shangi variety lately?",
    replies: 28,
    last: "5h ago",
  },
  {
    county: "Machakos",
    crop: "Mango",
    title: "Fruit fly traps that actually work",
    replies: 67,
    last: "1d ago",
  },
  {
    county: "Kiambu",
    crop: "Dairy",
    title: "Affordable feed combinations for high milk",
    replies: 91,
    last: "1d ago",
  },
  {
    county: "Trans Nzoia",
    crop: "Wheat",
    title: "Pricing wheat at the silo — share experiences",
    replies: 18,
    last: "2d ago",
  },
];

function Community() {
  return (
    <AppLayout>
      <section className="bg-gradient-to-br from-forest to-primary py-16 text-forest-foreground">
        <div className="container-px mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            The Mqulima Community
          </span>
          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">
            5,000+ farmers. One movement.
          </h1>
          <p className="mt-2 max-w-xl text-forest-foreground/80">
            Share what's working, ask what isn't. Filtered by county and crop.
          </p>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Active farmers", value: "5,247" },
            { icon: MessageSquare, label: "Topics this week", value: "318" },
            { icon: TrendingUp, label: "Avg yield uplift", value: "+38%" },
            { icon: Award, label: "Success stories", value: "412" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <s.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-2xl font-extrabold text-forest">{s.value}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="text-lg font-bold text-forest">Trending discussions</h2>
            <button className="rounded-full bg-gold px-4 py-2 text-xs font-bold text-gold-foreground shadow-gold/30 transition hover:scale-105">
              Start a topic
            </button>
          </div>
          <ul className="divide-y divide-border">
            {topics.map((t, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-4 p-5 transition hover:bg-secondary/40"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-secondary to-accent text-2xl">
                  💬
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                      {t.county}
                    </span>
                    <span className="rounded-full bg-gold/15 px-2.5 py-1 text-gold-foreground">
                      {t.crop}
                    </span>
                  </div>
                  <div className="mt-1.5 font-bold text-forest">{t.title}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-foreground">{t.replies} replies</div>
                  <div className="text-muted-foreground">Last: {t.last}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CommunitySection />
    </AppLayout>
  );
}
