import { useState, useMemo, useEffect } from "react";
import type React from "react";
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
  MoreVertical,
  Truck,
  CreditCard,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  MapPin,
  Package2,
  RotateCcw,
  Flag,
  Star,
  User,
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";
import { adminOrders } from "../data/adminMockData";
import { adminApi } from "../lib/adminApi";
import type { AdminOrder, AdminOrderTimelineEvent } from "../types";
import { useStore } from "../context/StoreContext";

type StatusConfigItem = { label: string; color: string; icon: React.ComponentType<{ className?: string }>; bg?: string };
const statusConfig: Record<string, StatusConfigItem> = {
  pending: { label: "Pending", color: "bg-blue-500/20 text-blue-400", icon: Clock, bg: "bg-blue-500/10" },
  processing: { label: "Processing", color: "bg-purple-500/20 text-purple-400", icon: Loader2, bg: "bg-purple-500/10" },
  shipped: { label: "Shipped", color: "bg-accent-500/20 text-accent-400", icon: Truck, bg: "bg-accent-500/10" },
  delivered: { label: "Delivered", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle, bg: "bg-emerald-500/10" },
  cancelled: { label: "Cancelled", color: "bg-rose-500/20 text-rose-400", icon: XCircle, bg: "bg-rose-500/10" },
  refunded: { label: "Refunded", color: "bg-amber-500/20 text-amber-400", icon: RotateCcw, bg: "bg-amber-500/10" },
};

