import React from "react";
import { Product, ProductDesign } from "../../types";
import { ProductCard } from "./ProductCard";
import { ArrowRight, Sparkles } from "lucide-react";

interface FeaturedProductsSectionProps {
  products: Product[];
  shopPhone: string;
  reviewsSummary?: Record<string, { averageRating: number; totalReviews: number }>;
  onOpenDetails: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number, selectedDesign?: ProductDesign) => void;
  onViewAllProducts: () => void;
}

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  products = [],
  shopPhone,
  reviewsSummary,
  onOpenDetails,
  onAddToCart,
  onViewAllProducts,
}) => {
  const activeProducts = products.filter((p) => p.active);
  const featured = activeProducts.filter((p) => p.featured);
  const displayProducts = (featured.length > 0 ? featured : activeProducts).slice(0, 8);

  if (displayProducts.length === 0) return null;

  return (
    <section className="bg-[#FAF8F5] py-14 sm:py-20 border-b border-[#E3DACD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E3DACD] text-[#4A5D43] text-[11px] font-semibold uppercase tracking-widest mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#4A5D43]" />
              <span>Curated Highlights</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1816] tracking-tight">
              Featured Décor Pieces
            </h2>
            <p className="text-[#1F1F1F] text-sm sm:text-base mt-2 max-w-xl font-normal">
              Explore our most popular Islamic calligraphy wall art, luxury clocks, and ambient home styling pieces.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAllProducts}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-[#4A5D43] hover:bg-[#3B4A35] px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs self-start sm:self-auto"
          >
            <span>Explore Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              shopPhone={shopPhone}
              reviewSummary={reviewsSummary?.[product.id]}
              onOpenDetails={onOpenDetails}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={onViewAllProducts}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1816] bg-white hover:bg-[#F2ECE4] border border-[#E3DACD] hover:border-[#4A5D43] px-7 py-3.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <span>View All Products in Catalog ({activeProducts.length})</span>
            <ArrowRight className="w-4 h-4 text-[#4A5D43]" />
          </button>
        </div>
      </div>
    </section>
  );
};
