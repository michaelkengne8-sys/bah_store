import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SlidersHorizontal, ChevronDown, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { categories, searchSuggestions, brands } from "../data/mockData";
import { fuzzySearch, createProductSearchOptions, generateAutocompleteSuggestions, useSearchAnalytics, useRecentSearches } from "../lib/search";
import { products as storefrontProducts, hydrateProducts } from "../lib/productStore";

const priceRanges = [
  { key: "all", label: "All prices", min: 0, max: Infinity },
  { key: "u100", label: "Under $100", min: 0, max: 100 },
  { key: "100to300", label: "$100 – $300", min: 100, max: 300 },
  { key: "300to800", label: "$300 – $800", min: 300, max: 800 },
  { key: "o800", label: "$800+", min: 800, max: Infinity },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("featured");
  const [priceKey, setPriceKey] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const [products, setProducts] = useState(storefrontProducts);
  const category = params.get("category") || "all";
  const filter = params.get("filter") || "";
  const q = (params.get("q") || "").toLowerCase();

  const { trackSearch, trackSelectSuggestion, trackNoResults, getAnalytics } = useSearchAnalytics();
  const { getRecentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

  const searchOptions = useMemo(() => createProductSearchOptions(), []);

  const searchResultsWithScores = useMemo(() => {
    if (!q) return [];
    return fuzzySearch(products, q, searchOptions);
  }, [q, products, searchOptions]);

  const searchResultMeta = useMemo(() => {
    const meta = {};
    for (const r of searchResultsWithScores) {
      const bestMatch = r.matches.reduce((best, m) => m.score > best.score ? m : best, r.matches[0]);
      meta[r.item.id] = { score: r.score, bestField: bestMatch?.field || "" };
    }
    return meta;
  }, [searchResultsWithScores]);

  const searchResults = useMemo(() => {
    if (!q) return products;
    return searchResultsWithScores.map(r => r.item);
  }, [q, products, searchResultsWithScores]);

  useEffect(() => {
    if (q && q.trim()) {
      trackSearch(q.trim(), searchResults.length);
      if (searchResults.length === 0) {
        trackNoResults(q.trim());
      }
      addRecentSearch(q.trim());
    }
  }, [q, trackSearch, trackNoResults, addRecentSearch, searchResults.length]);

  useEffect(() => {
    let active = true;
    hydrateProducts().then((nextProducts) => {
      if (active) {
        setProducts(nextProducts);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setAutocompleteOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = useMemo(() => {
    const range = priceRanges.find((p) => p.key === priceKey) || priceRanges[0];
    let res = searchResults.filter((p) => p.price >= range.min && p.price <= range.max);
    if (category !== "all") res = res.filter((p) => p.category === category);
    if (filter === "best") res = res.filter((p) => p.badge === "Best Seller");
    if (filter === "new") res = res.filter((p) => p.badge === "New" || p.badge === "Limited");

    switch (sort) {
      case "priceAsc":
        res = [...res].sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        res = [...res].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        res = [...res].sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    return res;
  }, [category, filter, sort, priceKey, searchResults]);

  function setCategory(c) {
    const p = new URLSearchParams(params);
    if (c === "all") p.delete("category");
    else p.set("category", c);
    setParams(p);
  }

  function handleSearchChange(e) {
    const value = e.target.value;
    const p = new URLSearchParams(params);
    if (value) p.set("q", value);
    else p.delete("q");
    setParams(p);
  }

  function clearSearch() {
    const p = new URLSearchParams(params);
    p.delete("q");
    setParams(p);
  }

  const autocompleteSuggestions = useMemo(() => {
    if (q.length < 2) return [];
    return generateAutocompleteSuggestions(
      products.map(p => ({ id: p.id, title: p.title, category: p.category })),
      brands,
      categories,
      q,
      8
    );
  }, [q, products]);

  const recentSearches = getRecentSearches();
  const analytics = getAnalytics(30);
  const topQueries = useMemo(() => analytics?.topQueries || [], [analytics]);

  const didYouMeanSuggestions = useMemo(() => {
    if (items.length > 0 || !q || searchResults.length > 0) return [];
    const words = q.trim().split(/\s+/);
    if (words.length > 1) {
      const shorter = words.slice(0, -1).join(" ");
      return [shorter];
    }
    return (topQueries.length > 0
      ? topQueries.slice(0, 4).map(tq => tq.query)
      : searchSuggestions.slice(0, 4).map(s => s.query)
    ).filter(s => s.toLowerCase() !== q);
  }, [q, items.length, searchResults.length, topQueries]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          {q ? `Results for "${q}"` : filter === "new" ? "New arrivals" : filter === "best" ? "Best sellers" : category !== "all" ? categories.find((c) => c.id === category)?.name : "All products"}
        </h1>
        <p className="text-sm text-ink-300">{items.length} products</p>
      </div>

      <div ref={searchContainerRef} className="relative mb-6">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-800/50 px-4 py-3">
          <Search size={18} className="shrink-0 text-ink-400" />
          <input
            type="text"
            value={q}
            onChange={handleSearchChange}
            onFocus={() => setAutocompleteOpen(true)}
            placeholder="Search products, categories, brands…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-ink-400 focus:outline-none"
          />
          {q && (
            <button onClick={clearSearch} className="rounded-full p-0.5 text-ink-400 transition hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
        {autocompleteOpen && q.length >= 2 && (
          <div className="glass-strong absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl p-2 shadow-lift">
            {autocompleteSuggestions.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-ink-400">No suggestions</p>
            )}
            {autocompleteSuggestions.map((s, i) => (
              <button
                key={`${s.type}-${s.text}-${i}`}
                onClick={() => {
                  setAutocompleteOpen(false);
                  trackSelectSuggestion(s.text, s.type);
                  if (s.type === "product" && s.productId) {
                    navigate(`/product/${s.productId}`);
                  } else if (s.type === "category" && s.categoryId) {
                    const p = new URLSearchParams(params);
                    p.set("category", s.categoryId);
                    p.delete("q");
                    setParams(p);
                  } else if (s.type === "brand") {
                    const p = new URLSearchParams(params);
                    p.set("q", s.text);
                    setParams(p);
                  } else {
                    const p = new URLSearchParams(params);
                    p.set("q", s.text);
                    setParams(p);
                  }
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/5"
              >
                <span className="text-white">{s.text}</span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${
                  s.type === "product" ? "text-accent-300" :
                  s.type === "category" ? "text-green-300" :
                  s.type === "brand" ? "text-blue-300" :
                  "text-ink-300"
                }`}>
                  {s.type === "product" ? "Product" :
                   s.type === "category" ? "Category" :
                   s.type === "brand" ? "Brand" : "Search"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!q && recentSearches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass rounded-2xl p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent searches</h3>
            <button
              onClick={() => {
                clearRecentSearches();
              }}
              className="text-xs text-ink-400 hover:text-ink-200"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, i) => (
              <button
                key={i}
                onClick={() => {
                  trackSearch(search, items.length);
                  trackSelectSuggestion(search, "query");
                  const p = new URLSearchParams(params);
                  p.set("q", search);
                  setParams(p);
                }}
                className="chip hover:border-accent-400/40 hover:text-accent-300"
              >
                <svg className="mr-1 h-3 w-3 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {search}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {!q && recentSearches.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass rounded-2xl p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-white">Popular searches</h3>
          <div className="flex flex-wrap gap-2">
            {(topQueries.length > 0
              ? topQueries.slice(0, 8).map((tq) => tq.query)
              : searchSuggestions.slice(0, 8).map((suggestion) => suggestion.query)
            ).map((s) => (
              <button
                key={s}
                onClick={() => {
                  trackSearch(s, items.length);
                  trackSelectSuggestion(s, "query");
                  const p = new URLSearchParams(params);
                  p.set("q", s);
                  setParams(p);
                }}
                className="chip hover:border-accent-400/40 hover:text-accent-300"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {!q && topQueries.length > 0 && recentSearches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 glass rounded-2xl p-4"
        >
          <h3 className="mb-3 text-sm font-semibold text-white">Trending now</h3>
          <div className="flex flex-wrap gap-2">
            {topQueries.slice(0, 6).map((tq) => (
              <button
                key={tq.query}
                onClick={() => {
                  trackSearch(tq.query, items.length);
                  trackSelectSuggestion(tq.query, "query");
                  const p = new URLSearchParams(params);
                  p.set("q", tq.query);
                  setParams(p);
                }}
                className="chip hover:border-accent-400/40 hover:text-accent-300"
              >
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {tq.query}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategory("all")}
          className={`chip ${category === "all" ? "border-accent-400/40 text-accent-300" : ""}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`chip ${category === c.id ? "border-accent-400/40 text-accent-300" : ""}`}
          >
            {c.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="btn-ghost !px-3 !py-2 text-xs"
          >
            <SlidersHorizontal size={13} /> Filters
          </button>
          <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-ink-200">
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
            <ChevronDown size={12} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass mb-6 overflow-hidden rounded-2xl p-5"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-300">Price</p>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPriceKey(p.key)}
                  className={`chip ${priceKey === p.key ? "border-accent-400/40 text-accent-300" : ""}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : items.length === 0 && searchResults.length === 0 && q
          ? (
            <div className="col-span-full py-16 text-center">
              <p className="mb-2 text-sm text-ink-300">
                No products found for "<span className="text-white">{q}</span>"
              </p>
              {didYouMeanSuggestions.length > 0 && (
                <div className="mt-4">
                  <p className="mb-3 text-xs text-ink-400">Did you mean:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {didYouMeanSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          const p = new URLSearchParams(params);
                          p.set("q", s);
                          setParams(p);
                        }}
                        className="chip hover:border-accent-400/40 hover:text-accent-300"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
          : items.length === 0
          ? <p className="col-span-full py-16 text-center text-sm text-ink-300">No products match your filters.</p>
          : items.map((p, i) => {
            const meta = q ? searchResultMeta[p.id] : null;
            return (
              <div key={p.id} className="relative">
                {meta && (
                  <div className="absolute left-2 top-2 z-10 flex gap-1">
                    {meta.bestField === "title" && (
                      <span className="rounded-full bg-accent-500/20 px-1.5 py-0.5 text-[10px] text-accent-300">Best match</span>
                    )}
                    {(meta.bestField === "category" || meta.bestField === "brand") && (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-ink-300">
                        {meta.bestField === "category" ? `Category` : `Brand`}
                      </span>
                    )}
                  </div>
                )}
                <ProductCard product={p} index={i} searchQuery={q} />
              </div>
            );
          })}
      </div>
    </div>
  );
}
