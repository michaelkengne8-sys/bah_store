import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Check, Sparkles } from "lucide-react";
import { useStore } from "../context/StoreContext";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const { pushToast } = useStore();

  function submit(e) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setDone(true);
    pushToast("Welcome to Top Shelf Exotics. Check your inbox for 15% off.", "success");
    setEmail("");
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 p-8 sm:p-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-500/20 blur-[120px]"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow">
            <Sparkles size={22} strokeWidth={2.5} />
          </div>
          <h2 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">
            <span className="text-white">Join Top Shelf Exotics </span>
            <span className="text-gradient-accent">Insider</span>
          </h2>
          <p className="mt-3 text-base text-ink-200">
            Get early access to drops, members-only pricing, and 15% off your first order. Unsubscribe anytime.
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-full border border-white/10 bg-ink-900 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-ink-400 focus:border-accent-400 focus:outline-none"
              />
            </div>
            <button type="submit" className="btn-primary sm:flex-shrink-0">
              {done ? (
                <>
                  <Check size={16} /> You're in
                </>
              ) : (
                <>
                  Subscribe <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <p className="mt-3 text-[11px] text-ink-400">
            By subscribing you agree to our Privacy Policy. No spam — promise.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
