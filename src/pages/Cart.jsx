import { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, X, ShoppingBag, ArrowRight, Check, DollarSign, Send, Bitcoin, Apple, AlertCircle, Info, Loader2, ChevronDown } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { products as catalogProducts } from "../lib/productStore";
import { formatPrice } from "../lib/utils";
import { ORDERS_BASE } from "../lib/config";

function generateOrderId() {
  return `LX-${Math.floor(Math.random() * 90000) + 10000}`;
}

const PAYMENT_METHODS = [
  {
    id: "cashapp",
    name: "Cash App",
    icon: DollarSign,
    description: "Pay instantly with your Cash App balance or linked card",
    color: "from-green-500 to-green-600",
    iconBg: "bg-green-500/20",
    textColor: "text-green-300",
  },
  {
    id: "zelle",
    name: "Zelle",
    icon: Send,
    description: "Send directly from your bank app - no fees, instant transfer",
    color: "from-violet-500 to-violet-600",
    iconBg: "bg-violet-500/20",
    textColor: "text-violet-300",
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    icon: Bitcoin,
    description: "Pay with BTC, ETH, USDC, USDT - secure and decentralized",
    color: "from-orange-500 to-orange-600",
    iconBg: "bg-orange-500/20",
    textColor: "text-orange-300",
  },
  {
    id: "apple_pay",
    name: "Apple Pay",
    icon: Apple,
    description: "Fast, secure checkout with Face ID or Touch ID",
    color: "from-slate-700 to-slate-800",
    iconBg: "bg-slate-700/50",
    textColor: "text-slate-300",
  },
];

const CRYPTO_NETWORKS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", icon: "₿", color: "text-orange-400" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "Ξ", color: "text-violet-400" },
  { id: "usdc", name: "USDC", symbol: "USDC", icon: "$", color: "text-blue-400" },
  { id: "usdt", name: "USDT", symbol: "USDT", icon: "$", color: "text-green-400" },
];

