import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ArrowRight, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { services, counties } from "@/lib/mqulima-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "On-Farm Services · Mqulima" },
      {
        name: "description",
        content:
          "Book vets, soil testing, silage shredding, AI, machinery rental and advisory — verified experts at your farm gate.",
      },
    ],
  }),
  component: ServicesPage,
});

function generateReference() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MQ-${suffix}`;
}

function ServicesPage() {
  const [selected, setSelected] = useState(services[0].id);
  const [step, setStep] = useState(1);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const svc = useMemo(() => services.find((s) => s.id === selected) ?? services[0], [selected]);

  const updateField = (label: string, value: string) => {
    setForm((prev) => ({ ...prev, [label]: value }));
  };

  const resetBooking = () => {
    setDone(null);
    setStep(1);
    setForm({});
  };

  const changeService = (id: string) => {
    setSelected(id);
    resetBooking();
  };

  const canProceed = () => {
    if (step === 1) {
      return svc.fields.every((f) => form[f]?.trim());
    }
    if (step === 2) {
      return form["County"] && form["Phone (for SMS confirmation)"];
    }
    return true;
  };

  function confirm() {
    const ref = generateReference();
    setDone(ref);
    setStep(1);
    toast.success("Booking request received", {
      description: `Ref ${ref}. A confirmation SMS will be sent once verified.`,
    });
  }

  return (
    <AppLayout>
      <section className="bg-gradient-to-br from-forest to-primary py-16 text-forest-foreground">
        <div className="container-px mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            Book a Service
          </span>
          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">Experts at your farm gate.</h1>
          <p className="mt-2 max-w-xl text-forest-foreground/80">
            Pick a service. Tell us about your farm. We'll confirm by SMS within minutes.
          </p>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          <aside className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => changeService(s.id)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${selected === s.id ? "border-primary bg-primary/5 shadow-card" : "border-border bg-card hover:border-primary/40"}`}
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-2xl">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-forest">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.price}</div>
                </div>
                {selected === s.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </aside>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-10">
            {done ? (
              <div className="grid place-items-center py-10 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-2xl font-extrabold text-forest">
                  Booking request received
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reference <span className="font-mono font-bold text-forest">{done}</span> has been
                  created.
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  This is a demo booking. In production, an agent will confirm by SMS.
                </p>
                <Tracker />
                <button
                  onClick={resetBooking}
                  className="mt-6 text-sm font-semibold text-blue hover:underline"
                >
                  Book another service
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-forest md:text-3xl">{svc.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{svc.description}</p>
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground md:block">
                    Step {step} of 3
                  </div>
                </div>

                <div className="mt-4 flex gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-secondary"}`}
                    />
                  ))}
                </div>

                <div className="mt-7 space-y-4">
                  {step === 1 &&
                    svc.fields.map((f) => (
                      <Field
                        key={f}
                        label={f}
                        value={form[f] ?? ""}
                        onChange={(v) => updateField(f, v)}
                      />
                    ))}
                  {step === 2 && (
                    <>
                      <Select
                        label="County"
                        options={counties}
                        value={form["County"] ?? ""}
                        onChange={(v) => updateField("County", v)}
                      />
                      <Field
                        label="Phone (for SMS confirmation)"
                        placeholder="07XX XXX XXX"
                        value={form["Phone (for SMS confirmation)"] ?? ""}
                        onChange={(v) => updateField("Phone (for SMS confirmation)", v)}
                      />
                      <Field
                        label="Nearest landmark"
                        placeholder="e.g. Eldoret Polytechnic"
                        value={form["Nearest landmark"] ?? ""}
                        onChange={(v) => updateField("Nearest landmark", v)}
                      />
                    </>
                  )}
                  {step === 3 && (
                    <div className="rounded-2xl bg-secondary/60 p-5 text-sm">
                      <div className="font-bold text-forest">Review your booking</div>
                      <ul className="mt-3 space-y-1.5 text-muted-foreground">
                        <li>
                          • Service:{" "}
                          <span className="font-semibold text-foreground">{svc.name}</span>
                        </li>
                        <li>
                          • Estimated price:{" "}
                          <span className="font-semibold text-foreground">{svc.price}</span>
                        </li>
                        {svc.fields.map((f) => (
                          <li key={f}>
                            • {f}:{" "}
                            <span className="font-semibold text-foreground">{form[f] || "—"}</span>
                          </li>
                        ))}
                        <li>
                          • County:{" "}
                          <span className="font-semibold text-foreground">
                            {form["County"] || "—"}
                          </span>
                        </li>
                        <li>
                          • Phone:{" "}
                          <span className="font-semibold text-foreground">
                            {form["Phone (for SMS confirmation)"] || "—"}
                          </span>
                        </li>
                        <li>• Confirmation by SMS in &lt; 5 min</li>
                        <li>• Pay after service is completed</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <button
                    disabled={step === 1}
                    onClick={() => setStep(step - 1)}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    ← Back
                  </button>
                  {step < 3 ? (
                    <button
                      disabled={!canProceed()}
                      onClick={() => setStep(step + 1)}
                      className="inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 text-sm font-bold text-blue-foreground shadow-blue/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={confirm}
                      className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-gold-foreground transition hover:scale-105"
                    >
                      <Calendar className="h-4 w-4" /> Confirm booking
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Tracker() {
  const stages = ["Pending", "Confirmed", "In Progress", "Done"];
  return (
    <div className="mt-6 w-full max-w-md">
      <div className="flex items-center justify-between">
        {stages.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div
              className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${i <= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              {i + 1}
            </div>
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
