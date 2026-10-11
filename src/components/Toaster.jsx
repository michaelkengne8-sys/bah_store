
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Info, AlertCircle } from "lucide-react";
import { useStore } from "../context/StoreContext";

const ICONS = { success: Check, info: Info, error: AlertCircle };

export default function Toaster() {
  const { state, dispatch } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[120] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {state.toasts.map((t) => {
          const Icon = ICONS[t.type] || Check;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
              className="pointer-events-auto glass-strong flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-lift"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  t.type === "error" ? "bg-rose-500/20 text-rose-300" : "bg-accent-500/20 text-accent-300"
                }`}
              >
                <Icon size={14} strokeWidth={2.5} />
              </div>
              <p className="text-sm text-ink-100">{t.message}</p>
              <button
                onClick={() => dispatch({ type: "DISMISS_TOAST", payload: { id: t.id } })}
                className="text-ink-400 hover:text-ink-100"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
