import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "What is Mqulima and how does it work?",
    a: "Mqulima is a digital marketplace and education platform designed to connect Kenyan farmers with verified agricultural inputs, veterinary services, and certified training courses to improve crop yields and farm profitability.",
  },
  {
    q: "How do I create an account on Mqulima?",
    a: "You can sign up directly on our mobile app or web portal using your phone number. No complex email registrations are required. We authenticate accounts via a quick SMS OTP to keep your farm data secure.",
  },
  {
    q: "What payment methods are supported on the platform?",
    a: "We support direct M-Pesa payments (via STK push notifications), mobile bank transfers, and major debit/credit cards. Cash payments are not supported to guarantee transaction safety for both buyers and sellers.",
  },
  {
    q: "Is there a fee to use Mqulima's services?",
    a: "Creating an account and browsing products, services, or free courses is completely free. We only charge standard merchant processing fees on marketplace sales, and course fees for advanced agronomist certification tracks.",
  },
  {
    q: "How do I get technical support if I face an issue?",
    a: "Our client success team is available Monday through Friday from 8 AM to 6 PM EAT. You can reach out directly via WhatsApp at +254 723 346 134, call our support line, or email us at Mqulima001@gmail.com.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="border-b border-gray-200 pb-4 text-left"
          >
            <button
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between py-4 text-left focus:outline-none group cursor-pointer"
            >
              <span className="text-base md:text-lg font-bold text-[#1A1A1A] group-hover:text-[#2D6A4F] transition-colors duration-200">
                {faq.q}
              </span>
              <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center text-[#F5A623] text-xl font-mono">
                {isOpen ? "×" : "+"}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-gray-600 leading-relaxed pb-4 pr-6">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
