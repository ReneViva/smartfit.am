import type { ReactNode } from "react";

type AdminExpandableCardProps = {
  children: ReactNode;
  className?: string;
  summary: ReactNode;
};

export function AdminExpandableCard({
  children,
  className = "",
  summary,
}: AdminExpandableCardProps) {
  return (
    <details
      className={`group min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand hover:shadow-lg open:translate-y-0 open:border-brand open:shadow-lg motion-reduce:transform-none ${className}`}
    >
      <summary className="cursor-pointer list-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
        {summary}
        <span className="flex min-h-11 items-center justify-between gap-3 border-t border-border bg-neutral px-5 py-3 text-sm font-semibold text-foreground transition-colors group-hover:bg-soft-blue group-open:bg-soft-blue">
          <span>
            <span className="group-open:hidden">Open details / Edit</span>
            <span className="hidden group-open:inline">Collapse editor</span>
          </span>
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 fill-none stroke-current stroke-2 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="animate-panel-in border-t border-border bg-page p-5 sm:p-6">
        {children}
      </div>
    </details>
  );
}
