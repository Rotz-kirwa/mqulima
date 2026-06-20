import { Quote, Users, Gift } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const stories = [
  {
    name: "Mary Wanjiku",
    county: "Nyandarua",
    crop: "Potatoes",
    quote:
      "Mqulima's soil test changed everything. I went from 45 bags to 82 bags per acre last season.",
    avatar: "👩🏾‍🌾",
  },
  {
    name: "Daniel Kiprop",
    county: "Uasin Gishu",
    crop: "Dairy",
    quote: "Booked a vet on Sunday morning, she was at my farm by 11am. My cow recovered fully.",
    avatar: "👨🏾‍🌾",
  },
  {
    name: "Grace Mutiso",
    county: "Machakos",
    crop: "Tomatoes",
    quote: "The AI Crop Doctor caught blight early. Saved my whole greenhouse harvest.",
    avatar: "👩🏾",
  },
];

export function CommunitySection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-20">
      <SectionHeading
        eyebrow="The Mqulima Community"
        title="Real farmers. Real wins."
        subtitle="A nationwide network sharing what works — county by county, crop by crop."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {stories.map((s) => (
          <figure
            key={s.name}
            className="relative flex flex-col rounded-3xl border border-border bg-card p-7 shadow-card"
          >
            <Quote className="h-7 w-7 text-gold" />
            <blockquote className="mt-4 text-base font-medium leading-relaxed text-foreground">
              "{s.quote}"
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-2xl">
                {s.avatar}
              </div>
              <div>
                <div className="text-sm font-bold text-forest">{s.name}</div>
                <div className="text-xs text-muted-foreground">
                  {s.crop} farmer · {s.county}
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-10 grid gap-4 rounded-3xl bg-gradient-to-br from-forest to-primary p-8 text-forest-foreground shadow-elegant md:grid-cols-2 md:p-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            <Gift className="h-3.5 w-3.5" /> Referral Program
          </div>
          <h3 className="mt-3 text-3xl font-extrabold md:text-4xl">
            Invite a farmer. Earn KES 500.
          </h3>
          <p className="mt-3 max-w-lg text-forest-foreground/80">
            For every farmer who signs up with your code and places their first order, you get KES
            500 in Mqulima credit. No cap.
          </p>
        </div>
        <div className="flex flex-col items-stretch justify-center gap-3 md:items-end">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="text-xs uppercase tracking-wider text-forest-foreground/60">
              Your referral code
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-gold">
              MQ-FARMER
            </div>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-gold-foreground transition hover:scale-105">
            <Users className="h-4 w-4" /> Invite farmers
          </button>
        </div>
      </div>
    </section>
  );
}
