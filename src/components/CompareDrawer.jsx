import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, GitCompare } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { products as catalogProducts } from "../lib/productStore";
import { formatPrice } from "../lib/utils";
import { Link } from "react-router-dom";

export default function CompareDrawer() {
  const { state, dispatch } = useStore();
  const items = state.compare.map((id) => catalogProducts.find((p) => p.id === id)).filter(Boolean);

  return (
    <AnimatePresence>
      {state.compareOpen && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
          onClick={() => dispatch({ type: "TOGGLE_COMPARE_DRAWER" })}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompare size={18} className="text-accent-300" />
                <h2 className="font-display text-xl font-semibold text-white">Compare</h2>
                <span className="chip">{items.length}/4</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch({ type: "CLEAR_COMPARE" })}
                  className="btn-ghost !px-3 !py-2 text-xs"
                >
                  <Trash2 size={13} /> Clear
                </button>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_COMPARE_DRAWER" })}
                  className="rounded-full p-2 text-ink-200 hover:bg-white/5"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/5">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-ink-900/95 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-wider text-ink-400">
                    <th className="px-4 py-3">Spec</th>
                    {items.map((p) => (
                      <th key={p.id} className="px-4 py-3">
                        <button
                          onClick={() => dispatch({ type: "TOGGLE_COMPARE", payload: { id: p.id } })}
                          className="text-ink-400 hover:text-rose-400"
                        >
                          <X size={12} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="px-4 py-3 text-ink-300">Image</td>
                    {items.map((p) => (
                      <td key={p.id} className="px-4 py-3">
                        <img src={p.image} alt={p.title} className="h-20 w-20 rounded-lg object-cover" />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-ink-300">Title</td>
                    {items.map((p) => (
                      <td key={p.id} className="px-4 py-3 font-semibold text-white">
                        <Link to={`/product/${p.id}`} onClick={() => dispatch({ type: "TOGGLE_COMPARE_DRAWER" })} className="hover:text-accent-300">
                          {p.title}
                        </Link>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-ink-300">Price</td>
                    {items.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-white">
                        {formatPrice(p.price)}
                        {p.originalPrice > p.price && (
                          <span className="ml-2 text-xs text-ink-400 line-through">
                            {formatPrice(p.originalPrice)}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-ink-300">Rating</td>
                    {items.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-white">
                        {p.rating} ★
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-ink-300">Category</td>
                    {items.map((p) => (
                      <td key={p.id} className="px-4 py-3 capitalize text-ink-200">
                        {p.category}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-ink-300">Stock</td>
                    {items.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-ink-200">
                        {p.stock === "in_stock" ? "In stock" : "Low stock"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
