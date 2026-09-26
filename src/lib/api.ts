import {
  Product,
  Category,
  HeroSlide,
  SiteSettings,
  PublicDataResponse,
  AdminAllDataResponse,
  UploadResponse,
  MediaItem,
  ProductReview,
  ProductRatingSummary
} from "../types";
import staticDb from "../data/storeDb.json";

const TOKEN_KEY = "ahmed_decor_admin_token";
const CUSTOM_PRODUCTS_KEY = "ahmed_decor_custom_products";
const CUSTOM_CATEGORIES_KEY = "ahmed_decor_custom_categories";

// Clear any stale legacy custom products/categories cache from localStorage
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem(CUSTOM_PRODUCTS_KEY);
    localStorage.removeItem(CUSTOM_CATEGORIES_KEY);
  } catch {}
}

export function getLocalCustomProducts(): Product[] {
  return [];
}

export function saveLocalCustomProduct(_product: Product) {
  // Products are persisted directly to the server database
}

export function removeLocalCustomProduct(_productId: string) {
  // Products are removed directly from the server database
}

export async function syncProductsWithServer(_products: Product[]): Promise<void> {
  // Deprecated: server db.json is the single source of truth
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === "null" || token === "undefined" || token === '""' || !token.trim()) {
    return null;
  }
  return token.trim();
}

export function setAdminToken(token: string) {
  if (typeof window === "undefined") return;
  if (!token || token === "null" || token === "undefined" || !token.trim()) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token.trim());
  }
}

export function removeAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// Helper for authorized fetch
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAdminToken();
  if (!token) {
    removeAdminToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("admin_unauthorized", {
          detail: "Admin session is required."
        })
      );
    }
    const err = new Error("Admin authentication required. Please sign in.");
    (err as any).status = 401;
    throw err;
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      removeAdminToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("admin_unauthorized", {
            detail: data.error || "Unauthorized. Session expired or invalid."
          })
        );
      }
    }
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// Direct File Upload Helper: converts browser File to base64 and uploads to backend
export async function uploadFile(file: File): Promise<string> {
  const mediaItem = await uploadMediaItem(file);
  return mediaItem.url;
}

export async function uploadMediaItem(file: File): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    // Validate file size (50MB for video, 10MB for photos)
    const isVideo =
      file.type.startsWith("video/") ||
      file.name.toLowerCase().endsWith(".mp4") ||
      file.name.toLowerCase().endsWith(".webm");
    const maxAllowed = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxAllowed) {
      return reject(
        new Error(`File size exceeds limit (${isVideo ? "50MB for videos" : "10MB for photos"}).`)
      );
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res: UploadResponse = await authFetch("/api/upload", {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
            base64
          })
        });

        if (res.success && res.url) {
          const item: MediaItem = res.file || {
            id: `media-${Date.now()}`,
            url: res.url,
            filename: res.filename || res.url.split("/").pop() || file.name,
            originalName: file.name,
            mimeType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
            size: res.size || file.size,
            createdAt: new Date().toISOString()
          };
          resolve(item);
        } else {
          reject(new Error("Upload failed to return a file URL."));
        }
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read the file from your computer."));
    reader.readAsDataURL(file);
  });
}

// Public API & Local JSON Fallback Helpers
export function extractPublicDataFromDb(raw: any): PublicDataResponse {
  const db = raw || {};
  const settings: SiteSettings = { ...(db.settings || {}) };
  // Sanitize admin email from storefront public settings
  if (
    settings.email &&
    (settings.email.toLowerCase().includes("tayyabmateen") || settings.email.toLowerCase().includes("admin"))
  ) {
    settings.email = "";
  }

  const allReviews: ProductReview[] = Array.isArray(db.reviews) ? db.reviews : [];
  const approvedReviews = allReviews.filter((r) => r.status === "approved");
  const reviewsSummary: Record<string, { averageRating: number; totalReviews: number }> = {};

  for (const r of approvedReviews) {
    if (!reviewsSummary[r.productId]) {
      reviewsSummary[r.productId] = { averageRating: 0, totalReviews: 0 };
    }
  }

  for (const pId of Object.keys(reviewsSummary)) {
    const list = approvedReviews.filter((r) => r.productId === pId);
    const sum = list.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0);
    reviewsSummary[pId] = {
      totalReviews: list.length,
      averageRating: list.length > 0 ? Number((sum / list.length).toFixed(1)) : 0
    };
  }

  const slides: HeroSlide[] = (db.slides || [])
    .filter((s: any) => s.active !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const products: Product[] = (db.products || [])
    .filter((p: any) => p.active !== false)
    .map((p: any) => {
      const price = Number(p.price) || 0;
      const originalPrice = p.originalPrice ? Number(p.originalPrice) : p.oldPrice ? Number(p.oldPrice) : price;
      const discountPercentage = typeof p.discountPercentage === "number"
        ? p.discountPercentage
        : originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
      return {
        ...p,
        price,
        originalPrice,
        oldPrice: discountPercentage > 0 ? originalPrice : null,
        discountPercentage
      };
    });

  const categoryIdsWithActiveProducts = new Set(
    products.map((p) => p.categoryId).filter(Boolean)
  );

  const categories: Category[] = (db.categories || [])
    .filter((c: any) => c.active !== false && categoryIdsWithActiveProducts.has(c.id))
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return {
    settings,
    slides,
    categories,
    products,
    reviewsSummary
  };
}

