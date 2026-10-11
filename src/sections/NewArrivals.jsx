import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { hydrateProducts } from "../lib/productStore";

export default function NewArrivals() {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    hydrateProducts().then(setProducts);
  }, []);

  const items = products.filter((p) => p.badge === "New" || p.badge === "Limited").slice(0, 8);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 8);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    };
    update();
    el.addEventListener("scroll", update);
    return () => el.removeEventListener("scroll", update);
  }, []);

  function scroll(dir) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-300">
            <Sparkles size={12} /> Just Dropped
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            New arrivals
          </h2>
          <p className="mt-2 max-w-md text-sm text-ink-300">
            Freshly harvested strains and drops. Limited batches — first come, first served.
          </p>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-ink-200 transition hover:border-accent-400/40 hover:text-accent-300 disabled:opacity-30"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-ink-200 transition hover:border-accent-400/40 hover:text-accent-300 disabled:opacity-30"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6"
      >
        {items.map((p, i) => (
          <motion.div
            key={p.id}
            className="w-[70%] flex-shrink-0 snap-start sm:w-[42%] md:w-[31%] lg:w-[24%]"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <ProductCard product={p} index={i} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
