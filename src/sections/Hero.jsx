import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles, Star, Shield, Truck, Leaf } from "lucide-react";
import { products as catalogProducts } from "../lib/productStore";
import { formatPrice } from "../lib/utils";

const heroProduct = catalogProducts[0] || { id: "", title: "Featured product", description: "Curated premium essentials.", price: 0, originalPrice: 0, image: "", badge: "New" };

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-accent-500/20 blur-[120px]" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-300">
              <Sparkles size={12} />
              <span>Summer '26 Harvest is live</span>
              <ArrowRight size={12} />
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-white">Premium </span>
              <span className="text-gradient-accent italic">cannabis</span>
              <span className="text-white">,</span>
              <br />
              <span className="text-white">curated for you.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-200 sm:text-lg">
              Discover a curated selection of top-shelf craft cannabis flower, apparel, and limited collab gear from the world's most trusted cultivators. Free discreet shipping on all orders.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/shop" className="btn-primary group">
                Shop the collection
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/shop?filter=new" className="btn-ghost group">
                <Play size={14} className="text-accent-300" />
                New arrivals
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-white/5 pt-6 text-xs text-ink-300">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-accent-300" /> Free discreet shipping
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-accent-300" /> Lab tested
              </div>
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-400 fill-amber-400" /> 4.9 · 12k+ reviews
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative aspect-[5/6] overflow-hidden rounded-3xl border border-white/10 shadow-lift">
              <img
                src={heroProduct.image}
                alt={heroProduct.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
              <div className="absolute left-6 top-6">
                <span className="chip border-white/10 bg-black/30 text-white backdrop-blur">
                  <Leaf size={12} className="text-accent-300" /> Featured · {heroProduct.title}
                </span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent-300">Editor pick</p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">{heroProduct.title}</h3>
                   <p className="mt-1 text-sm text-ink-200">{heroProduct.description.split(".")[0]}.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-300 line-through">{formatPrice(heroProduct.originalPrice)}</p>
                  <p className="font-display text-2xl font-bold text-white">{formatPrice(heroProduct.price)}</p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="glass-strong absolute -right-4 -top-4 hidden rounded-2xl p-4 sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["#5cffd9", "#ff5470", "#c0a062"].map((c, i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-ink-900"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">2,400+ in cart</p>
                  <p className="text-[10px] text-ink-300">Selling fast today</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="glass-strong absolute -bottom-6 -left-6 hidden rounded-2xl p-3 sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500/20 text-accent-300">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Members save 15%</p>
                  <p className="text-[10px] text-ink-300">Free to join</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
