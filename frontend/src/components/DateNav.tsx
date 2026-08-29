"use client";

import { useEffect, useMemo, useState } from "react";
import { fmtDateShort, MONTHS_TH, shiftDate, today, toISODate, WEEKDAYS_TH_SHORT } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (date: string) => void;
  recentDates: string[];
};

function monthCells(year: number, month0: number): (string | null)[] {
  const firstDow = new Date(year, month0, 1).getDay();
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toISODate(new Date(year, month0, day)));
  }
  return cells;
}

export function DateNav({ value, onChange, recentDates }: Props) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => new Date(`${value}T00:00:00`), [value]);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  useEffect(() => {
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
  }, [selected]);

  const isToday = value === today();
  const label = selected.toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const cells = monthCells(viewYear, viewMonth);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const pick = (date: string) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="date-nav-btn"
          aria-label="วันก่อนหน้า"
          onClick={() => onChange(shiftDate(value, -1))}
        >
          ‹
        </button>

        <button
          type="button"
          className="date-nav-current"
          aria-expanded={open}
          aria-label="เปิดปฏิทิน"
          onClick={() => setOpen((v) => !v)}
        >
          {isToday ? "วันนี้" : label}
        </button>

        <button
          type="button"
          className="date-nav-btn"
          aria-label="วันถัดไป"
          onClick={() => onChange(shiftDate(value, 1))}
        >
          ›
        </button>
      </div>

      {open && (
        <div className="date-cal">
          <div className="flex items-center mb-2">
            <button type="button" className="date-nav-btn" onClick={() => shiftMonth(-1)} aria-label="เดือนก่อน">
              ‹
            </button>
            <div className="flex-1 text-center text-[13px] font-semibold text-[#1F2E1C]">
              {MONTHS_TH[viewMonth]} {viewYear + 543}
            </div>
            <button type="button" className="date-nav-btn" onClick={() => shiftMonth(1)} aria-label="เดือนถัดไป">
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {WEEKDAYS_TH_SHORT.map((w) => (
              <div key={w} className="text-center text-[10px] font-semibold text-[#8A9784] py-0.5">
                {w}
              </div>
            ))}
            {cells.map((date, i) =>
              date ? (
                <button
                  key={date}
                  type="button"
                  className={
                    date === value
                      ? "cal-day cal-day-selected"
                      : date === today()
                        ? "cal-day cal-day-today"
                        : "cal-day"
                  }
                  onClick={() => pick(date)}
                >
                  {Number(date.slice(8))}
                </button>
              ) : (
                <div key={`empty-${i}`} />
              ),
            )}
          </div>
        </div>
      )}

      <div className="flex gap-[6px] overflow-x-auto pt-2 pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        <button
          type="button"
          className={isToday ? "chip-active" : "chip-inactive"}
          onClick={() => onChange(today())}
        >
          วันนี้
        </button>
        {recentDates
          .filter((date) => date !== today())
          .map((date) => (
            <button
              key={date}
              type="button"
              className={value === date ? "chip-active" : "chip-inactive"}
              onClick={() => onChange(date)}
            >
              {fmtDateShort(date)}
            </button>
          ))}
      </div>
    </div>
  );
}
