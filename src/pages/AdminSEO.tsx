import { useState, useMemo } from "react";
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  HelpCircle,
  Globe,
  FileText,
  TrendingUp,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  Shield,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import { adminProducts, adminCategories } from "../data/adminMockData";
import type { AdminProduct } from "../types";

const seoIssues = [
  { id: "missing-title", label: "Missing SEO Title", severity: "error", count: 3, description: "Products without custom SEO titles" },
  { id: "missing-description", label: "Missing Meta Description", severity: "error", count: 5, description: "Products without meta descriptions" },
  { id: "title-too-long", label: "SEO Title Too Long", severity: "warning", count: 8, description: "Titles exceeding 60 characters" },
  { id: "title-too-short", label: "SEO Title Too Short", severity: "warning", count: 12, description: "Titles under 30 characters" },
  { id: "desc-too-long", label: "Meta Description Too Long", severity: "warning", count: 6, description: "Descriptions exceeding 160 characters" },
  { id: "desc-too-short", label: "Meta Description Too Short", severity: "warning", count: 15, description: "Descriptions under 120 characters" },
  { id: "missing-keywords", label: "No Keywords Defined", severity: "warning", count: 22, description: "Products without SEO keywords" },
  { id: "too-many-keywords", label: "Too Many Keywords", severity: "info", count: 4, description: "Products with more than 10 keywords" },
  { id: "missing-slug", label: "Missing URL Slug", severity: "error", count: 2, description: "Products without custom slugs" },
  { id: "missing-images", label: "Missing Product Images", severity: "warning", count: 1, description: "Products without images" },
  { id: "short-description", label: "Short Product Description", severity: "info", count: 18, description: "Descriptions under 100 words" },
  { id: "duplicate-titles", label: "Duplicate SEO Titles", severity: "error", count: 3, description: "Products sharing the same SEO title" },
];

