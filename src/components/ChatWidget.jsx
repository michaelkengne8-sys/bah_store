import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm Aria, your Top Shelf Concierge. How can I help today?" },
  ]);
  const [input, setInput] = useState("");

  function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text: "Thanks for reaching out! A specialist will be with you in just a moment. Average response time: 90s.",
        },
      ]);
    }, 700);
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow lg:bottom-6"
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={20} strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={20} strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-500" />
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed bottom-40 right-5 z-40 flex h-[28rem] w-80 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl glass-strong shadow-lift lg:bottom-24"
          >
            <div className="border-b border-white/5 bg-gradient-to-br from-ink-800 to-ink-900 p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-display text-sm font-bold text-ink-950">
                    A
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-900 bg-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Aria · Concierge</p>
                  <p className="text-[11px] text-ink-300">Online · Replies in ~90s</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === "user"
                        ? "rounded-br-sm bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950"
                        : "rounded-bl-sm bg-ink-800 text-ink-100"
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </div>
            <form onSubmit={send} className="flex items-center gap-2 border-t border-white/5 p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-white/10 bg-ink-800 px-4 py-2 text-sm text-white placeholder:text-ink-400 focus:border-accent-400 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 transition hover:scale-105"
                aria-label="Send"
              >
                <Send size={14} strokeWidth={2.5} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
