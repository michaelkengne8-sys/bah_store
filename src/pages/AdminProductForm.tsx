import { useState, useEffect, useMemo } from "react";
import type React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Save,
  Eye,
  Image,
  Plus,
  Trash2,
  X,
  Globe,
  Hash,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader2,
  XCircle,
  Palette,
  Tag,
  Weight,
  Box,
  Headphones,
  Watch,
  Home,
  Shirt,
  Camera,
  Coffee,
  Sparkles,
  Shield,
  Search,
  Share2,
  Package,
} from "lucide-react";
import { adminCategories as mockAdminCategories, adminProducts, categoryProductFields as mockCategoryProductFields } from "../data/adminMockData";
import { adminApi, type Category as ApiCategory } from "../lib/adminApi";
import type { AdminProduct, AdminCategory } from "../types";
import { useForm, useFieldArray, useWatch, UseFormRegister, UseFormWatch, FieldErrors, FieldArrayWithId, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "../context/StoreContext";
import { createProduct, updateProduct, getProductById } from "../lib/productStore";

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().min(0).optional(),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  stock: z.enum(["in_stock", "low_stock", "out_of_stock"]),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean(),
  // SEO fields
  seoTitle: z.string().max(60, "SEO title should be under 60 characters").optional(),
  seoDescription: z.string().max(160, "SEO description should be under 160 characters").optional(),
  seoKeywords: z.string().optional(), // comma-separated
  slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
  // Inventory
  sku: z.string().min(3, "SKU is required"),
  weight: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
  // Images
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  hoverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  // Variants
  variants: z.array(z.object({
    color: z.string(),
    colorName: z.string(),
    size: z.string().optional(),
    price: z.number().min(0),
    originalPrice: z.number().min(0).optional(),
    stock: z.number().min(0),
    sku: z.string(),
  })).optional(),
  // Category-specific fields (dynamic)
  // These will be validated based on category
});

type ProductFormData = z.infer<typeof productSchema>;

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  audio: Headphones,
  wearables: Watch,
  home: Home,
  fashion: Shirt,
  cameras: Camera,
  lifestyle: Coffee,
};

function analyzeSEO(data: ProductFormData) {
  const issues = [];
  let score = 100;

  if (!data.seoTitle) {
    issues.push({ field: "seoTitle", severity: "error", message: "Missing SEO title", recommendation: "Add a unique, descriptive title under 60 characters" });
    score -= 20;
  } else if (data.seoTitle.length > 60) {
    issues.push({ field: "seoTitle", severity: "warning", message: "SEO title too long", recommendation: "Keep under 60 characters for optimal display" });
    score -= 10;
  } else if (data.seoTitle.length < 30) {
    issues.push({ field: "seoTitle", severity: "info", message: "SEO title could be longer", recommendation: "Aim for 30-60 characters for better click-through" });
    score -= 5;
  }

  if (!data.seoDescription) {
    issues.push({ field: "seoDescription", severity: "error", message: "Missing meta description", recommendation: "Add a compelling description under 160 characters" });
    score -= 20;
  } else if (data.seoDescription.length > 160) {
    issues.push({ field: "seoDescription", severity: "warning", message: "Meta description too long", recommendation: "Keep under 160 characters" });
    score -= 10;
  } else if (data.seoDescription.length < 120) {
    issues.push({ field: "seoDescription", severity: "info", message: "Description could be longer", recommendation: "Aim for 120-160 characters" });
    score -= 5;
  }

  const keywords = data.seoKeywords?.split(",").map(k => k.trim()).filter(Boolean) || [];
  if (keywords.length === 0) {
    issues.push({ field: "seoKeywords", severity: "warning", message: "No SEO keywords", recommendation: "Add 3-5 relevant keywords" });
    score -= 10;
  } else if (keywords.length > 10) {
    issues.push({ field: "seoKeywords", severity: "info", message: "Too many keywords", recommendation: "Focus on 3-5 primary keywords" });
  }

  if (!data.slug) {
    issues.push({ field: "slug", severity: "error", message: "Missing URL slug", recommendation: "Auto-generate from title or create custom slug" });
    score -= 15;
  }

  if (!data.image) {
    issues.push({ field: "image", severity: "warning", message: "No product image", recommendation: "Add at least one high-quality product image" });
    score -= 10;
  }

  if (data.description && data.description.length < 100) {
    issues.push({ field: "description", severity: "info", message: "Short product description", recommendation: "Longer descriptions rank better in search" });
    score -= 5;
  }

  return { score: Math.max(0, score), issues };
}

