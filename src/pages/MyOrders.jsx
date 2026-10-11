import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Package,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { ORDERS_BASE } from "../lib/config";

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  PROCESSING: { label: "Processing", color: "bg-purple-500/20 text-purple-400", icon: Loader2 },
  SHIPPED: { label: "Shipped", color: "bg-accent-500/20 text-accent-400", icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-rose-500/20 text-rose-400", icon: XCircle },
  REFUNDED: { label: "Refunded", color: "bg-amber-500/20 text-amber-400", icon: RotateCcw },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

export default function MyOrders() {
  const { state: authState } = useAuth();
  const { pushToast } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authState.token) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${ORDERS_BASE}/my`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authState.token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch orders");
        const json = await res.json();
        setOrders(json.data || []);
      } catch (err) {
        setError(err.message);
        pushToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authState.token, pushToast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">My Orders</h1>
        <p className="mt-1 text-ink-400">View and track your recent orders</p>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-accent-400 animate-spin" />
            <p className="text-ink-300 font-medium">Loading orders...</p>
          </div>
        </div>
      ) : error ? (
        <div className="surface rounded-3xl p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-white">Something went wrong</h2>
          <p className="mt-2 text-ink-300">{error}</p>
          <Link to="/shop" className="btn-primary mt-6 inline-block">
            Continue Shopping
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="surface rounded-3xl p-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-500/10 text-accent-400">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-white">No orders yet</h2>
          <p className="mt-2 text-ink-300">Start shopping and your orders will appear here</p>
          <Link to="/shop" className="btn-primary mt-6 inline-flex items-center gap-2">
            Browse Products
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/account/orders/${order.id}`}
                  className="surface rounded-3xl p-6 block transition hover:border-accent-400/30 hover:shadow-glow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-800 text-accent-300">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-white">
                          {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-ink-400">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink-400">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                      <span className="text-ink-600">·</span>
                      <span className="text-lg font-bold text-white">{formatPrice(order.total)}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-ink-400" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
