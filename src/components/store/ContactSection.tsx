import React from "react";
import { SiteSettings } from "../../types";
import { MapPin, Phone, Navigation, Clock, Mail } from "lucide-react";

interface ContactSectionProps {
  settings: SiteSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  return (
    <section id="contact" className="bg-[#F2ECE4] py-16 sm:py-20 border-b border-[#E3DACD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#4A5D43] text-[11px] font-semibold uppercase tracking-widest mb-3 border border-[#E3DACD] shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#4A5D43]" />
            <span>Visit Us in Khushab</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1816] tracking-tight">
            Contact
          </h2>
          <p className="text-[#1F1F1F] text-sm sm:text-base mt-2 font-normal">
            Visit our shop in Thanan Market, Khushab or reach out directly by phone for inquiries, custom designs, and orders.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Location Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E3DACD] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#4A5D43] flex items-center justify-center mb-3.5 border border-[#E3DACD]">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-[#1A1816] text-base mb-1">Our Location</h4>
              <p className="text-[#1F1F1F] text-xs sm:text-sm leading-relaxed font-normal">
                {settings.location || "Thanan Market, Khushab, Punjab, Pakistan"}
              </p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=32.295008,72.349388"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5D43] hover:text-[#1A1816] transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" /> Get Directions on Google Maps
              </a>
            </div>

            {/* Direct Phone Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E3DACD] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#4A5D43] flex items-center justify-center mb-3.5 border border-[#E3DACD]">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-[#1A1816] text-base mb-1">Phone Inquiries & Orders</h4>
              <p className="text-[#1A1816] text-sm font-mono font-medium">
                {settings.phone || "0304 9088810"}
              </p>
              <a
                href={`tel:${(settings.phone || "03049088810").replace(/\s+/g, "")}`}
                className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5D43] hover:text-[#1A1816] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call Shop Now
              </a>
            </div>

            {/* Shop Timings Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E3DACD] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#4A5D43] flex items-center justify-center mb-3.5 border border-[#E3DACD]">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-display font-semibold text-[#1A1816] text-base mb-1">Shop Timings</h4>
              <div className="text-[#1F1F1F] text-xs sm:text-sm leading-relaxed space-y-1 font-medium">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1A1816]">Mon – Thu:</span>
                  <span>8:30 AM – 8:30 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1A1816]">Friday:</span>
                  <span>8:30 AM – 12:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1A1816]">Sat – Sun:</span>
                  <span>8:30 AM – 8:30 PM</span>
                </div>
              </div>
            </div>

            {/* Email Info Card if configured */}
            {settings.email &&
              settings.email.toLowerCase().trim() !== "tayyabmateen2121@gmail.com" && (
                <div className="bg-white p-5 rounded-2xl border border-[#E3DACD] shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#4A5D43] flex items-center justify-center shrink-0 border border-[#E3DACD]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-[#1F1F1F] font-semibold block">Email Support</span>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-xs sm:text-sm font-medium text-[#1A1816] hover:text-[#4A5D43] truncate block transition-colors"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}
          </div>

          {/* Right Column: Google Maps Location & Directions */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-[#E3DACD] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold text-[#1A1816] text-lg sm:text-xl">
                  Shop Location Map
                </h3>
                <p className="text-xs text-[#1F1F1F] font-medium mt-0.5">
                  Thanan Market, Khushab, Punjab, Pakistan
                </p>
              </div>
              <a
                href={settings.googleMapsUrl && !settings.googleMapsUrl.includes("Thanan+Market+Khushab+Pakistan") ? settings.googleMapsUrl : "https://maps.app.goo.gl/ygUXQUFpzNvTUMTs9"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#4A5D43] text-white rounded-xl text-xs font-medium hover:bg-[#3B4A35] transition-colors flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
              >
                <Navigation className="w-3.5 h-3.5" /> Open Google Maps
              </a>
            </div>

            {/* Embedded Google Map */}
            <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-[#E3DACD] bg-[#FAF8F5]">
              <iframe
                title="Ahmed Home Decoration Location - Thanan Market Khushab"
                src={settings.googleMapsEmbed && !settings.googleMapsEmbed.includes("Khushab%2C%20Punjab") && !settings.googleMapsEmbed.includes("Thanan%20Market") ? settings.googleMapsEmbed : "https://maps.google.com/maps?q=32.295008,72.349388&t=&z=16&ie=UTF8&iwloc=&output=embed"}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E3DACD] text-xs sm:text-sm text-[#1A1816] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-light">Need landmark directions while visiting?</span>
              <a
                href={`tel:${(settings.phone || "03049088810").replace(/\s+/g, "")}`}
                className="font-medium text-[#4A5D43] hover:text-[#1A1816] underline transition-colors"
              >
                Call {settings.phone || "0304 9088810"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
