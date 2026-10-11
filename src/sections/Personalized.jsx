import { useStore } from "../context/StoreContext";
import { products as catalogProducts } from "../lib/productStore";
import ProductCard from "../components/ProductCard";
import { Heart, Sparkles } from "lucide-react";

export default function PersonalizedSection() {
  const { state } = useStore();

  // Recommendations based on wishlist categories, then viewed
  const recSeed = new Set([
    ...state.wishlist.flatMap((id) => {
      const p = catalogProducts.find((x) => x.id === id);
      return p ? [p.category] : [];
    }),
    ...state.recentlyViewed.flatMap((id) => {
      const p = catalogProducts.find((x) => x.id === id);
      return p ? [p.category] : [];
    }),
  ]);

  const recs = recSeed.size
    ? catalogProducts.filter((p) => recSeed.has(p.category) && !state.wishlist.includes(p.id)).slice(0, 4)
    : catalogProducts.filter((p) => p.rating >= 4.7).slice(0, 4);

  if (!state.wishlist.length && !state.recentlyViewed.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-300">
            <Sparkles size={12} /> For you
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
            Picked based on your taste
          </h2>
        </div>
        <Heart size={18} className="text-rose-400" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {recs.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

export function RecentlyViewed() {
  const { state } = useStore();
  if (state.recentlyViewed.length === 0) return null;
  const items = state.recentlyViewed
    .map((id) => catalogProducts.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 6);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">Recently viewed</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
