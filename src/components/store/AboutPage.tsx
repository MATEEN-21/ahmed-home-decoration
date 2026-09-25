import React from "react";
import {
  Sparkles,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Truck
} from "lucide-react";
import { SiteSettings } from "../../types";

interface AboutPageProps {
  settings: SiteSettings;
  onNavigate: (sectionId: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, onNavigate }) => {
  return (
    <div className="bg-[#FAF8F5] min-h-screen text-[#1A1816]">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F2ECE4] to-[#FAF8F5] py-16 sm:py-24 border-b border-[#E3DACD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#555555] mb-6">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="hover:text-[#4A5D43] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="font-semibold text-[#1A1816]">About</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#4A5D43] text-[11px] font-semibold uppercase tracking-widest mb-4 border border-[#E3DACD] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#4A5D43]" />
              <span>Modern Home Décor • Khushab</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal text-[#1A1816] tracking-tight leading-tight mb-6">
              Stylish & Modern Home Décor in Khushab
            </h1>

            <div className="space-y-4 text-[#1F1F1F] text-base sm:text-lg leading-relaxed font-normal mb-8">
              <p>
                <strong className="font-semibold text-[#1A1816]">Ahmed Home Decoration</strong> is a home décor shop in Khushab, offering stylish and carefully selected products to help customers create beautiful and modern living spaces.
              </p>
              <p className="text-sm sm:text-base text-[#444444]">
                We focus on quality, attractive designs, and practical décor pieces suitable for homes, offices, and gifting.
              </p>
              <p className="text-sm sm:text-base text-[#444444]">
                Our goal is to make modern home decoration simple and accessible while providing customers with a reliable local shopping experience.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate("/products")}
                className="px-6 py-3 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate("/contact")}
                className="px-6 py-3 bg-white hover:bg-[#FAF8F5] text-[#1A1816] border border-[#E3DACD] rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition shadow-2xs cursor-pointer inline-flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#4A5D43]" />
                <span>Visit Our Shop</span>
              </button>
            </div>
          </div>
        </div>

        {/* Subtle decorative background watermarks */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none hidden lg:block pr-12">
          <span className="font-display text-[260px] font-bold text-[#1A1816] select-none">
            AHD
          </span>
        </div>
      </section>

      {/* Core Values & Offerings */}
      <section className="py-16 sm:py-20 bg-[#F2ECE4]/60 border-b border-[#E3DACD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-semibold text-[#4A5D43] uppercase tracking-widest block mb-2">
              Our Core Focus
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
              Why Customers Choose Ahmed Home Decoration
            </h2>
            <p className="text-[#1F1F1F] text-xs sm:text-sm mt-2 font-normal">
              Carefully chosen designs, dependable quality, and a reliable shopping experience for every home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E3DACD] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E3DACD] text-[#4A5D43] flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-base text-[#1A1816] mb-2">
                Stylish & Attractive Designs
              </h4>
              <p className="text-xs text-[#1F1F1F] leading-relaxed font-normal">
                We curate a diverse selection of modern Islamic calligraphy, elegant wall clocks, and contemporary decorative pieces to bring elegance and character to your living spaces.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E3DACD] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E3DACD] text-[#4A5D43] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-base text-[#1A1816] mb-2">
                Quality & Practical Décor
              </h4>
              <p className="text-xs text-[#1F1F1F] leading-relaxed font-normal">
                Every product is selected for durable construction, refined aesthetics, and long-lasting finish—ideal for family homes, professional offices, and thoughtful gifting.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E3DACD] shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E3DACD] text-[#4A5D43] flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-base text-[#1A1816] mb-2">
                Simple & Accessible Shopping
              </h4>
              <p className="text-xs text-[#1F1F1F] leading-relaxed font-normal">
                Whether visiting our local shop in Khushab or ordering online with Cash on Delivery across Pakistan, we make modern home decoration straightforward and worry-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#1E1A17] text-[#FAF8F5] py-14 border-t border-[#2E2823]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="font-display text-2xl sm:text-3xl font-normal tracking-tight mb-3">
            Ready to Transform Your Living Space?
          </h3>
          <p className="text-xs sm:text-sm text-[#C5A880] max-w-xl mx-auto mb-6 font-normal">
            Explore our curated catalog of stylish wall art, clocks, and modern home décor accents.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("/products")}
              className="px-6 py-3 bg-[#4A5D43] hover:bg-[#3B4A35] text-white rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("/contact")}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition cursor-pointer"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
