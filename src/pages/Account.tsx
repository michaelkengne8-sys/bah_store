import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  Package,
  MapPin,
  ChevronRight,
  Edit2,
  Loader2,
  X,
  Shield,
  Truck,
  MessageSquare,
  Star,
  Wallet,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

const orders = [
  {
    id: "LX-10241",
    date: "Jun 28, 2026",
    status: "Delivered",
    total: 26,
    item: "Sweet N Sour Og 20% THC - 3.5g",
    statusColor: "text-accent-300",
  },
  {
    id: "LX-10198",
    date: "Jun 12, 2026",
    status: "In transit",
    total: 55,
    item: "Jokerz Runtz 24.6% THC - 3.5g",
    statusColor: "text-amber-300",
  },
  {
    id: "LX-10112",
    date: "May 30, 2026",
    status: "Delivered",
    total: 40,
    item: "Blue Razz Tee - Men's L",
    statusColor: "text-accent-300",
  },
];

const loyaltyTiers = [
  { tier: "bronze", name: "Bronze", minPoints: 0, color: "text-amber-400", bg: "bg-amber-500/10" },
  { tier: "silver", name: "Silver", minPoints: 500, color: "text-slate-300", bg: "bg-slate-500/10" },
  { tier: "gold", name: "Gold", minPoints: 2000, color: "text-yellow-300", bg: "bg-yellow-500/10" },
  { tier: "platinum", name: "Platinum", minPoints: 5000, color: "text-purple-300", bg: "bg-purple-500/10" },
];

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional().refine((val) => !val || /^[\d\s\-+()]{10,}$/.test(val), {
    message: "Please enter a valid phone number",
  }),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Account() {
  const { state: authState, updateProfile, changePassword } = useAuth();
  const { pushToast } = useStore();
  const location = useLocation();

  const user = authState.user;
  const isLoading = authState.isLoading;

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "addresses">("profile");

  // Sync the active tab with the URL path (state adjusted during render, per React guidance).
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    const subpath = location.pathname.replace("/account", "").split("/")[1];
    if (subpath === "addresses") setActiveTab("addresses");
    else if (subpath === "security") setActiveTab("security");
    else setActiveTab("profile");
  }

  // Forms
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [addresses, setAddresses] = useState([
    {
      id: "addr-1",
      label: "Home",
      name: "Guy Anderson",
      address: "123 Luxury Lane, Apt 4B",
      city: "New York, NY 10001",
      country: "United States",
      isDefault: true,
    },
    {
      id: "addr-2",
      label: "Work",
      name: "Guy Anderson",
      address: "456 Business Blvd, Suite 800",
      city: "San Francisco, CA 94105",
      country: "United States",
      isDefault: false,
    },
  ]);

  const handleUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      await updateProfile(data);
      pushToast("Profile updated successfully", "success");
      setShowProfileModal(false);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Failed to update profile", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      pushToast("Password changed successfully", "success");
      setShowPasswordModal(false);
      passwordForm.reset();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Failed to change password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getCurrentTier = () => {
    if (!user) return loyaltyTiers[0];
    return [...loyaltyTiers].reverse().find((t) => user.loyaltyPoints >= t.minPoints) || loyaltyTiers[0];
  };

  const currentTier = getCurrentTier();
  const nextTier = loyaltyTiers.find((t) => t.tier !== currentTier.tier && t.minPoints > currentTier.minPoints);
  const progressToNext = nextTier
    ? Math.min(100, ((user?.loyaltyPoints || 0) - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints) * 100)
    : 100;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-accent-400 animate-spin" />
            <p className="text-ink-300 font-medium">Loading your account...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
      >
        <div className="surface rounded-3xl p-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-500/10 text-accent-400">
            <User className="h-10 w-10" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-white">Sign in to your account</h2>
          <p className="mt-2 text-ink-300">Access your orders, wishlist, and exclusive rewards</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/login" className="btn-primary">
              Sign in
            </Link>
            <Link to="/signup" className="btn-ghost">
              Create account
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface h-fit rounded-3xl p-6 lg:col-span-1 sticky top-24"
        >
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-display text-2xl font-bold text-ink-950">
              {initials}
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-white">{user.name}</h2>
            <p className="text-xs text-ink-300">{user.email}</p>
            <p className="mt-2 chip border-accent-400/30 bg-accent-500/10 text-accent-300">
              Top Shelf Insider · {currentTier.name}
            </p>
          </div>

          {/* Loyalty Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-ink-300">{currentTier.name} Member</span>
              <span className="font-semibold text-white">{user.loyaltyPoints.toLocaleString()} pts</span>
            </div>
            <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full ${currentTier.bg} rounded-full transition-all duration-500`}
              />
            </div>
            {nextTier && (
              <p className="mt-1 text-xs text-ink-400">
                {nextTier.minPoints - user.loyaltyPoints} points to {nextTier.name}
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/5 pt-5">
            <div>
              <p className="text-lg font-bold text-white">{orders.length}</p>
              <p className="text-[11px] text-ink-400">Orders</p>
            </div>
            <Link to="/wishlist" className="col-span-1">
              <div>
                <p className="text-lg font-bold text-white">8</p>
                <p className="text-[11px] text-ink-400">Saved</p>
              </div>
            </Link>
            <div>
              <p className="text-lg font-bold text-white">{user.loyaltyPoints.toLocaleString()}</p>
              <p className="text-[11px] text-ink-400">Points</p>
            </div>
          </div>

          <Link
            to="/account/cashouts"
            className="mt-4 flex items-center gap-3 rounded-2xl bg-accent-500/10 p-4 transition hover:bg-accent-500/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Cashouts</p>
              <p className="text-xs text-ink-400">Withdraw your earnings</p>
            </div>
            <ChevronRight size={14} className="text-ink-400" />
          </Link>
        </motion.aside>

        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Navigation Tabs */}
          <div className="surface rounded-3xl p-1">
            <nav className="flex gap-1" role="tablist">
              {[
                { id: "profile", label: "Profile", icon: User },
                { id: "security", label: "Security", icon: Shield },
                { id: "addresses", label: "Addresses", icon: MapPin },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-accent-400 to-accent-600 text-ink-950 shadow-glow"
                        : "text-ink-200 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Profile Tab */}
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="surface rounded-3xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-semibold text-white">Profile Information</h2>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="btn-ghost gap-2 text-sm"
                  >
                    <Edit2 size={14} />
                    Edit Profile
                  </button>
                </div>

                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-1">
                    <dt className="text-xs uppercase tracking-wider text-ink-400">Full Name</dt>
                    <dd className="mt-1 text-sm font-medium text-white">{user.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs uppercase tracking-wider text-ink-400">Email</dt>
                    <dd className="mt-1 text-sm font-medium text-white">{user.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs uppercase tracking-wider text-ink-400">Phone</dt>
                    <dd className="mt-1 text-sm font-medium text-ink-300">{user.phone || "Not set"}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs uppercase tracking-wider text-ink-400">Member Since</dt>
                    <dd className="mt-1 text-sm font-medium text-ink-300">
                      {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs uppercase tracking-wider text-ink-400">Last Login</dt>
                    <dd className="mt-1 text-sm font-medium text-ink-300">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs uppercase tracking-wider text-ink-400">Loyalty Tier</dt>
                    <dd className="mt-1 flex items-center gap-2">
                      <span
                        className={`chip ${currentTier.bg} ${currentTier.color} border-${currentTier.color.replace("text-", "")}/30`}
                      >
                        {currentTier.name}
                      </span>
                    </dd>
                  </div>
                </dl>

                {/* Loyalty Benefits */}
                <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-accent-500/10 to-accent-600/10 border border-accent-400/20">
                  <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                    <Star className="h-4 w-4 text-accent-400" /> Insider Benefits
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-ink-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> Free shipping on all orders</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> Early access to new releases</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> Birthday gift</li>
                    {currentTier.tier !== "bronze" && (
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> Priority support</li>
                    )}
                    {currentTier.tier === "gold" || currentTier.tier === "platinum" ? (
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> Exclusive sales access</li>
                    ) : null}
                    {currentTier.tier === "platinum" && (
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> Personal shopping concierge</li>
                    )}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="surface rounded-3xl p-6"
              >
                <h2 className="font-display text-lg font-semibold text-white mb-6">Security Settings</h2>

                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-ink-800/50 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Change Password</h3>
                          <p className="text-sm text-ink-400">Update your password regularly for security</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="btn-ghost gap-2 text-sm"
                      >
                        <Settings size={14} />
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-ink-800/50 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                          <p className="text-sm text-ink-400">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <button className="btn-ghost gap-2 text-sm" disabled>
                        <Settings size={14} />
                        Enable
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-ink-800/50 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Login Activity</h3>
                          <p className="text-sm text-ink-400">Review recent sign-ins and devices</p>
                        </div>
                      </div>
                      <Link to="/account/security/activity" className="btn-ghost gap-2 text-sm">
                        <ChevronRight size={14} />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="surface rounded-3xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-semibold text-white">Saved Addresses</h2>
                  <Link to="/account/addresses/new" className="btn-primary text-sm">
                    Add Address
                  </Link>
                </div>

                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-2xl bg-ink-800/50 border border-white/5 flex items-start justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{addr.name}</span>
                            <span className="chip bg-accent-500/10 text-accent-300 border-accent-400/30 text-xs">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="chip bg-green-500/10 text-green-300 border-green-400/30 text-xs">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-ink-300">{addr.address}</p>
                          <p className="text-sm text-ink-400">{addr.city}, {addr.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => pushToast("Edit address feature coming soon", "info")} className="btn-ghost text-sm gap-1">Edit</button>
                        {!addr.isDefault && (
                          <button onClick={() => { setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id }))); pushToast("Default address updated", "success"); }} className="btn-ghost text-sm gap-1 text-amber-400 hover:text-amber-300">
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-white">Recent Orders</h2>
              <Link to="/account/orders" className="btn-ghost text-sm gap-1">
                View All
                <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.id}`}
                  className="flex items-center gap-3 py-3 transition hover:bg-white/5 rounded-xl mx-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-accent-300 flex-shrink-0">
                    <Package size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{order.item}</p>
                    <p className="text-[11px] text-ink-400">{order.id} · {order.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">${order.total}</p>
                    <p className={`text-[11px] ${order.statusColor}`}>{order.status}</p>
                  </div>
                  <ChevronRight size={14} className="text-ink-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 px-4 py-24 backdrop-blur-md"
            onClick={() => setShowProfileModal(false)}
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
                <h3 className="font-display text-lg font-semibold text-white">Edit Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-full p-1.5 text-ink-300 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="p-6 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-ink-200 mb-2">
                    Full Name
                  </label>
                  <input
                    {...profileForm.register("name")}
                    id="name"
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                      profileForm.formState.errors.name
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                    } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                    disabled={isUpdatingProfile}
                  />
                  {profileForm.formState.errors.name && (
                    <p className="mt-1.5 text-sm text-rose-400">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-ink-200 mb-2">
                    Email
                  </label>
                  <input
                    {...profileForm.register("email")}
                    id="email"
                    type="email"
                    className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                      profileForm.formState.errors.email
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                    } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                    disabled={isUpdatingProfile}
                  />
                  {profileForm.formState.errors.email && (
                    <p className="mt-1.5 text-sm text-rose-400">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-ink-200 mb-2">
                    Phone (optional)
                  </label>
                  <input
                    {...profileForm.register("phone")}
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                      profileForm.formState.errors.phone
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                    } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                    disabled={isUpdatingProfile}
                  />
                  {profileForm.formState.errors.phone && (
                    <p className="mt-1.5 text-sm text-rose-400">{profileForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 btn-ghost"
                    disabled={isUpdatingProfile}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isUpdatingProfile}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                      isUpdatingProfile
                        ? "bg-white/5 text-ink-300"
                        : "bg-gradient-to-r from-accent-400 to-accent-600 text-ink-950 hover:from-accent-300 hover:to-accent-500"
                    }`}
                  >
                    {isUpdatingProfile ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 px-4 py-24 backdrop-blur-md"
            onClick={() => setShowPasswordModal(false)}
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
                <h3 className="font-display text-lg font-semibold text-white">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-full p-1.5 text-ink-300 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="p-6 space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-ink-200 mb-2">
                    Current Password
                  </label>
                  <input
                    {...passwordForm.register("currentPassword")}
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                      passwordForm.formState.errors.currentPassword
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                    } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                    disabled={isChangingPassword}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1.5 text-sm text-rose-400">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-ink-200 mb-2">
                    New Password
                  </label>
                  <input
                    {...passwordForm.register("newPassword")}
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                      passwordForm.formState.errors.newPassword
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                    } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                    disabled={isChangingPassword}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1.5 text-sm text-rose-400">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-200 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    {...passwordForm.register("confirmPassword")}
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                      passwordForm.formState.errors.confirmPassword
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                    } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                    disabled={isChangingPassword}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-rose-400">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 btn-ghost"
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isChangingPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                      isChangingPassword
                        ? "bg-white/5 text-ink-300"
                        : "bg-gradient-to-r from-accent-400 to-accent-600 text-ink-950 hover:from-accent-300 hover:to-accent-500"
                    }`}
                  >
                    {isChangingPassword ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Update Password"
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Icons needed
function Check({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
}
function Settings({ size = 14 }: { size?: number }) {
  return <svg className={`h-${size} w-${size}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}