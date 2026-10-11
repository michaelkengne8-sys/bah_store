import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  Truck,
  RotateCcw,
  Shield,
  ChevronDown,
  Check,
  Eye,
  Share2,
} from "lucide-react";
import { faqs, reviews } from "../data/mockData";
import { useStore } from "../context/StoreContext";
import { getProductById, hydrateProducts } from "../lib/productStore";
import { formatPrice, discountPercent } from "../lib/utils";
import Rating from "../components/Rating";
import ProductCard from "../components/ProductCard";

function FaqItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-ink-300 transition ${open ? "rotate-180 text-accent-300" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-4 pr-6 text-sm leading-relaxed text-ink-300">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { state, dispatch, addToCart } = useStore();
  const [products, setProducts] = useState([]);
  const product = getProductById(id) || products[0] || { id: "", title: "", description: "", price: 0, originalPrice: 0, image: "", hoverImage: "", rating: 0, reviews: 0, badge: "", category: "", stock: "in_stock", colors: [], brand: "" };

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(product?.colors?.[0]);
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });
  const [zoomOpen, setZoomOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const galleryRef = useRef(null);
  const imgs = [product.image, product.hoverImage, product.image, product.hoverImage];

  useEffect(() => {
    hydrateProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (product?.id) {
      dispatch({ type: "PUSH_RECENTLY_VIEWED", payload: { id: product.id } });
    }
  }, [product?.id, dispatch]);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const inWish = state.wishlist.includes(product.id);
  const dPct = discountPercent(product.price, product.originalPrice);
  const related = useMemo(
    () => products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4),
    [product.id, product.category, products]
  );

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x, y, active: true });
  }

  return (
    <div className="pb-32">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-ink-400">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-white">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="capitalize hover:text-white">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-ink-200">{product.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="grid gap-4 md:grid-cols-[5fr_1fr]">
              <div
                ref={galleryRef}
                onMouseMove={onMove}
                onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
                onClick={() => setZoomOpen(true)}
                className="relative aspect-square cursor-zoom-in overflow-hidden rounded-3xl border border-white/5 bg-ink-800"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      scale: zoom.active ? 1.6 : 1,
                      transformOrigin: `${zoom.x}% ${zoom.y}%`,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    src={imgs[activeImg]}
                    alt={product.title}
                    className="h-full w-full object-cover"
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
                <div className="absolute bottom-4 right-4 chip">
                  <Eye size={12} /> Hover to zoom
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 md:grid-cols-1">
                {imgs.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                      activeImg === i ? "border-accent-400" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 flex flex-col gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent-300">{product.category}</p>
                <h1 className="mt-1 font-display text-3xl font-semibold text-white sm:text-4xl">
                  {product.title}
                </h1>
                <div className="mt-2 flex items-center gap-3">
                  <Rating value={product.rating} reviews={product.reviews} />
                  <a href="#reviews" className="text-xs text-ink-300 underline-offset-2 hover:underline">
                    Read all reviews
                  </a>
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold text-white">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-ink-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="badge-discount">Save {dPct}%</span>
                  </>
                )}
              </div>

              <p className="text-base leading-relaxed text-ink-200">{product.description}</p>

              {product.colors && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-ink-300">
                    Color · <span className="text-white">{color}</span>
                  </p>
                  <div className="flex gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-10 w-10 rounded-full border-2 transition ${
                          color === c ? "border-accent-400 scale-110" : "border-white/10"
                        }`}
                        style={{ background: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-stretch gap-3">
                <div className="flex items-center rounded-full border border-white/10 bg-ink-800">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-12 w-12 items-center justify-center text-ink-200 hover:text-white"
                    aria-label="Decrease"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="flex h-12 w-12 items-center justify-center text-ink-200 hover:text-white"
                    aria-label="Increase"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    addToCart(product.id, qty, color);
                  }}
                  className="btn-primary flex-1"
                >
                  <ShoppingBag size={16} />
                  Add to Cart · {formatPrice(product.price * qty)}
                </button>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_WISHLIST", payload: { id: product.id } })}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                    inWish
                      ? "border-rose-400/40 bg-rose-500/10 text-rose-400"
                      : "border-white/10 bg-ink-800 text-ink-200 hover:border-white/20"
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart size={16} className={inWish ? "fill-rose-400" : ""} />
                </button>
                <button
                  className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-ink-200 transition hover:border-white/20 sm:flex"
                  aria-label="Share"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    dispatch({ type: "PUSH_TOAST", payload: { id: Date.now(), message: "Link copied to clipboard", type: "success" } });
                  }}
                >
                  <Share2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-xs">
                <div className="flex items-center gap-2 text-ink-300">
                  <Truck size={14} className="text-accent-300" /> Free 2-day
                </div>
                <div className="flex items-center gap-2 text-ink-300">
                  <RotateCcw size={14} className="text-accent-300" /> 30-day return
                </div>
                <div className="flex items-center gap-2 text-ink-300">
                  <Shield size={14} className="text-accent-300" /> 2-yr warranty
                </div>
              </div>

              <div className="rounded-2xl border border-accent-500/20 bg-accent-500/5 p-4 text-xs text-ink-200">
                <p className="flex items-center gap-2 font-semibold text-accent-300">
                  <Check size={14} /> In stock — ships today
                </p>
                <p className="mt-1 text-ink-300">
                  Order in <span className="text-white">2h 14m</span> for delivery by Friday.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Specs */}
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">Specifications</h2>
          <div className="surface overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/5">
                {[
                  ["Brand", "Top Shelf Exotics"],
                  ["Category", product.category],
                  ["Material", "Premium-grade, see description"],
                  ["Dimensions", "Standard fit"],
                  ["Weight", "0.6 kg"],
                  ["In the box", "Product · Manual · Premium packaging"],
                  ["Warranty", "2 years"],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="w-1/3 px-5 py-3 text-ink-300">{k}</td>
                    <td className="px-5 py-3 text-white">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">Customer reviews</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="surface rounded-2xl p-5">
                <div className="mb-2 flex items-center gap-3">
                  <img src={r.avatar} alt={r.name} className="h-9 w-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-white">{r.name}</p>
                    <p className="text-[11px] text-ink-400">{r.date}</p>
                  </div>
                  <Rating value={r.rating} showValue={false} size={12} />
                </div>
                <p className="text-sm font-semibold text-white">{r.title}</p>
                <p className="mt-1 text-sm text-ink-300">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">FAQ</h2>
          <div className="surface rounded-2xl px-5">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </section>

        {/* Related */}
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">Related products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      </div>

      {/* Sticky purchase panel */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-30 hidden border-t border-white/5 bg-ink-900/95 p-4 backdrop-blur md:block"
          >
            <div className="mx-auto flex max-w-7xl items-center gap-4">
              <img src={product.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="line-clamp-1 text-sm font-semibold text-white">{product.title}</p>
                <Rating value={product.rating} reviews={product.reviews} />
              </div>
              <span className="font-display text-xl font-bold text-white">
                {formatPrice(product.price)}
              </span>
              <button
                onClick={() => addToCart(product.id, qty, color)}
                className="btn-primary"
              >
                <ShoppingBag size={14} /> Add to Cart
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom overlay */}
      <AnimatePresence>
        {zoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-8"
            onClick={() => setZoomOpen(false)}
          >
            <img src={imgs[activeImg]} alt={product.title} className="max-h-full max-w-full rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
