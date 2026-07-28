"use client";

interface Props {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "ยืนยัน",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div
        className="bg-[#FFFcf5] border border-[rgba(47,107,58,0.14)] rounded-[20px] p-6 mx-4 mb-[20vh] max-w-[340px] w-full shadow-[0_12px_40px_rgba(31,46,28,0.15)]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideUp 0.2s ease" }}
      >
        <div className="text-center mb-5">
          <div className="font-bold text-base text-[#1F2E1C]">{title}</div>
          {description && <div className="text-[#5C6B57] text-[13px] mt-1">{description}</div>}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={onCancel}>
            ยกเลิก
          </button>
          <button className="btn-danger flex-1" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
