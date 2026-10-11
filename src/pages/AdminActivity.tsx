import { useState, useMemo } from "react";
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Package,
  Tag,
  ShoppingCart,
  Users,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Eye,
  ExternalLink,
  Calendar,
  User,
  Globe,
  Loader2,
  Hash,
  FileText,
  X,
} from "lucide-react";
import { adminActivities } from "../data/adminMockData";
import type { AdminActivity as AdminActivityType } from "../types";

const severityConfig = {
  info: { label: "Info", color: "bg-blue-500/20 text-blue-400", icon: Activity, bg: "bg-blue-500/10" },
  success: { label: "Success", color: "bg-accent-500/20 text-accent-400", icon: CheckCircle, bg: "bg-accent-500/10" },
  warning: { label: "Warning", color: "bg-amber-500/20 text-amber-400", icon: AlertTriangle, bg: "bg-amber-500/10" },
  error: { label: "Error", color: "bg-rose-500/20 text-rose-400", icon: XCircle, bg: "bg-rose-500/10" },
};

const entityIcons = {
  product: Package,
  category: Tag,
  order: ShoppingCart,
  user: Users,
  settings: Settings,
};

export default function AdminActivity() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const filteredActivities = useMemo(() => {
    let result = [...adminActivities];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.action.toLowerCase().includes(query) ||
        a.entityName.toLowerCase().includes(query) ||
        a.userName.toLowerCase().includes(query) ||
        a.userEmail.toLowerCase().includes(query) ||
        a.details?.toString?.().toLowerCase().includes(query)
      );
    }

    if (severityFilter !== "all") {
      result = result.filter(a => a.severity === severityFilter);
    }

    if (entityFilter !== "all") {
      result = result.filter(a => a.entity === entityFilter);
    }

    // Date range filter
    const now = new Date();
    const rangeMs = {
      "1d": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    }[dateRange] || 7 * 24 * 60 * 60 * 1000;

    const cutoff = new Date(now.getTime() - rangeMs);
    result = result.filter(a => new Date(a.timestamp) >= cutoff);

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof AdminActivityType];
      const bVal = b[sortConfig.key as keyof AdminActivityType];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchQuery, severityFilter, entityFilter, dateRange, sortConfig]);

  const stats = useMemo(() => {
    const total = adminActivities.length;
    const bySeverity = adminActivities.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byEntity = adminActivities.reduce((acc, a) => {
      acc[a.entity] = (acc[a.entity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byUser = adminActivities.reduce((acc, a) => {
      acc[a.userName] = (acc[a.userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, bySeverity, byEntity, byUser };
  }, []);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedActivities.length === filteredActivities.length) {
      setSelectedActivities([]);
    } else {
      setSelectedActivities(filteredActivities.map(a => a.id));
    }
  };

  const exportActivities = () => {
    const data = filteredActivities.map(a => ({
      Date: new Date(a.timestamp).toLocaleString(),
      User: a.userName,
      Email: a.userEmail,
      Action: a.action,
      Entity: a.entity,
      "Entity Name": a.entityName,
      Severity: a.severity,
      IP: a.ipAddress,
      Details: JSON.stringify(a.details),
    }));
    const csv = [Object.keys(data[0]).join(","), ...data.map(row => Object.values(row).map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      product: "Product",
      category: "Category",
      order: "Order",
      user: "User",
      settings: "Settings",
    };
    return labels[entity] || entity;
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
          <h1 className="text-3xl font-bold text-white">Activity Log</h1>
          <p className="text-ink-400 mt-1">Monitor and audit all administrative actions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportActivities}
            disabled={filteredActivities.length === 0}
            className="btn-ghost gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button className="btn-ghost gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
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
        <StatCard
          title="Total Activities"
          value={stats.total.toLocaleString()}
          icon={Activity}
          color="from-blue-500 to-blue-600"
          bg="bg-blue-500/10"
        />
        <StatCard
          title="Success"
          value={stats.bySeverity.success || 0}
          icon={CheckCircle}
          color="from-accent-500 to-accent-600"
          bg="bg-accent-500/10"
        />
        <StatCard
          title="Warnings"
          value={stats.bySeverity.warning || 0}
          icon={AlertTriangle}
          color="from-amber-500 to-amber-600"
          bg="bg-amber-500/10"
        />
        <StatCard
          title="Errors"
          value={stats.bySeverity.error || 0}
          icon={XCircle}
          color="from-rose-500 to-rose-600"
          bg="bg-rose-500/10"
        />
        <StatCard
          title="Info"
          value={stats.bySeverity.info || 0}
          icon={Shield}
          color="from-purple-500 to-purple-600"
          bg="bg-purple-500/10"
        />
      </motion.div>

      {/* Filters */}
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
              placeholder="Search activities, users, actions..."
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
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-ink-800/50 border-0 text-white px-3 py-2.5 focus:outline-none text-sm"
            >
              <option value="1d">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Severities</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Entity Type</label>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="all">All Entities</option>
                  <option value="product">Product</option>
                  <option value="category">Category</option>
                  <option value="order">Order</option>
                  <option value="user">User</option>
                  <option value="settings">Settings</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Sort By</label>
                <select
                  value={sortConfig.key}
                  onChange={(e) => handleSort(e.target.value)}
                  className="w-full rounded-xl bg-ink-800/50 border border-white/5 text-white py-2 px-3 focus:outline-none focus:border-accent-400/50"
                >
                  <option value="timestamp">Date (Newest)</option>
                  <option value="action">Action</option>
                  <option value="entity">Entity</option>
                  <option value="userName">User</option>
                  <option value="severity">Severity</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Activity Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-strong rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-12">
                  <input
                    type="checkbox"
                    checked={selectedActivities.length === filteredActivities.length && filteredActivities.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
                  />
                </th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 cursor-pointer hover:text-white" onClick={() => handleSort("timestamp")}>
                  Date & Time
                  {sortConfig.key === "timestamp" && (sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />)}
                </th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell cursor-pointer hover:text-white" onClick={() => handleSort("userName")}>
                  User
                </th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 cursor-pointer hover:text-white" onClick={() => handleSort("action")}>
                  Action
                </th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell cursor-pointer hover:text-white" onClick={() => handleSort("entity")}>
                  Entity
                </th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden xl:table-cell">
                  Entity Name
                </th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 cursor-pointer hover:text-white" onClick={() => handleSort("severity")}>
                  Severity
                </th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-48">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <Activity className="h-12 w-12 text-ink-500 mx-auto mb-3" />
                    <p className="text-ink-400">No activities found</p>
                    <p className="text-sm text-ink-500 mt-1">Try adjusting your filters or search query</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    selected={selectedActivities.includes(activity.id)}
                    onSelect={toggleSelect}
                    expanded={expandedActivity === activity.id}
                    onToggleExpand={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                    formatRelativeTime={formatRelativeTime}
                    getEntityLabel={getEntityLabel}
                    entityIcons={entityIcons}
                    severityConfig={severityConfig}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-white/5 p-4 flex items-center justify-between">
          <p className="text-sm text-ink-400">
            Showing {filteredActivities.length} of {adminActivities.length} activities
          </p>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition disabled:opacity-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-white/5 text-white flex items-center justify-center">1</button>
            <button className="w-8 h-8 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">2</button>
            <button className="w-8 h-8 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">3</button>
            <button className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Activity Details Modal */}
      <AnimatePresence>
        {expandedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setExpandedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface rounded-2xl border border-white/5 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-b border-white/5 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Activity Details</h3>
                <button
                  onClick={() => setExpandedActivity(null)}
                  className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <ActivityDetail
                  activity={adminActivities.find(a => a.id === expandedActivity)!}
                  formatRelativeTime={formatRelativeTime}
                  getEntityLabel={getEntityLabel}
                  entityIcons={entityIcons}
                  severityConfig={severityConfig}
                />
              </div>
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
          <p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`${bg} rounded-xl p-3`}>
          <Icon className={`h-6 w-6 bg-gradient-to-br ${color} bg-clip-text text-transparent`} />
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity, selected, onSelect, expanded, onToggleExpand, formatRelativeTime, getEntityLabel, entityIcons, severityConfig }: {
  activity: AdminActivityType;
  selected: boolean;
  onSelect: (id: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  formatRelativeTime: (ts: string) => string;
  getEntityLabel: (e: string) => string;
  entityIcons: Record<string, React.ComponentType<{ className?: string }>>;
  severityConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }>; bg: string }>;
}) {
  const EntityIcon = entityIcons[activity.entity] || Activity;
  const config = severityConfig[activity.severity];

  return (
    <>
      <tr
        className={`${selected ? "bg-accent-500/5" : "hover:bg-white/5"} transition-colors`}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName !== "INPUT" && target.tagName !== "BUTTON") {
            onToggleExpand();
          }
        }}
      >
        <td className="p-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(activity.id)}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 rounded border-ink-500 text-accent-500 focus:ring-accent-500"
          />
        </td>
        <td className="p-4">
          <div className="text-sm text-white font-medium">{new Date(activity.timestamp).toLocaleDateString()}</div>
          <div className="text-xs text-ink-400">{formatRelativeTime(activity.timestamp)}</div>
        </td>
        <td className="p-4 hidden md:table-cell">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
              <User className="h-4 w-4 text-ink-300" />
            </div>
            <div>
              <div className="font-medium text-white">{activity.userName}</div>
              <div className="text-xs text-ink-400">{activity.userEmail}</div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <span className="font-medium text-white">{activity.action}</span>
        </td>
        <td className="p-4 hidden lg:table-cell">
          <span className="chip">
            <EntityIcon className="h-3 w-3 mr-1" />
            {getEntityLabel(activity.entity)}
          </span>
        </td>
        <td className="p-4 hidden xl:table-cell">
          <span className="font-medium text-white truncate block max-w-xs">{activity.entityName}</span>
        </td>
        <td className="p-4">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
            <config.icon className="h-3 w-3" />
            {config.label}
          </span>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {activity.entityId !== "bulk" && activity.entityId !== "audit" && activity.entityId !== "sitemap" && (
              <button className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition" title="View entity">
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={8} className="p-0">
              <div className="bg-ink-900/50 border-t border-white/5 px-6 py-4">
                <ActivityDetail
                  activity={activity}
                  formatRelativeTime={formatRelativeTime}
                  getEntityLabel={getEntityLabel}
                  entityIcons={entityIcons}
                  severityConfig={severityConfig}
                />
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

function ActivityDetail({ activity, formatRelativeTime, getEntityLabel, entityIcons, severityConfig }: {
  activity: AdminActivityType;
  formatRelativeTime: (ts: string) => string;
  getEntityLabel: (e: string) => string;
  entityIcons: Record<string, React.ComponentType<{ className?: string }>>;
  severityConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }>; bg: string }>;
}) {
  const EntityIcon = entityIcons[activity.entity] || Activity;
  const config = severityConfig[activity.severity];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`${config.bg} rounded-xl p-3`}>
            <config.icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <h4 className="font-semibold text-white">{activity.action}</h4>
            <p className="text-sm text-ink-400">{getEntityLabel(activity.entity)}: {activity.entityName}</p>
          </div>
        </div>

        <div className="space-y-3">
          <DetailRow label="User" value={activity.userName} subValue={activity.userEmail} icon={User} />
          <DetailRow label="Entity" value={getEntityLabel(activity.entity)} icon={EntityIcon} />
          <DetailRow label="Entity ID" value={activity.entityId} icon={Hash} />
          <DetailRow label="Severity" value={config.label} icon={config.icon} iconColor={config.color} />
          <DetailRow label="Timestamp" value={`${new Date(activity.timestamp).toLocaleString()} (${formatRelativeTime(activity.timestamp)})`} icon={Calendar} />
          <DetailRow label="IP Address" value={activity.ipAddress} icon={Globe} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h5 className="text-sm font-semibold text-ink-300 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Details
          </h5>
          <div className="bg-ink-900/50 rounded-xl p-4 max-h-64 overflow-auto">
            <pre className="text-sm text-ink-300 font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(activity.details, null, 2)}
            </pre>
          </div>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-ink-300 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System Info
          </h5>
          <div className="bg-ink-900/50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-ink-400">User Agent</span>
                <div className="text-white font-mono truncate">{activity.userAgent}</div>
              </div>
              <div>
                <span className="text-ink-400">Session</span>
                <div className="text-white font-mono truncate">{activity.id.slice(-8)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, subValue, icon: Icon, iconColor }: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
      <Icon className={`h-5 w-5 text-ink-400 shrink-0 ${iconColor || ""}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-400">{label}</p>
        <p className="text-sm text-white truncate">{value}</p>
        {subValue && <p className="text-xs text-ink-400 truncate">{subValue}</p>}
      </div>
    </div>
  );
}