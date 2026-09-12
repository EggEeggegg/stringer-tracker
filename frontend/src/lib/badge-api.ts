import { computeIncomeBadge } from "@/lib/badges";
import { getToken, today } from "@/lib/utils";
import type { IncomeBadge, MonthSummary } from "@/types";

function apiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "";
}

async function requestJson<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiBase()}${path}`, { headers });
  const data = await res.json().catch(() => ({ error: "Unknown error" }));
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export function emptyIncomeBadge(month?: string): IncomeBadge {
  return computeIncomeBadge(month ?? today().slice(0, 7), 0);
}

export async function fetchIncomeBadge(month?: string): Promise<IncomeBadge> {
  const key = month ?? today().slice(0, 7);
  const q = new URLSearchParams();
  if (month) q.set("month", month);
  const suffix = q.toString() ? `?${q}` : "";

  try {
    return await requestJson<IncomeBadge>(`/api/records/badge${suffix}`);
  } catch {
    try {
      const year = key.slice(0, 4);
      const rows = await requestJson<MonthSummary[]>(`/api/records/summary/monthly?year=${year}`);
      const total = rows.find((row) => row.month === key)?.total ?? 0;
      return computeIncomeBadge(key, total);
    } catch {
      return emptyIncomeBadge(key);
    }
  }
}