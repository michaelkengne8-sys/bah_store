import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { products as catalogProducts } from "../lib/productStore";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { state } = useStore();
  const items = state.wishlist
    .map((id) => catalogProducts.find((p) => p.id === id))
    .filter(Boolean);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-20 text-center sm:px-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-800 text-rose-300">
          <Heart size={32} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">No favorites yet</h1>
        <p className="mt-2 text-ink-300">Tap the heart on any product to save it here.</p>
        <Link to="/shop" className="btn-primary mt-6">
          Discover products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Your wishlist</h1>
      <p className="mt-1 text-sm text-ink-300">{items.length} saved</p>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
