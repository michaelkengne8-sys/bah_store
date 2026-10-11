import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Eye,
  Edit,
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  ShoppingCart,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Settings,
  BarChart3,
  X,
} from "lucide-react";
import { adminCustomers, adminOrders } from "../data/adminMockData";
import { adminApi } from "../lib/adminApi";
import type { AdminCustomer, AdminOrder } from "../types";
import { useStore } from "../context/StoreContext";

type CustomerTierConfigItem = { label: string; color: string; icon: React.ComponentType<{ className?: string }>; bg: string; minSpent: number };
type CustomerStatusConfigItem = { label: string; color: string; icon: React.ComponentType<{ className?: string }> };

const tierConfig: Record<string, CustomerTierConfigItem> = {
  bronze: { label: "Bronze", color: "bg-amber-700/20 text-amber-400", icon: Award, bg: "bg-amber-700/10", minSpent: 0 },
  silver: { label: "Silver", color: "bg-ink-300/20 text-ink-300", icon: Award, bg: "bg-ink-300/10", minSpent: 500 },
  gold: { label: "Gold", color: "bg-yellow-500/20 text-yellow-400", icon: Award, bg: "bg-yellow-500/10", minSpent: 2000 },
  platinum: { label: "Platinum", color: "bg-purple-500/20 text-purple-400", icon: Star, bg: "bg-purple-500/10", minSpent: 5000 },
};

const statusConfig: Record<string, CustomerStatusConfigItem> = {
  active: { label: "Active", color: "bg-accent-500/20 text-accent-400", icon: CheckCircle },
  inactive: { label: "Inactive", color: "bg-ink-500/20 text-ink-400", icon: XCircle },
  banned: { label: "Banned", color: "bg-rose-500/20 text-rose-400", icon: AlertTriangle },
};