export default function AdminSEO() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "score", direction: "asc" });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Compute SEO analysis for all products
  const productsWithSEO = useMemo(() => {
    return adminProducts.map(product => {
      const analysis = analyzeProductSEO(product);
      return { ...product, seoAnalysis: analysis };
    });
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...productsWithSEO];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    if (severityFilter !== "all") {
      result = result.filter(p => {
        const hasError = p.seoAnalysis.issues.some(i => i.severity === "error");
        const hasWarning = p.seoAnalysis.issues.some(i => i.severity === "warning");
        if (severityFilter === "error") return hasError;
        if (severityFilter === "warning") return !hasError && hasWarning;
        if (severityFilter === "good") return !hasError && !hasWarning;
        return true;
      });
    }

    if (categoryFilter !== "all") {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a];
      const bVal = b[sortConfig.key as keyof typeof b];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (bVal == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [productsWithSEO, searchQuery, severityFilter, categoryFilter, sortConfig]);

  const overallStats = useMemo(() => {
    const total = adminProducts.length;
    const withErrors = adminProducts.filter(p => analyzeProductSEO(p).issues.some(i => i.severity === "error")).length;
    const withWarnings = adminProducts.filter(p => {
      const a = analyzeProductSEO(p);
      return a.issues.some(i => i.severity === "warning") && !a.issues.some(i => i.severity === "error");
    }).length;
    const good = total - withErrors - withWarnings;
    const avgScore = Math.round(adminProducts.reduce((sum, p) => sum + analyzeProductSEO(p).score, 0) / total);

    return { total, withErrors, withWarnings, good, avgScore };
  }, []);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return "text-accent-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getSEOScoreBg = (score: number) => {
    if (score >= 80) return "bg-accent-500/20";
    if (score >= 60) return "bg-amber-500/20";
    return "bg-rose-500/20";
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
          <h1 className="text-3xl font-bold text-white">SEO Analysis</h1>
          <p className="text-ink-400 mt-1">Audit and optimize your product catalog for search engines</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost gap-2">
            <RefreshCw className="h-4 w-4" />
            Re-run Audit
          </button>
          <button className="btn-ghost gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </motion.div>

      {/* Overall Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <StatCard
          title="Overall Score"
          value={overallStats.avgScore}
          suffix="/100"
          icon={Target}
          color="from-accent-500 to-accent-600"
          bg="bg-accent-500/10"
          trend={{ value: "+5", positive: true }}
        />
        <StatCard
          title="Excellent"
          value={overallStats.good}
          icon={CheckCircle}
          color="from-accent-500 to-accent-600"
          bg="bg-accent-500/10"
        />
        <StatCard
          title="Needs Improvement"
          value={overallStats.withWarnings}
          icon={AlertCircle}
          color="from-amber-500 to-amber-600"
          bg="bg-amber-500/10"
        />
        <StatCard
          title="Critical Issues"
          value={overallStats.withErrors}
          icon={XCircle}
          color="from-rose-500 to-rose-600"
          bg="bg-rose-500/10"
        />
        <StatCard
          title="Total Products"
          value={overallStats.total}
          icon={FileText}
          color="from-blue-500 to-blue-600"
          bg="bg-blue-500/10"
        />
      </motion.div>

      {/* Issues Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-strong rounded-2xl overflow-hidden"
      >
        <div className="border-b border-white/5 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent-400" />
            Common Issues Across Catalog
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {seoIssues.map((issue) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={`p-4 rounded-xl transition-all ${
                  issue.severity === "error" ? "bg-rose-500/10 border border-rose-500/20" :
                  issue.severity === "warning" ? "bg-amber-500/10 border border-amber-500/20" :
                  "bg-blue-500/10 border border-blue-500/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    issue.severity === "error" ? "bg-rose-500/20 text-rose-400" :
                    issue.severity === "warning" ? "bg-amber-500/20 text-amber-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    {issue.severity === "error" && <XCircle className="h-5 w-5" />}
                    {issue.severity === "warning" && <AlertCircle className="h-5 w-5" />}
                    {issue.severity === "info" && <HelpCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white">{issue.label}</h4>
                    <p className="text-sm text-ink-400 mt-0.5">{issue.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        issue.severity === "error" ? "bg-rose-500/20 text-rose-400" :
                        issue.severity === "warning" ? "bg-amber-500/20 text-amber-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {issue.count} product{issue.count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-ink-400">affected</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
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
              placeholder="Search products, SKU, category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-800/50 border border-white/5 text-white placeholder:text-ink-400 focus:outline-none focus:border-accent-400/50"
            />
          </div>

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
              <FileText className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 transition ${viewMode === "cards" ? "bg-white/5 text-white" : "text-ink-400 hover:text-white"}`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">SEO Status</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="error">Has Errors</option>
                  <option value="warning">Has Warnings</option>
                  <option value="good">Good (No Issues)</option>
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
                  {adminCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Sort By</label>
                <select
                  value={sortConfig.key}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="seoAnalysis.score">SEO Score (Low to High)</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="category">Category</option>
                  <option value="price">Price</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Products Table/Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 cursor-pointer hover:text-white" onClick={() => handleSort("seoAnalysis.score")}>
                    SEO Score
                    {sortConfig.key === "seoAnalysis.score" && (sortConfig.direction === "asc" ? <TrendingUp className="h-4 w-4 inline" /> : <TrendingUp className="h-4 w-4 inline rotate-180" />)}
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Product</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell">Category</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Issues</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell">Title</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden xl:table-cell">Description</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Keywords</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => {
                  const analysis = product.seoAnalysis;

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
                        <div className="flex items-center gap-3">
                          <div className={`${getSEOScoreBg(analysis.score)} rounded-full w-12 h-12 flex items-center justify-center`}>
                            <span className={`text-lg font-bold ${getSEOScoreColor(analysis.score)}`}>{analysis.score}</span>
                          </div>
                          <div>
                            <div className="w-24 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis.score}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${analysis.score >= 80 ? "bg-accent-500" : analysis.score >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                              />
                            </div>
                          </div>
                        </div>
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
                        <span className="chip">{adminCategories.find(c => c.id === product.category)?.name || product.category}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {analysis.issues.slice(0, 3).map((issue, i) => (
                            <span
                              key={i}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                issue.severity === "error" ? "bg-rose-500/20 text-rose-400" :
                                issue.severity === "warning" ? "bg-amber-500/20 text-amber-400" :
                                "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {issue.severity === "error" && <XCircle className="h-2.5 w-2.5 inline" />}
                              {issue.severity === "warning" && <AlertCircle className="h-2.5 w-2.5 inline" />}
                              {issue.severity === "info" && <HelpCircle className="h-2.5 w-2.5 inline" />}
                              {issue.field}
                            </span>
                          ))}
                          {analysis.issues.length > 3 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-ink-800 text-ink-300">
                              +{analysis.issues.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="max-w-xs">
                          <p className="text-sm text-white truncate">{product.seoTitle || "Not set"}</p>
                          {product.seoTitle && product.seoTitle.length > 60 && (
                            <p className="text-[10px] text-rose-400">Too long ({product.seoTitle.length}/60)</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 hidden xl:table-cell">
                        <div className="max-w-xs">
                          <p className="text-sm text-white truncate">{product.seoDescription || "Not set"}</p>
                          {product.seoDescription && product.seoDescription.length > 160 && (
                            <p className="text-[10px] text-rose-400">Too long ({product.seoDescription.length}/160)</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {product.seoKeywords?.map((k, i) => (
                            <span key={i} className="chip bg-ink-800 text-ink-200 text-[10px] px-2 py-0.5">
                              {k}
                            </span>
                          ))}
                          {!product.seoKeywords?.length && (
                            <span className="chip bg-rose-500/10 text-rose-400 text-[10px]">No keywords</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition" title="View on store">
                            <Globe className="h-4 w-4" />
                          </Link>
                          <Link to={`/admin/products/${product.id}/edit`} className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition" title="Edit SEO">
                            <FileText className="h-4 w-4" />
                          </Link>
                          <button className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-accent-400 transition" title="Auto-fix SEO">
                            <Zap className="h-4 w-4" />
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
              const analysis = product.seoAnalysis;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/admin/products/${product.id}/edit`} className="p-1.5 rounded-lg bg-ink-800/50 text-ink-300 hover:text-white hover:bg-white/10 transition"><FileText className="h-3.5 w-3.5" /></Link>
                    <Link to={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-ink-800/50 text-ink-300 hover:text-white hover:bg-white/10 transition"><Globe className="h-3.5 w-3.5" /></Link>
                  </div>
                  <Link to={`/admin/products/${product.id}`} className="block">
                    <img src={product.image} alt={product.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                    <p className="font-medium text-white truncate mb-1">{product.title}</p>
                    <p className="text-sm text-ink-400 mb-3">{product.brand} • {adminCategories.find(c => c.id === product.category)?.name}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`${getSEOScoreBg(analysis.score)} rounded-full w-16 h-16 flex items-center justify-center`}>
                        <span className={`text-xl font-bold ${getSEOScoreColor(analysis.score)}`}>{analysis.score}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {analysis.issues.slice(0, 2).map((issue, i) => (
                          <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            issue.severity === "error" ? "bg-rose-500/20 text-rose-400" :
                            issue.severity === "warning" ? "bg-amber-500/20 text-amber-400" :
                            "bg-blue-500/20 text-blue-400"
                          }`}>
                            {issue.field}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-ink-400">
                      Title: {product.seoTitle?.length || 0}/60 chars • Desc: {product.seoDescription?.length || 0}/160 chars • {product.seoKeywords?.length || 0} keywords
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Search className="h-16 w-16 text-ink-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No products found</h3>
            <p className="text-ink-400">Try adjusting your filters or search query</p>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="border-t border-white/5 p-4 flex items-center justify-between">
            <p className="text-sm text-ink-400">
              Showing {filteredProducts.length} of {adminProducts.length} products
            </p>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition disabled:opacity-50"><ChevronDown className="h-4 w-4 rotate-90" /></button>
              <button className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center">1</button>
              <button className="w-8 h-8 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">2</button>
              <button className="w-8 h-8 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">3</button>
              <button className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"><ChevronDown className="h-4 w-4 rotate--90" /></button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, suffix = "", icon: Icon, color, bg, trend }: {
  title: string; value: number; suffix?: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="glass-strong rounded-2xl p-6 hover:border-accent-400/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-300">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-white">{value}</span>
            {suffix && <span className="text-ink-400">{suffix}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${trend.positive ? "text-accent-400" : "text-rose-400"}`}>
                {trend.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5 rotate-180" />}
                {trend.value} vs last month
              </span>
            </div>
          )}
        </div>
        <div className={`${bg} rounded-xl p-3`}>
          <Icon className={`h-6 w-6 bg-gradient-to-br ${color} bg-clip-text text-transparent`} />
        </div>
      </div>
    </div>
  );
}

function analyzeProductSEO(product: AdminProduct) {
  const issues = [];
  let score = 100;

  if (!product.seoTitle) {
    issues.push({ field: "Missing SEO Title", severity: "error", message: "Missing SEO title", recommendation: "Add a unique, descriptive title under 60 characters" });
    score -= 20;
  } else if (product.seoTitle.length > 60) {
    issues.push({ field: "Title Too Long", severity: "warning", message: "SEO title too long", recommendation: "Keep under 60 characters for optimal display" });
    score -= 10;
  } else if (product.seoTitle.length < 30) {
    issues.push({ field: "Title Too Short", severity: "warning", message: "SEO title could be longer", recommendation: "Aim for 30-60 characters for better click-through" });
    score -= 5;
  }

  if (!product.seoDescription) {
    issues.push({ field: "Missing Meta Description", severity: "error", message: "Missing meta description", recommendation: "Add a compelling description under 160 characters" });
    score -= 20;
  } else if (product.seoDescription.length > 160) {
    issues.push({ field: "Description Too Long", severity: "warning", message: "Meta description too long", recommendation: "Keep under 160 characters" });
    score -= 10;
  } else if (product.seoDescription.length < 120) {
    issues.push({ field: "Description Too Short", severity: "warning", message: "Meta description could be longer", recommendation: "Aim for 120-160 characters" });
    score -= 5;
  }

  const keywords = product.seoKeywords?.filter(Boolean) || [];
  if (keywords.length === 0) {
    issues.push({ field: "No Keywords", severity: "warning", message: "No SEO keywords defined", recommendation: "Add 3-5 relevant keywords" });
    score -= 10;
  } else if (keywords.length > 10) {
    issues.push({ field: "Too Many Keywords", severity: "info", message: "Too many keywords", recommendation: "Focus on 3-5 primary keywords" });
  }

  if (!product.slug) {
    issues.push({ field: "Missing Slug", severity: "error", message: "Missing URL slug", recommendation: "Auto-generate from title or create custom slug" });
    score -= 15;
  }

  if (!product.image) {
    issues.push({ field: "No Image", severity: "warning", message: "No product image", recommendation: "Add at least one high-quality product image" });
    score -= 10;
  }

  if (product.description && product.description.length < 100) {
    issues.push({ field: "Short Description", severity: "info", message: "Product description is short", recommendation: "Longer descriptions rank better in search" });
    score -= 5;
  }

  // Check for duplicate titles (simplified)
  // In real app, this would check against all products

  return { score: Math.max(0, score), issues };
}