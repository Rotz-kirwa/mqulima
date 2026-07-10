import { createFileRoute } from "@tanstack/react-router";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  CheckCircle2, 
  Sprout, 
  Users2, 
  ShoppingBag 
} from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/contact/MapEmbed";
import { FaqAccordion } from "@/components/contact/FaqAccordion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Mqulima" },
      {
        name: "description",
        content: "Get in touch with Kenya's premium digital farming network. Connect with our expert support team.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] text-[#0A1E0C] min-h-screen font-sans selection:bg-[#2D6A4F] selection:text-white relative overflow-hidden text-left">
        
        {/* ================= SECTION 1 — PREMIUM HERO (REDESIGNED GREEN THEME WITH ILLUSTRATION) ================= */}
        <section className="relative bg-gradient-to-b from-[#112E22] to-[#0A1E0C] text-white pt-24 pb-12 px-6 sm:px-12 border-b border-emerald-950/20 overflow-hidden">
          {/* Subtle leaves grid background pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
            style={{ 
              backgroundImage: "radial-gradient(white 2px, transparent 2px)", 
              backgroundSize: "24px 24px" 
            }} 
          />
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
          <div className="absolute bottom-[-100px] right-[-50px] w-[350px] h-[350px] bg-[#FAF9F5]/5 rounded-full blur-[90px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10 text-left flex flex-col items-start space-y-8">
            <span className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-300 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#F5A623] animate-pulse" />
              Contact Mqulima
            </span>
            
            <div className="space-y-4 text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black font-serif leading-[1.05] tracking-tight text-left">
                Let's Grow <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-450 to-[#FAF9F5] italic font-serif">Together</span>
              </h1>
              
              <p className="text-gray-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl font-medium text-left">
                Have a question, need support, or want to partner with Mqulima? Our team is here to help you every step of the way.
              </p>
            </div>

            <div className="pt-2 text-left">
              <button
                onClick={scrollToContact}
                className="group inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#E0951F] text-[#0A1E0C] font-extrabold text-xs sm:text-sm uppercase tracking-wider py-4 px-8 rounded-xl shadow-lg shadow-[#F5A623]/10 hover:shadow-xl hover:shadow-[#F5A623]/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                Contact Support
                <ArrowRight className="w-4 h-4 transition-transform duration-255 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2 — DUAL SPLIT INTERACTIVE CONSOLE (35/65 LAYOUT) ================= */}
        <section id="contact-section" className="py-14 px-6 sm:px-12 relative bg-[#FAFBF9] scroll-mt-16">
          <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-12 relative z-10 items-start">
            
            {/* Left Column (35%): Contact Information Card */}
            <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
              <div className="bg-white rounded-3xl border border-emerald-100 p-8 shadow-[0_10px_40px_-6px_rgba(45,106,79,0.06)] flex flex-col justify-between text-[#0A1E0C] relative group hover:shadow-[0_15px_50px_-6px_rgba(45,106,79,0.1)] transition-all duration-300">
                {/* Subtle detail card line */}
                <div className="absolute top-0 left-12 right-12 h-1 bg-gradient-to-r from-emerald-450 via-emerald-600 to-[#F5A623] rounded-b-full opacity-70" />
                
                <div className="space-y-8 relative z-10">
                  <div className="space-y-2">
                    <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-[2px] bg-emerald-600"></span> Channels
                    </span>
                    <h2 className="text-2xl font-bold font-serif text-[#0A1E0C] leading-tight">Direct Outlets</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Call Us */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all duration-250">
                        <Phone className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Call Us</h4>
                        <a href="tel:+254723346134" className="text-base font-bold text-[#0A1E0C] hover:text-emerald-700 transition-colors select-text">
                          +254 723 346 134
                        </a>
                        <p className="text-xs text-gray-500 font-medium">Monday – Friday, 8:00 AM – 6:00 PM (EAT)</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all duration-250">
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</h4>
                        <a href="mailto:hello@mqulima.com" className="text-base font-bold text-[#0A1E0C] hover:text-emerald-700 transition-colors select-text font-sans break-all">
                          hello@mqulima.com
                        </a>
                        <p className="text-xs text-gray-500 font-medium">Typical response within 2 hours</p>
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all duration-250">
                        <MessageSquare className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-2 text-left flex-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">WhatsApp Support</h4>
                        <p className="text-xs text-gray-500 font-medium leading-normal">Chat instantly with our support team</p>
                        <a 
                          href="https://wa.me/254723346134" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA56] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-250 cursor-pointer"
                        >
                          Start WhatsApp Chat
                        </a>
                      </div>
                    </div>

                    {/* Office */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-all duration-250">
                        <MapPin className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-1 text-left">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Office</h4>
                        <p className="text-base font-bold text-[#0A1E0C] select-text">
                          Junction, Eldoret–Iten Highway
                        </p>
                        <a 
                          href="https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center text-xs font-bold text-emerald-650 hover:text-emerald-800 underline transition-colors"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    </div>

                    {/* Social Platforms */}
                    <div className="pt-5 border-t border-emerald-100/50 mt-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 mb-3.5">Connect With Us</h4>
                      <div className="flex items-center gap-3">
                        {/* X / Twitter */}
                        <a 
                          href="https://x.com/_mqulima" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="h-10 w-10 rounded-xl bg-[#000000] text-white border border-transparent flex items-center justify-center hover:bg-neutral-800 transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                          title="Follow Mqulima on X"
                        >
                          <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>

                        {/* TikTok */}
                        <a 
                          href="https://tiktok.com/@_mqulima" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="h-10 w-10 rounded-xl bg-[#010101] text-white border border-transparent flex items-center justify-center hover:bg-neutral-900 transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                          title="Follow Mqulima on TikTok"
                        >
                          <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.17 2.27 1.99 3.73 2.3v3.91c-1.39-.01-2.76-.41-3.95-1.15-.71-.44-1.34-.99-1.84-1.65v7.2c-.07 1.83-.69 3.63-1.83 5.05-1.5 1.88-3.83 2.97-6.23 2.97-1.81.01-3.59-.57-5.06-1.65C1.19 19.98.24 18.06.05 16.03c-.26-2.82.97-5.63 3.19-7.35 1.62-1.25 3.66-1.89 5.71-1.78v4c-.75-.08-1.5.07-2.18.42-1.07.56-1.79 1.66-1.89 2.87-.14 1.55.76 3.05 2.19 3.63.81.33 1.7.35 2.52.05 1.09-.4 1.84-1.44 1.94-2.6.01-.22.01-6.73.01-15.26z"/>
                          </svg>
                        </a>

                        {/* LinkedIn */}
                        <a 
                          href="https://linkedin.com/company/mqulima-hub" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="h-10 w-10 rounded-xl bg-[#0077b5] text-white border border-transparent flex items-center justify-center hover:bg-[#005e8e] transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                          title="Follow Mqulima on LinkedIn"
                        >
                          <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Indicators Box */}
              <div className="bg-emerald-50/30 rounded-3xl border border-emerald-100/50 p-6 space-y-3.5">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Trust Indicators</h5>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Fast Response Time</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Dedicated Farmer Support</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Secure & Confidential</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (65%): Contact Form & Why Contact Cards */}
            <div className="lg:col-span-8 space-y-10">
              {/* The Form */}
              <ContactForm />

              {/* Why Contact Mqulima Section */}
              <div className="space-y-6 text-left">
                <h3 className="text-xl font-bold font-serif text-[#0A1E0C] flex items-center gap-2">
                  Why Contact Mqulima?
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Card 1 */}
                  <div className="bg-white border border-emerald-50/50 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(45,106,79,0.04)] hover:shadow-md hover:border-emerald-100 transition-all duration-300">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#0A1E0C] mb-1">Farming Support</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Helping farmers succeed every season.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white border border-emerald-50/50 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(45,106,79,0.04)] hover:shadow-md hover:border-emerald-100 transition-all duration-300">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                      <Users2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#0A1E0C] mb-1">Business Partnerships</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Work with us to transform agriculture.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white border border-emerald-50/50 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(45,106,79,0.04)] hover:shadow-md hover:border-emerald-100 transition-all duration-300">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#0A1E0C] mb-1">Marketplace Assistance</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Support for buyers and sellers using Mqulima.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================= SECTION 3 — INTERACTIVE MAP EMBED ================= */}
        <section className="w-full relative py-6 bg-white border-t border-b border-gray-100">
          <MapEmbed />
        </section>

        {/* ================= SECTION 4 — FAQ SECTION ================= */}
        <section className="relative z-10 max-w-5xl mx-auto py-14 px-6 bg-[#FAFBF9]">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50/50 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-700">
              Service Support
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#0A1E0C] tracking-tight">
              Service Support & Inquiries
            </h2>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed font-medium">
              Find answers to common issues and requests regarding Mqulima's marketplace, agrovet shop, AI diagnostics tools, and expert consultations.
            </p>
          </div>

          <FaqAccordion />
        </section>

        {/* ================= SECTION 5 — PREMIUM CTA BAND (REDESIGNED WITH SOFT CORNERS) ================= */}
        <section className="py-12 px-6 sm:px-12 bg-[#FAFBF9] border-t border-gray-100">
          <div className="max-w-5xl mx-auto bg-white border border-emerald-100 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden shadow-[0_10px_40px_-6px_rgba(45,106,79,0.05)]">
            <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: "radial-gradient(#0A1E0C 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-50/40 rounded-full blur-[90px] pointer-events-none animate-pulse" />
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black font-serif text-[#0A1E0C] tracking-tight leading-tight">
                Ready to optimize your <span className="text-emerald-750 italic font-serif">farm?</span>
              </h2>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-2">
                <a 
                  href="/shop" 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-4 px-8 rounded-xl transition-all duration-350 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="/about" 
                  className="w-full sm:w-auto bg-transparent border border-gray-250 hover:bg-gray-50 text-[#0A1E0C] font-bold text-xs sm:text-sm uppercase tracking-wider py-4 px-8 rounded-xl transition duration-300 cursor-pointer text-center"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
