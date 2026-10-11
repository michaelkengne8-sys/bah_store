import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Edit,
  RefreshCw,
  Tag,
  Settings,
  BarChart3,
  Filter,
  Search,
} from "lucide-react";
import { adminApi, type DashboardStats } from "../lib/adminApi";
import { useStore } from "../context/StoreContext";

const stockConfig: Record<string, { label: string; color: string }> = {
  in_stock: { label: "In Stock", color: "bg-accent-500/20 text-accent-400" },
  low_stock: { label: "Low Stock", color: "bg-amber-500/20 text-amber-400" },
  out_of_stock: { label: "Out of Stock", color: "bg-rose-500/20 text-rose-400" },
};

export default function AdminDashboard() {
  const { pushToast } = useStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch {
      pushToast("Failed to load dashboard stats from API", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    let cancelled = false;
    adminApi.getDashboardStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) pushToast("Failed to load dashboard stats from API", "error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pushToast]);

  const safeStats = useMemo(() => stats || {
    totalProducts: 0, totalOrders: 0, totalUsers: 0, totalRevenue: 0,
    lowStockProducts: 0, recentProducts: [], recentOrders: [],
    categories: [], monthlyRevenue: [],
  }, [stats]);

  const statCards = useMemo(() => [
    {
      title: "Total Products",
      value: safeStats.totalProducts,
      change: `${safeStats.recentProducts.length} recent`,
      changeType: "positive" as const,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-500/10",
      link: "/admin/products",
    },
    {
      title: "Total Orders",
      value: safeStats.totalOrders.toLocaleString(),
      change: `${safeStats.recentOrders.filter((o: { status: string }) => o.status === "PENDING" || o.status === "PROCESSING").length} pending`,
      changeType: "positive" as const,
      icon: ShoppingCart,
      color: "from-accent-500 to-accent-600",
      bg: "bg-accent-500/10",
      link: "/admin/orders",
    },
    {
      title: "Total Revenue",
      value: `$${(safeStats.totalRevenue / 1000).toFixed(0)}K`,
      change: `${safeStats.monthlyRevenue.length} months tracked`,
      changeType: "positive" as const,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      bg: "bg-green-500/10",
      link: "/admin/orders",
    },
    {
      title: "Customers",
      value: safeStats.totalUsers.toLocaleString(),
      change: `${safeStats.lowStockProducts} low stock items`,
      changeType: safeStats.lowStockProducts > 0 ? "negative" as const : "positive" as const,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bg: "bg-purple-500/10",
      link: "/admin/customers",
    },
  ], [safeStats]);

  const recentProducts = safeStats.recentProducts;
  const lowStockProducts = useMemo(
    () => safeStats.recentProducts.filter(p => p.stock === "LOW_STOCK" || p.stock === "OUT_OF_STOCK"),
    [safeStats.recentProducts]
  );

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-accent-400 mx-auto mb-4" />
          <p className="text-ink-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-ink-400 mt-1">Overview of your store performance and activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchDashboard} className="btn-ghost gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link to="/admin/products" className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
            className="glass-strong rounded-2xl p-6 hover:border-accent-400/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ink-300">{stat.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-3">
                  <span className={`text-sm font-medium ${stat.changeType === "positive" ? "text-accent-400" : "text-rose-400"}`}>
                    {stat.changeType === "positive" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`${stat.bg} rounded-xl p-3`}>
                <stat.icon className={`h-6 w-6 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
              </div>
            </div>
            <Link
              to={stat.link}
              className="mt-4 inline-flex items-center gap-1 text-sm text-accent-300 hover:text-accent-200 font-medium transition"
            >
              View details <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Products & Low Stock */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Products */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-strong rounded-2xl overflow-hidden"
          >
            <div className="border-b border-white/5 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-accent-500/10 rounded-xl p-2">
                  <Package className="h-5 w-5 text-accent-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Recent Products</h2>
                  <p className="text-sm text-ink-400">Latest products added to your catalog</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/admin/products" className="btn-ghost text-sm gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Link>
                <Link to="/admin/products/new" className="btn-primary text-sm gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add Product
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Product</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell">Category</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell">Stock</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Price</th>
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Added</th>
                    <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentProducts.map((product) => {
                    const images = typeof product.images === "string" ? JSON.parse(product.images) : (product.images || []);
                    const imageUrl = Array.isArray(images) ? images[0] : "";
                    return (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <Link to={`/admin/products/${product.id}`} className="flex items-center gap-3">
                            <img
                              src={imageUrl}
                              alt={product.title}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-medium text-white">{product.title}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="chip">—</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${stockConfig[product.stock?.toLowerCase().replace(/_/g, "-")]?.color || "bg-white/5 text-ink-300"}`}>
                            {product.stock?.replace(/_/g, " ") || "N/A"}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-white">
                          ${Number(product.price).toFixed(2)}
                        </td>
                        <td className="p-4 text-sm text-ink-400 hidden md:table-cell">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/admin/products/${product.id}/edit`} className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {recentProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-ink-400">No products yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/5 p-4 sm:p-6">
              <Link to="/admin/products" className="text-sm text-accent-300 hover:text-accent-200 font-medium flex items-center gap-1">
                View all products <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.section>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="glass-strong rounded-2xl border border-amber-500/20 overflow-hidden"
            >
              <div className="border-b border-amber-500/20 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 rounded-xl p-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Low Stock Alert</h2>
                    <p className="text-sm text-ink-400">{lowStockProducts.length} product{lowStockProducts.length !== 1 ? "s" : ""} need attention</p>
                  </div>
                </div>
                <Link to="/admin/products?stock=low" className="btn-ghost text-sm gap-1">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lowStockProducts.map((product) => {
                    const images = typeof product.images === "string" ? JSON.parse(product.images) : (product.images || []);
                    const imageUrl = Array.isArray(images) ? images[0] : "";
                    return (
                      <Link
                        key={product.id}
                        to={`/admin/products/${product.id}/edit`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                      >
                        <img src={imageUrl} alt={product.title} className="h-10 w-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{product.title}</p>
                          <p className="text-sm text-ink-400">Stock: {product.stock}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${stockConfig[product.stock?.toLowerCase().replace(/_/g, "-")]?.color || "bg-white/5 text-ink-300"}`}>
                          {product.stock?.replace(/_/g, " ")}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}
        </div>

        {/* Right Column - Category Performance & Quick Actions */}
        <div className="space-y-6">
          {/* Category Performance */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="glass-strong rounded-2xl overflow-hidden"
          >
            <div className="border-b border-white/5 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/10 rounded-xl p-2">
                  <BarChart3 className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Top Categories</h2>
                  <p className="text-sm text-ink-400">Products by category</p>
                </div>
              </div>
              <Link to="/admin/categories" className="text-sm text-accent-300 hover:text-accent-200 font-medium">View all</Link>
            </div>
            <div className="p-4 sm:p-6 pt-0 space-y-3">
              {safeStats.categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-ink-300 text-lg font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{cat.name}</p>
                    <p className="text-sm text-ink-400">{cat.count} products</p>
                  </div>
                </motion.div>
              ))}
              {safeStats.categories.length === 0 && (
                <p className="text-sm text-ink-400 text-center py-4">No categories found</p>
              )}
            </div>
          </motion.section>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-strong rounded-2xl overflow-hidden"
          >
            <div className="border-b border-white/5 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="bg-ink-800/50 rounded-xl p-2">
                  <Settings className="h-5 w-5 text-ink-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                  <p className="text-sm text-ink-400">Common administrative tasks</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 pt-0 grid grid-cols-2 gap-3">
              <Link to="/admin/products/new" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition text-center">
                <Plus className="h-6 w-6 text-accent-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Add Product</p>
              </Link>
              <Link to="/admin/categories/new" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition text-center">
                <Tag className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Add Category</p>
              </Link>
              <Link to="/admin/orders" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition text-center">
                <ShoppingCart className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Manage Orders</p>
              </Link>
              <Link to="/admin/seo" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition text-center">
                <Search className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">SEO Audit</p>
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
