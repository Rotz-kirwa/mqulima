import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { ShieldCheck, FileText, Mail, Phone, MapPin, ChevronRight, Scale, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | Mqulima Agro Systems" },
      {
        name: "description",
        content: "Official Terms and Conditions governing the use of Mqulima Agro Systems platform, Agroshop, Services, Academy, and AI assistant.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const [activeSection, setActiveSection] = useState("sec-1");

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
    { id: "sec-1", title: "1. Definitions" },
    { id: "sec-2", title: "2. Eligibility & Account Registration" },
    { id: "sec-3", title: "3. Roles on the Platform" },
    { id: "sec-4", title: "4. The Agroshop — Orders & Purchases" },
    { id: "sec-5", title: "5. Services — Bookings with Providers" },
    { id: "sec-6", title: "6. Mqulima Agro Systems Academy" },
    { id: "sec-7", title: "7. Forum, Community, & Content" },
    { id: "sec-8", title: "8. Mqulima AI Assistant" },
    { id: "sec-9", title: "9. Ratings & Reviews" },
    { id: "sec-10", title: "10. Fees, Pricing, & Promotions" },
    { id: "sec-11", title: "11. Intellectual Property" },
    { id: "sec-12", title: "12. Acceptable Use" },
    { id: "sec-13", title: "13. Termination & Suspension" },
    { id: "sec-14", title: "14. Disclaimers" },
    { id: "sec-15", title: "15. Limitation of Liability" },
    { id: "sec-16", title: "16. Indemnification" },
    { id: "sec-17", title: "17. Dispute Resolution" },
    { id: "sec-18", title: "18. Force Majeure" },
    { id: "sec-19", title: "19. Changes to These Terms" },
    { id: "sec-20", title: "20. Contact Us" },
  ];

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] min-h-screen font-sans text-[#0F291E] text-left selection:bg-[#E5F5D0] selection:text-[#35610D]">
        
        {/* HERO BANNER */}
        <section className="bg-[#0F291E] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#85CC14]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#85CC14]/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#85CC14] border border-[#85CC14]/30">
                <Scale className="h-3.5 w-3.5" />
                Legal Policy Framework
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-['Outfit',sans-serif]">
                MQULIMA AGRO SYSTEMS <br />
                <span className="text-[#85CC14]">TERMS AND CONDITIONS</span>
              </h1>
              <div className="flex items-center gap-3 text-xs text-white/70 pt-2 font-medium">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-md">
                  <Clock className="h-3.5 w-3.5 text-[#85CC14]" />
                  Last updated: 22 July 2026
                </span>
                <span>•</span>
                <span>Applicable nationwide across Kenya</span>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN BODY CONTAINER */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* SIDEBAR NAVIGATION (DESKTOP STICKY) */}
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-28 bg-white border border-slate-200/90 rounded-[24px] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileText className="h-4 w-4 text-[#16A34A]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F291E]">Table of Contents</h3>
                </div>
                <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 no-scrollbar text-xs">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                        activeSection === item.id
                          ? "bg-[#E5F5D0] text-[#35610D] font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#0F291E]"
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                      <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${activeSection === item.id ? "rotate-90 text-[#35610D]" : "text-slate-300"}`} />
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* TERMS DOCUMENT CONTENT */}
            <main className="lg:col-span-8 space-y-8">
              
              {/* PREAMBLE CARD */}
              <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <div className="inline-block rounded-full bg-[#E5F5D0] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#35610D]">
                  Binding Legal Agreement
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  These Terms and Conditions (“Terms”) form a binding agreement between you (“you”, “your”, or “User”) and Mqulima Agro Systems Kenya Ltd (“Mqulima Agro Systems”, “we”, “us”, “our”), a company operating Africa’s 360° agricultural ecosystem at Mqulima Agro Systems.com and through the Mqulima Agro Systems mobile and web applications (the “Platform”). The Platform brings together the Agroshop, Academy, Services, Tools, Forum/Community, Blog, and the Mqulima Agro Systems AI assistant.
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  By creating an account, browsing, ordering, booking a service, or otherwise using the Platform, you agree to be bound by these Terms and by our Privacy Policy, which is incorporated by reference. If you do not agree, please do not use the Platform.
                </p>
                <div className="bg-[#FAFBF9] border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 italic">
                  Our aim is simple: build a platform where farmers, traders, distributors, service providers, and consumers can transact with confidence, and where Mqulima Agro Systems can operate a sustainable, trustworthy business. These Terms are written to protect both sides of that relationship.
                </div>
              </div>

              {/* 1. DEFINITIONS */}
              <section id="sec-1" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">1. Definitions</h2>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <li className="p-3 bg-[#FAFBF9] rounded-xl border border-slate-100">
                    <strong className="text-[#0F291E]">“Platform”</strong> means the Mqulima Agro Systems website, mobile application(s), and all features, tools, and services offered through them.
                  </li>
                  <li className="p-3 bg-[#FAFBF9] rounded-xl border border-slate-100">
                    <strong className="text-[#0F291E]">“Agroshop”</strong> means the e-commerce feature through which Mqulima Agro Systems sells agricultural products directly to Users.
                  </li>
                  <li className="p-3 bg-[#FAFBF9] rounded-xl border border-slate-100">
                    <strong className="text-[#0F291E]">“Services”</strong> means bookable third-party services listed on the Platform (e.g. veterinary visits, soil testing, artificial insemination, machinery rental, advisory sessions, silage shredding), delivered by independent Service Providers.
                  </li>
                  <li className="p-3 bg-[#FAFBF9] rounded-xl border border-slate-100">
                    <strong className="text-[#0F291E]">“Service Provider”</strong> means an independent professional, vet, technician, agronomist, or business that offers Services through the Platform and is not an employee or agent of Mqulima Agro Systems.
                  </li>
                  <li className="p-3 bg-[#FAFBF9] rounded-xl border border-slate-100">
                    <strong className="text-[#0F291E]">“User”</strong> means any person who creates an account or otherwise uses the Platform, in any role (producer, trader, distributor, consumer, or Service Provider).
                  </li>
                  <li className="p-3 bg-[#FAFBF9] rounded-xl border border-slate-100">
                    <strong className="text-[#0F291E]">“Content”</strong> means any text, images, reviews, posts, or other material submitted to the Platform by a User.
                  </li>
                  <li className="p-3 bg-[#FAFBF9] rounded-xl border border-slate-100">
                    <strong className="text-[#0F291E]">“Order”</strong> means a purchase of products through the Agroshop; <strong className="text-[#0F291E]">“Booking”</strong> means a reservation of a Service through the Platform.
                  </li>
                </ul>
              </section>

              {/* 2. ELIGIBILITY AND ACCOUNT REGISTRATION */}
              <section id="sec-2" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">2. Eligibility and Account Registration</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>You must be at least 18 years old to create an account, or use the Platform under the supervision of a parent, guardian, or institution (e.g. an agricultural training programme).</li>
                  <li>You must provide accurate, current, and complete information when registering, and keep it up to date.</li>
                  <li>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at <a href="mailto:Mqulima001@gmail.com" className="text-[#16A34A] font-bold hover:underline">Mqulima001@gmail.com</a> if you suspect unauthorised access.</li>
                  <li>Mqulima Agro Systems reserves the right to verify the information you provide (e.g. for suppliers or Service Providers), refuse registration, or suspend an account that provides false or misleading information.</li>
                  <li>Depending on your role, additional verification (e.g. business registration, professional licences for Service Providers) may be required before you can list products or offer Services.</li>
                </ul>
              </section>

              {/* 3. ROLES ON THE PLATFORM */}
              <section id="sec-3" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">3. Roles on the Platform</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Mqulima Agro Systems connects different participants across the agricultural value chain. Depending on how you use the Platform, you may act as a Consumer (buying products/booking Services), a Producer/Farmer, a Trader or Distributor, or a Service Provider. Each role may carry additional obligations set out in a role-specific addendum or onboarding agreement, which forms part of these Terms where applicable.
                </p>
              </section>

              {/* 4. THE AGROSHOP — ORDERS AND PURCHASES */}
              <section id="sec-4" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">4. The Agroshop — Orders and Purchases</h2>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">4.1 Mqulima Agro Systems as Seller</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Products listed on the Agroshop are sold directly by Mqulima Agro Systems Kenya Ltd, unless a listing clearly states otherwise. This means Mqulima Agro Systems is the contracting party for your purchase, and is responsible for the accuracy of listings, fulfilment, and after-sales support for products bought through the Agroshop.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">4.2 Product Listings and Pricing</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                    <li>We take reasonable care to ensure product descriptions, images, and prices are accurate, but errors may occur. If we discover a pricing or listing error after you order, we will contact you before processing the Order, and you may cancel with a full refund.</li>
                    <li>Prices are shown in Kenya Shillings (KES) and include applicable taxes unless stated otherwise. Delivery fees are shown separately at checkout.</li>
                    <li>Product availability is not guaranteed until your Order is confirmed. If an item becomes unavailable after ordering, we will notify you promptly and offer a substitute, refund, or delay, at your choice.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">4.3 Checkout and Payment</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                    <li>Orders are placed by adding products to your cart and completing checkout, where you confirm the delivery address, review your total, and select a payment method.</li>
                    <li>Payments are processed through licensed third-party payment processors (e.g. M-Pesa, card gateways). Mqulima Agro Systems does not store your full card number or M-Pesa PIN.</li>
                    <li>An Order is only confirmed once payment has been successfully received and you receive a confirmation notice (via email, SMS, or WhatsApp).</li>
                    <li>You agree to pay all charges at the price in effect when you place your Order, including any applicable delivery fees.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">4.4 Delivery</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                    <li>Estimated delivery timelines are shown at checkout and are not guaranteed delivery dates; they may vary due to location, product availability, weather, or logistics constraints.</li>
                    <li>You are responsible for providing an accurate delivery address and being reasonably available to receive the Order. Additional delivery attempts may attract extra charges.</li>
                    <li>Risk in the products passes to you upon delivery to the address provided, or to your designated recipient.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">4.5 Returns, Refunds, and Cancellations</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                    <li>You may cancel an Order free of charge before it has been dispatched, by contacting us or via your account.</li>
                    <li>If you receive a product that is defective, damaged in transit, or materially different from what you ordered (a “Wrong or Faulty Item”), you may request a replacement or refund within 7 days of delivery. Please retain the product and packaging and report the issue with photos where possible.</li>
                    <li>Certain products — including agrochemicals, seeds, veterinary medicines, and perishable goods — cannot be returned once opened, used, or delivered, except where the item is confirmed faulty or wrongly supplied, for health, safety, and regulatory reasons.</li>
                    <li>Approved refunds will be processed to your original payment method within a reasonable time, typically within 7–14 business days.</li>
                    <li>This Section 4.5 does not affect any statutory rights you have as a consumer under Kenyan law, including the Consumer Protection Act.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">4.6 Product Use and Warnings</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Agricultural inputs such as agrochemicals, fertilisers, and veterinary products must be used strictly according to the manufacturer’s instructions and any applicable regulatory guidance (e.g. from the Pest Control Products Board or Kenya Veterinary Board). Mqulima Agro Systems is not responsible for losses arising from misuse, incorrect application, or failure to follow label instructions.
                  </p>
                </div>
              </section>

              {/* 5. SERVICES — BOOKINGS WITH INDEPENDENT PROVIDERS */}
              <section id="sec-5" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">5. Services — Bookings with Independent Providers</h2>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">5.1 Nature of the Relationship</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Services listed on the Platform (such as veterinary visits, soil testing, artificial insemination, machinery rental, advisory sessions, and silage shredding) are delivered by independent, third-party Service Providers. Mqulima Agro Systems acts solely as a facilitator that connects you with a Service Provider and enables you to discover, book, and pay for the Service through the Platform. The contract for the Service itself is between you and the Service Provider, not with Mqulima Agro Systems.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">5.2 Booking, Payment, and Cancellation</h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                    <li>Bookings are confirmed once payment (or an agreed deposit) is made through the Platform and the Service Provider accepts the booking.</li>
                    <li>Cancellation and rescheduling policies (including any applicable fees) are shown at the time of booking. As a general rule, cancellations made at least 24 hours before the scheduled Service are free of charge; later cancellations may attract a fee to compensate the Service Provider.</li>
                    <li>If a Service Provider cancels, fails to show up, or does not deliver the Service as booked, you are entitled to a full refund of amounts paid through the Platform for that booking, or a free rebooking, at your choice.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">5.3 Service Provider Vetting and Quality</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    We take reasonable steps to verify the credentials of Service Providers listed on the Platform (such as professional licences for veterinary and agronomy services) before onboarding them. However, Mqulima Agro Systems does not supervise Service Providers’ day-to-day work and cannot guarantee the outcome, quality, or result of any Service. You are encouraged to review a Service Provider’s ratings and reviews before booking.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#0F291E]">5.4 Complaints About a Service</h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    If you are unhappy with a Service, please report it to us within 48 hours via the Platform or <a href="mailto:Mqulima001@gmail.com" className="text-[#16A34A] font-bold hover:underline">Mqulima001@gmail.com</a>. We will investigate, mediate between you and the Service Provider where appropriate, and may issue a refund, credit, or remove a Service Provider from the Platform where warranted by our findings.
                  </p>
                </div>
              </section>

              {/* 6. MQULIMA AGRO SYSTEMS ACADEMY */}
              <section id="sec-6" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">6. Mqulima Agro Systems Academy</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>The Academy provides structured courses, guides, and training content on agricultural practices. Content is prepared or curated by Mqulima Agro Systems and/or partner agronomists and experts.</li>
                  <li>Course content is provided for educational purposes and reflects general good practice; it is not a substitute for tailored professional advice for your specific farm, soil, climate, or livestock conditions.</li>
                  <li>Certificates of completion, where offered, indicate that you completed the course content; they are not professional or regulatory qualifications unless expressly stated.</li>
                  <li>Academy content is protected by intellectual property rights (see Section 11) and may not be copied, resold, or redistributed without our written permission.</li>
                </ul>
              </section>

              {/* 7. FORUM, COMMUNITY, AND USER CONTENT */}
              <section id="sec-7" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">7. Forum, Community, and User Content</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>The Forum allows Users to ask questions, share knowledge, and discuss agricultural topics. You are responsible for the Content you post.</li>
                  <li>By posting Content, you grant Mqulima Agro Systems a non-exclusive, worldwide, royalty-free licence to host, display, reproduce, and distribute that Content on the Platform (including in marketing materials, with attribution where reasonable) for as long as it remains posted.</li>
                  <li>You must not post Content that is false, defamatory, infringing, obscene, discriminatory, harassing, or that promotes unsafe or illegal agricultural practices (e.g. banned agrochemicals).</li>
                  <li>Mqulima Agro Systems may moderate, edit, or remove Content, and suspend Users, at its reasonable discretion, to keep the Forum safe, accurate, and useful for the community.</li>
                  <li>Advice shared by other Users on the Forum reflects their own views and experience, not verified guidance from Mqulima Agro Systems, unless specifically labelled as expert-reviewed content.</li>
                </ul>
              </section>

              {/* 8. MQULIMA AGRO SYSTEMS AI ASSISTANT */}
              <section id="sec-8" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">8. Mqulima Agro Systems AI Assistant</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>The Mqulima Agro Systems AI assistant provides automated responses to help you navigate the Platform, find products, and get general agricultural guidance.</li>
                  <li>AI-generated responses are provided for informational purposes only and may occasionally be inaccurate or incomplete. They do not constitute professional agronomic, veterinary, financial, or legal advice, and should not be relied on as the sole basis for major farming, financial, or safety decisions.</li>
                  <li>For decisions with significant financial, health, or safety implications (e.g. treatment of sick livestock, large agrochemical applications), please consult a qualified professional or book a Service through the Platform.</li>
                </ul>
              </section>

              {/* 9. RATINGS AND REVIEWS */}
              <section id="sec-9" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">9. Ratings and Reviews</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>After an Order or Service Booking, you may be invited to rate and review the product, Service, or Service Provider.</li>
                  <li>Reviews must be honest, based on your genuine experience, and must not contain false, defamatory, or abusive content. Mqulima Agro Systems does not permit fake reviews, whether positive or negative, and reserves the right to remove reviews that violate this rule.</li>
                  <li>Ratings help other Users make informed decisions and help Mqulima Agro Systems maintain quality across the Platform, including by monitoring underperforming products or Service Providers.</li>
                  <li>Mqulima Agro Systems does not pay Users, suppliers, or Service Providers for positive reviews, and does not allow suppliers or Service Providers to remove genuine negative reviews except where they are found, after investigation, to breach this Section.</li>
                </ul>
              </section>

              {/* 10. FEES, PRICING, AND PROMOTIONS */}
              <section id="sec-10" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">10. Fees, Pricing, and Promotions</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Mqulima Agro Systems may charge fees for products, Services, Academy content, or platform features, as displayed at the relevant point of purchase or booking. We may run promotions, discounts, or loyalty programmes from time to time, subject to their own specific terms, which will be made available when the promotion is active. We may adjust our pricing at any time, but changes will not affect Orders or Bookings already confirmed.
                </p>
              </section>

              {/* 11. INTELLECTUAL PROPERTY */}
              <section id="sec-11" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">11. Intellectual Property</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  The Platform, including its design, logos, trademarks (“Mqulima Agro Systems” and associated branding), software, and original content (excluding User Content), is owned by or licensed to Mqulima Agro Systems Kenya Ltd and is protected by Kenyan and international intellectual property law. You may not copy, modify, distribute, or create derivative works from the Platform or its content without our prior written consent, except as reasonably necessary to use the Platform for its intended purpose.
                </p>
              </section>

              {/* 12. ACCEPTABLE USE */}
              <section id="sec-12" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">12. Acceptable Use</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">When using the Platform, you agree not to:</p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>Use the Platform for any unlawful purpose, or to sell or promote counterfeit, banned, or unsafe agricultural products or inputs.</li>
                  <li>Impersonate another person or misrepresent your affiliation with any person or entity.</li>
                  <li>Attempt to interfere with, disrupt, or gain unauthorised access to the Platform, its systems, or other Users’ accounts.</li>
                  <li>Scrape, harvest, or misuse data from the Platform, including other Users’ contact details.</li>
                  <li>Circumvent the Platform to complete a transaction off-platform in order to avoid applicable fees, where doing so undermines the safety protections (e.g. payment protection, dispute resolution) this Platform provides.</li>
                </ul>
              </section>

              {/* 13. TERMINATION AND SUSPENSION */}
              <section id="sec-13" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">13. Termination and Suspension</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>You may close your account at any time by contacting us; any pending Orders, Bookings, or payment obligations will still need to be settled.</li>
                  <li>Mqulima Agro Systems may suspend or terminate your account, with notice where reasonably possible, if you breach these Terms, provide false information, misuse the Platform, or engage in fraudulent or harmful conduct.</li>
                  <li>Sections relating to intellectual property, limitation of liability, indemnification, and dispute resolution survive termination of your account.</li>
                </ul>
              </section>

              {/* 14. DISCLAIMERS */}
              <section id="sec-14" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">14. Disclaimers</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  The Platform, including its Tools (e.g. Soil Doctor), Academy content, Forum, and Mqulima Agro Systems AI assistant, is provided “as is” and “as available.” While we work hard to keep information accurate and the Platform reliable, agriculture is inherently affected by variables outside our control — including weather, soil conditions, pests, disease, and market prices. We do not guarantee specific yields, outcomes, or profits from following guidance, products, or Services obtained through the Platform.
                </p>
              </section>

              {/* 15. LIMITATION OF LIABILITY */}
              <section id="sec-15" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">15. Limitation of Liability</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>To the maximum extent permitted by Kenyan law, Mqulima Agro Systems’s total liability to you for any claim arising from your use of the Platform is limited to the amount you paid to Mqulima Agro Systems for the specific Order, Booking, or feature giving rise to the claim in the 3 months preceding the claim.</li>
                  <li>Mqulima Agro Systems is not liable for indirect, incidental, or consequential losses, including loss of profit, loss of crops or livestock, or business interruption, except where such loss arises from our gross negligence, wilful misconduct, or cannot be excluded under Kenyan law.</li>
                  <li>Because Services are delivered by independent Service Providers (Section 5), Mqulima Agro Systems’s liability for the acts or omissions of a Service Provider is limited to refunding amounts paid through the Platform for that Booking, except where Mqulima Agro Systems’s own negligence in vetting or platform operation directly caused your loss.</li>
                  <li>Nothing in these Terms limits or excludes any liability that cannot lawfully be limited or excluded under the Consumer Protection Act or other applicable Kenyan law.</li>
                </ul>
              </section>

              {/* 16. INDEMNIFICATION */}
              <section id="sec-16" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">16. Indemnification</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  You agree to indemnify and hold Mqulima Agro Systems, its directors, employees, and partners harmless from any claims, losses, or expenses (including reasonable legal fees) arising from your breach of these Terms, misuse of the Platform, or violation of any law or third-party right.
                </p>
              </section>

              {/* 17. DISPUTE RESOLUTION AND GOVERNING LAW */}
              <section id="sec-17" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">17. Dispute Resolution and Governing Law</h2>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed list-disc list-inside">
                  <li>These Terms are governed by the laws of the Republic of Kenya.</li>
                  <li>If a dispute arises, please first contact us at <a href="mailto:Mqulima001@gmail.com" className="text-[#16A34A] font-bold hover:underline">Mqulima001@gmail.com</a> so we can attempt to resolve it informally and promptly — our goal is always a fair resolution without the need for formal proceedings.</li>
                  <li>If a dispute cannot be resolved informally within 30 days, either party may refer it to mediation or arbitration in Nairobi, Kenya, in accordance with the Arbitration Act, before resorting to the courts of Kenya, which shall have exclusive jurisdiction over any dispute not resolved through mediation or arbitration.</li>
                  <li>Nothing in this Section prevents you from lodging a complaint with the relevant Kenyan regulator (e.g. the ODPC for data protection matters, or the Competition Authority of Kenya for consumer protection matters).</li>
                </ul>
              </section>

              {/* 18. FORCE MAJEURE */}
              <section id="sec-18" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">18. Force Majeure</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Neither party is liable for any failure or delay in performance caused by circumstances beyond its reasonable control, including natural disasters, extreme weather, government action, power or internet outages, pandemics, or civil unrest.
                </p>
              </section>

              {/* 19. CHANGES TO THESE TERMS */}
              <section id="sec-19" className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F291E] font-['Outfit',sans-serif]">19. Changes to These Terms</h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  We may update these Terms from time to time to reflect changes in our services, legal requirements, or business practices. We will post the updated Terms with a revised “Last updated” date and, for material changes, provide reasonable notice (e.g. via email, SMS, or an in-app notice) before they take effect. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.
                </p>
              </section>

              {/* 20. CONTACT US */}
              <section id="sec-20" className="bg-[#0F291E] text-white rounded-[28px] p-6 sm:p-8 shadow-xl space-y-6">
                <div className="space-y-2">
                  <span className="inline-block rounded-full bg-[#85CC14]/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#85CC14]">
                    Get In Touch
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif]">20. Contact Us</h2>
                  <p className="text-xs sm:text-sm text-white/80">For any questions or legal inquiries regarding these Terms, please reach out to us:</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-1.5">
                    <Mail className="h-4 w-4 text-[#85CC14]" />
                    <div className="font-bold">Email</div>
                    <a href="mailto:Mqulima001@gmail.com" className="text-white/80 hover:text-white hover:underline block truncate">
                      Mqulima001@gmail.com
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
