import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Handshake, Users, ShieldCheck, Briefcase, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/mqulima/AppLayout";

export const Route = createFileRoute("/partnerships")({
  head: () => ({
    meta: [
      { title: "Partnerships & Onboarding · Mqulima" },
      {
        name: "description",
        content: "Collaborate with Kenya's leading digital farming network. Onboard as a service provider or strategic partner.",
      },
    ],
  }),
  component: PartnershipsPage,
});

const partners = [
  { name: "Yara Kenya", role: "Input & Soil Science Partner", logo: "🌱", desc: "Co-developing crop nutrition plans and distributing premium fertilizer formulations." },
  { name: "Syngenta", role: "Crop Protection Partner", logo: "🧪", desc: "Providing safe agrochemicals and training on pest and disease control methods." },
  { name: "Equity Bank", role: "Financial Inclusion Partner", logo: "🏦", desc: "Enabling micro-credit, inputs financing, and direct wallet integrations for farmers." },
  { name: "Safaricom", role: "Connectivity & SMS Partner", logo: "📱", desc: "Powering USSD menus, SMS alerts, and M-Pesa automated paybill disbursements." },
  { name: "Kenya Seed Company", role: "Seed Genetics Partner", logo: "🌾", desc: "Supplying certified, climate-smart seed varieties optimized for different counties." },
  { name: "Uasin Gishu Cooperative", role: "Local Offtake Partner", logo: "🤝", desc: "Aggregating smallholder grains for bulk sale and processing." },
];

const collaborationModels = [
  {
    title: "Financial Institutions",
    description: "Provide agriculture loans, input financing, or insurance programs integrated directly into our checkouts.",
    benefits: ["Direct credit disbursement", "Lower default rates via input tracking", "Reach 5,000+ active farmers"],
  },
  {
    title: "Agri-Input Brands",
    description: "List certified fertilizers, seeds, and agrochemicals on our digital store and offer direct-to-farm deliveries.",
    benefits: ["Extended county distribution network", "Real-time inventory and sales insights", "Direct product training integration"],
  },
  {
    title: "Produce Offtakers",
    description: "Contract directly with farmer groups for bulk aggregation and crop supply chains.",
    benefits: ["Traceable supply paths", "Consistent supply volume", "Verified agricultural practices"],
  },
  {
    title: "County Governments & NGOs",
    description: "Deploy subsidy programs, training materials, or weather intelligence systems locally.",
    benefits: ["Targeted county disbursements", "Verifiable impact metrics", "Reduced delivery administration cost"],
  },
];

function PartnershipsPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "models" | "onboarding">("directory");
  
  // Onboarding Form State
  const [providerType, setProviderType] = useState("Veterinarian");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("Uasin Gishu");
  const [experience, setExperience] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !experience) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Application Submitted Successfully!", {
        description: "Our onboarding team will review your credentials and contact you within 3 business days.",
      });
      setName("");
      setEmail("");
      setPhone("");
      setExperience("");
      setDetails("");
      setSubmitting(false);
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="bg-[#FAF9F6] text-[#1A1A1A] min-h-screen font-sans">
        {/* Banner */}
        <section className="bg-gradient-to-br from-[#1A3D2F] to-[#2D6A4F] py-20 text-white text-left">
          <div className="container-px mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F5A623]">
              <Handshake className="h-4 w-4" /> Strategic Partnerships
            </span>
            <h1 className="mt-4 text-4xl font-extrabold md:text-5xl tracking-tight">
              Grow together with Mqulima.
            </h1>
            <p className="mt-3 max-w-xl text-white/80 text-sm leading-relaxed">
              We collaborate with input suppliers, financial institutions, offtakers, and local service providers to build a stronger digital agricultural ecosystem.
            </p>
          </div>
        </section>

        {/* Tab Controls */}
        <section className="border-b border-gray-200 bg-white sticky top-16 z-30 shadow-sm">
          <div className="container-px mx-auto max-w-7xl">
            <div className="flex gap-6 overflow-x-auto py-4 text-xs font-semibold uppercase tracking-wider scrollbar-none">
              {(["directory", "models", "onboarding"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-1 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? "border-[#2D6A4F] text-[#2D6A4F] font-extrabold"
                      : "border-transparent text-gray-500 hover:text-[#1A1A1A]"
                  }`}
                >
                  {tab === "directory" ? "Partner Directory" : tab === "models" ? "Collaboration Models" : "Provider Onboarding"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container-px mx-auto max-w-7xl text-left">
            
            {/* 1. Directory Tab */}
            {activeTab === "directory" && (
              <div>
                <div className="mb-10 max-w-2xl">
                  <h2 className="text-2xl font-extrabold text-[#1A3D2F]">Ecosystem Partners</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Meet the industry leaders, technology providers, and farmer cooperatives working with Mqulima to streamline agricultural logistics and intelligence.
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {partners.map((p) => (
                    <div key={p.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition duration-300">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#E8F5E9] text-2xl">
                          {p.logo}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
                            {p.name}
                            <span className="inline-block text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase">Verified</span>
                          </div>
                          <div className="text-[10px] font-semibold text-[#2D6A4F] uppercase tracking-wider">{p.role}</div>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-gray-600 leading-relaxed">{p.desc}</p>
                    </div>
                  ))}
                </div>

                {/* FAQ section */}
                <div className="mt-16 rounded-3xl border border-gray-200 bg-white p-8">
                  <h3 className="text-lg font-bold text-[#1A3D2F]">Partnership FAQs</h3>
                  <div className="mt-6 grid gap-6 md:grid-cols-2 text-xs">
                    <div>
                      <h4 className="font-extrabold text-[#1A1A1A]">How do we become a verified Mqulima partner?</h4>
                      <p className="mt-1.5 text-gray-600 leading-relaxed">
                        Institutions can apply via email at partners@mqulima.co.ke. We verify brand certifications, agricultural compliance, and trade licenses before listing.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#1A1A1A]">Can we integrate our APIs for input credit?</h4>
                      <p className="mt-1.5 text-gray-600 leading-relaxed">
                        Yes. We offer fully documented REST APIs for financial institutions to offer checkout loans, wallet services, and crop insurance policies to registered growers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Models Tab */}
            {activeTab === "models" && (
              <div>
                <div className="mb-10 max-w-2xl">
                  <h2 className="text-2xl font-extrabold text-[#1A3D2F]">How We Collaborate</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    We structure our collaborations around clear value creation, combining Mqulima's digital distribution network with specialized ecosystem capabilities.
                  </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  {collaborationModels.map((m) => (
                    <div key={m.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-extrabold text-[#1A3D2F] border-b border-gray-100 pb-3">{m.title}</h3>
                        <p className="mt-3 text-xs text-gray-600 leading-relaxed">{m.description}</p>
                        
                        <div className="mt-5 space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Collaboration Benefits:</div>
                          {m.benefits.map((b, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                              <Check className="h-4 w-4 text-[#2D6A4F] shrink-0" />
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setActiveTab("onboarding")}
                        className="mt-6 w-full flex items-center justify-center gap-1 rounded-xl border border-[#2D6A4F] py-2.5 text-xs font-bold text-[#2D6A4F] hover:bg-[#2D6A4F]/5 transition"
                      >
                        <span>Initiate Collaboration</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Onboarding Tab */}
            {activeTab === "onboarding" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
                {/* Onboarding info */}
                <div>
                  <h2 className="text-2xl font-extrabold text-[#1A3D2F]">Join as a Service Provider</h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Own a tractor, run a veterinary clinic, or consult as an agronomist? Partner with Mqulima to access a steady stream of bookings from farmers in your county.
                  </p>

                  <div className="mt-8 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#E8F5E9] text-[#2D6A4F]">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1A1A1A]">Verified Credentials</h4>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">We verify professional certification (e.g. KVB licensing for vets) to maintain high service standards.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#E8F5E9] text-[#2D6A4F]">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1A1A1A]">Steady Booking Stream</h4>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">Accept service requests directly on your mobile phone based on your geolocated availability.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#E8F5E9] text-[#2D6A4F]">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1A1A1A]">Guaranteed Payments</h4>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">Payments are processed instantly through M-Pesa disbursements as soon as service completion is confirmed.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Onboarding form */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md md:p-8">
                  <h3 className="text-lg font-bold text-[#1A3D2F] border-b border-gray-100 pb-3 mb-6">Service Provider Application</h3>
                  
                  <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Provider Specialty</span>
                        <select
                          value={providerType}
                          onChange={(e) => setProviderType(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                        >
                          <option value="Veterinarian">Veterinary Doctor (DVM)</option>
                          <option value="Agronomist">Agronomy Consultant</option>
                          <option value="Machinery Owner">Machinery Operator / Tractor Owner</option>
                          <option value="AI Specialist">Artificial Inseminator</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Dr. Jane Doe"
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</span>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="jane.doe@example.com"
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6D4F]"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone Number (M-Pesa registered)</span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 0712345678"
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Primary Operating County</span>
                        <select
                          value={county}
                          onChange={(e) => setCounty(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                        >
                          <option value="Uasin Gishu">Uasin Gishu County</option>
                          <option value="Trans Nzoia">Trans Nzoia County</option>
                          <option value="Nandi">Nandi County</option>
                          <option value="Nakuru">Nakuru County</option>
                          <option value="Nyandarua">Nyandarua County</option>
                          <option value="Kiambu">Kiambu County</option>
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Years of Experience</span>
                        <input
                          type="text"
                          required
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="e.g. 5 years"
                          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Certifications & Equipment Details</span>
                      <textarea
                        rows={3}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Mention registered licenses (e.g. KVB No.) or machinery capacity (e.g. 75HP Tractor with 3-disc plough)..."
                        className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-md hover:bg-[#1A5438] transition disabled:opacity-50 uppercase tracking-wider cursor-pointer"
                    >
                      {submitting ? "Submitting Application..." : "Submit Application"}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>
    </AppLayout>
  );
}
