import React from "react";

/**
 * Exact dual-leaf sprout logo matching the mobile UI mockup:
 * - Left leaf: light pear/lime green (#8CB63D)
 * - Right leaf: deep forest emerald green (#056B3A)
 */
export function SproutLogo({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Mqulima Sprout Logo"
    >
      {/* Left Leaf (Lighter Pear Green) */}
      <path
        d="M52 72 C32 70 14 54 18 36 C34 32 50 46 52 72 Z"
        fill="#8CB63D"
      />
      {/* Right Leaf (Deep Forest Emerald Green) */}
      <path
        d="M55 72 C56 42 74 14 102 6 C105 26 98 52 76 66 C66 72 58 72 55 72 Z"
        fill="#056B3A"
      />
    </svg>
  );
}

/**
 * Organic wave divider separating the top ivory/cream section
 * and the bottom deep green container.
 * Features the signature asymmetrical curve that rises on the left and slopes gently to the right.
 */
export function WaveDivider({ className = "w-full h-12 text-[#056B3A]" }: { className?: string }) {
  return (
    <div className={`overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 400 55"
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        <path
          d="M 0,22 C 45,2 105,4 160,20 C 240,42 320,42 400,40 L 400,55 L 0,55 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

/**
 * Social Icons: Facebook, Google, Apple
 */
export function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AppleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 170" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.77-7.96-12.24-14.64-5.92-8.87-10.4-18.78-13.43-29.74-3.03-10.95-4.55-21.57-4.55-31.84 0-14.02 3.63-25.75 10.89-35.18 7.26-9.43 16.48-14.24 27.67-14.43 4.8 0 10.15 1.25 16.05 3.75 5.91 2.5 9.71 3.75 11.4 3.75 1.57 0 5.48-1.33 11.74-3.98 6.25-2.66 11.66-3.87 16.23-3.64 12.39.73 22.42 5.56 30.08 14.5-10.92 6.64-16.27 15.74-16.04 27.31.23 9.07 3.59 16.74 10.07 23.01 6.49 6.27 14.28 9.87 23.38 10.8-2.35 6.89-4.8 13.54-7.36 19.93zM119.22 33.72c0-7.3 2.65-14.19 7.95-20.67 5.3-6.48 11.83-10.45 19.6-11.91.56 1.45.84 2.9.84 4.35 0 7.3-2.73 14.26-8.2 20.88-5.46 6.62-12.13 10.47-20.01 11.55-.11-1.4-.18-2.8-.18-4.2z" />
    </svg>
  );
}
