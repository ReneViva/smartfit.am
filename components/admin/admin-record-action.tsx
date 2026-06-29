"use client";

import { type ReactNode } from "react";

import { Button } from "../ui/button";

type ActionVariant = "primary" | "success" | "warning" | "danger" | "neutral";
type ServerAction = (formData: FormData) => void | Promise<void>;

export function AdminRecordAction({
  action,
  children,
  className = "",
  confirmMessage,
  fields,
  pendingLabel,
  variant = "neutral",
}: {
  action: ServerAction;
  children: ReactNode;
  className?: string;
  confirmMessage: string;
  fields: Record<string, string>;
  pendingLabel: ReactNode;
  variant?: ActionVariant;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}
      <Button pendingLabel={pendingLabel} type="submit" variant={variant}>
        {children}
      </Button>
    </form>
  );
}
