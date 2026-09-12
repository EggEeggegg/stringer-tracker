import type { IncomeBadge } from "@/types";

export const BADGE_STEP = 3000;
const FIRST_STEP = 1000;
const LATE_STEP = 30000;

/** Unlocked amount at each level. Keep in sync with backend model.badgeThresholds. */
const THRESHOLDS = [
  0, 1000, 3000, 6000, 9000, 12000, 18000, 24000, 30000, 42000, 54000, 66000, 84000, 102000, 120000, 150000, 180000,
];

export function thresholdAt(level: number): number {
  if (level <= 0) return 0;
  if (level < THRESHOLDS.length) return THRESHOLDS[level];
  const last = THRESHOLDS.length - 1;
  return THRESHOLDS[last] + (level - last) * LATE_STEP;
}

export function levelFromTotal(total: number): number {
  const safe = Math.max(0, total);
  let level = 0;
  while (thresholdAt(level + 1) <= safe) level += 1;
  return level;
}

export function computeIncomeBadge(month: string, total: number): IncomeBadge {
  const safe = Math.max(0, total);
  const level = levelFromTotal(safe);
  const current = thresholdAt(level);
  const next = thresholdAt(level + 1);
  const step = next - current;
  return {
    month,
    total: safe,
    step,
    level,
    current_threshold: current,
    next_threshold: next,
    remaining: next - safe,
    percent: step > 0 ? Math.floor(((safe - current) * 100) / step) : 0,
  };
}

export type BadgeTier = {
  level: number;
  threshold: number;
  name: string;
  short: string;
  hint: string;
  color: string;
};

const TIER_COLORS = ["#8A9784", "#B8860B", "#7A8B74", "#C9A227", "#2F6B3A", "#2A7A6E", "#1F4D28"];

const START_TIER = { name: "วอร์มอัพ", short: "วอร์ม", hint: "รายการแรกแล้ว เก็บต่อให้ครบ ฿1,000" };

/** Tennis names for each goal. After the list, names cycle as ทัวร์ 2, 3, … */
const GOAL_TIERS = [
  { name: "เฟิร์สเสิร์ฟ", short: "เสิร์ฟ", hint: "ผ่านหลักแรกแล้ว" },
  { name: "แรลลี่", short: "แรลลี่", hint: "กำลังเข้าจังหวะ" },
  { name: "เอซ", short: "เอซ", hint: "เก็บแต้มขาดไม่ได้" },
  { name: "เบรกพอยต์", short: "เบรก", hint: "กดดันเกมต่อเนื่อง" },
  { name: "เซ็ต", short: "เซ็ต", hint: "ปิดเซ็ตแรกได้แล้ว" },
  { name: "แมตช์พอยต์", short: "แมตช์", hint: "อีกนิดถึงแชมป์" },
  { name: "แชมป์", short: "แชมป์", hint: "ปิดแมตช์เดือนนี้" },
  { name: "วินเนอร์", short: "วินเนอร์", hint: "ช็อตปิดเกม" },
  { name: "วอลเลย์", short: "วอลเลย์", hint: "ตัดจังหวะที่เน็ต" },
  { name: "ลอบ", short: "ลอบ", hint: "หลบขึ้นหลังคู่แข่ง" },
  { name: "ดรอปช็อต", short: "ดรอป", hint: "แตะเบาแต่เจ็บ" },
  { name: "สแมช", short: "สแมช", hint: "จบจุดจากบนฟ้า" },
  { name: "สไลซ์", short: "สไลซ์", hint: "ตัดลูกให้ต่ำ" },
  { name: "ท็อปสปิน", short: "สปิน", hint: "หมุนจัดขึ้นคอร์ต" },
  { name: "ครอสคอร์ต", short: "ครอส", hint: "เปิดมุมกว้าง" },
  { name: "ดาวน์เดอะไลน์", short: "ไลน์", hint: "เสียบเส้นตรง" },
  { name: "เซคคันด์เสิร์ฟ", short: "เสิร์ฟ 2", hint: "เสิร์ฟสำรองที่มั่น" },
  { name: "เลิฟเกม", short: "เลิฟ", hint: "เก็บเกมรวด" },
  { name: "ดีวซ์", short: "ดีวซ์", hint: "สู้กันแต้มต่อแต้ม" },
  { name: "แอดอิน", short: "แอดอิน", hint: "ได้แต้มได้เปรียบ" },
  { name: "โฮลด์", short: "โฮลด์", hint: "รักษาเกมเสิร์ฟ" },
  { name: "ไทเบรก", short: "ไทเบรก", hint: "ตัดสินเซ็ต" },
  { name: "ซูเปอร์ไท", short: "ซูเปอร์", hint: "แมตช์ไทเบรก" },
  { name: "โกลเด้นเซ็ต", short: "โกลเด้น", hint: "เซ็ตไม่มีเสียเกม" },
  { name: "แฮตทริกเอซ", short: "แฮตทริก", hint: "เอซติดกันสามลูก" },
  { name: "มาสเตอร์", short: "มาสเตอร์", hint: "ฟอร์มระดับทัวร์" },
  { name: "แกรนด์สแลม", short: "สแลม", hint: "ขึ้นสู่ทัวร์ใหญ่" },
  { name: "เวิลด์ทัวร์", short: "ทัวร์", hint: "ลุยทั่วโลก" },
  { name: "โอลิมปิก", short: "โอลิมปิก", hint: "เวทีสูงสุด" },
  { name: "เลเจนด์", short: "เลเจนด์", hint: "ชื่อนี้ต้องจดจำ" },
] as const;

