import React from "react";

interface AIIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export function AIIcon({ className = "h-6 w-6", size, animated = true }: AIIconProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${animated ? "group" : ""}`}>
      {animated && (
        <span className="absolute -inset-1 rounded-full bg-[#F5C542]/20 blur-[8px] animate-pulse" />
      )}
      <svg
        width={size || undefined}
        height={size || undefined}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 ${className}`}
      >
        {/* Blue Speech Bubble (Bottom-Left) */}
        <path
          d="M 22 34 H 65 C 72.7 34 79 40.3 79 48 V 58 C 79 65.7 72.7 72 65 72 H 38 L 22 86 L 27 72 H 22 C 14.3 72 8 65.7 8 58 V 48 C 8 40.3 14.3 34 22 34 Z"
          fill="#3B66C4"
        />

        {/* Yellow Speech Bubble (Top-Right / Overlapping) */}
        <path
          d="M 44 14 H 78 C 85.7 14 92 20.3 92 28 V 44 C 92 51.7 85.7 58 78 58 H 63 L 53 71 L 56 58 H 44 C 36.3 58 30 51.7 30 44 V 28 C 30 20.3 36.3 14 44 14 Z"
          fill="#F5C542"
        />
      </svg>
    </div>
  );
}
