import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Globe,
  ExternalLink,
  Archive,
} from "lucide-react";
import { adminCategories as mockAdminCategories } from "../data/adminMockData";
import { adminApi, type Category as ApiCategory } from "../lib/adminApi";
import type { AdminProduct, AdminCategory } from "../types";
import { hydrateProducts, products as storefrontProducts, deleteProduct as deleteStoredProduct, bulkUpdateProducts, createProduct } from "../lib/productStore";

// SEO Analysis helper
const analyzeSEO = (product: Partial<AdminProduct>) => {
  const issues = [];
  const suggestions = [];
  let score = 100;

  // Title checks
  if (!product.seoTitle) {
    issues.push({ field: "seoTitle", severity: "error", message: "Missing SEO title", recommendation: "Add a unique, descriptive title under 60 characters" });
    score -= 15;
  } else if (product.seoTitle.length > 60) {
    issues.push({ field: "seoTitle", severity: "warning", message: "SEO title too long", recommendation: "Keep under 60 characters for optimal display" });
    score -= 5;
  } else if (product.seoTitle.length < 30) {
    suggestions.push("Consider a longer, more descriptive title (30-60 characters)");
  }

  // Description checks
  if (!product.seoDescription) {
    issues.push({ field: "seoDescription", severity: "error", message: "Missing meta description", recommendation: "Add a compelling description under 160 characters" });
    score -= 15;
  } else if (product.seoDescription.length > 160) {
    issues.push({ field: "seoDescription", severity: "warning", message: "Meta description too long", recommendation: "Keep under 160 characters" });
    score -= 5;
  } else if (product.seoDescription.length < 120) {
    suggestions.push("Consider expanding description to 120-160 characters for better click-through");
  }

  // Keywords
  if (!product.seoKeywords || product.seoKeywords.length === 0) {
    issues.push({ field: "seoKeywords", severity: "warning", message: "No SEO keywords defined", recommendation: "Add 3-5 relevant keywords" });
    score -= 10;
  } else if (product.seoKeywords.length > 10) {
    issues.push({ field: "seoKeywords", severity: "info", message: "Too many keywords", recommendation: "Focus on 3-5 primary keywords" });
  }

  // Slug
  if (!product.slug) {
    issues.push({ field: "slug", severity: "error", message: "Missing URL slug", recommendation: "Auto-generate from title or create custom slug" });
    score -= 10;
  }

  // Content checks
  if (product.description && product.description.length < 100) {
    suggestions.push("Product description could be more detailed for better SEO");
  }

  if (!product.image) {
    issues.push({ field: "image", severity: "warning", message: "No product image", recommendation: "Add at least one high-quality product image" });
    score -= 10;
  }

  return { score: Math.max(0, score), issues, suggestions };
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<AdminProduct[]>(storefrontProducts as AdminProduct[]);
  const [categories, setCategories] = useState(mockAdminCategories);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [stockFilter, setStockFilter] = useState(searchParams.get("stock") || "all");
  const [sortConfig, setSortConfig] = useState({ key: "updatedAt", direction: "desc" });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // SEO Analysis state
  const seoAnalysis = useMemo(() => {
    const analysis: Record<string, ReturnType<typeof analyzeSEO>> = {};
    products.forEach(p => {
      analysis[p.id] = analyzeSEO(p);
    });
    return analysis;
  }, [products]);

  useEffect(() => {
    let active = true;
    hydrateProducts().then((nextProducts) => {
      if (active) {
        setProducts(nextProducts as AdminProduct[]);
      }
    });
    adminApi.getCategories().then((data) => {
      if (active && data.data?.length) {
        setCategories(data.data.map((c: ApiCategory) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image: c.image || "",
          icon: c.icon || "",
          productCount: c._count?.products || c.productCount || 0,
          seoTitle: c.seoTitle || "",
          seoDescription: c.seoDescription || "",
          status: (c.status || "active") as "active" | "inactive",
          sortOrder: c.sortOrder || 0,
          productFields: (c.productFields || []) as AdminCategory["productFields"],
        } as AdminCategory)));
      }
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (stockFilter !== "all") params.set("stock", stockFilter);
    setSearchParams(params, { replace: true });
  }, [searchQuery, statusFilter, categoryFilter, stockFilter, setSearchParams]);


  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter(p => p.category === categoryFilter);
    }

    if (stockFilter !== "all") {
      result = result.filter(p => p.stock === stockFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof AdminProduct];
      const bVal = b[sortConfig.key as keyof AdminProduct];
      if (aVal == null || bVal == null) return 0;
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchQuery, statusFilter, categoryFilter, stockFilter, sortConfig]);

  const statusConfig = {
    published: { label: "Published", color: "bg-accent-500/20 text-accent-400", icon: CheckCircle },
    draft: { label: "Draft", color: "bg-amber-500/20 text-amber-400", icon: Clock },
    archived: { label: "Archived", color: "bg-rose-500/20 text-rose-400", icon: XCircle },
  };

  const stockConfig = {
    in_stock: { label: "In Stock", color: "bg-accent-500/20 text-accent-400" },
    low_stock: { label: "Low Stock", color: "bg-amber-500/20 text-amber-400" },
    out_of_stock: { label: "Out of Stock", color: "bg-rose-500/20 text-rose-400" },
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) return;

    if (action === "delete" && !confirm(`Delete ${selectedProducts.length} product(s)? This cannot be undone.`)) {
      return;
    }

    await bulkUpdateProducts(selectedProducts, action);
    const fresh = await hydrateProducts();
    setProducts(fresh as AdminProduct[]);
    if (action === "delete") setSelectedProducts([]);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const duplicateProduct = async (product: AdminProduct) => {
    const newProduct: AdminProduct = {
      ...product,
      id: `p${Date.now()}`,
      title: `${product.title} (Copy)`,
      slug: `${product.slug}-copy`,
      sku: `${product.sku}-CPY`,
      status: "draft",
      featured: false,
      variants: product.variants.map(v => ({ ...v, id: `v${Date.now()}-${Math.random()}`, sku: `${v.sku}-CPY` })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await createProduct(newProduct);
    navigate(`/admin/products/${newProduct.id}/edit`);
  };

  const deleteProduct = async (id: string) => {
    await deleteStoredProduct(id);
    const fresh = await hydrateProducts();
    setProducts(fresh as AdminProduct[]);
    setShowDeleteModal(null);
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return "text-accent-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-ink-400 mt-1">Manage your product catalog, inventory, and SEO</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="btn-ghost gap-2">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <Link to="/admin/products/new" className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="glass-strong rounded-2xl p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, SKU, brand..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-800/50 border border-white/5 text-white placeholder:text-ink-400 focus:outline-none focus:border-accent-400/50 focus:ring-1 focus:ring-accent-400/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost gap-2 ${showFilters ? "bg-accent-500/10 text-accent-300 border-accent-500/30" : ""}`}
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 transition ${viewMode === "table" ? "bg-white/5 text-white" : "text-ink-400 hover:text-white"}`}
              >
                <Package className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition ${viewMode === "grid" ? "bg-white/5 text-white" : "text-ink-400 hover:text-white"}`}
              >
                <Globe className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Stock</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Sort By</label>
                <select
                  value={sortConfig.key}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="updatedAt">Recently Updated</option>
                  <option value="createdAt">Date Added</option>
                  <option value="title">Name (A-Z)</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock Level</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-strong rounded-2xl border border-accent-500/30 p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-sm font-medium text-white">
                {selectedProducts.length} product{selectedProducts.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction("publish")}
                  className="btn-primary text-sm gap-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Publish
                </button>
                <button
                  onClick={() => handleBulkAction("archive")}
                  className="btn-ghost text-sm gap-1"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="btn-ghost text-sm gap-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="btn-ghost text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table/Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl overflow-hidden"
      >
        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
                    />
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Product</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell">Category</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell">Status</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell">Stock</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">SEO Score</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Price</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Updated</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => {
                  const analysis = seoAnalysis[product.id];
                  return (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
                        />
                      </td>
                      <td className="p-4">
                        <Link to={`/admin/products/${product.id}`} className="flex items-center gap-3">
                          <img src={product.image} alt={product.title} className="h-12 w-12 rounded-lg object-cover" />
                          <div>
                            <p className="font-medium text-white">{product.title}</p>
                            <p className="text-sm text-ink-400">{product.brand} • SKU: {product.sku}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="chip">{categories.find(c => c.id === product.category)?.name || product.category}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {(() => {
                          const StatusIcon = statusConfig[product.status].icon;
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[product.status].color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig[product.status].label}
                            </span>
                          );
                        })()}
                        {product.featured && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-400 px-2 py-1 text-[10px] font-bold">
                            <Star className="h-3 w-3" /> Featured
                          </span>
                        )}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${stockConfig[product.stock].color}`}>
                          {stockConfig[product.stock].label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className={`w-24 h-2 rounded-full bg-ink-800 overflow-hidden`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis?.score || 0}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  (analysis?.score || 0) >= 80 ? "bg-accent-500" :
                                  (analysis?.score || 0) >= 60 ? "bg-amber-500" : "bg-rose-500"
                                }`}
                              />
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${getSEOScoreColor(analysis?.score || 0)}`}>
                            {analysis?.score || 0}
                          </span>
                          {(analysis?.issues?.length || 0) > 0 && (
                            <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                              {(analysis?.issues?.filter(i => i.severity === "error").length || 0)} issues
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-white">
                        ${product.price}
                        {product.originalPrice > product.price && (
                          <span className="ml-2 text-sm text-ink-400 line-through">${product.originalPrice}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-ink-400">
                        {new Date(product.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/product/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
                            title="View on store"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => duplicateProduct(product)}
                            className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(product.id)}
                            className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-rose-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const analysis = seoAnalysis[product.id];
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                >
                  <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      className="p-1.5 rounded-lg bg-ink-800/50 text-ink-300 hover:text-white hover:bg-white/10 transition"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(product.id)}
                      className="p-1.5 rounded-lg bg-ink-800/50 text-ink-300 hover:text-rose-400 hover:bg-white/10 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Link to={`/admin/products/${product.id}`} className="block">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <p className="font-medium text-white truncate">{product.title}</p>
                    <p className="text-sm text-ink-400 mb-2">{product.brand} • {categories.find(c => c.id === product.category)?.name}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig[product.status].color}`}>
                        {statusConfig[product.status].label}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${stockConfig[product.stock].color}`}>
                        {stockConfig[product.stock].label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">${product.price}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <div className={`w-16 h-1.5 rounded-full bg-ink-800 overflow-hidden`}>
                          <div className={`h-full rounded-full transition-all ${
                            (analysis?.score || 0) >= 80 ? "bg-accent-500" :
                            (analysis?.score || 0) >= 60 ? "bg-amber-500" : "bg-rose-500"
                          }`} style={{ width: `${analysis?.score || 0}%` }} />
                        </div>
                        <span className={getSEOScoreColor(analysis?.score || 0)}>{analysis?.score || 0}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Package className="h-16 w-16 text-ink-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No products found</h3>
            <p className="text-ink-400 mb-4">Try adjusting your filters or search query</p>
            <Link to="/admin/products/new" className="btn-primary gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Product
            </Link>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="border-t border-white/5 p-4 flex items-center justify-between">
            <p className="text-sm text-ink-400">
              Showing {filteredProducts.length} of {products.length} products
            </p>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center">1</button>
              <button className="w-8 h-8 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">2</button>
              <button className="w-8 h-8 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">3</button>
              <button className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface rounded-2xl border border-white/5 max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Delete Product</h3>
              </div>
              <p className="text-ink-300 mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteProduct(showDeleteModal)}
                  className="btn-ghost text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}