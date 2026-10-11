import { useEffect, useRef, useState, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Sparkles,
  Headphones,
  Watch,
  Home as HomeIcon,
  Shirt,
  Camera,
  Coffee,
  ArrowRight,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { categories, brands, searchSuggestions } from "../data/mockData";
import { products as catalogProducts } from "../lib/productStore";
import { fuzzySearch, createProductSearchOptions, generateAutocompleteSuggestions, useSearchAnalytics, useRecentSearches, highlightMatch, getRecentSearchesManager } from "../lib/search";
import UserMenu from "./UserMenu";

const iconMap = {
  audio: Headphones,
  wearables: Watch,
  home: HomeIcon,
  fashion: Shirt,
  cameras: Camera,
  lifestyle: Coffee,
};

export default function Navbar() {
  const { state, dispatch, hydrated } = useStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const cartCount = hydrated ? state.cart.reduce((s, i) => s + i.qty, 0) : 0;
  const wishCount = hydrated ? state.wishlist.length : 0;
  const compareCount = hydrated ? state.compare.length : 0;

  const {
    trackSearch,
    trackClickResult,
    trackSelectSuggestion,
    trackNoResults,
  } = useSearchAnalytics();

  const { getRecentSearches, addRecentSearch } = useRecentSearches();

  const submitSearch = (value, options = {}) => {
    const trimmed = value?.trim?.() || "";
    if (!trimmed) return;

    addRecentSearch(trimmed);
    trackSearch(trimmed, filtered.length);
    trackSelectSuggestion(trimmed, "query");
    if (filtered.length === 0) {
      trackNoResults(trimmed);
    }

    navigate(`/shop?q=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setQuery("");

    if (options.onDone) {
      options.onDone();
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  // Fuzzy search with relevance scoring (React Compiler memoizes automatically)
  const searchOptions = useMemo(() => createProductSearchOptions(), []);
  const filtered = query.trim()
    ? fuzzySearch(catalogProducts, query, searchOptions).map(r => r.item).slice(0, 6)
    : [];

  // Autocomplete suggestions from product data (React Compiler memoizes automatically)
  const autocompleteSuggestions = query.trim()
    ? generateAutocompleteSuggestions(
        catalogProducts.map(p => ({ id: p.id, title: p.title, category: p.category })),
        brands,
        categories,
        query,
        6
      )
    : [];

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-strong shadow-[0_1px_0_rgba(255,255,255,0.04)]"
            : "bg-ink-950/40 backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2 text-ink-200 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            <div className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-lg font-bold tracking-wide text-white">Top Shelf Exotics</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink-300">premium dispensary</span>
            </div>
          </Link>

          <ul className="ml-6 hidden items-center gap-1 lg:flex">
            {categories.map((c) => (
              <li key={c.id}>
                <NavLink
                  to={`/shop?category=${c.id}`}
                  className={({ isActive }) =>
                    `relative rounded-full px-3 py-2 text-sm font-medium transition ${
                      isActive ? "text-white" : "text-ink-200 hover:text-white"
                    }`
                  }
                >
                  {c.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => {
                if (searchOpen) {
                  submitSearch(query);
                } else {
                  setSearchOpen(true);
                }
              }}
              className="rounded-full p-2.5 text-ink-200 transition hover:bg-white/5 hover:text-white"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <Link
              to="/wishlist"
              className="relative rounded-full p-2.5 text-ink-200 transition hover:bg-white/5 hover:text-white"
              aria-label={`Wishlist (${wishCount})`}
            >
              <Heart size={18} />
              {wishCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {wishCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative rounded-full p-2.5 text-ink-200 transition hover:bg-white/5 hover:text-white"
              aria-label={`Cart (${cartCount})`}
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-ink-950">
                  {cartCount}
                </span>
              )}
            </Link>

            <UserMenu />

            {compareCount > 0 && (
              <button
                onClick={() => dispatch({ type: "TOGGLE_COMPARE_DRAWER" })}
                className="ml-1 hidden items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-xs font-semibold text-accent-300 transition hover:bg-accent-500/20 lg:inline-flex"
              >
                Compare · {compareCount}
              </button>
            )}
          </div>
        </nav>
      </motion.header>

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-md"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-2xl overflow-hidden rounded-3xl shadow-lift"
            >
              <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
                <Search size={18} className="text-accent-300" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    dispatch({ type: "SET_SEARCH", payload: e.target.value });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      submitSearch(e.currentTarget.value);
                    }
                  }}
                  placeholder="Search products, categories, brands…"
                  className="flex-1 bg-transparent text-base text-white placeholder:text-ink-400 focus:outline-none"
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {!query && (
                  <div>
                    {(() => {
                      const recent = getRecentSearches();
                      if (recent.length > 0) {
                        return (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs uppercase tracking-wider text-ink-400">Recent searches</p>
                              <button
                                onClick={() => {
                                  const manager = getRecentSearchesManager();
                                  manager.clearRecentSearches();
                                }}
                                className="text-[10px] text-ink-400 hover:text-ink-200"
                              >
                                Clear all
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {recent.map((s, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    addRecentSearch(s);
                                    trackSearch(s, 0);
                                    setQuery(s);
                                    navigate(`/shop?q=${encodeURIComponent(s)}`);
                                    setSearchOpen(false);
                                    setQuery("");
                                  }}
                                  className="chip hover:border-accent-400/40 hover:text-accent-300"
                                >
                                  <svg className="w-3 h-3 mr-1 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">Popular searches</p>
                    <div className="flex flex-wrap gap-2">
                      {searchSuggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            trackSearch(s, 0);
                            trackSelectSuggestion(s, "query");
                            setQuery(s);
                            navigate(`/shop?q=${encodeURIComponent(s)}`);
                            setSearchOpen(false);
                            setQuery("");
                          }}
                          className="chip hover:border-accent-400/40 hover:text-accent-300"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <p className="mb-2 mt-6 text-xs uppercase tracking-wider text-ink-400">Browse categories</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {categories.map((c) => {
                        const I = iconMap[c.id] || Sparkles;
                        return (
                          <Link
                            key={c.id}
                            to={`/shop?category=${c.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-800/50 p-3 transition hover:border-accent-400/30 hover:bg-ink-800"
                          >
                            <I size={16} className="text-accent-300" />
                            <div>
                              <p className="text-sm font-semibold text-white">{c.name}</p>
                              <p className="text-[11px] text-ink-400">{c.count} items</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
                {query && (
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">
                      {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </p>
                    {/* Autocomplete suggestions */}
                    {autocompleteSuggestions.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">Suggestions</p>
                        <div className="flex flex-wrap gap-2">
                          {autocompleteSuggestions.map((s, i) => (
                            <button
                              key={`${s.type}-${s.text}-${i}`}
                              onClick={() => {
                                addRecentSearch(s.text);
                                trackSearch(s.text, filtered.length);
                                trackSelectSuggestion(s.text, s.type);
                                setQuery(s.text);
                                navigate(`/shop?q=${encodeURIComponent(s.text)}`);
                                setSearchOpen(false);
                                setQuery("");
                              }}
                              className="chip hover:border-accent-400/40 hover:text-accent-300"
                            >
                              {s.text}
                              {s.type === 'product' && <span className="ml-1.5 text-[10px] text-ink-400">Product</span>}
                              {s.type === 'category' && <span className="ml-1.5 text-[10px] text-ink-400">Category</span>}
                              {s.type === 'brand' && <span className="ml-1.5 text-[10px] text-ink-400">Brand</span>}
                              {s.type === 'query' && <span className="ml-1.5 text-[10px] text-ink-400">Search</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {filtered.length === 0 && autocompleteSuggestions.length === 0 && (
                      <p className="py-8 text-center text-sm text-ink-300" onMouseEnter={() => trackNoResults(query)}>
                        No results for "{query}". Try a different keyword.
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      {filtered.map((p) => (
                        <Link
                          key={p.id}
                          to={`/product/${p.id}`}
                          onClick={() => {
                            addRecentSearch(query);
                            trackSearch(query, filtered.length);
                            trackClickResult(query, p.id);
                            setSearchOpen(false);
                            setQuery("");
                          }}
                          className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5"
                        >
                          <img src={p.image} alt={p.title} className="h-12 w-12 rounded-lg object-cover" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white" dangerouslySetInnerHTML={{ __html: highlightMatch(p.title, query) }} />
                            <p className="text-xs text-ink-400">${p.price}</p>
                          </div>
                          <ArrowRight size={14} className="text-ink-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950">
                    <Sparkles size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-display text-lg font-bold text-white">Top Shelf Exotics</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 text-ink-200 hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">Shop by category</p>
              <nav className="flex flex-col gap-1">
                {categories.map((c) => {
                  const I = iconMap[c.id] || Sparkles;
                  return (
                    <Link
                      key={c.id}
                      to={`/shop?category=${c.id}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl border border-transparent p-3 text-sm text-ink-200 transition hover:border-white/5 hover:bg-white/5 hover:text-white"
                    >
                      <I size={16} className="text-accent-300" />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-ink-400">{c.count}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 flex flex-col gap-2 border-t border-white/5 pt-6">
                <Link
                  to="/account"
                  onClick={() => setMobileOpen(false)}
                  className="btn-ghost"
                >
                  <User size={14} /> Account
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="btn-ghost"
                >
                  <Heart size={14} /> Wishlist
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
