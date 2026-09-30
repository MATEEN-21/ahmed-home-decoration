import React, { useState, useMemo } from "react";
import {
  Star,
  CheckCircle,
  EyeOff,
  Trash2,
  Clock,
  Search,
  Filter,
  Package,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { ProductReview, Product } from "../../types";
import { updateReviewStatus, deleteReview } from "../../lib/api";

interface AdminReviewsProps {
  reviews: ProductReview[];
  products: Product[];
  onRefreshData: () => void;
}

export const AdminReviews: React.FC<AdminReviewsProps> = ({
  reviews = [],
  products = [],
  onRefreshData,
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "hidden">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Map product information for quick lookup
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: reviews.length,
      pending: reviews.filter((r) => r.status === "pending").length,
      approved: reviews.filter((r) => r.status === "approved").length,
      hidden: reviews.filter((r) => r.status === "hidden").length,
    };
  }, [reviews]);

  // Filter & Search reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Status filter
      if (filterStatus !== "all" && r.status !== filterStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pName = (r.productName || productMap.get(r.productId)?.name || "").toLowerCase();
        const uName = (r.userName || "").toLowerCase();
        const comment = (r.comment || "").toLowerCase();
        return pName.includes(q) || uName.includes(q) || comment.includes(q);
      }

      return true;
    });
  }, [reviews, filterStatus, searchQuery, productMap]);

  // Handle status update
  const handleUpdateStatus = async (reviewId: string, newStatus: "approved" | "hidden" | "pending") => {
    setActionLoadingId(reviewId);
    setStatusMessage(null);
    try {
      await updateReviewStatus(reviewId, newStatus);
      setStatusMessage({
        type: "success",
        text: `Review status updated to "${newStatus}".`,
      });
      onRefreshData();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update review status.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle review deletion
  const handleDeleteReview = async (reviewId: string) => {
    setActionLoadingId(reviewId);
    setStatusMessage(null);
    try {
      await deleteReview(reviewId);
      setStatusMessage({
        type: "success",
        text: "Review has been permanently deleted.",
      });
      setDeleteConfirmId(null);
      onRefreshData();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to delete review.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString("en-PK", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Customer Reviews & Ratings</span>
            {counts.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                {counts.pending} Pending
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Moderate and verify authentic reviews submitted for Ahmed Home Decoration products. Only approved reviews appear on the public storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshData}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Reviews</span>
        </button>
      </div>

      {/* Status Notice Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            filterStatus === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-80">
            Total Reviews
          </span>
          <span className="text-2xl sm:text-3xl font-bold font-mono mt-1 block">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("pending")}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            filterStatus === "pending"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-amber-300"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider block text-amber-700">
            Pending Approval
          </span>
          <span className="text-2xl sm:text-3xl font-bold font-mono mt-1 block text-amber-600">
            {counts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("approved")}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            filterStatus === "approved"
              ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-emerald-300"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider block text-emerald-700">
            Approved (Visible)
          </span>
          <span className="text-2xl sm:text-3xl font-bold font-mono mt-1 block text-emerald-700">
            {counts.approved}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus("hidden")}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            filterStatus === "hidden"
              ? "bg-slate-700 text-white border-slate-700 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider block text-slate-500">
            Hidden / Unapproved
          </span>
          <span className="text-2xl sm:text-3xl font-bold font-mono mt-1 block text-slate-600">
            {counts.hidden}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterStatus === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterStatus === "pending"
                ? "bg-amber-500 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("approved")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterStatus === "approved"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            Approved ({counts.approved})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("hidden")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterStatus === "hidden"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Hidden ({counts.hidden})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, product, review..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
          />
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm mb-1">
            No reviews found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "No reviews match your search query. Try clearing the search filter."
              : filterStatus === "pending"
              ? "There are currently no reviews pending verification."
              : "No customer reviews currently recorded."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReviews.map((rev) => {
            const product = productMap.get(rev.productId);
            const prodName = rev.productName || product?.name || "Product ID: " + rev.productId;
            const prodImage = rev.productImage || product?.images?.[0] || "";
            const isProcessing = actionLoadingId === rev.id;

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition space-y-4"
              >
                {/* Top Row: Product Info & Review Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  {/* Product Identifier */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {prodImage ? (
                        <img
                          src={prodImage}
                          alt={prodName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                        Reviewed Product
                      </span>
                      <h4 className="font-semibold text-sm text-slate-900 truncate leading-snug">
                        {prodName}
                      </h4>
                      {product && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Rs. {product.price?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {rev.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pending Approval
                      </span>
                    )}
                    {rev.status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Approved & Visible
                      </span>
                    )}
                    {rev.status === "hidden" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        Hidden from Store
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Customer Details, Star Rating, and Comment */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-900">
                        {rev.userName}
                      </span>
                      {/* Star Rating */}
                      <div className="flex items-center gap-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= Math.round(rev.rating)
                                  ? "fill-[#B8976C] text-[#B8976C]"
                                  : "fill-transparent text-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-800 font-mono ml-0.5">
                          {rev.rating}.0
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-slate-500 font-mono">
                      Submitted: {formatDate(rev.createdAt)}
                    </span>
                  </div>

                  {/* Review Text */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    "{rev.comment}"
                  </div>
                </div>

                {/* Bottom Row: Moderation Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 font-mono">
                    ID: {rev.id}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Approve Action */}
                    {rev.status !== "approved" && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleUpdateStatus(rev.id, "approved")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve & Publish</span>
                      </button>
                    )}

                    {/* Hide / Unapprove Action */}
                    {rev.status === "approved" && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleUpdateStatus(rev.id, "hidden")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer disabled:opacity-50"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>Hide / Unapprove</span>
                      </button>
                    )}

                    {/* Delete Action (with confirmation) */}
                    {deleteConfirmId === rev.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200 animate-in fade-in duration-150">
                        <span className="text-[11px] text-red-700 font-medium px-2">
                          Confirm delete?
                        </span>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDeleteReview(rev.id)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium rounded-lg cursor-pointer hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setDeleteConfirmId(rev.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-semibold transition cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