export default function AdminCustomers() {
  const { pushToast } = useStore();
  const [customers, setCustomers] = useState<AdminCustomer[]>(adminCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState("");

  useEffect(() => {
    let active = true;

    adminApi.getUsers()
      .then((response) => {
        if (!active || !response?.data?.length) return;

        const mapped = response.data.map((rawUser: unknown) => {
          const user = rawUser as Record<string, unknown>;
          const orderCount = (user._count as Record<string, unknown> | undefined)?.orders;

          return {
            id: String(user.id || ""),
            name: String(user.name || ""),
            email: String(user.email || ""),
            phone: user.phone as string | undefined,
            avatar: user.avatar as string | undefined,
            role: String(user.role || "user").toLowerCase() as AdminCustomer["role"],
            status: "active" as AdminCustomer["status"],
            loyaltyTier: String(user.loyaltyTier || "bronze").toLowerCase() as AdminCustomer["loyaltyTier"],
            loyaltyPoints: Number(user.loyaltyPoints || 0),
            emailVerified: Boolean(user.emailVerified),
            twoFactorEnabled: Boolean(user.twoFactorEnabled),
            createdAt: String(user.createdAt || new Date().toISOString()),
            lastLoginAt: user.lastLoginAt as string | undefined,
            totalOrders: Number(orderCount || 0),
            totalSpent: Number(user.totalSpent || 0),
            averageOrderValue: Number(user.averageOrderValue || 0),
            addresses: [],
            tags: [],
            notes: "",
          };
        });

        setCustomers(mapped.length ? mapped : adminCustomers);
      })
      .catch(() => {
        if (active) setCustomers(adminCustomers);
      });

    return () => { active = false; };
  }, []);

  // Enrich customers with order data
  const customersWithOrders = useMemo(() => {
    return customers.map((customer) => {
      const orders = adminOrders.filter((o) => o.userId === customer.id);
      const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
      const totalOrders = orders.length;
      const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrder = orders.length > 0 ? orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;

      return {
        ...customer,
        totalOrders,
        totalSpent: customer.totalSpent || totalSpent,
        averageOrderValue: customer.averageOrderValue || avgOrder,
        lastOrderDate: lastOrder?.createdAt,
        lastOrderId: lastOrder?.id,
      };
    });
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let result = [...customersWithOrders];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      );
    }

    if (tierFilter !== "all") {
      result = result.filter((c) => c.loyaltyTier === tierFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (verifiedFilter !== "all") {
      result = result.filter((c) => c.emailVerified === (verifiedFilter === "verified"));
    }

    if (dateRange !== "all") {
      const now = new Date();
      const rangeMs = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      }[dateRange] || 0;

      if (rangeMs > 0) {
        const cutoff = new Date(now.getTime() - rangeMs);
        result = result.filter((c) => new Date(c.createdAt) >= cutoff);
      }
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a] ?? "";
      const bVal = b[sortConfig.key as keyof typeof b] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [customersWithOrders, searchQuery, tierFilter, statusFilter, verifiedFilter, dateRange, sortConfig]);

  const stats = useMemo(() => {
    const total = adminCustomers.length;
    const active = adminCustomers.filter((c) => c.status === "active").length;
    const inactive = adminCustomers.filter((c) => c.status === "inactive").length;
    const totalRevenue = adminCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgLTV = total > 0 ? totalRevenue / total : 0;

    return { total, active, inactive, totalRevenue, avgLTV };
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map((c) => c.id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedCustomers.length === 0 || !bulkAction) return;

    const action = bulkAction;
    setBulkAction("");
    setSelectedCustomers([]);
    pushToast(`${action} applied to ${selectedCustomers.length} customer(s)`, "success");
  };

  const exportCustomers = () => {
    const data = filteredCustomers.map((c) => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Phone: c.phone || "",
      Status: c.status,
      Tier: c.loyaltyTier,
      Points: c.loyaltyPoints,
      "Email Verified": c.emailVerified ? "Yes" : "No",
      "2FA": c.twoFactorEnabled ? "Yes" : "No",
      "Total Orders": c.totalOrders,
      "Total Spent": c.totalSpent.toFixed(2),
      "Avg Order": c.averageOrderValue.toFixed(2),
      "Joined": new Date(c.createdAt).toLocaleDateString(),
      "Last Login": c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleDateString() : "Never",
    }));
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-ink-400 mt-1">Manage customer accounts and view lifetime value</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCustomers} className="btn-ghost gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button className="btn-ghost gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <StatCard title="Total Customers" value={stats.total} icon={User} color="from-blue-500 to-blue-600" bg="bg-blue-500/10" />
        <StatCard title="Active" value={stats.active} icon={CheckCircle} color="from-accent-500 to-accent-600" bg="bg-accent-500/10" />
        <StatCard title="Inactive" value={stats.inactive} icon={XCircle} color="from-ink-500 to-ink-600" bg="bg-ink-500/10" />
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="from-emerald-500 to-emerald-600" bg="bg-emerald-500/10" />
        <StatCard title="Avg LTV" value={formatCurrency(stats.avgLTV)} icon={TrendingUp} color="from-purple-500 to-purple-600" bg="bg-purple-500/10" />
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
              placeholder="Search customers, email, name..."
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
              <User className="h-4 w-4" />
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
              className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-5 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Loyalty Tier</label>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Tiers</option>
                  <option value="platinum">Platinum</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="bronze">Bronze</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Email Verified</label>
                <select
                  value={verifiedFilter}
                  onChange={(e) => setVerifiedFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Joined</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Sort By</label>
                <select
                  value={sortConfig.key}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="createdAt">Date Joined (Newest)</option>
                  <option value="totalSpent">Total Spent</option>
                  <option value="totalOrders">Total Orders</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="lastLoginAt">Last Login</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedCustomers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-strong rounded-2xl border border-accent-500/30 p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-sm font-medium text-white">
                {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="">Bulk Action...</option>
                  <option value="export">Export Selected</option>
                  <option value="add-points">Add Loyalty Points</option>
                  <option value="upgrade-tier">Upgrade Tier</option>
                  <option value="verify-email">Mark Email Verified</option>
                  <option value="ban">Ban</option>
                  <option value="unban">Unban</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="btn-primary text-sm gap-1"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Apply
                </button>
                <button
                  onClick={() => setSelectedCustomers([])}
                  className="btn-ghost text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customers Table/Cards */}
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
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
                    />
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 cursor-pointer hover:text-white" onClick={() => handleSort("createdAt")}>
                    Customer
                    {sortConfig.key === "createdAt" && (sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />)}
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell">Tier</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell cursor-pointer hover:text-white" onClick={() => handleSort("totalOrders")}>
                    Orders
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell cursor-pointer hover:text-white" onClick={() => handleSort("totalSpent")}>
                    Total Spent
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden xl:table-cell">Avg Order</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden xl:table-cell cursor-pointer hover:text-white" onClick={() => handleSort("lastLoginAt")}>
                    Last Login
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Status</th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <User className="h-12 w-12 text-ink-500 mx-auto mb-3" />
                      <p className="text-ink-400">No customers found</p>
                      <p className="text-sm text-ink-500 mt-1">Try adjusting your filters or search query</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <CustomerRow
                      key={customer.id}
                      customer={customer}
                      index={index}
                      selected={selectedCustomers.includes(customer.id)}
                      onSelect={toggleSelect}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      formatDateTime={formatDateTime}
                      tierConfig={tierConfig}
                      statusConfig={statusConfig}
                      onViewDetail={() => setShowDetailModal(customer.id)}
                      getInitials={getInitials}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full p-12 text-center">
                <User className="h-12 w-12 text-ink-500 mx-auto mb-3" />
                <p className="text-ink-400">No customers found</p>
              </div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  index={index}
                  selected={selectedCustomers.includes(customer.id)}
                  onSelect={toggleSelect}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  tierConfig={tierConfig}
                  statusConfig={statusConfig}
                  onViewDetail={() => setShowDetailModal(customer.id)}
                  getInitials={getInitials}
                />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredCustomers.length > 0 && (
          <div className="border-t border-white/5 p-4 flex items-center justify-between">
            <p className="text-sm text-ink-400">
              Showing {filteredCustomers.length} of {adminCustomers.length} customers
            </p>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
              <button className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center">1</button>
              <button className="w-8 h-8 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">2</button>
              <button className="w-8 h-8 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">3</button>
              <button className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDetailModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface rounded-2xl border border-white/5 max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <CustomerDetailModal
                customer={adminCustomers.find((c) => c.id === showDetailModal)!}
                orders={adminOrders.filter((o) => o.userId === showDetailModal)}
                onClose={() => setShowDetailModal(null)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
                tierConfig={tierConfig}
                statusConfig={statusConfig}
                getInitials={getInitials}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: { title: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
  return (
    <div className="glass-strong rounded-2xl p-6 hover:border-accent-400/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-300">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`${bg} rounded-xl p-3`}>
          <Icon className={`h-6 w-6 bg-gradient-to-br ${color} bg-clip-text text-transparent`} />
        </div>
      </div>
    </div>
  );
}

function CustomerRow({
  customer,
  index,
  selected,
  onSelect,
  formatCurrency,
  formatDate,
  formatDateTime,
  tierConfig,
  statusConfig,
  onViewDetail,
  getInitials,
}: {
  customer: AdminCustomer & { totalOrders: number; totalSpent: number; averageOrderValue: number; lastOrderDate?: string; lastOrderId?: string };
  index: number;
  selected: boolean;
  onSelect: (_id: string) => void;
  formatCurrency: (_amount: number) => string;
  formatDate: (_dateString: string) => string;
  formatDateTime: (_dateString: string) => string;
  tierConfig: Record<string, CustomerTierConfigItem>;
  statusConfig: Record<string, CustomerStatusConfigItem>;
  onViewDetail: () => void;
  getInitials: (_name: string) => string;
}) {
  const tConfig = tierConfig[customer.loyaltyTier] || tierConfig.bronze;
  const sConfig = statusConfig[customer.status] || statusConfig.active;
  const TIcon = tConfig.icon;
  const SIcon = sConfig.icon;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`${selected ? "bg-accent-500/5" : "hover:bg-white/5"} transition-colors cursor-pointer`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "BUTTON" && !target.closest("button")) {
          onViewDetail();
        }
      }}
    >
      <td className="p-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(customer.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
        />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-ink-300 font-medium">
            {customer.avatar ? (
              <img src={customer.avatar} alt="" className="h-10 w-10 rounded-xl" />
            ) : (
              getInitials(customer.name)
            )}
          </div>
          <div>
            <div className="font-medium text-white">{customer.name}</div>
            <div className="text-sm text-ink-400">{customer.email}</div>
            <div className="text-xs text-ink-500">ID: {customer.id}</div>
          </div>
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tConfig.color}`}>
          <TIcon className="h-3 w-3" />
          {tConfig.label}
        </span>
        <div className="text-xs text-ink-400 mt-1">{customer.loyaltyPoints.toLocaleString()} pts</div>
      </td>
      <td className="p-4 hidden lg:table-cell">
        <div className="flex items-center gap-1 text-white font-medium">
          <ShoppingCart className="h-4 w-4 text-ink-400" />
          {customer.totalOrders}
        </div>
      </td>
      <td className="p-4 hidden lg:table-cell font-medium text-white">
        {formatCurrency(customer.totalSpent)}
      </td>
      <td className="p-4 hidden xl:table-cell text-sm text-ink-400">
        {formatCurrency(customer.averageOrderValue)}
      </td>
      <td className="p-4 hidden xl:table-cell">
        <div className="text-sm text-white">{customer.lastLoginAt ? formatDate(customer.lastLoginAt) : "Never"}</div>
        {customer.lastLoginAt && (
          <div className="text-xs text-ink-400">{formatDateTime(customer.lastLoginAt)}</div>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${sConfig.color}`}>
            <SIcon className="h-3 w-3" />
            {sConfig.label}
          </span>
          {customer.emailVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
              <CheckCircle className="h-2.5 w-2.5" />
              Verified
            </span>
          )}
          {customer.twoFactorEnabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 text-blue-400 px-2 py-0.5 text-[10px] font-medium">
              <Settings className="h-2.5 w-2.5" />
              2FA
            </span>
          )}
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
            className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
            title="More actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

