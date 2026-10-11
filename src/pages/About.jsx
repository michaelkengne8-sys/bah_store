import { motion } from "framer-motion";
import { Sparkles, Award, Truck, Leaf } from "lucide-react";

const values = [
  {
    icon: Sparkles,
    title: "Curated Excellence",
    description: "Every product in our collection is hand-selected for its exceptional design, craftsmanship, and lasting value. We believe in quality over quantity.",
  },
  {
    icon: Award,
    title: "White-Glove Service",
    description: "From personalized recommendations to dedicated support, we treat every customer like a VIP. Your satisfaction is our ultimate measure of success.",
  },
  {
    icon: Truck,
    title: "Seamless Experience",
    description: "Free express shipping, 30-day no-questions-asked returns, and hassle-free exchanges. We make premium shopping effortless.",
  },
  {
    icon: Leaf,
    title: "Sustainable Luxury",
    description: "We partner with brands that share our commitment to ethical production, sustainable materials, and reducing environmental impact without compromising on quality.",
  },
];

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl font-bold text-white mb-4">
            About Top Shelf Exotics
          </h1>
          <p className="text-xl text-ink-300 max-w-2xl mx-auto leading-relaxed">
            We believe premium living should be accessible, thoughtful, and beautifully simple. Top Shelf Exotics is your destination for objects that elevate everyday life.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-16">
          <div className="surface rounded-3xl overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-accent-400/20 to-accent-600/10 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow">
                <Sparkles size={48} strokeWidth={2} />
              </div>
            </div>
            <div className="p-8">
              <h2 className="font-display text-2xl font-bold text-white mb-3">Our Story</h2>
              <p className="text-ink-300 leading-relaxed">
                Founded in California in 2024, Top Shelf Exotics was born from a simple observation: finding truly exceptional products online was harder than it should be. We set out to create a curated marketplace where every item meets rigorous standards for design, durability, and ethical production.
              </p>
              <p className="text-ink-300 leading-relaxed mt-4">
                Today, we partner with independent designers and established brands from around the world, bringing you a carefully edited collection of audio equipment, wearables, home accessories, and lifestyle goods — each chosen to add a touch of distinction to your daily routine.
              </p>
            </div>
          </div>

          <div className="surface rounded-3xl p-8 flex flex-col justify-center">
            <h2 className="font-display text-2xl font-bold text-white mb-4">By the Numbers</h2>
            <div className="space-y-6">
              {[
                { label: "Products Curated", value: "500+" },
                { label: "Brands Partnered", value: "120+" },
                { label: "Happy Customers", value: "50,000+" },
                { label: "Cities Served", value: "40+" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className="text-ink-300">{stat.label}</span>
                  <span className="font-display text-2xl font-bold text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="font-display text-3xl font-bold text-white text-center mb-10">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="surface rounded-3xl p-6 text-center"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 mb-4">
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-ink-300 text-sm leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="surface rounded-3xl p-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Join the Top Shelf Community</h2>
          <p className="text-ink-300 text-lg mb-8 max-w-xl mx-auto">
            Be the first to discover new arrivals, exclusive drops, and insider access. Sign up for our newsletter and elevate your inbox.
          </p>
          <a href="mailto:hello@topshelffarms.com" className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-400 to-accent-600 text-ink-950 px-8 py-3.5 rounded-xl font-semibold text-sm hover:from-accent-300 hover:to-accent-500 transition">
            Get in Touch
          </a>
        </div>
      </div>
    </motion.div>
  );
}
