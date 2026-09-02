"use client";

import type { GripKind, Record, RecordType } from "@/types";
import { GRIP_KINDS, RECORD_TYPE_LABELS, isGripKind } from "@/types";
import { fmtDate } from "@/lib/utils";
import { useState } from "react";

interface Props {
  date: string;
  initial?: Partial<Record>;
  onSubmit: (data: {
    record_type: RecordType;
    racket: string;
    string1: string;
    string2: string;
    price: number;
    note: string;
  }) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const TYPE_TABS: { value: RecordType; label: string; color: string }[] = [
  { value: "string", label: "ขึ้นเอ็น", color: "#2F6B3A" },
  { value: "sale", label: "ค่าคอม", color: "#B8860B" },
  { value: "demo", label: "Demo", color: "#2A7A6E" },
  { value: "grip", label: "Grip", color: "#5B9A4A" },
  { value: "other", label: "อื่นๆ", color: "#5C6B57" },
];

function isCustomPriceType(t: RecordType) {
  return t === "demo" || t === "grip" || t === "other";
}

export function RecordForm({ date, initial, onSubmit, onClose, loading }: Props) {
  const isEdit = !!initial?.id;
  const [recordType, setRecordType] = useState<RecordType>(
    initial?.record_type ?? "string"
  );
  const [form, setForm] = useState({
    racket: initial?.racket ?? "",
    string1: (initial?.string1 ?? "").toUpperCase(),
    string2: (initial?.string2 ?? "").toUpperCase(),
    price: (initial?.record_type === "string" ? (initial?.price ?? 300) : 300) as 200 | 300,
    customPrice: isCustomPriceType(initial?.record_type ?? "string")
      ? String(initial?.price ?? "")
      : "",
    salePrice: initial?.record_type === "sale" ? String(initial?.price ?? 200) : "200",
    gripKind: (initial?.record_type === "grip" && initial?.racket && isGripKind(initial.racket)
      ? initial.racket
      : "Overgrip") as GripKind,
    note: initial?.note ?? "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (recordType === "string") {
      if (!form.string1.trim()) {
        setError("กรุณากรอกเอ็น Main");
        return;
      }
      await onSubmit({
        record_type: "string",
        racket: form.racket,
        string1: form.string1.trim().toUpperCase(),
        string2: form.string2.trim().toUpperCase(),
        price: form.price,
        note: form.note,
      });
      return;
    }

    if (recordType === "sale") {
      const parsedPrice = parseInt(form.salePrice, 10);
      if (!form.salePrice || Number.isNaN(parsedPrice) || (parsedPrice !== 200 && parsedPrice !== 500)) {
        setError("ค่าคอมขายไม้เลือกได้เฉพาะ 200 หรือ 500 บาท");
        return;
      }
      await onSubmit({
        record_type: "sale",
        racket: "",
        string1: "",
        string2: "",
        price: parsedPrice,
        note: form.note,
      });
      return;
    }

    const parsedPrice = parseInt(form.customPrice, 10);
    if (!form.customPrice || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("กรุณากรอกราคาให้ถูกต้อง (ตัวเลขมากกว่า 0)");
      return;
    }

    await onSubmit({
      record_type: recordType,
      racket: recordType === "grip" ? form.gripKind : "",
      string1: "",
      string2: "",
      price: parsedPrice,
      note: form.note,
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-[rgba(47,107,58,0.2)] rounded-full mx-auto mb-4" />

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-[#1F2E1C]">{isEdit ? "แก้ไขรายการ" : "เพิ่มรายการ"}</h3>
          <div className="text-xs text-[#5C6B57]">{fmtDate(date)}</div>
        </div>

        {!isEdit && (
          <div
            className="grid grid-cols-3 gap-1.5 p-1.5 mb-4 rounded-[12px]"
            style={{ background: "rgba(47,107,58,0.06)", border: "1px solid rgba(47,107,58,0.12)" }}
          >
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setRecordType(tab.value);
                  setError("");
                }}
                className="py-[10px] rounded-[9px] text-xs font-semibold transition-all duration-200"
                style={
                  recordType === tab.value
                    ? { background: tab.color, color: "#fff", boxShadow: "0 2px 8px rgba(31,46,28,0.12)" }
                    : { color: "#5C6B57", background: "transparent" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {isEdit && (
          <div className="bg-[rgba(184,134,11,0.1)] border border-[rgba(184,134,11,0.25)] rounded-[10px] px-3 py-2 mb-4 text-xs text-[#B8860B]">
            ประเภท: {RECORD_TYPE_LABELS[recordType]} · เวลาที่แก้ไขจะอัปเดตอัตโนมัติเมื่อบันทึก
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 mb-4 text-[#C44B4B] text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {recordType === "string" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#5C6B57] mb-1 block">เอ็น Main *</label>
                  <input
                    className="inp"
                    placeholder="MAIN"
                    value={form.string1}
                    onChange={(e) => setForm({ ...form, string1: e.target.value.toUpperCase() })}
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-[#5C6B57] mb-1 block">เอ็น Cross</label>
                  <input
                    className="inp"
                    placeholder="CROSS"
                    value={form.string2}
                    onChange={(e) => setForm({ ...form, string2: e.target.value.toUpperCase() })}
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#5C6B57] mb-1 block">ราคา</label>
                <div className="flex gap-3">
                  {([200, 300] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, price: p })}
                      className="flex-1 py-[14px] rounded-[12px] font-bold text-lg num cursor-pointer transition-all duration-150"
                      style={{
                        border: `2px solid ${
                          form.price === p
                            ? p === 200
                              ? "#2F6B3A"
                              : "#B8860B"
                            : "rgba(47,107,58,0.15)"
                        }`,
                        background:
                          form.price === p
                            ? p === 200
                              ? "rgba(47,107,58,0.1)"
                              : "rgba(184,134,11,0.1)"
                            : "rgba(255,252,245,0.8)",
                        color:
                          form.price === p
                            ? p === 200
                              ? "#2F6B3A"
                              : "#B8860B"
                            : "#5C6B57",
                      }}
                    >
                      ฿{p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {recordType === "sale" && (
            <div>
              <label className="text-xs text-[#5C6B57] mb-1 block">ค่าคอม (บาท)</label>
              <div className="flex gap-3">
                {([200, 500] as const).map((p) => {
                  const selected = form.salePrice === String(p);
                  const accent = p === 200 ? "#2F6B3A" : "#B8860B";
                  const accentBg =
                    p === 200 ? "rgba(47,107,58,0.1)" : "rgba(184,134,11,0.1)";
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, salePrice: String(p) })}
                      className="flex-1 py-[14px] rounded-[12px] font-bold text-lg num cursor-pointer transition-all duration-150"
                      style={{
                        border: `2px solid ${selected ? accent : "rgba(47,107,58,0.15)"}`,
                        background: selected ? accentBg : "rgba(255,252,245,0.8)",
                        color: selected ? accent : "#5C6B57",
                      }}
                    >
                      ฿{p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isCustomPriceType(recordType) && (
            <div className="flex flex-col gap-4">
              {recordType === "grip" && (
                <div>
                  <label className="text-xs text-[#5C6B57] mb-1 block">ชนิด Grip *</label>
                  <select
                    className="inp"
                    value={form.gripKind}
                    onChange={(e) =>
                      setForm({ ...form, gripKind: e.target.value as GripKind })
                    }
                    autoFocus
                  >
                    {GRIP_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-[#5C6B57] mb-1 block">
                  ราคา (บาท) * — {recordType === "grip" ? form.gripKind : RECORD_TYPE_LABELS[recordType]}
                </label>
                <input
                  className="inp"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  min="1"
                  value={form.customPrice}
                  onChange={(e) => setForm({ ...form, customPrice: e.target.value })}
                  autoFocus={recordType !== "grip"}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-[#5C6B57] mb-1 block">หมายเหตุ</label>
            <input
              className="inp"
              placeholder="ไม่จำเป็น"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button className="btn-ghost flex-1" onClick={onClose}>
            ยกเลิก
          </button>
          <button
            className={`${isEdit ? "btn-success" : "btn-primary"} flex-[2] disabled:opacity-60`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "เพิ่ม"}
          </button>
        </div>
      </div>
    </div>
  );
}
