import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, ...props },
  ref,
) {
  return (
    <textarea
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

export default Textarea;
