import React from "react";
import { PublicDataResponse, Product, ProductDesign } from "../../types";
import { HeroSlider } from "./HeroSlider";
import { CategoryShowcase } from "./CategoryShowcase";
import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { ORDER_WHATSAPP_NUMBER } from "../../lib/whatsapp";

interface HomePageProps {
  data: PublicDataResponse;
  onNavigate: (path: string) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onOpenDetails: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number, selectedDesign?: ProductDesign) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  data,
  onNavigate,
  onSelectCategory,
  onOpenDetails,
  onAddToCart,
}) => {
  const shopPhone = data.settings.whatsapp || ORDER_WHATSAPP_NUMBER;

  return (
    <div className="bg-[#FAF8F5]">
      {/* Top Hero Banner Slider & Clean Feature Strip */}
      <HeroSlider
        slides={data.slides}
        shopPhone={shopPhone}
        onExploreClick={() => onNavigate("/products")}
        onActionClick={(link) => {
          if (link && link.startsWith("/")) {
            onNavigate(link);
          } else {
            onNavigate("/products");
          }
        }}
      />

      {/* Featured Category Showcase */}
      <CategoryShowcase
        categories={data.categories}
        products={data.products}
        selectedCategoryId={null}
        onSelectCategory={(categoryId) => {
          onSelectCategory(categoryId);
          onNavigate("/products");
        }}
      />

      {/* Curated Highlights Section */}
      <FeaturedProductsSection
        products={data.products}
        shopPhone={shopPhone}
        reviewsSummary={data.reviewsSummary}
        onOpenDetails={onOpenDetails}
        onAddToCart={onAddToCart}
        onViewAllProducts={() => onNavigate("/products")}
      />
    </div>
  );
};
