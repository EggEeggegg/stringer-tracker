"use client";

import { useEffect, useMemo } from "react";
import { fmtMoney } from "@/lib/utils";

const COLORS = ["#2F6B3A", "#5B9A4A", "#B8860B", "#C9A227", "#F3EFE4", "#1F4D28"];

type Piece = {
  left: string;
  delay: string;
  duration: string;
  color: string;
  rotate: string;
  kind: "confetti" | "ball";
};

export function LevelUpCelebration({
  headline = "ปลดล็อกแล้ว!",
  name,
  amount,
  onDone,
}: {
  headline?: string;
  name: string;
  amount: number;
  onDone: () => void;
}) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        left: `${4 + ((index * 17) % 92)}%`,
        delay: `${(index % 8) * 0.05}s`,
        duration: `${1.15 + (index % 5) * 0.12}s`,
        color: COLORS[index % COLORS.length],
        rotate: `${(index * 47) % 360}deg`,
        kind: index % 7 === 0 ? "ball" : "confetti",
      })),
    []
  );

  useEffect(() => {
    const timer = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(timer);
    // Close once per mount; parent passes a fresh callback each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="badge-celebrate" role="status" aria-live="polite" onClick={onDone}>
      {pieces.map((piece, index) =>
        piece.kind === "ball" ? (
          <span
            key={index}
            className="badge-celebrate-ball"
            style={{
              left: piece.left,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
            }}
          >
            🎾
          </span>
        ) : (
          <span
            key={index}
            className="badge-celebrate-bit"
            style={{
              left: piece.left,
              background: piece.color,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              transform: `rotate(${piece.rotate})`,
            }}
          />
        )
      )}

      <div className="badge-celebrate-card" onClick={(event) => event.stopPropagation()}>
        <div className="badge-celebrate-emoji" aria-hidden>
          🎾
        </div>
        <div className="text-[13px] font-semibold text-[#5C6B57]">{headline}</div>
        <div className="mt-1 text-xl font-bold text-[#1F2E1C]">{name}</div>
        <div className="num mt-1 text-lg text-[#2F6B3A]">฿{fmtMoney(amount)}</div>
      </div>
    </div>
  );
}
