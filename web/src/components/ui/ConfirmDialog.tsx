"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./Dialog";
import Button, { BUTTON_BASE_CLASSES, BUTTON_SIZE_CLASSES } from "./Button";
import Spinner from "./Spinner";
import { cn } from "@/lib/cn";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  isConfirming?: boolean;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "default",
  isConfirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Cancel
          </Button>
          {variant === "danger" ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className={cn(
                BUTTON_BASE_CLASSES,
                BUTTON_SIZE_CLASSES.md,
                "bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-600",
              )}
            >
              {isConfirming && <Spinner size={16} />}
              {confirmLabel}
            </button>
          ) : (
            <Button variant="primary" onClick={onConfirm} isLoading={isConfirming}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
