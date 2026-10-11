import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useStore } from "../context/StoreContext";

export default function Modal({ children, onClose, size = "md" }) {
  const { state, dispatch } = useStore();
  const open = !!state.modal;
  const handleClose = onClose || (() => dispatch({ type: "CLOSE_MODAL" }));

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className={`glass-strong relative z-10 w-full overflow-hidden rounded-3xl shadow-lift ${sizes[size]}`}
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-20 rounded-full bg-ink-800/80 p-2 text-ink-200 backdrop-blur transition hover:bg-ink-700 hover:text-white"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
