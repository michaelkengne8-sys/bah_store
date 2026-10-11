import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { hydrateProducts } from "../lib/productStore";

const filters = [
  { key: "all", label: "All" },
  { key: "flower", label: "Flower" },
  { key: "apparel", label: "Apparel" },
  { key: "snapbacks", label: "Hats" },
  { key: "smokeware", label: "Papers" },
  { key: "packs", label: "Packs" },
];

export default function Trending() {
  const [active, setActive] = useState("all");
  const [sort, setSort] = useState("featured");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    hydrateProducts().then(setProducts);
  }, []);

  const items = products
    .filter((p) => (active === "all" ? true : p.category === active))
    .slice(0, 8);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">
            Curated for you
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Trending now
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="glass inline-flex items-center rounded-full p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActive(f.key)}
                className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  active === f.key ? "text-ink-950" : "text-ink-200 hover:text-white"
                }`}
              >
                {active === f.key && (
                  <motion.span
                    layoutId="filterPill"
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-400 to-accent-600"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>
          <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-ink-200">
            <SlidersHorizontal size={12} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-xs focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="priceAsc">Price ↑</option>
              <option value="priceDesc">Price ↓</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>
      </div>

      <motion.div
        layout
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </motion.div>

      <div className="mt-10 text-center">
        <Link to="/shop" className="btn-ghost">
          <Filter size={14} /> See all products <ArrowUpRight size={14} />
        </Link>
      </div>
    </section>
  );
}
