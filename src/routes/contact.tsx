import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ChevronDown,
  Send,
  CheckCircle,
  Search,
  HelpCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { counties } from "@/lib/mqulima-data";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us · Mqulima Support" },
      {
        name: "description",
        content:
          "Reach out to Mqulima Hub. Connect via WhatsApp, phone, email, or visit our Eldoret HQ. Get expert agricultural assistance.",
      },
    ],
  }),
  component: Contact,
});

const faqs = [
  {
    q: "How fast is delivery?",
    a: "Same-day in 12 counties (Uasin Gishu, Nakuru, Kiambu and more). 1–2 days everywhere else in Kenya.",
  },
  {
    q: "Do you accept M-Pesa?",
    a: "Yes — M-Pesa Express, Paybill and card payments are all supported at checkout.",
  },
  {
    q: "Are vet visits really 24-hour response?",
    a: "Bookings made before 4pm are confirmed for same or next day. Emergencies are dispatched within hours.",
  },
  {
    q: "How does soil testing work?",
    a: "We collect samples from your farm, lab-test them, then send a written report with crop-specific fertilizer prescriptions.",
  },
  {
    q: "Can I order wholesale?",
    a: "Yes — orders above 10 units automatically get tiered pricing. For very large orders contact sales@mqulima.co.ke.",
  },
  {
    q: "Is the AI Crop Doctor free?",
    a: "Yes, completely free for all registered Mqulima farmers.",
  },
  {
    q: "Which counties do you serve?",
    a: "20+ counties and growing. Check coverage at checkout or call our hotline.",
  },
  {
    q: "Do you offer agricultural insurance?",
    a: "Yes — we partner with leading insurers for crop and livestock cover. Ask any rep for details.",
  },
  {
    q: "How do I earn loyalty points?",
    a: "1 point per KES 10 spent. Redeem for discounts, free deliveries or service credits.",
  },
  {
    q: "Can I become a Mqulima agent?",
    a: "Absolutely. Visit our Careers page or WhatsApp us to join the agent network.",
  },
];

function Contact() {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [inquiryType, setInquiryType] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // FAQ Search state
  const [faqSearch, setFaqSearch] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return faqs;
    const query = faqSearch.toLowerCase();
    return faqs.filter(
      (f) => f.q.toLowerCase().includes(query) || f.a.toLowerCase().includes(query),
    );
  }, [faqSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    // TODO: replace with real API call (e.g. createServerFn or email service)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      toast.success("Demo message captured. A representative would normally contact you shortly.");
      setName("");
      setEmail("");
      setPhone("");
      setCounty("");
      setMessage("");
    }, 1200);
  };

  return (
    <AppLayout>
      <div className="bg-background text-foreground">
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-forest to-primary py-16 text-forest-foreground text-center md:text-left">
          <div className="container-px mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
              Get in touch
            </span>
            <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">We're a WhatsApp away.</h1>
            <p className="mt-2 max-w-xl text-forest-foreground/80">
              Connect with agronomy experts, order agents, or customer service representatives 7
              days a week.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="container-px mx-auto max-w-7xl py-12">
          {/* Quick Channels */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MessageCircle,
                label: "WhatsApp Chat",
                value: "+254 723346134",
                href: "https://wa.me/254723346134",
                color: "text-[#25D366] bg-[#25D366]/10",
              },
              {
                icon: Phone,
                label: "Hotline Support",
                value: "+254 723346134",
                href: "tel:+254723346134",
                color: "text-blue bg-blue/10",
              },
              {
                icon: Mail,
                label: "Email Sales",
                value: "hello@mqulima.co.ke",
                href: "mailto:hello@mqulima.co.ke",
                color: "text-primary bg-primary/10",
              },
              {
                icon: MapPin,
                label: "Eldoret HQ",
                value: "Uganda Rd, opp. Poly",
                href: "#map",
                color: "text-gold bg-gold/10",
              },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-elegant transition hover:-translate-y-1 hover:border-primary/40"
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.color} transition-colors group-hover:bg-primary group-hover:text-primary-foreground`}
                >
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {c.label}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">{c.value}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Form & Map Section */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Interactive Ticket Form */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant md:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">Send a message</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We typically reply within 15 minutes.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Agents online
                </div>
              </div>

              {success ? (
                <div className="py-12 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    Thank you, message received!
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your support ticket has been registered. Reference: MQ-DEMO-
                    {Date.now().toString(36).toUpperCase().slice(-4)}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    (Demo mode — no backend submission occurred.)
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-6 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary transition"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        County
                      </label>
                      <select
                        value={county}
                        onChange={(e) => setCounty(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                      >
                        <option value="">Select County</option>
                        {counties.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Inquiry Type
                    </label>
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order Status">Order Status / Delivery</option>
                      <option value="Soil Testing">Soil Testing Booking</option>
                      <option value="Vet Service">Vet Visit Request</option>
                      <option value="Agronomy Advice">Agronomy Advice</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Message *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="Tell us what you need help with..."
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-xs font-bold text-gold-foreground shadow-gold hover:scale-[1.01] transition-transform disabled:opacity-70"
                  >
                    {loading ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Send Ticket
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Map & Office Address */}
            <div className="flex flex-col gap-6">
              <div
                id="map"
                className="overflow-hidden rounded-3xl border border-border shadow-card flex-1 min-h-[300px]"
              >
                <iframe
                  title="Mqulima Eldoret HQ"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=35.2674,-0.5210,35.2974,-0.5010&layer=mapnik&marker=-0.511,35.2825"
                  className="h-full w-full border-none"
                  loading="lazy"
                />
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Physical Office Headquarters
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uganda Highway Road, Opposite Eldoret Polytechnic, Eldoret, Kenya
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive FAQ Search Finder */}
          <div className="mt-20">
            <div className="text-center">
              <HelpCircle className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-2 text-3xl font-extrabold text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Instant answers to common customer questions.
              </p>
            </div>

            {/* Finder Search Box */}
            <div className="mx-auto mt-6 flex max-w-lg items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-elegant">
              <Search className="h-4.5 w-4.5 text-muted-foreground" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search FAQs (e.g. M-Pesa, delivery...)"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {faqSearch && (
                <button
                  onClick={() => setFaqSearch("")}
                  className="text-muted-foreground hover:text-foreground text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-8 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No FAQs matching your search query.
                </div>
              ) : (
                filteredFaqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)
              )}
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-secondary/40"
      >
        <span className="font-bold text-foreground text-sm">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed animate-fade-in">
          {a}
        </div>
      )}
    </div>
  );
}
