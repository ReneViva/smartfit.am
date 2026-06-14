import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/content", label: "Public Content" },
  { href: "/admin/coaches", label: "Coaches" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/notes", label: "Notes" },
  { href: "/admin/logs", label: "Logs" },
  { href: "/admin/data", label: "Data / Exports" },
  { href: "/admin/analytics", label: "Analytics" },
];

export function AdminNav() {
  return (
    <>
      <p className="px-3 text-xs font-bold uppercase tracking-[0.16em] text-muted">
        Admin menu
      </p>
      <nav aria-label="Admin navigation" className="mt-2 space-y-1">
        {adminLinks.map((link) => (
          <Link
            className="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-soft-blue hover:text-primary-active"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
