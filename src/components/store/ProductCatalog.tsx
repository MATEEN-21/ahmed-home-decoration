import React, { useMemo, useEffect } from "react";
import { Product, Category, ProductDesign } from "../../types";
import { ProductCard } from "./ProductCard";
import { Sparkles, AlertCircle } from "lucide-react";

interface ProductCatalogProps {
  products?: Product[];
  categories?: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  shopPhone: string;
  reviewsSummary?: Record<string, { averageRating: number; totalReviews: number }>;
  onOpenDetails: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number, selectedDesign?: ProductDesign) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products = [],
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  shopPhone,
  reviewsSummary,
  onOpenDetails,
  onAddToCart,
}) => {
  // Filter products strictly by active status and selected category
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      // Active filter
      if (!p.active) return false;

      // Category filter
      if (selectedCategoryId && p.categoryId !== selectedCategoryId) {
        return false;
      }

      return true;
    });
  }, [products, selectedCategoryId]);

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId);

  // Only categories with at least 1 active product are shown in filter chips
  const activeCategories = useMemo(() => {
    return (categories || []).filter((cat) => {
      if (!cat || cat.active === false) return false;
      const count = (products || []).filter(
        (p) => p && p.categoryId === cat.id && p.active !== false
      ).length;
      return count > 0;
    });
  }, [categories, products]);

  // If a category was selected that no longer has any active products, reset to All Products
  useEffect(() => {
    if (selectedCategoryId) {
      const hasActiveProducts = activeCategories.some((c) => c.id === selectedCategoryId);
      if (!hasActiveProducts) {
        onSelectCategory(null);
      }
    }
  }, [selectedCategoryId, activeCategories, onSelectCategory]);

  return (
    <section id="products" className="bg-[#FAF8F5] py-14 sm:py-20 border-b border-[#E3DACD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E3DACD] text-[#4A5D43] text-[11px] font-semibold uppercase tracking-widest mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#4A5D43]" />
              <span>Handcrafted Elegance</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1816] tracking-tight">
              {selectedCategoryObj ? selectedCategoryObj.name : "Featured Décor & Full Catalog"}
            </h2>
            <p className="text-[#1F1F1F] text-sm sm:text-base mt-2 max-w-xl font-normal">
              {selectedCategoryObj
                ? selectedCategoryObj.description
                : "Discover our latest Islamic wall art, custom calligraphy, clocks, mirrors, and home styling pieces."}
            </p>
          </div>

          <div className="text-xs font-semibold text-[#1F1F1F] bg-white px-4 py-2 rounded-xl border border-[#E3DACD] self-start md:self-auto shadow-xs">
            Showing <span className="font-bold text-[#1A1816]">{filteredProducts.length}</span> of{" "}
            <span className="font-bold text-[#1A1816]">{products.length}</span> items
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#E3DACD] shadow-xs mb-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none max-w-full">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategoryId === null
                  ? "bg-[#4A5D43] text-white"
                  : "bg-[#FAF8F5] text-[#1F1F1F] hover:bg-[#F2ECE4] border border-[#E3DACD]"
              }`}
            >
              All Products ({(products || []).length})
            </button>
            {activeCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const count = (products || []).filter((p) => p && p.categoryId === cat.id && p.active !== false).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? "bg-[#4A5D43] text-white"
                      : "bg-[#FAF8F5] text-[#1F1F1F] hover:bg-[#F2ECE4] border border-[#E3DACD]"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
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
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E3DACD] shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F5] text-[#4A5D43] flex items-center justify-center mx-auto mb-4 border border-[#E3DACD]">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-normal text-[#1A1816] mb-2">
              No products found in this category
            </h3>
            <p className="text-[#1F1F1F] text-sm mb-6 font-normal">
              We currently don't have any items listed under this category. View all products to explore our complete collection.
            </p>
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="px-6 py-2.5 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl text-xs sm:text-sm font-medium tracking-wide transition-colors cursor-pointer shadow-xs"
            >
              View All Products
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
