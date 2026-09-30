import { Product, ProductDesign } from "../types";

/**
 * Resolves the complete list of designs/variants for any product.
 * Supports:
 * - Explicit `product.designs` array
 * - Explicit `product.variants` array
 * - Multi-image products (each image represents Design 1, Design 2, Design 3, Design 4...)
 * Works seamlessly for 1, 2, 3, 4, 5, 10, or any number of designs!
 */
export function getProductDesigns(product: Product | null | undefined): ProductDesign[] {
  if (!product) return [];

  if (Array.isArray(product.designs) && product.designs.length > 0) {
    return product.designs.map((d, idx) => ({
      id: d.id || `design-${idx + 1}`,
      name: d.name || `Design ${idx + 1}`,
      image: d.image || product.images?.[idx] || product.images?.[0] || "",
      price: typeof d.price === "number" ? d.price : product.price,
      stockStatus: d.stockStatus || product.stockStatus,
    }));
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.map((v, idx) => ({
      id: v.id || `design-${idx + 1}`,
      name: v.name || `Design ${idx + 1}`,
      image: v.image || product.images?.[idx] || product.images?.[0] || "",
      price: typeof v.price === "number" ? v.price : product.price,
      stockStatus: v.stockStatus || product.stockStatus,
    }));
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.map((img, idx) => ({
      id: `design-${idx + 1}`,
      name: `Design ${idx + 1}`,
      image: img,
      price: product.price,
      stockStatus: product.stockStatus,
    }));
  }

  return [
    {
      id: "design-1",
      name: "Default Design",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
      price: product.price,
      stockStatus: product.stockStatus,
    },
  ];
}

/**
 * Finds a specific design for a product by its ID.
 */
export function findDesignById(
  product: Product | null | undefined,
  designId?: string | null
): ProductDesign | undefined {
  if (!product || !designId) return undefined;
  const designs = getProductDesigns(product);
  return designs.find((d) => d.id === designId);
}

/**
 * Generates a unique, deterministic ID for cart items to ensure separate designs
 * of the same product are NEVER combined together and maintain independent quantities.
 */
export function getCartItemId(productId: string, designId?: string | null): string {
  const cleanDesignId = designId && designId.trim() ? designId.trim() : "design-1";
  return `${productId}__${cleanDesignId}`;
}

/**
 * Returns the exact display image for a product + selected design.
 */
export function getDesignDisplayImage(
  product: Product,
  design?: ProductDesign | null
): string {
  return (
    design?.image ||
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"
  );
}
