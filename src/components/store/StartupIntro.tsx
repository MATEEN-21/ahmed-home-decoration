import React, { useState, useEffect } from "react";

interface StartupIntroProps {
  onFinish?: () => void;
}

export const StartupIntro: React.FC<StartupIntroProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Subtle entry animation trigger on mount
    const mountTimer = setTimeout(() => {
      setMounted(true);
    }, 40);

    // Keep the brand logo visible smoothly for 2.4 seconds
    const exitTimer = setTimeout(() => {
      setFadingOut(true);

      // Finish smooth fade out (350ms) and open main UI instantly
      const completeTimer = setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 350);

      return () => clearTimeout(completeTimer);
    }, 2400);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(exitTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setVisible(false);
        if (onFinish) onFinish();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#FAF8F5] transition-opacity duration-350 ease-out cursor-pointer ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ willChange: "opacity" }}
      aria-label="Ahmed Home Decoration Intro"
    >
      <div
        className={`flex items-center justify-center p-6 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <img
          src="/logo.png"
          alt="Ahmed Home Decoration"
          className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 object-contain drop-shadow-md select-none"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

