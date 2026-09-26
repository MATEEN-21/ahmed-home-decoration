import React from "react";
import { Category, Product } from "../../types";
import { ArrowRight, Layers, Sparkles } from "lucide-react";

interface CategoryShowcaseProps {
  categories: Category[];
  products?: Product[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  categories = [],
  products = [],
  selectedCategoryId,
  onSelectCategory,
}) => {
  // Only display a category if it currently has at least 1 active product
  const visibleCategories = React.useMemo(() => {
    return (categories || []).filter((cat) => {
      if (!cat || cat.active === false) return false;
      const count = (products || []).filter(
        (p) => p && p.categoryId === cat.id && p.active !== false
      ).length;
      return count > 0;
    });
  }, [categories, products]);

  // If there are no categories with active products, completely hide this section
  if (!visibleCategories || visibleCategories.length === 0) return null;

  return (
    <section id="categories" className="bg-[#F2ECE4] py-14 sm:py-20 border-b border-[#E3DACD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E3DACD] text-[#4A5D43] text-[11px] font-semibold uppercase tracking-widest mb-3 shadow-xs">
              <Layers className="w-3.5 h-3.5 text-[#4A5D43]" />
              <span>Curated Collections</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1816] tracking-tight">
              Popular Categories
            </h2>
            <p className="text-[#1F1F1F] text-sm sm:text-base mt-2 max-w-xl font-normal">
              Explore authentic Pakistani metal wall art, luxury clocks, ambient lanterns, and decorative accents.
            </p>
          </div>

          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="text-xs font-medium text-white bg-[#4A5D43] hover:bg-[#3B4A35] px-4 py-2 rounded-xl self-start sm:self-auto cursor-pointer transition-colors shadow-xs"
            >
              Clear Category Filter & View All
            </button>
          )}
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
          {visibleCategories.map((cat) => {
            const productCount = (products || []).filter((p) => p && p.categoryId === cat.id && p.active !== false).length;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 bg-white border ${
                  isSelected
                    ? "ring-2 ring-[#4A5D43] border-[#4A5D43] shadow-md"
                    : "border-[#E3DACD] hover:border-[#4A5D43]/80 hover:shadow-md"
                }`}
              >
                {/* Category Image */}
                <div className="aspect-4/3 w-full overflow-hidden bg-[#FAF8F5] relative">
                  <img
                    src={cat.image || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-medium text-[#1A1816] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#E3DACD] shadow-2xs">
                    {productCount} {productCount === 1 ? "Product" : "Products"}
                  </span>
                </div>

                {/* Category Name & Action */}
                <div className="p-3 sm:p-3.5 bg-white">
                  <h3 className="font-display text-sm sm:text-base font-semibold text-[#1A1816] group-hover:text-[#4A5D43] transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E3DACD] text-xs text-[#1F1F1F]">
                    <span className="group-hover:text-[#4A5D43] font-semibold transition-colors text-[11px]">
                      Explore
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-[#4A5D43] text-[#1F1F1F] transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
