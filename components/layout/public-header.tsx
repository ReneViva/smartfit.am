"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SmartfitLogo } from "../brand/smartfit-logo";
import { ThemeToggle } from "../public/theme-toggle";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/coaches", label: "Coaches" },
  { href: "/packages", label: "Packages" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/our-app", label: "Our App" },
];

function isActiveLink(pathname: string, href: string) {
  return href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur"
      ref={headerRef}
    >
      <div className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            aria-label="Smartfit.am home"
            className="mr-auto block shrink-0 rounded-lg bg-logo-surface px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            href="/"
            onClick={() => setMenuOpen(false)}
          >
            <SmartfitLogo className="h-10 w-auto max-w-36 object-contain" />
          </Link>

          <nav
            aria-label="Public navigation"
            className="ml-auto hidden items-center gap-1 text-sm font-semibold lg:flex"
          >
            {publicLinks.map((link) => {
              const active = isActiveLink(pathname, link.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3 py-2 transition-[background-color,color,transform] hover:-translate-y-0.5 hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transform-none ${
                    active
                      ? "bg-soft-blue text-primary-active shadow-sm"
                      : "text-secondary"
                  }`}
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />

          <button
            aria-controls="public-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transform-none lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            {menuOpen ? (
              <svg
                aria-hidden="true"
                className="size-5 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
              >
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="size-5 fill-none stroke-current stroke-2"
                viewBox="0 0 24 24"
              >
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        <div
          aria-hidden={!menuOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none lg:hidden ${
            menuOpen
              ? "grid-rows-[1fr] translate-y-0 opacity-100"
              : "pointer-events-none grid-rows-[0fr] -translate-y-2 opacity-0"
          }`}
          id="public-mobile-menu"
        >
          <div className="min-h-0">
            <nav
              aria-label="Mobile public navigation"
              className="mt-3 grid gap-1 rounded-2xl border border-border bg-card p-2 shadow-xl"
            >
              {publicLinks.map((link) => {
                const active = isActiveLink(pathname, link.href);
                const appLink = link.href === "/our-app";

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-[background-color,color,transform] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transform-none ${
                      appLink
                        ? "mt-1 justify-center bg-brand text-white shadow-sm hover:bg-primary-hover"
                        : active
                          ? "bg-soft-blue text-primary-active"
                          : "text-secondary hover:bg-soft-blue hover:text-brand"
                    } ${appLink && active ? "ring-2 ring-primary-active ring-offset-2 ring-offset-card" : ""}`}
                    href={link.href}
                    key={link.href}
                    onClick={() => setMenuOpen(false)}
                    tabIndex={menuOpen ? undefined : -1}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
