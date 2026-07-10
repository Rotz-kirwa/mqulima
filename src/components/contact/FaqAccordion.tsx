import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "What should I do if my ordered farm inputs (seeds, fertilizer) are delayed?",
    a: "If your delivery from the Mqulima Agrovet Shop is delayed, check the live order status on your dashboard. For further assistance, contact our logistics department immediately with your order ID at logistics@mqulima.com or reach out via WhatsApp support.",
  },
  {
    q: "How do I request a visit from a Mqulima agricultural extension officer?",
    a: "To request an on-farm consultation, go to the 'Expert Services' tab in your account dashboard, select 'Book Officer', describe your current crop/animal health issues, and pick a preferred date. A verified officer in your county will contact you within 24 hours.",
  },
  {
    q: "I am experiencing issues with the Mqulima AI Diagnostic tool. How can I get help?",
    a: "Ensure the photos you upload are high-resolution and taken under clear, natural lighting. If the diagnostic tool fails to process or returns an error, refresh your browser or send the image and screenshot of the error to tech-support@mqulima.com.",
  },
  {
    q: "Why is my seller listing on the Mqulima Marketplace not visible to buyers?",
    a: "All marketplace listings undergo strict quality and certification checks by our team to maintain safety. The verification process takes between 12 to 24 hours. You will receive a notification once your listing has been approved and is live.",
  },
  {
    q: "How can I resolve payment issues or failed transactions during checkout?",
    a: "If an M-Pesa or bank transaction fails but funds are deducted from your account, please do not resubmit the payment. Send the transaction message reference along with your order ID to billing@mqulima.com, and we will update your order within 30 minutes.",
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
            className="bg-white rounded-2xl border border-emerald-100 hover:border-emerald-250 shadow-[0_4px_20px_-4px_rgba(45,106,79,0.06)] hover:shadow-[0_8px_30px_-4px_rgba(45,106,79,0.1)] transition-all duration-300 overflow-hidden text-left"
          >
            <button
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none group cursor-pointer"
            >
              <span className="text-base sm:text-lg font-bold text-[#0A1E0C] group-hover:text-emerald-700 transition-colors duration-250 leading-snug">
                {faq.q}
              </span>
              <span className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-transform duration-300 ${isOpen ? "rotate-180 bg-emerald-100" : ""}`}>
                <ChevronDown className="h-4 w-4 stroke-[2.5]" />
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
                  <div className="text-sm sm:text-base text-gray-600 leading-relaxed px-6 pb-6 pt-2 font-medium border-t border-emerald-50/50">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
