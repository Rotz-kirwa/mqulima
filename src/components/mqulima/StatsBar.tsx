import { stats } from "@/lib/mqulima-data";

export function StatsBar() {
  const loop = [...stats, ...stats];
  return (
    <section className="border-y border-border bg-gradient-to-r from-forest via-blue/90 to-forest text-forest-foreground">
      <div className="relative overflow-hidden py-5">
        <div className="flex animate-marquee whitespace-nowrap">
          {loop.map((s, i) => (
            <div key={i} className="flex items-center gap-3 px-8">
              <span className="text-2xl font-extrabold text-gold">{s.value}</span>
              <span className="text-sm font-medium uppercase tracking-wider text-forest-foreground/70">{s.label}</span>
              <span className="ml-4 h-1.5 w-1.5 rounded-full bg-gold/40" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
