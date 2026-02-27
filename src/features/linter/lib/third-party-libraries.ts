export interface ThirdPartyLibrary {
  id: string;
  name: string;
  description: string;
  url: string;
  classes: string[];
}

export const THIRD_PARTY_LIBRARIES: ThirdPartyLibrary[] = [
  {
    id: "swiper",
    name: "Swiper",
    description: "Modern mobile touch slider with hardware accelerated transitions.",
    url: "https://swiperjs.com/",
    classes: [
      // Core
      "swiper",
      "swiper-wrapper",
      "swiper-slide",
      // Navigation
      "swiper-button-prev",
      "swiper-button-next",
      "swiper-button-disabled",
      "swiper-button-lock",
      // Pagination
      "swiper-pagination",
      "swiper-pagination-bullet",
      "swiper-pagination-bullet-active",
      "swiper-pagination-clickable",
      "swiper-pagination-lock",
      "swiper-pagination-hidden",
      "swiper-pagination-fraction",
      "swiper-pagination-custom",
      // Scrollbar
      "swiper-scrollbar",
      "swiper-scrollbar-drag",
      "swiper-scrollbar-lock",
      // Slide state
      "swiper-slide-active",
      "swiper-slide-duplicate-active",
      "swiper-slide-visible",
      "swiper-slide-next",
      "swiper-slide-prev",
      "swiper-slide-duplicate",
      "swiper-slide-duplicate-next",
      "swiper-slide-duplicate-prev",
      "swiper-slide-invisible-blank",
      // Container state
      "swiper-initialized",
      "swiper-horizontal",
      "swiper-vertical",
      "swiper-pointer-events",
      "swiper-free-mode",
      "swiper-grid",
      "swiper-grid-column",
      "swiper-watch-progress",
      "swiper-virtual",
      "swiper-css-mode",
      "swiper-centered",
      "swiper-autoheight",
      "swiper-3d",
      "swiper-ios",
      "swiper-backface-hidden",
      "swiper-android",
      // Effects
      "swiper-fade",
      "swiper-cube",
      "swiper-flip",
      "swiper-coverflow",
      "swiper-cards",
      // Lazy loading
      "swiper-lazy",
      "swiper-lazy-loaded",
      "swiper-lazy-loading",
      // Zoom
      "swiper-zoom-container",
      "swiper-zoom-target",
      // Legacy
      "swiper-container",
    ],
  },
];

// Derived set for O(1) lookups — computed once at module load, never duplicated elsewhere
export const THIRD_PARTY_CLASS_SET: Set<string> = new Set(THIRD_PARTY_LIBRARIES.flatMap((lib) => lib.classes));

export function isThirdPartyClass(className: string): boolean {
  return THIRD_PARTY_CLASS_SET.has(className);
}
