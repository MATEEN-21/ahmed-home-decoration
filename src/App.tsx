import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { fetchPublicData, getAuthToken, logoutAdmin, verifyAdmin, getLocalFallbackData } from "./lib/api";
import { PublicDataResponse, Product, CartItem, ProductDesign } from "./types";
import { getProductDesigns, getCartItemId } from "./lib/variants";
import { Header } from "./components/store/Header";
import { Footer } from "./components/store/Footer";
import { ProductDetailModal } from "./components/store/ProductDetailModal";
import { CartDrawer } from "./components/store/CartDrawer";
import { WhatsAppFloatingButton } from "./components/store/WhatsAppFloatingButton";
import { ScrollProgressButton } from "./components/store/ScrollProgressButton";
import { StartupIntro } from "./components/store/StartupIntro";
import { ORDER_WHATSAPP_NUMBER } from "./lib/whatsapp";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPortal } from "./components/admin/AdminPortal";
import { HomePage } from "./components/store/HomePage";
import { ProductsPage } from "./components/store/ProductsPage";
import { AboutPage } from "./components/store/AboutPage";
import { ContactPage } from "./components/store/ContactPage";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AlertCircle } from "lucide-react";

function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize immediately with the local JSON database so the home page and storefront load directly
  const [data, setData] = useState<PublicDataResponse>(() => getLocalFallbackData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigation & Filtering state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Derive active section from URL path for navbar highlighting
  const getActiveSection = () => {
    const p = location.pathname;
    if (p === "/" || p === "") return "home";
    if (p.startsWith("/products")) return "products";
    if (p.startsWith("/about")) return "about";
    if (p.startsWith("/contact")) return "contact";
    return "home";
  };
  const activeSection = getActiveSection();

  // Cart state for multi-item WhatsApp ordering with full design/variant isolation
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("ahmed_decor_cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          const designs = getProductDesigns(item.product);
          const design = item.selectedDesign || (designs.length > 0 ? designs[0] : undefined);
          const itemId = item.id || getCartItemId(item.product?.id || "prod", design?.id);
          return {
            ...item,
            id: itemId,
            selectedDesign: design,
          };
        });
      }
      return [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("ahmed_decor_cart", JSON.stringify(cart));
    } catch (e) {
      console.warn("Failed to persist cart", e);
    }
  }, [cart]);

  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    selectedDesign?: ProductDesign
  ) => {
    if (product.stockStatus === "out_of_stock") {
      return;
    }

    const designs = getProductDesigns(product);
    // Use the explicit selected design, or first design only if no selection provided
    const designToUse =
      selectedDesign ||
      (designs.length > 0
        ? designs[0]
        : {
            id: "design-1",
            name: "Default Design",
            image: product.images?.[0] || "",
            price: product.price,
            stockStatus: product.stockStatus,
          });

    const cartItemId = getCartItemId(product.id, designToUse.id);

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => (item.id || getCartItemId(item.product.id, item.selectedDesign?.id)) === cartItemId
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          id: cartItemId,
          quantity: updated[existingIndex].quantity + quantity,
          selectedDesign: designToUse,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity,
          selectedDesign: designToUse,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          const itemId = item.id || getCartItemId(item.product.id, item.selectedDesign?.id);
          if (itemId === cartItemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => (item.id || getCartItemId(item.product.id, item.selectedDesign?.id)) !== cartItemId
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Admin routing state
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return (
      window.location.hash === "#admin" ||
      window.location.pathname.startsWith("/admin")
    );
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem("ahmed_admin_email") || "tayyabmateen2121@gmail.com";
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(getAuthToken());
  });
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Fetch Public Storefront Data (syncs in background without blocking instant local paint)
  const loadStoreData = useCallback(async () => {
    try {
      const res = await fetchPublicData();
      if (res && Array.isArray(res.products) && res.products.length > 0) {
        setData(res);
      }
    } catch (err: any) {
      console.warn("Background store data refresh notice:", err);
      setData((prev) => {
        if (!prev || !prev.products || prev.products.length === 0) {
          setError(err.message || "Failed to load store data.");
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Keep admin mode in sync with URL
  useEffect(() => {
    if (location.pathname.startsWith("/admin") || window.location.hash === "#admin") {
      setIsAdminMode(true);
    }
  }, [location.pathname]);

  // Keyboard shortcut (Ctrl + Shift + A or Cmd + Shift + A) to open admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setIsAdminMode(true);
        navigate("/admin");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Listen for global unauthorized/session expired events from api.ts
  useEffect(() => {
    const handleUnauthorized = () => {
      logoutAdmin().catch(() => {});
      localStorage.removeItem("ahmed_admin_email");
      setIsAuthenticated(false);
      setSessionNotice("Your session expired. Please sign in again with your credentials.");
    };

    window.addEventListener("admin_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("admin_unauthorized", handleUnauthorized);
  }, []);

  // Proactively verify stored token whenever admin mode is active
  useEffect(() => {
    if (isAdminMode && isAuthenticated) {
      verifyAdmin()
        .then((isValid) => {
          if (!isValid) {
            logoutAdmin().catch(() => {});
            localStorage.removeItem("ahmed_admin_email");
            setIsAuthenticated(false);
            setSessionNotice("Your session expired. Please sign in again with your credentials.");
          }
        })
        .catch(() => {
          setIsAuthenticated(false);
        });
    }
  }, [isAdminMode, isAuthenticated]);

  const handleAdminLoginSuccess = (email: string) => {
    setSessionNotice(null);
    setAdminEmail(email);
    localStorage.setItem("ahmed_admin_email", email);
    setIsAuthenticated(true);
  };

  const handleAdminLogout = () => {
    logoutAdmin().catch(() => {});
    localStorage.removeItem("ahmed_admin_email");
    setIsAuthenticated(false);
    setSessionNotice(null);
  };

  const handleExitAdmin = () => {
    setIsAdminMode(false);
    setSessionNotice(null);
    if (window.location.hash === "#admin") {
      window.location.hash = "";
    }
    navigate("/");
    loadStoreData(); // Refresh storefront data in case admin updated anything
  };

  // Proper client-side navigation router
  const handleNavigate = (pathOrId: string) => {
    let target = pathOrId;
    if (target === "home") target = "/";
    else if (target === "products") target = "/products";
    else if (target === "about") target = "/about";
    else if (target === "contact") target = "/contact";
    else if (target === "admin") {
      setIsAdminMode(true);
      navigate("/admin");
      return;
    }

    if (location.pathname !== target) {
      navigate(target);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    if (location.pathname !== "/products") {
      navigate("/products");
    }
  };

  // ADMIN MODE RENDER
  if (isAdminMode || location.pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return (
        <AdminLogin
          notice={sessionNotice}
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToStore={handleExitAdmin}
        />
      );
    }

    return (
      <AdminPortal
        adminEmail={adminEmail}
        onLogout={handleAdminLogout}
        onViewStore={handleExitAdmin}
      />
    );
  }

  // PUBLIC STOREFRONT RENDER
  if (isLoading && (!data || !data.products || data.products.length === 0)) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <img
          src="/logo.png"
          alt="Ahmed Home Decoration"
          className="w-28 h-28 sm:w-36 sm:h-36 object-contain select-none"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (error && (!data || !data.products || data.products.length === 0)) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-[#E3DACD] shadow-md max-w-md">
          <AlertCircle className="w-10 h-10 text-[#4A5D43] mx-auto mb-3" />
          <h2 className="font-display text-2xl font-normal text-[#1A1816] mb-1">
            Unable to Load Store
          </h2>
          <p className="text-xs text-[#1F1F1F] mb-6 font-normal">{error}</p>
          <button
            onClick={loadStoreData}
            className="px-6 py-2.5 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-lg text-xs font-medium tracking-wide shadow-xs transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1816] font-sans selection:bg-[#4A5D43] selection:text-white flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Persistent Global Header */}
      <Header
        settings={data.settings}
        activeSection={activeSection}
        categories={data.categories}
        onSelectCategory={handleSelectCategory}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Content Area - Genuinely Separate Pages */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        <Routes>
          {/* 1. HOME: / */}
          <Route
            path="/"
            element={
              <HomePage
                data={data}
                onNavigate={handleNavigate}
                onSelectCategory={handleSelectCategory}
                onOpenDetails={(product) => setSelectedProduct(product)}
                onAddToCart={handleAddToCart}
              />
            }
          />

          {/* 2. PRODUCTS: /products */}
          <Route
            path="/products"
            element={
              <ProductsPage
                data={data}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenDetails={(product) => setSelectedProduct(product)}
                onAddToCart={handleAddToCart}
                onNavigate={handleNavigate}
              />
            }
          />

          {/* 3. ABOUT: /about */}
          <Route
            path="/about"
            element={
              <AboutPage
                settings={data.settings}
                onNavigate={handleNavigate}
              />
            }
          />

          {/* 4. CONTACT: /contact */}
          <Route
            path="/contact"
            element={
              <ContactPage
                settings={data.settings}
                onNavigate={handleNavigate}
              />
            }
          />

          {/* Catch-all fallback redirecting to / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Persistent Global Footer */}
      <Footer
        settings={data.settings}
        onNavigate={handleNavigate}
      />

      {/* Product Detail & Specifications Modal */}
      <ProductDetailModal
        product={selectedProduct}
        settings={data.settings}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* WhatsApp Cart Drawer for Multi-Item Orders */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        shopPhone={data.settings.whatsapp || ORDER_WHATSAPP_NUMBER}
        onContinueShopping={() => handleNavigate("/products")}
      />

      {/* Floating Direct WhatsApp Chat Button */}
      <WhatsAppFloatingButton whatsappNumber={data.settings.whatsapp || ORDER_WHATSAPP_NUMBER} />

      {/* Floating Circular Scroll Progress Button */}
      <ScrollProgressButton />

      {/* Website Startup Intro Screen */}
      <StartupIntro />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppInner />
    </BrowserRouter>
  );
}
