function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-neutral ${className}`}
    />
  );
}

function SkeletonCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-4 h-6 w-3/5" />
      <SkeletonBlock className="mt-3 h-3 w-full" />
      <SkeletonBlock className="mt-2 h-3 w-4/5" />
      {compact ? null : (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
          <SkeletonBlock className="h-10" />
        </div>
      )}
    </div>
  );
}

export function PrivateRouteSkeleton({
  label = "Loading workspace",
}: {
  label?: string;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {label}
        </p>
        <SkeletonBlock className="mt-3 h-9 max-w-md" />
        <SkeletonBlock className="mt-4 h-4 max-w-3xl" />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            key={index}
          >
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-5 h-8 w-20" />
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <SkeletonBlock className="h-5 w-36" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
          <SkeletonBlock className="h-12" />
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard compact />
        <SkeletonCard compact />
      </section>
    </div>
  );
}

export function PublicRouteSkeleton({
  label = "Loading Smartfit.am",
  variant = "standard",
}: {
  label?: string;
  variant?: "app" | "catalog" | "standard";
}) {
  const cardCount = variant === "app" ? 3 : variant === "catalog" ? 6 : 4;

  return (
    <div aria-busy="true" aria-live="polite" className="min-h-screen bg-page">
      <div className="border-b border-border bg-card px-5 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4">
          <SkeletonBlock className="h-12 w-36 rounded-xl" />
          <div className="hidden gap-2 sm:flex">
            <SkeletonBlock className="h-10 w-20 rounded-full" />
            <SkeletonBlock className="h-10 w-20 rounded-full" />
            <SkeletonBlock className="h-10 w-20 rounded-full" />
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[90rem] px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {label}
        </p>
        <SkeletonBlock className="mt-4 h-12 max-w-2xl" />
        <SkeletonBlock className="mt-5 h-4 max-w-3xl" />
        <SkeletonBlock className="mt-3 h-4 max-w-xl" />

        {variant === "catalog" ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-12" />
            </div>
          </div>
        ) : null}

        {variant === "app" ? (
          <section className="mt-10 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <SkeletonBlock className="mx-auto size-32 rounded-full" />
            <SkeletonBlock className="mx-auto mt-6 h-8 max-w-xs" />
            <SkeletonBlock className="mx-auto mt-3 h-4 max-w-md" />
          </section>
        ) : null}

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cardCount }).map((_, index) => (
            <SkeletonCard compact={variant === "app"} key={index} />
          ))}
        </section>
      </main>
    </div>
  );
}
