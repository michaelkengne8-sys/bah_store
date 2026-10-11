import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Heart, Plus, Minus, Truck, Shield, RotateCcw } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { products as catalogProducts } from "../lib/productStore";
import { formatPrice, discountPercent } from "../lib/utils";
import Rating from "./Rating";

export default function QuickViewModal() {
  const { state, dispatch, addToCart } = useStore();
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(null);

  const product = state.modal?.type === "quickview"
    ? catalogProducts.find((p) => p.id === state.modal.productId)
    : null;

  if (!product) return null;

  const dPct = discountPercent(product.price, product.originalPrice);
  const inWish = state.wishlist.includes(product.id);

  return (
    <div className="grid gap-0 md:grid-cols-2">
      <div className="relative aspect-square overflow-hidden bg-ink-800 md:aspect-auto md:h-full">
        <AnimatePresence mode="wait">
          <motion.img
            key={product.image}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            src={product.image}
            alt={product.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute left-4 top-4 flex flex-col gap-1.5">
          {product.badge && (
            <span
              className={
                product.badge.includes("%")
                  ? "badge-discount"
                  : product.badge === "New"
                  ? "badge-new"
                  : "chip"
              }
            >
              {product.badge}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 p-6 md:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent-300">{product.category}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-white md:text-3xl">
            {product.title}
          </h2>
          <div className="mt-2">
            <Rating value={product.rating} reviews={product.reviews} />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink-200">{product.description}</p>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-white">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <>
              <span className="text-base text-ink-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
              <span className="badge-discount">Save {dPct}%</span>
            </>
          )}
        </div>

        {product.colors && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-ink-300">Color</p>
            <div className="flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === c ? "border-accent-400 scale-110" : "border-white/10"
                  }`}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-white/10 bg-ink-800">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="flex h-10 w-10 items-center justify-center text-ink-200 hover:text-white"
              aria-label="Decrease"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="flex h-10 w-10 items-center justify-center text-ink-200 hover:text-white"
              aria-label="Increase"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={() => {
              addToCart(product.id, qty, color || product.colors?.[0]);
              dispatch({ type: "CLOSE_MODAL" });
            }}
            className="btn-primary flex-1"
          >
            <ShoppingBag size={16} />
            Add to Cart
          </button>
          <button
            onClick={() => dispatch({ type: "TOGGLE_WISHLIST", payload: { id: product.id } })}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              inWish
                ? "border-rose-400/40 bg-rose-500/10 text-rose-400"
                : "border-white/10 bg-ink-800 text-ink-200 hover:border-white/20"
            }`}
            aria-label="Wishlist"
          >
            <Heart size={16} className={inWish ? "fill-rose-400" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-xs text-ink-300">
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-accent-300" />
            Free 2-day
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw size={14} className="text-accent-300" />
            30-day return
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-accent-300" />
            2-yr warranty
          </div>
        </div>
      </div>
    </div>
  );
}
