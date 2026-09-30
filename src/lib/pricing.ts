/**
 * Centralized product price and discount calculations for Ahmed Home Decoration.
 */

export interface PriceCalculationResult {
  originalPrice: number;
  discountPercentage: number;
  discountAmount: number;
  salePrice: number;
  hasDiscount: boolean;
}

/**
 * Calculates discount amount and final sale price accurately.
 * E.g., original price Rs. 10,000 with 21% discount:
 * discountAmount = Rs. 2,100
 * salePrice = Rs. 7,900
 */
export function calculateProductPricing(
  basePrice: number | string,
  discountPercent: number | string
): PriceCalculationResult {
  const original = Math.max(0, Math.round(Number(basePrice) || 0));
  const rawDiscount = Number(discountPercent) || 0;
  const clampedDiscount = Math.min(100, Math.max(0, Math.round(rawDiscount)));

  if (clampedDiscount > 0 && original > 0) {
    const discountAmount = Math.round(original * (clampedDiscount / 100));
    const salePrice = Math.max(0, original - discountAmount);
    return {
      originalPrice: original,
      discountPercentage: clampedDiscount,
      discountAmount,
      salePrice,
      hasDiscount: true,
    };
  }

  return {
    originalPrice: original,
    discountPercentage: 0,
    discountAmount: 0,
    salePrice: original,
    hasDiscount: false,
  };
}

/**
 * Helper to determine if a product has an active discount (> 0%).
 */
export function getProductDiscountInfo(product: {
  price: number;
  originalPrice?: number | null;
  oldPrice?: number | null;
  discountPercentage?: number | null;
}): {
  hasDiscount: boolean;
  discountPercentage: number;
  originalPrice: number;
  salePrice: number;
  discountAmount: number;
} {
  const salePrice = Number(product.price) || 0;
  
  // Explicit stored discountPercentage
  if (typeof product.discountPercentage === "number") {
    const pct = Math.min(100, Math.max(0, Math.round(product.discountPercentage)));
    if (pct > 0) {
      const orig = Number(product.originalPrice || product.oldPrice) || (pct < 100 ? Math.round(salePrice / (1 - pct / 100)) : salePrice);
      const discountAmount = Math.max(0, orig - salePrice);
      return {
        hasDiscount: true,
        discountPercentage: pct,
        originalPrice: orig,
        salePrice,
        discountAmount,
      };
    }
    return {
      hasDiscount: false,
      discountPercentage: 0,
      originalPrice: salePrice,
      salePrice,
      discountAmount: 0,
    };
  }

  // Fallback for legacy items with oldPrice > price
  if (product.oldPrice && product.oldPrice > salePrice) {
    const orig = Number(product.oldPrice);
    const pct = Math.round(((orig - salePrice) / orig) * 100);
    if (pct > 0) {
      return {
        hasDiscount: true,
        discountPercentage: pct,
        originalPrice: orig,
        salePrice,
        discountAmount: orig - salePrice,
      };
    }
  }

  return {
    hasDiscount: false,
    discountPercentage: 0,
    originalPrice: salePrice,
    salePrice,
    discountAmount: 0,
  };
}
