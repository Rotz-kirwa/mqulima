import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Mqulima" },
      { name: "description", content: "Reach Mqulima — WhatsApp, phone, email or visit our Eldoret HQ." },
    ],
  }),
  component: Contact,
});

const faqs = [
  { q: "How fast is delivery?", a: "Same-day in 12 counties (Uasin Gishu, Nakuru, Kiambu and more). 1–2 days everywhere else in Kenya." },
  { q: "Do you accept M-Pesa?", a: "Yes — M-Pesa Express, Paybill and card payments are all supported at checkout." },
  { q: "Are vet visits really 24-hour response?", a: "Bookings made before 4pm are confirmed for same or next day. Emergencies are dispatched within hours." },
  { q: "How does soil testing work?", a: "We collect samples from your farm, lab-test them, then send a written report with crop-specific fertilizer prescriptions." },
  { q: "Can I order wholesale?", a: "Yes — orders above 10 units automatically get tiered pricing. For very large orders contact sales@mqulima.co.ke." },
  { q: "Is the AI Crop Doctor free?", a: "Yes, completely free for all registered Mqulima farmers." },
  { q: "Which counties do you serve?", a: "20+ counties and growing. Check coverage at checkout or call our hotline." },
  { q: "Do you offer agricultural insurance?", a: "Yes — we partner with leading insurers for crop and livestock cover. Ask any rep for details." },
  { q: "How do I earn loyalty points?", a: "1 point per KES 10 spent. Redeem for discounts, free deliveries or service credits." },
  { q: "Can I become a Mqulima agent?", a: "Absolutely. Visit our Careers page or WhatsApp us to join the agent network." },
];

function Contact() {
  return (
    <AppLayout>
      <section className="bg-gradient-to-br from-forest to-primary py-16 text-forest-foreground">
        <div className="container-px mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Get in touch</span>
          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">We're a WhatsApp away.</h1>
          <p className="mt-2 max-w-xl text-forest-foreground/80">Reach us 7 days a week, 6am to 8pm.</p>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: MessageCircle, label: "WhatsApp", value: "+254 711 222 333", href: "https://wa.me/254711222333" },
            { icon: Phone, label: "Hotline", value: "+254 711 222 333", href: "tel:+254711222333" },
            { icon: Mail, label: "Email", value: "hello@mqulima.co.ke", href: "mailto:hello@mqulima.co.ke" },
            { icon: MapPin, label: "Eldoret HQ", value: "Uganda Rd, opp. Eldoret Polytechnic", href: "#map" },
          ].map((c) => (
            <a key={c.label} href={c.href} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="mt-0.5 text-sm font-semibold text-forest">{c.value}</div>
              </div>
            </a>
          ))}
        </div>

        <div id="map" className="mt-10 overflow-hidden rounded-3xl border border-border shadow-card">
          <iframe
            title="Mqulima Eldoret HQ"
            src="https://www.openstreetmap.org/export/embed.html?bbox=35.2674,-0.5210,35.2974,-0.5010&layer=mapnik&marker=-0.511,35.2825"
            className="h-[360px] w-full"
            loading="lazy"
          />
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-extrabold text-forest md:text-4xl">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            {faqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-secondary/40">
      <div className="flex-1">
        <div className="font-bold text-forest">{q}</div>
        {open && <p className="mt-2 text-sm text-muted-foreground">{a}</p>}
      </div>
      <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
    </button>
  );
}
