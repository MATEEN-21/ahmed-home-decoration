import React, { useState, useEffect, useCallback } from "react";
import { AdminHeader } from "./AdminHeader";
import { AdminDashboard } from "./AdminDashboard";
import { AdminProducts } from "./AdminProducts";
import { AdminCategories } from "./AdminCategories";
import { AdminSlides } from "./AdminSlides";
import { AdminMedia } from "./AdminMedia";
import { AdminSettings } from "./AdminSettings";
import { AdminInquiries } from "./AdminInquiries";
import { AdminReviews } from "./AdminReviews";
import { AdminSecurity } from "./AdminSecurity";
import { fetchAdminAllData, logoutAdmin } from "../../lib/api";
import { AdminAllDataResponse } from "../../types";
import { RefreshCw, AlertCircle } from "lucide-react";

interface AdminPortalProps {
  adminEmail: string;
  onLogout: () => void;
  onViewStore: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  adminEmail,
  onLogout,
  onViewStore,
}) => {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [data, setData] = useState<AdminAllDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEmail, setActiveEmail] = useState(adminEmail);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminAllData();
      setData(res);
      if (res.admin?.email) {
        setActiveEmail(res.admin.email);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Failed to load admin data.";
      setError(errMsg);
      const lower = errMsg.toLowerCase();
      if (
        lower.includes("unauthorized") ||
        lower.includes("session expired") ||
        lower.includes("invalid") ||
        lower.includes("token") ||
        lower.includes("authentication") ||
        lower.includes("401")
      ) {
        logoutAdmin().catch(() => {});
        onLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdminLogout = () => {
    logoutAdmin().catch(() => {});
    onLogout();
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-md border border-slate-200 mb-4 flex items-center justify-center animate-pulse">
          <img
            src="/logo.png"
            alt="Ahmed Home Decoration"
            className="w-full h-full object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <RefreshCw className="w-6 h-6 text-emerald-700 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Ahmed Home Décor Admin Center...</p>
      </div>
    );
  }

  if (error && !data) {
    const isAuthError =
      error.toLowerCase().includes("unauthorized") ||
      error.toLowerCase().includes("session expired") ||
      error.toLowerCase().includes("invalid") ||
      error.toLowerCase().includes("token") ||
      error.toLowerCase().includes("authentication");

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            {isAuthError ? "Session Expired" : "Failed to Connect"}
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            {isAuthError
              ? "Your admin session is no longer active. Please sign in again with your credentials."
              : error}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={handleAdminLogout}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition"
            >
              Sign In to Admin
            </button>
            <button
              onClick={loadData}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Retry
            </button>
            <button
              onClick={onViewStore}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Header */}
      <AdminHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        adminEmail={activeEmail}
        onLogout={handleAdminLogout}
        onViewStore={onViewStore}
        inquiryCount={data.inquiries.length}
        pendingReviewsCount={(data.reviews || []).filter((r) => r.status === "pending").length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === "dashboard" && (
          <AdminDashboard
            data={data}
            onNavigateTab={setCurrentTab}
            onOpenAddProduct={() => setCurrentTab("products")}
          />
        )}

        {currentTab === "products" && (
          <AdminProducts
            products={data.products}
            categories={data.categories}
            onRefreshData={loadData}
          />
        )}

        {currentTab === "categories" && (
          <AdminCategories
            categories={data.categories}
            products={data.products}
            onRefreshData={loadData}
          />
        )}

        {currentTab === "reviews" && (
          <AdminReviews
            reviews={data.reviews || []}
            products={data.products}
            onRefreshData={loadData}
          />
        )}

        {currentTab === "slides" && (
          <AdminSlides
            slides={data.slides}
            onRefreshData={loadData}
          />
        )}

        {currentTab === "media" && <AdminMedia />}

        {currentTab === "settings" && (
          <AdminSettings
            settings={data.settings}
            onRefreshData={loadData}
          />
        )}

        {currentTab === "inquiries" && (
          <AdminInquiries
            inquiries={data.inquiries}
            onRefreshData={loadData}
          />
        )}

        {currentTab === "security" && (
          <AdminSecurity
            currentEmail={activeEmail}
            onCredentialsUpdated={setActiveEmail}
          />
        )}
      </main>
    </div>
  );
};
