import type { ButtonHTMLAttributes } from "react";

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
  variant?: ButtonVariant;
};

export function Button({
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-200 ease-out active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none ${variantClasses[variant]} ${className}`}
      type={type}
      {...props}
    />
  );
}
