"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  PrivateNavBadge,
  usePrivateNavBadges,
} from "../layout/private-nav-badge";

type RegistrationIconName =
  | "general"
  | "lookup"
  | "inGym"
  | "notes"
  | "occupancy"
  | "rules";

const registrationLinks: {
  href: string;
  icon: RegistrationIconName;
  label: string;
}[] = [
  { href: "/registration/general", icon: "general", label: "General" },
  { href: "/registration", icon: "lookup", label: "Customer Lookup" },
  { href: "/registration/in-gym", icon: "inGym", label: "Currently In Gym" },
  { href: "/registration/notes", icon: "notes", label: "Notes" },
  { href: "/registration/occupancy", icon: "occupancy", label: "Occupancy" },
  { href: "/registration/rules", icon: "rules", label: "Reception Rules" },
];

function RegistrationIcon({
  className = "",
  name,
}: {
  className?: string;
  name: RegistrationIconName;
}) {
  const common = {
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  const paths: Record<RegistrationIconName, ReactNode> = {
    general: (
      <>
        <path d="m3 11 9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
    inGym: (
      <>
        <path d="M8 21v-2a4 4 0 0 1 8 0v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M20 8v6" />
        <path d="M23 11h-6" />
      </>
    ),
    lookup: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    notes: (
      <>
        <path d="M7 3h8l4 4v14H7z" />
        <path d="M15 3v5h5" />
        <path d="M10 13h6" />
        <path d="M10 17h4" />
      </>
    ),
    occupancy: (
      <>
        <path d="M5 20V9" />
        <path d="M12 20V4" />
        <path d="M19 20v-7" />
      </>
    ),
    rules: (
      <>
        <path d="M12 3 5 6v5c0 5 3.5 8 7 10 3.5-2 7-5 7-10V6z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export function RegistrationNav() {
  const pathname = usePathname();
  const { inGymCount, unseenNotesCount } = usePrivateNavBadges();

  return (
    <>
      <p className="px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
        Registration menu
      </p>
      <nav
        aria-label="Registration navigation"
        className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0"
      >
        {registrationLinks.map((link) => {
          const active =
            link.href === "/registration"
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 min-w-max items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out active:translate-y-px lg:min-w-0 ${
                active
                  ? "bg-brand text-white shadow-sm shadow-brand/20"
                  : "text-secondary hover:bg-soft-blue hover:text-primary-active"
              }`}
              href={link.href}
              key={link.href}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                  active ? "bg-white/15 text-white" : "bg-page text-secondary"
                }`}
              >
                <RegistrationIcon className="size-4" name={link.icon} />
              </span>
              <span className="min-w-0 truncate">{link.label}</span>
              {link.href === "/registration/in-gym" ? (
                <PrivateNavBadge count={inGymCount} showZero />
              ) : link.href === "/registration/notes" ? (
                <PrivateNavBadge count={unseenNotesCount} />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
