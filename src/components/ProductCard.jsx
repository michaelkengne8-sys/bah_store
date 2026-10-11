import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { formatPrice, discountPercent } from "../lib/utils";
import Rating from "./Rating";
import { highlightMatch } from "../lib/search";

export default function ProductCard({ product, index = 0, searchQuery = "" }) {
  const { state, dispatch, addToCart } = useStore();
  const inWish = state.wishlist.includes(product.id);
  const inCompare = state.compare.includes(product.id);
  const dPct = discountPercent(product.price, product.originalPrice);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group surface surface-hover relative flex flex-col overflow-hidden rounded-2xl p-3"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-800">
        <Link to={`/product/${product.id}`} aria-label={product.title} className="block h-full w-full">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
          />
          <img
            src={product.hoverImage}
            alt=""
            loading="lazy"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
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
          {product.stock === "low_stock" && (
            <span className="badge-low">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              Only 3 left
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              dispatch({ type: "TOGGLE_WISHLIST", payload: { id: product.id } });
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full glass-strong transition ${
              inWish ? "text-rose-400" : "text-ink-200 hover:text-rose-400"
            }`}
            aria-label="Add to wishlist"
          >
            <Heart size={15} className={inWish ? "fill-rose-400" : ""} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              dispatch({
                type: "OPEN_MODAL",
                payload: { type: "quickview", productId: product.id },
              });
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full glass-strong text-ink-200 transition hover:text-accent-300"
            aria-label="Quick view"
          >
            <Eye size={15} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              dispatch({ type: "TOGGLE_COMPARE", payload: { id: product.id } });
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full glass-strong transition ${
              inCompare ? "text-accent-300" : "text-ink-200 hover:text-accent-300"
            }`}
            aria-label="Add to compare"
            title="Compare"
          >
            <Star size={15} className={inCompare ? "fill-accent-300" : ""} />
          </motion.button>
        </div>

        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product.id, 1, product.colors?.[0]);
            }}
            className="btn-primary w-full !py-2.5 text-xs"
          >
            <ShoppingBag size={14} />
            Quick Add
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-1 pb-1 pt-4">
        <Rating value={product.rating} reviews={product.reviews} />
        <h3 className="line-clamp-1 text-sm font-semibold text-ink-100">
          <Link to={`/product/${product.id}`} className="hover:text-accent-300" dangerouslySetInnerHTML={{ __html: searchQuery ? highlightMatch(product.title, searchQuery) : product.title }} />
        </h3>
        <p className="line-clamp-1 text-xs text-ink-300" dangerouslySetInnerHTML={{ __html: searchQuery ? highlightMatch(product.description, searchQuery) : product.description }} />
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-white">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-ink-400 line-through">{formatPrice(product.originalPrice)}</span>
          )}
          {dPct > 0 && (
            <span className="ml-auto text-xs font-semibold text-accent-300">Save {dPct}%</span>
          )}
        </div>
        {product.colors && (
          <div className="mt-1 flex items-center gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c}
                className="h-3.5 w-3.5 rounded-full border border-white/10"
                style={{ background: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
