import React, { useState, useMemo } from "react";
import { Product, Category, ProductDesign } from "../../types";
import { ProductCard } from "./ProductCard";
import { Search, Filter, SlidersHorizontal, Sparkles, AlertCircle } from "lucide-react";

interface ProductCatalogProps {
  products?: Product[];
  categories?: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
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
  searchQuery,
  onSearchChange,
  shopPhone,
  reviewsSummary,
  onOpenDetails,
  onAddToCart,
}) => {
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter((p) => {
        // Active filter
        if (!p.active) return false;

        // Category filter
        if (selectedCategoryId && p.categoryId !== selectedCategoryId) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesDesc = p.description.toLowerCase().includes(q);
          const matchesCat = (p.categoryName || "").toLowerCase().includes(q);
          const matchesBadge = (p.badge || "").toLowerCase().includes(q);
          if (!matchesName && !matchesDesc && !matchesCat && !matchesBadge) {
            return false;
          }
        }

        // Stock filter
        if (stockFilter === "in_stock" && p.stockStatus !== "in_stock") {
          return false;
        }
        if (stockFilter === "low_stock" && p.stockStatus !== "low_stock") {
          return false;
        }
        if (stockFilter === "out_of_stock" && p.stockStatus !== "out_of_stock") {
          return false;
        }

        // Featured toggle
        if (featuredOnly && !p.featured) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") {
          return a.price - b.price;
        }
        if (sortBy === "price_desc") {
          return b.price - a.price;
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Default: featured first, then by date
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [products, selectedCategoryId, searchQuery, stockFilter, featuredOnly, sortBy]);

  const resetFilters = () => {
    onSelectCategory(null);
    onSearchChange("");
    setStockFilter("all");
    setFeaturedOnly(false);
    setSortBy("featured");
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId);

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

        {/* Filter and Control Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3DACD] shadow-xs mb-10 space-y-4">
          {/* Top row: search & category pills */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#1F1F1F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products by title, metal, wood, clock..."
                className="w-full pl-10 pr-14 py-2.5 bg-[#FAF8F5] border border-[#E3DACD] rounded-xl text-xs sm:text-sm text-[#1F1F1F] placeholder-[#666666] focus:outline-none focus:border-[#4A5D43] focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#1F1F1F] hover:text-[#111111] font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort & Stock dropdowns */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Featured toggle chip */}
              <button
                type="button"
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={`px-3 py-2 sm:px-3.5 rounded-xl text-xs font-medium tracking-wide transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  featuredOnly
                    ? "bg-[#4A5D43] text-white shadow-xs"
                    : "bg-[#FAF8F5] text-[#1F1F1F] border border-[#E3DACD] hover:bg-[#F2ECE4]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Only</span>
              </button>

              {/* Stock Filter */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] rounded-xl px-2.5 sm:px-3 py-2 border border-[#E3DACD] max-w-full">
                <Filter className="w-3.5 h-3.5 text-[#1F1F1F] shrink-0" />
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-[#1A1816] focus:outline-none cursor-pointer max-w-full"
                >
                  <option value="all">All Availability</option>
                  <option value="in_stock">In Stock Only</option>
                  <option value="low_stock">Low Stock Only</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] rounded-xl px-2.5 sm:px-3 py-2 border border-[#E3DACD] max-w-full">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#1F1F1F] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-medium text-[#1A1816] focus:outline-none cursor-pointer max-w-full"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="newest">Sort: Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Horizontal Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none border-t border-[#E3DACD] max-w-full">
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
            {(categories || []).map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              const count = (products || []).filter((p) => p && p.categoryId === cat.id && p.active).length;
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
              No products matched your selection
            </h3>
            <p className="text-[#1F1F1F] text-sm mb-6 font-normal">
              We couldn't find any home decor item matching your current search or category filter. Try clearing filters or searching for another keyword.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2.5 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl text-xs sm:text-sm font-medium tracking-wide transition-colors cursor-pointer shadow-xs"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
