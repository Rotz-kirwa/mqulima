import { useState, useEffect } from "react";

export function WhatsAppButton() {
  const [isShop, setIsShop] = useState(false);

  useEffect(() => {
    setIsShop(window.location.pathname.startsWith("/shop"));
  }, []);

  return (
    <div className={`fixed ${isShop ? "bottom-[80px]" : "bottom-4"} md:bottom-6 right-4 md:right-6 z-40 flex items-center justify-center`}>
      {/* Expanding radar ping wave */}
      <span className="absolute h-12 w-12 md:h-14 md:w-14 animate-ping rounded-full bg-[#25D366]/60 duration-1000" />

      {/* Glowing static halo */}
      <span className="absolute h-14 w-14 md:h-16 md:w-16 animate-pulse rounded-full bg-[#25D366]/20" />

      <a
        href="https://wa.me/254723346134?text=Hi%20Mqulima%2C%20I%27d%20like%20help%20with..."
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="relative z-10 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgb(37,211,102,0.5)] transition-transform hover:scale-110 active:scale-95 duration-300"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 md:h-7 md:w-7 shrink-0 text-white fill-current"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18.403 5.633A8.919 8.919 0 0 0 12.053 3c-4.948 0-8.976 4.027-8.978 8.977 0 1.58.293 3.124.851 4.568l-.904 3.305 3.385-.888A8.945 8.945 0 0 0 12.05 19.96h.004c4.947 0 8.975-4.027 8.977-8.977a8.922 8.922 0 0 0-2.628-6.35zM12.053 18.31c-1.392 0-2.756-.374-3.95-1.082l-.283-.168-2.935.77.784-2.864-.184-.294A7.348 7.348 0 0 1 4.39 11.98c0-4.053 3.3-7.351 7.357-7.351 1.964 0 3.81.765 5.2 2.155a7.311 7.311 0 0 1 2.155 5.205c0 4.054-3.3 7.352-7.358 7.352zm4.014-5.495c-.22-.11-1.302-.642-1.503-.715-.202-.073-.348-.11-.495.11-.147.22-.569.715-.697.862-.128.147-.257.165-.477.055-.22-.11-.929-.342-1.77-1.092-1.2-1.07-1.123-1.569-.865-1.826.1-.1.22-.257.33-.385.11-.128.146-.22.22-.367.073-.147.037-.275-.018-.385-.055-.11-.495-1.193-.679-1.634-.18-.431-.376-.372-.514-.38-.138-.007-.294-.007-.45-.007-.156 0-.413.058-.624.288-.21.23-.807.789-.807 1.926 0 1.137.826 2.238.94 2.385.115.146 1.626 2.483 3.939 3.483.55.238.98.38 1.314.486.554.176 1.059.15 1.458.092.445-.067 1.303-.532 1.486-1.046.184-.514.184-.954.129-1.046-.055-.092-.202-.147-.422-.257z"
          />
        </svg>
      </a>
    </div>
  );
}
