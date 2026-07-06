import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Clock, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
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
  return (
    <AppLayout>
      <div className="bg-[#FAF9F5] text-[#0A1E0C] min-h-screen font-sans selection:bg-[#4EFE98] selection:text-[#060E08] relative overflow-hidden text-left">
        
        {/* ================= SECTION 1 — PREMIUM HERO (OBSIDIAN DARK) ================= */}
        <section className="relative bg-[#060E08] text-white pt-32 pb-20 px-6 sm:px-12 border-b border-[#2D6A4F]/20">
          {/* Decorative Grid & Glow Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: "radial-gradient(white 2px, transparent 2px)", backgroundSize: "24px 24px" }} 
          />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#4EFE98]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 border border-[#4EFE98]/30 bg-[#4EFE98]/5 px-4.5 py-1.5 rounded-none text-[10px] font-black uppercase tracking-[0.25em] text-[#4EFE98] shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#F5A623]" />
              Get In Touch
            </span>
            
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black font-serif leading-[1.02] tracking-tight text-white">
              Let's grow <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] via-[#E0951F] to-rose-450 italic font-serif">something real.</span>
            </h1>
            
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-3xl font-medium">
              Whether you are a local smallholder cooperative, logistics service operator, or retail distributor, we want to build a reliable supply pathway with you.
            </p>
          </div>
        </section>

        {/* ================= SECTION 2 — HYBRID GRID SPLIT (LIGHT BACKGROUND) ================= */}
        <section className="py-24 px-6 sm:px-12 bg-[#FAF9F5] border-b border-gray-200 relative">
          <div className="max-w-7xl mx-auto grid gap-16 lg:grid-cols-12 relative z-10 items-start">
             
             {/* Left Column: Direct Channels Console (Obsidian Dark Mode) */}
             <div className="lg:col-span-5 bg-[#060E08] border-2 border-[#0A1E0C] p-8 sm:p-10 flex flex-col justify-between text-white shadow-[8px_8px_0px_#0A1E0C] relative group">
               {/* Decorative subtle grid */}
               <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(white 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }} />
               
               <div className="space-y-8 relative z-10">
                 <div className="space-y-3">
                   <span className="text-[#F5A623] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="w-6 h-[2px] bg-[#F5A623]"></span> Channels
                   </span>
                   <h2 className="text-3xl font-black font-serif text-white leading-tight">Direct Outlets</h2>
                   <p className="text-xs text-gray-400 leading-relaxed font-medium">
                     Connect directly via phone, email, or visit our central coordination depot.
                   </p>
                 </div>

                 <div className="space-y-4">
                   {/* Talk to Us Card */}
                   <a 
                     href="tel:+254723346134" 
                     className="flex items-start gap-4 bg-[#0B130E] border border-gray-800 p-5 hover:border-[#4EFE98] transition-all duration-300 group/item cursor-pointer"
                   >
                     <div className="grid h-10 w-10 shrink-0 place-items-center border border-gray-800 bg-[#060E08] text-[#4EFE98] group-hover/item:bg-[#4EFE98] group-hover/item:text-[#060E08] transition-colors duration-300">
                       <Phone className="h-4.5 w-4.5" />
                     </div>
                     <div className="space-y-0.5">
                       <div className="text-[9px] font-black uppercase tracking-widest text-[#4EFE98]">Talk to Us</div>
                       <div className="text-base font-black text-white select-text">+254 723 346 134</div>
                       <div className="text-[10px] text-gray-400 font-medium">Mon–Fri, 8AM–6PM EAT</div>
                     </div>
                   </a>

                   {/* Email Us Card */}
                   <a 
                     href="mailto:Mqulima001@gmail.com" 
                     className="flex items-start gap-4 bg-[#0B130E] border border-gray-800 p-5 hover:border-[#F5A623] transition-all duration-300 group/item cursor-pointer"
                   >
                     <div className="grid h-10 w-10 shrink-0 place-items-center border border-gray-800 bg-[#060E08] text-[#F5A623] group-hover/item:bg-[#F5A623] group-hover/item:text-[#060E08] transition-colors duration-300">
                       <Mail className="h-4.5 w-4.5" />
                     </div>
                     <div className="space-y-0.5">
                       <div className="text-[9px] font-black uppercase tracking-widest text-[#F5A623]">Email Us</div>
                       <div className="text-base font-black text-white select-text font-sans">Mqulima001@gmail.com</div>
                       <div className="text-[10px] text-gray-400 font-medium">Response within 12 hours</div>
                     </div>
                   </a>

                   {/* Visit Us Card */}
                   <a 
                     href="https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="flex items-start gap-4 bg-[#0B130E] border border-gray-800 p-5 hover:border-cyan-400 transition-all duration-300 group/item cursor-pointer"
                   >
                     <div className="grid h-10 w-10 shrink-0 place-items-center border border-gray-800 bg-[#060E08] text-cyan-400 group-hover/item:bg-cyan-400 group-hover/item:text-[#060E08] transition-colors duration-300">
                       <MapPin className="h-4.5 w-4.5" />
                     </div>
                     <div className="space-y-0.5">
                       <div className="text-[9px] font-black uppercase tracking-widest text-cyan-450">Coordination Office</div>
                       <div className="text-base font-black text-white select-text">Junction, Eldoret Iten Highway</div>
                       <div className="text-[10px] text-gray-400 font-medium">Click to view on map</div>
                     </div>
                   </a>
                 </div>
               </div>

               {/* Active Indicators */}
               <div className="pt-6 border-t border-gray-800 mt-8 relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
                 <span className="flex items-center gap-1.5 text-[#4EFE98]">
                   <span className="h-1.5 w-1.5 bg-[#4EFE98] rounded-full animate-pulse" />
                   Active extension
                 </span>
                 <span>•</span>
                 <span className="flex items-center gap-1.5 text-[#F5A623]">
                   <span className="h-1.5 w-1.5 bg-[#F5A623] rounded-full" />
                   Vetted logistics
                 </span>
               </div>
             </div>

             {/* Right Column: Form Container */}
             <div className="lg:col-span-7 relative">
                <ContactForm />
             </div>
          </div>
        </section>

        {/* ================= SECTION 3 — INTERACTIVE MAP EMBED ================= */}
        <section className="w-full relative">
          <MapEmbed />
        </section>

        {/* ================= SECTION 4 — KNOWLEDGE BASE / FAQ ================= */}
        <section className="relative z-10 max-w-5xl mx-auto py-28 px-6 bg-[#FAF9F5]">
          <div className="text-center max-w-xl mx-auto mb-20 space-y-4">
            <span className="inline-flex items-center gap-2 border border-[#2D6A4F]/20 bg-[#2D6A4F]/5 px-4.5 py-1.5 rounded-none text-[10px] font-black uppercase tracking-[0.25em] text-[#2D6A4F]">
              Knowledge Base
            </span>
            <h2 className="text-4xl sm:text-5xl font-black font-serif text-[#0A1E0C] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
              Understand how our catalog verification, ordering routes, and support hours operate.
            </p>
          </div>

          <FaqAccordion />
        </section>

        {/* ================= SECTION 5 — PREMIUM CTA BAND (OBSIDIAN DARK) ================= */}
        <section className="py-20 px-6 sm:px-12 bg-[#060E08] border-t border-[#2D6A4F]/20">
          <div className="max-w-5xl mx-auto bg-[#060E08] border-2 border-[#4EFE98] p-10 sm:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Glowing accents */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "radial-gradient(white 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#4EFE98]/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl sm:text-5xl font-black font-serif text-white tracking-tight leading-tight">
                Ready to optimize your <span className="text-[#F5A623] italic font-serif">farm?</span>
              </h2>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
                <a 
                  href="/shop" 
                  className="w-full sm:w-auto bg-[#F5A623] hover:bg-[#E0951F] text-[#0A1E0C] font-black text-xs uppercase tracking-widest py-4 px-8 rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(245,166,35,0.3)] border border-[#060E08]"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="/about" 
                  className="w-full sm:w-auto bg-transparent border border-white/20 hover:border-white text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-none transition duration-300 cursor-pointer"
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
