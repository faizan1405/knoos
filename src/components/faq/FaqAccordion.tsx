"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (faqs.length === 0) {
    return (
      <div className="py-20 text-center font-mono text-sm text-brand-gray-400">
        No FAQs available at the moment.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        const triggerId = `faq-trigger-${faq.id}`;
        const panelId = `faq-panel-${faq.id}`;

        return (
          <div 
            key={faq.id} 
            className={`border-b border-brand-gray-200 transition-colors duration-300 ${isOpen ? "bg-brand-gray-50/50" : ""}`}
          >
            <button
              id={triggerId}
              type="button"
              onClick={() => toggleOpen(faq.id)}
              className="w-full text-left py-6 px-4 md:px-6 flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-brand-black/5"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="font-serif text-lg md:text-xl text-brand-black group-hover:text-brand-gray-600 transition-colors pr-8">
                {faq.question}
              </span>
              <motion.span
                aria-hidden="true"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                className="text-brand-gray-400 flex-shrink-0"
              >
                <Plus size={20} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.3,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-4 md:px-6 pb-6 text-brand-gray-500 text-sm md:text-base leading-relaxed">
                    {faq.answer}
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
