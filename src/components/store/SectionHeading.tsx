import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
};

export function SectionHeading({
  description,
  eyebrow,
  title,
}: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase leading-tight text-olive">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-heading-lg text-ink">{title}</h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">
          {description}
        </p>
      ) : null}
    </div>
  );
}
