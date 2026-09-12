"use client";

import { fmtMoney } from "@/lib/utils";
import { badgeScaleMarks, fmtScaleMoney, formatBadgeMonth, getBadgeTier } from "@/lib/badges";
import type { IncomeBadge } from "@/types";

type Variant = "compact" | "full";

export function IncomeBadgeCard({
  badge,
  variant = "full",
}: {
  badge: IncomeBadge;
  variant?: Variant;
}) {
  const current = getBadgeTier(badge.level);
  const next = getBadgeTier(badge.level + 1);
  const justUnlocked = badge.level > 0 && badge.percent === 0;
  const monthLabel = formatBadgeMonth(badge.month);
  const title = badge.level === 0 ? next.name : current.name;

  if (variant === "compact") {
    return <IncomeBadgeMini badge={badge} next={next} justUnlocked={justUnlocked} />;
  }

  return (
    <section
      className="badge-card"
      aria-label={`เหรียญรายได้ ${monthLabel}`}
    >
      <div className="flex items-center gap-3">
        <BadgeRing
          percent={badge.percent}
          color={justUnlocked ? current.color : next.color}
          level={badge.level}
          size={variant === "full" ? 76 : 60}
        />

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-[#5C6B57]">
            เป้าหมายรายได้ · {monthLabel}
          </div>
          <div className="mt-0.5 font-bold text-[15px] leading-tight text-[#1F2E1C]">
            {title}
          </div>
          <div className="num mt-0.5 text-sm" style={{ color: next.color }}>
            ฿{fmtMoney(badge.total)}
            <span className="text-[#8A9784] font-semibold"> / ฿{fmtMoney(badge.next_threshold)}</span>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-[#5C6B57]">
            {justUnlocked
              ? `ปลดล็อกแล้ว · ถัดไป ${next.name} ฿${fmtMoney(next.threshold)}`
              : `อีก ฿${fmtMoney(badge.remaining)} ถึง ${next.name}`}
          </p>
        </div>
      </div>

      <IncomeScale badge={badge} />
    </section>
  );
}

function IncomeBadgeMini({
  badge,
  next,
  justUnlocked,
}: {
  badge: IncomeBadge;
  next: ReturnType<typeof getBadgeTier>;
  justUnlocked: boolean;
}) {
  const from = badge.current_threshold;
  const to = badge.next_threshold;

  return (
    <section className="badge-mini" aria-label={`เป้าหมายช่วง ฿${fmtMoney(from)} ถึง ฿${fmtMoney(to)}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="num text-[12px] text-[#1F2E1C]">
          ฿{fmtMoney(from)}
          <span className="text-[#8A9784]"> → </span>
          ฿{fmtMoney(to)}
        </span>
        <span className="text-[11px] text-[#5C6B57]">
          {justUnlocked ? `ถึงแล้ว · ${next.name}` : `อีก ฿${fmtMoney(badge.remaining)}`}
        </span>
      </div>
      <div
        className="badge-mini-bar"
        role="progressbar"
        aria-valuemin={from}
        aria-valuemax={to}
        aria-valuenow={badge.total}
      >
        <div
          className="badge-mini-fill"
          style={{ width: `${badge.percent}%`, background: next.color }}
        />
      </div>
      <div className="flex justify-between">
        <span className="num text-[10px] text-[#8A9784]">฿{fmtMoney(badge.total)}</span>
        <span className="num text-[10px] text-[#8A9784]">฿{fmtMoney(to)}</span>
      </div>
    </section>
  );
}

function IncomeScale({ badge }: { badge: IncomeBadge }) {
  const { last, marks } = badgeScaleMarks(badge.total);
  const fill = last > 0 ? Math.min(100, (badge.total / last) * 100) : 0;
  const nextColor = getBadgeTier(badge.level + 1).color;

  return (
    <div className="badge-scale" aria-label="เส้นเป้าหมายรายได้">
      <div
        className="badge-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={badge.total}
      >
        <div className="badge-bar-fill" style={{ width: `${fill}%`, background: nextColor }} />
        {marks.map((value) => (
          <span
            key={value}
            className={`badge-scale-mark${badge.total >= value ? " badge-scale-mark-earned" : ""}`}
            style={{
              left: `${(value / last) * 100}%`,
              transform: value === 0 ? "translate(0, -50%)" : value === last ? "translate(-100%, -50%)" : undefined,
            }}
            title={`฿${fmtMoney(value)}`}
          />
        ))}
        <span
          className="badge-scale-now"
          style={{ left: `${fill}%` }}
          title={`฿${fmtMoney(badge.total)}`}
        />
      </div>
      <div className="badge-scale-labels">
        {marks.map((value) => {
          const isFirst = value === 0;
          const isLast = value === last;
          return (
            <div
              key={value}
              className="badge-scale-label"
              style={{
                left: `${(value / last) * 100}%`,
                transform: isFirst ? "none" : isLast ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              <div className="num text-[10px] text-[#8A9784]">{fmtScaleMoney(value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BadgeRing({
  percent,
  color,
  level,
  size,
}: {
  percent: number;
  color: string;
  level: number;
  size: number;
}) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <div className="badge-ring" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(47,107,58,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="badge-medal" style={{ background: `linear-gradient(145deg, ${color}, #1F4D28)` }}>
        <TennisBallIcon />
        {level > 0 && <span className="badge-level num">{level}</span>}
      </div>
    </div>
  );
}

function TennisBallIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" fill="#F3EFE4" />
      <path
        d="M6.2 7.2c2.8 2.2 3.4 5.8 1.6 9.1"
        stroke="#2F6B3A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17.8 7.2c-2.8 2.2-3.4 5.8-1.6 9.1"
        stroke="#2F6B3A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IncomeBadgeSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="badge-mini" aria-busy="true">
        <div className="skeleton h-2.5 w-28 mb-2" />
        <div className="skeleton h-1.5 w-full rounded-full" />
      </div>
    );
  }

  return (
    <div className="badge-card" aria-busy="true">
      <div className="flex items-center gap-3">
        <div className="skeleton rounded-full" style={{ width: 76, height: 76 }} />
        <div className="flex-1">
          <div className="skeleton h-2.5 w-28 mb-2" />
          <div className="skeleton h-4 w-24 mb-2" />
          <div className="skeleton h-3 w-36" />
        </div>
      </div>
    </div>
  );
}
