import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Truck
} from "lucide-react";
import { HeroSlide } from "../../types";

interface HeroSliderProps {
  slides?: HeroSlide[];
  shopPhone?: string;
  onExploreClick?: () => void;
  onActionClick?: (link: string) => void;
}

const DEFAULT_FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: "default-slide-1",
    title: "Transform Your Home with Timeless Décor",
    subtitle: "Exclusive Pakistani Home Décor",
    badge: "Modern Elegance",
    description:
      "Breathtaking Islamic wall calligraphy, bespoke oversized clocks, and stylish statement pieces created to elevate every corner of your home.",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=85",
    buttonText: "Explore Collection",
    buttonLink: "/products",
    active: true,
    order: 1
  },
  {
    id: "default-slide-2",
    title: "Royal Islamic Calligraphy & Metal Sculptures",
    subtitle: "Spiritual Elegance for Modern Spaces",
    badge: "Ayatul Kursi & 4 Qul",
    description:
      "Precision laser-cut stainless steel and acrylic calligraphy with electroplated rich gold and matte black artisan finishes.",
    image:
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=2000&q=85",
    buttonText: "View Islamic Art",
    buttonLink: "/products",
    active: true,
    order: 2
  },
  {
    id: "default-slide-3",
    title: "Decorative Clocks, Mirrors & Ambient Living",
    subtitle: "Curated Drawing Room Aesthetics",
    badge: "Statement Décor Pieces",
    description:
      "Infuse warmth and prestige into your living rooms with sunburst bevelled mirrors, silent sweep luxury wall clocks, and Moroccan brass lanterns.",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2000&q=85",
    buttonText: "Discover Living Décor",
    buttonLink: "/products",
    active: true,
    order: 3
  }
];

// Check if URL points to video media
const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split("?")[0];
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".ogg") ||
    cleanUrl.endsWith(".mov") ||
    url.includes("/video/") ||
    url.includes("video/upload")
  );
};

// Global in-memory cache to keep preloaded media decoded and hot in memory
const preloadedMediaCache = new Set<string>();

