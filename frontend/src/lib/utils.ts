import { RECORD_TYPE_LABELS, type Record as JobRecord } from "@/types";

// ─── Date helpers ────────────────────────────────────────────────────────────

export const today = () => {
  const now = new Date();
  const thDate = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7 (Thailand)
  return thDate.toISOString().slice(0, 10);
};

export const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const fmtDateShort = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });

export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const WEEKDAYS_TH_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

// ─── Number helpers ───────────────────────────────────────────────────────────

export const fmtMoney = (n: number) => n.toLocaleString("th-TH");

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const TOKEN_KEY = "stringer-tracker-token";
export const USER_KEY = "stringer-tracker-user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── Copy jobs list ───────────────────────────────────────────────────────────

/** Same text format as GET /api/records/copy-list */
export function formatJobsCopyList(records: JobRecord[]): string {
  const sorted = [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.seq - b.seq;
  });

  const groups: { dateKey: string; items: string[] }[] = [];

  for (const rec of sorted) {
    const parts = rec.date.split("-");
    const dateKey = parts.length === 3 ? `${parts[2]}/${parts[1]}` : rec.date;

    let name = "";
    if (rec.record_type === "string" || !rec.record_type) {
      const s1 = (rec.string1 || "").trim();
      const s2 = (rec.string2 || "").trim();
      name = s1 && s2 ? `${s1} / ${s2}` : s1 || s2;
    } else if (rec.record_type === "sale") {
      name = "NEW RACKET";
    } else if (rec.record_type === "grip") {
      name = (rec.racket || "").trim() || "Grip";
    } else {
      name = RECORD_TYPE_LABELS[rec.record_type] ?? rec.record_type;
    }

    if (rec.note) name = `${name}(${rec.note})`;

    const existing = groups.find((g) => g.dateKey === dateKey);
    if (existing) existing.items.push(name);
    else groups.push({ dateKey, items: [name] });
  }

  return groups.map((g) => `${g.dateKey}\n${g.items.join("\n")}`).join("\n");
}

/**
 * Safari/iOS only allows clipboard writes during a user gesture.
 * Call this directly from a click handler — do not await a network request first.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // iOS Safari often rejects Clipboard API; fall through to execCommand.
    }
  }

  copyTextWithExecCommand(text);
}

function copyTextWithExecCommand(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("aria-hidden", "true");
  textarea.style.cssText =
    "position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;opacity:0;";
  document.body.appendChild(textarea);

  const isiOS =
    /ipad|iphone|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isiOS) {
    textarea.contentEditable = "true";
    textarea.readOnly = false;
    const range = document.createRange();
    range.selectNodeContents(textarea);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    textarea.setSelectionRange(0, text.length);
  } else {
    textarea.focus();
    textarea.select();
  }

  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!ok) throw new Error("copy failed");
}
