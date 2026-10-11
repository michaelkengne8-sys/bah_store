import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  CreditCard,
  MapPin,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
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

const statusFlow = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
const terminalStatuses = ["CANCELLED", "REFUNDED"];

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
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${config.color}`}>
      <Icon className="h-4 w-4" />
      {config.label}
    </span>
  );
}

function StatusTimeline({ status }) {
  const isTerminal = terminalStatuses.includes(status);
  const statusIdx = statusFlow.indexOf(status);

  if (isTerminal) {
    const config = statusConfig[status] || statusConfig.CANCELLED;
    const Icon = config.icon;
    return (
      <div className="surface rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${config.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-white text-lg">Order {config.label}</p>
            <p className="text-sm text-ink-400">This order has been {config.label.toLowerCase()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="surface rounded-2xl p-6">
      <h3 className="font-display text-base font-semibold text-white mb-6">Order Status</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/5" />
        <div className="space-y-0">
          {statusFlow.map((s, i) => {
            const config = statusConfig[s];
            const Icon = config.icon;
            const completed = statusIdx > i;
            const current = statusIdx === i;

            return (
              <div key={s} className="relative flex items-start gap-4 pb-8 last:pb-0">
                <motion.div
                  animate={
                    current
                      ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }
                      : {}
                  }
                  transition={
                    current
                      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      : {}
                  }
                  className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 z-10 ${
                    completed
                      ? "bg-emerald-500/20 text-emerald-400"
                      : current
                      ? "bg-accent-500/20 text-accent-400 ring-2 ring-accent-500/50"
                      : "bg-ink-800 text-ink-500"
                  }`}
                >
                  {completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </motion.div>
                <div className="flex-1 min-w-0 pt-1">
                  <p
                    className={`text-sm font-medium ${
                      completed || current ? "text-white" : "text-ink-500"
                    }`}
                  >
                    {config.label}
                  </p>
                  {current && (
                    <p className="text-xs text-accent-400 mt-0.5">Current status</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { state: authState } = useAuth();
  const { pushToast } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authState.token || !id) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${ORDERS_BASE}/my/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authState.token}`,
          },
        });
        if (res.status === 404) throw new Error("Order not found");
        if (!res.ok) throw new Error("Failed to fetch order details");
        const json = await res.json();
        setOrder(json);
      } catch (err) {
        setError(err.message);
        pushToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [authState.token, id, pushToast]);

  const shippingAddress =
    order && typeof order.shippingAddress === "string"
      ? JSON.parse(order.shippingAddress)
      : order?.shippingAddress || null;

  const paymentInfo =
    order && typeof order.paymentInfo === "string"
      ? JSON.parse(order.paymentInfo)
      : order?.paymentInfo || null;

  const subtotal = order?.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;

  const getItemImage = (item) => {
    try {
      const images = JSON.parse(item.product?.images || "[]");
      return images[0] || null;
    } catch {
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <Link
        to="/account/orders"
        className="btn-ghost gap-2 text-sm mb-6 inline-flex items-center"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-accent-400 animate-spin" />
            <p className="text-ink-300 font-medium">Loading order details...</p>
          </div>
        </div>
      ) : error ? (
        <div className="surface rounded-3xl p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-white">
            {error === "Order not found" ? "Order Not Found" : "Something went wrong"}
          </h2>
          <p className="mt-2 text-ink-300">
            {error === "Order not found"
              ? "This order doesn't exist or you don't have access to it"
              : error}
          </p>
          <Link to="/account/orders" className="btn-primary mt-6 inline-block">
            View My Orders
          </Link>
        </div>
      ) : order ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="surface rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Order {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-ink-400 mt-1">
                  Placed on {formatDate(order.createdAt)}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left - Items + Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items */}
              <div className="surface rounded-3xl p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-accent-400" />
                  Items ({order.items?.length || 0})
                </h2>
                <div className="divide-y divide-white/5">
                  {order.items?.map((item) => {
                    const img = getItemImage(item);
                    return (
                      <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="h-16 w-16 rounded-xl bg-ink-800 flex items-center justify-center overflow-hidden shrink-0">
                          {img ? (
                            <img
                              src={img}
                              alt={item.product?.title || "Product"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-ink-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {item.product?.title || "Product"}
                          </p>
                          {item.color && (
                            <p className="text-sm text-ink-400">Color: {item.color}</p>
                          )}
                          <p className="text-sm text-ink-400">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className="font-semibold text-white shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline */}
              <StatusTimeline status={order.status} />
            </div>

            {/* Right - Summary + Address */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="surface rounded-3xl p-6">
                <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent-400" />
                  Order Summary
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-400">Subtotal</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-400">Shipping</span>
                    <span className="text-white">{formatPrice(order.shipping)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-400">Discount</span>
                      <span className="text-rose-400">-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-400">Tax</span>
                    <span className="text-white">{formatPrice(order.tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-3">
                    <span className="font-semibold text-ink-200">Total</span>
                    <span className="font-semibold text-white text-lg">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {shippingAddress && (
                <div className="surface rounded-3xl p-6">
                  <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-accent-400" />
                    Shipping Address
                  </h2>
                  <address className="text-sm text-ink-300 not-italic space-y-1">
                    <p className="font-medium text-white">
                      {shippingAddress.firstName} {shippingAddress.lastName}
                    </p>
                    <p>{shippingAddress.address}</p>
                    {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
                    <p>
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                    </p>
                    <p>{shippingAddress.country}</p>
                    <p className="pt-1">{shippingAddress.phone}</p>
                    <p>{shippingAddress.email}</p>
                  </address>
                </div>
              )}

              {/* Payment Info */}
              {paymentInfo && (
                <div className="surface rounded-3xl p-6">
                  <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-accent-400" />
                    Payment
                  </h2>
                  <div className="space-y-2 text-sm">
                    {paymentInfo.nameOnCard && (
                      <div className="flex justify-between">
                        <span className="text-ink-400">Name</span>
                        <span className="text-white">{paymentInfo.nameOnCard}</span>
                      </div>
                    )}
                    {paymentInfo.cardNumber && (
                      <div className="flex justify-between">
                        <span className="text-ink-400">Card</span>
                        <span className="text-white font-mono">
                          **** {paymentInfo.cardNumber.slice(-4)}
                        </span>
                      </div>
                    )}
                    {paymentInfo.method && (
                      <div className="flex justify-between">
                        <span className="text-ink-400">Method</span>
                        <span className="text-white capitalize">{paymentInfo.method.replace("_", " ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
