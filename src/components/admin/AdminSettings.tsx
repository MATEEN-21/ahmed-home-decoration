import React, { useState } from "react";
import { SiteSettings } from "../../types";
import { updateSiteSettings } from "../../lib/api";
import {
  Store,
  MapPin,
  MessageCircle,
  Phone,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Megaphone,
  X
} from "lucide-react";

interface AdminSettingsProps {
  settings: SiteSettings;
  onRefreshData: () => Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onRefreshData }) => {
  const [shopName, setShopName] = useState(settings.shopName || "Ahmed Home Decoration");
  const [tagline, setTagline] = useState(settings.tagline || "");
  const [phone, setPhone] = useState(settings.phone || "0304 9088810");
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || "0304 9088810");
  const [email, setEmail] = useState(() => {
    if (settings.email && settings.email.toLowerCase().trim() === "tayyabmateen2121@gmail.com") {
      return "";
    }
    return settings.email || "";
  });
  const [location, setLocation] = useState(settings.location || "Thanan Market, Khushab, Pakistan");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(settings.googleMapsUrl || "");
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState(settings.googleMapsEmbed || "");
  const [deliveryNote, setDeliveryNote] = useState(settings.deliveryNote || "");

  // Announcement bar
  const [announcementText, setAnnouncementText] = useState(settings.announcement?.text || "");
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    settings.announcement?.enabled !== undefined ? settings.announcement.enabled : true
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const updatedPayload: Partial<SiteSettings> = {
        shopName: shopName.trim(),
        tagline: tagline.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        location: location.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        googleMapsEmbed: googleMapsEmbed.trim(),
        deliveryNote: deliveryNote.trim(),
        announcement: {
          text: announcementText.trim(),
          enabled: announcementEnabled
        }
      };

      await updateSiteSettings(updatedPayload);
      await onRefreshData();
      setSuccessMessage("Shop information and settings saved successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Shop Information & Content Settings
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Modify business phone numbers, shop address, and banner announcements.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
          <span>Save All Settings</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Card 1: Shop Identity & Contact (Khushab, 0346 7088810) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2 border-b border-slate-100 pb-3">
          <Store className="w-5 h-5 text-emerald-700" />
          Business Identity & Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Shop Name *
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tagline / Slogan
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Modern Home Décor & Islamic Calligraphy Art"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Number (Orders received here) *
            </label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="0304 9088810"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              Direct Call Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0304 9088810"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Physical Shop Address *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Thanan Market, Khushab, Pakistan"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Google Maps Direct Link (for directions)
            </label>
            <input
              type="text"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Google Maps Embed URL (iframe src)
            </label>
            <input
              type="text"
              value={googleMapsEmbed}
              onChange={(e) => setGoogleMapsEmbed(e.target.value)}
              placeholder="https://maps.google.com/maps?q=..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Delivery / Cash On Delivery Notice
            </label>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Express Cash on Delivery to Lahore, Karachi, Islamabad, Faisalabad & all towns."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Announcement Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-700" />
            Top Announcement Ribbon
          </h3>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span>Show Announcement Bar</span>
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Announcement Text
          </label>
          <input
            type="text"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Special Discount on Islamic Calligraphy Clocks! Free Delivery on orders over Rs. 10,000."
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600"
          />
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
          <span>Save All Settings to Database</span>
        </button>
      </div>
    </form>
  );
};
