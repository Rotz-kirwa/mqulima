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
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#FBBF24] via-[#F5A623] to-[#EAB308] opacity-65 blur-[6px] animate-pulse" />
      )}
      <svg
        width={size || undefined}
        height={size || undefined}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative z-10 ${className}`}
      >
        <defs>
          {/* Main Cybernetic Head Helmet Shell - Golden Sun Yellow */}
          <linearGradient id="aiHumanoidHead" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Deep Visor Glass Gradient */}
          <linearGradient id="aiVisorGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Glowing Eye Iris Gradient - Sun Amber Glow */}
          <linearGradient id="aiEyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F5A623" />
          </linearGradient>

          {/* Agricultural Sprout Crest Gradient */}
          <linearGradient id="aiCrestGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>

          {/* Torso & Collar Gradient */}
          <linearGradient id="aiTorsoCollar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Soft Filter Glow */}
          <filter id="aiHumanoidGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Cybernetic Torso & Shoulder Bust */}
        <path
          d="M 22 88 C 22 74, 36 68, 50 68 C 64 68, 78 74, 78 88 Z"
          fill="url(#aiTorsoCollar)"
          stroke="#F5A623"
          strokeWidth="1.5"
        />

        {/* Neck Circuit Connection */}
        <rect x="42" y="60" width="16" height="10" rx="3" fill="#0F172A" stroke="#FDE047" strokeWidth="1" />
        <line x1="50" y1="62" x2="50" y2="68" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />

        {/* 2. Ear Headset Pods */}
        {/* Left Ear Pod */}
        <rect x="11" y="34" width="10" height="22" rx="5" fill="#0F172A" stroke="#FDE047" strokeWidth="1.5" />
        <circle cx="16" cy="45" r="3" fill="#F5A623" />
        <circle cx="16" cy="45" r="1.2" fill="#FFFFFF" />

        {/* Right Ear Pod */}
        <rect x="79" y="34" width="10" height="22" rx="5" fill="#0F172A" stroke="#FDE047" strokeWidth="1.5" />
        <circle cx="84" cy="45" r="3" fill="#F5A623" />
        <circle cx="84" cy="45" r="1.2" fill="#FFFFFF" />

        {/* 3. Main Humanoid Helmet Head Shell */}
        <path
          d="M 20 40 C 20 20, 32 12, 50 12 C 68 12, 80 20, 80 40 C 80 60, 68 66, 50 66 C 32 66, 20 60, 20 40 Z"
          fill="url(#aiHumanoidHead)"
          stroke="#FEF08A"
          strokeWidth="1.5"
        />

        {/* Top Helmet Gloss Curve */}
        <path
          d="M 28 26 C 34 18, 44 16, 50 16 C 56 16, 66 18, 72 26 C 62 21, 38 21, 28 26 Z"
          fill="#FFFFFF"
          opacity="0.3"
        />

        {/* 4. Front Glossy Visor Screen */}
        <path
          d="M 26 34 C 26 24, 35 20, 50 20 C 65 20, 74 24, 74 34 C 74 52, 65 58, 50 58 C 35 58, 26 52, 26 34 Z"
          fill="url(#aiVisorGlass)"
          stroke="#F5A623"
          strokeWidth="1.5"
        />

        {/* Visor Lighting Reflection Arc */}
        <path
          d="M 30 27 C 40 23, 60 23, 70 27 C 62 25, 38 25, 30 27 Z"
          fill="#FFFFFF"
          opacity="0.35"
        />

        {/* 5. Humanoid Facial Features (Eyes, Cheeks & Smile) */}
        <g filter="url(#aiHumanoidGlow)">
          {/* Left Eye */}
          <ellipse cx="38" cy="38" rx="5.5" ry="6.5" fill="url(#aiEyeGlow)" />
          <circle cx="36.5" cy="36" r="2.2" fill="#FFFFFF" />
          <circle cx="40" cy="40" r="1" fill="#FFFFFF" opacity="0.8" />

          {/* Right Eye */}
          <ellipse cx="62" cy="38" rx="5.5" ry="6.5" fill="url(#aiEyeGlow)" />
          <circle cx="60.5" cy="36" r="2.2" fill="#FFFFFF" />
          <circle cx="64" cy="40" r="1" fill="#FFFFFF" opacity="0.8" />

          {/* Cheeks Glow Accent */}
          <ellipse cx="32" cy="46" rx="3.5" ry="1.8" fill="#F43F5E" opacity="0.45" />
          <ellipse cx="68" cy="46" rx="3.5" ry="1.8" fill="#F43F5E" opacity="0.45" />

          {/* Expressive Friendly Smile */}
          <path
            d="M 40 48 C 45 54, 55 54, 60 48"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* 6. Agricultural Sprout Crest (Crown Antenna) */}
        <path d="M 50 12 V 4" stroke="url(#aiCrestGold)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="4" r="3.5" fill="url(#aiCrestGold)" stroke="#F5A623" strokeWidth="1" />
        {/* Sprout Leaves */}
        <path d="M 50 9 C 43 7, 41 1, 41 1 C 45 5, 50 9, 50 9 Z" fill="#FDE047" />
        <path d="M 50 9 C 57 7, 59 1, 59 1 C 55 5, 50 9, 50 9 Z" fill="#F5A623" />

        {/* 7. Headset Microphone Arm & Tip */}
        <path
          d="M 16 52 C 16 66, 30 70, 42 70"
          fill="none"
          stroke="#FDE047"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="40" y="67.5" width="8" height="5" rx="2.5" fill="#FEF08A" stroke="#0F172A" strokeWidth="1" />
      </svg>
    </div>
  );
}




