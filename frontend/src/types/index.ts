export interface User {
  id: string;
  username: string;
  name: string;
  role: "admin" | "user";
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RecordType = "string" | "sale" | "demo" | "grip" | "other";

export interface Record {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  seq: number;
  record_type: RecordType;
  racket: string;
  string1: string;
  string2: string;
  price: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export const RECORD_TYPE_LABELS: { [K in RecordType]: string } = {
  string: "ขึ้นเอ็น",
  sale: "ค่าคอมขายไม้",
  demo: "ค่าบริการ Demo ไม้เทนนิส",
  grip: "พัน Grip",
  other: "อื่นๆ",
};

export const GRIP_KINDS = ["Overgrip", "Replacement", "Leather"] as const;
export type GripKind = (typeof GRIP_KINDS)[number];

export function isGripKind(value: string): value is GripKind {
  return (GRIP_KINDS as readonly string[]).includes(value);
}

export function isOtherIncome(type: string): boolean {
  return type === "demo" || type === "grip" || type === "other";
}

export interface DaySummary {
  date: string; // YYYY-MM-DD
  count: number;
  total: number;       // รายได้รวมทุกประเภท
  sale_count: number;  // จำนวนค่าคอมขายไม้
  sale_total: number;  // ยอดค่าคอมขายไม้
  other_count: number; // จำนวนรายได้อื่นๆ (demo/grip/other)
  other_total: number; // ยอดรายได้อื่นๆ
}

export interface MonthSummary {
  month: string; // YYYY-MM
  count: number;
  total: number;
  sale_count: number;
  sale_total: number;
  other_count: number;
  other_total: number;
}

export interface UserReport {
  user_id: string;
  name: string;
  username: string;
  count: number;
  total: number;
  count_200: number;
  count_300: number;
  sale_count: number;
  sale_total: number;
  other_count: number;
  other_total: number;
}

export interface AdminReportResponse {
  users: UserReport[];
  grand_total: number;
  grand_count: number;
  grand_other_total: number;
  grand_other_count: number;
  period: { start: string; end: string; as_of: string };
}

export type ToastType = "success" | "error" | "warning";

export interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}