export default function Cart() {
  const { state, dispatch, pushToast } = useStore();
  const { state: authState } = useAuth();
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState("usdc");
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const orderId = useMemo(() => {
    if (checkoutStep > 0) return generateOrderId();
    return null;
  }, [checkoutStep]);
  const copiedRef = useRef(null);

  const items = useMemo(
    () =>
      state.cart
        .map((i) => {
          const p = catalogProducts.find((x) => x.id === i.id);
          return p ? { ...p, qty: i.qty, color: i.color } : null;
        })
        .filter(Boolean),
    [state.cart]
  );

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 99 || subtotal === 0 ? 0 : 9.99;
  const discount = applied ? subtotal * applied.discount : 0;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shipping + tax;

  function applyPromo() {
    const validCodes = { TOPSHELF15: 0.15, SAVE10: 0.1, WELCOME5: 0.05, FREESHIP: 0 };
    const code = promo.toUpperCase();
    if (code in validCodes) {
      const discount = validCodes[code];
      setApplied({ code, discount });
      pushToast(discount === 0 ? "Free shipping applied!" : `Promo code applied! ${discount * 100}% off`, "success");
    } else {
      pushToast("Invalid promo code", "error");
    }
  }

  async function placeOrder() {
    if (items.length === 0) return;

    if (!selectedPayment) {
      pushToast("Please select a payment method", "error");
      return;
    }

    if (!shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.zip) {
      pushToast("Please fill in your shipping address", "error");
      return;
    }

    // Validate payment details based on method
    if (selectedPayment === "cashapp" && !paymentDetails.cashappUsername) {
      pushToast("Please enter your Cash App username", "error");
      return;
    }
    if (selectedPayment === "zelle" && (!paymentDetails.zelleEmail && !paymentDetails.zellePhone)) {
      pushToast("Please enter your Zelle email or phone", "error");
      return;
    }
    if (selectedPayment === "crypto" && !paymentDetails.cryptoWalletAddress) {
      pushToast("Please enter your wallet address", "error");
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(ORDERS_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-admin": "true",
        },
        body: JSON.stringify({
          userId: authState.user?.id,
          userName: authState.user?.name,
          userEmail: authState.user?.email,
          shippingAddress: {
            ...shippingAddress,
            email: shippingAddress.email || authState.user?.email || "guest@example.com",
          },
          paymentInfo: {
            method: selectedPayment,
            ...paymentDetails,
          },
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.qty,
            price: item.price,
            color: item.color,
          })),
          subtotal,
          shipping,
          discount,
          tax,
          total,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save order");
      }

      pushToast("Order placed successfully!", "success");
      dispatch({ type: "CLEAR_CART" });
      setCheckoutStep(1);
      setSelectedPayment(null);
      setPaymentDetails({});
      setShowPaymentDetails(false);
    } catch {
      pushToast("Unable to place order right now", "error");
    } finally {
      setProcessing(false);
    }
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text);
    copiedRef.current = label;
    setTimeout(() => { copiedRef.current = null; }, 2000);
    pushToast(`${label} copied to clipboard`, "success");
  }

  function renderPaymentDetails() {
    const method = PAYMENT_METHODS.find(m => m.id === selectedPayment);
    if (!method) return null;

    const Icon = method.icon;

    switch (selectedPayment) {
      case "cashapp":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${method.iconBg}`}>
                  <Icon className={`h-6 w-6 ${method.textColor}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{method.name} Payment Details</h4>
                  <p className="text-sm text-ink-400">Send payment to complete your order</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Our CashApp</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 font-mono text-lg text-green-300">$TopShelfFarm</code>
                    <button
                      onClick={() => copyToClipboard("$TopShelfFarm", "Cashtag")}
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Amount to Send</label>
                  <div className="px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 font-mono text-2xl font-bold text-white">
                    {formatPrice(total)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Your CashApp Username</label>
                  <input
                    type="text"
                    placeholder="$yourusername"
                    value={paymentDetails.cashappUsername || ""}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cashappUsername: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition"
                  />
                  <p className="mt-1 text-xs text-ink-400">Enter your CashApp username so we can verify payment</p>
                </div>

                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-300">
                      <p className="font-medium">How it works:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Open Cash App and tap "Pay"</li>
                        <li>Enter <code className="font-mono bg-white/5 px-1 rounded">$TopShelfFarm</code></li>
                        <li>Send <strong>{formatPrice(total)}</strong> with note: <code className="font-mono bg-white/5 px-1 rounded">{orderId || generateOrderId()}</code></li>
                        <li>We'll verify and confirm your order instantly</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "zelle":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${method.iconBg}`}>
                  <Icon className={`h-6 w-6 ${method.textColor}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{method.name} Payment Details</h4>
                  <p className="text-sm text-ink-400">Send directly from your bank app - no fees</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Our Zelle Email</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 font-mono text-lg text-violet-300">payments@topshelffarms.com</code>
                    <button
                      onClick={() => copyToClipboard("payments@topshelffarms.com", "Zelle Email")}
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Amount to Send</label>
                  <div className="px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 font-mono text-2xl font-bold text-white">
                    {formatPrice(total)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Your Zelle Email or Phone</label>
                  <input
                    type="text"
                    placeholder="your@email.com or +1 (555) 123-4567"
                    value={paymentDetails.zelleEmail || paymentDetails.zellePhone || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes("@")) {
                        setPaymentDetails({ ...paymentDetails, zelleEmail: val, zellePhone: "" });
                      } else {
                        setPaymentDetails({ ...paymentDetails, zellePhone: val, zelleEmail: "" });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition"
                  />
                  <p className="mt-1 text-xs text-ink-400">Enter the email or phone linked to your Zelle</p>
                </div>

                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-violet-300">
                      <p className="font-medium">How it works:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Open your bank app and find Zelle</li>
                        <li>Send <strong>{formatPrice(total)}</strong> to <code className="font-mono bg-white/5 px-1 rounded">payments@topshelffarms.com</code></li>
                        <li>Add memo: <code className="font-mono bg-white/5 px-1 rounded">{orderId || generateOrderId()}</code></li>
                        <li>Payment is instant - we'll confirm immediately</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "crypto":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${method.iconBg}`}>
                  <Icon className={`h-6 w-6 ${method.textColor}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{method.name} Payment</h4>
                  <p className="text-sm text-ink-400">Choose your preferred network</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {CRYPTO_NETWORKS.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => setSelectedCryptoNetwork(network.id)}
                    className={`p-3 rounded-xl border-2 transition text-center ${
                      selectedCryptoNetwork === network.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className={`text className={${network.color} text-2xl font-bold`}>{network.icon}</span>
                    <p className="text-xs text-ink-400 mt-1">{network.symbol}</p>
                    <p className="text-xs font-medium text-white">{network.name}</p>
                  </button>
                ))}
              </div>

              {(() => {
                const network = CRYPTO_NETWORKS.find(n => n.id === selectedCryptoNetwork);
                const walletAddresses = {
                  bitcoin: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
                  ethereum: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                  usdc: "0xA0b86a33E6441b8C4C8C4C4C4C4C4C4C4C4C4C4C",
                  usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                };
                const walletAddress = walletAddresses[selectedCryptoNetwork];

                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">
                        {network?.name} ({network?.symbol}) Wallet Address
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 font-mono text-sm text-orange-300 break-all">
                          {walletAddress}
                        </code>
                        <button
                          onClick={() => copyToClipboard(walletAddress, `${network?.symbol} Address`)}
                          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Amount to Send</label>
                      <div className="px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 font-mono text-2xl font-bold text-white">
                        {formatPrice(total)} USD ≈ {selectedCryptoNetwork === "bitcoin" ? "0.0012 BTC" : selectedCryptoNetwork === "ethereum" ? "0.045 ETH" : `${total.toFixed(2)} ${CRYPTO_NETWORKS.find(n => n.id === selectedCryptoNetwork)?.symbol}`}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Your Wallet Address (for refunds)</label>
                      <input
                        type="text"
                        placeholder="Your wallet address"
                        value={paymentDetails.cryptoWalletAddress || ""}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cryptoWalletAddress: e.target.value, cryptoNetwork: selectedCryptoNetwork })}
                        className="w-full px-4 py-3 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition"
                      />
                      <p className="mt-1 text-xs text-ink-400">Enter your wallet address in case we need to issue a refund</p>
                    </div>

                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-orange-300">
                          <p className="font-medium">Important:</p>
                          <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>Send exact amount: <strong>{selectedCryptoNetwork === "bitcoin" ? "0.0012 BTC" : selectedCryptoNetwork === "ethereum" ? "0.045 ETH" : `${total.toFixed(2)} ${CRYPTO_NETWORKS.find(n => n.id === selectedCryptoNetwork)?.symbol}`}</strong></li>
                            <li>Include memo: <code className="font-mono bg-white/5 px-1 rounded">{orderId || generateOrderId()}</code></li>
                            <li>Network confirmations required: {selectedCryptoNetwork === "bitcoin" ? "1" : selectedCryptoNetwork === "ethereum" ? "12" : "1"}</li>
                            <li>Payment expires in 30 minutes</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        );

      case "apple_pay":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${method.iconBg}`}>
                  <Icon className={`h-6 w-6 ${method.textColor}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{method.name} Payment</h4>
                  <p className="text-sm text-ink-400">Fast, secure checkout with Face ID / Touch ID</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center py-8 px-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-white/10">
                      <Apple className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-ink-400">Pay with</p>
                      <p className="font-semibold text-white text-lg">Apple Pay</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-ink-800/50 border border-white/10">
                  <span className="text-ink-300">Total</span>
                  <span className="font-display text-2xl font-bold text-white">{formatPrice(total)}</span>
                </div>

                <button
                  onClick={placeOrder}
                  className="w-full py-4 rounded-xl bg-black border border-white/20 text-white font-semibold text-lg flex items-center justify-center gap-3 hover:border-white/40 transition"
                  disabled={processing}
                >
                  <Apple className="h-5 w-5" />
                  <span>{processing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Pay with Apple Pay"}</span>
                </button>

                <p className="text-center text-xs text-ink-400">
                  Authenticate with Face ID, Touch ID, or passcode
                </p>

                <div className="p-3 rounded-xl bg-slate-700/20 border border-slate-500/20">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-300">
                      <p className="font-medium">How it works:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Click "Pay with Apple Pay" above</li>
                        <li>Authenticate with Face ID / Touch ID</li>
                        <li>Payment completes instantly</li>
                        <li>Order confirmed immediately</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  }

  if (checkoutStep > 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface rounded-3xl p-8 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950">
            <Check size={28} strokeWidth={3} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-white">Order confirmed</h1>
          <p className="mt-2 text-ink-300">
            Thanks for shopping at Top Shelf Exotics. Order #<span className="font-mono font-semibold">{orderId || generateOrderId()}</span> is on its way.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["Order received", "Preparing", "Shipping"].map((s, i) => (
              <div
                key={s}
                className={`rounded-2xl border p-4 ${
                  i === 0 ? "border-accent-400/40 bg-accent-500/10" : "border-white/5"
                }`}
              >
                <p className="text-xs uppercase tracking-wider text-ink-400">Step {i + 1}</p>
                <p className="mt-1 text-sm font-semibold text-white">{s}</p>
              </div>
            ))}
          </div>
          <Link to="/" className="btn-ghost mt-8">
            Continue shopping <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-20 text-center sm:px-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-800 text-ink-300">
          <ShoppingBag size={32} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-ink-300">Add a few favorites to get started.</p>
        <Link to="/shop" className="btn-primary mt-6">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Your cart</h1>
      <p className="mt-1 text-sm text-ink-300">{items.length} item{items.length !== 1 ? "s" : ""}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <AnimatePresence>
            {items.map((it) => (
              <motion.div
                key={`${it.id}-${it.color}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="surface flex items-center gap-4 rounded-2xl p-4"
              >
                <Link to={`/product/${it.id}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                  <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                </Link>
                <div className="flex-1">
                  <Link to={`/product/${it.id}`} className="font-semibold text-white hover:text-accent-300">
                    {it.title}
                  </Link>
                  <p className="text-xs text-ink-400">Color: {it.color}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatPrice(it.price)}</p>
                </div>
                <div className="flex items-center rounded-full border border-white/10">
                  <button
                    onClick={() =>
                      dispatch({
                        type: "UPDATE_QTY",
                        payload: { id: it.id, color: it.color, qty: it.qty - 1 },
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center text-ink-300 hover:text-white"
                    aria-label="Decrease"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{it.qty}</span>
                  <button
                    onClick={() =>
                      dispatch({
                        type: "UPDATE_QTY",
                        payload: { id: it.id, color: it.color, qty: it.qty + 1 },
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center text-ink-300 hover:text-white"
                    aria-label="Increase"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <p className="w-24 text-right font-semibold text-white">
                  {formatPrice(it.price * it.qty)}
                </p>
                <button
                  onClick={() =>
                    dispatch({ type: "REMOVE_FROM_CART", payload: { id: it.id, color: it.color } })
                  }
                  className="rounded-full p-2 text-ink-400 hover:bg-white/5 hover:text-rose-400"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-300">
                <span>Subtotal</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-accent-300">
                  <span>Promo {applied?.code}</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-300">
                <span>Shipping</span>
                <span className="text-white">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-ink-300">
                <span>Tax (est.)</span>
                <span className="text-white">{formatPrice(tax)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Promo code"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-ink-400 focus:outline-none"
              />
              <button
                onClick={applyPromo}
                className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-ink-100 hover:bg-white/10"
              >
                Apply
              </button>
            </div>
            <p className="mt-1 text-[11px] text-ink-400">Try <span className="text-accent-300">TOPSHELF15</span> for 15% off</p>
            <div className="mt-4 flex items-baseline justify-between border-t border-white/5 pt-4">
              <span className="text-sm text-ink-300">Total</span>
              <span className="font-display text-2xl font-bold text-white">{formatPrice(total)}</span>
            </div>

            {/* Shipping Address */}
            <div className="mt-6">
              <button
                onClick={() => setShowShippingForm(!showShippingForm)}
                className="flex w-full items-center justify-between text-sm font-semibold text-ink-300 mb-3"
              >
                <span>Shipping Address</span>
                <ChevronDown size={14} className={`transition ${showShippingForm ? "rotate-180" : ""}`} />
              </button>
              {showShippingForm && (
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ink-400 mb-1">First Name *</label>
                      <input value={shippingAddress.firstName} onChange={(e) => setShippingAddress(s => ({ ...s, firstName: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-400 mb-1">Last Name *</label>
                      <input value={shippingAddress.lastName} onChange={(e) => setShippingAddress(s => ({ ...s, lastName: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-400 mb-1">Email</label>
                    <input value={shippingAddress.email} onChange={(e) => setShippingAddress(s => ({ ...s, email: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-400 mb-1">Phone</label>
                    <input value={shippingAddress.phone} onChange={(e) => setShippingAddress(s => ({ ...s, phone: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-400 mb-1">Address *</label>
                    <input value={shippingAddress.address} onChange={(e) => setShippingAddress(s => ({ ...s, address: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-400 mb-1">Apartment / Suite</label>
                    <input value={shippingAddress.apartment} onChange={(e) => setShippingAddress(s => ({ ...s, apartment: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-ink-400 mb-1">City *</label>
                      <input value={shippingAddress.city} onChange={(e) => setShippingAddress(s => ({ ...s, city: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-400 mb-1">State</label>
                      <input value={shippingAddress.state} onChange={(e) => setShippingAddress(s => ({ ...s, state: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-400 mb-1">ZIP *</label>
                      <input value={shippingAddress.zip} onChange={(e) => setShippingAddress(s => ({ ...s, zip: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-ink-800/50 border border-white/10 text-white placeholder:text-ink-500 focus:border-accent-400/50 focus:ring-accent-400/20 focus:outline-none focus:ring-2 transition text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink-300 mb-3">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPayment === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedPayment(method.id);
                        setShowPaymentDetails(true);
                        setPaymentDetails({});
                      }}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `border-accent-400 bg-gradient-to-br from-accent-500/10 to-accent-500/5`
                          : "border-white/10 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${method.iconBg}`}>
                        <Icon className={`h-5 w-5 ${method.textColor}`} />
                      </div>
                      <p className="mt-2 font-medium text-sm text-white">{method.name}</p>
                      <p className="mt-1 text-[11px] text-ink-400">{method.description}</p>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent-400 text-ink-950">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {showPaymentDetails && selectedPayment && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedPayment}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4"
                  >
                    {renderPaymentDetails()}
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => {
                          setShowPaymentDetails(false);
                          setSelectedPayment(null);
                        }}
                        className="flex-1 btn-ghost"
                      >
                        Change Method
                      </button>
                      <motion.button
                        onClick={placeOrder}
                        disabled={processing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                          processing
                            ? "bg-white/5 text-ink-300"
                            : "bg-gradient-to-r from-accent-400 to-accent-600 text-ink-950 hover:from-accent-300 hover:to-accent-500"
                        }`}
                      >
                        {processing ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                          </span>
                        ) : (
                          `Place Order - ${formatPrice(total)}`
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {!showPaymentDetails && (
              <button
                onClick={() => setShowPaymentDetails(true)}
                disabled={!selectedPayment}
                className="btn-primary mt-5 w-full"
              >
                Continue to Payment <ArrowRight size={14} />
              </button>
            )}

            <p className="mt-3 text-center text-[11px] text-ink-400">Secure encrypted checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
}