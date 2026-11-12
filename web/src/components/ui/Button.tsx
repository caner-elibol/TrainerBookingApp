import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import Spinner from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export const BUTTON_BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover focus-visible:ring-ink",
  secondary: "bg-primary text-white hover:bg-primary-hover focus-visible:ring-ink",
  outline:
    "bg-white text-foreground border border-border-strong hover:bg-surface-muted focus-visible:ring-ink",
  ghost: "bg-transparent text-foreground hover:bg-surface-muted focus-visible:ring-ink",
  danger:
    "bg-error-50 text-error-600 border border-error-100 hover:bg-error-100 focus-visible:ring-error-600",
};

export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md"): string {
  return cn(BUTTON_BASE_CLASSES, VARIANT_CLASSES[variant], BUTTON_SIZE_CLASSES[size]);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", isLoading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonClasses(variant, size), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size={size === "lg" ? 18 : 16} />}
      {children}
    </button>
  );
});

export default Button;
