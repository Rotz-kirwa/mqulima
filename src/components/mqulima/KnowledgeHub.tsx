import { Link } from "@tanstack/react-router";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { articles, marketPrices } from "@/lib/mqulima-data";
import { SectionHeading } from "./SectionHeading";

export function KnowledgeHub() {
  return (
    <section className="bg-sepia/60 py-20">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Academy"
          title="Learn. Earn. Repeat."
          subtitle="Field guides, expert Q&A and live market prices — built for Kenyan farming realities."
          action={
            <Link
              to="/academy"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              All articles <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {articles.map((a, i) => (
              <article
                key={a.id}
                className={`group flex gap-5 rounded-3xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:shadow-elegant md:p-6 ${i === 0 ? "md:p-8" : ""}`}
              >
                <img
                  src={a.image}
                  alt={a.title}
                  loading="lazy"
                  className={`shrink-0 rounded-2xl object-cover shadow-sm transition duration-300 group-hover:scale-[1.02] ${i === 0 ? "h-32 w-32" : "h-24 w-24"}`}
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                      {a.category}
                    </span>
                    <span className="text-muted-foreground">{a.readTime} read</span>
                  </div>
                  <h3
                    className={`mt-2 font-extrabold text-forest group-hover:text-primary ${i === 0 ? "text-xl md:text-2xl" : "text-base md:text-lg"}`}
                  >
                    {a.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                  <span className="mt-auto pt-3 text-xs font-semibold text-primary">
                    Read article →
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-3xl bg-forest p-6 text-forest-foreground shadow-elegant">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Live Market Prices</h3>
              <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
                Live
              </span>
            </div>
            <p className="mt-1 text-xs text-forest-foreground/60">
              Updated every 2 hours · NCPB & KAMIS
            </p>
            <ul className="mt-5 divide-y divide-white/10">
              {marketPrices.map((p) => (
                <li key={p.item} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-bold">{p.item}</div>
                    <div className="text-[11px] text-forest-foreground/60">{p.market}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-gold">
                      KES {p.price.toLocaleString()}
                    </div>
                    <div
                      className={`flex items-center justify-end gap-1 text-[11px] font-semibold ${p.change >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {p.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(p.change)}%
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
