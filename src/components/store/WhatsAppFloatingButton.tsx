import React from "react";
import { WhatsAppIcon } from "../common/WhatsAppIcon";
import { createGeneralWhatsAppUrl, ORDER_WHATSAPP_NUMBER } from "../../lib/whatsapp";

interface WhatsAppFloatingButtonProps {
  whatsappNumber?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ whatsappNumber }) => {
  const url = createGeneralWhatsAppUrl(
    whatsappNumber || ORDER_WHATSAPP_NUMBER,
    "Assalam-o-Alaikum Ahmed Home Decoration! I want to inquire about your home decoration products."
  );

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 group">
      {/* Floating tooltip */}
      <div className="bg-[#1A1816] text-white text-xs py-1.5 px-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap flex items-center gap-1.5 border border-[#1A1816]">
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
        <span>Chat on WhatsApp</span>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-108 focus:outline-none focus:ring-4 focus:ring-[#25D366]/50"
        aria-label="Direct WhatsApp Chat with Ahmed Home Decoration"
      >
        <WhatsAppIcon className="w-14 h-14" />
      </a>
    </div>
  );
};
