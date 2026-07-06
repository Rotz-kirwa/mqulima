import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "What is Mqulima and how does it work?",
    a: "Mqulima is East Africa's premium digital marketplace and Extension Network. We connect rural farmers with audited chemical/seed inputs, direct transport logistics, and county-specific meteorological planning tools to scale production.",
  },
  {
    q: "How do I create an account on Mqulima?",
    a: "You can register directly on our web application or download the PWA wrapper. Using a mobile number, you will authenticate using an SMS OTP. No legacy email validation sequences are required.",
  },
  {
    q: "What payment systems are supported?",
    a: "We support direct Safaricom M-Pesa payments (via automated STK Push prompts), local Bank Transits, and secure credit cards. Offline transactions are restricted to secure the audit trails of sellers.",
  },
  {
    q: "Are there onboarding fees for cooperatives?",
    a: "Onboarding and catalog browsing are completely free. Standard commission percentages apply only on merchant transactions, and premium rates are applied on specific soil extension diagnostic tracks.",
  },
  {
    q: "How do I request help with a shipment or order?",
    a: "Our dispatch and support lines are active Mon-Fri, 8AM to 6PM EAT. Click the floating WhatsApp button on the bottom-right corner or submit the contact dispatch form on this page.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="border-2 border-[#0A1E0C] bg-white p-5 transition-all duration-300 hover:border-[#2D6A4F] hover:shadow-[6px_6px_0px_#0A1E0C] text-left rounded-none"
          >
            <button
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between py-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <span className="text-lg font-black font-serif text-[#0A1E0C] group-hover:text-[#2D6A4F] transition-colors duration-200 leading-snug">
                {faq.q}
              </span>
              <span className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#0A1E0C] bg-[#FAF9F5] text-sm font-mono font-black text-[#0A1E0C] transition duration-300 group-hover:border-[#2D6A4F] group-hover:bg-[#2D6A4F] group-hover:text-white rounded-none">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-sm text-gray-605 leading-relaxed pt-4 pb-2 pr-6 font-medium border-t border-gray-150 mt-2">
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
