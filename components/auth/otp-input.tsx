"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";

import { cn } from "@/lib/utils";

type Props = {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  className,
}: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value
    .replace(/\D/g, "")
    .slice(0, length)
    .padEnd(length, " ")
    .split("")
    .map((c) => (c === " " ? "" : c));

  const focusIx = Math.min(value.replace(/\D/g, "").length, length - 1);

  useEffect(() => {
    inputs.current[focusIx]?.focus();
  }, [focusIx, length]);

  const setAt = useCallback(
    (i: number, d: string) => {
      const raw = value.replace(/\D/g, "").split("");
      raw[i] = d;
      onChange(raw.join("").replace(/\s/g, "").slice(0, length));
    },
    [length, onChange, value],
  );

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        setAt(i, "");
      } else if (i > 0) {
        setAt(i - 1, "");
        inputs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(t);
  };

  return (
    <div className={cn("flex justify-center gap-2 sm:gap-3", className)}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          maxLength={1}
          value={d}
          onPaste={onPaste}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g "");
            if (!next) {
              setAt(i, "");
              return;
            }
            setAt(i, next.slice(-1));
            if (next.length > 1) {
              onChange(
                (value.replace(/\D/g, "").slice(0, i) + next).slice(0, length),
              );
            } else if (i < length - 1) {
              inputs.current[i + 1]?.focus();
            }
          }}
          onKeyDown={(e) => onKeyDown(i, e)}
          className={cn(
            "h-12 w-10 rounded-xl border text-center font-mono text-lg text-white outline-none transition-all sm:h-14 sm:w-12 sm:text-xl",
            d
              ? "border-[#00E676]/60 bg-[#00E676]/10 shadow-[0_0_16px_rgba(0,230,118,0.15)]"
              : "border-white/15 bg-white/5",
            "focus:border-[#00E676] focus:ring-2 focus:ring-[#00E676]/30",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
