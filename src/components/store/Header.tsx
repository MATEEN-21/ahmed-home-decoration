import React, { useState } from "react";
import { Menu, X, Search, Sparkles, MapPin, ShoppingBag } from "lucide-react";
import { SiteSettings, Category } from "../../types";

interface HeaderProps {
  settings: SiteSettings;
  activeSection?: string;
  categories?: Category[];
  onSelectCategory?: (id: string | null) => void;
  onNavigate: (sectionId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeSection = "home",
  categories = [],
  onSelectCategory,
  onNavigate,
  searchQuery,
  onSearchChange,
  cartCount = 0,
  onOpenCart,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const navItems = [
    { id: "home", label: "Home", path: "/" },
    { id: "products", label: "Products", path: "/products" },
    { id: "contact", label: "Contact", path: "/contact" },
    { id: "about", label: "About", path: "/about" },
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E3DACD] shadow-xs">
      {/* Top announcement bar - rich deep charcoal with subtle warm gold accent */}
      {settings.announcement?.enabled && settings.announcement?.text && (
        <div className="bg-[#1E1A17] text-[#FAF8F5] px-4 py-2 text-xs text-center font-medium tracking-wider flex items-center justify-center gap-2 border-b border-[#2E2823]">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
          <span className="font-display tracking-widest text-[11px] uppercase">
            {settings.announcement.text.replace(/whatsapp\s*[:\-\s]*[0-9\s]+/gi, "").trim()}
          </span>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-22 gap-2 sm:gap-4">
          {/* Brand & Logo */}
          <div
            onClick={() => handleNavClick("/")}
            className="cursor-pointer flex items-center gap-2 sm:gap-3.5 select-none group py-1 min-w-0 max-w-[65%] sm:max-w-none"
          >
            <div className="relative shrink-0 rounded-2xl bg-white border border-[#E3DACD] p-1 shadow-2xs group-hover:border-[#4A5D43] group-hover:shadow-xs transition-all duration-200">
              <img
                src="/logo.png"
                alt={settings.shopName || "Ahmed Home Decoration"}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-contain bg-[#FAF8F5]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-display font-semibold text-base sm:text-2xl text-[#1A1816] tracking-tight block leading-tight group-hover:text-[#4A5D43] transition-colors truncate">
                {settings.shopName || "Ahmed Home Decoration"}
              </span>
              <span className="text-[10px] sm:text-xs text-[#1F1F1F] font-medium tracking-wide flex items-center gap-1 mt-0.5 sm:mt-1 truncate">
                <MapPin className="w-3 h-3 text-[#4A5D43] shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-none">
                  {settings.location || "Thanan Market, Khushab, Pakistan"}
                </span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id || activeSection === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`px-4 py-2 rounded-lg text-sm tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "text-white bg-[#4A5D43] font-medium shadow-xs"
                      : "text-[#1F1F1F] hover:text-[#111111] hover:bg-[#F2ECE4] font-medium"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions & Phone Contact */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input or Toggle */}
            <div className="relative">
              {showSearchInput ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search wall art, clocks..."
                    className="w-32 sm:w-60 pl-8 pr-3 py-1.5 text-xs bg-white text-[#1F1F1F] placeholder-[#666666] border border-[#E3DACD] rounded-lg focus:outline-none focus:border-[#4A5D43]"
                    autoFocus
                  />
                  <Search className="w-3.5 h-3.5 text-[#1F1F1F] absolute left-2.5 top-2.5" />
                  <button
                    onClick={() => {
                      setShowSearchInput(false);
                      onSearchChange("");
                    }}
                    className="ml-1 p-1 text-[#1F1F1F] hover:text-[#111111]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowSearchInput(true);
                    onNavigate("/products");
                  }}
                  title="Search products"
                  className="p-2.5 text-[#1F1F1F] hover:text-[#111111] hover:bg-[#F2ECE4] rounded-lg transition-colors cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Cart Button */}
            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2.5 text-[#1F1F1F] hover:text-[#111111] hover:bg-[#F2ECE4] rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-[#E3DACD]"
                title="View Cart & Order"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#4A5D43] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs border border-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Hamburger / Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1F1F1F] hover:text-[#111111] rounded-lg hover:bg-[#F2ECE4] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3DACD] bg-[#FAF8F5] px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="pb-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                onNavigate("/products");
              }}
              placeholder="Search home decor items..."
              className="w-full px-3.5 py-2.5 text-xs bg-white text-[#1F1F1F] placeholder-[#666666] border border-[#E3DACD] rounded-lg focus:outline-none focus:border-[#4A5D43]"
            />
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id || activeSection === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "text-white bg-[#4A5D43] font-medium shadow-xs"
                      : "text-[#1F1F1F] hover:bg-[#F2ECE4] font-medium"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
              );
            })}
          </div>

          {onOpenCart && (
            <div className="pt-2 border-t border-[#E3DACD]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCart();
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#F2ECE4] text-[#1A1816] border border-[#E3DACD] rounded-lg text-center text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-[#4A5D43]" />
                <span>View Order Cart ({cartCount} items)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
