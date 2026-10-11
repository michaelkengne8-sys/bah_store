import { motion } from "framer-motion";
import { brands } from "../data/mockData";

export default function BrandShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-center text-xs uppercase tracking-[0.3em] text-ink-400">
        Trusted cultivators · 60+ premium brands
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {brands.map((b, i) => (
          <motion.div
            key={b}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="surface flex h-16 items-center justify-center rounded-2xl px-4 text-center font-display text-lg font-semibold text-ink-200 transition hover:border-accent-400/30 hover:text-white"
          >
            {b}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
