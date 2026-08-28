"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { RecordCard } from "@/components/RecordCard";
import { RecordForm } from "@/components/RecordForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RecordListSkeleton, StatGridSkeleton } from "@/components/Skeleton";
import { toast } from "@/components/Toast";
import { recordsApi } from "@/lib/api";
import { today, fmtDateShort, fmtMoney } from "@/lib/utils";
import type { Record, RecordType } from "@/types";
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
  }, []);

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
      setRecords((prev) => [...prev, created]);
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
      await recordsApi.delete(deleteId);
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

      <div className="mb-4">
        <div className="flex items-center gap-[10px] mb-[10px]">
          <span className="font-bold text-sm">วันที่</span>
          <input
            type="date"
            value={selDate}
            onChange={(e) => setSelDate(e.target.value)}
            className="inp w-[160px] px-3 py-2 text-sm ml-auto"
          />
        </div>

        <div className="flex gap-[6px] overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
          <button
            className={selDate === today() ? "chip-active" : "chip-inactive"}
            onClick={() => setSelDate(today())}
          >
            วันนี้
          </button>
          {recentDates
            .filter((date) => date !== today())
            .map((date) => (
              <button
                key={date}
                className={selDate === date ? "chip-active" : "chip-inactive"}
                onClick={() => setSelDate(date)}
              >
                {fmtDateShort(date)}
              </button>
            ))}
        </div>
      </div>

      {records.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
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
    </div>
  );
}
