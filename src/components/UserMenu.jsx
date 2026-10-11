import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronUp,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

export default function UserMenu() {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const { pushToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const user = state.user;
  const isAuthenticated = state.isAuthenticated;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    pushToast("You've been signed out", "info");
    navigate("/");
    setIsOpen(false);
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!isAuthenticated) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <Link
          to="/login"
          className="btn-ghost text-sm gap-1 px-3 py-2"
          onClick={() => setIsMobileOpen(false)}
        >
          <User size={15} />
          Sign in
        </Link>
        <Link
          to="/signup"
          className="btn-primary text-sm gap-1 px-4 py-2"
          onClick={() => setIsMobileOpen(false)}
        >
          Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Desktop Dropdown Trigger */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1.5 hover:bg-white/5 transition"
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-medium text-ink-950 text-sm">
          {initials || "U"}
        </div>
        <ChevronDown className="h-4 w-4 text-ink-300" />
      </button>

      {/* Mobile User Menu Button */}
      <button
        className="sm:hidden flex items-center gap-2 rounded-full p-2 text-ink-200 hover:bg-white/5 hover:text-white"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Open account menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-medium text-ink-950 text-sm">
          {initials || "U"}
        </div>
      </button>

      {/* Desktop Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 w-64 surface rounded-2xl border border-white/5 shadow-lift overflow-hidden z-50"
            role="menu"
          >
            {/* User Info Header */}
            <div className="border-b border-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-display text-lg font-bold text-ink-950">
                  {initials || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="chip bg-amber-500/10 text-amber-300 border-amber-400/30 text-xs">
                  Top Shelf Insider
                </span>
                <span className="chip bg-accent-500/10 text-accent-300 border-accent-400/30 text-xs">
                  {user?.loyaltyTier?.charAt(0).toUpperCase() + user?.loyaltyTier?.slice(1) || "Bronze"}
                </span>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="py-2" role="menu">
              <Link
                to="/account"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/account/orders"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <Package size={16} />
                <span>My Orders</span>
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <Heart size={16} />
                <span>Wishlist</span>
              </Link>
              <Link
                to="/account/addresses"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <MapPin size={16} />
                <span>Addresses</span>
              </Link>
              <Link
                to="/account/payment"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <CreditCard size={16} />
                <span>Payment Methods</span>
              </Link>
              <Link
                to="/account/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </nav>

            <div className="border-t border-white/5 p-2" role="separator" />

            {/* Security & Admin */}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard size={16} />
                <span>Admin Dashboard</span>
              </Link>
            )}
            <Link
              to="/account/security"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Shield size={16} />
              <span>Security</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
              role="menuitem"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sheet */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 sm:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:hidden surface rounded-t-3xl rounded-tr-none rounded-br-none shadow-lift flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-display text-xl font-bold text-ink-950">
                    {initials || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-ink-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="rounded-full p-1.5 text-ink-300 hover:bg-white/5 hover:text-white"
                >
                  <ChevronUp size={20} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1" role="menu">
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                  role="menuitem"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/account/orders"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                  role="menuitem"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Package size={18} />
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                  role="menuitem"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Heart size={18} />
                  <span>Wishlist</span>
                </Link>
                <Link
                  to="/account/addresses"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                  role="menuitem"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <MapPin size={18} />
                  <span>Addresses</span>
                </Link>
                <Link
                  to="/account/payment"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                  role="menuitem"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <CreditCard size={18} />
                  <span>Payment Methods</span>
                </Link>
                <Link
                  to="/account/settings"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                  role="menuitem"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
                <Link
                  to="/account/security"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-ink-200 hover:bg-white/5 hover:text-white transition"
                  role="menuitem"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Shield size={18} />
                  <span>Security</span>
                </Link>
              </nav>

              {/* Logout */}
              <div className="border-t border-white/5 p-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                  role="menuitem"
                >
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}