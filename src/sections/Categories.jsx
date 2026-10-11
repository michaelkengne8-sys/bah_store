import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { categories } from "../data/mockData";

export default function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">
            Browse
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Shop by category
          </h2>
        </div>
        <Link
          to="/shop"
          className="hidden items-center gap-1 text-sm font-medium text-ink-200 transition hover:text-accent-300 sm:inline-flex"
        >
          View all <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={`/shop?category=${c.id}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white/5"
            >
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-300">
                  {c.tagline}
                </p>
                <div className="mt-1 flex items-end justify-between">
                  <h3 className="font-display text-2xl font-semibold text-white">{c.name}</h3>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition group-hover:translate-x-1 group-hover:bg-accent-500 group-hover:text-ink-950">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-300">{c.count} products</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
