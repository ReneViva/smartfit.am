import type { ReactNode } from "react";

type PrivateLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
};

export function PrivateLayout({
  actions,
  children,
  description,
  title,
}: PrivateLayoutProps) {
  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-border bg-card px-5 py-5 lg:border-r lg:border-b-0 lg:px-6">
        <p className="text-lg font-bold tracking-tight text-foreground">
          Smartfit<span className="text-brand">.am</span>
        </p>
        <p className="mt-1 text-sm text-secondary">Private workspace</p>
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-5 py-5 sm:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm text-secondary">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
