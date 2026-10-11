import { useState, useEffect } from "react";
import type React from "react";
import { Link, useLocation, NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Users,
  Settings,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Bell,
  TrendingUp,
  ArrowUpRight,
  LogOut,
  User,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminStats } from "../data/adminMockData";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/categories", label: "Categories", icon: Tag },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/activity", label: "Activity Log", icon: Activity },
  { path: "/admin/seo", label: "SEO Analysis", icon: Search },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

const adminUser = {
  name: "Admin User",
  email: "admin@topshelffarms.com",
  role: "Administrator",
  avatar: null,
};

export default function AdminLayout() {
  const location = useLocation();
  const { state, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const canAccessAdmin = state.isAuthenticated && state.user?.role === "admin" ? true : (import.meta as unknown as { env: Record<string, boolean> }).env.DEV;

  // Check if user is admin
  useEffect(() => {
    if (state.isAuthenticated && state.user?.role !== "admin") {
      logout();
    }
  }, [state, logout]);

  if (!canAccessAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
        <div className="glass-strong max-w-md rounded-2xl border border-white/10 p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Admin access required</h1>
          <p className="mt-3 text-sm text-ink-400">
            Please sign in as an administrator to view the dashboard and management tools.
          </p>
          <Link to="/login?redirect=/admin" className="btn-primary mt-6 inline-flex gap-2">
            <User className="h-4 w-4" />
            Sign in as admin
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-ink-950 overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: collapsed ? -280 : 0 }}
        animate={{ x: collapsed ? -280 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed lg:relative z-50 h-full flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } glass-strong border-r border-white/5`}
      >
        {/* Logo Section */}
        <div className={`flex h-16 items-center justify-between px-4 border-b border-white/5 ${collapsed ? "justify-center" : ""}`}>
          <Link to="/admin" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow flex-shrink-0">
              <Activity className="h-5 w-5 stroke-2.5" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-display text-lg font-bold tracking-wide text-white"
              >
                Top Shelf Admin
              </motion.span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 hover:bg-white/5 hover:text-white transition hidden lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" role="navigation" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-gradient-to-r from-accent-500/10 to-accent-500/5 text-accent-300 border border-accent-500/20 shadow-[0_0_0_1px_rgba(34,240,196,0.15)]"
                    : "text-ink-300 hover:text-white hover:bg-white/5"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/5 p-3">
          {!collapsed && (
            <div className="mb-3 p-3 rounded-xl bg-white/5">
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">Quick Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <StatMini label="Products" value={adminStats.totalProducts} icon={Package} />
                <StatMini label="Orders" value={adminStats.totalOrders} icon={ShoppingCart} />
                <StatMini label="Revenue" value={`$${(adminStats.totalRevenue / 1000).toFixed(0)}K`} icon={TrendingUp} />
                <StatMini label="Customers" value={adminStats.totalUsers.toLocaleString()} icon={Users} />
              </div>
            </div>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`flex items-center gap-3 w-full rounded-xl p-2 transition ${collapsed ? "justify-center" : ""} hover:bg-white/5`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 font-medium text-ink-950 text-sm flex-shrink-0">
                {adminUser.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "AU"}
              </div>
              {!collapsed && (
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{adminUser.name}</p>
                  <p className="text-[11px] text-ink-400 truncate">{adminUser.role}</p>
                </div>
              )}
              {!collapsed && <ChevronDown className="h-4 w-4 text-ink-400" />}
            </button>

            <AnimatePresence>
              {userMenuOpen && !collapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className="absolute bottom-full left-0 right-0 mb-2 surface rounded-xl border border-white/5 shadow-lift overflow-hidden z-10"
                  role="menu"
                >
                  <Link
                    to="/admin/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-200 hover:bg-white/5 hover:text-white"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    to="/account"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-200 hover:bg-white/5 hover:text-white"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <hr className="border-white/5 mx-2 my-1" />
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Bar */}
        <header className={`sticky top-0 z-30 h-16 glass-strong border-b border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-full p-2 text-ink-200 hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-white hidden sm:block">
              {navItems.find(item => isActive(item.path, item.exact))?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-full p-2 text-ink-200 hover:bg-white/5 hover:text-white transition"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">3</span>
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 surface rounded-2xl border border-white/5 shadow-lift overflow-hidden z-50"
                    role="menu"
                  >
                    <div className="border-b border-white/5 p-3 flex items-center justify-between">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      <button className="text-xs text-ink-400 hover:text-ink-200">Mark all read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {[
                        { title: "Low Stock Alert", desc: "Pink Rosay Tee - Only 5 left", time: "5 min ago", type: "warning" },
                        { title: "New Order", desc: "Order #ORD-2024-001247 placed for $55", time: "12 min ago", type: "success" },
                        { title: "SEO Issue Detected", desc: "Jokerz Runtz missing meta description", time: "1 hour ago", type: "error" },
                      ].map((notif, i) => (
                        <div key={i} className="border-b border-white/5 p-3 hover:bg-white/5">
                          <div className="flex items-start gap-2">
                            <div className={`flex h-2 w-2 rounded-full mt-2 ${notif.type === "success" ? "bg-accent-400" : notif.type === "warning" ? "bg-amber-400" : "bg-rose-400"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{notif.title}</p>
                              <p className="text-xs text-ink-300">{notif.desc}</p>
                              <p className="text-[10px] text-ink-400 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-white/5">
                      <Link to="/admin/activity" className="text-sm text-accent-300 hover:text-accent-200 flex items-center gap-1">
                        View all activity <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Store Link */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-200 hover:bg-white/10 hover:text-white transition"
            >
              <Eye className="h-3.5 w-3.5" />
              View Store
            </a>

            {/* Mobile User Button */}
            <button
              className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function StatMini({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-ink-800/50">
      <Icon className="h-4 w-4 text-accent-400" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-ink-400 truncate">{label}</p>
        <p className="text-sm font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}