import { ProductReview, ProductRatingSummary } from "../types";

// Calculate aggregate rating summary for approved reviews only
export function calculateRatingSummary(reviews: ProductReview[]): ProductRatingSummary {
  // Filter for approved reviews if status is present
  const validReviews = (reviews || []).filter(
    (r) => !r.status || r.status === "approved"
  );

  if (validReviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recommendPercentage: 0
    };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;
  let recommendCount = 0;

  for (const rev of validReviews) {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating || 5))) as 1 | 2 | 3 | 4 | 5;
    distribution[r] = (distribution[r] || 0) + 1;
    totalRating += rev.rating || 5;
    if (rev.recommended !== false) {
      recommendCount++;
    }
  }

  const averageRating = Number((totalRating / validReviews.length).toFixed(1));
  const recommendPercentage = Math.round((recommendCount / validReviews.length) * 100);

  return {
    averageRating,
    totalReviews: validReviews.length,
    distribution,
    recommendPercentage
  };
}

// Fetch approved public reviews from the server for a specific product
export async function fetchReviewsForProduct(productId: string): Promise<{
  reviews: ProductReview[];
  summary: ProductRatingSummary;
}> {
  try {
    const res = await fetch(`/api/products/${productId}/reviews`);
    if (!res.ok) {
      return {
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          recommendPercentage: 0
        }
      };
    }
    const data = await res.json();
    const reviews: ProductReview[] = Array.isArray(data.reviews) ? data.reviews : [];
    const summary: ProductRatingSummary = data.summary || calculateRatingSummary(reviews);
    return { reviews, summary };
  } catch (err) {
    console.warn("Failed to fetch product reviews:", err);
    return {
      reviews: [],
      summary: {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recommendPercentage: 0
      }
    };
  }
}

// Submit a new customer review (will be stored as 'pending' awaiting admin approval)
export async function submitProductReview(payload: {
  productId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<{ success: boolean; message: string; review: ProductReview }> {
  const res = await fetch(`/api/products/${payload.productId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userName: payload.userName.trim(),
      rating: payload.rating,
      comment: payload.comment.trim()
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to submit review. Please try again.");
  }

  return data;
}

// Initial empty array for new product views without fake data
export function getInitialReviewsForProduct(_productId: string): ProductReview[] {
  return [];
}
