import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Wallet,
  DollarSign,
  Send,
  Bitcoin,
  Plus,
  ArrowLeft,
  Check,
  X,
  Loader2,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { CASHOUTS_BASE as API_BASE } from "../lib/config";

const paymentMethods = [
  { value: "cashapp", label: "Cash App", icon: DollarSign, placeholder: "$Cashtag" },
  { value: "zelle", label: "Zelle", icon: Send, placeholder: "Email or phone number" },
  { value: "crypto", label: "Cryptocurrency", icon: Bitcoin, placeholder: "Wallet address" },
];

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-amber-500/20 text-amber-400", icon: Clock },
  PROCESSING: { label: "Processing", color: "bg-blue-500/20 text-blue-400", icon: Loader2 },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/20 text-emerald-400", icon: Check },
  FAILED: { label: "Failed", color: "bg-rose-500/20 text-rose-400", icon: X },
  CANCELLED: { label: "Cancelled", color: "bg-ink-500/20 text-ink-400", icon: X },
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

export default function Cashouts() {
  const { state: authState } = useAuth();
  const { pushToast } = useStore();

  const [cashouts, setCashouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cashapp");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableBalance = 1250.0;

  useEffect(() => {
    if (!authState.token) return;

    const fetchCashouts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_BASE, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authState.token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch cashout requests");
        const json = await res.json();
        setCashouts(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCashouts();
  }, [authState.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      pushToast("Please enter a valid amount", "error");
      return;
    }
    if (parseFloat(amount) > availableBalance) {
      pushToast("Amount exceeds available balance", "error");
      return;
    }
    if (!paymentDetail.trim()) {
      pushToast("Please enter your payment details", "error");
      return;
    }

    setSubmitting(true);
    try {
      const details = {};
      if (paymentMethod === "cashapp") details.cashappUsername = paymentDetail;
      else if (paymentMethod === "zelle") details.zelleEmail = paymentDetail;
      else if (paymentMethod === "crypto") details.cryptoWalletAddress = paymentDetail;

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: "USD",
          paymentMethod,
          paymentDetails: details,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create cashout request");
      }

      const newCashout = await res.json();
      setCashouts((prev) => [newCashout, ...prev]);
      setShowForm(false);
      setAmount("");
      setPaymentDetail("");
      pushToast("Cashout request submitted successfully", "success");
    } catch (err) {
      pushToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.value === paymentMethod);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/account" className="btn-ghost p-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-3xl font-bold text-white">Cashouts</h1>
          </div>
          <p className="mt-1 text-ink-400">Request a payout of your store earnings</p>
        </div>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface mb-8 rounded-3xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600">
              <Wallet className="h-7 w-7 text-ink-950" />
            </div>
            <div>
              <p className="text-sm text-ink-400">Available Balance</p>
              <p className="font-display text-3xl font-bold text-white">{formatPrice(availableBalance)}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="btn-primary gap-2"
          >
            <Plus className="h-4 w-4" />
            Request Cashout
          </motion.button>
        </div>
      </motion.div>

      {/* Cashout Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 px-4 py-24 backdrop-blur-md"
            onClick={() => !submitting && setShowForm(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="surface w-full max-w-md overflow-hidden rounded-3xl shadow-lift"
            >
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <h3 className="font-display text-lg font-semibold text-white">Request Cashout</h3>
                <button
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="rounded-full p-1.5 text-ink-300 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-200 mb-2">Amount (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={availableBalance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-ink-800/50 border border-white/5 text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:border-accent-400/50 focus:ring-accent-400/20 transition"
                      disabled={submitting}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink-400">Available: {formatPrice(availableBalance)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-200 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isActive = paymentMethod === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                            isActive
                              ? "bg-accent-500/10 border-accent-400/30 text-accent-300"
                              : "bg-ink-800/50 border-white/5 text-ink-300 hover:bg-ink-800"
                          }`}
                          disabled={submitting}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-200 mb-2">
                    {selectedMethod?.label} Details
                  </label>
                  <input
                    type="text"
                    value={paymentDetail}
                    onChange={(e) => setPaymentDetail(e.target.value)}
                    placeholder={selectedMethod?.placeholder}
                    className="w-full px-4 py-3 rounded-xl bg-ink-800/50 border border-white/5 text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:border-accent-400/50 focus:ring-accent-400/20 transition"
                    disabled={submitting}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                    className="flex-1 btn-ghost"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
                      submitting
                        ? "bg-white/5 text-ink-300"
                        : "bg-gradient-to-r from-accent-400 to-accent-600 text-ink-950 hover:from-accent-300 hover:to-accent-500"
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cashout History */}
      <h2 className="mb-4 font-display text-xl font-semibold text-white">Cashout History</h2>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-accent-400 animate-spin" />
            <p className="text-ink-300 font-medium">Loading cashout requests...</p>
          </div>
        </div>
      ) : error ? (
        <div className="surface rounded-3xl p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <X className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-white">Something went wrong</h2>
          <p className="mt-2 text-ink-300">{error}</p>
          <Link to="/shop" className="btn-primary mt-6 inline-block">
            Continue Shopping
          </Link>
        </div>
      ) : cashouts.length === 0 ? (
        <div className="surface rounded-3xl p-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-500/10 text-accent-400">
            <Wallet className="h-10 w-10" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-white">No cashouts yet</h2>
          <p className="mt-2 text-ink-300">
            Request your first payout from the balance above
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Request Cashout
          </motion.button>
        </div>
      ) : (
        <div className="space-y-3">
          {cashouts.map((cashout, index) => {
            const method = paymentMethods.find((m) => m.value === cashout.paymentMethod);
            const MethodIcon = method?.icon || DollarSign;
            return (
              <motion.div
                key={cashout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="surface rounded-3xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-800 text-accent-300">
                    <MethodIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-white">
                      {formatPrice(cashout.amount)}
                    </p>
                    <p className="text-xs text-ink-400">
                      {method?.label || cashout.paymentMethod} · {formatDate(cashout.createdAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={cashout.status} />
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
