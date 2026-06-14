"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const registrationLinks = [
  { href: "/registration", label: "Customer Lookup" },
  { href: "/registration/in-gym", label: "Currently In Gym" },
  { href: "/registration/notes", label: "Notes" },
  { href: "/registration/occupancy", label: "Occupancy" },
  { href: "/registration/rules", label: "Reception Rules" },
];

export function RegistrationNav() {
  const pathname = usePathname();

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
              className={`flex min-h-11 min-w-max items-center rounded-xl px-3 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out active:translate-y-px lg:min-w-0 ${
                active
                  ? "bg-soft-blue text-primary-active"
                  : "text-secondary hover:bg-soft-blue hover:text-primary-active"
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
