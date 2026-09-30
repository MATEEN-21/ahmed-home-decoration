import React, { useState, useMemo } from "react";
import {
  Product,
  Category
} from "../../types";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory
} from "../../lib/api";
import { MultipleImageUpload } from "../common/DirectImageUpload";
import { calculateProductPricing } from "../../lib/pricing";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Layers,
  X,
  RefreshCw,
  Eye,
  AlertCircle,
  Percent,
  Tag,
  List
} from "lucide-react";

interface AdminProductsProps {
  products?: Product[];
  categories?: Category[];
  onRefreshData: () => Promise<void>;
  onOpenAddModalTrigger?: boolean;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products = [],
  categories = [],
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirmation modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categoryMode, setCategoryMode] = useState<"select" | "custom">("select");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [stockStatus, setStockStatus] = useState<Product["stockStatus"]>("in_stock");
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [featured, setFeatured] = useState(false);
  const [badge, setBadge] = useState("");
  const [active, setActive] = useState(true);

  // Live price & discount calculations
  const pricingCalculation = useMemo(() => {
    const rawBase = typeof originalPrice === "number" ? originalPrice : Number(originalPrice) || 0;
    const discount = isDiscountEnabled ? Math.min(100, Math.max(0, Number(discountPercentage) || 0)) : 0;
    return calculateProductPricing(rawBase, discount);
  }, [originalPrice, discountPercentage, isDiscountEnabled]);

  // Details fields
  const [material, setMaterial] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [finishColor, setFinishColor] = useState("");
  const [origin, setOrigin] = useState("Ahmed Home Decoration, Khushab");
  const [careInstructions, setCareInstructions] = useState("");

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setOriginalPrice("");
    setDiscountPercentage(0);
    setIsDiscountEnabled(false);
    setCategoryId(categories[0]?.id || "");
    setCategoryMode("select");
    setCustomCategoryName("");
    setImages([]);
    setStockStatus("in_stock");
    setStockQuantity(10);
    setFeatured(false);
    setBadge("Best Seller");
    setActive(true);
    setMaterial("");
    setDimensions("");
    setFinishColor("");
    setOrigin("Ahmed Home Decoration, Khushab");
    setCareInstructions("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || "");

    // Load original regular price
    const basePrice = p.originalPrice || (p.oldPrice && p.oldPrice > p.price ? p.oldPrice : p.price);
    setOriginalPrice(basePrice || "");

    // Load discount percentage
    let disc = 0;
    if (typeof p.discountPercentage === "number") {
      disc = p.discountPercentage;
    } else if (p.oldPrice && p.oldPrice > p.price) {
      disc = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
    }
    setDiscountPercentage(disc);
    setIsDiscountEnabled(disc > 0);

    const matchCat = categories.find((c) => c.id === p.categoryId);
    if (matchCat) {
      setCategoryId(p.categoryId);
      setCategoryMode("select");
      setCustomCategoryName("");
    } else if (p.categoryName) {
      setCategoryId("");
      setCategoryMode("custom");
      setCustomCategoryName(p.categoryName);
    } else {
      setCategoryId(p.categoryId || categories[0]?.id || "");
      setCategoryMode("select");
      setCustomCategoryName("");
    }

    setImages(p.images || []);
    setStockStatus(p.stockStatus || "in_stock");
    setStockQuantity(p.stockQuantity !== undefined ? p.stockQuantity : 10);
    setFeatured(Boolean(p.featured));
    setBadge(p.badge || "");
    setActive(p.active !== undefined ? p.active : true);

    setMaterial(p.details?.material || "");
    setDimensions(p.details?.dimensions || "");
    setFinishColor(p.details?.finishColor || "");
    setOrigin(p.details?.origin || "Ahmed Home Decoration, Khushab");
    setCareInstructions(p.details?.careInstructions || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (originalPrice === "" || Number(originalPrice) <= 0) {
      setFormError("Valid product original price is required.");
      return;
    }
    if (isDiscountEnabled && (Number(discountPercentage) < 0 || Number(discountPercentage) > 100 || isNaN(Number(discountPercentage)))) {
      setFormError("Discount percentage must be between 0% and 100%.");
      return;
    }
    if (pricingCalculation.salePrice < 0) {
      setFormError("Final sale price cannot be negative.");
      return;
    }
    if (images.length === 0) {
      setFormError("Please upload at least one product image.");
      return;
    }

    let finalCategoryId = categoryId;
    let finalCategoryName = "";

    if (categoryMode === "custom") {
      const trimmedCustom = customCategoryName.trim();
      if (!trimmedCustom) {
        setFormError("Please enter a category name or select one from the dropdown.");
        return;
      }
      // Check if it already matches an existing category by name (case-insensitive)
      const matched = categories.find((c) => c.name.toLowerCase() === trimmedCustom.toLowerCase());
      if (matched) {
        finalCategoryId = matched.id;
        finalCategoryName = matched.name;
      } else {
        // Automatically create the new category via API so it exists across all components
        try {
          const created = await createCategory({
            name: trimmedCustom,
            active: true
          });
          finalCategoryId = created.id;
          finalCategoryName = created.name;
        } catch {
          finalCategoryId = "";
          finalCategoryName = trimmedCustom;
        }
      }
    } else {
      if (!categoryId) {
        setFormError("Please select a category or type a custom category name.");
        return;
      }
      const selectedCat = categories.find((c) => c.id === categoryId);
      finalCategoryName = selectedCat?.name || "General";
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const productPayload: Partial<Product> = {
        name: name.trim(),
        description: description.trim(),
        originalPrice: pricingCalculation.originalPrice,
        discountPercentage: pricingCalculation.discountPercentage,
        price: pricingCalculation.salePrice,
        oldPrice: pricingCalculation.hasDiscount ? pricingCalculation.originalPrice : null,
        categoryId: finalCategoryId,
        categoryName: finalCategoryName,
        images,
        designs: editingProduct?.designs,
        variants: editingProduct?.variants,
        stockStatus,
        stockQuantity: Number(stockQuantity) || 0,
        featured,
        badge: badge.trim(),
        active,
        details: {
          material: material.trim(),
          dimensions: dimensions.trim(),
          finishColor: finishColor.trim(),
          origin: origin.trim(),
          careInstructions: careInstructions.trim(),
        }
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productPayload);
        setSuccessMessage(`Product "${name}" updated successfully.`);
      } else {
        await createProduct(productPayload);
        setSuccessMessage(`Product "${name}" created successfully.`);
      }

      await onRefreshData();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      await onRefreshData();
      setSuccessMessage(`Product "${productToDelete.name}" deleted.`);
      setProductToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick toggle active state
  const handleToggleActive = async (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateProduct(p.id, { active: !p.active });
      await onRefreshData();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  // Filter products
  const filtered = useMemo(() => {
    return (products || []).filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = (p.description || "").toLowerCase().includes(q);
        const matchesBadge = (p.badge || "").toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesBadge) return false;
      }

      // Category
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) {
        return false;
      }

      // Stock
      if (stockFilter !== "all" && p.stockStatus !== stockFilter) {
        return false;
      }

      // Status
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "inactive" && p.active) return false;

      return true;
    });
  }, [products, searchQuery, categoryFilter, stockFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Product Management
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Add new products, upload direct images, edit pricing, manage stock and visibility.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, description, or badge..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-emerald-600"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="made_to_order">Made to Order</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-200">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price (PKR)</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Badge</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Image & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={p.images?.[0] || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=100&q=80"}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=100&q=80";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs line-clamp-1 max-w-xs">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{p.images?.length || 0} photos</span>
                            {p.featured && (
                              <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {p.categoryName || "General"}
                      </span>
                    </td>

                    {/* Price & Discount */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <div className="font-bold text-slate-900">
                        Rs. {p.price.toLocaleString()}
                      </div>
                      {p.discountPercentage && p.discountPercentage > 0 && (p.originalPrice || p.oldPrice) ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 line-through">
                            Rs. {((p.originalPrice || p.oldPrice) as number).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                            {p.discountPercentage}% OFF
                          </span>
                        </div>
                      ) : null}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.stockStatus === "in_stock" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> In Stock ({p.stockQuantity})
                        </span>
                      )}
                      {p.stockStatus === "low_stock" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Low ({p.stockQuantity})
                        </span>
                      )}
                      {p.stockStatus === "out_of_stock" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-800 bg-red-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-2.5 h-2.5 text-red-600" /> Out of Stock
                        </span>
                      )}
                      {p.stockStatus === "made_to_order" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
                          Custom
                        </span>
                      )}
                    </td>

                    {/* Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.badge ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Active toggle */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => handleToggleActive(p, e)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                          p.active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {p.active ? "Active" : "Disabled"}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">No products found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? "Try another search term." : "Click \"Add Product\" to create your first item."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 my-6 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-lg text-slate-900">
                {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Direct Multi-Image & Design Upload */}
              <div className="space-y-2">
                <MultipleImageUpload
                  label="Product Photographs & Designs"
                  images={images}
                  onChange={setImages}
                  maxImages={12}
                />
                {images.length > 1 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <span className="font-semibold text-slate-700 block">
                      🎨 Configured Product Designs ({images.length} variants available for customer selection):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {images.map((img, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                          <img src={img} alt={`Design ${idx + 1}`} className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-800 text-[11px] block truncate">
                              Design {idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {idx === 0 ? "Cover / Default" : `Variant #${idx + 1}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ayat-ul-Kursi 3D Stainless Steel Metal Wall Art"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Category *</span>
                      {categoryMode === "custom" ? (
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          Custom New
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          Existing
                        </span>
                      )}
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (categoryMode === "select") {
                          setCategoryMode("custom");
                        } else {
                          setCategoryMode("select");
                        }
                      }}
                      className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer transition"
                    >
                      {categoryMode === "select" ? (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Type new category</span>
                        </>
                      ) : (
                        <>
                          <List className="w-3 h-3" />
                          <span>Choose from dropdown</span>
                        </>
                      )}
                    </button>
                  </div>

                  {categoryMode === "select" ? (
                    <div className="space-y-1">
                      <select
                        required
                        value={categoryId}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setCategoryMode("custom");
                            setCustomCategoryName("");
                          } else {
                            setCategoryId(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 cursor-pointer"
                      >
                        <option value="">Select a category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value="__custom__" className="text-emerald-700 font-semibold bg-emerald-50">
                          + Type new / custom category...
                        </option>
                      </select>
                      <p className="text-[10px] text-slate-400">
                        Select an existing category, or click <button type="button" onClick={() => setCategoryMode("custom")} className="text-emerald-700 underline font-medium cursor-pointer">Type new category</button> to enter a custom name.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        placeholder="e.g. Wall Clocks, Wooden Mirrors, Metal Calligraphy..."
                        list="category-name-suggestions"
                        autoFocus
                        className="w-full px-3.5 py-2 text-xs bg-white border border-emerald-500 rounded-xl focus:outline-emerald-600 shadow-2xs"
                      />
                      <datalist id="category-name-suggestions">
                        {categories.map((c) => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="text-emerald-700 font-medium">
                          ✦ This new category will be created and saved to your shop.
                        </span>
                        <button
                          type="button"
                          onClick={() => setCategoryMode("select")}
                          className="text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                        >
                          Select existing instead
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Product Badge / Tag
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. Best Seller, Hot Deal, Handcrafted"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Optional promotional tag badge.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Original Price (PKR / Rs.) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 10000"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Base regular price before any discount is applied.
                  </p>
                </div>

                {/* Discount / Sale Management Section */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Discount / Sale</h4>
                        <p className="text-[11px] text-slate-500">Apply a percentage discount or set to 0% to disable</p>
                      </div>
                    </div>

                    <div>
                      {isDiscountEnabled && discountPercentage > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDiscountEnabled(false);
                            setDiscountPercentage(0);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                        >
                          Disable Discount (0%)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsDiscountEnabled(true);
                            setDiscountPercentage(21);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                        >
                          + Enable Discount
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    {/* Discount percentage input and quick presets */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Discount Percentage (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={isDiscountEnabled ? (discountPercentage === 0 ? "" : discountPercentage) : 0}
                          disabled={!isDiscountEnabled}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            const clamped = Math.min(100, Math.max(0, val));
                            setDiscountPercentage(clamped);
                            if (clamped > 0) setIsDiscountEnabled(true);
                          }}
                          placeholder="0"
                          className={`w-full pl-3.5 pr-8 py-2 text-xs border rounded-xl font-mono focus:outline-emerald-600 transition ${
                            isDiscountEnabled
                              ? "bg-white border-slate-300 text-slate-900"
                              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>

                      {/* Quick preset buttons */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 mr-0.5">Presets:</span>
                        {[
                          { label: "0% (None)", value: 0 },
                          { label: "10%", value: 10 },
                          { label: "15%", value: 15 },
                          { label: "20%", value: 20 },
                          { label: "21%", value: 21 },
                          { label: "30%", value: 30 },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => {
                              if (btn.value === 0) {
                                setIsDiscountEnabled(false);
                                setDiscountPercentage(0);
                              } else {
                                setIsDiscountEnabled(true);
                                setDiscountPercentage(btn.value);
                              }
                            }}
                            className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer ${
                              isDiscountEnabled && discountPercentage === btn.value
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : !isDiscountEnabled && btn.value === 0
                                ? "bg-slate-700 text-white border-slate-700 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Calculation Display Box */}
                    <div className={`p-3.5 rounded-xl border text-xs transition ${
                      pricingCalculation.hasDiscount
                        ? "bg-white border-rose-200 shadow-xs"
                        : "bg-slate-100/70 border-slate-200 text-slate-600"
                    }`}>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <span className="font-semibold text-slate-700">Price Breakdown</span>
                        {pricingCalculation.hasDiscount ? (
                          <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[10px] rounded-md">
                            {pricingCalculation.discountPercentage}% OFF Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">
                            No Discount (0%)
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between text-slate-500">
                          <span>Original Price:</span>
                          <span>Rs. {pricingCalculation.originalPrice.toLocaleString()}</span>
                        </div>
                        {pricingCalculation.hasDiscount && (
                          <div className="flex justify-between text-rose-600 font-semibold">
                            <span>Discount ({pricingCalculation.discountPercentage}%):</span>
                            <span>- Rs. {pricingCalculation.discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                          <span className="font-sans">Sale Price:</span>
                          <span className="text-emerald-700 font-mono">
                            Rs. {pricingCalculation.salePrice.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-2">
                        {pricingCalculation.hasDiscount
                          ? `Store displays Rs. ${pricingCalculation.originalPrice.toLocaleString()} strikethrough, Rs. ${pricingCalculation.salePrice.toLocaleString()} sale price, and "${pricingCalculation.discountPercentage}% OFF" badge.`
                          : "Store displays regular price only. No OFF badge or strikethrough."}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Stock Availability
                  </label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="made_to_order">Made to Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Quantity in Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe craftsmanship, beauty, wall hanging method..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              {/* Specifications Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Specifications & Details (Visible to customers)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Material
                    </label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="e.g. 1.8mm Laser-cut Carbon Steel"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Dimensions / Size
                    </label>
                    <input
                      type="text"
                      value={dimensions}
                      onChange={(e) => setDimensions(e.target.value)}
                      placeholder="e.g. 90cm x 70cm (36 x 28 inches)"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Color / Finish
                    </label>
                    <input
                      type="text"
                      value={finishColor}
                      onChange={(e) => setFinishColor(e.target.value)}
                      placeholder="e.g. Electrostatic Gold & Matte Black"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Origin / Workshop
                    </label>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="e.g. Ahmed Home Decoration Workshop, Khushab"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      Care & Cleaning Instructions
                    </label>
                    <input
                      type="text"
                      value={careInstructions}
                      onChange={(e) => setCareInstructions(e.target.value)}
                      placeholder="e.g. Wipe gently with soft microfiber cloth; avoid water"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles (Featured & Active) */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Show as Featured Product on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Active (Visible on Live Storefront)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? "Save Product Changes" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">
                Delete Product?
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Are you sure you want to permanently delete{" "}
                <strong className="text-slate-800">"{productToDelete.name}"</strong>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
