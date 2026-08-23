import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export function HeroCampaign() {
  return (
    <section className="container-page pt-6">
      <div className="relative isolate min-h-[620px] overflow-hidden rounded-[var(--radius-xl)] bg-olive text-surface md:min-h-[700px] lg:min-h-[720px]">
        <div
          aria-hidden
          className="absolute inset-0 bg-ink/50"
        />
        <div aria-hidden className="absolute inset-4 rounded-[1.4rem] border border-surface/20" />
        <div
          aria-hidden
          className="absolute bottom-0 right-0 h-[68%] w-[72%] rounded-tl-[8rem] bg-surface/18 md:h-[78%] md:w-[56%]"
        />
        <div
          aria-hidden
          className="absolute bottom-0 right-[8%] h-[76%] w-[34%] rounded-t-full bg-surface/28"
        />
        <div
          aria-hidden
          className="absolute bottom-0 right-[18%] h-[48%] w-[34%] rounded-t-[5rem] bg-ink/18"
        />
        <div className="relative z-10 flex min-h-[620px] flex-col justify-between p-6 md:min-h-[700px] md:p-10 lg:min-h-[720px] lg:p-12">
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase leading-tight text-surface/85">
              Koleksi esensial Blissfy.co
            </p>
            <p className="mt-4 text-base leading-7 text-surface/80">
              Pilihan esensial untuk bergerak dengan percaya diri setiap hari.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <Link
              className={buttonClasses({
                className: "w-fit bg-surface text-ink hover:bg-surface-muted",
                size: "large",
                variant: "primary",
              })}
              href="#koleksi"
            >
              Belanja sekarang
            </Link>
            <h1 className="text-display-xl max-w-4xl text-balance">
              Temukan nyaman dalam setiap gaya.
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
