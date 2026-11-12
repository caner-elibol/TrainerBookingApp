"use client";

import { useCallback, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { PHONE_INVALID_MESSAGE, PHONE_PLACEHOLDER, groupPhoneDigits, isCompletePhone, parsePhoneInput } from "@/lib/phone";

export function usePhoneInput(value: string, onValueChange: (value: string) => void) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const raw = input.value;
      const parsed = parsePhoneInput(raw);
      if (!parsed.acceptable) return;

      const next = groupPhoneDigits(parsed.digits);
      onValueChange(next);

      const caret = input.selectionStart ?? raw.length;
      const digitsBeforeCaret = Math.max(
        0,
        Math.min(raw.slice(0, caret).replace(/\D/g, "").length - parsed.droppedPrefixDigits, parsed.digits.length),
      );
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el || document.activeElement !== el) return;
        let pos = 0;
        let seen = 0;
        while (pos < next.length && seen < digitsBeforeCaret) {
          if (/\d/.test(next[pos])) seen++;
          pos++;
        }
        el.setSelectionRange(pos, pos);
      });
    },
    [onValueChange],
  );

  return {
    ref: inputRef,
    type: "tel" as const,
    inputMode: "numeric" as const,
    autoComplete: "tel-national",
    placeholder: PHONE_PLACEHOLDER,
    value,
    onChange,
  };
}

export interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> {
  value: string;
  onValueChange: (value: string) => void;
  invalid?: boolean;
}

export default function PhoneInput({ value, onValueChange, invalid, className, onBlur, ...rest }: PhoneInputProps) {
  const phoneProps = usePhoneInput(value, onValueChange);
  const [touched, setTouched] = useState(false);
  const showError = invalid || (touched && value.trim() !== "" && !isCompletePhone(value));

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-secondary">
          +90
        </span>
        <Input
          {...rest}
          {...phoneProps}
          invalid={showError}
          aria-invalid={showError || undefined}
          onBlur={(e) => {
            setTouched(true);
            onBlur?.(e);
          }}
          className={cn("pl-12", className)}
        />
      </div>
      {showError && <p className="mt-1 text-xs text-error-700">{PHONE_INVALID_MESSAGE}</p>}
    </div>
  );
}
