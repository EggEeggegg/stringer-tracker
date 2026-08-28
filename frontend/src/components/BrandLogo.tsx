"use client";

import { useState } from "react";

type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "w-12 h-12",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

interface Props {
  size?: Size;
  className?: string;
}

/** Brand mark using the Stringer Tracker logo. */
export function BrandLogo({ size = "sm", className = "" }: Props) {
  const [bump, setBump] = useState(false);

  return (
    <button
      type="button"
      className={`brand-logo ${SIZE_CLASS[size]} ${bump ? "brand-logo-bump" : ""} ${className}`}
      aria-label="Stringer Tracker"
      onClick={() => {
        setBump(false);
        requestAnimationFrame(() => setBump(true));
      }}
      onAnimationEnd={() => setBump(false)}
    >
      <img src="/logo.png" alt="" className="brand-logo-img" draggable={false} />
    </button>
  );
}
