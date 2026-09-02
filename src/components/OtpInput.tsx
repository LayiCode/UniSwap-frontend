"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

const LENGTH = 6;

// One-digit-per-box OTP input. Exposes a single string `value`/`onChange`
// (the concatenated digits) so the rest of the app's API contract is
// unchanged. Auto-advances focus on typing, moves back on Backspace, only
// accepts digits, and fills all boxes on paste of a 6-digit code.
export default function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const inputs = useRef(Array.from({ length: LENGTH }, () => null as HTMLInputElement | null));

  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  function setDigits(next: string) {
    onChange(next.replace(/\D/g, "").slice(0, LENGTH));
  }

  function handleChange(i: number, raw: string) {
    const ch = raw.replace(/\D/g, "");
    if (!ch) return;
    const next = value.slice(0, i) + ch[0] + value.slice(i + 1);
    setDigits(next);
    // Move to the next empty box, or hold at the last one.
    const nextIndex = Math.min(i + 1, LENGTH - 1);
    inputs.current[nextIndex]?.focus();
    inputs.current[nextIndex]?.select();
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    // Backspace on an already-empty box moves focus back.
    if (e.key === "Backspace" && !value[i]) {
      e.preventDefault();
      const prev = Math.max(i - 1, 0);
      inputs.current[prev]?.focus();
      inputs.current[prev]?.select();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    setDigits(pasted);
    inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  return (
    <div className="mt-1 flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={2}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-10 sm:w-11 rounded-lg border border-neutral-300 bg-white text-center text-lg font-semibold text-neutral-900 outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:opacity-50"
        />
      ))}
    </div>
  );
}
