import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Sliders,
  Image,
  Store,
  MessageCircle,
  Shield,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Star
} from "lucide-react";

interface AdminHeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  adminEmail: string;
  onLogout: () => void;
  onViewStore: () => void;
  inquiryCount?: number;
  pendingReviewsCount?: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  onSelectTab,
  adminEmail,
  onLogout,
  onViewStore,
  inquiryCount = 0,
  pendingReviewsCount = 0
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Layers },
    { id: "reviews", label: "Reviews", icon: Star, badge: pendingReviewsCount },
    { id: "slides", label: "Hero Slider", icon: Sliders },
    { id: "media", label: "Media Upload", icon: Image },
    { id: "settings", label: "Shop Info & Content", icon: Store },
    { id: "inquiries", label: "Inquiries", icon: MessageCircle, badge: inquiryCount },
    { id: "security", label: "Security", icon: Shield }
  ];

  const handleTabClick = (id: string) => {
    onSelectTab(id);
    setMobileNavOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Ahmed Home Décor"
              className="w-10 h-10 rounded-lg object-contain bg-white shadow-xs p-0.5"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="font-display font-bold text-base sm:text-lg tracking-tight block leading-tight text-white">
                Ahmed Home Décor
              </span>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">
                Owner Management Center
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onViewStore}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">View Public Store</span>
            </button>

            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="truncate max-w-[150px]">{adminEmail}</span>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Log Out</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-800"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden md:block bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge ? (
                    <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  isActive
                    ? "bg-emerald-700 text-white"
                    : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge ? (
                  <span className="px-1.5 py-0.2 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