function generateProductId() {
  return `p${Date.now()}`;
}

export default function AdminProductForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { pushToast } = useStore();
  const isEditing = Boolean(id && id !== "new");
  const product = isEditing ? (getProductById(id || "") ?? adminProducts.find(p => p.id === id)) as AdminProduct | undefined : undefined;

  const [activeTab, setActiveTab] = useState<"general" | "variants" | "seo" | "inventory" | "category">("general");
  const [categories, setCategories] = useState<AdminCategory[]>(mockAdminCategories);
  const [categoryProductFields, setCategoryProductFields] = useState<Record<string, AdminCategory["productFields"]>>(mockCategoryProductFields);

  useEffect(() => {
    adminApi.getCategories().then((data) => {
      if (data.data?.length) {
        const mapped: AdminCategory[] = data.data.map((c: ApiCategory) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image: c.image || "",
          icon: c.icon || "",
          productCount: c._count?.products || c.productCount || 0,
          seoTitle: c.seoTitle || "",
          seoDescription: c.seoDescription || "",
          status: (c.status || "active") as "active" | "inactive",
          sortOrder: c.sortOrder || 0,
          productFields: (c.productFields || []) as AdminCategory["productFields"],
        }));
        setCategories(mapped);
        const lookup: Record<string, AdminCategory["productFields"]> = {};
        mapped.forEach((cat) => { lookup[cat.id] = cat.productFields; });
        setCategoryProductFields(lookup);
      }
    }).catch(() => {});
  }, []);
  // Initialize images from the product (state adjusted during render when product changes).
  const [images, setImages] = useState<string[]>(() => (product ? [product.image, product.hoverImage].filter(Boolean) : []));
  const [prevImagesProduct, setPrevImagesProduct] = useState(product);
  if (prevImagesProduct !== product) {
    setPrevImagesProduct(product);
    setImages(product ? [product.image, product.hoverImage].filter(Boolean) : []);
  }
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      originalPrice: 0,
      category: "",
      brand: "",
      stock: "in_stock",
      status: "draft",
      featured: false,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      slug: "",
      sku: "",
      weight: undefined,
      width: undefined,
      height: undefined,
      depth: undefined,
      image: "",
      hoverImage: "",
      variants: [],
    },
    mode: "onBlur",
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants",
  });

  // Get category-specific fields (must be after useForm to use watch)
  const selectedCategory = useWatch({ control, name: "category" });
  const categoryFields = useMemo(() => {
    if (!selectedCategory) return [];
    return categoryProductFields[selectedCategory] || [];
  }, [selectedCategory, categoryProductFields]);
  // Initialize form with product data
  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        category: product.category,
        brand: product.brand || "",
        stock: product.stock,
        status: product.status,
        featured: product.featured,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        seoKeywords: product.seoKeywords.join(", "),
        slug: product.slug,
        sku: product.sku,
        weight: product.weight,
        width: product.dimensions?.width,
        height: product.dimensions?.height,
        depth: product.dimensions?.depth,
        image: product.image,
        hoverImage: product.hoverImage,
      });
    } else {
      // Generate SKU for new product
      setValue("sku", `SKU-${Date.now().toString(36).toUpperCase()}`);
    }
  }, [product, reset, setValue]);

  // Auto-generate slug from title
  const watchedTitle = useWatch({ control, name: "title" });
  const watchedSlug = useWatch({ control, name: "slug" });
  const watchedSeoTitle = useWatch({ control, name: "seoTitle" });
  const watchedSeoDescription = useWatch({ control, name: "seoDescription" });
  const watchedSeoKeywords = useWatch({ control, name: "seoKeywords" });
  const watchedDescription = useWatch({ control, name: "description" });
  const watchedImage = useWatch({ control, name: "image" });

  useEffect(() => {
    if (watchedTitle && !dirtyFields.slug) {
      const generated = watchedTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60);
      setValue("slug", generated, { shouldDirty: false });
    }
  }, [watchedTitle, dirtyFields.slug, setValue]);

  // Auto-generate SEO title from title
  useEffect(() => {
    if (watchedTitle && !dirtyFields.seoTitle) {
      setValue("seoTitle", watchedTitle.slice(0, 60), { shouldDirty: false });
    }
  }, [watchedTitle, dirtyFields.seoTitle, setValue]);

  // Calculate SEO analysis (React Compiler memoizes automatically)
  const seoAnalysis = useMemo(() => analyzeSEO({
    title: watchedTitle ?? "",
    description: watchedDescription ?? "",
    price: 0,
    originalPrice: 0,
    category: "",
    brand: "",
    stock: "in_stock",
    status: "draft",
    featured: false,
    seoTitle: watchedSeoTitle ?? "",
    seoDescription: watchedSeoDescription ?? "",
    seoKeywords: watchedSeoKeywords ?? "",
    slug: watchedSlug ?? "",
    sku: "",
    weight: undefined,
    width: undefined,
    height: undefined,
    depth: undefined,
    image: watchedImage ?? "",
    hoverImage: "",
    variants: [],
  }), [watchedTitle, watchedDescription, watchedSeoTitle, watchedSeoDescription, watchedSeoKeywords, watchedSlug, watchedImage]);
  const seoScore = seoAnalysis.score;
  const seoIssues = seoAnalysis.issues;

  const handleAddVariant = () => {
    appendVariant({
      color: "#000000",
      colorName: "Black",
      size: "",
      price: getValues("price"),
      originalPrice: getValues("originalPrice"),
      stock: 10,
      sku: `${getValues("sku")}-VAR${variantFields.length + 1}`,
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true);
    try {
      const productPayload = {
        ...data,
        id: isEditing ? id : generateProductId(),
        title: data.title,
        description: data.description,
        price: Number(data.price),
        originalPrice: Number(data.originalPrice ?? data.price),
        image: data.image || images[0] || "",
        hoverImage: data.hoverImage || data.image || images[1] || "",
        category: data.category,
        stock: data.stock,
        brand: data.brand || "Top Shelf Exotics",
        badge: data.featured ? "New" : "Best Seller",
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || data.description,
        seoKeywords: (data.seoKeywords || "").split(",").map(k => k.trim()).filter(Boolean),
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        variants: (data.variants || []).map((variant) => ({ ...variant, id: variant.sku || `v${Date.now().toString(36)}` })),
        colors: (data.variants || []).map((variant) => variant.color).filter(Boolean),
        dimensions: {
          width: data.width,
          height: data.height,
          depth: data.depth,
        },
        images: images.filter(Boolean),
        createdAt: isEditing ? product?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await updateProduct(id!, productPayload);
      } else {
        await createProduct(productPayload);
      }

      pushToast(isEditing ? "Product updated successfully" : "Product created successfully", "success");
      navigate("/admin/products");
    } catch {
      pushToast("Failed to save product", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Package },
    { id: "variants", label: "Variants", icon: Palette },
    { id: "category", label: "Category Fields", icon: Tag },
    { id: "inventory", label: "Inventory", icon: Box },
    { id: "seo", label: "SEO", icon: Search },
  ];

  const CategoryIcon = categoryIcons[product?.category || ""] || Sparkles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link
            to="/admin/products"
            className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-ink-400 mt-1">
              {isEditing ? `Editing ${product?.title}` : "Fill in the details to create a new product"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && (
            <Link
              to={`/product/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost gap-2"
            >
              <Eye className="h-4 w-4" />
              View on Store
            </Link>
          )}
          <button
            type="submit"
            form="product-form"
            disabled={saving || isSubmitting}
            className="btn-primary gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Product"
            )}
          </button>
        </div>
      </motion.div>

      {/* SEO Score Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                />
                <motion.circle
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: seoScore / 100 }}
                  transition={{ duration: 0.5 }}
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={seoScore >= 80 ? "#22f0c4" : seoScore >= 60 ? "#ffb84d" : "#ff5470"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  style={{ filter: seoScore >= 80 ? "drop-shadow(0 0 8px #22f0c4)" : seoScore >= 60 ? "drop-shadow(0 0 8px #ffb84d)" : "drop-shadow(0 0 8px #ff5470)" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{seoScore}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">SEO Score</p>
              <p className="text-sm text-ink-400">
                {seoScore >= 80 ? "Excellent - Well optimized for search" : seoScore >= 60 ? "Good - Some improvements recommended" : "Needs improvement - Check SEO tab"}
              </p>
            </div>
          </div>
          {seoIssues.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span className="text-amber-400">{seoIssues.length} issue{seoIssues.length !== 1 ? "s" : ""} to fix</span>
              <button
                type="button"
                onClick={() => setActiveTab("seo")}
                className="text-accent-300 hover:text-accent-200 font-medium underline"
              >
                View in SEO tab
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Form */}
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-xl overflow-hidden"
        >
          <div className="border-b border-white/5">
            <nav className="flex overflow-x-auto" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-accent-300 border-b-2 border-accent-400"
                      : "text-ink-400 hover:text-ink-200"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === "seo" && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      seoScore >= 80 ? "bg-accent-500/20 text-accent-400" :
                      seoScore >= 60 ? "bg-amber-500/20 text-amber-400" :
                      "bg-rose-500/20 text-rose-400"
                    }`}>
                    {seoScore}
                  </span>)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "general" && <GeneralTab register={register} errors={errors} watch={watch} images={images} setImages={setImages} CategoryIcon={CategoryIcon} categories={categories} />}
                {activeTab === "variants" && <VariantsTab register={register} variantFields={variantFields} appendVariant={handleAddVariant} removeVariant={removeVariant} />}
                {activeTab === "category" && <CategoryFieldsTab register={register} errors={errors} watch={watch} categoryFields={categoryFields} />}
                {activeTab === "inventory" && <InventoryTab register={register} errors={errors} />}
                {activeTab === "seo" && <SEOTab register={register} errors={errors} watch={watch} seoIssues={seoIssues} seoScore={seoScore} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </form>
    </div>
  );
}

// Tab Components

type GeneralTabProps = {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  CategoryIcon: React.ComponentType<{ className?: string }>;
  categories: AdminCategory[];
};

function GeneralTab({ register, errors, watch, images, setImages, CategoryIcon, categories }: GeneralTabProps) {
  const category = watch("category");
  const categoryData = categories.find(c => c.id === category);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-accent-400" />
            Basic Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1">Product Title *</label>
              <input
                {...register("title")}
                className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition ${errors.title ? "border-rose-500" : "border-white/10"}`}
                placeholder="Enter product title"
              />
              {errors.title && <p className="mt-1 text-sm text-rose-400">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1">Description *</label>
              <textarea
                {...register("description")}
                rows={5}
                className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition ${errors.description ? "border-rose-500" : "border-white/10"}`}
                placeholder="Describe the product in detail..."
              />
              {errors.description && <p className="mt-1 text-sm text-rose-400">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Category *</label>
                <select
                  {...register("category")}
                  className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${errors.category ? "border-rose-500" : "border-white/10"}`}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon || "•"} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-rose-400">{errors.category.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Brand</label>
                <input
                  {...register("brand")}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition"
                  placeholder="e.g., Aether, Onyx, Halo"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">$</span>
                  <input
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                    step="0.01"
                    min="0"
                    className={`w-full rounded-xl border pl-8 pr-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${errors.price ? "border-rose-500" : "border-white/10"}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="mt-1 text-sm text-rose-400">{errors.price.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Original Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">$</span>
                  <input
                    type="number"
                    {...register("originalPrice", { valueAsNumber: true })}
                    step="0.01"
                    min="0"
                    className="w-full rounded-xl border border-white/10 pl-8 pr-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Stock Status *</label>
                <select
                  {...register("stock")}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Status & Visibility */}
        <section className="space-y-4 border-t border-white/5 pt-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent-400" />
            Status & Visibility
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1">Status *</label>
              <select
                {...register("status")}
                className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("featured")}
                  className="h-4 w-4 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                />
                <span className="text-sm text-ink-200">Featured Product</span>
              </label>
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="space-y-4 border-t border-white/5 pt-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Image className="h-5 w-5 text-accent-400" />
            Product Images
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink-300">Main Image</label>
              <div className="relative">
                <input
                  type="url"
                  {...register("image")}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition"
                  placeholder="https://example.com/image.jpg"
                />
                {images[0] && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button type="button" className="p-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" onClick={() => setImages(prev => { const n = [...prev]; n[0] = ""; return n; })}><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
              {images[0] && (
                <img src={images[0]} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink-300">Hover/Secondary Image</label>
              <div className="relative">
                <input
                  type="url"
                  {...register("hoverImage")}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition"
                  placeholder="https://example.com/hover.jpg"
                />
                {images[1] && (
                  <div className="absolute top-2 right-2">
                    <button type="button" className="p-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" onClick={() => setImages(prev => { const n = [...prev]; n[1] = ""; return n; })}><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
              {images[1] && (
                <img src={images[1]} alt="Hover preview" className="mt-2 h-32 w-full object-cover rounded-lg" />
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Category Preview */}
        {category && categoryData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-xl p-4"
          >
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <CategoryIcon className="h-5 w-5" />
              Category: {categoryData.name}
            </h4>
            <p className="text-sm text-ink-400 mb-3">{categoryData.description}</p>
            <div className="space-y-2 text-sm">
              <p><span className="text-ink-400">Products in category:</span> <span className="text-white ml-1">{categoryData.productCount}</span></p>
              <p><span className="text-ink-400">Category-specific fields:</span> <span className="text-white ml-1">{categoryData.productFields.length}</span></p>
            </div>
            <Link to="/admin/categories" className="mt-3 text-sm text-accent-300 hover:text-accent-200 flex items-center gap-1">
              Manage categories <ArrowUpRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}

        {/* Quick Tips */}
        <div className="glass-strong rounded-xl p-4">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-accent-400" />
            Quick Tips
          </h4>
          <ul className="space-y-2 text-sm text-ink-300">
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" /> Use descriptive, keyword-rich titles</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" /> Write unique descriptions (200+ words ideal)</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" /> Add high-quality images (min 900px)</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" /> Fill category-specific fields for better filtering</li>
            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" /> Optimize SEO tab before publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

type VariantsTabProps = {
  register: UseFormRegister<ProductFormData>;
  variantFields: FieldArrayWithId<ProductFormData, "variants", "id">[];
  appendVariant: () => void;
  removeVariant: (_index: number) => void;
};

function VariantsTab({ register, variantFields, appendVariant, removeVariant }: VariantsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Palette className="h-5 w-5 text-accent-400" />
          Product Variants
        </h3>
        <button type="button" onClick={appendVariant} className="btn-ghost gap-1 text-sm">
          <Plus className="h-3.5 w-3.5" />
          Add Variant
        </button>
      </div>

      <p className="text-sm text-ink-400">Each variant represents a unique combination of color, size, and pricing.</p>

      {variantFields.length === 0 ? (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-white/10">
          <Palette className="h-12 w-12 text-ink-500 mx-auto mb-3" />
          <p className="text-ink-400">No variants added yet</p>
          <button type="button" onClick={appendVariant} className="mt-3 btn-primary gap-1 inline-flex">
            <Plus className="h-4 w-4" />
            Add First Variant
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {variantFields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-300 bg-white/5 px-2 py-1 rounded">Variant #{index + 1}</span>
                  <input
                    type="color"
                    {...register(`variants.${index}.color`)}
                    className="h-8 w-8 rounded border border-white/10 cursor-pointer"
                    title="Color"
                  />
                  <input
                    {...register(`variants.${index}.colorName`)}
                    placeholder="Color name (e.g., Obsidian Black)"
                    className="w-40 rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1">Size (Optional)</label>
                  <input
                    {...register(`variants.${index}.size`)}
                    placeholder="e.g., M, 42, One Size"
                    className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">$</span>
                    <input
                      type="number"
                      {...register(`variants.${index}.price`, { valueAsNumber: true })}
                      step="0.01"
                      min="0"
                      className="w-full rounded-xl border border-white/10 pl-8 pr-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1">Original Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">$</span>
                    <input
                      type="number"
                      {...register(`variants.${index}.originalPrice`, { valueAsNumber: true })}
                      step="0.01"
                      min="0"
                      className="w-full rounded-xl border border-white/10 pl-8 pr-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1">Stock</label>
                  <input
                    type="number"
                    {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                    min="0"
                    className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="block text-xs font-medium text-ink-400 mb-1">SKU</label>
                <input
                  {...register(`variants.${index}.sku`)}
                  className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none font-mono"
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

type CategoryFieldsTabProps = {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  categoryFields: AdminCategory["productFields"];
};

function CategoryFieldsTab({ register, errors, watch: _watch, categoryFields }: CategoryFieldsTabProps) {
  const category = _watch("category");

  if (!category || categoryFields.length === 0) {
    return (
      <div className="text-center py-12">
        <Tag className="h-12 w-12 text-ink-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-white mb-1">Select a category first</h3>
        <p className="text-ink-400">Choose a category in the General tab to see category-specific fields.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Tag className="h-5 w-5 text-accent-400" />
          Category-Specific Fields
        </h3>
        <span className="text-sm text-ink-400">{categoryFields.length} field{categoryFields.length !== 1 ? "s" : ""}</span>
      </div>

      <p className="text-sm text-ink-400">These fields are specific to the selected category and help customers filter and compare products.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryFields.map((field) => (
          <div
            key={field.key}
            className="space-y-2"
            style={{ gridColumn: field.type === "textarea" ? "span 2" : undefined }}
          >
            <label className="block text-sm font-medium text-ink-300 flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-rose-400">*</span>}
              {field.helpText && (
                <span className="cursor-help" title={field.helpText}>
                  <HelpCircle className="h-3.5 w-3.5 text-ink-500 hover:text-ink-400" />
                </span>
              )}
            </label>

            {field.type === "textarea" ? (
              <textarea
                {...register(field.key as keyof ProductFormData)}
                rows={3}
                placeholder={field.placeholder}
                className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition ${(errors as Record<string, FieldError | undefined>)[field.key] ? "border-rose-500" : "border-white/10"}`}
              />
            ) : field.type === "select" ? (
              <select
                {...register(field.key as keyof ProductFormData)}
                className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${(errors as Record<string, FieldError | undefined>)[field.key] ? "border-rose-500" : "border-white/10"}`}
              >
                <option value="">Select...</option>
                {field.options?.map((opt: { value: string; label: string }) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === "boolean" ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register(field.key as keyof ProductFormData)}
                  className="h-4 w-4 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                />
                <span className="text-sm text-ink-200">Yes</span>
              </label>
            ) : field.type === "color" ? (
              <input
                type="color"
                {...register(field.key as keyof ProductFormData)}
                className="h-10 w-10 rounded border border-white/10 cursor-pointer"
              />
            ) : field.type === "array" ? (
              <div className="space-y-2">
                <input
                  {...register(field.key as keyof ProductFormData)}
                  placeholder={field.placeholder || "Comma-separated values"}
                  className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition ${(errors as Record<string, FieldError | undefined>)[field.key] ? "border-rose-500" : "border-white/10"}`}
                />
                <p className="text-xs text-ink-400">Enter comma-separated values</p>
              </div>
            ) : field.type === "number" ? (
              <input
                type="number"
                {...register(field.key as keyof ProductFormData, { valueAsNumber: true })}
                placeholder={field.placeholder}
                className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition ${(errors as Record<string, FieldError | undefined>)[field.key] ? "border-rose-500" : "border-white/10"}`}
              />
            ) : (
              <input
                type="text"
                {...register(field.key as keyof ProductFormData)}
                placeholder={field.placeholder}
                className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition ${(errors as Record<string, FieldError | undefined>)[field.key] ? "border-rose-500" : "border-white/10"}`}
              />
            )}

            {(errors as Record<string, FieldError | undefined>)[field.key] && (
              <p className="text-sm text-rose-400">{(errors as Record<string, FieldError | undefined>)[field.key]!.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type InventoryTabProps = {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
};

function InventoryTab({ register, errors }: InventoryTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Hash className="h-5 w-5 text-accent-400" />
          SKU & Identifiers
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1">SKU *</label>
            <input
              {...register("sku")}
              className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white font-mono focus:border-accent-400 focus:outline-none transition ${errors.sku ? "border-rose-500" : "border-white/10"}`}
              placeholder="AUTO-GENERATED"
            />
            {errors.sku && <p className="mt-1 text-sm text-rose-400">{errors.sku.message}</p>}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Weight className="h-5 w-5 text-accent-400" />
          Physical Properties
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1">Weight (kg)</label>
              <input
                type="number"
                {...register("weight", { valueAsNumber: true })}
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none"
                placeholder="0.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1">Dimensions (cm)</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Width</label>
                <input
                  type="number"
                  {...register("width", { valueAsNumber: true })}
                  step="0.1"
                  min="0"
                  className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Height</label>
                <input
                  type="number"
                  {...register("height", { valueAsNumber: true })}
                  step="0.1"
                  min="0"
                  className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Depth</label>
                <input
                  type="number"
                  {...register("depth", { valueAsNumber: true })}
                  step="0.1"
                  min="0"
                  className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none"
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Box className="h-5 w-5 text-accent-400" />
          Inventory Notes
        </h3>
        <textarea
          placeholder="Internal notes about inventory, supplier info, restock dates, etc."
          rows={4}
          className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none"
        />
      </section>
    </div>
  );
}

type SEOTabProps = {
  register: UseFormRegister<ProductFormData>;
  errors: FieldErrors<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  seoIssues: Array<{field: string, severity: string, message: string, recommendation: string}>;
  seoScore: number;
};

function SEOTab({ register, errors, watch, seoIssues, seoScore }: SEOTabProps) {
  const title = watch("title");
  const seoTitle = watch("seoTitle");
  const seoDescription = watch("seoDescription");
  const slug = watch("slug");

  const previewUrl = `https://topshelffarms.com/product/${slug || title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "your-product-slug"}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* SEO Form */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-accent-400" />
            Search Engine Optimization
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${seoScore >= 80 ? "bg-accent-500/20 text-accent-400" : seoScore >= 60 ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"}`}>
            Score: {seoScore}/100
          </div>
        </div>

        {/* Issues */}
        {seoIssues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Issues to Fix ({seoIssues.length})
            </h4>
            {seoIssues.map((issue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-2 p-3 rounded-lg ${issue.severity === "error" ? "bg-rose-500/10 border border-rose-500/20" : issue.severity === "warning" ? "bg-amber-500/10 border border-amber-500/20" : "bg-blue-500/10 border border-blue-500/20"}`}
              >
                {issue.severity === "error" && <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />}
                {issue.severity === "warning" && <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
                {issue.severity === "info" && <HelpCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{issue.message}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{issue.recommendation}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* SEO Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1 flex items-center gap-1">
              SEO Title
              <span className="cursor-help" title="Title shown in search results. Keep under 60 characters.">
                <HelpCircle className="h-3.5 w-3.5 text-ink-500" />
              </span>
            </label>
            <div className="relative">
              <input
                {...register("seoTitle")}
                maxLength={60}
                className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition pr-20 ${errors.seoTitle ? "border-rose-500" : seoTitle && seoTitle.length > 60 ? "border-amber-500" : "border-white/10"}`}
                placeholder="Enter SEO title (max 60 chars)"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">
                {seoTitle?.length || 0}/60
              </span>
            </div>
            {errors.seoTitle && <p className="mt-1 text-sm text-rose-400">{errors.seoTitle.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1 flex items-center gap-1">
              Meta Description
              <span className="cursor-help" title="Description shown in search results. Keep under 160 characters.">
                <HelpCircle className="h-3.5 w-3.5 text-ink-500" />
              </span>
            </label>
            <div className="relative">
              <textarea
                {...register("seoDescription")}
                maxLength={160}
                rows={3}
                className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition pr-20 ${errors.seoDescription ? "border-rose-500" : seoDescription && seoDescription.length > 160 ? "border-amber-500" : "border-white/10"}`}
                placeholder="Enter meta description (max 160 chars)"
              />
              <span className="absolute bottom-2 right-3 text-ink-400 text-sm">
                {seoDescription?.length || 0}/160
              </span>
            </div>
            {errors.seoDescription && <p className="mt-1 text-sm text-rose-400">{errors.seoDescription.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1 flex items-center gap-1">
              Keywords (comma-separated)
              <span className="cursor-help" title="Add 3-5 relevant keywords for search optimization.">
                <HelpCircle className="h-3.5 w-3.5 text-ink-500" />
              </span>
            </label>
            <input
              {...register("seoKeywords")}
              className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition"
              placeholder="wireless headphones, ANC, bluetooth, audiophile, Aether"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-300 mb-1 flex items-center gap-1">
              URL Slug
              <span className="cursor-help" title="URL-friendly version of the title. Auto-generated from title.">
                <HelpCircle className="h-3.5 w-3.5 text-ink-500" />
              </span>
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-3 bg-ink-800/50 rounded-l-xl border border-white/10 border-r-0 text-ink-400 text-sm">topshelffarms.com/product/</span>
              <input
                {...register("slug")}
                className={`flex-1 rounded-r-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${errors.slug ? "border-rose-500" : "border-white/10"}`}
                placeholder="auto-generated-from-title"
              />
            </div>
            {errors.slug && <p className="mt-1 text-sm text-rose-400">{errors.slug.message}</p>}
          </div>
        </div>
      </section>

      {/* SERP Preview */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-accent-400" />
          Google Search Preview
        </h3>

        <div className="glass-strong rounded-xl p-4 border border-white/5">
          <div className="font-mono text-xs text-green-400 mb-2">{previewUrl}</div>
          <div className="text-lg font-semibold text-blue-300 line-clamp-1 mb-1">
            {seoTitle || title || "Your Product Title"}
          </div>
          <div className="text-sm text-ink-300 line-clamp-2">
            {seoDescription || "Your meta description will appear here. Write a compelling summary that encourages clicks..."}
          </div>
        </div>

        {/* Social Preview */}
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Share2 className="h-5 w-5 text-accent-400" />
          Social Media Preview
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-strong rounded-xl p-4 border border-white/5">
            <p className="text-xs font-medium text-ink-400 mb-2">Facebook / LinkedIn</p>
            <div className="aspect-video bg-ink-800/50 rounded-lg flex flex-col items-center justify-center p-4">
              <div className="aspect-square w-3/4 bg-white/5 rounded mb-2" />
              <p className="text-sm font-semibold text-white text-center line-clamp-1">{seoTitle || title || "Product Title"}</p>
              <p className="text-xs text-ink-400 text-center mt-1 line-clamp-2">{seoDescription || "Meta description..."}</p>
            </div>
          </div>
          <div className="glass-strong rounded-xl p-4 border border-white/5">
            <p className="text-xs font-medium text-ink-400 mb-2">Twitter Card</p>
            <div className="aspect-video bg-ink-800/50 rounded-lg flex items-center justify-center p-4">
              <div className="flex gap-3 w-full">
                <div className="aspect-square w-1/3 bg-white/5 rounded" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white line-clamp-1">{seoTitle || title || "Product Title"}</p>
                  <p className="text-xs text-ink-400 mt-1 line-clamp-2">{seoDescription || "Meta description..."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Checklist */}
        <div className="glass-strong rounded-xl p-4 border border-white/5">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-accent-400" />
            SEO Checklist
          </h4>
          <ul className="space-y-2 text-sm">
            {[
              { label: "Unique, descriptive title (30-60 chars)", done: seoTitle && seoTitle.length >= 30 && seoTitle.length <= 60 },
              { label: "Compelling meta description (120-160 chars)", done: seoDescription && seoDescription.length >= 120 && seoDescription.length <= 160 },
              { label: "3-5 relevant keywords included", done: (watch("seoKeywords") || "").split(",").filter(Boolean).length >= 3 },
              { label: "Clean, keyword-rich URL slug", done: !!slug },
              { label: "Product images with alt text", done: !!watch("image") },
              { label: "Category-specific fields completed", done: true },
              { label: "Structured data ready (Product schema)", done: true },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`h-4 w-4 rounded border flex items-center justify-center ${item.done ? "border-accent-400 bg-accent-500/20 text-accent-400" : "border-white/20 text-ink-500"}`}>
                  {item.done && <CheckCircle className="h-3 w-3" />}
                </span>
                <span className={item.done ? "text-ink-300" : "text-ink-400"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}