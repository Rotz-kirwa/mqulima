import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/lib/mqulima-data";
import { SectionHeading } from "./SectionHeading";

export function ServicesGrid() {
  return (
    <section className="bg-secondary/40 py-20">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="On-Farm Services"
          title="Book the expertise you need."
          subtitle="Vets, agronomists, soil scientists and machinery — verified, insured and one tap away."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link
              to="/services"
              key={s.id}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-primary opacity-0 blur-3xl transition group-hover:opacity-30" />
              <div className="flex items-start justify-between">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-accent text-3xl">
                  {s.icon}
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition group-hover:rotate-45 group-hover:text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-forest">{s.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.price}</span>
                <span className="text-xs font-bold text-primary group-hover:underline">Book now →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
