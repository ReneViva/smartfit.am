"use client";

import {
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { useFormStatus } from "react-dom";

type ButtonVariant = "primary" | "success" | "warning" | "danger" | "neutral";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-primary-hover active:bg-primary-active",
  success:
    "bg-button-success text-white hover:bg-button-success-hover active:bg-button-success-hover",
  warning:
    "bg-button-warning text-foreground hover:bg-button-warning-hover active:bg-button-warning-hover",
  danger:
    "bg-button-danger text-white hover:bg-button-danger-hover active:bg-button-danger-hover",
  neutral:
    "bg-neutral text-foreground hover:bg-neutral-hover active:bg-neutral-hover",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isPending?: boolean;
  pendingLabel?: ReactNode;
  showPendingIndicator?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = "",
  disabled,
  isPending: isExternallyPending = false,
  onClick,
  pendingLabel,
  showPendingIndicator = true,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const { pending: formPending } = useFormStatus();
  
  const submitLockRef = useRef(false);
  const resetTimerRef = useRef<number | null>(null);
  const isSubmit = type === "submit";
const isPending = isExternallyPending || (isSubmit && formPending);

useEffect(() => {
  if (formPending || isExternallyPending) {
    return;
  }

  if (resetTimerRef.current) {
    window.clearTimeout(resetTimerRef.current);
  }

  resetTimerRef.current = window.setTimeout(() => {
    submitLockRef.current = false;
  }, 700);

  return () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
  };
}, [formPending, isExternallyPending]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isSubmit && submitLockRef.current) {
      event.preventDefault();
      return;
    }

    onClick?.(event);

    if (!isSubmit || event.defaultPrevented || disabled) {
      return;
    }

    const form = event.currentTarget.form;

    if (form && !form.checkValidity()) {
      return;
    }

    submitLockRef.current = true;
  }

  return (
    <button
      aria-busy={isPending || undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 ease-out active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none ${variantClasses[variant]} ${className}`}
      disabled={disabled || isPending}
      onClick={handleClick}
      type={type}
      {...props}
    >
      <span className="inline-flex min-w-0 items-center justify-center gap-2">
        {isPending && showPendingIndicator ? (
          <span
            aria-hidden="true"
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent opacity-80"
          />
        ) : null}
        <span className="min-w-0">
          {isPending && pendingLabel ? pendingLabel : children}
        </span>
      </span>
    </button>
  );
}
