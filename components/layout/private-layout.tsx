import type { ReactNode } from "react";
import Link from "next/link";

import { SmartfitLogo } from "../brand/smartfit-logo";
import { ThemeToggle } from "../public/theme-toggle";

type PrivateLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  navigation?: ReactNode;
  sidebarFooter?: ReactNode;
  title: string;
};

export function PrivateLayout({
  actions,
  children,
  description,
  navigation,
  sidebarFooter,
  title,
}: PrivateLayoutProps) {
  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="border-b border-border bg-card px-5 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:border-r lg:border-b-0 lg:px-6 lg:py-6">
        <Link
          aria-label="Smartfit.am home"
          className="block w-fit lg:shrink-0"
          href="/"
        >
          <SmartfitLogo className="h-12 w-auto max-w-44 object-contain" />
        </Link>

        <div className="mt-6 rounded-xl bg-soft-blue px-4 py-3 lg:shrink-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-active">
            Private workspace
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
        </div>

        {navigation ? (
          <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:mt-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-0 lg:pb-0 lg:pr-1">
            {navigation}
          </div>
        ) : null}

        {sidebarFooter ? (
          <div className="mt-4 lg:mt-5 lg:shrink-0">{sidebarFooter}</div>
        ) : null}
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
              Smartfit.am workspace
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {description ? (
              <div className="rounded-xl border border-border bg-page px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Staff account
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {description}
                </p>
              </div>
            ) : null}
            <ThemeToggle />
            {actions}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[100rem] p-5 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
