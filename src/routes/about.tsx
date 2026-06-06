import { createFileRoute } from "@tanstack/react-router";
import { Target, Users, Heart, Award } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Mqulima" },
      { name: "description", content: "Our mission: build the most farmer-friendly digital agriculture ecosystem in Africa, starting with Kenya." },
    ],
  }),
  component: About,
});

const team = [
  { name: "Brian Kiprono", role: "Co-founder & CEO", emoji: "👨🏾‍💼" },
  { name: "Faith Achieng", role: "Co-founder & Head of Vet Services", emoji: "👩🏾‍⚕️" },
  { name: "Dr. Samuel Mwangi", role: "Chief Agronomist", emoji: "👨🏾‍🔬" },
  { name: "Lydia Wambui", role: "Head of Community", emoji: "👩🏾‍🌾" },
];

const impact = [
  { value: "5,000+", label: "Farmers served" },
  { value: "20+", label: "Counties reached" },
  { value: "KES 18M", label: "Saved on inputs" },
  { value: "38%", label: "Avg yield uplift" },
];

function About() {
  return (
    <AppLayout>
      <section className="bg-gradient-to-br from-forest to-primary py-20 text-forest-foreground">
        <div className="container-px mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Our Story</span>
          <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">Built in Eldoret, for every Kenyan farmer.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-forest-foreground/85">
            Mqulima exists because farming in Kenya deserves better tools. We're a team of agronomists, vets and technologists obsessed with one outcome: making farmers richer.
          </p>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-20">
        <div className="grid gap-6 md:grid-cols-4">
          {impact.map((s) => (
            <div key={s.label} className="rounded-3xl border border-border bg-card p-7 text-center shadow-card">
              <div className="text-4xl font-extrabold text-primary">{s.value}</div>
              <div className="mt-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: "Our Mission", text: "Give every Kenyan farmer instant access to quality inputs, expert services and intelligent farm advice." },
            { icon: Heart, title: "Our Values", text: "Farmer-first. Honest pricing. Same-day delivery. Receipts for everything. No middlemen tax." },
            { icon: Award, title: "Our Promise", text: "If a Mqulima product doesn't perform as advertised, we replace it or refund — full stop." },
          ].map((c) => (
            <div key={c.title} className="rounded-3xl border border-border bg-card p-7 shadow-card">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><c.icon className="h-6 w-6" /></div>
              <h3 className="mt-4 text-xl font-extrabold text-forest">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-3xl font-extrabold text-forest md:text-4xl">The team</h2>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <div key={m.name} className="group rounded-3xl border border-border bg-card p-6 text-center shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-secondary to-accent text-4xl">{m.emoji}</div>
                <div className="mt-4 font-bold text-forest">{m.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
