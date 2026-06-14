import type { HTMLAttributes, ReactNode } from "react";

type Status =
  | "low"
  | "medium"
  | "high"
  | "inGym"
  | "notInGym"
  | "expired"
  | "closeToExpiry"
  | "active";

const dotClasses: Record<Status, string> = {
  low: "bg-status-low",
  medium: "bg-status-medium",
  high: "bg-status-high",
  inGym: "bg-status-in-gym",
  notInGym: "bg-status-not-in-gym",
  expired: "bg-status-expired",
  closeToExpiry: "bg-status-close-to-expiry",
  active: "bg-status-active",
};

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  status: Status;
};

export function StatusBadge({
  children,
  className = "",
  status,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-[background-color,border-color,color,opacity] duration-200 ease-out ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`size-2.5 rounded-full ${dotClasses[status]}`}
      />
      {children}
    </span>
  );
}
