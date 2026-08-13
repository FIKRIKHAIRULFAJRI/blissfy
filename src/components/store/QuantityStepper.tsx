"use client";

import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  id?: string;
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function QuantityStepper({
  disabled = false,
  id,
  max,
  min = 1,
  onChange,
  value,
}: QuantityStepperProps) {
  const safeMax = Math.max(min, max);

  return (
    <div className="inline-flex min-h-11 overflow-hidden rounded-[var(--radius-pill)] border border-border bg-surface">
      <button
        aria-label="Kurangi jumlah"
        className="grid min-w-11 place-items-center text-lg font-semibold text-ink hover:bg-surface-muted disabled:text-ink-muted"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        type="button"
      >
        -
      </button>
      <input
        aria-label="Jumlah"
        className={cn(
          "w-14 border-x border-border bg-surface text-center text-sm font-semibold text-ink outline-none",
          "focus:bg-surface-muted",
        )}
        disabled={disabled}
        id={id}
        inputMode="numeric"
        max={safeMax}
        min={min}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) {
            onChange(Math.min(safeMax, Math.max(min, nextValue)));
          }
        }}
        type="number"
        value={value}
      />
      <button
        aria-label="Tambah jumlah"
        className="grid min-w-11 place-items-center text-lg font-semibold text-ink hover:bg-surface-muted disabled:text-ink-muted"
        disabled={disabled || value >= safeMax}
        onClick={() => onChange(Math.min(safeMax, value + 1))}
        type="button"
      >
        +
      </button>
    </div>
  );
}
