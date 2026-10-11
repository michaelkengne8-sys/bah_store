import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Flame } from "lucide-react";
import { useCountdown } from "../hooks/useCountdown";
import { products as catalogProducts } from "../lib/productStore";
import { formatPrice, discountPercent } from "../lib/utils";

export default function LimitedOffer() {
  // End of week
  const [target] = useState(() => Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 7);
  const { days, hours, minutes, seconds } = useCountdown(target);
  const deal = catalogProducts[5] || catalogProducts[0] || { id: "", title: "Featured deal", price: 0, originalPrice: 0, image: "", description: "Premium essentials." };
  const dPct = discountPercent(deal.price, deal.originalPrice);
  const saveAmount = deal.originalPrice - deal.price;

  const cells = [
    { v: days, l: "Days" },
    { v: hours, l: "Hours" },
    { v: minutes, l: "Minutes" },
    { v: seconds, l: "Seconds" },
  ];

  return (
    <section id="deals" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-accent-500/20 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-accent-500/25 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-rose-500/10 blur-[120px]"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300">
              <Flame size={12} /> Limited time · ends soon
            </div>
            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              <span className="text-white">Save </span>
              <span className="text-gradient-accent">${saveAmount}</span>
              <span className="text-white"> on</span>
              <br />
              <span className="text-white">Red Runtz Tee.</span>
            </h2>
            <p className="mt-3 max-w-md text-base text-ink-200">
              🔥 Stonerdays x Top Shelf Exotics collab tee. Premium cotton, custom graphic. Limited run — don't sleep.
            </p>

            <div className="mt-6 grid grid-cols-4 gap-2 max-w-md">
              {cells.map((c, i) => (
                <motion.div
                  key={c.l}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-ink-900/80 p-3 text-center backdrop-blur"
                >
                  <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                    {String(c.v).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-ink-400">{c.l}</div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to={`/product/${deal.id}`} className="btn-primary">
                <Zap size={14} /> Claim the deal <ArrowRight size={14} />
              </Link>
              <Link to="/shop" className="btn-ghost">Browse all offers</Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-white/10">
              <img src={deal.image} alt={deal.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
              <div className="absolute right-4 top-4">
                <span className="badge-discount text-base">-{dPct}%</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent-300">Featured deal</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">{deal.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-300 line-through">{formatPrice(deal.originalPrice)}</p>
                  <p className="font-display text-3xl font-bold text-white">{formatPrice(deal.price)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
