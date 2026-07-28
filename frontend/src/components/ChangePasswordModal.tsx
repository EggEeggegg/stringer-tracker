"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { toast } from "@/components/Toast";

interface Props {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: Props) {
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!form.old_password || !form.new_password) {
      setError("กรุณากรอกรหัสผ่านให้ครบ");
      return;
    }
    if (form.new_password.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (form.new_password !== form.confirm) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
      });
      toast("เปลี่ยนรหัสผ่านสำเร็จ", "success");
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
      setError(
        msg.includes("old password") || msg.includes("incorrect")
          ? "รหัสผ่านปัจจุบันไม่ถูกต้อง"
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-[rgba(47,107,58,0.2)] rounded-full mx-auto mb-4" />

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-[#1F2E1C]">เปลี่ยนรหัสผ่าน</h3>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 mb-4 text-[#C44B4B] text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[#5C6B57] mb-1 block">รหัสผ่านปัจจุบัน *</label>
            <input
              className="inp"
              type="password"
              autoComplete="current-password"
              value={form.old_password}
              onChange={(e) => setForm({ ...form, old_password: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-[#5C6B57] mb-1 block">รหัสผ่านใหม่ *</label>
            <input
              className="inp"
              type="password"
              autoComplete="new-password"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-[#5C6B57] mb-1 block">ยืนยันรหัสผ่านใหม่ *</label>
            <input
              className="inp"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button className="btn-ghost flex-1" onClick={onClose} type="button">
            ยกเลิก
          </button>
          <button
            className="btn-primary flex-[2] disabled:opacity-60"
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
