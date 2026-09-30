import React from "react";
import { SiteSettings } from "../../types";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { WhatsAppIcon } from "../common/WhatsAppIcon";
import { createGeneralWhatsAppUrl, ORDER_WHATSAPP_NUMBER } from "../../lib/whatsapp";

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="bg-white text-[#1A1816] pt-16 pb-12 border-t border-[#E3DACD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="shrink-0 rounded-2xl bg-[#FAF8F5] border border-[#E3DACD] p-1 shadow-2xs">
                <img
                  src="/logo.png"
                  alt={settings.shopName || "Ahmed Home Decoration"}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h3 className="font-display font-semibold text-xl text-[#1A1816] tracking-tight leading-tight">
                  {settings.shopName || "Ahmed Home Decoration"}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#4A5D43] font-semibold tracking-widest uppercase mt-0.5">
                  Decor Today • Beautiful Tomorrow
                </p>
              </div>
            </div>
            <p className="text-[#1F1F1F] text-xs sm:text-sm leading-relaxed font-normal">
              {settings.tagline ||
                "Elevating Pakistani homes with timeless Islamic wall art, bespoke luxury clocks, and ambient home styling."}
            </p>
            <div className="pt-1 text-xs text-[#1F1F1F] font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#4A5D43] shrink-0" />
              <span>{settings.location || "Thanan Market, Khushab, Punjab"}</span>
            </div>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="text-[#1A1816] font-display font-semibold text-base mb-4 tracking-wide">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#1F1F1F]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/")}
                  className="hover:text-[#4A5D43] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/products")}
                  className="hover:text-[#4A5D43] transition-colors cursor-pointer"
                >
                  Products & Full Shop
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/products")}
                  className="hover:text-[#4A5D43] transition-colors cursor-pointer"
                >
                  Popular Categories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/contact")}
                  className="hover:text-[#4A5D43] transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("/about")}
                  className="hover:text-[#4A5D43] transition-colors cursor-pointer"
                >
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-[#1A1816] font-display font-semibold text-base mb-4 tracking-wide">
              Direct Contact & Orders
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm font-medium text-[#1F1F1F]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#4A5D43] shrink-0 mt-0.5" />
                <span>{settings.location || "Thanan Market, Khushab, Pakistan"}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <a
                  href={createGeneralWhatsAppUrl(
                    settings.whatsapp || ORDER_WHATSAPP_NUMBER,
                    "Assalam-o-Alaikum! I want to inquire about your home decoration items."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#4A5D43] transition-colors font-mono text-[#1A1816]"
                >
                  WhatsApp: +92 304 9088810
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#4A5D43] shrink-0" />
                <a
                  href={`tel:${(settings.phone || "03049088810").replace(/\s+/g, "")}`}
                  className="hover:text-[#4A5D43] transition-colors font-mono text-[#1A1816]"
                >
                  Call: {settings.phone || "0304 9088810"}
                </a>
              </li>
              {settings.email &&
                settings.email.toLowerCase().trim() !== "tayyabmateen2121@gmail.com" && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#4A5D43] shrink-0" />
                    <a
                      href={`mailto:${settings.email}`}
                      className="hover:text-[#4A5D43] transition-colors truncate text-[#1A1816]"
                    >
                      {settings.email}
                    </a>
                  </li>
                )}
            </ul>
          </div>

          {/* Shop Hours & Service */}
          <div>
            <h4 className="text-[#1A1816] font-display font-semibold text-base mb-4 tracking-wide">
              Shop Timings
            </h4>
            <div className="space-y-3 text-xs sm:text-sm text-[#1F1F1F] font-normal">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#4A5D43] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold text-[#1A1816]">Mon – Thu:</span> 8:30 AM – 8:30 PM
                  </div>
                  <div>
                    <span className="font-semibold text-[#1A1816]">Friday:</span> 8:30 AM – 12:00 AM
                  </div>
                  <div>
                    <span className="font-semibold text-[#1A1816]">Sat – Sun:</span> 8:30 AM – 8:30 PM
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-[#E3DACD] flex flex-col sm:flex-row items-center justify-between text-xs text-[#1F1F1F] font-medium gap-3">
          <span>
            © Ahmed Home Decoration. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};
