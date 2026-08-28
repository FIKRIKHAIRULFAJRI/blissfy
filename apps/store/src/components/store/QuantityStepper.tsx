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
    <div className="inline-grid min-h-11 grid-cols-[44px_44px_44px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
      <button
        aria-label="Kurangi jumlah"
        className="grid min-w-11 place-items-center text-lg font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-container)] disabled:text-[var(--color-disabled-text)]"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        type="button"
      >
        -
      </button>
      <input
        aria-label="Jumlah"
        className={cn(
          "w-11 border-x border-[var(--color-border)] bg-[var(--color-surface)] text-center text-sm font-medium text-[var(--color-text-primary)] outline-none",
          "focus:bg-[var(--color-surface-container)]",
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
        className="grid min-w-11 place-items-center text-lg font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-container)] disabled:text-[var(--color-disabled-text)]"
        disabled={disabled || value >= safeMax}
        onClick={() => onChange(Math.min(safeMax, value + 1))}
        type="button"
      >
        +
      </button>
    </div>
  );
}
