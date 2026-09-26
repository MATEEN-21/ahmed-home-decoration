import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Sparkles, Check, Minus, Plus } from "lucide-react";
import { Product, ProductDesign } from "../../types";
import { getProductDesigns } from "../../lib/variants";

interface AddToCartDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirmAddToCart: (product: Product, quantity: number, selectedDesign: ProductDesign) => void;
}

export const AddToCartDesignModal: React.FC<AddToCartDesignModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmAddToCart,
}) => {
  const designs = getProductDesigns(product);
  const [selectedDesign, setSelectedDesign] = useState<ProductDesign | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Reset selection when modal opens with a different product
  useEffect(() => {
    if (isOpen) {
      setSelectedDesign(null);
      setQuantity(1);
    }
  }, [isOpen, product.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedDesign) return;
    onConfirmAddToCart(product, quantity, selectedDesign);
    onClose();
  };

  const totalAmount = (product.price || 0) * Math.max(1, quantity);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-modal-title"
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl border border-[#E3DACD] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E3DACD] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={
                selectedDesign?.image ||
                product.images?.[0] ||
                "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"
              }
              alt={product.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#E3DACD] bg-white shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
              }}
            />
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4A5D43] uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#4A5D43]" /> Choose Design to Add
              </span>
              <h3
                id="design-modal-title"
                className="font-display font-medium text-sm sm:text-base text-[#1A1816] truncate"
              >
                {product.name}
              </h3>
              <p className="text-xs font-bold text-[#1A1816] font-mono">
                Rs. {(product.price || 0).toLocaleString()} each
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E3DACD] hover:bg-[#F2ECE4] text-[#1A1816] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Designs Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1816]">
                Available Designs ({designs.length}):
              </span>
              {selectedDesign ? (
                <span className="text-xs font-bold text-[#4A5D43] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ {selectedDesign.name} Selected
                </span>
              ) : (
                <span className="text-xs text-[#888888] italic">
                  Tap a design to select
                </span>
              )}
            </div>

            {/* Designs grid (handles 2, 3, 4, 5, 10+ designs cleanly) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[42vh] overflow-y-auto pr-1">
              {designs.map((design) => {
                const isSelected = selectedDesign?.id === design.id;
                return (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => setSelectedDesign(design)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-emerald-50/50 border-[#4A5D43] ring-2 ring-[#4A5D43]/20 shadow-xs"
                        : "bg-white border-[#E3DACD] hover:border-[#4A5D43]/40 hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#FAF8F5] shrink-0 border border-[#E3DACD]">
                      <img
                        src={design.image || product.images?.[0] || ""}
                        alt={design.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#4A5D43]/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow-md stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span
                        className={`block text-xs font-bold truncate ${
                          isSelected ? "text-[#1A1816]" : "text-[#333333]"
                        }`}
                      >
                        {design.name}
                      </span>
                      <span
                        className={`block text-[11px] font-medium mt-0.5 ${
                          isSelected ? "text-[#4A5D43] font-bold" : "text-[#777777]"
                        }`}
                      >
                        {isSelected ? "Selected ✓" : "Tap to pick"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E3DACD] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#1F1F1F] font-semibold block">Quantity:</span>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-white border border-[#E3DACD] text-[#1A1816] hover:bg-[#FAF8F5] flex items-center justify-center font-bold transition cursor-pointer shadow-2xs"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold text-[#1A1816] w-7 text-center font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-lg bg-white border border-[#E3DACD] text-[#1A1816] hover:bg-[#FAF8F5] flex items-center justify-center font-bold transition cursor-pointer shadow-2xs"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#1F1F1F] font-medium block">Total Price:</span>
              <span className="text-base sm:text-lg font-bold text-[#1A1816] font-mono">
                Rs. {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-5 border-t border-[#E3DACD] bg-[#FAF8F5] flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 sm:px-4 bg-white hover:bg-[#F2ECE4] text-[#1A1816] border border-[#E3DACD] rounded-xl text-xs font-semibold transition cursor-pointer shrink-0"
          >
            Cancel
          </button>

          {selectedDesign ? (
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-3 sm:px-4 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-center leading-snug break-words"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>
                Add {selectedDesign.name} to Cart ({quantity})
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex-1 py-2.5 px-3 sm:px-4 bg-stone-200 text-stone-500 border border-stone-300 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 cursor-not-allowed select-none shadow-none text-center leading-snug"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>Select a Design to Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
