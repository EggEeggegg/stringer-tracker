"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { DateNav } from "@/components/DateNav";
import { IncomeBadgeCard, IncomeBadgeSkeleton } from "@/components/IncomeBadgeCard";
import { LevelUpCelebration } from "@/components/LevelUpCelebration";
import { RecordCard } from "@/components/RecordCard";
import { RecordForm } from "@/components/RecordForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RecordListSkeleton, StatGridSkeleton } from "@/components/Skeleton";
import { toast } from "@/components/Toast";
import { recordsApi } from "@/lib/api";
import { emptyIncomeBadge, fetchIncomeBadge } from "@/lib/badge-api";
import { computeIncomeBadge, getBadgeTier } from "@/lib/badges";
import { today, fmtMoney } from "@/lib/utils";
import type { IncomeBadge, Record, RecordType } from "@/types";
import { isOtherIncome } from "@/types";

type RecordFormInput = {
  record_type: RecordType;
  racket: string;
  string1: string;
  string2: string;
  price: number;
  note: string;
};

export default function DailyPage() {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") ?? today();
  const [selDate, setSelDate] = useState(initialDate);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<Record | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [recentDates, setRecentDates] = useState<string[]>([]);
  const [badge, setBadge] = useState<IncomeBadge>(() => emptyIncomeBadge());
  const [badgeLoading, setBadgeLoading] = useState(true);
  const [celebration, setCelebration] = useState<{
    headline: string;
    name: string;
    amount: number;
  } | null>(null);
  const [showStats, setShowStats] = useState(false);

  const loadRecords = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const data = await recordsApi.list({ date });
      setRecords(data);
    } catch {
      toast("โหลดข้อมูลล้มเหลว", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recordsApi
      .dailySummary()
      .then((ds) => setRecentDates(ds.map((d) => d.date).slice(0, 8)))
      .catch(() => {});

    fetchIncomeBadge()
      .then(setBadge)
      .catch(() => setBadge(emptyIncomeBadge()))
      .finally(() => setBadgeLoading(false));
  }, []);

  const applyBadgeDelta = (delta: number, date: string, firstEntry = false) => {
    setBadge((prev) => {
      const inMonth = date.startsWith(prev.month);
      if (delta === 0 || !inMonth) {
        if (firstEntry && delta > 0) {
          window.setTimeout(() => {
            setCelebration({
              headline: "เริ่มแล้ว!",
              name: "รายการแรก",
              amount: delta,
            });
          }, 0);
        }
        return prev;
      }
      const startedMonth = prev.total === 0 && delta > 0;
      const nextBadge = computeIncomeBadge(prev.month, prev.total + delta);
      if (nextBadge.level > prev.level) {
        const unlocked = getBadgeTier(nextBadge.level);
        window.setTimeout(() => {
          setCelebration({
            headline: "ปลดล็อกแล้ว!",
            name: unlocked.name,
            amount: unlocked.threshold,
          });
        }, 0);
      } else if (startedMonth || firstEntry) {
        window.setTimeout(() => {
          setCelebration({
            headline: "เริ่มแล้ว!",
            name: startedMonth ? "รายการแรกของเดือน" : "รายการแรก",
            amount: startedMonth ? nextBadge.total : delta,
          });
        }, 0);
      }
      return nextBadge;
    });
  };

  useEffect(() => {
    loadRecords(selDate);
  }, [selDate, loadRecords]);

  const stringRecords = records.filter((record) => record.record_type === "string");
  const saleRecords = records.filter((record) => record.record_type === "sale");
  const otherRecords = records.filter((record) => isOtherIncome(record.record_type));
  const stringTotal = stringRecords.reduce((sum, record) => sum + record.price, 0);
  const saleTotal = saleRecords.reduce((sum, record) => sum + record.price, 0);
  const otherTotal = otherRecords.reduce((sum, record) => sum + record.price, 0);
  const dayTotal = stringTotal + otherTotal + saleTotal;
  const saleCount = saleRecords.length;

  const handleCreate = async (data: RecordFormInput) => {
    setSaving(true);
    try {
      const created = await recordsApi.create({ date: selDate, ...data });
      const firstEntry = records.length === 0;
      setRecords((prev) => [...prev, created]);
      applyBadgeDelta(created.price, created.date, firstEntry);
      setShowForm(false);
      toast("เพิ่มสำเร็จ", "success");
      if (!recentDates.includes(selDate)) {
        setRecentDates((prev) => [selDate, ...prev].slice(0, 8));
      }
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: RecordFormInput) => {
    if (!editRecord) return;
    setSaving(true);
    try {
      const updated = await recordsApi.update(editRecord.id, data);
      applyBadgeDelta(updated.price - editRecord.price, updated.date);
      setRecords((prev) => prev.map((record) => (record.id === updated.id ? updated : record)));
      setEditRecord(null);
      toast("แก้ไขสำเร็จ", "success");
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const removed = records.find((record) => record.id === deleteId);
      await recordsApi.delete(deleteId);
      if (removed) applyBadgeDelta(-removed.price, removed.date);
      setRecords((prev) => prev.filter((record) => record.id !== deleteId));
      setDeleteId(null);
      toast("ลบแล้ว", "warning");
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "เกิดข้อผิดพลาด", "error");
    }
  };

  return (
    <div className="max-w-lg mx-auto px-3 pt-4">
      <div className="text-center py-2 pb-4">
        <BrandLogo size="sm" />
        <h1 className="brand-title text-xl">Stringer Tracker</h1>
        <p className="text-[#8A9784] text-xs mt-1">บันทึกการขึ้นเอ็นเทนนิส</p>
      </div>

      <DateNav value={selDate} onChange={setSelDate} recentDates={recentDates} />

      {badgeLoading ? (
        <IncomeBadgeSkeleton compact />
      ) : (
        <Link href="/summary?mode=monthly" className="block">
          <IncomeBadgeCard badge={badge} variant="compact" />
        </Link>
      )}

      {records.length > 0 && (
        <div className="mb-3">
          <button
            type="button"
            className="badge-mini-toggle"
            aria-expanded={showStats}
            onClick={() => setShowStats((open) => !open)}
          >
            <span>สถิติวันนี้</span>
            <span className="num text-[#2F6B3A]">฿{fmtMoney(dayTotal)}</span>
            <span className="badge-mini-toggle-chevron" aria-hidden>
              {showStats ? "▴" : "▾"}
            </span>
          </button>
          {showStats && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="stat-card">
                <div className="text-[#5C6B57] text-[10px] font-semibold">ขึ้นเอ็น</div>
                <div className="num text-xl mt-1 text-[#1F2E1C]">{stringRecords.length}</div>
              </div>
              <div className="stat-card">
                <div className="text-[#5C6B57] text-[10px] font-semibold">รายได้ขึ้นเอ็น</div>
                <div className="num text-xl mt-1 text-[#2F6B3A]">฿{fmtMoney(stringTotal)}</div>
              </div>
              {saleCount > 0 && (
                <>
                  <div className="stat-card">
                    <div className="text-[#5C6B57] text-[10px] font-semibold">จำนวนค่าคอม</div>
                    <div className="num text-xl mt-1 text-[#1F2E1C]">{saleCount}</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-[#5C6B57] text-[10px] font-semibold">ยอดค่าคอม</div>
                    <div className="num text-xl mt-1 text-[#B8860B]">฿{fmtMoney(saleTotal)}</div>
                  </div>
                </>
              )}
              {otherRecords.length > 0 && (
                <>
                  <div className="stat-card">
                    <div className="text-[#5C6B57] text-[10px] font-semibold">รายการอื่นๆ</div>
                    <div className="num text-xl mt-1 text-[#1F2E1C]">{otherRecords.length}</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-[#5C6B57] text-[10px] font-semibold">รายได้อื่นๆ</div>
                    <div className="num text-xl mt-1 text-[#2A7A6E]">฿{fmtMoney(otherTotal)}</div>
                  </div>
                </>
              )}
              {(otherRecords.length > 0 || saleCount > 0) && (
                <div className="stat-card col-span-2">
                  <div className="text-[#5C6B57] text-[10px] font-semibold">รวมทั้งหมด</div>
                  <div className="num text-xl mt-1 text-[#1F4D28]">฿{fmtMoney(dayTotal)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <>
          <StatGridSkeleton />
          <RecordListSkeleton rows={3} />
        </>
      ) : records.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-[#5C6B57] text-sm font-semibold">ยังไม่มีรายการ</div>
          <div className="text-[#8A9784] text-xs mt-1">กดปุ่ม + ด้านล่างเพื่อเพิ่ม</div>
        </div>
      ) : (
        records.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            onEdit={(item) => setEditRecord(item)}
            onDelete={(id) => setDeleteId(id)}
          />
        ))
      )}

      <button
        className="fab"
        onClick={() => {
          setEditRecord(null);
          setShowForm(true);
        }}
      >
        +
      </button>

      {showForm && (
        <RecordForm
          date={selDate}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          loading={saving}
        />
      )}

      {editRecord && (
        <RecordForm
          date={selDate}
          initial={editRecord}
          onSubmit={handleUpdate}
          onClose={() => setEditRecord(null)}
          loading={saving}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title="ลบรายการนี้?"
          description="การลบไม่สามารถย้อนกลับได้"
          confirmLabel="ลบเลย"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {celebration && (
        <LevelUpCelebration
          headline={celebration.headline}
          name={celebration.name}
          amount={celebration.amount}
          onDone={() => setCelebration(null)}
        />
      )}
    </div>
  );
}