export function getLocalFallbackData(): PublicDataResponse {
  try {
    return extractPublicDataFromDb(staticDb);
  } catch (err) {
    console.warn("Failed to extract local fallback data:", err);
    return {
      settings: {} as any,
      slides: [],
      categories: [],
      products: [],
      reviewsSummary: {}
    };
  }
}

export async function fetchPublicData(): Promise<PublicDataResponse> {
  let data: PublicDataResponse | null = null;

  // 1. Fetch dynamic data from live server API (single source of truth)
  try {
    const res = await fetch("/api/public/data");
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const json = await res.json();
      if (json && Array.isArray(json.products)) {
        data = json;
      }
    }
  } catch (err) {
    console.warn("Server API /api/public/data unavailable:", err);
  }

  // 2. Guaranteed fallback only if server was completely unreachable
  if (!data || !Array.isArray(data.products)) {
    data = getLocalFallbackData();
  }

  // Filter storefront categories strictly to those that currently have at least 1 active product
  if (data && Array.isArray(data.products)) {
    const activeCategoryIds = new Set(
      data.products.filter((p) => p && p.active !== false).map((p) => p.categoryId).filter(Boolean)
    );
    data.categories = (data.categories || []).filter(
      (c) => c && c.active !== false && activeCategoryIds.has(c.id)
    );
  }

  return data;
}

export async function logWhatsAppInquiry(payload: {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  customerNote?: string;
  selectedDesignId?: string;
  selectedDesignName?: string;
  selectedDesignImage?: string;
}) {
  try {
    await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn("Failed to log WhatsApp click", e);
  }
}

// Admin Auth
export async function adminLogin(email: string, password: string) {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Login failed.");
  }
  setAdminToken(data.token);
  return data;
}

export async function verifyAdmin(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch("/api/admin/verify", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!res.ok) {
      removeAdminToken();
      return false;
    }
    const data = await res.json().catch(() => ({}));
    return Boolean(data.success);
  } catch {
    removeAdminToken();
    return false;
  }
}

export async function adminLogout() {
  const token = getAdminToken();
  removeAdminToken();
  if (typeof window !== "undefined") {
    localStorage.removeItem("ahmed_admin_email");
  }
  if (token) {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
    } catch {
      // Ignore network errors during client logout
    }
  }
}

export async function changeAdminCredentials(payload: {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}) {
  return authFetch("/api/admin/change-credentials", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// Admin All Data
export async function fetchAdminAllData(): Promise<AdminAllDataResponse> {
  const data: AdminAllDataResponse = await authFetch("/api/admin/all-data");
  return data;
}

// Admin Product CRUD
export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const res = await authFetch("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(productData)
  });
  if (res.product) {
    saveLocalCustomProduct(res.product);
  }
  return res.product;
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
  const res = await authFetch(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData)
  });
  if (res.product) {
    saveLocalCustomProduct(res.product);
  }
  return res.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await authFetch(`/api/admin/products/${id}`, {
    method: "DELETE"
  });
  removeLocalCustomProduct(id);
}

// Admin Category CRUD
export async function createCategory(catData: Partial<Category>): Promise<Category> {
  const res = await authFetch("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(catData)
  });
  return res.category;
}

export async function updateCategory(id: string, catData: Partial<Category>): Promise<Category> {
  const res = await authFetch(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(catData)
  });
  return res.category;
}

export async function deleteCategory(id: string, force: boolean = false): Promise<void> {
  await authFetch(`/api/admin/categories/${id}?force=${force ? "true" : "false"}`, {
    method: "DELETE"
  });
}

