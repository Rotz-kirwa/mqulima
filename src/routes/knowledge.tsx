import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, TrendingDown, Play } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { articles, marketPrices } from "@/lib/mqulima-data";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Hub · Mqulima" },
      { name: "description", content: "Field guides, expert Q&A and live market prices for Kenyan farmers." },
    ],
  }),
  component: Knowledge,
});

const categories = ["All", "Crops", "Livestock", "Business", "Climate", "Market Prices"];
const videos = [
  { title: "How to plant maize for 40 bags/acre", channel: "Mqulima TV", duration: "12:04" },
  { title: "Mastitis: prevention playbook", channel: "Vet Series", duration: "8:32" },
  { title: "Reading soil reports like a pro", channel: "Agronomy 101", duration: "15:18" },
];

function Knowledge() {
  return (
    <AppLayout>
      <section className="bg-gradient-to-br from-forest to-primary py-16 text-forest-foreground">
        <div className="container-px mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Knowledge Hub</span>
          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">Smart farming, simply explained.</h1>
          <p className="mt-2 max-w-xl text-forest-foreground/80">Practical guides, weekly market prices and answers from real agronomists.</p>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-12">
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((c, i) => (
            <button key={c} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"}`}>{c}</button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[...articles, ...articles].slice(0, 6).map((a, i) => (
              <article key={i} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
                <div className="h-44 overflow-hidden">
                  <img
                    src={a.image}
                    alt={a.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{a.category}</span>
                    <span className="text-muted-foreground">{a.readTime} read</span>
                  </div>
                  <h3 className="mt-2 text-lg font-extrabold text-forest group-hover:text-primary">{a.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-forest p-6 text-forest-foreground shadow-elegant">
              <h3 className="text-lg font-extrabold">Live Market Prices</h3>
              <ul className="mt-4 divide-y divide-white/10">
                {marketPrices.map((p) => (
                  <li key={p.item} className="flex items-center justify-between py-3">
                    <div className="text-sm font-semibold">{p.item}</div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-gold">KES {p.price.toLocaleString()}</div>
                      <div className={`flex items-center justify-end gap-1 text-[10px] ${p.change >= 0 ? "text-success" : "text-destructive"}`}>
                        {p.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(p.change)}%
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-extrabold text-forest">Watch & Learn</h3>
              <div className="mt-4 space-y-3">
                {videos.map((v) => (
                  <div key={v.title} className="group flex cursor-pointer items-center gap-3 rounded-xl bg-secondary/60 p-3 transition hover:bg-secondary">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Play className="h-4 w-4 fill-current" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-forest">{v.title}</div>
                      <div className="text-[11px] text-muted-foreground">{v.channel} · {v.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-gold to-amber-400 p-6 text-gold-foreground shadow-gold">
              <h3 className="text-lg font-extrabold">Ask an Agronomist</h3>
              <p className="mt-1 text-sm">Submit your question and get an expert answer within 24 hours.</p>
              <Link to="/contact" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2.5 text-xs font-bold text-forest-foreground">Ask now <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </aside>
        </div>
      </section>
    </AppLayout>
  );
}
