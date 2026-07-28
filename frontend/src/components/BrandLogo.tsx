"use client";

import { useState } from "react";

type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "w-12 h-12",
  md: "w-14 h-14",
  lg: "w-16 h-16",
};

interface Props {
  size?: Size;
  className?: string;
}

/** Tennis racket + ball mark with light play animations. */
export function BrandLogo({ size = "sm", className = "" }: Props) {
  const [bump, setBump] = useState(false);

  return (
    <button
      type="button"
      className={`brand-logo ${SIZE_CLASS[size]} ${bump ? "brand-logo-bump" : ""} ${className}`}
      aria-label="String Tracker"
      onClick={() => {
        setBump(false);
        // restart bump animation
        requestAnimationFrame(() => setBump(true));
      }}
      onAnimationEnd={() => setBump(false)}
    >
      <svg viewBox="0 0 64 64" className="brand-logo-svg" aria-hidden>
        {/* racket head */}
        <ellipse
          className="brand-logo-head"
          cx="30"
          cy="26"
          rx="16"
          ry="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        {/* string grid */}
        <g className="brand-logo-strings" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.75">
          <path d="M18 18h24M17 24h26M17 30h26M18 36h24" />
          <path d="M22 12v28M28 10v32M34 10v32M40 12v28" />
        </g>
        {/* handle */}
        <path
          d="M36 40c2 3 6 10 8 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M42 50c1.2 2.2 2.4 4.2 3.2 5.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.2"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* ball */}
        <g className="brand-logo-ball">
          <circle cx="46" cy="16" r="7" fill="#E8F5E0" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M41.5 13.5c2 1.2 3.5 3.2 4 5.5M50.5 18.5c-2-1.2-3.5-3.2-4-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      </svg>
    </button>
  );
}
