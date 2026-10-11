import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";
import { faqs } from "../data/mockData";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <div className="text-center mb-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow mb-6">
          <HelpCircle size={32} strokeWidth={2} />
        </div>
        <h1 className="font-display text-4xl font-bold text-white">Frequently Asked Questions</h1>
        <p className="mt-3 text-ink-300 text-lg">Everything you need to know about shopping at Top Shelf Exotics</p>
      </div>

      <div className="surface rounded-3xl p-8 sm:p-10 space-y-0 divide-y divide-white/5">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => toggle(i)}
              className="flex w-full items-center justify-between py-5 text-left focus:outline-none"
            >
              <span className="font-display text-lg font-semibold text-white pr-4">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0"
              >
                <ChevronDown size={20} className="text-ink-400" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 text-ink-300 leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
