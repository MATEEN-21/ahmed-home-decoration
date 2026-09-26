import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Layers,
  AlertTriangle,
  ShoppingBag,
  Star,
  XCircle,
  Sparkles
} from "lucide-react";
import { WhatsAppIcon } from "../common/WhatsAppIcon";
import { Product, SiteSettings, ProductRatingSummary, ProductDesign } from "../../types";
import { createProductWhatsAppUrl, ORDER_WHATSAPP_NUMBER } from "../../lib/whatsapp";
import { logWhatsAppInquiry } from "../../lib/api";
import { getProductDiscountInfo } from "../../lib/pricing";
import { calculateRatingSummary, getInitialReviewsForProduct } from "../../lib/reviews";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { getProductDesigns } from "../../lib/variants";

interface ProductDetailModalProps {
  product: Product | null;
  settings: SiteSettings;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number, selectedDesign?: ProductDesign) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  onClose,
  onAddToCart,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDesignId, setSelectedDesignId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState("");
  const [ratingSummary, setRatingSummary] = useState<ProductRatingSummary>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recommendPercentage: 0
  });

  const designs = React.useMemo(() => getProductDesigns(product), [product]);

  useEffect(() => {
    if (designs.length > 0) {
      setSelectedDesignId(designs[0].id);
    } else {
      setSelectedDesignId("");
    }
    setSelectedImageIndex(0);
    setQuantity(1);
    setCustomerNote("");
  }, [product?.id, designs]);

  // Active selected design
  const selectedDesign = React.useMemo(() => {
    if (designs.length === 0) return undefined;
    return designs.find((d) => d.id === selectedDesignId) || designs[0];
  }, [designs, selectedDesignId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [product]);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
  ];
  // Active image follows the selected design's image or gallery index
  const activeImage = selectedDesign?.image || images[selectedImageIndex] || images[0];

  const discountInfo = getProductDiscountInfo(product);
  const isOutOfStock = product.stockStatus === "out_of_stock";
  const totalAmount = discountInfo.salePrice * quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto my-6 border border-[#E3DACD] animate-in zoom-in-95 duration-200 scroll-smooth"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Sticky Close Button */}
        <div className="sticky top-0 z-30 flex justify-end p-3 pointer-events-none h-0">
          <button
            onClick={onClose}
            className="pointer-events-auto w-9 h-9 rounded-full bg-[#FAF8F5]/90 hover:bg-white text-[#1A1816] border border-[#E3DACD] flex items-center justify-center transition-colors cursor-pointer shadow-md backdrop-blur-xs mr-1 mt-1"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Image Gallery */}
          <div className="p-5 sm:p-8 bg-[#FAF8F5] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E3DACD]">
            {/* Main Active Image */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-[#E3DACD] shadow-xs flex items-center justify-center">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80";
                }}
              />
              {product.badge && (
                <span className="absolute top-3 left-3 px-3 py-1 bg-[#4A5D43] text-white text-[10px] font-medium tracking-wider uppercase rounded-md shadow-xs">
                  {product.badge}
                </span>
              )}
              {discountInfo.hasDiscount && (
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-[#1A1816] text-[#C5A880] text-[10px] font-bold rounded-md shadow-xs border border-[#C5A880]/30">
                  {discountInfo.discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail Row if multiple designs or images */}
            {designs.length > 1 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-semibold text-[#1A1816]">
                    Designs / Photos ({designs.length})
                  </span>
                  <span className="text-[11px] font-semibold text-[#4A5D43]">
                    {selectedDesign?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {designs.map((design, idx) => {
                    const isSelected = selectedDesign?.id === design.id;
                    return (
                      <button
                        key={design.id}
                        type="button"
                        onClick={() => {
                          setSelectedDesignId(design.id);
                          setSelectedImageIndex(idx);
                        }}
                        className={`group relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#4A5D43] ring-2 ring-[#4A5D43]/30 scale-102 shadow-xs"
                            : "border-[#E3DACD] hover:border-[#4A5D43]/50 opacity-85 hover:opacity-100 bg-white"
                        }`}
                        title={design.name}
                      >
                        <img
                          src={design.image || images[idx] || ""}
                          alt={design.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        <span
                          className={`absolute bottom-0 inset-x-0 text-[9px] font-bold text-center py-0.5 truncate px-1 transition-colors ${
                            isSelected
                              ? "bg-[#4A5D43] text-white"
                              : "bg-black/60 text-white group-hover:bg-black/75"
                          }`}
                        >
                          {design.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-6 pt-4 border-t border-[#E3DACD] grid grid-cols-2 gap-3 text-xs text-[#1F1F1F]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4A5D43] shrink-0" />
                <span className="font-medium">Damage-Proof Packing</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#4A5D43] shrink-0" />
                <span className="font-medium">Pakistan-Wide COD</span>
              </div>
            </div>
          </div>

          {/* Right: Product Details & WhatsApp Order */}
          <div className="p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              {/* Category & Stock pill */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-[#4A5D43] uppercase tracking-widest flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#4A5D43]" />
                  {product.categoryName || "Home Décor"}
                </span>

                {isOutOfStock && (
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Out of Stock
                  </span>
                )}
                {!isOutOfStock && product.stockStatus === "in_stock" && (
                  <span className="text-[10px] font-medium text-[#1A1816] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E3DACD] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#4A5D43]" /> In Stock ({product.stockQuantity} available)
                  </span>
                )}
                {!isOutOfStock && product.stockStatus === "low_stock" && (
                  <span className="text-[10px] font-medium text-[#1F1F1F] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E3DACD] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#B8976C]" /> Low Stock ({product.stockQuantity} remaining)
                  </span>
                )}
                {!isOutOfStock && product.stockStatus === "made_to_order" && (
                  <span className="text-[10px] font-medium text-[#4A5D43] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E3DACD] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#4A5D43]" /> Custom Order
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1A1816] tracking-tight leading-snug">
                {product.name}
              </h2>

              {/* Customer Rating & Testimonials Jump Link */}
              {ratingSummary.totalReviews > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("customer-reviews-section");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="inline-flex items-center gap-2 mt-2 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= Math.round(ratingSummary.averageRating)
                              ? "fill-[#B8976C] text-[#B8976C]"
                              : "fill-transparent text-[#E3DACD]"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#1A1816] font-mono ml-0.5">
                      {ratingSummary.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-[#555555] group-hover:text-[#4A5D43] group-hover:underline transition-colors font-medium">
                    ({ratingSummary.totalReviews} {ratingSummary.totalReviews === 1 ? "review" : "reviews"}) • View customer reviews ↓
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("customer-reviews-section");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#666666] hover:text-[#4A5D43] transition-colors cursor-pointer text-left"
                >
                  <Star className="w-3.5 h-3.5 text-[#B8976C]" />
                  <span>No reviews yet • Be the first to review this piece ↓</span>
                </button>
              )}

              {/* Pricing */}
              <div className="flex flex-wrap items-baseline gap-3 my-4">
                <span className="text-2xl sm:text-3xl font-bold text-[#1A1816] font-mono">
                  Rs. {discountInfo.salePrice.toLocaleString()}
                </span>
                {discountInfo.hasDiscount && (
                  <>
                    <span className="text-base text-[#555555] line-through font-mono font-medium">
                      Rs. {discountInfo.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-[#4A5D43] bg-[#FAF8F5] px-2.5 py-0.5 rounded-md border border-[#E3DACD]">
                      Save Rs. {discountInfo.discountAmount.toLocaleString()} ({discountInfo.discountPercentage}% OFF)
                    </span>
                  </>
                )}
                <span className="text-xs font-semibold text-[#555555] bg-[#FAF8F5] px-2.5 py-0.5 rounded-md border border-[#E3DACD] tracking-wide ml-auto">
                  PKR
                </span>
              </div>

              {/* Description */}
              <div className="prose prose-sm text-[#1F1F1F] mb-6 font-normal">
                <p className="leading-relaxed">{product.description}</p>
              </div>

              {/* Detailed Specifications Box */}
              {(product.details?.dimensions ||
                product.details?.material ||
                product.details?.finishColor ||
                product.details?.origin ||
                product.details?.careInstructions) && (
                <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E3DACD] mb-6 text-xs space-y-2">
                  <h4 className="font-display font-semibold text-[#1A1816] tracking-wider text-xs mb-2 border-b border-[#E3DACD] pb-1.5">
                    Product Specifications
                  </h4>
                  {product.details.material && (
                    <div className="flex justify-between">
                      <span className="text-[#1F1F1F] font-medium">Material:</span>
                      <span className="font-semibold text-[#1A1816]">{product.details.material}</span>
                    </div>
                  )}
                  {product.details.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-[#1F1F1F] font-medium">Dimensions:</span>
                      <span className="font-semibold text-[#1A1816]">{product.details.dimensions}</span>
                    </div>
                  )}
                  {product.details.finishColor && (
                    <div className="flex justify-between">
                      <span className="text-[#1F1F1F] font-medium">Color / Finish:</span>
                      <span className="font-semibold text-[#1A1816]">{product.details.finishColor}</span>
                    </div>
                  )}
                  {product.details.origin && (
                    <div className="flex justify-between">
                      <span className="text-[#1F1F1F] font-medium">Craftsmanship Origin:</span>
                      <span className="font-semibold text-[#1A1816]">{product.details.origin}</span>
                    </div>
                  )}
                  {product.details.careInstructions && (
                    <div className="flex justify-between">
                      <span className="text-[#1F1F1F] font-medium">Care Guide:</span>
                      <span className="font-semibold text-[#1A1816]">{product.details.careInstructions}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Design / Variant Selection (Shown whenever product has 2 or more designs/variants) */}
              {designs.length > 1 && !isOutOfStock && (
                <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E3DACD] mb-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#4A5D43]" />
                      <span className="text-xs font-bold text-[#1A1816]">
                        Choose Design / Variant ({designs.length} available):
                      </span>
                    </div>
                    {selectedDesign && (
                      <span className="text-xs font-bold text-[#4A5D43] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ {selectedDesign.name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {designs.map((design, idx) => {
                      const isSelected = selectedDesign?.id === design.id;
                      return (
                        <button
                          key={design.id}
                          type="button"
                          onClick={() => {
                            setSelectedDesignId(design.id);
                            setSelectedImageIndex(idx);
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white border-[#4A5D43] ring-2 ring-[#4A5D43]/20 shadow-xs scale-101"
                              : "bg-white/70 border-[#E3DACD] hover:border-[#4A5D43]/40 hover:bg-white"
                          }`}
                        >
                          <img
                            src={design.image || images[idx] || ""}
                            alt={design.name}
                            className="w-10 h-10 rounded-lg object-cover bg-white shrink-0 border border-[#E3DACD]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span
                              className={`block text-xs font-bold truncate ${
                                isSelected ? "text-[#1A1816]" : "text-[#555555]"
                              }`}
                            >
                              {design.name}
                            </span>
                            <span
                              className={`block text-[10px] font-medium ${
                                isSelected ? "text-[#4A5D43]" : "text-[#888888]"
                              }`}
                            >
                              {isSelected ? "Selected ✓" : "Click to select"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector or Out of Stock Notice */}
              {isOutOfStock ? (
                <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E3DACD] mb-4 flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-stone-200 text-stone-600 border border-stone-300 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-stone-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1816]">Currently Out of Stock</h4>
                    <p className="text-[11px] text-[#555555] mt-0.5">
                      This item is sold out. Direct ordering is temporarily disabled. You can call the shop to check restock availability.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Quantity Selector & Live Total */}
                  <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#E3DACD] mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#1F1F1F] font-semibold block">Select Quantity:</span>
                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-[#E3DACD] text-[#1A1816] hover:bg-[#FAF8F5] flex items-center justify-center font-bold transition cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-base font-bold text-[#1A1816] w-8 text-center font-mono">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-[#E3DACD] text-[#1A1816] hover:bg-[#FAF8F5] flex items-center justify-center font-bold transition cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#1F1F1F] font-medium block">Total Price:</span>
                      <span className="text-lg sm:text-xl font-bold text-[#1A1816] font-mono">
                        Rs. {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Optional Custom Note / City */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Delivery City / Address (e.g. Lahore, Islamabad)..."
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#E3DACD] rounded-xl focus:outline-none focus:border-[#4A5D43] focus:bg-white text-[#1A1816] placeholder-[#666666] transition-colors"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Ordering Actions */}
            <div className="space-y-2.5 pt-3 border-t border-[#E3DACD]">
              {isOutOfStock ? (
                <>
                  {/* Disabled WhatsApp Order Button */}
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-3.5 px-4 bg-stone-200 text-stone-500 border border-stone-300 rounded-xl font-semibold tracking-wide text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-not-allowed select-none text-center shadow-none"
                    title="Out of Stock - Ordering Disabled"
                  >
                    <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>Out of Stock — Ordering Disabled</span>
                  </button>

                  {/* Disabled Add to Cart Button */}
                  {onAddToCart && (
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="w-full py-2.5 px-4 bg-stone-100 text-stone-400 border border-stone-200 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none"
                      title="Out of Stock - Cannot Add to Cart"
                    >
                      <ShoppingBag className="w-4 h-4 text-stone-400" />
                      <span>Add to Cart (Unavailable)</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* WhatsApp Order Button */}
                  <a
                    href={createProductWhatsAppUrl(
                      product,
                      settings.whatsapp || ORDER_WHATSAPP_NUMBER,
                      quantity,
                      customerNote,
                      selectedDesign
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      logWhatsAppInquiry({
                        productId: product.id,
                        productName: product.name,
                        productPrice: product.price,
                        quantity,
                        customerNote,
                        selectedDesignId: selectedDesign?.id,
                        selectedDesignName: selectedDesign?.name,
                        selectedDesignImage: selectedDesign?.image
                      });
                    }}
                    className="w-full py-3.5 px-3 sm:px-4 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl font-medium tracking-wide text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-center leading-snug break-words"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>
                      Order {selectedDesign ? selectedDesign.name : ""} on WhatsApp (Rs. {totalAmount.toLocaleString()})
                    </span>
                  </a>

                  {/* Add to Cart Button */}
                  {onAddToCart && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(product, quantity, selectedDesign);
                      }}
                      className="w-full py-2.5 px-3 sm:px-4 bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#1A1816] border border-[#E3DACD] rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer text-center leading-snug break-words"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#1A1816] shrink-0" />
                      <span>
                        Add {selectedDesign ? selectedDesign.name : ""} to Cart ({quantity})
                      </span>
                    </button>
                  )}
                </>
              )}

              {/* Secondary Call Shop Option */}
              <div className="flex items-center justify-between text-xs text-[#1F1F1F] pt-1">
                <a
                  href={`tel:${(settings.phone || "03049088810").replace(/\s+/g, "")}`}
                  className="hover:text-[#4A5D43] flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-[#4A5D43]" />
                  <span>Call Shop: {settings.phone || "0304 9088810"}</span>
                </a>
                <span className="font-medium">{settings.location || "Thanan Market, Khushab"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Customer Reviews & Ratings Section */}
        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          onRatingSummaryChange={setRatingSummary}
        />
      </div>
    </div>
  );
};
