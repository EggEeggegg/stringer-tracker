"use client";

import { useEffect, useState } from "react";
import { IncomeBadgeCard, IncomeBadgeSkeleton } from "@/components/IncomeBadgeCard";
import { emptyIncomeBadge, fetchIncomeBadge } from "@/lib/badge-api";
import type { IncomeBadge } from "@/types";

export function IncomeBadgeLoader({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const [badge, setBadge] = useState<IncomeBadge>(() => emptyIncomeBadge());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchIncomeBadge()
      .then((data) => {
        if (!cancelled) setBadge(data);
      })
      .catch(() => {
        if (!cancelled) setBadge(emptyIncomeBadge());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <IncomeBadgeSkeleton compact={variant === "compact"} />;
  return <IncomeBadgeCard badge={badge} variant={variant} />;
}
