import { Link } from "react-router-dom";
import { ArrowRight, Crown, Star } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { products as catalogProducts } from "../lib/productStore";

export default function BestSellers() {
  const items = catalogProducts
    .filter((p) => p.badge === "Best Seller" || p.rating >= 4.8)
    .slice(0, 4);

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="surface relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-500/15 blur-[120px]"
        />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Crown size={12} /> Best Sellers
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              <span className="text-white">Loved by </span>
              <span className="text-gradient-accent">thousands</span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink-300">
              The strains our community keeps coming back to. Lab-tested, customer-approved.
            </p>
          </div>
          <div className="hidden items-center gap-1 text-amber-300 sm:flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-sm text-ink-200">4.9 average</span>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/shop?filter=best" className="btn-primary">
            Shop best sellers <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
