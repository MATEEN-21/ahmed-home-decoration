import { Product, CartItem, ProductDesign } from "../types";
import { getProductDesigns, findDesignById } from "./variants";

export const ORDER_WHATSAPP_NUMBER = "923049088810";
export const DISPLAY_WHATSAPP_NUMBER = "0304 9088810";

/**
 * Standardizes phone numbers to Pakistan international format digits (e.g. 923049088810).
 * Defaults strictly to 923049088810.
 */
export function formatWhatsAppNumber(phone?: string): string {
  if (!phone || typeof phone !== "string") {
    return ORDER_WHATSAPP_NUMBER;
  }
  const clean = phone.replace(/[^0-9]/g, "");
  if (!clean) {
    return ORDER_WHATSAPP_NUMBER;
  }
  // Replace old number if still passed anywhere
  if (clean.includes("3467088810") || clean.includes("03467088810")) {
    return ORDER_WHATSAPP_NUMBER;
  }
  if (clean.startsWith("0")) {
    return "92" + clean.substring(1);
  }
  if (clean.startsWith("92")) {
    return clean;
  }
  return "92" + clean;
}

/**
 * Helper to build an absolute URL for image links inside WhatsApp messages.
 */
function resolveFullImageUrl(imageUrl?: string): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    const cleanOrigin = window.location.origin.replace(/\/+$/, "");
    const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${cleanOrigin}${cleanPath}`;
  }
  return imageUrl;
}

/**
 * Creates standard HTTPS wa.me link for a single product order:
 * https://wa.me/923049088810?text=...
 * NEVER uses whatsapp:// or any custom desktop protocol.
 * Always includes the EXACT selected design name/label and image.
 */
export function createProductWhatsAppUrl(
  product: Product,
  shopPhone: string = ORDER_WHATSAPP_NUMBER,
  quantity: number = 1,
  customerNote: string = "",
  selectedDesign?: ProductDesign | string
): string {
  const cleanNumber = formatWhatsAppNumber(shopPhone);
  const total = (product.price || 0) * Math.max(1, quantity);

  // Resolve design object
  let resolvedDesign: ProductDesign | undefined;
  if (selectedDesign && typeof selectedDesign === "object") {
    resolvedDesign = selectedDesign;
  } else if (typeof selectedDesign === "string") {
    resolvedDesign = findDesignById(product, selectedDesign);
  }

  // Fallback to first design ONLY if product has designs and none was provided
  if (!resolvedDesign) {
    const designs = getProductDesigns(product);
    if (designs.length > 0) {
      resolvedDesign = designs[0];
    }
  }

  const lines: string[] = [
    `Assalam-o-Alaikum Ahmed Home Decoration! 🌟`,
    ``,
    `I would like to place an order for this item:`,
    `📦 *Product:* ${product.name}`,
  ];

  if (resolvedDesign && resolvedDesign.name) {
    lines.push(`🎨 *Selected Design / Variant:* ${resolvedDesign.name}`);
  }

  lines.push(
    `🔢 *Quantity:* ${quantity}`,
    `💰 *Unit Price:* Rs. ${(product.price || 0).toLocaleString()}`,
    `💳 *Total Amount:* Rs. ${total.toLocaleString()}`
  );

  if (product.categoryName) {
    lines.push(`🏷️ *Category:* ${product.categoryName}`);
  }
  if (product.details?.dimensions) {
    lines.push(`📐 *Dimensions:* ${product.details.dimensions}`);
  }
  if (product.details?.material) {
    lines.push(`✨ *Material:* ${product.details.material}`);
  }
  if (product.details?.finishColor) {
    lines.push(`🎨 *Color / Finish:* ${product.details.finishColor}`);
  }

  if (resolvedDesign?.image) {
    const fullImg = resolveFullImageUrl(resolvedDesign.image);
    if (fullImg) {
      lines.push(`🖼️ *Design Reference Photo:* ${fullImg}`);
    }
  }

  if (customerNote && customerNote.trim()) {
    lines.push(`📝 *Note / Address:* ${customerNote.trim()}`);
  }

  lines.push(
    ``,
    `Please confirm product availability, delivery charges, and cash-on-delivery options to my address in Pakistan.`,
    `Thank you!`
  );

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${cleanNumber}?text=${text}`;
}

/**
 * Creates standard HTTPS wa.me link for a multi-item cart order:
 * https://wa.me/923049088810?text=...
 * Preserves the EXACT selected design for every individual cart item.
 */
export function createCartWhatsAppUrl(
  cartItems: CartItem[],
  shopPhone: string = ORDER_WHATSAPP_NUMBER,
  customerNote: string = ""
): string {
  const cleanNumber = formatWhatsAppNumber(shopPhone);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const grandTotal = cartItems.reduce(
    (acc, item) => acc + (item.product.price || 0) * item.quantity,
    0
  );

  const lines: string[] = [
    `Assalam-o-Alaikum Ahmed Home Decoration! 🌟`,
    ``,
    `I would like to place an order for the following items:`,
    ``
  ];

  cartItems.forEach((item, index) => {
    const subtotal = (item.product.price || 0) * item.quantity;
    lines.push(`${index + 1}. *${item.product.name}*`);

    if (item.selectedDesign && item.selectedDesign.name) {
      lines.push(`   • Selected Design: *${item.selectedDesign.name}*`);
      if (item.selectedDesign.image) {
        const fullImg = resolveFullImageUrl(item.selectedDesign.image);
        if (fullImg) {
          lines.push(`   • Design Reference: ${fullImg}`);
        }
      }
    }

    lines.push(`   • Quantity: ${item.quantity}`);
    lines.push(`   • Unit Price: Rs. ${(item.product.price || 0).toLocaleString()}`);
    lines.push(`   • Subtotal: Rs. ${subtotal.toLocaleString()}`);

    const variants: string[] = [];
    if (item.product.details?.dimensions) {
      variants.push(`Dimensions: ${item.product.details.dimensions}`);
    }
    if (item.product.details?.material) {
      variants.push(`Material: ${item.product.details.material}`);
    }
    if (item.product.details?.finishColor) {
      variants.push(`Color: ${item.product.details.finishColor}`);
    }
    if (variants.length > 0) {
      lines.push(`   • Options: ${variants.join(", ")}`);
    }
    lines.push(``);
  });

  lines.push(`----------------------------`);
  lines.push(`🔢 *Total Items:* ${totalItems}`);
  lines.push(`💵 *Grand Total:* Rs. ${grandTotal.toLocaleString()}`);
  lines.push(`----------------------------`);

  if (customerNote && customerNote.trim()) {
    lines.push(`📝 *Customer Note / Address:* ${customerNote.trim()}`);
    lines.push(``);
  }

  lines.push(
    `Please confirm order availability and delivery charges to my address in Pakistan.`,
    `Thank you!`
  );

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${cleanNumber}?text=${text}`;
}

/**
 * Creates standard HTTPS wa.me link for general inquiries:
 */
export function createGeneralWhatsAppUrl(
  shopPhone: string = ORDER_WHATSAPP_NUMBER,
  message: string = "Assalam-o-Alaikum Ahmed Home Decoration! I want to inquire about your home decoration collection and custom orders."
): string {
  const cleanNumber = formatWhatsAppNumber(shopPhone);
  const text = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${text}`;
}
