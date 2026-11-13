import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { ShieldCheck, FileText, Mail, Phone, MapPin, Clock, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Mqulima Agro Systems" },
      {
        name: "description",
        content:
          "Official Privacy Policy for Mqulima web platform and Mqulima Android mobile application, compliant with the Kenya Data Protection Act, 2019.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("priv-1");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const navItems = [
    { id: "priv-1", title: "1. Scope & Data Controller" },
    { id: "priv-2", title: "2. Information We Collect" },
    { id: "priv-3", title: "3. Mobile App Permissions" },
    { id: "priv-4", title: "4. How We Use Information" },
    { id: "priv-5", title: "5. Third-Party Processors & Sharing" },
    { id: "priv-6", title: "6. Retention & Transaction Records" },
    { id: "priv-7", title: "7. Account Deletion & Your Rights" },
    { id: "priv-8", title: "8. Data Security & Children" },
    { id: "priv-9", title: "9. Contact & ODPC Escalation" },
  ];

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] min-h-screen font-sans text-[#0F291E] text-left selection:bg-[#E5F5D0] selection:text-[#35610D]">
        <section className="bg-[#0F291E] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#85CC14]/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#85CC14] border border-[#85CC14]/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Data Protection & Privacy
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-['Outfit',sans-serif]">
                MQULIMA AGRO SYSTEMS <br />
                <span className="text-[#85CC14]">PRIVACY POLICY</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 pt-2 font-medium">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-md">
                  <Clock className="h-3.5 w-3.5 text-[#85CC14]" />
                  Last updated: 13 November 2026
                </span>
                <span>•</span>
                <span>Applies to www.mqulima.com &amp; Mqulima Android App (com.mqulima.app)</span>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-28 bg-white border border-slate-200/90 rounded-[24px] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileText className="h-4 w-4 text-[#16A34A]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F291E]">Table of Contents</h3>
                </div>
                <nav className="space-y-1 text-xs">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors ${
                        activeSection === item.id
                          ? "bg-[#E5F5D0] text-[#245B35] font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <main className="lg:col-span-8 space-y-8">
              <section id="priv-1" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">1. Scope &amp; Data Controller</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Mqulima Agro Systems (&quot;Mqulima&quot;, &quot;we&quot;, &quot;us&quot;) operates the web platform at{" "}
                  <strong>https://www.mqulima.com</strong> and the Mqulima mobile application (<strong>com.mqulima.app</strong>). This Privacy Policy describes what personal data we collect, how it is used, how it is protected, and how you can exercise your privacy rights under the Kenya Data Protection Act, 2019.
                </p>
              </section>

              <section id="priv-2" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">2. Information We Collect</h2>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li><strong>Account &amp; Profile Details:</strong> Full name, email address, phone number, county, sub-county/town, delivery address, and hashed password credentials.</li>
                  <li><strong>AgroShop Orders &amp; Payments:</strong> Purchased products, quantities, delivery notes, M-Pesa phone number/receipt references, and Paystack transaction references. Mqulima does not store card PAN numbers or M-Pesa PINs.</li>
                  <li><strong>Crop Doctor &amp; AI Assistant Inputs:</strong> Farm and crop photos you capture or select, symptom descriptions, and agronomic chat prompts submitted for AI-assisted crop diagnosis.</li>
                  <li><strong>Community Forum &amp; Service Bookings:</strong> Posts, comments, agricultural marketplace listings, direct messages, and requested agricultural services (e.g., soil testing, veterinary care, installation).</li>
                  <li><strong>Technical &amp; Offline Cache Data:</strong> Authentication session tokens (stored in encrypted device SecureStore on Android), local cart/preferences, and basic diagnostic error logs.</li>
                </ul>
              </section>

              <section id="priv-3" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">3. Mobile App Permissions</h2>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li><strong>Camera &amp; Photos (Optional):</strong> Requested only when you upload crop images in Crop Doctor or attach photos in Community Forum posts.</li>
                  <li><strong>Approximate &amp; Precise Location (Optional):</strong> Requested only to detect your Kenyan county for localized microclimate weather forecasts, spray-window guidance, and delivery estimates.</li>
                  <li><strong>Disabled Permissions:</strong> Microphone recording (<code>RECORD_AUDIO</code>) and video library permissions (<code>READ_MEDIA_VIDEO</code>) are explicitly blocked in our Android manifest.</li>
                </ul>
              </section>

              <section id="priv-4" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">4. How We Use Information</h2>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>Authenticate your account, enforce security rate limits, and dispatch one-time recovery codes to your verified email and phone.</li>
                  <li>Process AgroShop orders, initiate and verify M-Pesa STK Push and Paystack payments, and coordinate delivery across Kenya.</li>
                  <li>Deliver AI crop diagnosis responses, KAMIS market price insights, and county weather forecasts.</li>
                  <li>Match requested agricultural services with vetted service providers and respond to customer support requests.</li>
                </ul>
              </section>

              <section id="priv-5" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">5. Third-Party Processors &amp; Sharing</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  We never sell your personal data. We share necessary data only with vetted infrastructure and fulfilment partners under strict confidentiality:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li><strong>Payment Gateways:</strong> Safaricom Daraja (M-Pesa) and Paystack for payment processing and transaction verification.</li>
                  <li><strong>Messaging &amp; Notifications:</strong> Africa&apos;s Talking (SMS) and transactional email providers for order updates and password recovery.</li>
                  <li><strong>Cloud Media &amp; AI:</strong> Cloudflare R2/CDN for media storage and Google Gemini API for Crop Doctor image/text analysis.</li>
                  <li><strong>Fulfilment Partners:</strong> Verified agrodealers and service professionals strictly as required to complete your order or service booking.</li>
                </ul>
              </section>

              <section id="priv-6" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">6. Data Retention &amp; Transaction Records</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Active profile data is retained while your account remains open. When you delete your account, personal profile identifiers (name, email, phone, national ID, address, avatar, and authentication credentials) are anonymized and all active tokens/sessions are immediately revoked. Statutory accounting, invoice, and payment ledger records (such as order IDs, amounts, dates, and payment references) are retained for at least 7 years as required under Kenyan tax and commercial law.
                </p>
              </section>

              <section id="priv-7" className="bg-[#FAF8F0] border border-[#C49A45]/40 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-[#245B35]" />
                  <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">7. Account Deletion &amp; Your Privacy Rights</h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  You have the right to access, correct, or permanently delete your account data at any time:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li><strong>In the Mqulima Android App:</strong> Open <strong>More -&gt; My Account -&gt; Delete Account</strong> to permanently revoke all sessions and anonymize your personal data immediately.</li>
                  <li><strong>By Email Request:</strong> Email <a href="mailto:mqulima@mqulima.com" className="text-[#245B35] font-bold hover:underline">mqulima@mqulima.com</a> from your registered email address with the subject &quot;Account Deletion Request&quot;; requests are completed within 7 business days.</li>
                </ul>
              </section>

              <section id="priv-8" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">8. Data Security &amp; Children&apos;s Privacy</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  All API communications are encrypted via HTTPS/TLS, passwords are hashed using adaptive bcrypt, and mobile session credentials are stored in Android hardware-backed SecureStore. Mqulima is not directed to individuals under 18 years of age, and we do not knowingly collect data from children.
                </p>
              </section>

              <section id="priv-9" className="bg-[#0F291E] text-white rounded-[28px] p-6 sm:p-8 shadow-xl space-y-6">
                <div className="space-y-2">
                  <span className="inline-block rounded-full bg-[#85CC14]/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#85CC14]">
                    Privacy Inquiries
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif]">9. Contact &amp; Regulator Information</h2>
                  <p className="text-xs sm:text-sm text-white/80">
                    For privacy inquiries, data access requests, or complaints (including escalation rights to the Office of the Data Protection Commissioner in Kenya), contact us at:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5">
                    <Mail className="h-4 w-4 text-[#85CC14]" />
                    <div className="font-bold">Privacy Contact Email</div>
                    <a href="mailto:mqulima@mqulima.com" className="text-white/80 hover:text-white hover:underline block truncate">
                      mqulima@mqulima.com
                    </a>
                  </div>

                  <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5">
                    <Phone className="h-4 w-4 text-[#85CC14]" />
                    <div className="font-bold">Phone / WhatsApp</div>
                    <a href="tel:+254723346134" className="text-white/80 hover:text-white hover:underline block">
                      +254 723 346 134
                    </a>
                  </div>

                  <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5">
                    <MapPin className="h-4 w-4 text-[#85CC14]" />
                    <div className="font-bold">Physical Address</div>
                    <div className="text-white/80 leading-tight">
                      Junction, along Eldoret–Iten Highway, Kenya
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

