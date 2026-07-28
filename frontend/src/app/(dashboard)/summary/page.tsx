"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { recordsApi } from "@/lib/api";
import { fmtDate, fmtMoney, today, MONTHS_TH } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";
import { RecordListSkeleton } from "@/components/Skeleton";
import { toast } from "@/components/Toast";
import type { DaySummary, MonthSummary, Record } from "@/types";
import { isOtherIncome } from "@/types";

type Mode = "daily" | "monthly" | "filter";
type RangePreset = "10d" | "1m" | "custom";

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const daysAgo = (n: number) => {
  const d = new Date(today() + "T12:00:00");
  d.setDate(d.getDate() - n);
  return toYMD(d);
};

const monthAgo = () => {
  const d = new Date(today() + "T12:00:00");
  d.setMonth(d.getMonth() - 1);
  return toYMD(d);
};

const rangeForPreset = (preset: RangePreset): { start: string; end: string } => {
  const end = today();
  if (preset === "10d") return { start: daysAgo(9), end };
  if (preset === "1m") return { start: monthAgo(), end };
  return { start: daysAgo(9), end };
};

function SummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) ?? "daily";

  const [mode, setMode] = useState<Mode>(initialMode);

  const [dailyData, setDailyData] = useState<DaySummary[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyLoaded, setDailyLoaded] = useState(false);

  const [monthlyData, setMonthlyData] = useState<MonthSummary[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const initialRange = rangeForPreset("10d");
  const [rangePreset, setRangePreset] = useState<RangePreset>("10d");
  const [start, setStart] = useState(initialRange.start);
  const [end, setEnd] = useState(initialRange.end);
  const [records, setRecords] = useState<Record[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterLoaded, setFilterLoaded] = useState(false);

  const applyPreset = (preset: RangePreset) => {
    setRangePreset(preset);
    if (preset === "custom") return;
    const range = rangeForPreset(preset);
    setStart(range.start);
    setEnd(range.end);
    setFilterLoaded(false);
  };

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    router.replace(`/summary?mode=${nextMode}`);
  };

  const fetchDaily = useCallback(() => {
    setDailyLoading(true);
    recordsApi
      .dailySummary()
      .then(setDailyData)
      .catch(() => toast("โหลดข้อมูลล้มเหลว", "error"))
      .finally(() => {
        setDailyLoading(false);
        setDailyLoaded(true);
      });
  }, []);

  const fetchMonthly = useCallback(() => {
    setMonthlyLoading(true);
    recordsApi
      .monthlySummary({ year })
      .then((data) => setMonthlyData(data || []))
      .catch(() => toast("โหลดข้อมูลล้มเหลว", "error"))
      .finally(() => setMonthlyLoading(false));
  }, [year]);

  const fetchFilter = useCallback(async () => {
    if (!start || !end) return;
    setFilterLoading(true);
    try {
      const data = await recordsApi.list({ start, end });
      setRecords(data);
      setFilterLoaded(true);
    } catch {
      toast("โหลดข้อมูลล้มเหลว", "error");
    } finally {
      setFilterLoading(false);
    }
  }, [start, end]);

  const exportExcel = async () => {
    if (!start || !end) {
      toast("กรุณาเลือกวันที่ก่อน", "error");
      return;
    }

    try {
      const res = await recordsApi.exportExcel(start, end);
      if (!res.ok) {
        toast("ดาวน์โหลดล้มเหลว", "error");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tennis-records-${start}-${end}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast("ดาวน์โหลดสำเร็จ", "success");
    } catch {
      toast("ดาวน์โหลดล้มเหลว", "error");
    }
  };

  const copyJobsList = async () => {
    if (!start || !end) {
      toast("กรุณาเลือกวันที่ก่อน", "error");
      return;
    }

    try {
      const res = await recordsApi.copyJobsList(start, end);
      const text = res.text;
      if (!text) {
        toast("ไม่มีข้อมูลที่จะคัดลอก", "error");
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      toast("คัดลอกรายการงานสำเร็จ", "success");
    } catch {
      toast("คัดลอกล้มเหลว", "error");
    }
  };

  useEffect(() => {
    if (mode === "daily" && !dailyLoaded) fetchDaily();
  }, [mode, dailyLoaded, fetchDaily]);

  useEffect(() => {
    if (mode === "monthly") fetchMonthly();
  }, [mode, year, fetchMonthly]);

  useEffect(() => {
    if (mode === "filter" && !filterLoaded) fetchFilter();
  }, [mode, filterLoaded, fetchFilter]);

  const dTotal = dailyData.reduce((sum, item) => sum + item.total, 0);
  const dSaleTotal = dailyData.reduce((sum, item) => sum + item.sale_total, 0);
  const dCount = dailyData.reduce((sum, item) => sum + item.count, 0);

  const mTotal = monthlyData.reduce((sum, item) => sum + item.total, 0);
  const mSaleTotal = monthlyData.reduce((sum, item) => sum + item.sale_total, 0);
  const mCount = monthlyData.reduce((sum, item) => sum + item.count, 0);

  const fStringRecords = records.filter((record) => record.record_type === "string");
  const fSaleRecords = records.filter((record) => record.record_type === "sale");
  const fOtherRecords = records.filter((record) => isOtherIncome(record.record_type));
  const fCount = fStringRecords.length;
  const fOtherCount = fOtherRecords.length;
  const fStringTotal = fStringRecords.reduce((sum, record) => sum + record.price, 0);
  const fOtherTotal = fOtherRecords.reduce((sum, record) => sum + record.price, 0);
  const c200 = fStringRecords.filter((record) => record.price === 200).length;
  const c300 = fStringRecords.filter((record) => record.price === 300).length;
  const saleCount = fSaleRecords.length;
  const saleTotal = fSaleRecords.reduce((sum, record) => sum + record.price, 0);
  const fTotal = fStringTotal + fOtherTotal + saleTotal;

  const MODES: { key: Mode; icon: string; label: string }[] = [
    { key: "daily", icon: "รายวัน", label: "รายวัน" },
    { key: "monthly", icon: "รายเดือน", label: "รายเดือน" },
    { key: "filter", icon: "ช่วงวันที่", label: "ช่วงวันที่" },
  ];

  return (
    <div className="max-w-lg mx-auto px-3 pt-4">
      <div className="text-center py-2 pb-4">
        <BrandLogo size="sm" />
        <h1 className="brand-title text-xl">String Tracker</h1>
      </div>

      <div
        className="flex rounded-[12px] p-1 mb-5"
        style={{ background: "rgba(47,107,58,0.06)", border: "1px solid rgba(47,107,58,0.12)" }}
      >
        {MODES.map((item) => (
          <button
            key={item.key}
            onClick={() => changeMode(item.key)}
            className="flex-1 py-[8px] rounded-[9px] text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1"
            style={
              mode === item.key
                ? { background: "#2F6B3A", color: "#fff" }
                : { color: "#5C6B57" }
            }
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {mode === "daily" && (
        <>
          <div className="mb-4">
            <p className="text-xs text-[#5C6B57]">7 วันล่าสุด</p>
          </div>

          {dailyLoading ? (
            <RecordListSkeleton rows={5} />
          ) : dailyData.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-[#5C6B57] text-sm">ยังไม่มีข้อมูล</div>
            </div>
          ) : (
            <>
              {dailyData.map((item, index) => {
                const stringCount = item.count - item.other_count - item.sale_count;
                const stringTotal = item.total - item.other_total - item.sale_total;
                const showGrand = item.sale_count > 0 || item.other_count > 0;

                return (
                <div
                  key={item.date}
                  className="record-item cursor-pointer"
                  style={{ animationDelay: `${index * 0.03}s` }}
                  onClick={() => router.push(`/daily?date=${item.date}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{fmtDate(item.date)}</div>
                      <div className="text-xs text-[#8A9784] mt-[2px]">
                        {stringCount} ขึ้นเอ็น
                        {item.sale_count > 0 && ` · ค่าคอม ${item.sale_count} รายการ`}
                        {item.other_count > 0 && ` · อื่นๆ ${item.other_count} รายการ`}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="num text-lg" style={{ color: "#2F6B3A" }}>
                        ฿{fmtMoney(stringTotal)} เอ็น
                      </div>
                      {item.sale_count > 0 && (
                        <div className="num text-xs" style={{ color: "#B8860B" }}>
                          +฿{fmtMoney(item.sale_total)} คอม
                        </div>
                      )}
                      {item.other_count > 0 && (
                        <div className="num text-xs" style={{ color: "#2A7A6E" }}>
                          +฿{fmtMoney(item.other_total)} อื่นๆ
                        </div>
                      )}
                      {showGrand && (
                        <div className="num text-xs font-bold" style={{ color: "#1F4D28" }}>
                          = ฿{fmtMoney(item.total)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}

              <div
                className="rounded-[14px] p-[14px] mt-2"
                style={{ background: "rgba(47,107,58,0.08)", border: "1px solid rgba(47,107,58,0.16)" }}
              >
                {(() => {
                  const dOtherTotal = dailyData.reduce((sum, item) => sum + item.other_total, 0);
                  const dOtherCount = dailyData.reduce((sum, item) => sum + item.other_count, 0);
                  const dSaleCount = dailyData.reduce((sum, item) => sum + item.sale_count, 0);
                  const dStringTotal = dTotal - dOtherTotal - dSaleTotal;
                  const dStringCount = dCount - dOtherCount - dSaleCount;
                  const showGrand = dSaleTotal > 0 || dOtherTotal > 0;

                  return (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-sm">รวมทั้งหมด</div>
                        <div className="text-xs text-[#5C6B57]">
                          {dStringCount} ขึ้นเอ็น · {dailyData.length} วัน
                          {dSaleCount > 0 && ` · ค่าคอม ${dSaleCount} รายการ`}
                          {dOtherCount > 0 && ` · อื่นๆ ${dOtherCount} รายการ`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="num text-xl" style={{ color: "#2F6B3A" }}>฿{fmtMoney(dStringTotal)} เอ็น</div>
                        {dSaleTotal > 0 && (
                          <div className="num text-sm" style={{ color: "#B8860B" }}>+฿{fmtMoney(dSaleTotal)} ค่าคอม</div>
                        )}
                        {dOtherTotal > 0 && (
                          <div className="num text-sm" style={{ color: "#2A7A6E" }}>+฿{fmtMoney(dOtherTotal)} อื่นๆ</div>
                        )}
                        {showGrand && (
                          <div className="num text-sm font-bold" style={{ color: "#1F4D28" }}>= ฿{fmtMoney(dTotal)} รวม</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </>
      )}

      {mode === "monthly" && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-[#5C6B57]">12 เดือนของปี {year}</p>
            <select
              className="inp w-[110px] px-3 py-2 text-sm text-[#1F2E1C]"
              style={{ backgroundColor: "#FFFcf5" }}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {Array.from({ length: 5 }, (_, index) => String(new Date().getFullYear() - index)).map((value) => (
                <option key={value} value={value} style={{ color: "#1F2E1C" }}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          {monthlyLoading ? (
            <RecordListSkeleton rows={4} />
          ) : monthlyData.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-[#5C6B57] text-sm">ไม่มีข้อมูลปี {year}</div>
            </div>
          ) : (
            <>
              {monthlyData.map((item, index) => {
                const [itemYear, month] = item.month.split("-");
                const stringCount = item.count - item.other_count - item.sale_count;
                const stringTotal = item.total - item.other_total - item.sale_total;
                const showGrand = item.sale_count > 0 || item.other_count > 0;

                return (
                  <div key={item.month} className="record-item" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px]">
                          {MONTHS_TH[parseInt(month, 10) - 1]} {itemYear}
                        </div>
                        <div className="text-xs text-[#8A9784] mt-[2px]">
                          {stringCount} ขึ้นเอ็น
                          {item.sale_count > 0 && ` · ค่าคอม ${item.sale_count} รายการ`}
                          {item.other_count > 0 && ` · อื่นๆ ${item.other_count} รายการ`}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="num text-xl" style={{ color: "#2F6B3A" }}>฿{fmtMoney(stringTotal)} เอ็น</div>
                        {item.sale_count > 0 && (
                          <div className="num text-sm" style={{ color: "#B8860B" }}>+฿{fmtMoney(item.sale_total)} คอม</div>
                        )}
                        {item.other_count > 0 && (
                          <div className="num text-sm" style={{ color: "#2A7A6E" }}>+฿{fmtMoney(item.other_total)} อื่นๆ</div>
                        )}
                        {showGrand && (
                          <div className="num text-sm font-bold" style={{ color: "#1F4D28" }}>
                            = ฿{fmtMoney(item.total)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                className="rounded-[14px] p-[14px] mt-2"
                style={{ background: "rgba(47,107,58,0.08)", border: "1px solid rgba(47,107,58,0.16)" }}
              >
                {(() => {
                  const mOtherTotal = monthlyData.reduce((sum, item) => sum + item.other_total, 0);
                  const mOtherCount = monthlyData.reduce((sum, item) => sum + item.other_count, 0);
                  const mSaleCount = monthlyData.reduce((sum, item) => sum + item.sale_count, 0);
                  const mStringTotal = mTotal - mOtherTotal - mSaleTotal;
                  const mStringCount = mCount - mOtherCount - mSaleCount;
                  const showGrand = mSaleTotal > 0 || mOtherTotal > 0;

                  return (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold">รวมทั้งหมด</div>
                        <div className="text-xs text-[#5C6B57]">
                          {mStringCount} ขึ้นเอ็น
                          {mSaleCount > 0 && ` · ค่าคอม ${mSaleCount} รายการ`}
                          {mOtherCount > 0 && ` · อื่นๆ ${mOtherCount} รายการ`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="num text-xl" style={{ color: "#2F6B3A" }}>฿{fmtMoney(mStringTotal)} เอ็น</div>
                        {mSaleTotal > 0 && (
                          <div className="num text-sm" style={{ color: "#B8860B" }}>+฿{fmtMoney(mSaleTotal)} ค่าคอม</div>
                        )}
                        {mOtherTotal > 0 && (
                          <div className="num text-sm" style={{ color: "#2A7A6E" }}>+฿{fmtMoney(mOtherTotal)} อื่นๆ</div>
                        )}
                        {showGrand && (
                          <div className="num text-sm font-bold" style={{ color: "#1F4D28" }}>= ฿{fmtMoney(mTotal)} รวม</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </>
      )}

      {mode === "filter" && (
        <>
          <div className="card mb-4">
            <label className="text-xs text-[#5C6B57] block mb-2">ช่วงเวลา</label>
            <div className="flex gap-2 mb-3">
              {(
                [
                  { key: "10d", label: "10 วัน" },
                  { key: "1m", label: "1 เดือน" },
                  { key: "custom", label: "กำหนดเอง" },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => applyPreset(item.key)}
                  className={rangePreset === item.key ? "chip-active" : "chip-inactive"}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {rangePreset === "custom" ? (
              <div className="flex gap-[10px] items-center">
                <div className="flex-1">
                  <label className="text-xs text-[#5C6B57] block mb-1">เริ่ม</label>
                  <input
                    type="date"
                    className="inp px-3 py-[10px] text-sm"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <span className="text-[#8A9784] mt-4">→</span>
                <div className="flex-1">
                  <label className="text-xs text-[#5C6B57] block mb-1">สิ้นสุด</label>
                  <input
                    type="date"
                    className="inp px-3 py-[10px] text-sm"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8A9784]">
                {fmtDate(start)} → {fmtDate(end)}
              </p>
            )}

            <button className="btn-primary w-full mt-4" onClick={fetchFilter} disabled={filterLoading}>
              {filterLoading ? "กำลังโหลด..." : "ค้นหา"}
            </button>
            {filterLoaded && (
              <>
                <button className="btn-ghost w-full mt-2" onClick={exportExcel}>
                  Export Excel
                </button>
                <button className="btn-ghost w-full mt-2" onClick={copyJobsList}>
                  คัดลอกรายการงาน
                </button>
              </>
            )}
          </div>

          {filterLoaded && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4 items-stretch">
                {[
                  { label: "จำนวนขึ้นเอ็น", value: fCount, unit: "รายการ", color: "#2F6B3A" },
                  { label: "รายได้ขึ้นเอ็น", value: `฿${fmtMoney(fStringTotal)}`, color: "#2F6B3A" },
                  { label: "จำนวนค่าคอม", value: saleCount, unit: "รายการ", color: "#B8860B" },
                  { label: "ยอดค่าคอม", value: `฿${fmtMoney(saleTotal)}`, color: "#B8860B" },
                ].map((item, index) => (
                  <div key={index} className="stat-card flex flex-col justify-between" style={{ animationDelay: `${index * 0.06}s` }}>
                    <div className="text-[#5C6B57] text-[11px] font-semibold mb-1">{item.label}</div>
                    <div className="num text-2xl" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-[11px] text-[#8A9784]">{item.unit ?? "\u00A0"}</div>
                  </div>
                ))}
                {fOtherCount > 0 && (
                  <>
                    <div className="stat-card flex flex-col justify-between" style={{ animationDelay: "0.24s" }}>
                      <div className="text-[#5C6B57] text-[11px] font-semibold mb-1">รายการอื่นๆ</div>
                      <div className="num text-2xl" style={{ color: "#2A7A6E" }}>{fOtherCount}</div>
                      <div className="text-[11px] text-[#8A9784]">รายการ</div>
                    </div>
                    <div className="stat-card flex flex-col justify-between" style={{ animationDelay: "0.3s" }}>
                      <div className="text-[#5C6B57] text-[11px] font-semibold mb-1">รายได้อื่นๆ</div>
                      <div className="num text-2xl" style={{ color: "#2A7A6E" }}>฿{fmtMoney(fOtherTotal)}</div>
                      <div className="text-[11px] text-[#8A9784]">&nbsp;</div>
                    </div>
                  </>
                )}
                {(saleCount > 0 || fOtherCount > 0) && (
                  <div className="stat-card col-span-2 flex flex-col justify-between" style={{ animationDelay: "0.36s" }}>
                    <div className="text-[#5C6B57] text-[11px] font-semibold mb-1">รายได้รวมทุกประเภท</div>
                    <div className="num text-2xl" style={{ color: "#1F4D28" }}>฿{fmtMoney(fTotal)}</div>
                    <div className="text-[11px] text-[#8A9784]">&nbsp;</div>
                  </div>
                )}
              </div>

              <div className="card">
                <h4 className="font-bold text-sm mb-3">แยกตามราคาขึ้นเอ็น</h4>
                <div className="flex gap-[10px]">
                  <div
                    className="flex-1 p-[14px] rounded-[12px]"
                    style={{ background: "rgba(47,107,58,0.08)", border: "1px solid rgba(47,107,58,0.16)" }}
                  >
                    <div className="text-[11px] text-[#5C6B57] font-semibold">฿200</div>
                    <div className="num text-xl" style={{ color: "#2F6B3A" }}>{c200}</div>
                    <div className="text-xs text-[#8A9784]">= ฿{fmtMoney(c200 * 200)}</div>
                  </div>
                  <div
                    className="flex-1 p-[14px] rounded-[12px]"
                    style={{ background: "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.18)" }}
                  >
                    <div className="text-[11px] text-[#5C6B57] font-semibold">฿300</div>
                    <div className="num text-xl" style={{ color: "#B8860B" }}>{c300}</div>
                    <div className="text-xs text-[#8A9784]">= ฿{fmtMoney(c300 * 300)}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense>
      <SummaryContent />
    </Suspense>
  );
}
