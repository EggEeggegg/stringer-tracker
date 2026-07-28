"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

type Tab = {
  href: string;
  label: string;
  icon: ReactNode;
};

function IconDaily() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconSummary() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 19V10M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 20c1.5-3.2 4.2-5 8-5s6.5 1.8 8 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TABS: Tab[] = [
  { href: "/daily", label: "บันทึก", icon: <IconDaily /> },
  { href: "/summary", label: "สรุป", icon: <IconSummary /> },
];

const ADMIN_TAB: Tab = { href: "/admin", label: "Admin", icon: <IconAdmin /> };

const navStyle: CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  display: "flex",
  flexDirection: "row",
  alignItems: "stretch",
  justifyContent: "space-around",
  height: "calc(64px + env(safe-area-inset-bottom, 0px))",
  padding: "6px 8px max(6px, env(safe-area-inset-bottom, 0px))",
  background: "#FFFcf5",
  borderTop: "1.5px solid rgba(47, 107, 58, 0.18)",
  boxShadow: "0 -8px 28px rgba(31, 46, 28, 0.1)",
};

const itemStyle: CSSProperties = {
  flex: "1 1 0",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  textDecoration: "none",
  cursor: "pointer",
  touchAction: "manipulation",
  borderRadius: 12,
};

interface Props {
  isAdmin?: boolean;
}

export function NavBar({ isAdmin }: Props) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <nav style={navStyle} aria-label="เมนูหลัก">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              ...itemStyle,
              color: active ? "#2F6B3A" : "#5C6B57",
            }}
            aria-current={active ? "page" : undefined}
            prefetch
          >
            <span style={{ display: "flex", width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
