import React, { useState } from "react";
import { WhatsAppInquiry } from "../../types";
import { deleteInquiry, clearAllInquiries } from "../../lib/api";
import { MessageCircle, Trash2, Calendar, ShoppingBag, CheckCircle2, User, RefreshCw, X } from "lucide-react";

interface AdminInquiriesProps {
  inquiries: WhatsAppInquiry[];
  onRefreshData: () => Promise<void>;
}

export const AdminInquiries: React.FC<AdminInquiriesProps> = ({ inquiries, onRefreshData }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteInquiry(id);
      await onRefreshData();
    } catch (err: any) {
      alert("Failed to delete inquiry: " + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all logged inquiries?")) return;
    setIsClearing(true);
    try {
      await clearAllInquiries();
      await onRefreshData();
      setSuccessMessage("All logged inquiries cleared.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert("Failed to clear inquiries: " + err.message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            WhatsApp Orders & Inquiries Log
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Every time a customer clicks "Order on WhatsApp", their interest and product selection is recorded here.
          </p>
        </div>

        {inquiries.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl border border-red-200 transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Logged Inquiries
          </button>
        )}
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

      {inquiries.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-5 h-5 fill-emerald-600/20" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {inq.productName || "Direct Shop Inquiry"}
                      </span>
                      {inq.selectedDesignName && (
                        <span className="text-xs font-semibold text-[#4A5D43] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                          🎨 {inq.selectedDesignName}
                        </span>
                      )}
                      {inq.productPrice && (
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          Rs. {inq.productPrice.toLocaleString()}
                        </span>
                      )}
                      {inq.quantity && inq.quantity > 1 && (
                        <span className="text-xs text-slate-500 font-mono">
                          (Qty: {inq.quantity})
                        </span>
                      )}
                    </div>

                    {inq.selectedDesignImage && (
                      <div className="flex items-center gap-2 pt-1">
                        <img
                          src={inq.selectedDesignImage}
                          alt={inq.selectedDesignName || "Design Reference"}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-50"
                        />
                        <span className="text-[11px] text-slate-500">Selected Design Photo</span>
                      </div>
                    )}

                    {inq.customerNote && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-xl">
                        "{inq.customerNote}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(inq.timestamp).toLocaleString("en-PK", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDelete(inq.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No Inquiries Logged Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            When visitors click on "Order on WhatsApp" or send inquiry forms, records will appear here for your reference.
          </p>
        </div>
      )}
    </div>
  );
};