export function getBadgeTier(level: number): BadgeTier {
  const safe = Math.max(0, level);
  if (safe === 0) {
    return {
      level: 0,
      threshold: 0,
      ...START_TIER,
      color: TIER_COLORS[0],
    };
  }

  const index = (safe - 1) % GOAL_TIERS.length;
  const tour = Math.floor((safe - 1) / GOAL_TIERS.length) + 1;
  const base = GOAL_TIERS[index];
  const suffix = tour > 1 ? ` ทัวร์ ${tour}` : "";

  return {
    level: safe,
    threshold: thresholdAt(safe),
    name: `${base.name}${suffix}`,
    short: tour > 1 ? `${base.short} ${tour}` : base.short,
    hint: tour > 1 ? `${base.hint} · รอบใหม่` : base.hint,
    color: TIER_COLORS[safe % TIER_COLORS.length],
  };
}

/** A few even ticks from ฿0 to the current goal. */
export function badgeScaleMarks(total: number): { last: number; marks: number[] } {
  const last = Math.max(FIRST_STEP, computeIncomeBadge("", total).next_threshold);
  const step = niceScaleStep(last);
  const marks: number[] = [];
  for (let value = 0; value < last; value += step) {
    if (last - value < step * 0.45) break;
    marks.push(value);
  }
  marks.push(last);
  return { last, marks };
}

function niceScaleStep(last: number): number {
  const candidates = [
    3000, 6000, 9000, 12000, 15000, 18000, 24000, 30000, 36000, 45000, 60000, 75000, 90000, 120000, 150000, 180000,
    240000, 300000,
  ];
  let best = BADGE_STEP;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const step of candidates) {
    if (step >= last) break;
    const segments = last / step;
    if (segments < 3 || segments > 5.5) continue;
    const score = Math.abs(segments - 4) + (last % step === 0 ? 0 : 0.5);
    if (score < bestScore) {
      bestScore = score;
      best = step;
    }
  }
  if (bestScore === Number.POSITIVE_INFINITY) {
    return Math.max(BADGE_STEP, Math.round(last / 4 / 3000) * 3000);
  }
  return best;
}

export function fmtScaleMoney(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000) return `${(value / 1000).toLocaleString("th-TH")}k`;
  return String(value);
}

export function formatBadgeMonth(month: string): string {
  const [year, mm] = month.split("-");
  const monthIndex = Number(mm) - 1;
  const names = [
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
  const label = names[monthIndex] ?? month;
  const buddhistYear = year ? String(Number(year) + 543) : "";
  return buddhistYear ? `${label} ${buddhistYear}` : label;
}
