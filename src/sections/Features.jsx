import { motion } from "framer-motion";
import { Truck, Shield, RotateCcw, Headphones, Award, Zap } from "lucide-react";

const items = [
  { icon: Award, title: "Lab Tested", body: "All products third-party tested for purity & potency." },
  { icon: Truck, title: "Discreet Shipping", body: "Plain packaging. Guaranteed privacy." },
  { icon: Shield, title: "Premium Genetics", body: "Top-shelf strains from expert cultivators." },
  { icon: Headphones, title: "Expert Curation", body: "Hand-selected by certified budtenders." },
  { icon: RotateCcw, title: "Loyalty Rewards", body: "Earn points on every purchase." },
  { icon: Zap, title: "Fast Delivery", body: "2-day discreet shipping available." },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="surface flex items-center gap-3 rounded-2xl p-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-300">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{it.title}</p>
                <p className="text-xs text-ink-300">{it.body}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
