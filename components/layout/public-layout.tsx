import type { ReactNode } from "react";
import Link from "next/link";

import { SmartfitLogo } from "../brand/smartfit-logo";

type PublicLayoutProps = {
  children: ReactNode;
};

const publicLinks = [
  { href: "/about", label: "About" },
  { href: "/coaches", label: "Coaches" },
  { href: "/packages", label: "Packages" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            aria-label="Smartfit.am home"
            className="block"
            href="/"
          >
            <SmartfitLogo className="h-11 w-auto max-w-40 object-contain" />
          </Link>

          <nav
            aria-label="Public navigation"
            className="order-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-secondary md:order-2 md:w-auto"
          >
            {publicLinks.map((link) => (
              <Link
                className="transition-colors hover:text-brand"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            className="order-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover md:order-3"
            href="/our-app"
          >
            Our App
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-secondary sm:px-8">
          <span>Smartfit.am</span>
          <Link className="font-semibold text-brand" href="/contact">
            Contact us
          </Link>
        </div>
      </footer>
    </div>
  );
}
