"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const BottomSheet = RadixDialog.Root;
export const BottomSheetTrigger = RadixDialog.Trigger;
export const BottomSheetClose = RadixDialog.Close;

export function BottomSheetContent({
  className,
  children,
  title,
  ...props
}: ComponentProps<typeof RadixDialog.Content> & { title?: ReactNode }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink/50" />
      <RadixDialog.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-card-hover focus:outline-none",
          "md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:w-[calc(100%-2rem)] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:p-6",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong md:hidden" aria-hidden="true" />
        {title && <RadixDialog.Title className="mb-3 text-base font-bold text-foreground">{title}</RadixDialog.Title>}
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
