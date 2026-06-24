import React from "react";

// Osho Chemical Industries: stylized green leaf and letter O icon
export function OshoLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 23C16 23 18 19 22 23C26 27 22 31 22 31C22 31 17 27 16 23Z" fill="#F5A623" opacity="0.8" />
      <path d="M20 12C20 12 23 9 26 12C29 15 26 19 26 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Truvets Techno Systems: circular shield with a T and vet cross icon
export function TruvetsLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="currentColor" />
      <path d="M12 14H28M20 14V28M15 21H25" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Kenagro Suppliers: stylized crop shoot leaf icon
export function KenagroLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30V10M10 20H18M18 20L28 10M18 20L28 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 15C24 13 27 12 28 10" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Amiram EA: circular droplet intersecting with a leaf icon
export function AmiramLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6C20 6 30 18 30 24C30 29.5228 25.5228 34 20 34C14.4772 34 10 29.5228 10 24C10 18 20 6 20 6Z" fill="currentColor" opacity="0.15" />
      <path d="M20 6C20 6 30 18 30 24C30 29.5228 25.5228 34 20 34C14.4772 34 10 29.5228 10 24C10 18 20 6 20 6Z" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 14C20 14 17 22 23 28" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Unga Farmcare EA: sun and stalks of wheat icon
export function UngaLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 20C14 20 17 14 20 14C23 14 26 20 26 20M20 14V26" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Agrosolutions Ltd: scientific leaf inside a hexagon icon
export function AgrosolutionsLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L32 13V27L20 34L8 27V13L20 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 12V28M20 18C20 18 25 17 25 21" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Cooper Cooperative Ltd: three interlocked loops icon
export function CooperLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="25" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="25" cy="25" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="15" r="8" stroke="#F5A623" strokeWidth="2" />
    </svg>
  );
}

// Norbrook: clean corporate crest icon
export function NorbrookLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 8H32V14L20 32L8 14V8Z" fill="currentColor" opacity="0.15" />
      <path d="M8 8H32V14L20 32L8 14V8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 14H26" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Highchem EA: hexagonal chemical structures icon
export function HighchemLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 10L25 15V25L15 30L5 25V15L15 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M25 10L35 15V25L25 30L15 25V15L25 10Z" stroke="#F5A623" strokeWidth="2" />
    </svg>
  );
}

// Merrychem: double-leaf M shape icon
export function MerrychemLogo({ className = "h-8 w-8 text-[#2D6A4F]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 28V14C8 14 12 8 20 14C28 20 32 14 32 14V28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 28V19C14 19 18 15 22 19C26 23 26 28 26 28" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