const paymentConfig: Record<string, StatusConfigItem> = {
  paid: { label: "Paid", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  pending: { label: "Pending", color: "bg-amber-500/20 text-amber-400", icon: Clock },
  refunded: { label: "Refunded", color: "bg-rose-500/20 text-rose-400", icon: RotateCcw },
  failed: { label: "Failed", color: "bg-rose-500/20 text-rose-400", icon: XCircle },
  partial: { label: "Partial", color: "bg-blue-500/20 text-blue-400", icon: AlertCircle },
};

const fulfillmentConfig: Record<string, StatusConfigItem> = {
  unfulfilled: { label: "Unfulfilled", color: "bg-ink-500/20 text-ink-400", icon: Package },
  partial: { label: "Partially Fulfilled", color: "bg-amber-500/20 text-amber-400", icon: Package2 },
  fulfilled: { label: "Fulfilled", color: "bg-accent-500/20 text-accent-400", icon: CheckCircle },
  returned: { label: "Returned", color: "bg-rose-500/20 text-rose-400", icon: RotateCcw },
};

export default function AdminOrders() {
  const { pushToast } = useStore();
  const [orders, setOrders] = useState<AdminOrder[]>(adminOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [bulkAction, setBulkAction] = useState("");
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    adminApi.getOrders()
      .then((response) => {
        if (!active || !response?.data?.length) return;

        const mapped = response.data.map((rawOrder: unknown) => {
          const order = rawOrder as Record<string, unknown>;
          const user = (order.user as Record<string, unknown>) || {};
          const shippingAddress = (order.shippingAddress as Record<string, unknown>) || {};
          const paymentInfo = (order.paymentInfo as Record<string, unknown>) || {};
          const items = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [];

          return {
            id: String(order.id || ""),
            orderNumber: String(order.orderNumber || `#${String(order.id || "").slice(0, 8)}`),
            userId: String((user.id as string) || (order.userId as string) || "unknown"),
            userName: String((user.name as string) || (order.userName as string) || "Customer"),
            userEmail: String((user.email as string) || (order.userEmail as string) || ""),
            status: String(order.status || "pending").toLowerCase() as AdminOrder["status"],
            paymentStatus: String(order.paymentStatus || "paid").toLowerCase() as AdminOrder["paymentStatus"],
            fulfillmentStatus: String(order.fulfillmentStatus || "fulfilled").toLowerCase() as AdminOrder["fulfillmentStatus"],
            items: items.map((item) => {
              const product = (item.product as Record<string, unknown>) || {};
              const images = Array.isArray(product.images) ? (product.images as string[]) : [];
              return {
                id: String(item.id || `${order.id}-${String(item.productId || "")}`),
                productId: String((item.productId as string) || (product.id as string) || ""),
                productTitle: String((item.productTitle as string) || (product.title as string) || "Unknown Product"),
                productImage: String((item.productImage as string) || images[0] || ""),
                quantity: Number(item.quantity || 1),
                price: Number(item.price || 0),
                variantId: item.variantId as string | undefined,
                variantSku: item.variantSku as string | undefined,
                variantTitle: item.variantTitle as string | undefined,
                variantColor: item.variantColor as string | undefined,
                variantSize: item.variantSize as string | undefined,
              };
            }),
            subtotal: Number(order.subtotal || 0),
            shipping: Number(order.shipping || 0),
            tax: Number(order.tax || 0),
            discount: Number(order.discount || 0),
            total: Number(order.total || 0),
            currency: String(order.currency || "USD"),
            shippingAddress: {
              type: "shipping" as const,
              firstName: String((shippingAddress.firstName as string) || ""),
              lastName: String((shippingAddress.lastName as string) || ""),
              email: String((shippingAddress.email as string) || (user.email as string) || ""),
              phone: String((shippingAddress.phone as string) || ""),
              address: String((shippingAddress.address as string) || ""),
              apartment: String((shippingAddress.apartment as string) || ""),
              city: String((shippingAddress.city as string) || ""),
              state: String((shippingAddress.state as string) || ""),
              zip: String((shippingAddress.zip as string) || ""),
              country: String((shippingAddress.country as string) || "US"),
              isDefault: true,
            },
            billingAddress: {
              type: "billing" as const,
              firstName: String((shippingAddress.firstName as string) || ""),
              lastName: String((shippingAddress.lastName as string) || ""),
              email: String((shippingAddress.email as string) || (user.email as string) || ""),
              phone: String((shippingAddress.phone as string) || ""),
              address: String((shippingAddress.address as string) || ""),
              apartment: String((shippingAddress.apartment as string) || ""),
              city: String((shippingAddress.city as string) || ""),
              state: String((shippingAddress.state as string) || ""),
              zip: String((shippingAddress.zip as string) || ""),
              country: String((shippingAddress.country as string) || "US"),
              isDefault: true,
            },
            paymentMethod: String((paymentInfo.method as string) || "Card"),
            notes: String(order.notes || ""),
            tags: [],
            createdAt: String(order.createdAt || new Date().toISOString()),
            updatedAt: String(order.updatedAt || order.createdAt || new Date().toISOString()),
            timeline: [],
          };
        });

        setOrders(mapped.length ? mapped : adminOrders);
      })
      .catch(() => {
        if (active) setOrders(adminOrders);
      });

    return () => { active = false; };
  }, []);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(query) ||
          o.userName.toLowerCase().includes(query) ||
          o.userEmail.toLowerCase().includes(query) ||
          o.items.some((i) => i.productTitle.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      result = result.filter((o) => o.paymentStatus === paymentFilter);
    }

    if (fulfillmentFilter !== "all") {
      result = result.filter((o) => o.fulfillmentStatus === fulfillmentFilter);
    }

    // Date range filter
    const now = new Date();
    const rangeMs = {
      "1d": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    }[dateRange] || 30 * 24 * 60 * 60 * 1000;

    const cutoff = new Date(now.getTime() - rangeMs);
    result = result.filter((o) => new Date(o.createdAt) >= cutoff);

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof AdminOrder] ?? "";
      const bVal = b[sortConfig.key as keyof AdminOrder] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [orders, searchQuery, statusFilter, paymentFilter, fulfillmentFilter, dateRange, sortConfig]);

  const stats = useMemo(() => {
    const total = adminOrders.length;
    const pending = adminOrders.filter((o) => o.status === "pending" || o.status === "processing").length;
    const shipped = adminOrders.filter((o) => o.status === "shipped").length;
    const delivered = adminOrders.filter((o) => o.status === "delivered").length;
    const cancelled = adminOrders.filter((o) => o.status === "cancelled" || o.status === "refunded").length;
    const revenue = adminOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrder = total > 0 ? revenue / total : 0;

    return { total, pending, shipped, delivered, cancelled, revenue, avgOrder };
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedOrders.length === 0 || !bulkAction) return;

    const action = bulkAction;
    setBulkAction("");
    setSelectedOrders([]);

    // Simulate bulk action
    pushToast(`${action} applied to ${selectedOrders.length} order(s)`, "success");
  };

  const exportOrders = () => {
    const data = filteredOrders.map((o) => ({
      "Order ID": o.id,
      Date: new Date(o.createdAt).toLocaleString(),
      Customer: o.userName,
      Email: o.userEmail,
      Status: o.status,
      Payment: o.paymentStatus,
      Fulfillment: o.fulfillmentStatus,
      Items: o.items.length,
      Total: o.total,
      Currency: o.currency,
    }));
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
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

  const getTimeline = (order: AdminOrder): AdminOrderTimelineEvent[] => {
    const events: AdminOrderTimelineEvent[] = [
      {
        id: "1",
        type: "created",
        title: "Order placed",
        description: `Order ${order.id} created`,
        timestamp: order.createdAt,
        user: order.userName,
      },
    ];

    if (order.paymentStatus === "paid" || order.paymentStatus === ("partial" as string)) {
      events.push({
        id: "2",
        type: "payment",
        title: "Payment received",
        description: `Payment of ${formatCurrency(order.total)} received via ${order.paymentMethod}`,
        timestamp: order.createdAt,
        user: "System",
      });
    }

    if (order.fulfillmentStatus !== "unfulfilled") {
      events.push({
        id: "3",
        type: "fulfillment",
        title: order.fulfillmentStatus === "fulfilled" ? "Order fulfilled" : "Partially fulfilled",
        description: "Items packed and ready for shipment",
        timestamp: order.shippedAt || order.updatedAt,
        user: "Warehouse",
      });
    }

    if (order.shippedAt) {
      events.push({
        id: "4",
        type: "shipping",
        title: "Order shipped",
        description: order.trackingNumber
          ? `Tracking: ${order.trackingNumber}`
          : "Shipped via carrier",
        timestamp: order.shippedAt,
        user: "Carrier",
      });
    }

    if (order.deliveredAt) {
      events.push({
        id: "5",
        type: "shipping",
        title: "Order delivered",
        description: "Delivered to customer",
        timestamp: order.deliveredAt,
        user: "Carrier",
      });
    }

    if (order.cancelledAt) {
      events.push({
        id: "6",
        type: "status_change",
        title: "Order cancelled",
        description: order.cancellationReason || "Cancelled",
        timestamp: order.cancelledAt,
        user: "Admin",
      });
    }

    if (order.notes) {
      events.push({
        id: "7",
        type: "note",
        title: "Note added",
        description: order.notes,
        timestamp: order.updatedAt,
        user: "Admin",
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-ink-400 mt-1">Manage and fulfill customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportOrders} className="btn-ghost gap-2">
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4"
      >
        <StatCard title="Total Orders" value={stats.total} icon={FileText} color="from-blue-500 to-blue-600" bg="bg-blue-500/10" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="from-blue-500 to-blue-600" bg="bg-blue-500/10" />
        <StatCard title="Shipped" value={stats.shipped} icon={Truck} color="from-accent-500 to-accent-600" bg="bg-accent-500/10" />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle} color="from-emerald-500 to-emerald-600" bg="bg-emerald-500/10" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={XCircle} color="from-rose-500 to-rose-600" bg="bg-rose-500/10" />
        <StatCard title="Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} color="from-purple-500 to-purple-600" bg="bg-purple-500/10" />
        <StatCard title="Avg Order" value={formatCurrency(stats.avgOrder)} icon={Star} color="from-amber-500 to-amber-600" bg="bg-amber-500/10" />
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
              placeholder="Search orders, customers, products..."
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
              <Package2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 transition ${viewMode === "cards" ? "bg-white/5 text-white" : "text-ink-400 hover:text-white"}`}
            >
              <RotateCcw className="h-4 w-4" />
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
                <label className="block text-xs font-medium text-ink-400 mb-1">Order Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Payment Status</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Fulfillment</label>
                <select
                  value={fulfillmentFilter}
                  onChange={(e) => setFulfillmentFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Fulfillment</option>
                  <option value="unfulfilled">Unfulfilled</option>
                  <option value="partial">Partial</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="1d">Last 24 hours</option>
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
                  <option value="createdAt">Date (Newest)</option>
                  <option value="updatedAt">Last Updated</option>
                  <option value="total">Order Total</option>
                  <option value="userName">Customer</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedOrders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-strong rounded-2xl border border-accent-500/30 p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-sm font-medium text-white">
                {selectedOrders.length} order{selectedOrders.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="">Bulk Action...</option>
                  <option value="mark-processing">Mark as Processing</option>
                  <option value="mark-shipped">Mark as Shipped</option>
                  <option value="mark-delivered">Mark as Delivered</option>
                  <option value="mark-cancelled">Cancel Orders</option>
                  <option value="export">Export Selected</option>
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
                  onClick={() => setSelectedOrders([])}
                  className="btn-ghost text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders Table/Cards */}
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
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
                    />
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 cursor-pointer hover:text-white" onClick={() => handleSort("createdAt")}>
                    Order Date
                    {sortConfig.key === "createdAt" && (sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />)}
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell cursor-pointer hover:text-white" onClick={() => handleSort("userName")}>
                    Customer
                  </th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Order ID</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell">Items</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Status</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden xl:table-cell">Payment</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden xl:table-cell">Fulfillment</th>
                  <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 cursor-pointer hover:text-white" onClick={() => handleSort("total")}>
                    Total
                  </th>
                  <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center">
                      <Package className="h-12 w-12 text-ink-500 mx-auto mb-3" />
                      <p className="text-ink-400">No orders found</p>
                      <p className="text-sm text-ink-500 mt-1">Try adjusting your filters or search query</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      index={index}
                      selected={selectedOrders.includes(order.id)}
                      onSelect={toggleSelect}
                      expanded={expandedOrder === order.id}
                      onToggleExpand={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      formatDateTime={formatDateTime}
                      statusConfig={statusConfig}
                      paymentConfig={paymentConfig}
                      fulfillmentConfig={fulfillmentConfig}
                      onViewDetail={() => setShowDetailModal(order.id)}
                      onViewTimeline={() => setShowTimelineModal(order.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full p-12 text-center">
                <Package className="h-12 w-12 text-ink-500 mx-auto mb-3" />
                <p className="text-ink-400">No orders found</p>
              </div>
            ) : (
              filteredOrders.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={index}
                  selected={selectedOrders.includes(order.id)}
                  onSelect={toggleSelect}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  statusConfig={statusConfig}
                  paymentConfig={paymentConfig}
                  fulfillmentConfig={fulfillmentConfig}
                  onViewDetail={() => setShowDetailModal(order.id)}
                  onViewTimeline={() => setShowTimelineModal(order.id)}
                />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="border-t border-white/5 p-4 flex items-center justify-between">
            <p className="text-sm text-ink-400">
              Showing {filteredOrders.length} of {adminOrders.length} orders
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

      {/* Order Detail Modal */}
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
              <OrderDetailModal
                order={adminOrders.find((o) => o.id === showDetailModal)!}
                onClose={() => setShowDetailModal(null)}
                formatCurrency={formatCurrency}
                formatDateTime={formatDateTime}
                statusConfig={statusConfig}
                paymentConfig={paymentConfig}
                fulfillmentConfig={fulfillmentConfig}
                getTimeline={getTimeline}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Modal */}
      <AnimatePresence>
        {showTimelineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowTimelineModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface rounded-2xl border border-white/5 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <TimelineModal
                order={adminOrders.find((o) => o.id === showTimelineModal)!}
                onClose={() => setShowTimelineModal(null)}
                getTimeline={getTimeline}
                formatDateTime={formatDateTime}
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

function OrderRow({
  order,
  index,
  selected,
  onSelect,
  expanded,
  onToggleExpand,
  formatCurrency,
  formatDate,
  formatDateTime,
  statusConfig,
  paymentConfig,
  fulfillmentConfig,
  onViewDetail,
  onViewTimeline,
}: {
  order: AdminOrder;
  index: number;
  selected: boolean;
  onSelect: (_id: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  formatCurrency: (_amount: number, _currency?: string) => string;
  formatDate: (_dateString: string) => string;
  formatDateTime: (_dateString: string) => string;
  statusConfig: Record<string, StatusConfigItem>;
  paymentConfig: Record<string, StatusConfigItem>;
  fulfillmentConfig: Record<string, StatusConfigItem>;
  onViewDetail: () => void;
  onViewTimeline: () => void;
}) {
  const sConfig = statusConfig[order.status] || statusConfig.pending;
  const pConfig = paymentConfig[order.paymentStatus] || paymentConfig.pending;
  const fConfig = fulfillmentConfig[order.fulfillmentStatus] || fulfillmentConfig.unfulfilled;
  const SIcon = sConfig.icon;
  const PIcon = pConfig.icon;
  const FIcon = fConfig.icon;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`${selected ? "bg-accent-500/5" : "hover:bg-white/5"} transition-colors cursor-pointer`}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName !== "INPUT" && target.tagName !== "BUTTON" && !target.closest("button")) {
            onToggleExpand();
          }
        }}
      >
        <td className="p-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(order.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
          />
        </td>
        <td className="p-4">
          <div className="text-sm text-white font-medium">{formatDate(order.createdAt)}</div>
          <div className="text-xs text-ink-400">{formatDateTime(order.createdAt)}</div>
        </td>
        <td className="p-4 hidden md:table-cell">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <User className="h-4 w-4 text-ink-300" />
            </div>
            <div>
              <div className="font-medium text-white">{order.userName}</div>
              <div className="text-xs text-ink-400">{order.userEmail}</div>
            </div>
          </div>
        </td>
        <td className="p-4 font-mono text-sm text-white">{order.id}</td>
        <td className="p-4 hidden lg:table-cell">
          <span className="chip">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
        </td>
        <td className="p-4">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${sConfig.color}`}>
            <SIcon className="h-3 w-3" />
            {sConfig.label}
          </span>
        </td>
        <td className="p-4 hidden xl:table-cell">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${pConfig.color}`}>
            <PIcon className="h-3 w-3" />
            {pConfig.label}
          </span>
        </td>
        <td className="p-4 hidden xl:table-cell">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${fConfig.color}`}>
            <FIcon className="h-3 w-3" />
            {fConfig.label}
          </span>
        </td>
        <td className="p-4 font-medium text-white">{formatCurrency(order.total, order.currency)}</td>
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
              onClick={(e) => { e.stopPropagation(); onViewTimeline(); }}
              className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
              title="View timeline"
            >
              <Calendar className="h-4 w-4" />
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
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={10} className="p-0">
              <div className="bg-ink-900/50 border-t border-white/5 px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="text-sm font-semibold text-ink-300 mb-2">Shipping Address</h5>
                    <p className="text-sm text-white">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p className="text-sm text-ink-400">{order.shippingAddress.address}{order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ""}</p>
                    <p className="text-sm text-ink-400">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                    <p className="text-sm text-ink-400">{order.shippingAddress.country}</p>
                    <p className="text-sm text-ink-400">{order.shippingAddress.phone}</p>
                    <p className="text-sm text-ink-400">{order.shippingAddress.email}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-ink-300 mb-2">Items</h5>
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {order.items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-white">{item.productTitle}</span>
                          <span className="text-ink-400">×{item.quantity}</span>
                          <span className="text-white ml-auto">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-ink-300 mb-2">Totals</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-ink-400">Subtotal</span><span className="text-white">{formatCurrency(order.subtotal)}</span></div>
                      <div className="flex justify-between"><span className="text-ink-400">Shipping</span><span className="text-white">{formatCurrency(order.shipping)}</span></div>
                      <div className="flex justify-between"><span className="text-ink-400">Tax</span><span className="text-white">{formatCurrency(order.tax)}</span></div>
                      {order.discount > 0 && (
                        <div className="flex justify-between"><span className="text-ink-400">Discount</span><span className="text-rose-400">-{formatCurrency(order.discount)}</span></div>
                      )}
                      <div className="flex justify-between border-t border-white/5 pt-1"><span className="font-semibold text-ink-400">Total</span><span className="font-semibold text-white">{formatCurrency(order.total)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

function OrderCard({
  order,
  index,
  selected,
  onSelect,
  formatCurrency,
  formatDate,
  statusConfig,
  paymentConfig,
  fulfillmentConfig,
  onViewDetail,
  onViewTimeline,
}: {
  order: AdminOrder;
  index: number;
  selected: boolean;
  onSelect: (_id: string) => void;
  formatCurrency: (_amount: number, _currency?: string) => string;
  formatDate: (_dateString: string) => string;
  statusConfig: Record<string, StatusConfigItem>;
  paymentConfig: Record<string, StatusConfigItem>;
  fulfillmentConfig: Record<string, StatusConfigItem>;
  onViewDetail: () => void;
  onViewTimeline: () => void;
}) {
  const sConfig = statusConfig[order.status] || statusConfig.pending;
  const pConfig = paymentConfig[order.paymentStatus] || paymentConfig.pending;
  const fConfig = fulfillmentConfig[order.fulfillmentStatus] || fulfillmentConfig.unfulfilled;
  const SIcon = sConfig.icon;
  const PIcon = pConfig.icon;
  const FIcon = fConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className={`relative p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group ${selected ? "ring-2 ring-accent-500/50 bg-accent-500/5" : ""}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(order.id)}
        className="absolute top-4 left-4 w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
      />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-ink-400">{order.id}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sConfig.color}`}>
            <SIcon className="h-2.5 w-2.5" />
            {sConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onViewTimeline} className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition" title="Timeline"><Calendar className="h-3.5 w-3.5" /></button>
          <button onClick={onViewDetail} className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition" title="Details"><Eye className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-ink-400" />
          <span className="font-medium text-white">{order.userName}</span>
          <span className="text-ink-400">{order.userEmail}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400 mt-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(order.createdAt)}</span>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {order.items.slice(0, 3).map((item) => (
          <div key={item.productId} className="flex items-center justify-between text-sm">
            <span className="text-white truncate">{item.productTitle}</span>
            <span className="text-ink-400">×{item.quantity}</span>
            <span className="text-white font-medium">{formatCurrency(item.total)}</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="text-xs text-ink-400 text-right">+{order.items.length - 3} more items</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${pConfig.color}`}>
          <PIcon className="h-2.5 w-2.5" />
          {pConfig.label}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${fConfig.color}`}>
          <FIcon className="h-2.5 w-2.5" />
          {fConfig.label}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="font-bold text-lg text-white">{formatCurrency(order.total, order.currency)}</div>
        <div className="flex items-center gap-1">
          <button onClick={onViewDetail} className="btn-ghost text-sm gap-1">View</button>
        </div>
      </div>
    </motion.div>
  );
}

function OrderDetailModal({
  order,
  onClose,
  formatCurrency,
  formatDateTime,
  statusConfig,
  paymentConfig,
  fulfillmentConfig,
  getTimeline,
}: {
  order: AdminOrder;
  onClose: () => void;
  formatCurrency: (_amount: number, _currency?: string) => string;
  formatDateTime: (_dateString: string) => string;
  statusConfig: Record<string, StatusConfigItem>;
  paymentConfig: Record<string, StatusConfigItem>;
  fulfillmentConfig: Record<string, StatusConfigItem>;
  getTimeline: (_order: AdminOrder) => AdminOrderTimelineEvent[];
}) {
  const sConfig = statusConfig[order.status] || statusConfig.pending;
  const pConfig = paymentConfig[order.paymentStatus] || paymentConfig.pending;
  const fConfig = fulfillmentConfig[order.fulfillmentStatus] || fulfillmentConfig.unfulfilled;
  const SIcon = sConfig.icon;
  const PIcon = pConfig.icon;
  const FIcon = fConfig.icon;
  const timeline = getTimeline(order);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/5 p-4 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white">{order.id}</h2>
            <p className="text-sm text-ink-400">{order.userName} • {order.userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${sConfig.color}`}>
            <SIcon className="h-4 w-4" />
            {sConfig.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${pConfig.color}`}>
            <PIcon className="h-4 w-4" />
            {pConfig.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${fConfig.color}`}>
            <FIcon className="h-4 w-4" />
            {fConfig.label}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 overflow-y-auto flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package2 className="h-5 w-5 text-accent-400" />
                Items ({order.items.length})
              </h3>
              <div className="glass-strong rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Product</th>
                      <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell">Variant</th>
                      <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Qty</th>
                      <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Price</th>
                      <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {order.items.map((item) => (
                      <tr key={item.productId} className="hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                              <Package2 className="h-5 w-5 text-ink-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{item.productTitle}</p>
                              <p className="text-sm text-ink-400 font-mono">{item.variantId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell text-sm text-ink-400">{item.variantTitle}</td>
                        <td className="p-4 text-right text-sm text-white">{item.quantity}</td>
                        <td className="p-4 text-right text-sm text-white">{formatCurrency(item.price)}</td>
                        <td className="p-4 text-right text-sm font-medium text-white">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Timeline */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-400" />
                Timeline
              </h3>
              <div className="glass-strong rounded-xl p-4">
                <div className="relative pl-4">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-white/5" />
                  {timeline.map((event) => (
                    <div key={event.id} className="relative pb-6 flex items-start gap-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 z-10 ${
                        event.type === "created" ? "bg-blue-500/20 text-blue-400" :
                        event.type === "payment" ? "bg-emerald-500/20 text-emerald-400" :
                        event.type === "fulfillment" ? "bg-purple-500/20 text-purple-400" :
                        event.type === "shipping" ? "bg-accent-500/20 text-accent-400" :
                        event.type === "status_change" ? "bg-rose-500/20 text-rose-400" :
                        "bg-ink-500/20 text-ink-400"
                      }`}>
                        {event.type === "created" && <FileText className="h-4 w-4" />}
                        {event.type === "payment" && <CreditCard className="h-4 w-4" />}
                        {event.type === "fulfillment" && <Package className="h-4 w-4" />}
                        {event.type === "shipping" && <Truck className="h-4 w-4" />}
                        {event.type === "status_change" && <Flag className="h-4 w-4" />}
                        {event.type === "note" && <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-white">{event.title}</h5>
                          <span className="text-xs text-ink-400">{formatDateTime(event.timestamp)}</span>
                        </div>
                        {event.description && <p className="text-sm text-ink-400 mt-0.5">{event.description}</p>}
                        {event.user && <p className="text-xs text-ink-500 mt-1">By {event.user}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Summary & Addresses */}
          <div className="space-y-6">
            {/* Order Summary */}
            <section className="glass-strong rounded-xl p-4 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent-400" />
                Order Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-ink-400">Subtotal</span><span className="text-white">{formatCurrency(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Shipping</span><span className="text-white">{formatCurrency(order.shipping)}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Tax</span><span className="text-white">{formatCurrency(order.tax)}</span></div>
                {order.discount > 0 && (
                  <div className="flex justify-between"><span className="text-ink-400">Discount</span><span className="text-rose-400">-{formatCurrency(order.discount)}</span></div>
                )}
                <div className="flex justify-between border-t border-white/5 pt-3">
                  <span className="font-semibold text-ink-400">Total</span>
                  <span className="font-semibold text-white text-lg">{formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>
            </section>

            {/* Addresses */}
            <section className="glass-strong rounded-xl p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent-400" />
                Addresses
              </h3>
              <div>
                <h4 className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">Shipping</h4>
                <address className="text-sm text-white not-italic space-y-1">
                  <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p>{order.shippingAddress.address}{order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ""}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                  <p>{order.shippingAddress.country}</p>
                  <p>{order.shippingAddress.phone}</p>
                  <p>{order.shippingAddress.email}</p>
                </address>
              </div>
              {order.billingAddress && (
                <div className="pt-4 border-t border-white/5">
                  <h4 className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">Billing</h4>
                  <address className="text-sm text-ink-400 not-italic space-y-1">
                    <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                    <p>{order.billingAddress.address}{order.billingAddress.apartment ? `, ${order.billingAddress.apartment}` : ""}</p>
                    <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zip}</p>
                    <p>{order.billingAddress.country}</p>
                  </address>
                </div>
              )}
            </section>

            {/* Payment & Notes */}
            <section className="glass-strong rounded-xl p-4 space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent-400" />
                Payment
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-400">Method</span><span className="text-white">{order.paymentMethod}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Status</span><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pConfig.color}`}><PIcon className="h-3 w-3" />{pConfig.label}</span></div>
              </div>
            </section>

            {order.notes && (
              <section className="glass-strong rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-accent-400" />
                  Notes
                </h3>
                <p className="text-sm text-ink-300 whitespace-pre-wrap">{order.notes}</p>
              </section>
            )}

            {/* Tracking */}
            {order.trackingNumber && (
              <section className="glass-strong rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                  <Truck className="h-5 w-5 text-accent-400" />
                  Tracking
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-400">Tracking #</span>
                    <code className="font-mono text-white bg-ink-800/50 px-2 py-1 rounded">{order.trackingNumber}</code>
                  </div>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-300 hover:text-accent-200 flex items-center gap-1">
                      Track shipment <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineModal({
  order,
  onClose,
  getTimeline,
  formatDateTime,
}: {
  order: AdminOrder;
  onClose: () => void;
  getTimeline: (_order: AdminOrder) => AdminOrderTimelineEvent[];
  formatDateTime: (_dateString: string) => string;
}) {
  const timeline = getTimeline(order);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/5 p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Order Timeline</h3>
        <button onClick={onClose} className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        <div className="relative pl-4">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-white/5" />
          {timeline.map((event) => (
            <div key={event.id} className="relative pb-6 flex items-start gap-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 z-10 ${
                event.type === "created" ? "bg-blue-500/20 text-blue-400" :
                event.type === "payment" ? "bg-emerald-500/20 text-emerald-400" :
                event.type === "fulfillment" ? "bg-purple-500/20 text-purple-400" :
                event.type === "shipping" ? "bg-accent-500/20 text-accent-400" :
                event.type === "status_change" ? "bg-rose-500/20 text-rose-400" :
                "bg-ink-500/20 text-ink-400"
              }`}>
                {event.type === "created" && <FileText className="h-4 w-4" />}
                {event.type === "payment" && <CreditCard className="h-4 w-4" />}
                {event.type === "fulfillment" && <Package className="h-4 w-4" />}
                {event.type === "shipping" && <Truck className="h-4 w-4" />}
                {event.type === "status_change" && <Flag className="h-4 w-4" />}
                {event.type === "note" && <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-white">{event.title}</h5>
                  <span className="text-xs text-ink-400">{formatDateTime(event.timestamp)}</span>
                </div>
                {event.description && <p className="text-sm text-ink-400 mt-0.5">{event.description}</p>}
                {event.user && <p className="text-xs text-ink-500 mt-1">By {event.user}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}