function CustomerCard({
  customer,
  index,
  selected,
  onSelect,
  formatCurrency,
  formatDate,
  tierConfig,
  statusConfig,
  onViewDetail,
  getInitials,
}: {
  customer: AdminCustomer & { totalOrders: number; totalSpent: number; averageOrderValue: number; lastOrderDate?: string; lastOrderId?: string };
  index: number;
  selected: boolean;
  onSelect: (_id: string) => void;
  formatCurrency: (_amount: number) => string;
  formatDate: (_dateString: string) => string;
  tierConfig: Record<string, CustomerTierConfigItem>;
  statusConfig: Record<string, CustomerStatusConfigItem>;
  onViewDetail: () => void;
  getInitials: (_name: string) => string;
}) {
  const tConfig = tierConfig[customer.loyaltyTier] || tierConfig.bronze;
  const sConfig = statusConfig[customer.status] || statusConfig.active;
  const TIcon = tConfig.icon;
  const SIcon = sConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className={`relative p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group ${selected ? "ring-2 ring-accent-500/50 bg-accent-500/5" : ""}`}
      onClick={onViewDetail}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(customer.id)}
        className="absolute top-4 left-4 w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
      />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-ink-300 font-medium text-lg">
            {customer.avatar ? (
              <img src={customer.avatar} alt="" className="h-12 w-12 rounded-xl" />
            ) : (
              getInitials(customer.name)
            )}
          </div>
          <div>
            <p className="font-medium text-white">{customer.name}</p>
            <p className="text-sm text-ink-400">{customer.email}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sConfig.color}`}>
          <SIcon className="h-2.5 w-2.5" />
          {sConfig.label}
        </span>
      </div>

      <div className="mb-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tConfig.color}`}>
          <TIcon className="h-3 w-3" />
          {tConfig.label}
        </span>
        <span className="ml-2 text-xs text-ink-400">{customer.loyaltyPoints.toLocaleString()} pts</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
        <div className="p-3 rounded-xl bg-ink-800/50">
          <div className="font-bold text-white">{customer.totalOrders}</div>
          <div className="text-xs text-ink-400">Orders</div>
        </div>
        <div className="p-3 rounded-xl bg-ink-800/50">
          <div className="font-bold text-white">{formatCurrency(customer.totalSpent)}</div>
          <div className="text-xs text-ink-400">Total Spent</div>
        </div>
        <div className="p-3 rounded-xl bg-ink-800/50">
          <div className="font-bold text-white">{formatCurrency(customer.averageOrderValue)}</div>
          <div className="text-xs text-ink-400">Avg Order</div>
        </div>
      </div>

      <div className="pt-3 border-t border-white/5">
        <div className="text-xs text-ink-400 mb-1">Joined {formatDate(customer.createdAt)}</div>
        <div className="text-xs text-ink-400">Last login: {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : "Never"}</div>
      </div>
    </motion.div>
  );
}

