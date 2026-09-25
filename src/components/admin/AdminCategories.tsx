import React, { useState } from "react";
import { Category, Product } from "../../types";
import {
  createCategory,
  updateCategory,
  deleteCategory
} from "../../lib/api";
import { DirectImageUpload } from "../common/DirectImageUpload";
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface AdminCategoriesProps {
  categories?: Category[];
  products?: Product[];
  onRefreshData: () => Promise<void>;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories = [],
  products = [],
  onRefreshData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Deletion modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [associatedCount, setAssociatedCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState<number>(1);

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setImage("");
    setActive(true);
    setOrder(categories.length + 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setDescription(c.description || "");
    setImage(c.image || "");
    setActive(c.active !== undefined ? c.active : true);
    setOrder(c.order || 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload: Partial<Category> = {
        name: name.trim(),
        description: description.trim(),
        image: image || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
        active,
        order: Number(order) || 1
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        setSuccessMessage(`Category "${name}" updated.`);
      } else {
        await createCategory(payload);
        setSuccessMessage(`Category "${name}" added.`);
      }

      await onRefreshData();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDelete = (cat: Category) => {
    const attached = (products || []).filter((p) => p && p.categoryId === cat.id).length;
    setCategoryToDelete(cat);
    setAssociatedCount(attached);
  };

  const confirmDelete = async (force: boolean) => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id, force);
      await onRefreshData();
      setSuccessMessage(`Category "${categoryToDelete.name}" deleted.`);
      setCategoryToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Could not delete category.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Category Management
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Organize products into intuitive collections with direct custom image uploads.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(categories || []).map((cat) => {
          const productCount = (products || []).filter((p) => p && p.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                {/* Category Image */}
                <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={cat.image || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                        cat.active ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {cat.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <span className="absolute bottom-2 left-2 px-2.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[11px] rounded-md font-medium">
                    {productCount} {productCount === 1 ? "Product" : "Products"}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-base mb-1">{cat.name}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                    {cat.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Order: #{cat.order || 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                    title="Edit category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => promptDelete(cat)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 my-6 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Direct Image Upload */}
              <DirectImageUpload
                label="Category Cover Image"
                value={image}
                onChange={setImage}
                helpText="Upload a high-quality photograph representing this category"
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Islamic Wall Art & Calligraphy"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of items in this category..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>Active on Store</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
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
                  <span>{editingCategory ? "Save Category Changes" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Warning Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">
                Delete Category: "{categoryToDelete.name}"?
              </h3>
              {associatedCount > 0 ? (
                <div className="mt-2 text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200 text-left">
                  <p className="font-bold text-amber-800 mb-1">
                    ⚠️ Safety Notice: {associatedCount} product(s) are currently attached to this category!
                  </p>
                  <p className="text-amber-900">
                    Deleting this category will safely reassign those {associatedCount} products to "Uncategorized" so no products are lost or broken.
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-xs mt-1">
                  No products are currently using this category. It can be safely deleted.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => confirmDelete(true)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                {isDeleting ? "Deleting..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