// Admin Slide CRUD
export async function createSlide(slideData: Partial<HeroSlide>): Promise<HeroSlide> {
  const res = await authFetch("/api/admin/slides", {
    method: "POST",
    body: JSON.stringify(slideData)
  });
  return res.slide;
}

export async function updateSlide(id: string, slideData: Partial<HeroSlide>): Promise<HeroSlide> {
  const res = await authFetch(`/api/admin/slides/${id}`, {
    method: "PUT",
    body: JSON.stringify(slideData)
  });
  return res.slide;
}

export async function deleteSlide(id: string): Promise<void> {
  await authFetch(`/api/admin/slides/${id}`, {
    method: "DELETE"
  });
}

export async function reorderSlides(slideIds: string[]): Promise<HeroSlide[]> {
  const res = await authFetch("/api/admin/slides/reorder", {
    method: "PUT",
    body: JSON.stringify({ slideIds })
  });
  return res.slides;
}

// Admin Settings
export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const res = await authFetch("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings)
  });
  return res.settings;
}

export const getAuthToken = getAdminToken;
export const setAuthToken = setAdminToken;
export const logoutAdmin = adminLogout;
export const uploadDirectFile = uploadFile;
export const updateAdminCredentials = changeAdminCredentials;

// Admin Inquiries
export async function deleteInquiry(id: string): Promise<void> {
  await authFetch(`/api/admin/inquiries/${id}`, {
    method: "DELETE"
  });
}

export async function clearAllInquiries(): Promise<void> {
  await authFetch("/api/admin/inquiries", {
    method: "DELETE"
  });
}

// Media Management
export async function listMediaFiles(): Promise<{ files: string[]; items: MediaItem[] }> {
  const data = await authFetch("/api/admin/media");
  const files: string[] = data.files || [];
  const items: MediaItem[] = Array.isArray(data.items)
    ? data.items
    : files.map((url, idx) => {
        const filename = url.split("/").pop() || "";
        const isVideo = url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".webm");
        return {
          id: `media-${idx}`,
          url,
          filename,
          originalName: filename,
          mimeType: isVideo ? "video/mp4" : "image/jpeg",
          size: 0,
          createdAt: new Date().toISOString()
        };
      });
  return { files, items };
}

export async function deleteMediaFile(filename: string): Promise<{ success: boolean; message?: string }> {
  const cleanName = filename.split("/").pop()?.split("?")[0] || filename;
  try {
    return await authFetch(`/api/admin/media/${encodeURIComponent(cleanName)}`, {
      method: "DELETE"
    });
  } catch (err) {
    // Fallback to POST /api/admin/media/delete if DELETE method is blocked by a proxy
    return await authFetch("/api/admin/media/delete", {
      method: "POST",
      body: JSON.stringify({ filename: cleanName })
    });
  }
}

// ==========================================
// Customer Reviews API
// ==========================================

export async function fetchProductReviews(productId: string): Promise<{
  reviews: ProductReview[];
  summary: ProductRatingSummary;
}> {
  try {
    const res = await fetch(`/api/products/${productId}/reviews`);
    if (!res.ok) {
      throw new Error(`Failed to fetch reviews: ${res.statusText}`);
    }
    const data = await res.json();
    const reviews: ProductReview[] = Array.isArray(data.reviews) ? data.reviews : [];
    const summary: ProductRatingSummary = data.summary || {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recommendPercentage: 100
    };
    return { reviews, summary };
  } catch (err) {
    console.warn("Could not load product reviews:", err);
    return {
      reviews: [],
      summary: {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recommendPercentage: 100
      }
    };
  }
}

export async function submitProductReview(
  productId: string,
  payload: { userName: string; rating: number; comment: string }
): Promise<{ success: boolean; message: string; review: ProductReview }> {
  const res = await fetch(`/api/products/${productId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to submit review. Please try again.");
  }

  return data;
}

// ==========================================
// Admin Reviews Management API
// ==========================================

export async function fetchAdminReviews(): Promise<ProductReview[]> {
  const data = await authFetch("/api/admin/reviews");
  return Array.isArray(data.reviews) ? data.reviews : [];
}

export async function updateReviewStatus(
  id: string,
  status: "approved" | "hidden" | "pending"
): Promise<ProductReview> {
  const res = await authFetch(`/api/admin/reviews/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
  return res.review;
}

export async function deleteReview(id: string): Promise<boolean> {
  const res = await authFetch(`/api/admin/reviews/${id}`, {
    method: "DELETE"
  });
  return Boolean(res.success);
}
