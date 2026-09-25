import React from "react";
import { PublicDataResponse, Product, ProductDesign } from "../../types";
import { ProductCatalog } from "./ProductCatalog";
import { ORDER_WHATSAPP_NUMBER } from "../../lib/whatsapp";

interface ProductsPageProps {
  data: PublicDataResponse;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenDetails: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number, selectedDesign?: ProductDesign) => void;
  onNavigate: (path: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  data,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenDetails,
  onAddToCart,
  onNavigate,
}) => {
  const shopPhone = data.settings.whatsapp || ORDER_WHATSAPP_NUMBER;

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* Top Breadcrumb & Page Banner */}
      <div className="bg-gradient-to-b from-[#F2ECE4] to-[#FAF8F5] py-6 sm:py-8 border-b border-[#E3DACD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-[#555555]">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="hover:text-[#4A5D43] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="font-semibold text-[#1A1816]">Products</span>
            {selectedCategoryId && (
              <>
                <span>/</span>
                <span className="text-[#4A5D43] font-medium">
                  {data.categories.find((c) => c.id === selectedCategoryId)?.name || "Filtered Category"}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Full Live Product Catalog */}
      <ProductCatalog
        products={data.products}
        categories={data.categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={onSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        shopPhone={shopPhone}
        reviewsSummary={data.reviewsSummary}
        onOpenDetails={onOpenDetails}
        onAddToCart={onAddToCart}
      />
    </div>
  );
};
