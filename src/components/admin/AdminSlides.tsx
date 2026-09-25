import React, { useState } from "react";
import { HeroSlide } from "../../types";
import {
  createSlide,
  updateSlide,
  deleteSlide
} from "../../lib/api";
import { DirectImageUpload } from "../common/DirectImageUpload";
import {
  Plus,
  Edit2,
  Trash2,
  Sliders,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle,
  MoveUp,
  MoveDown
} from "lucide-react";

interface AdminSlidesProps {
  slides?: HeroSlide[];
  onRefreshData: () => Promise<void>;
}

export const AdminSlides: React.FC<AdminSlidesProps> = ({ slides = [], onRefreshData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete modal state
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [buttonText, setButtonText] = useState("Explore Collection");
  const [buttonLink, setButtonLink] = useState("/products");
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState<number>(1);

  const openAddModal = () => {
    setEditingSlide(null);
    setTitle("");
    setSubtitle("");
    setBadge("");
    setDescription("");
    setImage("");
    setButtonText("Explore Collection");
    setButtonLink("/products");
    setActive(true);
    setOrder(slides.length + 1);
    setFormError(null);
    setIsImageUploading(false);
    setIsModalOpen(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setTitle(slide.title);
    setSubtitle(slide.subtitle || "");
    setBadge(slide.badge || "");
    setDescription(slide.description || "");
    setImage(slide.image || "");
    setButtonText(slide.buttonText || "Explore Collection");
    setButtonLink(slide.buttonLink || "/products");
    setActive(slide.active !== undefined ? slide.active : true);
    setOrder(slide.order || 1);
    setFormError(null);
    setIsImageUploading(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Slide title is required.");
      return;
    }
    if (!image) {
      setFormError("Please upload a background image for this slide.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload: Partial<HeroSlide> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        badge: badge.trim(),
        description: description.trim(),
        image,
        buttonText: buttonText.trim(),
        buttonLink: buttonLink.trim(),
        active,
        order: Number(order) || 1
      };

      if (editingSlide) {
        await updateSlide(editingSlide.id, payload);
        setSuccessMessage(`Slide "${title}" updated.`);
      } else {
        await createSlide(payload);
        setSuccessMessage(`Slide "${title}" added.`);
      }

      await onRefreshData();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to save slide.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!slideToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSlide(slideToDelete.id);
      await onRefreshData();
      setSuccessMessage(`Slide "${slideToDelete.title}" deleted.`);
      setSlideToDelete(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to delete slide.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = async (slide: HeroSlide, direction: "up" | "down") => {
    const currentIndex = slides.findIndex((s) => s.id === slide.id);
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === slides.length - 1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetSlide = slides[targetIndex];

    try {
      await updateSlide(slide.id, { order: targetSlide.order || targetIndex + 1 });
      await updateSlide(targetSlide.id, { order: slide.order || currentIndex + 1 });
      await onRefreshData();
    } catch (err: any) {
      alert("Failed to reorder: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Homepage Hero Slider
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manage top banner slides, upload high-resolution photos, adjust titles and call-to-actions.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Slide
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

      {/* Slides List */}
      <div className="space-y-4">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 hover:border-emerald-300 transition"
          >
            {/* Slide Preview & Info */}
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img
                  src={slide.image || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded">
                  #{index + 1}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      slide.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {slide.active ? "Active" : "Disabled"}
                  </span>
                  {slide.subtitle && (
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                      {slide.subtitle}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
                  {slide.title}
                </h3>
                <p className="text-slate-500 text-xs line-clamp-1 max-w-md">
                  {slide.description}
                </p>
                <div className="text-[11px] text-slate-400">
                  CTA Button: <strong>"{slide.buttonText}"</strong> → {slide.buttonLink}
                </div>
              </div>
            </div>

            {/* Actions & Ordering */}
            <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 mr-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleReorder(slide, "up")}
                  className="p-1 text-slate-600 hover:text-emerald-700 disabled:opacity-30 cursor-pointer"
                  title="Move up"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === slides.length - 1}
                  onClick={() => handleReorder(slide, "down")}
                  className="p-1 text-slate-600 hover:text-emerald-700 disabled:opacity-30 cursor-pointer"
                  title="Move down"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => openEditModal(slide)}
                className="p-2 rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                title="Edit slide"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSlideToDelete(slide)}
                className="p-2 rounded-xl text-slate-700 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                title="Delete slide"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 my-6 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                {editingSlide ? `Edit Hero Slide: ${editingSlide.title}` : "Add New Hero Slide"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Direct Banner Image Upload */}
              <DirectImageUpload
                label="Slide Background Banner Image *"
                value={image}
                onChange={(newUrl) => {
                  setImage(newUrl);
                  setFormError(null);
                }}
                onUploadingChange={setIsImageUploading}
                helpText="High-resolution landscape photo (16:9 or 1920x800 recommended)"
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Main Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Elegance for Pakistani Homes"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Badge / Tag (e.g. Handcrafted Luxury)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. Handcrafted Luxury"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Subtitle / Eyebrow Text
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. Exclusive Pakistani Artisan Craft"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description / Paragraph
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Transform your living room and prayer spaces with luxury stainless steel and acrylic calligraphy..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Explore Collection"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Button Action Target
                  </label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="e.g. /products, /contact, /about"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Active (Displayed in slider rotation)</span>
                </label>
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
                  disabled={isSubmitting || isImageUploading}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {(isSubmitting || isImageUploading) && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isImageUploading
                      ? "Uploading Image..."
                      : editingSlide
                      ? "Save Slide Changes"
                      : "Create Slide"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {slideToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">
                Delete Hero Slide?
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Are you sure you want to delete slide "{slideToDelete.title}"?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSlideToDelete(null)}
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
