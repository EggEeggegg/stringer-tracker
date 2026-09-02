import type { Record } from "@/types";
import { RECORD_TYPE_LABELS, isOtherIncome } from "@/types";
import { fmtDateTime } from "@/lib/utils";

interface Props {
  record: Record;
  onEdit: (r: Record) => void;
  onDelete: (id: string) => void;
}

export function RecordCard({ record: r, onEdit, onDelete }: Props) {
  const edited = r.updated_at !== r.created_at;
  const isSale = r.record_type === "sale";
  const isOther = isOtherIncome(r.record_type);
  const stringTitle = [r.string1, r.string2].filter(Boolean).join(" / ") || "ขึ้นเอ็น";

  return (
    <div className="record-item">
      <div className="flex justify-between items-start">
        <div className="flex gap-[10px] items-start flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center num font-bold text-sm text-white flex-shrink-0"
            style={{
              background: isOther
                ? "linear-gradient(135deg,#2A7A6E,#1F5C53)"
                : isSale
                ? "linear-gradient(135deg,#C9A227,#B8860B)"
                : "linear-gradient(135deg,#5B9A4A,#2F6B3A)",
            }}
          >
            {r.seq}
          </div>

          <div className="min-w-0">
            {isOther ? (
              <>
                <div className="flex items-center gap-[6px]">
                  <div className="font-bold text-sm truncate">
                    {r.record_type === "grip"
                      ? r.racket || RECORD_TYPE_LABELS.grip
                      : RECORD_TYPE_LABELS[r.record_type] ?? r.record_type}
                  </div>
                </div>
                <div
                  className="inline-flex items-center text-[10px] font-semibold px-[6px] py-[2px] rounded-full mt-[3px]"
                  style={{
                    background: "rgba(42,122,110,0.12)",
                    color: "#2A7A6E",
                    border: "1px solid rgba(42,122,110,0.25)",
                  }}
                >
                  รายได้อื่นๆ
                </div>
              </>
            ) : isSale ? (
              <>
                <div className="flex items-center gap-[6px]">
                  <div className="font-bold text-sm truncate">{RECORD_TYPE_LABELS.sale}</div>
                </div>
                <div
                  className="inline-flex items-center text-[10px] font-semibold px-[6px] py-[2px] rounded-full mt-[3px]"
                  style={{
                    background: "rgba(184,134,11,0.12)",
                    color: "#B8860B",
                    border: "1px solid rgba(184,134,11,0.25)",
                  }}
                >
                  ค่าคอมขายไม้
                </div>
              </>
            ) : (
              <>
                <div className="font-bold text-sm truncate">{stringTitle}</div>
                {r.racket && (
                  <div className="text-xs text-[#5C6B57] mt-[2px] truncate">{r.racket}</div>
                )}
                <div
                  className="inline-flex items-center text-[10px] font-semibold px-[6px] py-[2px] rounded-full mt-[3px]"
                  style={{
                    background: "rgba(47,107,58,0.12)",
                    color: "#2F6B3A",
                    border: "1px solid rgba(47,107,58,0.25)",
                  }}
                >
                  ขึ้นเอ็น
                </div>
              </>
            )}
            {r.note && <div className="text-[11px] text-[#8A9784] mt-[2px]">หมายเหตุ: {r.note}</div>}
            {edited && <span className="badge-edited">แก้ไข {fmtDateTime(r.updated_at)}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-[6px] flex-shrink-0 ml-2">
          <div className="text-right">
            <div
              className="num text-base"
              style={{
                color: isOther
                  ? "#2A7A6E"
                  : isSale
                  ? "#B8860B"
                  : r.price === 300
                  ? "#B8860B"
                  : "#2F6B3A",
              }}
            >
              ฿{r.price}
            </div>
          </div>
          <div className="flex gap-[6px]">
            <button
              className="btn-ghost px-[10px] py-[6px] text-[11px] rounded-[8px]"
              onClick={() => onEdit(r)}
            >
              แก้ไข
            </button>
            <button
              className="btn-danger px-[10px] py-[6px] text-[11px] rounded-[8px]"
              onClick={() => onDelete(r.id)}
            >
              ลบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
