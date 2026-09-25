import React from "react";
import { Eye, CheckCircle2, AlertTriangle, XCircle, Sparkles, ShoppingBag, Star, Layers } from "lucide-react";
import { WhatsAppIcon } from "../common/WhatsAppIcon";
import { Product, ProductDesign } from "../../types";
import { createProductWhatsAppUrl, ORDER_WHATSAPP_NUMBER } from "../../lib/whatsapp";
import { logWhatsAppInquiry } from "../../lib/api";
import { getProductDiscountInfo } from "../../lib/pricing";
import { getInitialReviewsForProduct, calculateRatingSummary } from "../../lib/reviews";
import { getProductDesigns } from "../../lib/variants";

interface ProductCardProps {
  product: Product;
  shopPhone?: string;
  reviewSummary?: { averageRating: number; totalReviews: number };
  onOpenDetails: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number, selectedDesign?: ProductDesign) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  shopPhone = ORDER_WHATSAPP_NUMBER,
  reviewSummary,
  onOpenDetails,
  onAddToCart,
}) => {
  const discountInfo = getProductDiscountInfo(product);
  const rating = reviewSummary && reviewSummary.totalReviews > 0 ? reviewSummary : null;
  const isOutOfStock = product.stockStatus === "out_of_stock";

  const designs = getProductDesigns(product);
  const hasMultipleDesigns = designs.length > 1;
  const defaultSingleDesign = designs.length === 1 ? designs[0] : undefined;

  const whatsAppOrderUrl = createProductWhatsAppUrl(
    product,
    shopPhone,
    1,
    "",
    defaultSingleDesign
  );

  const getStockBadge = () => {
    switch (product.stockStatus) {
      case "in_stock":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1A1816] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E3DACD]">
            <CheckCircle2 className="w-3 h-3 text-[#4A5D43]" /> In Stock
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1F1F1F] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E3DACD]">
            <AlertTriangle className="w-3 h-3 text-[#B8976C]" /> Only {product.stockQuantity} Left
          </span>
        );
      case "made_to_order":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#4A5D43] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E3DACD]">
            <Sparkles className="w-3 h-3 text-[#4A5D43]" /> Custom Order
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  const coverImage = product.images?.[0] || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group bg-white rounded-2xl border border-[#E3DACD] hover:border-[#4A5D43] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Image Area - kept fully normal, vibrant and clear */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF8F5]">
        <img
          src={coverImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
          }}
        />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-0.5 bg-stone-900/90 backdrop-blur-xs text-white text-[10px] font-semibold tracking-wider uppercase rounded-md shadow-xs border border-white/20">
              Out of Stock
            </span>
          ) : (
            product.badge && (
              <span className="px-2.5 py-0.5 bg-[#4A5D43] text-white text-[10px] font-medium tracking-wider uppercase rounded-md shadow-xs">
                {product.badge}
              </span>
            )
          )}
          {discountInfo.hasDiscount && (
            <span className="px-2 py-0.5 bg-[#1A1816] text-[#C5A880] text-[10px] font-bold rounded-md shadow-xs border border-[#C5A880]/30">
              {discountInfo.discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Multi-image indicator */}
        {product.images && product.images.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-white/95 text-[#1A1816] border border-[#E3DACD] text-[10px] font-medium px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
            +{product.images.length - 1} photos
          </span>
        )}

        {/* Hover Quick View Overlay Button */}
        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-4 py-2 bg-white text-[#1A1816] border border-[#E3DACD] rounded-xl text-xs font-medium shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-[#4A5D43]" /> View Details
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between bg-white">
        <div>
          {/* Category & Stock row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-semibold text-[#4A5D43] uppercase tracking-widest truncate">
              {product.categoryName || "Home Décor"}
            </span>
            {getStockBadge()}
          </div>

          {/* Title */}
          <h3 className="font-display font-medium text-[#1A1816] text-base sm:text-lg group-hover:text-[#4A5D43] transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Rating Snippet - Shown ONLY if real approved reviews exist */}
          {rating ? (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#555555]">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-[#B8976C] text-[#B8976C]" />
              </div>
              <span className="font-bold text-[#1A1816] font-mono">{rating.averageRating.toFixed(1)}</span>
              <span>({rating.totalReviews})</span>
              <span className="text-[#4A5D43] font-medium text-[10px] ml-1">Verified</span>
            </div>
          ) : null}

          {/* Short description preview */}
          {product.description && (
            <p className="text-[#1F1F1F] text-xs mt-1.5 line-clamp-2 leading-relaxed font-normal">
              {product.description}
            </p>
          )}
        </div>

        {/* Pricing & View CTA Button */}
        <div className="mt-4 pt-3 border-t border-[#E3DACD]">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg sm:text-xl font-bold text-[#1A1816] font-mono">
              Rs. {discountInfo.salePrice.toLocaleString()}
            </span>
            {discountInfo.hasDiscount && (
              <span className="text-xs text-[#555555] line-through font-mono font-medium">
                Rs. {discountInfo.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Actions: Direct WhatsApp Order + Add to Cart / Details */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <button
                type="button"
                disabled
                aria-disabled="true"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="flex-1 py-2.5 px-3 bg-stone-200 text-stone-500 border border-stone-300 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 cursor-not-allowed select-none shadow-none"
                title="This product is currently out of stock"
              >
                <XCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Out of Stock</span>
              </button>
            ) : hasMultipleDesigns ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(product);
                }}
                className="flex-1 py-2.5 px-3 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title={`Select from ${designs.length} available designs`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#C5A880]" />
                <span>Choose Design ({designs.length})</span>
              </button>
            ) : (
              <a
                href={whatsAppOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  logWhatsAppInquiry({
                    productId: product.id,
                    productName: product.name,
                    productPrice: product.price,
                    quantity: 1,
                    selectedDesignId: defaultSingleDesign?.id,
                    selectedDesignName: defaultSingleDesign?.name,
                    selectedDesignImage: defaultSingleDesign?.image
                  });
                }}
                className="flex-1 py-2.5 px-3 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Order on WhatsApp"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Order on WhatsApp</span>
              </a>
            )}

            {isOutOfStock ? (
              <button
                type="button"
                disabled
                aria-disabled="true"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="p-2.5 bg-stone-100 text-stone-400 border border-stone-200 rounded-xl cursor-not-allowed select-none"
                title="Out of stock - Cannot add to cart"
                aria-label="Out of stock"
              >
                <ShoppingBag className="w-4 h-4 text-stone-400" />
              </button>
            ) : hasMultipleDesigns ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(product);
                }}
                className="p-2.5 bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#1A1816] border border-[#E3DACD] rounded-xl transition-colors cursor-pointer relative"
                title="Select design before adding to cart"
                aria-label="Select design"
              >
                <ShoppingBag className="w-4 h-4 text-[#1A1816]" />
              </button>
            ) : onAddToCart ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product, 1, defaultSingleDesign);
                }}
                className="p-2.5 bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#1A1816] border border-[#E3DACD] rounded-xl transition-colors cursor-pointer"
                title="Add to Cart"
                aria-label="Add to cart"
              >
                <ShoppingBag className="w-4 h-4 text-[#1A1816]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(product);
                }}
                className="p-2.5 bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#1A1816] border border-[#E3DACD] rounded-xl transition-colors cursor-pointer"
                title="View details"
                aria-label="View details"
              >
                <Eye className="w-4 h-4 text-[#1A1816]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
