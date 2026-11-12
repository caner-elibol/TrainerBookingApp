import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
}

export default function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn("flex w-full items-center", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.label} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  isCurrent && "bg-primary text-white",
                  isCompleted && "bg-subtle-strong text-ink",
                  !isCurrent && !isCompleted && "bg-surface-muted text-ink-muted",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
              </span>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isCurrent ? "text-foreground" : "text-ink-muted",
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn("mx-2 h-0.5 flex-1", isCompleted ? "bg-neutral-400" : "bg-border-default")}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
