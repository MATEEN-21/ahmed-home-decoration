import React, { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";

export const ScrollProgressButton: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  // Calculate scroll percentage (0 to 100)
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    if (scrollHeight <= 0) {
      setScrollProgress(0);
      return;
    }

    const progress = (scrollTop / scrollHeight) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  }, []);

  useEffect(() => {
    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  // Smoothly return to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // SVG ring parameters
  const size = 46;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className="fixed bottom-6 sm:bottom-8 left-5 sm:left-6 z-40 flex items-center group select-none"
      id="circular-scroll-progress-container"
    >
      {/* Floating tooltip to the right */}
      <div
        className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 bg-[#1A1816]/95 text-white text-[11px] font-medium py-1 px-2.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-[#1A1816] hidden sm:flex items-center gap-1"
        aria-hidden="true"
      >
        <span>Back to Top</span>
        <span className="text-[10px] text-[#C5A880] font-mono font-semibold">
          ({Math.round(scrollProgress)}%)
        </span>
      </div>

      {/* Main Circular Button with Progress Ring */}
      <button
        type="button"
        id="btn-scroll-to-top"
        onClick={scrollToTop}
        aria-label={`Scroll to top of page (${Math.round(scrollProgress)}% scrolled)`}
        title="Scroll back to top"
        className="relative w-[46px] h-[46px] rounded-full flex items-center justify-center bg-transparent cursor-pointer transition-all duration-300 transform hover:scale-108 active:scale-95 focus:outline-none focus:ring-3 focus:ring-[#4A5D43]/40"
      >
        {/* SVG Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          {/* Subtle Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E3DACD"
            strokeWidth={strokeWidth}
            className="opacity-90"
          />

          {/* Dynamic Foreground Progress Stroke */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#4A5D43"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
        </svg>

        {/* Inner Clean White Circular Surface with Arrow */}
        <div className="w-[36px] h-[36px] rounded-full bg-white text-[#1A1816] shadow-md group-hover:shadow-lg group-hover:text-[#4A5D43] group-hover:bg-[#FAF8F5] flex items-center justify-center transition-colors duration-200 border border-[#E3DACD]">
          <ArrowUp
            className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5"
            strokeWidth={2.5}
          />
        </div>
      </button>
    </div>
  );
};