function CustomerDetailModal({
  customer,
  orders,
  onClose,
  formatCurrency,
  formatDate,
  formatDateTime,
  tierConfig,
  statusConfig,
  getInitials,
}: {
  customer: AdminCustomer;
  orders: AdminOrder[];
  onClose: () => void;
  formatCurrency: (_amount: number) => string;
  formatDate: (_dateString: string) => string;
  formatDateTime: (_dateString: string) => string;
  tierConfig: Record<string, CustomerTierConfigItem>;
  statusConfig: Record<string, CustomerStatusConfigItem>;
  getInitials: (_name: string) => string;
}) {
  const tConfig = tierConfig[customer.loyaltyTier] || tierConfig.bronze;
  const sConfig = statusConfig[customer.status] || statusConfig.active;
  const TIcon = tConfig.icon;
  const SIcon = sConfig.icon;
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const avgOrder = orders.length > 0 ? totalSpent / orders.length : 0;

  // Recent activity - combine orders and mock activity
  const recentActivity = orders.slice(0, 5).map((order) => ({
    type: "order",
    title: `Order ${order.id}`,
    description: `${order.items.length} item${order.items.length !== 1 ? "s" : ""} • ${formatCurrency(order.total)}`,
    timestamp: order.createdAt,
    status: order.status,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/5 p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-ink-300 font-bold text-2xl flex-shrink-0">
            {customer.avatar ? <img src={customer.avatar} alt="" className="h-16 w-16 rounded-2xl" /> : getInitials(customer.name)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{customer.name}</h2>
            <p className="text-sm text-ink-400">{customer.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tConfig.color}`}>
                <TIcon className="h-3 w-3" />
                {tConfig.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sConfig.color}`}>
                <SIcon className="h-3 w-3" />
                {sConfig.label}
              </span>
              {customer.emailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Verified
                </span>
              )}
              {customer.twoFactorEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 text-blue-400 px-2 py-0.5 text-[10px] font-medium">
                  <Settings className="h-2.5 w-2.5" />
                  2FA
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-400">ID: {customer.id}</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 overflow-y-auto flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatMini title="Total Orders" value={customer.totalOrders} icon={ShoppingCart} />
              <StatMini title="Total Spent" value={formatCurrency(totalSpent)} icon={DollarSign} />
              <StatMini title="Avg Order" value={formatCurrency(avgOrder)} icon={TrendingUp} />
              <StatMini title="Loyalty Points" value={customer.loyaltyPoints.toLocaleString()} icon={Star} />
            </section>

            {/* Orders */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-accent-400" />
                  Orders ({orders.length})
                </h3>
                {orders.length > 5 && (
                  <span className="text-sm text-ink-400">Showing 5 of {orders.length}</span>
                )}
              </div>
              <div className="glass-strong rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Order</th>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell">Date</th>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell">Items</th>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Status</th>
                      <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-ink-400">No orders yet</td>
                      </tr>
                    ) : (
                      orders.slice(0, 5).map((order) => {
                        const sConfig = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.active;
                        const SIcon = sConfig.icon;
                        return (
                          <tr key={order.id} className="hover:bg-white/5">
                            <td className="p-4 font-mono text-sm text-white">{order.id}</td>
                            <td className="p-4 hidden md:table-cell text-sm text-ink-400">{formatDate(order.createdAt)}</td>
                            <td className="p-4 hidden lg:table-cell text-sm text-ink-400">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${sConfig.color}`}>
                                <SIcon className="h-3 w-3" />
                                {sConfig.label}
                              </span>
                            </td>
                            <td className="p-4 text-right font-medium text-white">{formatCurrency(order.total)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-400" />
                Recent Activity
              </h3>
              <div className="glass-strong rounded-xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {recentActivity.map((activity) => (
                    <div key={activity.timestamp} className="p-4 hover:bg-white/5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                          <Package className="h-4 w-4 text-accent-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{activity.title}</p>
                          <p className="text-sm text-ink-400 mt-0.5">{activity.description}</p>
                          <p className="text-xs text-ink-500 mt-1">{formatDateTime(activity.timestamp)}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          activity.status === "delivered" ? "bg-emerald-500/20 text-emerald-400" :
                          activity.status === "shipped" ? "bg-accent-500/20 text-accent-400" :
                          activity.status === "cancelled" ? "bg-rose-500/20 text-rose-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <div className="p-8 text-center text-ink-400">No recent activity</div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Contact Info */}
            <section className="glass-strong rounded-xl p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-accent-400" />
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-ink-400">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-white">{customer.email}</span>
                  {customer.emailVerified && <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />}
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-ink-400">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="text-white">{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-ink-400">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Joined {formatDate(customer.createdAt)}</span>
                </div>
              </div>
            </section>

            {/* Addresses */}
            {customer.addresses.length > 0 && (
              <section className="glass-strong rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent-400" />
                  Addresses ({customer.addresses.length})
                </h3>
                <div className="space-y-4">
                  {customer.addresses.map((addr, i) => (
                    <div key={i} className="p-3 rounded-lg bg-ink-800/50 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-ink-400 uppercase tracking-wider capitalize">{addr.type}</span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/20 text-accent-400 px-2 py-0.5 text-[10px] font-medium">
                            <Star className="h-2.5 w-2.5" />
                            Default
                          </span>
                        )}
                      </div>
                      <address className="text-sm text-white not-italic space-y-1">
                        <p>{addr.firstName} {addr.lastName}</p>
                        <p>{addr.address}{addr.apartment ? `, ${addr.apartment}` : ""}</p>
                        <p>{addr.city}, {addr.state} {addr.zip}</p>
                        <p>{addr.country}</p>
                      </address>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tags & Notes */}
            {(customer.tags?.length || customer.notes) && (
              <section className="glass-strong rounded-xl p-4 space-y-4">
                {customer.tags?.length && (
                  <div>
                    <h4 className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag) => (
                        <span key={tag} className="chip bg-ink-800 text-ink-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {customer.notes && (
                  <div className="pt-4 border-t border-white/5">
                    <h4 className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">Notes</h4>
                    <p className="text-sm text-ink-300 whitespace-pre-wrap">{customer.notes}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({ title, value, icon: Icon }: { title: string; value: number | string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="glass-strong rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          <Icon className="h-4 w-4 text-accent-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-ink-400">{title}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}