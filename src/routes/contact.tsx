import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/contact/MapEmbed";
import { FaqAccordion } from "@/components/contact/FaqAccordion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us · Mqulima" },
      {
        name: "description",
        content: "Get in touch with Kenya's premium digital farming network. Connect with our expert support team.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  // Stagger animation variants for headline words
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo
      },
    },
  };

  const channelCards = [
    {
      title: "Talk to Us",
      value: "+254 723 346 134",
      detail: "Mon–Fri, 8AM–6PM EAT",
      icon: Phone,
      href: "tel:+254723346134",
    },
    {
      title: "Email Us",
      value: "Mqulima001@gmail.com",
      detail: "Quick response guarantee",
      icon: Mail,
      href: "mailto:Mqulima001@gmail.com",
    },
    {
      title: "Visit Us",
      value: "Junction, along Eldoret Iten Highway",
      detail: "Click to view location",
      icon: MapPin,
      href: "https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway",
    },
  ];

  return (
    <AppLayout>
      {/* Main Page Shell - Light Cream Background */}
      <div className="bg-background text-[#1A1A1A] min-h-screen font-sans relative overflow-hidden select-none">
        
        {/* Topographic Line-Map Background Texture (Subtle on Light Theme) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="topo-pattern" width="160" height="160" patternUnits="userSpaceOnUse">
                <path d="M10 20 Q 30 10 50 40 T 100 30 T 150 45" fill="none" stroke="#2D6A4F" strokeWidth="1.2"/>
                <path d="M0 60 Q 40 85 80 50 T 160 80" fill="none" stroke="#2D6A4F" strokeWidth="1.2"/>
                <path d="M20 100 Q 60 70 100 115 T 160 90" fill="none" stroke="#2D6A4F" strokeWidth="1.2"/>
                <path d="M0 135 Q 50 155 100 130 T 160 145" fill="none" stroke="#2D6A4F" strokeWidth="1.2"/>
                <path d="M40 0 Q 70 30 110 10 T 160 20" fill="none" stroke="#2D6A4F" strokeWidth="1.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo-pattern)" />
          </svg>
        </div>

        {/* SECTION 1 — HERO (Forest Green Gradient Banner matching other routes) */}
        <section className="relative min-h-[45vh] md:min-h-[50vh] flex flex-col justify-center items-center text-center px-6 py-10 md:py-14 z-10 bg-gradient-to-br from-forest to-primary text-white border-b border-[#1E3A2F]/20">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Eyebrow */}
            <motion.span
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, letterSpacing: "0.22em" }}
              transition={{ duration: 0.8 }}
              className="text-[10px] md:text-xs font-black uppercase text-[#F5A623] tracking-[0.22em] mb-2 md:mb-4"
            >
              GET IN TOUCH
            </motion.span>

            {/* Headline Display Staggered */}
            <motion.h1
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-[32px] md:text-[56px] font-normal leading-[1.05] tracking-tight text-white select-text"
              style={{ fontFamily: "'DM Serif Display', 'Playfair Display', serif" }}
            >
              <div className="block overflow-hidden pb-1">
                <motion.span variants={wordVariants} className="inline-block mr-3">Let's</motion.span>
                <motion.span variants={wordVariants} className="inline-block mr-3">Grow</motion.span>
              </div>
              <div className="block overflow-hidden pb-2 text-[#F5A623]">
                <motion.span variants={wordVariants} className="inline-block mr-3">Something</motion.span>
                <motion.span variants={wordVariants} className="inline-block">Real.</motion.span>
              </div>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-3 md:mt-6 text-xs md:text-base text-white/80 max-w-xl leading-relaxed select-text"
            >
              Whether you're a farmer, cooperative, investor, or partner — we want to hear from you. Mqulima is built on relationships.
            </motion.p>

            {/* Scroll Down CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-6 md:mt-10 flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={() => {
                const element = document.getElementById("contact-content");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-widest text-[#F5A623] hover:text-white transition-colors duration-200">
                Tell us what you need
              </span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-[#F5A623]"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2 — CONTACT SPLIT */}
        <section id="contact-content" className="relative z-10 max-w-7xl mx-auto py-24 px-6 scroll-mt-20">
          <div className="grid gap-12 lg:grid-cols-[4fr_6fr]">
            
            {/* Left Column - Cards & Trust Signals */}
            <div className="space-y-8 flex flex-col justify-between text-left">
              <div className="space-y-6">
                <div className="max-w-md">
                  <span className="text-[10px] font-black uppercase text-[#2D6A4F] tracking-widest">CHANNELS</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] mt-1">Direct Outlets</h2>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Connect directly via phone, email, or schedule a physical visitation at our offices.
                  </p>
                </div>

                <div className="space-y-4">
                  {channelCards.map((card, idx) => (
                    <motion.a
                      key={card.title}
                      href={card.href}
                      target={card.title === "Visit Us" ? "_blank" : undefined}
                      rel={card.title === "Visit Us" ? "noopener noreferrer" : undefined}
                      initial={{ opacity: 0, x: -15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                      className="flex items-start gap-4 bg-white border border-gray-200 hover:border-[#2D6A4F] rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer"
                      style={{ borderLeft: "3px solid #2D6A4F" }}
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors duration-200">
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {card.title}
                        </div>
                        <div className="mt-0.5 text-base font-extrabold text-[#1A1A1A] select-text">
                          {card.value}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {card.detail}
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Trust Signal Row */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-500">
                  <span className="text-[#2D6A4F]">✓ 500+ Farmers Served</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[#2D6A4F]">✓ Verified Cooperative Partners</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[#2D6A4F]">✓ Secure Data</span>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <ContactForm />
            </motion.div>
          </div>
        </section>

        {/* SECTION 3 — EMBEDDED MAP */}
        <section className="w-full">
          <MapEmbed />
        </section>

        {/* SECTION 4 — FAQ ACCORDION */}
        <section className="relative z-10 max-w-7xl mx-auto py-24 px-6 border-t border-gray-200">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase text-[#2D6A4F] tracking-[0.2em]">KNOWLEDGE BASE</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-[#1A1A1A]" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', serif" }}>
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Get immediate details on listing products, coverage areas, and security.
            </p>
          </div>

          <FaqAccordion />
        </section>

        {/* SECTION 5 — FOOTER CTA BAND */}
        <section className="w-full relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="w-full bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] py-20 px-6 text-center border-t border-[#1E3A2F]"
          >
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-normal text-[#F0EDE6] tracking-tight leading-none" style={{ fontFamily: "'DM Serif Display', 'Playfair Display', serif" }}>
                Ready to transform your farm?
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="/shop"
                  className="w-full sm:w-auto bg-[#F5A623] hover:bg-[#E0951F] text-[#0A0F0D] font-extrabold text-sm py-3.5 px-8 rounded-xl shadow-lg transition duration-200"
                >
                  Get Started Free
                </a>
                <a
                  href="/about"
                  className="w-full sm:w-auto border-2 border-white/80 hover:border-white hover:bg-white/10 text-white font-extrabold text-sm py-3.5 px-8 rounded-xl transition duration-200"
                >
                  Download the App
                </a>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </AppLayout>
  );
}
