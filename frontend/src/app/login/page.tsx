"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { authApi } from "@/lib/api";
import { TOKEN_KEY, USER_KEY } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(form);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      router.replace("/daily");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <BrandLogo size="lg" className="mb-4" />
          <h1 className="brand-title text-2xl">Stringer Tracker</h1>
          <p className="text-[#8A9784] text-xs mt-1">บันทึกการขึ้นเอ็นเทนนิส</p>
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <h2 className="font-bold text-base text-[#1F2E1C]">เข้าสู่ระบบ</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 text-[#C44B4B] text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-[#5C6B57] text-xs mb-1 block">ชื่อผู้ใช้</label>
            <input
              className="inp"
              type="text"
              placeholder="username"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-[#5C6B57] text-xs mb-1 block">รหัสผ่าน</label>
            <input
              className="inp"
              type="password"
              placeholder="******"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
