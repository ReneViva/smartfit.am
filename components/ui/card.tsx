import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
