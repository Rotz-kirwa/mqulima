/**
 * Mqulima Redesigned Emblem Brand Mark
 *
 * Visual elements matching the user's reference:
 * - Outer circle frame with a brown-to-gold linear gradient.
 * - Golden sun with radiating rays at the top center.
 * - Green agricultural rolling hills/field lines at the base.
 * - Small green leaf sprout on the left.
 * - Elegant line-art silhouettes of farm livestock:
 *   - Green goose/bird on the left.
 *   - Deep brown cow head in the center.
 *   - Green rooster with golden comb/wing details on the right.
 */
export function MqulimaLogo({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Ring linear gradient going from deep earth brown to harvest gold */}
        <linearGradient id="mqulimaRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B1F0A" /> {/* Deep brown */}
          <stop offset="60%" stopColor="#8B5A2B" /> {/* Warm earth */}
          <stop offset="100%" stopColor="#D4A017" /> {/* Harvest gold */}
        </linearGradient>
      </defs>

      {/* ── Outer Circular Frame ── */}
      <path
        d="M 6.5 33.8 A 21 21 0 1 1 41.5 33.8"
        stroke="url(#mqulimaRingGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* ── Sun & Rays (Top Center) ── */}
      <circle cx="24" cy="7.5" r="2.2" fill="#D4A017" />
      <path
        d="M 24 3.5 V 4.5 M 24 10.5 V 11.5 M 20 7.5 H 21 M 27 7.5 H 28 M 21.2 4.7 L 21.9 5.4 M 26.1 9.6 L 26.8 10.3 M 21.2 10.3 L 21.9 9.6 M 26.1 4.7 L 26.8 5.4"
        stroke="#D4A017"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* ── Green Rolling Fields (Base) ── */}
      <path
        d="M 5 33.8 Q 24 28 43 33.8"
        stroke="#2D6A2F"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M 6.2 36.8 Q 24 31.8 41.8 36.8"
        stroke="#2D6A2F"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M 7.5 39.8 Q 24 35.8 40.5 39.8"
        stroke="#2D6A2F"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* ── Sprout (Left side of fields) ── */}
      <path
        d="M 11.5 32 C 11.5 29 11 28.5 11 28.5"
        stroke="#2D6A2F"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Left sprout leaf */}
      <path
        d="M 11 28.5 C 9.2 27.5 8.2 29 9.6 30.2 C 10.5 31 11 29.5 11 28.5 Z"
        fill="#2D6A2F"
      />
      {/* Right sprout leaf */}
      <path
        d="M 11 28.5 C 12.8 28 13.2 29.8 11.8 31 C 11 31.8 11 30 11 28.5 Z"
        fill="#2D6A2F"
      />

      {/* ── Goose/Bird Silhouette (Left side, facing right) ── */}
      <path
        d="M 14.5 27 C 14.5 23 13.5 19 13.5 17 C 13.5 14.5 15.5 12.5 18 12.5 C 19 12.5 20.5 13 21 14 C 21 14 22.2 13.5 22.8 14 C 23.5 14.5 22.5 15.5 21.5 16 C 20.5 17 19.5 19 19.5 21 C 19.5 23 20 25.5 20.5 27"
        stroke="#2D6A2F"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="17.5" cy="15" r="0.6" fill="#2D6A2F" />

      {/* ── Cow Head Silhouette (Center, facing left) ── */}
      <path
        d="M 21.5 22.5 C 20 22 19 23 19 23.5 C 19 24.2 20.2 24.8 21.5 25 C 23 25.2 24.5 24.5 25 23 C 25.5 21.5 26.5 19.5 27.5 19.5"
        stroke="#3B1F0A"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 26 19.5 C 25 18.5 24.2 18.8 24.2 18.8 M 26 18.5 C 26.5 17.5 27 18 27 18"
        stroke="#3B1F0A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="23.2" cy="21.5" r="0.6" fill="#3B1F0A" />

      {/* ── Rooster/Chicken Silhouette (Right side, facing left) ── */}
      {/* Comb highlight */}
      <path
        d="M 27 16 C 26.8 15 27.5 14.5 28 15 C 28.5 14.5 29.2 15 29.5 15.8"
        stroke="#D4A017"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Head, beak & body */}
      <path
        d="M 26 19.5 C 26 18.5 25.5 17.5 26 17 C 26.5 16.5 27.5 17 28 17.5 C 28.5 17 29 16.5 29.5 17 C 30 17.5 29.5 18.5 29 19 C 29 19 30 18.5 30.5 19 C 31 19.5 30.5 20 29.5 20 C 28.5 20.5 27.5 21.5 27 23"
        stroke="#2D6A2F"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Wing feathers */}
      <path
        d="M 29.5 20.5 C 31 20 33 19 34.5 17.5 C 36 15.5 37 13.5 37 13.5 C 37 13.5 37.8 15.5 37.5 16.5 C 37 18 35.5 19.5 34 20.5 C 32 21.5 29.5 23 29.5 23"
        stroke="#2D6A2F"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 32.5 19.5 C 34 18.5 35 17 35 17 C 35 17 35.5 18.5 34.7 19.5 C 33.5 21 31.5 22 31.5 22"
        stroke="#2D6A2F"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
