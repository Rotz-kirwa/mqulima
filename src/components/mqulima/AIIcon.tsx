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
        <span className="absolute -inset-1 rounded-full bg-[#00C4BF]/20 blur-[6px] animate-pulse" />
      )}
      <svg
        width={size || undefined}
        height={size || undefined}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 ${className}`}
      >
        {/* Outer Speech Bubble (Black outline with white fill) */}
        <path
          d="M 35 14 H 65 C 83 14 91 22 91 38 C 91 54 83 62 65 62 H 56 L 50 74 L 44 62 H 35 C 17 62 9 54 9 38 C 9 22 17 14 35 14 Z"
          fill="#FFFFFF"
          stroke="#0A1E0C"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cyan Paper Airplane */}
        {/* Right Wing (Filled Cyan Accent) */}
        <path
          d="M 68 28 L 47 51 L 55 59 Z"
          fill="#00C4BF"
          stroke="#00C4BF"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Left Wing (Cyan Outlined Wing) */}
        <path
          d="M 68 28 L 30 42 L 47 51 Z"
          fill="#FFFFFF"
          stroke="#00C4BF"
          strokeWidth="4.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Center Fold Line */}
        <path
          d="M 68 28 L 47 51"
          stroke="#00C4BF"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}





