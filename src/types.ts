export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  userName: string;
  userCity?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  status: 'pending' | 'approved' | 'hidden';
  verifiedPurchase?: boolean;
  recommended?: boolean;
  createdAt: string; // ISO string
  helpfulCount?: number;
}

export interface ProductRatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recommendPercentage: number;
}

export interface ProductDesign {
  id: string; // e.g. "design-1", "design-2", "var-123"
  name: string; // e.g. "Design 1", "Design 2", "Waterfall Scenery"
  image?: string; // photo URL for this design
  price?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';
}

export type ProductVariant = ProductDesign;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  oldPrice?: number | null;
  discountPercentage?: number;
  categoryId: string;
  categoryName?: string;
  images: string[];
  designs?: ProductDesign[];
  variants?: ProductDesign[];
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'made_to_order';
  stockQuantity: number;
  featured: boolean;
  badge?: string; // e.g. "Best Seller", "New Arrival", "Handcrafted", "Hot Deal", "Premium"
  details: {
    material?: string;
    dimensions?: string;
    finishColor?: string;
    origin?: string;
    careInstructions?: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  order: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  whatsappText?: string;
  active: boolean;
  order: number;
}

export interface CartItem {
  id: string; // Unique cart item identifier (e.g. `${product.id}__${selectedDesign?.id || 'default'}`)
  product: Product;
  quantity: number;
  selectedDesign?: ProductDesign;
}

export interface SiteSettings {
  shopName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  googleMapsUrl: string;
  googleMapsEmbed: string;
  announcement: {
    enabled: boolean;
    text: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  deliveryNote: string;
  currency: string;
}

export interface OrderInquiry {
  id: string;
  productId: string;
  productName: string;
  selectedDesignId?: string;
  selectedDesignName?: string;
  selectedDesignImage?: string;
  productPrice: number;
  quantity: number;
  totalPrice: number;
  customerNote?: string;
  timestamp: string;
  status: 'whatsapp_opened' | 'confirmed' | 'dispatched' | 'cancelled';
}

export type WhatsAppInquiry = OrderInquiry;

export interface PublicDataResponse {
  settings: SiteSettings;
  slides: HeroSlide[];
  categories: Category[];
  products: Product[];
  reviewsSummary?: Record<string, { averageRating: number; totalReviews: number }>;
}

export interface AdminAllDataResponse {
  settings: SiteSettings;
  slides: HeroSlide[];
  categories: Category[];
  products: Product[];
  inquiries: OrderInquiry[];
  reviews?: ProductReview[];
  adminEmail: string;
  admin?: {
    email: string;
  };
}

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  createdAt?: string;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  file?: MediaItem;
}
