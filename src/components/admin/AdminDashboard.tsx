import React from "react";
import {
  Package,
  Layers,
  Sliders,
  AlertTriangle,
  MessageCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Star
} from "lucide-react";
import { AdminAllDataResponse } from "../../types";

interface AdminDashboardProps {
  data: AdminAllDataResponse;
  onNavigateTab: (tab: string) => void;
  onOpenAddProduct: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  onNavigateTab,
  onOpenAddProduct
}) => {
  const products = data.products || [];
  const categories = data.categories || [];
  const slides = data.slides || [];
  const inquiries = data.inquiries || [];
  const settings = data.settings;

  const lowStockCount = products.filter(
    (p) => p && (p.stockStatus === "low_stock" || p.stockStatus === "out_of_stock" || (p.stockQuantity ?? 0) <= 3)
  ).length;

  const activeProducts = products.filter((p) => p && p.active).length;
  const activeCategories = categories.filter((c) => c && c.active).length;
  const activeSlides = slides.filter((s) => s && s.active).length;

  const allReviews = data.reviews || [];
  const pendingReviewsCount = allReviews.filter((r) => r.status === "pending").length;
  const approvedReviewsCount = allReviews.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-8">
      {/* Pending Reviews Notification Banner (if any) */}
      {pendingReviewsCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {pendingReviewsCount} New Customer {pendingReviewsCount === 1 ? "Review" : "Reviews"} Awaiting Moderation
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Customer reviews remain hidden on the storefront until you verify and approve them.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("reviews")}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <span>Review & Approve</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" /> Real Database & File Storage Connected
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Welcome to {settings.shopName || "Ahmed Home Decoration"}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            All updates you make here to products, categories, hero slides, and shop details will save directly to the persistent backend and instantly appear on the live storefront.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenAddProduct}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
            <button
              onClick={() => onNavigateTab("settings")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition border border-white/20 cursor-pointer"
            >
              Edit Shop Info & WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Products Stat */}
        <div
          onClick={() => onNavigateTab("products")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
              {products.length}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {activeProducts} active
            </span>
          </div>
        </div>

        {/* Categories Stat */}
        <div
          onClick={() => onNavigateTab("categories")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Categories
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
              {categories.length}
            </span>
            <span className="text-xs text-blue-700 font-medium">
              {activeCategories} active
            </span>
          </div>
        </div>

        {/* Hero Slides Stat */}
        <div
          onClick={() => onNavigateTab("slides")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hero Slides
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
              {slides.length}
            </span>
            <span className="text-xs text-purple-700 font-medium">
              {activeSlides} active
            </span>
          </div>
        </div>

        {/* Low Stock / Inventory alerts */}
        <div
          onClick={() => onNavigateTab("products")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
              {lowStockCount}
            </span>
            <span className="text-xs text-amber-700 font-medium">
              Needs attention
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-4">
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <button
            onClick={onOpenAddProduct}
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/30 text-left transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <Plus className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Add New Product</h4>
              <p className="text-slate-500 text-xs mt-1">
                Upload multiple images, set pricing, specs and stock.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-700">
              Open Form <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("categories")}
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/30 text-left transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Manage Categories</h4>
              <p className="text-slate-500 text-xs mt-1">
                Add, rename, reorder, or replace category images.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-700">
              View Categories <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("reviews")}
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/30 text-left transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Customer Reviews</h4>
              <p className="text-slate-500 text-xs mt-1">
                {pendingReviewsCount > 0 ? `${pendingReviewsCount} review(s) awaiting approval` : "Moderate & verify testimonials"}
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-700">
              Moderate Reviews <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("slides")}
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/30 text-left transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Hero Slider</h4>
              <p className="text-slate-500 text-xs mt-1">
                Change homepage slides, reorder, upload fresh banners.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-purple-700">
              Edit Slides <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("settings")}
            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/30 text-left transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">WhatsApp & Address</h4>
              <p className="text-slate-500 text-xs mt-1">
                Update 0304 9088810, Thanan Market address & announcements.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-teal-700">
              Edit Settings <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </button>
        </div>
      </div>

      {/* Persistence & System Health */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              Express 4 Backend + Atomic File Database (data/db.json)
            </p>
            <p className="text-slate-500 mt-0.5">
              Images uploaded via &lt;input type="file"&gt; are permanently written to /uploads/ directory on server.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto font-medium text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>System Healthy</span>
        </div>
      </div>
    </div>
  );
};
