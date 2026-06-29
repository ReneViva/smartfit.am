"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  PrivateNavBadge,
  usePrivateNavBadges,
} from "../layout/private-nav-badge";
import { AdminIcon, type AdminIconName } from "./admin-icons";

const adminLinks: {
  href: string;
  icon: AdminIconName;
  label: string;
}[] = [
  { href: "/admin", icon: "overview", label: "Overview" },
  { href: "/admin/settings", icon: "settings", label: "Settings" },
  { href: "/admin/content", icon: "content", label: "Public Content" },
  { href: "/admin/gallery", icon: "gallery", label: "Gallery" },
  { href: "/admin/coaches", icon: "coaches", label: "Coaches" },
  { href: "/admin/packages", icon: "packages", label: "Packages" },
  { href: "/admin/categories", icon: "categories", label: "Categories" },
  { href: "/admin/customers", icon: "customers", label: "Customers" },
  { href: "/admin/notes", icon: "notes", label: "Notes" },
  { href: "/admin/logs", icon: "logs", label: "Logs" },
  { href: "/admin/data", icon: "data", label: "Data / Exports" },
  { href: "/admin/analytics", icon: "analytics", label: "Analytics" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { unseenNotesCount } = usePrivateNavBadges();

  return (
    <>
      <p className="px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
        Admin menu
      </p>
      <nav
        aria-label="Admin navigation"
        className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0"
      >
        {adminLinks.map((link) => (
          <Link
            aria-current={pathname === link.href ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors lg:w-full ${
              pathname === link.href
                ? "bg-brand text-white shadow-sm shadow-brand/20"
                : "text-secondary hover:bg-soft-blue hover:text-primary-active"
            }`}
            href={link.href}
            key={link.href}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                pathname === link.href
                  ? "bg-white/15 text-white"
                  : "bg-page text-secondary"
              }`}
            >
              <AdminIcon className="size-4" name={link.icon} />
            </span>
            <span className="min-w-0 flex-1 truncate">{link.label}</span>
            {link.href === "/admin/notes" ? (
              <PrivateNavBadge count={unseenNotesCount} />
            ) : null}
          </Link>
        ))}
      </nav>
    </>
  );
}
