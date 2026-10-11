import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf } from "lucide-react";

const STORAGE_KEY = "tse-age-verified";

export default function AgeVerification() {
  const [show, setShow] = useState(() => !localStorage.getItem(STORAGE_KEY));

  const handleYes = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  const handleNo = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="glass-strong relative z-10 w-full max-w-md overflow-hidden rounded-3xl p-8 text-center shadow-lift"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow">
              <Leaf size={28} strokeWidth={2} />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              Welcome to Top Shelf Exotics
            </h2>
            <p className="mt-2 text-sm text-ink-300">
              You must be 21 years or older to enter this site.
            </p>
            <p className="mt-6 text-base font-medium text-white">
              Are you 21 or older?
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button onClick={handleYes} className="btn-primary w-full sm:w-auto">
                Yes, I am 21+
              </button>
              <button onClick={handleNo} className="btn-ghost w-full sm:w-auto">
                No, I am under 21
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
