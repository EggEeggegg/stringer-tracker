"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/daily", label: "บันทึก" },
  { href: "/summary", label: "สรุป" },
];

interface Props {
  isAdmin?: boolean;
}

export function NavBar({ isAdmin }: Props) {
  const pathname = usePathname();

  const tabs = isAdmin ? [...TABS, { href: "/admin", label: "Admin" }] : TABS;

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="nav-item no-underline"
            style={{ color: active ? "#3b82f6" : "#3b4f6f" }}
          >
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
