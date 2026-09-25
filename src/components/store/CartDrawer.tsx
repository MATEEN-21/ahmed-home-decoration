import React, { useState } from "react";
import { CartItem } from "../../types";
import { createCartWhatsAppUrl, ORDER_WHATSAPP_NUMBER } from "../../lib/whatsapp";
import { getCartItemId, getDesignDisplayImage } from "../../lib/variants";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Truck,
  ArrowRight,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { WhatsAppIcon } from "../common/WhatsAppIcon";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  shopPhone?: string;
  onContinueShopping?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  shopPhone = ORDER_WHATSAPP_NUMBER,
  onContinueShopping,
}) => {
  const [customerNote, setCustomerNote] = useState("");

  if (!isOpen) return null;

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const grandTotal = cartItems.reduce(
    (acc, item) => acc + (item.product.price || 0) * item.quantity,
    0
  );
  const hasOutOfStockItem = cartItems.some(
    (item) => item.product.stockStatus === "out_of_stock"
  );

  // Generates standard https://wa.me/923049088810?text=... URL with full cart breakdown
  const whatsAppUrl = createCartWhatsAppUrl(cartItems, shopPhone, customerNote);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-[#E3DACD] flex items-center justify-between bg-[#F2ECE4]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white text-[#4A5D43] flex items-center justify-center border border-[#E3DACD] shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-medium text-[#1A1816] text-lg sm:text-xl">
                  Order Cart
                </h3>
                <p className="text-xs text-[#1F1F1F] font-medium">
                  {totalItems} {totalItems === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-xs text-[#1F1F1F] font-medium hover:text-[#4A5D43] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Clear all items"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-[#1F1F1F] hover:text-[#111111] hover:bg-white transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F5] text-[#4A5D43] flex items-center justify-center mb-4 border border-[#E3DACD]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-display text-xl font-normal text-[#1A1816] mb-1">
                Your cart is empty
              </h4>
              <p className="text-xs sm:text-sm text-[#1F1F1F] max-w-xs mb-6 leading-relaxed font-normal">
                Add beautiful Islamic wall art, clocks, or handcrafted décor to your cart and order directly on WhatsApp.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onContinueShopping) onContinueShopping();
                }}
                className="px-6 py-2.5 bg-[#4A5D43] hover:bg-[#3B4A35] text-white text-xs sm:text-sm font-medium tracking-wide rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-white">
                {cartItems.map((item) => {
                  const itemTotal = (item.product.price || 0) * item.quantity;
                  const itemId = item.id || getCartItemId(item.product.id, item.selectedDesign?.id);
                  const design = item.selectedDesign;
                  const itemImage = getDesignDisplayImage(item.product, design);

                  return (
                    <div
                      key={itemId}
                      className="p-3 bg-[#FAF8F5] border border-[#E3DACD] rounded-xl flex items-center gap-3 relative"
                    >
                      {/* Exact Selected Design Image */}
                      <img
                        src={itemImage}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover bg-white shrink-0 border border-[#E3DACD]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80";
                        }}
                      />

                      {/* Details */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h5
                          className="font-display font-medium text-sm text-[#1A1816] truncate"
                          title={item.product.name}
                        >
                          {item.product.name}
                        </h5>

                        {/* Exact Selected Design Badge */}
                        {design && (
                          <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-emerald-50 text-[#4A5D43] border border-emerald-200 rounded text-[10px] font-bold">
                            <span>🎨 Design:</span>
                            <span className="text-[#1A1816]">{design.name}</span>
                          </div>
                        )}

                        <div className="text-[11px] text-[#1F1F1F] font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#1A1816]">Rs. {(item.product.price || 0).toLocaleString()}</span>
                          {item.product.discountPercentage && item.product.discountPercentage > 0 && item.product.originalPrice ? (
                            <span className="line-through text-[10px] text-[#555555] font-medium">
                              Rs. {item.product.originalPrice.toLocaleString()}
                            </span>
                          ) : null}
                          <span className="text-[10px] text-[#1F1F1F] font-sans">each</span>
                          {item.product.stockStatus === "out_of_stock" && (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" /> Out of Stock
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls - Applies strictly to this selected design */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(itemId, -1)}
                            className="w-6 h-6 rounded-md bg-white border border-[#E3DACD] text-[#1A1816] hover:bg-[#FAF8F5] flex items-center justify-center transition cursor-pointer shadow-2xs"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-[#1A1816] w-5 text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(itemId, 1)}
                            className="w-6 h-6 rounded-md bg-white border border-[#E3DACD] text-[#1A1816] hover:bg-[#FAF8F5] flex items-center justify-center transition cursor-pointer shadow-2xs"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <span className="ml-auto font-mono font-bold text-xs sm:text-sm text-[#1A1816]">
                            Rs. {itemTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Remove - Removes only this specific design */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(itemId)}
                        className="text-[#1F1F1F] hover:text-[#4A5D43] p-1.5 rounded-lg transition-colors self-start cursor-pointer"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Optional Customer Note */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-[#1A1816] mb-1">
                    Delivery Address / Instructions (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. House #12, Street 4, Lahore. Please pack safely."
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#E3DACD] rounded-xl text-xs text-[#1A1816] placeholder-[#666666] focus:outline-none focus:border-[#4A5D43] focus:bg-white resize-none transition-colors"
                  />
                </div>
              </div>

              {/* Footer / WhatsApp Checkout */}
              <div className="p-5 border-t border-[#E3DACD] bg-[#F2ECE4] space-y-3">
                {/* Summary Row */}
                <div className="space-y-1.5 text-xs text-[#1F1F1F]">
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-semibold text-[#1A1816]">{totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 font-medium">
                      <Truck className="w-3.5 h-3.5 text-[#4A5D43]" /> Delivery:
                    </span>
                    <span className="font-medium text-[#1A1816]">
                      Nationwide COD across Pakistan
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#1A1816] pt-2 border-t border-[#E3DACD]">
                    <span className="font-display font-medium">Grand Total:</span>
                    <span className="font-mono text-[#1A1816] text-lg">
                      Rs. {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {hasOutOfStockItem && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Please remove Out of Stock item(s) from your cart to proceed with checkout.</span>
                  </div>
                )}

                {/* WhatsApp Order Action */}
                {hasOutOfStockItem ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-3.5 px-4 bg-stone-200 text-stone-500 border border-stone-300 rounded-xl font-semibold tracking-wide text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-not-allowed select-none text-center shadow-none"
                    title="Cart contains out of stock items"
                  >
                    <XCircle className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>Checkout Unavailable (Item Out of Stock)</span>
                  </button>
                ) : (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl font-medium tracking-wide text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs transition-colors cursor-pointer text-center"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>Order on WhatsApp (Rs. {grandTotal.toLocaleString()})</span>
                  </a>
                )}

                <p className="text-[11px] text-center text-[#1F1F1F] font-normal">
                  Opens WhatsApp directly to send your full cart list to <strong>+923049088810</strong>.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
