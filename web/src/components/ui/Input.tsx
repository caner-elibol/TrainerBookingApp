import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border bg-white px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        invalid
          ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
          : "border-border-default focus:border-ink focus:ring-ink/15",
        className,
      )}
      {...props}
    />
  );
});

export default Input;
