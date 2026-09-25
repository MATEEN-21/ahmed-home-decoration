import React, { useState, useEffect } from "react";
import { Star, MessageSquarePlus, CheckCircle2, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { ProductReview, ProductRatingSummary } from "../../types";
import { fetchReviewsForProduct, submitProductReview, calculateRatingSummary } from "../../lib/reviews";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  onRatingSummaryChange?: (summary: ProductRatingSummary) => void;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  onRatingSummaryChange
}) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductRatingSummary>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recommendPercentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch approved reviews on productId change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsFormOpen(false);
    setSubmitSuccess(false);
    setFormError(null);

    fetchReviewsForProduct(productId)
      .then((res) => {
        if (!isMounted) return;
        setReviews(res.reviews);
        setSummary(res.summary);
        if (onRatingSummaryChange) {
          onRatingSummaryChange(res.summary);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, onRatingSummaryChange]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = userName.trim();
    const trimmedComment = comment.trim();

    if (!trimmedName) {
      setFormError("Please enter your name.");
      return;
    }

    if (!trimmedComment) {
      setFormError("Please write your review about the product quality, appearance, or packaging.");
      return;
    }

    if (trimmedComment.length < 5) {
      setFormError("Review should be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitProductReview({
        productId,
        userName: trimmedName,
        rating,
        comment: trimmedComment
      });

      setSubmitSuccess(true);
      setUserName("");
      setComment("");
      setRating(5);
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1:
        return "1 Star — Poor";
      case 2:
        return "2 Stars — Fair";
      case 3:
        return "3 Stars — Good";
      case 4:
        return "4 Stars — Very Good";
      case 5:
        return "5 Stars — Excellent";
      default:
        return "";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString("en-PK", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div id="customer-reviews-section" className="border-t border-[#E3DACD] bg-[#FAF8F5]/60 p-5 sm:p-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#1A1816] tracking-tight">
            Customer Reviews
          </h3>
          <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
            Real feedback on product quality, aesthetics, packaging, and home styling.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsFormOpen((prev) => !prev);
            setFormError(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#1A1816] border border-[#E3DACD] hover:border-[#4A5D43] text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs shrink-0"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#4A5D43]" />
          <span>{isFormOpen ? "Cancel Review" : "Write a Review"}</span>
          {isFormOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#666666]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#666666]" />
          )}
        </button>
      </div>

      {/* Submission Success Notice */}
      {submitSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-[#4A5D43]/10 border border-[#4A5D43]/30 text-[#1A1816] flex items-start gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-[#4A5D43] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-sm text-[#4A5D43]">Thank You for Your Review!</p>
            <p className="text-[#333333] mt-1 leading-relaxed">
              Your review for <span className="font-semibold">{productName}</span> has been submitted for verification. It will appear on the public store once approved by the Ahmed Home Decoration team.
            </p>
          </div>
        </div>
      )}

      {/* Write a Review Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="mb-8 p-5 sm:p-6 bg-white rounded-2xl border border-[#E3DACD] shadow-xs animate-in slide-in-from-top-2 duration-200"
        >
          <div className="border-b border-[#E3DACD] pb-4 mb-5">
            <h4 className="font-display text-base sm:text-lg font-semibold text-[#1A1816]">
              Write a Review for {productName}
            </h4>
            <p className="text-xs text-[#666666] mt-0.5">
              Share details about the quality, appearance, packaging, or customer service.
            </p>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1816] uppercase tracking-wider mb-1.5">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Usman Malik"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3DACD] bg-[#FAF8F5]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4A5D43]/30 focus:border-[#4A5D43] text-[#1A1816] transition"
              />
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1816] uppercase tracking-wider mb-1.5">
                Star Rating (1–5) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating ?? rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 rounded-md hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                        aria-label={`${star} Stars`}
                      >
                        <Star
                          className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                            active
                              ? "fill-[#B8976C] text-[#B8976C]"
                              : "fill-transparent text-[#D4C8B8]"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-medium text-[#4A5D43] ml-2">
                  {getRatingLabel(hoverRating ?? rating)}
                </span>
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1816] uppercase tracking-wider mb-1.5">
                Review <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How did the product look in your home? How was the finish quality, safe packaging, and delivery experience?"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E3DACD] bg-[#FAF8F5]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4A5D43]/30 focus:border-[#4A5D43] text-[#1A1816] transition resize-y"
              />
              <p className="text-[11px] text-[#777777] mt-1">
                Context ideas: product quality, appearance & finish, packaging safety, or delivery experience.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E3DACD] text-xs font-medium text-[#555555] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#4A5D43] hover:bg-[#3B4A35] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Aggregate Rating and Review Count Summary (Shown only if approved reviews exist) */}
      {summary.totalReviews > 0 ? (
        <div className="mb-6 p-5 sm:p-6 bg-white rounded-2xl border border-[#E3DACD] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="text-center sm:text-left">
              <div className="font-mono text-3xl sm:text-4xl font-bold text-[#1A1816] leading-none">
                {summary.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(summary.averageRating)
                        ? "fill-[#B8976C] text-[#B8976C]"
                        : "fill-transparent text-[#E3DACD]"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="h-10 w-[1px] bg-[#E3DACD] hidden sm:block" />
            <div>
              <div className="text-sm font-semibold text-[#1A1816]">
                Average Customer Rating
              </div>
              <div className="text-xs text-[#666666] mt-0.5">
                Based on <span className="font-semibold text-[#1A1816]">{summary.totalReviews} verified</span> {summary.totalReviews === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div>

          {/* Star Distribution Breakdown */}
          <div className="w-full sm:w-64 space-y-1.5 text-xs text-[#555555]">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
              const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-10 text-[11px] font-mono">{star} Star</span>
                  <div className="flex-1 h-2 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E3DACD]/70">
                    <div
                      className="h-full bg-[#B8976C] rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] font-mono text-[#777777]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Reviews List or Natural Empty State */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-[#777777]">
          Loading customer reviews...
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 bg-white rounded-2xl border border-[#E3DACD] shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#1A1816]">
                      {rev.userName}
                    </span>
                    <span className="text-[10px] text-[#4A5D43] bg-[#FAF8F5] border border-[#E3DACD] px-2 py-0.5 rounded-full font-medium">
                      Verified Review
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(rev.rating)
                            ? "fill-[#B8976C] text-[#B8976C]"
                            : "fill-transparent text-[#E3DACD]"
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-mono font-bold text-[#1A1816] ml-1">
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-[#888888] font-mono shrink-0">
                  {formatDate(rev.createdAt)}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#333333] leading-relaxed whitespace-pre-line">
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 px-4 text-center bg-white rounded-2xl border border-[#E3DACD]/80">
          <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E3DACD] mx-auto mb-3 flex items-center justify-center">
            <Star className="w-5 h-5 text-[#B8976C]" />
          </div>
          <h4 className="text-sm font-semibold text-[#1A1816] mb-1">
            No reviews yet for this product
          </h4>
          <p className="text-xs text-[#666666] max-w-md mx-auto mb-4">
            Have you purchased this piece for your home or office? Be the first to share your thoughts on its quality, design, and packaging.
          </p>
          {!isFormOpen && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A5D43] hover:bg-[#3B4A35] text-white text-xs font-medium transition cursor-pointer shadow-xs"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Write the First Review</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
