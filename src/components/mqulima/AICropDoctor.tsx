import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { aiSymptoms, products } from "@/lib/mqulima-data";
import { SectionHeading } from "./SectionHeading";

export function AICropDoctor() {
  const [picked, setPicked] = useState<string | null>(null);
  const symptom = aiSymptoms.find((s) => s.id === picked);
  const dx = symptom?.diagnoses[0];
  const product = dx ? products.find((p) => p.id === dx.product) : null;

  return (
    <section className="container-px mx-auto max-w-7xl py-20">
      <SectionHeading
        eyebrow="AI Crop Doctor"
        title="Diagnose your crop in seconds."
        subtitle="Tap the symptoms you're seeing. Our AI matches them with the most likely cause, a treatment plan and the exact product to fix it."
      />
      <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-card md:grid-cols-5 md:p-10">
        <div className="md:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select symptoms</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {aiSymptoms.map((s) => (
              <button
                key={s.id}
                onClick={() => setPicked(s.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${picked === s.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/50"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-forest to-primary p-6 text-forest-foreground md:col-span-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Mqulima AI · Diagnosis
          </div>

          {!symptom ? (
            <div className="mt-6 grid place-items-center py-12 text-center text-forest-foreground/70">
              <div className="text-5xl">🌿</div>
              <p className="mt-3 text-sm">Pick one or more symptoms to begin your diagnosis.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-forest-foreground/60">Likely cause</div>
                <div className="mt-1 text-xl font-extrabold">{dx!.cause}</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <div className="text-xs uppercase tracking-wider text-gold">Advisory</div>
                <p className="mt-1 text-sm text-forest-foreground/90">{dx!.tip}</p>
              </div>
              {product && (
                <div className="flex items-center justify-between rounded-xl bg-gold p-4 text-gold-foreground">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-70">Recommended product</div>
                    <div className="mt-0.5 text-base font-extrabold">{product.name}</div>
                    <div className="text-xs">KES {product.price.toLocaleString()} · {product.unit}</div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2.5 text-xs font-bold text-forest-foreground transition hover:scale-105">
                    Buy now <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
