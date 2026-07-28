"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { ToastContainer } from "@/components/Toast";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { getToken, getStoredUser, clearAuth } from "@/lib/utils";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const stored = getStoredUser();
    if (stored) setUser(stored);

    authApi
      .me()
      .then((u) => {
        setUser(u);
        localStorage.setItem("tennis-tracker-user", JSON.stringify(u));
        setReady(true);
      })
      .catch(() => {
        clearAuth();
        router.replace("/login");
      });
  }, [router]);

  if (!ready && !user) {
    return <PageLoadingSkeleton />;
  }

  return (
    <div className="min-h-dvh pb-[calc(72px+env(safe-area-inset-bottom,0px))]">
      <ToastContainer />

      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <span className="text-sm text-[#5C6B57] max-w-[120px] truncate">{user?.name}</span>
        <button
          type="button"
          className="text-xs text-[#5C6B57] px-3 py-[6px] rounded-[8px] bg-[#FFFcf5] border border-[rgba(47,107,58,0.14)] hover:bg-[rgba(47,107,58,0.06)] shadow-sm"
          onClick={() => setShowPassword(true)}
        >
          รหัสผ่าน
        </button>
        <button
          type="button"
          className="text-xs text-[#5C6B57] px-3 py-[6px] rounded-[8px] bg-[#FFFcf5] border border-[rgba(47,107,58,0.14)] hover:bg-[rgba(47,107,58,0.06)] shadow-sm"
          onClick={() => {
            clearAuth();
            router.replace("/login");
          }}
        >
          ออก
        </button>
      </div>

      <div className="pt-16">{children}</div>

      <NavBar isAdmin={user?.role === "admin"} />

      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </div>
  );
}