const preloadSlideMedia = (slide?: HeroSlide) => {
  if (!slide?.image) return;
  const url = slide.image;
  if (preloadedMediaCache.has(url)) return;

  if (isVideoUrl(url)) {
    const vid = document.createElement("video");
    vid.preload = "auto";
    vid.muted = true;
    vid.src = url;
    vid.load();
    preloadedMediaCache.add(url);
  } else {
    const img = new Image();
    img.src = url;
    if ("decode" in img) {
      img.decode().catch(() => {});
    }
    preloadedMediaCache.add(url);
  }
};

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides = [],
  shopPhone,
  onExploreClick,
  onActionClick
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const activeSlides = slides.filter((s) => s.active !== false);
  const displaySlides = activeSlides.length > 0 ? activeSlides : DEFAULT_FALLBACK_SLIDES;

  const handleButtonClick = (link: string) => {
    if (onActionClick) {
      onActionClick(link);
    } else if (onExploreClick) {
      onExploreClick();
    }
  };

  // Immediate preloading of ALL slides on mount so subsequent slides are ready in memory
  useEffect(() => {
    displaySlides.forEach(preloadSlideMedia);
  }, [displaySlides]);

  // Actively preload upcoming slide in sequence
  useEffect(() => {
    if (displaySlides.length <= 1) return;
    const nextIdx = (currentIndex + 1) % displaySlides.length;
    preloadSlideMedia(displaySlides[nextIdx]);
  }, [currentIndex, displaySlides]);

  // Keep currentIndex bounded if slides list changes
  useEffect(() => {
    if (currentIndex >= displaySlides.length) {
      setCurrentIndex(0);
      setPreviousIndex(0);
    }
  }, [displaySlides.length, currentIndex]);

  // Slide navigation with zero-gap crossfade transition
  const goToSlide = (nextIdx: number) => {
    if (nextIdx === currentIndex || displaySlides.length <= 1) return;

    // Ensure target slide media is warm in cache
    preloadSlideMedia(displaySlides[nextIdx]);

    setPreviousIndex(currentIndex);
    setCurrentIndex(nextIdx);
    setIsTransitioning(true);
  };

  const prevSlide = () => {
    goToSlide((currentIndex - 1 + displaySlides.length) % displaySlides.length);
  };

  const nextSlide = () => {
    goToSlide((currentIndex + 1) % displaySlides.length);
  };

  // Settle transition state after crossfade completes
  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setPreviousIndex(currentIndex);
    }, 700); // matches duration-700
    return () => clearTimeout(timer);
  }, [currentIndex, isTransitioning]);

  // Autoplay timer: Preloads the next slide 2s before end, then executes immediate transition
  useEffect(() => {
    if (displaySlides.length <= 1 || isPaused) return;

    const currentSlide = displaySlides[currentIndex];
    const isVideo = isVideoUrl(currentSlide?.image);
    const duration = isVideo ? 12000 : 6000;

    // Warm up next slide 2000ms prior to transition
    const preloadTimer = setTimeout(() => {
      const nextIdx = (currentIndex + 1) % displaySlides.length;
      preloadSlideMedia(displaySlides[nextIdx]);
    }, Math.max(1000, duration - 2000));

    const interval = setInterval(() => {
      nextSlide();
    }, duration);

    return () => {
      clearTimeout(preloadTimer);
      clearInterval(interval);
    };
  }, [displaySlides.length, isPaused, currentIndex, displaySlides]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
  };

  const activeSlide = displaySlides[currentIndex] || displaySlides[0];

  return (
    <>
      {/* Full-Bleed 100% Viewport Edge-to-Edge Hero Carousel */}
      <section
        id="hero"
        className="relative w-full min-h-[560px] sm:min-h-[600px] md:min-h-[640px] lg:min-h-[700px] xl:min-h-[750px] bg-[#1F2421] overflow-hidden flex flex-col justify-between"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Images/Videos for all slides: Layered with zero black delay */}
        {displaySlides.map((slide, idx) => {
          const isCurrent = idx === currentIndex;
          const isPrev = idx === previousIndex && isTransitioning;

          // Seamless Layering Strategy:
          // 1. Incoming slide sits on top (z-20) and transitions in from opacity-0 to opacity-100.
          // 2. Outgoing slide sits solidly beneath it (z-10, opacity-100) until incoming slide is fully visible.
          // 3. Inactive slides remain hidden (z-0, opacity-0) but loaded in DOM.
          // At NO point in time is the background ever exposed!
          let zIndexClass = "z-0 pointer-events-none";
          let opacityClass = "opacity-0";

          if (isCurrent) {
            zIndexClass = "z-20 pointer-events-auto";
            opacityClass = "opacity-100";
          } else if (isPrev) {
            zIndexClass = "z-10 pointer-events-none";
            opacityClass = "opacity-100";
          }

          const isVideo = isVideoUrl(slide.image);

          return (
            <div
              key={slide.id || `slide-bg-${idx}`}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${zIndexClass} ${opacityClass}`}
            >
              {isVideo ? (
                <video
                  src={slide.image}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onEnded={() => {
                    if (displaySlides.length > 1) {
                      nextSlide();
                    }
                  }}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <img
                  src={
                    slide.image ||
                    DEFAULT_FALLBACK_SLIDES[0].image
                  }
                  alt={slide.title}
                  loading="eager"
                  decoding="sync"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      DEFAULT_FALLBACK_SLIDES[0].image;
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Multi-Stop Full-Bleed Cinematic Contrast Overlays */}
        {/* Horizontal gradient: strong contrast on the left for text readability, fading to right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35 sm:from-black/85 sm:via-black/60 sm:to-black/25 lg:from-black/85 lg:via-black/50 lg:to-transparent pointer-events-none z-25" />
        {/* Vertical gradient: softens bottom and top edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none z-25" />

        {/* Slide Content: Centered Safe-Container with Single Active Slide (No Text Overlap) */}
        <div className="relative z-30 w-full flex-1 flex flex-col justify-center">
          <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-10 lg:px-16 xl:px-20 py-16 sm:py-24 lg:py-28">
            <div className="max-w-3xl min-h-[280px] sm:min-h-[340px] flex flex-col justify-center">
              {activeSlide && (
                <div
                  key={`slide-content-${currentIndex}`}
                  className="max-w-3xl space-y-4 sm:space-y-7 animate-in fade-in duration-500 ease-out"
                >
                  {/* Badge / Pill */}
                  <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/25 text-[#F2ECE4] text-xs font-semibold tracking-widest uppercase shadow-sm transition-colors self-start max-w-full truncate">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                    <span className="truncate">
                      {activeSlide.badge ||
                        activeSlide.subtitle ||
                        "Pakistani Artisan Crafted & Curated"}
                    </span>
                  </div>

                  {/* Grand Headline */}
                  <div className="space-y-2">
                    {activeSlide.subtitle && activeSlide.badge && (
                      <span className="text-xs sm:text-sm font-semibold text-[#C5A880] uppercase tracking-widest block drop-shadow-xs">
                        {activeSlide.subtitle}
                      </span>
                    )}
                    <h1 className="font-display text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-normal text-white tracking-tight leading-[1.15] drop-shadow-md">
                      {activeSlide.title || "Transform Your Home with Timeless Décor"}
                    </h1>
                  </div>

                  {/* Description */}
                  <p className="text-white text-sm sm:text-lg lg:text-xl leading-relaxed max-w-2xl font-normal drop-shadow-sm">
                    {activeSlide.description ||
                      "Discover elegant décor pieces, royal Islamic calligraphy, and bespoke clocks made to bring warmth and character to every room."}
                  </p>

                  {/* Action Button: Primary CTA only */}
                  <div className="pt-2 sm:pt-4 flex items-center">
                    {/* Primary Button */}
                    <button
                      type="button"
                      onClick={() => handleButtonClick(activeSlide.buttonLink || "/products")}
                      className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#4A5D43] hover:bg-[#3B4A35] active:scale-98 text-white rounded-xl text-xs sm:text-base font-medium tracking-wide shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 sm:gap-3 cursor-pointer group"
                    >
                      <span>{activeSlide.buttonText || "Explore Collection"}</span>
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Edge Arrow Button */}
        {displaySlides.length > 1 && (
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="hidden sm:flex absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/25 hover:border-white text-white items-center justify-center transition-all duration-200 cursor-pointer shadow-xl hover:scale-105 active:scale-95 group"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Right Edge Arrow Button */}
        {displaySlides.length > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="hidden sm:flex absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/25 hover:border-white text-white items-center justify-center transition-all duration-200 cursor-pointer shadow-xl hover:scale-105 active:scale-95 group"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Bottom Centered Pagination Dots & Counter */}
        {displaySlides.length > 1 && (
          <div className="relative z-40 pb-6 sm:pb-8 flex items-center justify-center">
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-xl">
              <div className="flex items-center gap-2">
                {displaySlides.map((_, idx) => (
                  <button
                    key={`indicator-${idx}`}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentIndex === idx
                        ? "w-8 sm:w-10 bg-white"
                        : "w-2.5 bg-white/40 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>

              <div className="w-px h-3.5 bg-white/30" />

              <span className="text-xs text-white/85 font-mono tracking-wider">
                0{currentIndex + 1} / 0{displaySlides.length}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Clean Feature Strip Immediately Below Full-Bleed Hero */}
      <div className="w-full bg-[#F2ECE4] border-b border-[#E3DACD] py-8 sm:py-10">
        <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-center">
            {/* 1. Nationwide Delivery */}
            <div className="bg-white p-5 rounded-2xl border border-[#E3DACD] shadow-2xs hover:border-[#4A5D43]/50 transition-colors flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] text-[#4A5D43] flex items-center justify-center shrink-0 border border-[#E3DACD]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-base text-[#1A1816] leading-tight">
                  Nationwide Delivery
                </h4>
                <p className="text-xs text-[#1F1F1F] mt-1 font-medium">
                  Cash on Delivery across Pakistan
                </p>
              </div>
            </div>

            {/* 2. Easy & Secure Ordering */}
            <div className="bg-white p-5 rounded-2xl border border-[#E3DACD] shadow-2xs hover:border-[#4A5D43]/50 transition-colors flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] text-[#4A5D43] flex items-center justify-center shrink-0 border border-[#E3DACD]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-base text-[#1A1816] leading-tight">
                  Easy & Secure Ordering
                </h4>
                <p className="text-xs text-[#1F1F1F] mt-1 font-medium">
                  Direct WhatsApp checkout
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

