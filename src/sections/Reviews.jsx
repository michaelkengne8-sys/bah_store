import { motion } from "framer-motion";
import { Quote, Star, CheckCircle2 } from "lucide-react";
import { reviews } from "../data/mockData";
import Rating from "../components/Rating";

export default function Reviews() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">
            Loved by customers
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            What our community says
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm text-ink-200">4.9 · 12,438 verified reviews</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="surface surface-hover flex flex-col gap-3 rounded-2xl p-5"
          >
            <Quote size={20} className="text-accent-300" />
            <Rating value={r.rating} showValue={false} />
            <h3 className="font-semibold text-white">{r.title}</h3>
            <p className="flex-1 text-sm text-ink-200">{r.body}</p>
            <div className="flex items-center gap-3 border-t border-white/5 pt-3">
              <img
                src={r.avatar}
                alt={r.name}
                className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{r.name}</p>
                <p className="flex items-center gap-1 text-[11px] text-ink-400">
                  <CheckCircle2 size={11} className="text-accent-300" /> {r.role} · {r.date}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-ink-400">on {r.product}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
