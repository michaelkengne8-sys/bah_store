import { useState, useEffect } from "react";
import type React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Tag,
  Globe,
  Key,
  Settings,
  GripVertical,
  Copy,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Package,
  Save,
  X,
} from "lucide-react";
import { adminCategories } from "../data/adminMockData";
import { adminApi } from "../lib/adminApi";
import type { AdminCategory, CategoryProductField } from "../types";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  icon: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  sortOrder: z.number().min(0),
  seoTitle: z.string().max(60, "SEO title should be under 60 characters").optional(),
  seoDescription: z.string().max(160, "SEO description should be under 160 characters").optional(),
  productFields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "textarea", "number", "select", "color", "image", "boolean", "array"]),
    required: z.boolean(),
    options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    dependsOn: z.string().optional(),
    showInCategory: z.array(z.string()),
  })).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const fieldTypes = [
  { value: "text", label: "Text", icon: "T" },
  { value: "textarea", label: "Textarea", icon: "[]-" },
  { value: "number", label: "Number", icon: "123" },
  { value: "select", label: "Select", icon: "▼" },
  { value: "color", label: "Color", icon: "■" },
  { value: "image", label: "Image", icon: "🖼" },
  { value: "boolean", label: "Checkbox", icon: "☑" },
  { value: "array", label: "Array (comma-separated)", icon: "[]" },
];

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "sortOrder", direction: "asc" });
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    adminApi.getCategories()
      .then((response) => {
        if (!active) return;

        const next = (response.data || []).map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          image: category.image || "",
          icon: category.icon || "",
          productCount: category._count?.products || category.productCount || 0,
          seoTitle: category.seoTitle || "",
          seoDescription: category.seoDescription || "",
          status: (category.status || "active") as "active" | "inactive",
          sortOrder: category.sortOrder || 0,
          productFields: category.productFields || [],
        }));

        setCategories(next.length ? next : adminCategories);
      })
      .catch(() => {
        if (active) setCategories(adminCategories);
      });

    return () => {
      active = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      icon: "",
      status: "active",
      sortOrder: categories.length + 1,
      seoTitle: "",
      seoDescription: "",
      productFields: [],
    },
  });

  const productFields = useWatch({ control, name: "productFields" }) || [];

  const watchedName = useWatch({ control, name: "name" });
  const watchedSlug = useWatch({ control, name: "slug" });

  useEffect(() => {
    if (watchedName && !watchedSlug) {
      setValue("slug", watchedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), { shouldDirty: false });
    }
  }, [watchedName, watchedSlug, setValue]);

  const filteredCategories = categories
    .filter(c => {
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !c.slug.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortConfig.key as keyof AdminCategory] ?? "";
      const bVal = b[sortConfig.key as keyof AdminCategory] ?? "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });


  const onSubmit = async (data: CategoryFormData) => {
    const normalized = {
      ...data,
      image: data.image || undefined,
      icon: data.icon || "",
      seoTitle: data.seoTitle || "",
      seoDescription: data.seoDescription || "",
      productFields: data.productFields || [],
    };

    try {
      if (editingCategory && editingCategory.id !== "new") {
        const saved = await adminApi.updateCategory(editingCategory.id, normalized);
        setCategories(prev => prev.map(c =>
          c.id === editingCategory.id ? {
            ...c,
            ...normalized,
            ...(saved as Partial<AdminCategory>),
            image: normalized.image || "",
            icon: normalized.icon || "",
            productCount: c.productCount,
            productFields: normalized.productFields,
          } : c
        ));
      } else {
        const saved = await adminApi.createCategory(normalized);
        const newCategory: AdminCategory = {
          id: (saved as Partial<AdminCategory>).id || data.slug,
          name: normalized.name,
          slug: normalized.slug,
          description: normalized.description,
          image: normalized.image || "",
          icon: normalized.icon || "",
          productCount: 0,
          seoTitle: normalized.seoTitle || "",
          seoDescription: normalized.seoDescription || "",
          status: normalized.status,
          sortOrder: normalized.sortOrder,
          productFields: normalized.productFields,
        };
        setCategories(prev => [...prev, newCategory]);
      }
    } catch {
      if (editingCategory) {
        setCategories(prev => prev.map(c =>
          c.id === editingCategory.id ? { ...c, ...normalized, image: normalized.image || "", icon: normalized.icon || "", seoTitle: normalized.seoTitle || "", seoDescription: normalized.seoDescription || "", productFields: normalized.productFields || c.productFields } : c
        ));
      } else {
        const newCategory: AdminCategory = {
          ...normalized,
          id: data.slug,
          image: normalized.image || "",
          icon: normalized.icon || "",
          seoTitle: normalized.seoTitle || "",
          seoDescription: normalized.seoDescription || "",
          productCount: 0,
          productFields: normalized.productFields || [],
        };
        setCategories(prev => [...prev, newCategory]);
      }
    }

    setEditingCategory(null);
  };

  const deleteCategory = async (id: string) => {
    try {
      await adminApi.deleteCategory(id);
    } catch {
      // fallback to local UI update even if the backend rejects the delete
    }

    setCategories(prev => prev.filter(c => c.id !== id));
    setShowDeleteModal(null);
  };

  const duplicateCategory = (category: AdminCategory) => {
    const newCategory: AdminCategory = {
      ...category,
      id: `${category.id}-copy`,
      slug: `${category.slug}-copy`,
      name: `${category.name} (Copy)`,
      productCount: 0,
    };
    setCategories(prev => [...prev, newCategory]);
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
          <h1 className="text-3xl font-bold text-white">Categories</h1>
          <p className="text-ink-400 mt-1">Manage product categories and their specific attributes</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="btn-ghost gap-2">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={() => {
              reset();
              setEditingCategory({ id: "new", name: "", slug: "", description: "", image: "", icon: "", productCount: 0, status: "active", sortOrder: categories.length + 1, seoTitle: "", seoDescription: "", productFields: [] });
            }}
            className="btn-primary gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <StatCard title="Total Categories" value={categories.length} icon={Tag} color="from-blue-500 to-blue-600" bg="bg-blue-500/10" />
        <StatCard title="Active" value={categories.filter(c => c.status === "active").length} icon={CheckCircle} color="from-accent-500 to-accent-600" bg="bg-accent-500/10" />
        <StatCard title="Inactive" value={categories.filter(c => c.status === "inactive").length} icon={XCircle} color="from-rose-500 to-rose-600" bg="bg-rose-500/10" />
        <StatCard title="Total Products" value={categories.reduce((sum, c) => sum + c.productCount, 0)} icon={Package} color="from-purple-500 to-purple-600" bg="bg-purple-500/10" />
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-strong rounded-2xl p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-800/50 border border-white/5 text-white placeholder:text-ink-400 focus:outline-none focus:border-accent-400/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-ink-800/50 border border-white/5 text-white py-2.5 px-4 focus:outline-none focus:border-accent-400/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortConfig.key}
            onChange={(e) => setSortConfig(prev => ({ key: e.target.value, direction: prev.key === e.target.value && prev.direction === "asc" ? "desc" : "asc" }))}
            className="rounded-xl bg-ink-800/50 border border-white/5 text-white py-2.5 px-4 focus:outline-none focus:border-accent-400/50"
          >
            <option value="sortOrder">Sort Order</option>
            <option value="name">Name (A-Z)</option>
            <option value="productCount">Product Count</option>
            <option value="status">Status</option>
          </select>
        </div>
      </motion.div>

      {/* Categories Table */}
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
                  <GripVertical className="h-4 w-4 text-ink-500 cursor-grab" />
                </th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Category</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden md:table-cell">Slug</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 hidden lg:table-cell">Description</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Products</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Fields</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Status</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Order</th>
                <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-56">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCategories.map((category, index) => (
                <motion.tr
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <GripVertical className="h-4 w-4 text-ink-500 cursor-grab mx-auto" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                        {category.icon ? (
                          <span className="text-lg">{category.icon}</span>
                        ) : (
                          <Tag className="h-5 w-5 text-ink-400" />
                        )}
                      </div>
                      <div>
                        <Link to={`/admin/categories/${category.id}`} className="font-medium text-white hover:text-accent-300 transition">
                          {category.name}
                        </Link>
                        <p className="text-sm text-ink-400">{category.productFields.length} custom fields</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell font-mono text-sm text-ink-300">{category.slug}</td>
                  <td className="p-4 hidden lg:table-cell">
                    <p className="text-sm text-ink-400 truncate max-w-xs">{category.description}</p>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-white">{category.productCount}</span>
                    <span className="text-sm text-ink-400 ml-1">products</span>
                  </td>
                  <td className="p-4">
                    <span className="chip">{category.productFields.length} fields</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${category.status === "active" ? "bg-accent-500/20 text-accent-400" : "bg-rose-500/20 text-rose-400"}`}>
                      {category.status === "active" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {category.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      value={category.sortOrder}
                      onChange={(e) => setCategories(prev => prev.map(c => c.id === category.id ? { ...c, sortOrder: parseInt(e.target.value) } : c))}
                      className="w-16 rounded-xl border border-white/10 px-3 py-1.5 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                      min="1"
                    />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/shop?category=${category.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition" title="View on store">
                        <Globe className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                        }}
                        className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => duplicateCategory(category)}
                        className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(category.id)}
                        className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-rose-400 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="p-12 text-center">
            <Tag className="h-16 w-16 text-ink-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No categories found</h3>
            <p className="text-ink-400">Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {editingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditingCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface rounded-2xl border border-white/5 max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="border-b border-white/5 p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {editingCategory.id === "new" ? "Create Category" : `Edit ${editingCategory.name}`}
                  </h2>
                  <p className="text-sm text-ink-400 mt-1">Configure category details and custom product fields</p>
                </div>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Form */}
                  <div className="lg:col-span-2 space-y-6">
                    <section className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Tag className="h-5 w-5 text-accent-400" />
                        Basic Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ink-300 mb-1">Name *</label>
                          <input
                            {...register("name")}
                            className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${errors.name ? "border-rose-500" : "border-white/10"}`}
                            placeholder="e.g., Audio"
                          />
                          {errors.name && <p className="mt-1 text-sm text-rose-400">{errors.name.message}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-ink-300 mb-1">Slug *</label>
                          <input
                            {...register("slug")}
                            className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white font-mono focus:border-accent-400 focus:outline-none transition ${errors.slug ? "border-rose-500" : "border-white/10"}`}
                            placeholder="e.g., audio"
                          />
                          {errors.slug && <p className="mt-1 text-sm text-rose-400">{errors.slug.message}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink-300 mb-1">Description *</label>
                        <textarea
                          {...register("description")}
                          rows={3}
                          className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${errors.description ? "border-rose-500" : "border-white/10"}`}
                          placeholder="Describe this category..."
                        />
                        {errors.description && <p className="mt-1 text-sm text-rose-400">{errors.description.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-ink-300 mb-1">Icon (Emoji)</label>
                          <input
                            {...register("icon")}
                            maxLength={2}
                            className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white text-2xl text-center focus:border-accent-400 focus:outline-none transition"
                            placeholder="🎧"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-ink-300 mb-1">Image URL</label>
                          <input
                            {...register("image")}
                            type="url"
                            className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                  </section>

                  <section className="space-y-4 border-t border-white/5 pt-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Globe className="h-5 w-5 text-accent-400" />
                      SEO Settings
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-ink-300 mb-1">SEO Title</label>
                        <input
                          {...register("seoTitle")}
                          maxLength={60}
                          className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${errors.seoTitle ? "border-rose-500" : "border-white/10"}`}
                          placeholder="Custom SEO title (max 60 chars)"
                        />
                        {errors.seoTitle && <p className="mt-1 text-sm text-rose-400">{errors.seoTitle.message}</p>}
                        <p className="mt-1 text-xs text-ink-400">Leave empty to use category name</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink-300 mb-1">SEO Description</label>
                        <textarea
                          {...register("seoDescription")}
                          maxLength={160}
                          rows={2}
                          className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${errors.seoDescription ? "border-rose-500" : "border-white/10"}`}
                          placeholder="Custom meta description (max 160 chars)"
                        />
                        {errors.seoDescription && <p className="mt-1 text-sm text-rose-400">{errors.seoDescription.message}</p>}
                        <p className="mt-1 text-xs text-ink-400">Leave empty to auto-generate from description</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 border-t border-white/5 pt-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Settings className="h-5 w-5 text-accent-400" />
                      Settings
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink-300 mb-1">Status *</label>
                        <select
                          {...register("status")}
                          className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-ink-300 mb-1">Sort Order *</label>
                        <input
                          type="number"
                          {...register("sortOrder", { valueAsNumber: true })}
                          min={1}
                          className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Product Fields Sidebar */}
                  <div className="lg:col-span-1 space-y-6">
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Key className="h-5 w-5 text-accent-400" />
                          Custom Product Fields
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            const newField: CategoryProductField = {
                              key: `field_${Date.now()}`,
                              label: "",
                              type: "text",
                              required: false,
                              options: [],
                              placeholder: "",
                              helpText: "",
                              dependsOn: "",
                              showInCategory: [watchedSlug || editingCategory?.slug || ""],
                            };
                            setValue("productFields", [...productFields, newField]);
                          }}
                          className="btn-ghost gap-1 text-sm"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Field
                        </button>
                      </div>

                      <p className="text-sm text-ink-400">Define category-specific attributes that appear when adding products to this category.</p>

                      <AnimatePresence>
                        {productFields.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 rounded-xl border-2 border-dashed border-white/10"
                          >
                            <Key className="h-12 w-12 text-ink-500 mx-auto mb-3" />
                            <p className="text-ink-400">No custom fields defined</p>
                            <p className="text-xs text-ink-500 mt-1">Add fields to capture category-specific product data</p>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                          >
                            {productFields.map((field, index) => (
                              <motion.div
                                key={field.key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="glass-strong rounded-xl p-4 border border-white/5"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-ink-400 text-sm font-mono">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-ink-400 mb-1">Field Key *</label>
                                        <input
                                          value={field.key}
                                          onChange={(e) => {
                                            const newFields = [...productFields];
                                            newFields[index] = { ...newFields[index], key: e.target.value };
                                            setValue("productFields", newFields);
                                          }}
                                          className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm font-mono focus:border-accent-400 focus:outline-none"
                                          placeholder="e.g., driver_size"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-ink-400 mb-1">Label *</label>
                                        <input
                                          value={field.label}
                                          onChange={(e) => {
                                            const newFields = [...productFields];
                                            newFields[index] = { ...newFields[index], label: e.target.value };
                                            setValue("productFields", newFields);
                                          }}
                                          className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                                          placeholder="e.g., Driver Size"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-ink-400 mb-1">Type *</label>
                                        <select
                                          value={field.type}
                                          onChange={(e) => {
                                            const newFields = [...productFields];
                                            newFields[index] = { ...newFields[index], type: e.target.value as CategoryProductField["type"] };
                                            setValue("productFields", newFields);
                                          }}
                                          className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                                        >
                                          {fieldTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-ink-400 mb-1">Required</label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={(e) => {
                                              const newFields = [...productFields];
                                              newFields[index] = { ...newFields[index], required: e.target.checked };
                                              setValue("productFields", newFields);
                                            }}
                                            className="h-4 w-4 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                                          />
                                          <span className="text-sm text-ink-200">Yes</span>
                                        </label>
                                      </div>
                                    </div>

                                    {field.type === "select" && (
                                      <div className="space-y-2 pt-2 border-t border-white/5">
                                        <label className="block text-xs font-medium text-ink-400 mb-1">Options (one per line, format: value|label)</label>
                                        <textarea
                                          value={field.options?.map(o => `${o.value}|${o.label}`).join("\n") || ""}
                                          onChange={(e) => {
                                            const options = e.target.value.split("\n").filter(Boolean).map(line => {
                                              const [value, label] = line.split("|");
                                              return { value: value.trim(), label: label.trim() || value.trim() };
                                            });
                                            const newFields = [...productFields];
                                            newFields[index] = { ...newFields[index], options };
                                            setValue("productFields", newFields);
                                          }}
                                          rows={3}
                                          className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm font-mono focus:border-accent-400 focus:outline-none"
                                          placeholder="small|Small&#10;medium|Medium&#10;large|Large"
                                        />
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-ink-400 mb-1">Placeholder</label>
                                        <input
                                          value={field.placeholder || ""}
                                          onChange={(e) => {
                                            const newFields = [...productFields];
                                            newFields[index] = { ...newFields[index], placeholder: e.target.value };
                                            setValue("productFields", newFields);
                                          }}
                                          className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                                          placeholder="e.g., 40mm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-ink-400 mb-1">Help Text</label>
                                        <input
                                          value={field.helpText || ""}
                                          onChange={(e) => {
                                            const newFields = [...productFields];
                                            newFields[index] = { ...newFields[index], helpText: e.target.value };
                                            setValue("productFields", newFields);
                                          }}
                                          className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                                          placeholder="Additional guidance for content editors"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                      <div className="flex items-center gap-2 text-xs text-ink-400">
                                        <Info className="h-3 w-3" />
                                        Shown in: {field.showInCategory?.join(", ") || "all"}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newFields = productFields.filter((_, i) => i !== index);
                                          setValue("productFields", newFields);
                                        }}
                                        className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-rose-400 transition"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  </div>
                  {/* Form Actions */}
                  <div className="mt-6 pt-6 border-t border-white/5 flex justify-end gap-3 lg:col-span-3">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? "Saving..." : editingCategory.id === "new" ? "Create Category" : "Save Changes"}
                    </button>
                  </div>
                </div>
            </div>
        </form>      
        </motion.div>
      </motion.div>
    )}
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface rounded-2xl border border-white/5 max-w-md w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10">
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Delete Category</h3>
              </div>
              <p className="text-ink-300 mb-6">
                Are you sure you want to delete this category? This action cannot be undone.
                Products in this category will need to be reassigned.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCategory(showDeleteModal)}
                  className="btn-ghost text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
    </div>
  );


function StatCard({ title, value, icon: Icon, color, bg }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
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
}}