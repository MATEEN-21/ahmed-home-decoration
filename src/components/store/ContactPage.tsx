import React from "react";
import { SiteSettings } from "../../types";
import { ContactSection } from "./ContactSection";

interface ContactPageProps {
  settings: SiteSettings;
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings, onNavigate }) => {
  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* Top Breadcrumb */}
      <div className="bg-gradient-to-b from-[#F2ECE4] to-[#FAF8F5] py-6 sm:py-8 border-b border-[#E3DACD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-[#555555]">
            <button
              type="button"
              onClick={() => onNavigate("/")}
              className="hover:text-[#4A5D43] transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="font-semibold text-[#1A1816]">Contact</span>
          </nav>
        </div>
      </div>

      {/* Main Contact Section */}
      <ContactSection settings={settings} />
    </div>
  );
};
