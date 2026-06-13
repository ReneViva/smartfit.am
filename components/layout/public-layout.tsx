import type { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Smartfit<span className="text-brand">.am</span>
          </span>
          <span className="rounded-full bg-soft-blue px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-active">
            Design foundation
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-secondary sm:px-8">
          Smartfit.am project foundation
        </div>
      </footer>
    </div>
  );
}
